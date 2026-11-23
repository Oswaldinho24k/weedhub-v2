/** Mapa Verde (legal status by country) service: pure data logic. Used by routes/admin.legal-status.tsx and ai/actions/legal-status.server.ts. */
import { connectDB } from "~/lib/db.server";
import {
  LegalStatusModel,
  type LegalStatusType,
  type LegalRegion,
  type ILegalStatusState,
  type ILegalStatusSource,
} from "~/models/legal-status.server";

export const LEGAL_STATUSES: LegalStatusType[] = ["legal-rec", "legal-med", "decriminalized", "partial", "illegal"];
export const LEGAL_REGIONS: LegalRegion[] = ["mexico", "latam-central", "latam-south", "latam-caribe", "europe", "north-america", "other"];
/** A country whose lastReviewedAt is older than this is flagged as stale in the review checklist. */
export const STALE_AFTER_DAYS = 180;

type Actor = "admin" | "agente";

export interface CountryInput {
  countryCode?: string;
  countryName?: string;
  countryNameEs?: string;
  flag?: string;
  region?: string;
  nationalStatus?: string;
  summary?: string;
  whatYouCan?: string[] | string;
  whatYouCant?: string[] | string;
  keyDate?: string;
  keyLaw?: string;
  states?: ILegalStatusState[];
  sources?: ILegalStatusSource[];
}

