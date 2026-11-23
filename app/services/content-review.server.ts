/**
 * Content review: the one place that lists, edits and validates the information WeedHub
 * produces (strains, glossary, Mapa Verde, magazine). Used by the admin UI route
 * (routes/admin.revision.tsx) and by the admin AI agent (ai/actions/content-review.server.ts).
 *
 * Rules
 * - Every record carries `revision: { status, reviewedAt, reviewedBy, note }`.
 *   Missing = "pendiente".
 * - Only a human, through the admin UI, can approve or reject (`setRevisionStatus`).
 * - Any edit made by the agent sends the record back to "pendiente".
 * - Strain editorial notes are only public when their own status is "aprobado".
 */
import { generateText, CONTENT_MODEL } from "~/ai/generate.server";
import type { Model } from "mongoose";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { GlossaryTermModel } from "~/models/glossary-term.server";
import { LegalStatusModel } from "~/models/legal-status.server";
import { ArticleModel } from "~/models/article.server";
import { effectLabels } from "~/lib/effect-labels";

export type RevisionStatus = "pendiente" | "aprobado" | "rechazado";
export type Actor = "admin" | "agente";

type FieldKind = "text" | "longtext" | "list" | "number" | "select";
export interface FieldDef {
  path: string;
  label: string;
  kind: FieldKind;
  options?: string[];
}

interface CollectionDef {
  key: CollectionKey;
  label: string;
  model: Model<any>;
  titleField: string;
  publicPath: (doc: any) => string;
  baseFilter: Record<string, unknown>;
  sort: Record<string, 1 | -1>;
  fields: FieldDef[];
}

export type CollectionKey = "cepas" | "glosario" | "mapa-verde" | "articulos";

export const COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  cepas: {
    key: "cepas",
    label: "Cepas",
    model: StrainModel,
    titleField: "name",
    publicPath: (d) => `/strains/${d.slug}`,
    baseFilter: { isArchived: false },
    sort: { "seedSnapshot.reviewCount": -1, name: 1 },
    fields: [
      { path: "name", label: "Nombre", kind: "text" },
      { path: "type", label: "Tipo", kind: "select", options: ["sativa", "indica", "hybrid"] },
      { path: "typeBlend", label: "Mezcla (ej. Sativa dominante)", kind: "text" },
      { path: "lineage", label: "Linaje", kind: "text" },
      { path: "genetics.parent1", label: "Padre 1", kind: "text" },
      { path: "genetics.parent2", label: "Padre 2", kind: "text" },
      { path: "cannabinoidProfile.thc.max", label: "THC máx (%)", kind: "number" },
      { path: "cannabinoidProfile.cbd.max", label: "CBD máx (%)", kind: "number" },
      { path: "dominantTerpene", label: "Terpeno dominante", kind: "text" },
      { path: "effects", label: "Efectos (uno por línea)", kind: "list" },
      { path: "flavors", label: "Sabores (uno por línea)", kind: "list" },
      { path: "difficulty", label: "Dificultad de cultivo", kind: "select", options: ["Baja", "Moderada", "Alta"] },
      { path: "descriptionEs", label: "Descripción", kind: "longtext" },
      { path: "editorialNote.text", label: "Nota de la redacción", kind: "longtext" },
    ],
  },
  glosario: {
    key: "glosario",
    label: "Glosario",
    model: GlossaryTermModel,
    titleField: "term",
    publicPath: (d) => `/glosario/${d.slug}`,
    baseFilter: {},
    sort: { term: 1 },
    fields: [
      { path: "term", label: "Término", kind: "text" },
      { path: "definition", label: "Definición", kind: "longtext" },
      { path: "examples", label: "Ejemplos (uno por línea)", kind: "list" },
      { path: "isActive", label: "Publicado", kind: "select", options: ["true", "false"] },
    ],
  },
  "mapa-verde": {
    key: "mapa-verde",
    label: "Mapa Verde",
    model: LegalStatusModel,
    titleField: "countryNameEs",
    publicPath: (d) => `/mapa-verde/${String(d.countryCode).toLowerCase()}`,
    baseFilter: {},
    sort: { sortOrder: 1 },
    fields: [
      { path: "countryNameEs", label: "País", kind: "text" },
      { path: "nationalStatus", label: "Estatus nacional", kind: "select", options: ["legal-rec", "legal-med", "decriminalized", "partial", "illegal"] },
      { path: "summary", label: "Resumen (respuesta directa)", kind: "longtext" },
      { path: "whatYouCan", label: "Lo que puedes hacer (uno por línea)", kind: "list" },
      { path: "whatYouCant", label: "Lo que no puedes hacer (uno por línea)", kind: "list" },
      { path: "keyDate", label: "Fecha clave", kind: "text" },
      { path: "keyLaw", label: "Ley clave", kind: "text" },
    ],
  },
  articulos: {
    key: "articulos",
    label: "Magazine",
    model: ArticleModel,
    titleField: "title",
    publicPath: (d) => `/magazine/${d.slug}`,
    baseFilter: {},
    sort: { publishedAt: -1 },
    fields: [
      { path: "title", label: "Título", kind: "text" },
      { path: "excerpt", label: "Bajada", kind: "longtext" },
      { path: "body", label: "Cuerpo (markdown)", kind: "longtext" },
      { path: "metaTitle", label: "Título SEO", kind: "text" },
      { path: "metaDescription", label: "Descripción SEO", kind: "text" },
      { path: "status", label: "Estado", kind: "select", options: ["draft", "published", "archived"] },
    ],
  },
};

export function isCollectionKey(v: unknown): v is CollectionKey {
  return typeof v === "string" && v in COLLECTIONS;
}

function statusFilter(status?: RevisionStatus | "todos") {
  if (!status || status === "todos") return {};
  if (status === "pendiente") return { $or: [{ "revision.status": "pendiente" }, { "revision.status": { $exists: false } }] };
  return { "revision.status": status };
}

function get(obj: any, path: string) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** Counts per collection and status, for the dashboard and the agent. */
export async function reviewStats() {
  await connectDB();
  const out: Record<string, Record<RevisionStatus, number> & { total: number; notasPendientes?: number }> = {};
  for (const c of Object.values(COLLECTIONS)) {
    const [total, aprobado, rechazado] = await Promise.all([
      c.model.countDocuments(c.baseFilter),
      c.model.countDocuments({ ...c.baseFilter, "revision.status": "aprobado" }),
      c.model.countDocuments({ ...c.baseFilter, "revision.status": "rechazado" }),
    ]);
    out[c.key] = { total, aprobado, rechazado, pendiente: total - aprobado - rechazado };
  }
  out.cepas.notasPendientes = await StrainModel.countDocuments({ "editorialNote.status": "pendiente" });
  return out;
}

export async function listQueue(opts: { collection: CollectionKey; status?: RevisionStatus | "todos"; q?: string; page?: number; perPage?: number }) {
  await connectDB();
  const c = COLLECTIONS[opts.collection];
  const perPage = Math.min(opts.perPage ?? 30, 100);
  const page = Math.max(1, opts.page ?? 1);
  const filter: Record<string, unknown> = { ...c.baseFilter, ...statusFilter(opts.status) };
  if (opts.q) filter[c.titleField] = { $regex: opts.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const [items, total] = await Promise.all([
    c.model
      .find(filter)
      .sort(c.sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select(`${c.titleField} slug countryCode revision editorialNote.status`)
      .lean(),
    c.model.countDocuments(filter),
  ]);
  return {
    total,
    page,
    perPage,
    items: items.map((d: any) => ({
      id: String(d._id),
      title: String(d[c.titleField] ?? ""),
      status: (d.revision?.status ?? "pendiente") as RevisionStatus,
      reviewedAt: d.revision?.reviewedAt ? new Date(d.revision.reviewedAt).toISOString() : null,
      noteStatus: d.editorialNote?.status ?? null,
    })),
  };
}

export async function getRecord(collection: CollectionKey, id: string) {
  await connectDB();
  const c = COLLECTIONS[collection];
  const d: any = await c.model.findById(id).lean();
  if (!d) return null;
  return {
    id: String(d._id),
    collection,
    title: String(d[c.titleField] ?? ""),
    publicPath: c.publicPath(d),
    revision: {
      status: (d.revision?.status ?? "pendiente") as RevisionStatus,
      reviewedAt: d.revision?.reviewedAt ? new Date(d.revision.reviewedAt).toISOString() : null,
      reviewedBy: d.revision?.reviewedBy ?? null,
      note: d.revision?.note ?? "",
      lastEditedBy: d.revision?.lastEditedBy ?? null,
    },
    editorialNote: d.editorialNote ?? null,
    fields: c.fields.map((f) => {
      const v = get(d, f.path);
      return { ...f, value: f.kind === "list" ? (Array.isArray(v) ? v : []) : v ?? "" };
    }),
    // read-only context the reviewer (or the agent) can use to judge the record
    context:
      collection === "cepas"
        ? {
            terpenes: (d.terpenes ?? []).map((t: any) => `${t.name} ${t.percentage}%`),
            momento: d.momento ?? null,
            effectsEs: effectLabels(d.effects ?? []),
          }
        : collection === "mapa-verde"
          ? { sources: d.sources ?? [], lastReviewedAt: d.lastReviewedAt ?? null }
          : null,
  };
}

function coerce(f: FieldDef, raw: unknown) {
  if (f.kind === "list") {
    const arr = Array.isArray(raw) ? raw : String(raw ?? "").split("\n");
    return arr.map((x) => String(x).trim()).filter(Boolean);
  }
  if (f.kind === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  if (f.kind === "select" && (f.options ?? []).every((o) => o === "true" || o === "false")) return String(raw) === "true";
  return String(raw ?? "").trim();
}

/**
 * Update editable fields. Agent edits always send the record back to "pendiente";
 * an admin edit keeps the current status unless `approve` is set.
 */
export async function updateRecord(collection: CollectionKey, id: string, values: Record<string, unknown>, actor: Actor, by?: string) {
  await connectDB();
  const c = COLLECTIONS[collection];
  const $set: Record<string, unknown> = {};
  for (const f of c.fields) {
    if (!(f.path in values)) continue;
    if (f.kind === "select" && f.options && !f.options.includes(String(values[f.path]))) continue;
    $set[f.path] = coerce(f, values[f.path]);
  }
  if (!Object.keys($set).length) return { ok: false as const, error: "No hay campos válidos para actualizar" };
  $set["revision.lastEditedBy"] = actor === "agente" ? "agente IA" : by ?? "admin";
  $set["revision.lastEditedAt"] = new Date();
  if (actor === "agente") {
    $set["revision.status"] = "pendiente";
    if ("editorialNote.text" in $set) $set["editorialNote.status"] = "pendiente";
  }
  if (collection === "mapa-verde" && actor === "admin") $set.lastReviewedAt = new Date();
  await c.model.updateOne({ _id: id }, { $set });
  return { ok: true as const, updated: Object.keys($set).filter((k) => !k.startsWith("revision.")) };
}

/** Human-only: called from the admin route, never exposed to the agent. */
export async function setRevisionStatus(collection: CollectionKey, id: string, status: RevisionStatus, by: string, note = "") {
  await connectDB();
  const c = COLLECTIONS[collection];
  const $set: Record<string, unknown> = {
    "revision.status": status,
    "revision.reviewedAt": new Date(),
    "revision.reviewedBy": by,
    "revision.note": note,
  };
  if (collection === "mapa-verde" && status === "aprobado") $set.lastReviewedAt = new Date();
  await c.model.updateOne({ _id: id }, { $set });
  return { ok: true as const };
}

/** Human-only: approve/reject the public editorial note of a strain. */
export async function setEditorialNoteStatus(id: string, status: RevisionStatus, by: string) {
  await connectDB();
  await StrainModel.updateOne({ _id: id }, { $set: { "editorialNote.status": status, "editorialNote.reviewedAt": new Date(), "editorialNote.reviewedBy": by } });
  return { ok: true as const };
}

/** Next record waiting for review after `afterId` (keeps the reviewer moving one by one). */
export async function nextPending(collection: CollectionKey, afterTitle?: string) {
  await connectDB();
  const c = COLLECTIONS[collection];
  const filter: Record<string, unknown> = { ...c.baseFilter, ...statusFilter("pendiente") };
  const d: any = await c.model.findOne(filter).sort(c.sort).select("_id").lean();
  return d ? String(d._id) : null;
}

/** Strains with gaps, for the agent to prioritise data work. */
export async function incompleteStrains(limit = 20) {
  await connectDB();
  const rows = await StrainModel.find({
    isArchived: false,
    $or: [
      { "cannabinoidProfile.thc.max": { $in: [0, null] } },
      { "terpenes.0": { $exists: false } },
      { descriptionEs: { $in: ["", null] } },
      { "genetics.parent1": { $in: ["", null] } },
    ],
  })
    .sort({ "seedSnapshot.reviewCount": -1, name: 1 })
    .limit(Math.min(limit, 100))
    .select("name slug cannabinoidProfile terpenes descriptionEs genetics")
    .lean();
  return rows.map((s: any) => ({
    id: String(s._id),
    name: s.name,
    slug: s.slug,
    missing: [
      !(s.cannabinoidProfile?.thc?.max > 0) && "THC",
      !s.terpenes?.length && "terpenos",
      !s.descriptionEs && "descripción",
      !s.genetics?.parent1 && "genética",
    ].filter(Boolean),
  }));
}

// ---------------------------------------------------------------------------
// Editorial notes ("Nota de la redacción"): a short, data-only summary written by Claude.
// ---------------------------------------------------------------------------

const NOTE_SYSTEM = `Eres la redacción de WeedHub, una enciclopedia de cannabis en español para personas adultas en América Latina.
Escribes la "Nota de la redacción" de una ficha de cepa: 2 o 3 oraciones, entre 40 y 70 palabras.

Reglas:
- Usa solo los datos que recibes. No inventes cifras, sabores, efectos, historia ni origen.
- Si falta un dato, no lo menciones.
- Nada de afirmaciones médicas: no digas que trata, cura o ayuda con condiciones de salud.
- No recomiendes consumir. Puedes decir para qué momento suele elegirse según los datos.
- Tono cercano y claro, español latino neutro, voz de "tú". Sin exageraciones, sin signos de exclamación, sin emojis.
- Devuelve solo el texto de la nota, sin título ni comillas.`;

export async function generateEditorialNote(strainId: string) {
  await connectDB();
  const s: any = await StrainModel.findById(strainId).lean();
  if (!s) return { ok: false as const, error: "Cepa no encontrada" };

  const data = {
    nombre: s.name,
    tipo: s.type,
    mezcla: s.typeBlend || undefined,
    padres: [s.genetics?.parent1, s.genetics?.parent2].filter(Boolean),
    thcMax: s.cannabinoidProfile?.thc?.max || undefined,
    cbdMax: s.cannabinoidProfile?.cbd?.max || undefined,
    terpenos: (s.terpenes ?? []).slice(0, 4).map((t: any) => t.name),
    efectos: effectLabels(s.effects ?? []).slice(0, 5),
    sabores: (s.flavors ?? []).slice(0, 4),
    momentoDelDia: s.momento ?? undefined,
    descripcionExistente: s.descriptionEs || undefined,
  };

  const r = await generateText({ system: NOTE_SYSTEM, prompt: `Datos de la cepa (JSON):\n${JSON.stringify(data)}`, maxTokens: 4000 });
  if (!r.ok) return r;
  const text = r.text;
  if (!text) return { ok: false as const, error: "Respuesta vacía" };

  await StrainModel.updateOne(
    { _id: s._id },
    { $set: { editorialNote: { text, status: "pendiente", generatedAt: new Date(), model: CONTENT_MODEL } } }
  );
  return { ok: true as const, text };
}