const toLines = (v: unknown) =>
  (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((s) => String(s).trim()).filter(Boolean);

const isStatus = (v: unknown): v is LegalStatusType => LEGAL_STATUSES.includes(v as LegalStatusType);

const byIdOrCode = (idOrCode: string) =>
  /^[a-f0-9]{24}$/.test(idOrCode) ? { _id: idOrCode } : { countryCode: idOrCode.toUpperCase().trim() };

export async function listCountries(opts: { region?: string; status?: string; active?: boolean } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (opts.region && LEGAL_REGIONS.includes(opts.region as LegalRegion)) filter.region = opts.region;
  if (isStatus(opts.status)) filter.nationalStatus = opts.status;
  if (typeof opts.active === "boolean") filter.isActive = opts.active;
  return LegalStatusModel.find(filter).sort({ sortOrder: 1, countryNameEs: 1 }).lean();
}

/** Accepts the Mongo id or the ISO country code (e.g. "MX"). */
export async function getCountry(idOrCode: string) {
  await connectDB();
  return LegalStatusModel.findOne(byIdOrCode(idOrCode)).lean();
}

export async function createCountry(input: CountryInput, opts: { actor: Actor; by?: string }) {
  await connectDB();
  const countryCode = String(input.countryCode ?? "").toUpperCase().trim();
  const countryNameEs = String(input.countryNameEs ?? "").trim();
  const summary = String(input.summary ?? "").trim();
  if (!/^[A-Z]{2}$/.test(countryCode)) return { ok: false as const, error: "El código de país (ISO, 2 letras) es obligatorio" };
  if (!countryNameEs) return { ok: false as const, error: "El nombre en español es obligatorio" };
  if (!summary) return { ok: false as const, error: "El resumen es obligatorio" };
  if (await LegalStatusModel.exists({ countryCode })) return { ok: false as const, error: `El país "${countryCode}" ya existe` };
  const agent = opts.actor === "agente";
  const doc = await LegalStatusModel.create({
    countryCode,
    countryName: String(input.countryName ?? "").trim() || countryNameEs,
    countryNameEs,
    flag: String(input.flag ?? "").trim() || "🏳️",
    region: LEGAL_REGIONS.includes(input.region as LegalRegion) ? input.region : "other",
    nationalStatus: isStatus(input.nationalStatus) ? input.nationalStatus : "illegal",
    summary,
    whatYouCan: toLines(input.whatYouCan),
    whatYouCant: toLines(input.whatYouCant),
    keyDate: String(input.keyDate ?? "").trim() || undefined,
    keyLaw: String(input.keyLaw ?? "").trim() || undefined,
    states: input.states ?? [],
    sources: input.sources ?? [],
    // Agent-created countries start hidden; a person verifies and shows them.
    isActive: !agent,
    // Only a human review counts as "reviewed"; agent drafts start as never reviewed.
    lastReviewedAt: agent ? new Date(0) : new Date(),
    revision: {
      ...(agent ? { status: "pendiente" } : {}),
      lastEditedBy: agent ? "agente IA" : opts.by ?? "admin",
      lastEditedAt: new Date(),
    },
  });
  return { ok: true as const, id: String(doc._id), countryCode };
}

/**
 * Partial update of a country's legal content. Admin edits count as a human review
 * (lastReviewedAt = now, as before). Agent edits go back to "pendiente" and do NOT
 * touch lastReviewedAt, since nobody has verified them yet.
 */
export async function updateCountry(id: string, input: CountryInput, actor: Actor, by?: string) {
  await connectDB();
  const $set: Record<string, unknown> = {};
  if (input.nationalStatus != null) {
    if (!isStatus(input.nationalStatus)) return { ok: false as const, error: `Estatus inválido: ${input.nationalStatus}` };
    $set.nationalStatus = input.nationalStatus;
  }
  if (input.summary != null) {
    const summary = String(input.summary).trim();
    if (!summary) return { ok: false as const, error: "El resumen no puede quedar vacío" };
    $set.summary = summary;
  }
  if (input.countryNameEs != null && String(input.countryNameEs).trim()) $set.countryNameEs = String(input.countryNameEs).trim();
  if (input.countryName != null && String(input.countryName).trim()) $set.countryName = String(input.countryName).trim();
  if (input.flag != null && String(input.flag).trim()) $set.flag = String(input.flag).trim();
  if (input.region != null && LEGAL_REGIONS.includes(input.region as LegalRegion)) $set.region = input.region;
  if (input.whatYouCan != null) $set.whatYouCan = toLines(input.whatYouCan);
  if (input.whatYouCant != null) $set.whatYouCant = toLines(input.whatYouCant);
  if (input.keyDate != null) $set.keyDate = String(input.keyDate).trim();
  if (input.keyLaw != null) $set.keyLaw = String(input.keyLaw).trim();
  if (input.states != null) {
    if (input.states.some((s) => !s?.nameEs || !isStatus(s.status))) return { ok: false as const, error: "Cada estado necesita nameEs y un estatus válido" };
    $set.states = input.states.map((s) => ({ ...s, name: s.name || s.nameEs }));
  }
  if (input.sources != null) {
    if (input.sources.some((s) => !s?.label)) return { ok: false as const, error: "Cada fuente necesita label" };
    $set.sources = input.sources;
  }
  if (!Object.keys($set).length) return { ok: false as const, error: "Nada que actualizar" };
  $set["revision.lastEditedBy"] = actor === "agente" ? "agente IA" : by ?? "admin";
  $set["revision.lastEditedAt"] = new Date();
  if (actor === "agente") $set["revision.status"] = "pendiente";
  else $set.lastReviewedAt = new Date();
  const r = await LegalStatusModel.updateOne({ _id: id }, { $set });
  return r.matchedCount ? { ok: true as const } : { ok: false as const, error: "País no encontrado" };
}

/** Shows or hides a country on /mapa-verde. Without `active`, toggles. */
export async function setCountryActive(id: string, active?: boolean) {
  await connectDB();
  const c = await LegalStatusModel.findById(id);
  if (!c) return { ok: false as const, error: "País no encontrado" };
  c.isActive = typeof active === "boolean" ? active : !c.isActive;
  await c.save();
  return { ok: true as const, isActive: c.isActive };
}

export interface ChecklistItem {
  field: string;
  issue: string;
}

/**
 * What a person should verify for one country, built only from the record's own fields
 * (no external lookups, no AI): stale review date, missing sources, empty can/can't lists,
 * sub-national states without notes, plus the core claims to double-check.
 */
export async function reviewChecklist(idOrCode: string, opts: { staleAfterDays?: number; now?: Date } = {}) {
  const c = await getCountry(idOrCode);
  if (!c) return { ok: false as const, error: "País no encontrado" };
  const now = opts.now ?? new Date();
  const staleDays = opts.staleAfterDays ?? STALE_AFTER_DAYS;
  const items: ChecklistItem[] = [];

  const reviewedAt = c.lastReviewedAt ? new Date(c.lastReviewedAt) : null;
  const ageDays = reviewedAt && reviewedAt.getTime() > 0 ? Math.floor((now.getTime() - reviewedAt.getTime()) / 86_400_000) : null;
  if (ageDays == null) items.push({ field: "lastReviewedAt", issue: "Nunca ha sido revisado por una persona" });
  else if (ageDays > staleDays) items.push({ field: "lastReviewedAt", issue: `Última revisión hace ${ageDays} días (más de ${staleDays})` });

  const sources = (c.sources ?? []).filter((s) => s?.label);
  if (!sources.length) items.push({ field: "sources", issue: "No tiene fuentes: agrega al menos una oficial (ley, decreto, sentencia)" });
  else {
    const noUrl = sources.filter((s) => !s.url).map((s) => s.label);
    if (noUrl.length) items.push({ field: "sources", issue: `Fuentes sin URL: ${noUrl.join(", ")}` });
  }

  if (!c.whatYouCan?.length) items.push({ field: "whatYouCan", issue: "La lista \"Lo que puedes hacer\" está vacía" });
  if (!c.whatYouCant?.length) items.push({ field: "whatYouCant", issue: "La lista \"Lo que no puedes hacer\" está vacía" });
  if (!c.keyLaw) items.push({ field: "keyLaw", issue: "Falta la ley o decreto clave" });
  if (!c.keyDate) items.push({ field: "keyDate", issue: "Falta la fecha clave" });

  const states = c.states ?? [];
  const statesWithoutNotes = states.filter((s) => !s.note?.trim()).map((s) => s.nameEs || s.name);
  if (statesWithoutNotes.length) items.push({ field: "states", issue: `Estados sin nota: ${statesWithoutNotes.join(", ")}` });
  if (c.nationalStatus === "partial" && !states.length) items.push({ field: "states", issue: "El estatus es \"partial\" pero no hay desglose por estado" });

  const textBlob = [c.summary, ...(c.whatYouCan ?? []), ...(c.whatYouCant ?? []), c.keyLaw, c.keyDate].join("\n");
  if (textBlob.includes("[VERIFICAR]")) items.push({ field: "summary", issue: "El contenido tiene marcas [VERIFICAR] sin resolver" });

  return {
    ok: true as const,
    country: { id: String(c._id), countryCode: c.countryCode, countryNameEs: c.countryNameEs, isActive: c.isActive },
    revision: c.revision?.status ?? "pendiente",
    lastReviewedAt: ageDays == null ? null : reviewedAt!.toISOString(),
    issues: items,
    // Always confirm these claims against the sources, even when no issue is flagged.
    verify: [
      `Estatus nacional: "${c.nationalStatus}"`,
      `Resumen: "${c.summary}"`,
      ...(c.keyLaw ? [`Ley clave: "${c.keyLaw}"`] : []),
      ...(c.keyDate ? [`Fecha clave: "${c.keyDate}"`] : []),
      ...(c.whatYouCan ?? []).map((s) => `Puedes: "${s}"`),
      ...(c.whatYouCant ?? []).map((s) => `No puedes: "${s}"`),
      ...states.map((s) => `Estado ${s.nameEs || s.name}: "${s.status}"${s.note ? ` (${s.note})` : ""}`),
    ],
  };
}
