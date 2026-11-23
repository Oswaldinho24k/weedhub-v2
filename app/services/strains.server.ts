/**
 * Strains service ("cepas"): pure data logic for the strain catalog, user submissions and
 * strain images. Used by routes/admin.strains.tsx, routes/admin.submissions.tsx,
 * routes/admin.generate-images.tsx, routes/api.admin.generate-strain-image.ts and by the
 * AI actions in ai/actions/strains.server.ts. No HTTP here.
 *
 * Review rules (see services/content-review.server.ts): any edit made by the agent sets
 * `revision.status = "pendiente"`; approval is human-only (/admin/revision).
 */
import { connectDB } from "~/lib/db.server";
import { StrainModel, type IStrain } from "~/models/strain.server";
import { StrainSubmissionModel } from "~/models/strain-submission.server";
import { ReviewModel } from "~/models/review.server";
import { UserModel } from "~/models/user.server";
import { findStrainByNameOrAlias, fuzzyStrainSuggestions } from "~/lib/strain-search.server";
import { normalizeStrainSlug } from "~/lib/strain-name";
import { uploadImage, uploadImageFromUrl, validateImage, UploadError } from "~/lib/cloudinary.server";
import { buildStrainImagePrompt } from "~/lib/strain-image-prompt.server";
import { generateStrainImage } from "~/lib/image-gen.server";
import { awardPoints } from "~/services/gamification.service.server";
import { effectLabels } from "~/lib/effect-labels";
import { generateText } from "~/ai/generate.server";

export type Actor = "admin" | "agente";
export const STRAIN_TYPES = ["sativa", "indica", "hybrid"] as const;
export const DIFFICULTIES = ["Baja", "Moderada", "Alta"] as const;
export const CLIMATES = ["tropical", "mediterráneo", "continental", "frío"] as const;
type StrainType = (typeof STRAIN_TYPES)[number];

const IMAGE_OPTS = { folder: "weedhub/strains", transformation: "c_fill,w_1200,h_900,q_auto" };

const fail = (error: string) => ({ ok: false as const, error });
const toList = (v: unknown, sep: RegExp) =>
  (Array.isArray(v) ? v : String(v ?? "").split(sep)).map((s) => String(s).trim()).filter(Boolean);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isObjectId = (s: string) => /^[a-f0-9]{24}$/i.test(s);
const byIdOrSlug = (idOrSlug: string) => (isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug });
const num = (v: unknown) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? undefined : n;
};
const str = (v: unknown) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s || undefined;
};

function revisionFields(actor: Actor) {
  const $set: Record<string, unknown> = {
    "revision.lastEditedBy": actor === "agente" ? "agente IA" : "admin",
    "revision.lastEditedAt": new Date(),
  };
  if (actor === "agente") $set["revision.status"] = "pendiente";
  return $set;
}

function parseTerpenes(v: unknown): { name: string; percentage: number }[] {
  if (Array.isArray(v)) {
    return v
      .map((t: any) => (typeof t === "string" ? { name: t.trim(), percentage: 0 } : { name: String(t?.name ?? "").trim(), percentage: Number(t?.percentage) || 0 }))
      .filter((t) => t.name);
  }
  return String(v ?? "")
    .split("\n")
    .map((line) => {
      const [name, pct] = line.split(",").map((s) => s.trim());
      return name ? { name, percentage: parseFloat(pct) || 0 } : null;
    })
    .filter(Boolean) as { name: string; percentage: number }[];
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface StrainListFilters {
  q?: string;
  type?: string;
  archived?: boolean;
  revision?: "pendiente" | "aprobado" | "rechazado";
  limit?: number;
}

/** Catalog list for admin and agent. `limit` 0/undefined = no limit (admin list). */
export async function listStrains(f: StrainListFilters = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (f.q?.trim()) {
    const q = f.q.trim();
    filter.$or = [{ name: { $regex: escapeRegex(q), $options: "i" } }, { aliasSlugs: normalizeStrainSlug(q) }];
  }
  if (f.type && (STRAIN_TYPES as readonly string[]).includes(f.type)) filter.type = f.type;
  if (typeof f.archived === "boolean") filter.isArchived = f.archived;
  if (f.revision === "pendiente") filter.$and = [{ $or: [{ "revision.status": "pendiente" }, { "revision.status": { $exists: false } }] }];
  else if (f.revision) filter["revision.status"] = f.revision;
  let query = StrainModel.find(filter).sort({ name: 1 }).select("name slug type reviewCount isArchived imageUrl colorHint revision");
  if (f.limit && f.limit > 0) query = query.limit(Math.min(f.limit, 200));
  const rows = await query.lean();
  return rows.map((s) => ({
    _id: String(s._id),
    name: s.name,
    slug: s.slug,
    type: s.type,
    reviewCount: s.reviewCount,
    isArchived: s.isArchived,
    imageUrl: s.imageUrl,
    colorHint: s.colorHint,
    revision: s.revision?.status ?? "pendiente",
  }));
}

export async function getStrain(idOrSlug: string) {
  await connectDB();
  const s = await StrainModel.findOne(byIdOrSlug(idOrSlug)).lean();
  return s ? { ...s, _id: String(s._id) } : null;
}

export async function getStrainGrowInfo(idOrSlug: string) {
  await connectDB();
  const s = await StrainModel.findOne(byIdOrSlug(idOrSlug)).select("name slug difficulty grow").lean();
  if (!s) return fail(`Cepa '${idOrSlug}' no encontrada`);
  return { ok: true as const, id: String(s._id), name: s.name, slug: s.slug, difficulty: s.difficulty, grow: s.grow };
}

/** Dashboard counters (active strains, reviews, users, flagged reviews). */
export async function getDashboardStats() {
  await connectDB();
  const [strainCount, reviewCount, userCount, flaggedCount, pendingSubmissions] = await Promise.all([
    StrainModel.countDocuments({ isArchived: false }),
    ReviewModel.countDocuments(),
    UserModel.countDocuments(),
    ReviewModel.countDocuments({ status: "flagged" }),
    StrainSubmissionModel.countDocuments({ status: { $in: ["pending", "rejected_auto"] } }),
  ]);
  return { strainCount, reviewCount, userCount, flaggedCount, pendingSubmissions };
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

export interface StrainCreateInput {
  name?: string;
  type?: string;
  description?: string;
  descriptionEs?: string;
  thcMin?: number | string;
  thcMax?: number | string;
  cbdMin?: number | string;
  cbdMax?: number | string;
  effects?: string[] | string;
  flavors?: string[] | string;
  aliases?: string[] | string;
  lineage?: string;
  dominantTerpene?: string;
  terpenes?: { name: string; percentage: number }[] | string;
  parent1?: string;
  parent2?: string;
  breeder?: string;
  imageUrl?: string;
}

/**
 * Create a strain. `opts.draft` (agent drafts): created archived (hidden from every public
 * list and page) and "pendiente"; a person reviews it and restores it in /admin/strains.
 */
export async function createStrain(input: StrainCreateInput, opts: { actor?: Actor; draft?: boolean } = {}) {
  await connectDB();
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? input.descriptionEs ?? "").trim();
  if (!name || !description) return fail("Nombre y descripción son requeridos");
  const slug = normalizeStrainSlug(name);
  if (!slug) return fail("Nombre inválido");
  if (await StrainModel.exists({ slug })) return fail("Ya existe una cepa con este nombre");

  const aliases = toList(input.aliases, /[,\n]/);
  const type: StrainType = (STRAIN_TYPES as readonly string[]).includes(String(input.type)) ? (input.type as StrainType) : "hybrid";
  const actor = opts.actor ?? "admin";
  const doc = await StrainModel.create({
    name,
    slug,
    aliases,
    aliasSlugs: aliases.map(normalizeStrainSlug),
    type,
    description,
    ...(input.descriptionEs ? { descriptionEs: String(input.descriptionEs).trim() } : {}),
    lineage: str(input.lineage),
    dominantTerpene: str(input.dominantTerpene),
    terpenes: input.terpenes ? parseTerpenes(input.terpenes) : [],
    genetics: { parent1: str(input.parent1), parent2: str(input.parent2), breeder: str(input.breeder), children: [] },
    cannabinoidProfile: {
      thc: { min: num(input.thcMin) ?? 0, max: num(input.thcMax) ?? 0 },
      cbd: { min: num(input.cbdMin) ?? 0, max: num(input.cbdMax) ?? 0 },
    },
    effects: toList(input.effects, /,/),
    flavors: toList(input.flavors, /,/),
    imageUrl: str(input.imageUrl),
    isArchived: Boolean(opts.draft),
    ...(opts.draft || actor === "agente"
      ? { revision: { status: "pendiente", lastEditedBy: actor === "agente" ? "agente IA" : "admin", lastEditedAt: new Date() } }
      : {}),
  });
  return { ok: true as const, id: String(doc._id), slug, isArchived: doc.isArchived };
}

/**
 * Partial update. `undefined` = untouched. Strings/lists may come from a form (comma or
 * newline separated) or from the agent (arrays). Covers grow info too.
 */
export interface StrainPatch {
  name?: string;
  type?: string;
  description?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  descriptionPt?: string;
  aliases?: string[] | string;
  effects?: string[] | string;
  flavors?: string[] | string;
  terpenes?: { name: string; percentage: number }[] | string;
  lineage?: string;
  colorHint?: string;
  dominantTerpene?: string;
  difficulty?: string;
  parent1?: string;
  parent2?: string;
  breeder?: string;
  geneticsChildren?: string[] | string;
  thcMin?: number | string;
  thcMax?: number | string;
  cbdMin?: number | string;
  cbdMax?: number | string;
  cbg?: number | string;
  cbn?: number | string;
  floweringWeeksMin?: number | string;
  floweringWeeksMax?: number | string;
  yieldIndoor?: string;
  yieldOutdoor?: string;
  heightCmMin?: number | string;
  heightCmMax?: number | string;
  climate?: string;
  isAutoflowering?: boolean;
  isFeminized?: boolean;
}

export async function updateStrain(idOrSlug: string, p: StrainPatch, actor: Actor) {
  await connectDB();
  const strain = await StrainModel.findOne(byIdOrSlug(idOrSlug)).select("slug cannabinoidProfile grow").lean();
  if (!strain) return fail(`Cepa '${idOrSlug}' no encontrada`);

  const $set: Record<string, unknown> = {};
  const setStr = (path: string, v: unknown) => {
    const s = str(v);
    if (s !== undefined) $set[path] = s;
  };
  setStr("name", p.name);
  if (p.type !== undefined && (STRAIN_TYPES as readonly string[]).includes(p.type)) $set.type = p.type;
  setStr("description", p.description);
  if (str(p.descriptionEs) !== undefined) {
    $set.descriptionEs = str(p.descriptionEs);
    $set["descriptions.es"] = str(p.descriptionEs);
  }
  setStr("descriptions.en", p.descriptionEn);
  setStr("descriptions.pt", p.descriptionPt);
  if (p.aliases !== undefined) {
    const aliases = toList(p.aliases, /[,\n]/);
    $set.aliases = aliases;
    $set.aliasSlugs = aliases.map(normalizeStrainSlug);
  }
  if (p.effects !== undefined) $set.effects = toList(p.effects, /,/);
  if (p.flavors !== undefined) $set.flavors = toList(p.flavors, /,/);
  if (p.terpenes !== undefined) $set.terpenes = parseTerpenes(p.terpenes);
  setStr("lineage", p.lineage);
  setStr("colorHint", p.colorHint);
  setStr("dominantTerpene", p.dominantTerpene);
  if (p.difficulty !== undefined && (DIFFICULTIES as readonly string[]).includes(p.difficulty)) $set.difficulty = p.difficulty;
  setStr("genetics.parent1", p.parent1);
  setStr("genetics.parent2", p.parent2);
  setStr("genetics.breeder", p.breeder);
  if (p.geneticsChildren !== undefined) $set["genetics.children"] = toList(p.geneticsChildren, /,/).map((s) => s.toLowerCase());

  const cur = strain.cannabinoidProfile;
  if (num(p.thcMin) !== undefined || num(p.thcMax) !== undefined)
    $set["cannabinoidProfile.thc"] = { min: num(p.thcMin) ?? cur?.thc?.min ?? 0, max: num(p.thcMax) ?? cur?.thc?.max ?? 0 };
  if (num(p.cbdMin) !== undefined || num(p.cbdMax) !== undefined)
    $set["cannabinoidProfile.cbd"] = { min: num(p.cbdMin) ?? cur?.cbd?.min ?? 0, max: num(p.cbdMax) ?? cur?.cbd?.max ?? 0 };
  if (num(p.cbg) !== undefined) $set["cannabinoidProfile.cbg"] = num(p.cbg);
  if (num(p.cbn) !== undefined) $set["cannabinoidProfile.cbn"] = num(p.cbn);

  const g = strain.grow;
  if (num(p.floweringWeeksMin) !== undefined || num(p.floweringWeeksMax) !== undefined)
    $set["grow.floweringWeeks"] = { min: num(p.floweringWeeksMin) ?? g?.floweringWeeks?.min ?? 0, max: num(p.floweringWeeksMax) ?? g?.floweringWeeks?.max ?? 0 };
  setStr("grow.yieldIndoor", p.yieldIndoor);
  setStr("grow.yieldOutdoor", p.yieldOutdoor);
  if (num(p.heightCmMin) !== undefined || num(p.heightCmMax) !== undefined)
    $set["grow.heightCm"] = { min: num(p.heightCmMin) ?? g?.heightCm?.min ?? 0, max: num(p.heightCmMax) ?? g?.heightCm?.max ?? 0 };
  if (p.climate !== undefined && (CLIMATES as readonly string[]).includes(p.climate)) $set["grow.climate"] = p.climate;
  if (typeof p.isAutoflowering === "boolean") $set["grow.isAutoflowering"] = p.isAutoflowering;
  if (typeof p.isFeminized === "boolean") $set["grow.isFeminized"] = p.isFeminized;

  if (!Object.keys($set).length) return fail("Nada que actualizar");
  const fields = Object.keys($set);
  Object.assign($set, revisionFields(actor));
  await StrainModel.updateOne({ _id: strain._id }, { $set });
  return { ok: true as const, slug: strain.slug, fields };
}

export async function setStrainArchived(idOrSlug: string, archived: boolean) {
  await connectDB();
  const s = await StrainModel.findOneAndUpdate(byIdOrSlug(idOrSlug), { isArchived: archived }, { new: true }).select("name slug isArchived");
  if (!s) return fail(`Cepa '${idOrSlug}' no encontrada`);
  return { ok: true as const, name: s.name, slug: s.slug, isArchived: s.isArchived };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** Upload an image file (admin form) to Cloudinary and set it as the strain image. */
export async function uploadStrainImage(idOrSlug: string, file: unknown) {
  await connectDB();
  if (!(file instanceof File) || !validateImage(file)) return fail("No se recibió ninguna imagen.");
  try {
    const imageUrl = await uploadImage(file, IMAGE_OPTS);
    const r = await StrainModel.updateOne(byIdOrSlug(idOrSlug), { imageUrl });
    return r.matchedCount ? { ok: true as const, imageUrl } : fail("Cepa no encontrada");
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message);
    throw err;
  }
}

/** Upload an optional image file for a new strain. Returns undefined when no file was sent. */
export async function uploadNewStrainImage(file: unknown) {
  if (!(file instanceof File)) return { ok: true as const, imageUrl: undefined };
  try {
    if (!validateImage(file)) return { ok: true as const, imageUrl: undefined };
    return { ok: true as const, imageUrl: await uploadImage(file, IMAGE_OPTS) };
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message);
    throw err;
  }
}

/** Generate a strain image with fal.ai (costs money), store it in Cloudinary and replace imageUrl. */
export async function generateStrainImageFor(idOrSlug: string) {
  await connectDB();
  const strain = await StrainModel.findOne(byIdOrSlug(idOrSlug)).select("name type dominantTerpene terpenes effects flavors").lean();
  if (!strain) return fail("Cepa no encontrada");
  try {
    const rawUrl = await generateStrainImage(buildStrainImagePrompt(strain as any));
    const imageUrl = await uploadImageFromUrl(rawUrl, IMAGE_OPTS);
    await StrainModel.updateOne({ _id: strain._id }, { imageUrl });
    return { ok: true as const, imageUrl };
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Error generando imagen");
  }
}

export type ImageStatus = "cloudinary" | "pexels" | "none";

/** Top-rated active strains for the bulk image page. */
export async function listImageCandidates(limit = 100) {
  await connectDB();
  const strains = await StrainModel.find({ isArchived: false, reviewCount: { $gte: 1 } })
    .sort({ "averageRatings.overall": -1, reviewCount: -1 })
    .limit(limit)
    .select("name slug type imageUrl colorHint dominantTerpene")
    .lean();
  return strains.map((s, i) => {
    const url = s.imageUrl ?? null;
    const imageStatus: ImageStatus = url?.includes("res.cloudinary.com") ? "cloudinary" : url?.includes("pexels") ? "pexels" : "none";
    return {
      _id: String(s._id),
      name: s.name,
      slug: s.slug,
      type: s.type,
      imageUrl: url,
      colorHint: s.colorHint ?? null,
      dominantTerpene: s.dominantTerpene ?? null,
      rank: i + 1,
      imageStatus,
    };
  });
}

// ---------------------------------------------------------------------------
// AI drafting
// ---------------------------------------------------------------------------

const DESCRIPTION_SYSTEM = `Eres la redacción de WeedHub, una enciclopedia de cannabis en español para personas adultas en América Latina.
Escribes la descripción de una ficha de cepa: un párrafo de 60 a 110 palabras.
Usa SOLO los datos que recibes en JSON. No inventes cifras, sabores, efectos, origen, criador, premios ni historia. Si falta un dato, no lo menciones.
Nada de afirmaciones médicas. No recomiendes consumir. Devuelve solo el texto, sin título ni comillas.`;

/**
 * AI writes a Spanish description from the strain's own data and saves it to `descriptionEs`
 * as "pendiente". Refuses to overwrite an existing description unless `overwrite` is true.
 */
export async function draftStrainDescription(idOrSlug: string, opts: { overwrite?: boolean; notes?: string } = {}) {
  await connectDB();
  const s: any = await StrainModel.findOne(byIdOrSlug(idOrSlug)).lean();
  if (!s) return fail("Cepa no encontrada");
  if (s.descriptionEs && !opts.overwrite) return fail("La cepa ya tiene descriptionEs; vuelve a llamar con overwrite: true si la persona quiere reemplazarla");

  const data = {
    nombre: s.name,
    alias: s.aliases?.length ? s.aliases : undefined,
    tipo: s.type,
    mezcla: s.typeBlend || undefined,
    linaje: s.lineage || undefined,
    padres: [s.genetics?.parent1, s.genetics?.parent2].filter(Boolean),
    criador: s.genetics?.breeder || undefined,
    thc: s.cannabinoidProfile?.thc?.max ? s.cannabinoidProfile.thc : undefined,
    cbd: s.cannabinoidProfile?.cbd?.max ? s.cannabinoidProfile.cbd : undefined,
    terpenoDominante: s.dominantTerpene || undefined,
    terpenos: (s.terpenes ?? []).slice(0, 5).map((t: any) => t.name),
    efectos: effectLabels(s.effects ?? []).slice(0, 6),
    sabores: (s.flavors ?? []).slice(0, 5),
    cultivo: s.grow ? { dificultad: s.difficulty, semanasFloracion: s.grow.floweringWeeks, clima: s.grow.climate, autofloreciente: s.grow.isAutoflowering } : undefined,
    textoOriginal: s.description || undefined,
  };
  const r = await generateText({
    system: DESCRIPTION_SYSTEM,
    prompt: `Datos de la cepa (JSON):\n${JSON.stringify(data)}${opts.notes ? `\n\nIndicaciones de la persona (no agregues datos que no estén en el JSON): ${opts.notes}` : ""}`,
    maxTokens: 4000,
  });
  if (!r.ok) return r;
  await StrainModel.updateOne(
    { _id: s._id },
    { $set: { descriptionEs: r.text, "descriptions.es": r.text, ...revisionFields("agente") } }
  );
  return { ok: true as const, slug: s.slug, descriptionEs: r.text, previous: s.descriptionEs || null };
}

// ---------------------------------------------------------------------------
// User submissions
// ---------------------------------------------------------------------------

export async function listSubmissions() {
  await connectDB();
  const submissions = await StrainSubmissionModel.find({ status: { $in: ["pending", "rejected_auto"] } })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("submittedBy", "username anonymousHandle")
    .populate("potentialDuplicateStrainId", "name slug")
    .lean();

  return Promise.all(
    submissions.map(async (s) => {
      const exact = await findStrainByNameOrAlias(s.name);
      const fuzzy = exact ? [] : await fuzzyStrainSuggestions(s.name, 3);
      return {
        _id: String(s._id),
        name: s.name,
        type: s.type,
        lineage: s.lineage,
        description: s.description,
        sourceUrl: s.sourceUrl,
        reasoning: s.reasoning,
        photo: s.photo,
        status: s.status,
        moderationNotes: s.moderationNotes,
        userOverrodeDuplicate: s.userOverrodeDuplicate,
        createdAt: s.createdAt.toISOString(),
        submittedBy: s.submittedBy
          ? { username: (s.submittedBy as any).username as string, anonymousHandle: (s.submittedBy as any).anonymousHandle as string }
          : null,
        submittedById: String((s.submittedBy as any)?._id || s.submittedBy),
        exactMatch: exact ? { name: exact.strain.name, slug: exact.strain.slug, matchedAlias: exact.matchedAlias } : null,
        fuzzy: fuzzy.map((f) => ({ name: f.strain.name, slug: f.strain.slug, distance: f.distance })),
      };
    })
  );
}

/** Resolve the reviewing admin (id or username) to a user id, for `reviewedBy`. */
export async function resolveReviewerId(idOrUsername?: string) {
  if (!idOrUsername) return undefined;
  if (isObjectId(idOrUsername)) return idOrUsername;
  await connectDB();
  const u = await UserModel.findOne({ username: idOrUsername }).select("_id").lean();
  return u ? String(u._id) : undefined;
}

/** Approve a submission: creates the strain (public) and awards +10 pts to the submitter. */
export async function approveSubmission(submissionId: string, input: { thcMax?: number | string; cbdMax?: number | string }, reviewerId?: string) {
  await connectDB();
  const sub = await StrainSubmissionModel.findById(submissionId);
  if (!sub) return fail("Sugerencia no encontrada.");
  if (!["pending", "rejected_auto"].includes(sub.status)) return fail(`La sugerencia ya fue procesada (${sub.status}).`);

  const slug = normalizeStrainSlug(sub.name);
  if (await StrainModel.exists({ slug })) return fail(`Ya existe una cepa con slug ${slug}. Usa "Merge as alias".`);

  const strain = await StrainModel.create({
    name: sub.name,
    slug,
    type: sub.type === "unknown" ? "hybrid" : sub.type,
    description: sub.description || sub.reasoning,
    descriptionEs: sub.description || sub.reasoning,
    lineage: sub.lineage,
    cannabinoidProfile: { thc: { min: 0, max: num(input.thcMax) ?? 0 }, cbd: { min: 0, max: num(input.cbdMax) ?? 0 } },
    effects: [],
    flavors: [],
    imageUrl: sub.photo,
    isArchived: false,
  });

  sub.status = "approved";
  sub.reviewedBy = reviewerId as any;
  sub.reviewedAt = new Date();
  sub.linkedStrainId = strain._id as any;
  await sub.save();
  await awardPoints(String(sub.submittedBy), 10);
  return { ok: true as const, name: sub.name, strainId: String(strain._id), slug, message: `Cepa "${sub.name}" creada y aprobada. +10 pts al usuario.` };
}

export async function rejectSubmission(submissionId: string, reason: string | undefined, reviewerId?: string) {
  await connectDB();
  const sub = await StrainSubmissionModel.findById(submissionId);
  if (!sub) return fail("Sugerencia no encontrada.");
  sub.status = "rejected";
  sub.reviewedBy = reviewerId as any;
  sub.reviewedAt = new Date();
  sub.rejectionReason = str(reason);
  await sub.save();
  return { ok: true as const, message: "Sugerencia rechazada." };
}

/** Add the submitted name as an alias of an existing strain; awards +5 pts to the submitter. */
export async function mergeSubmissionAsAlias(submissionId: string, targetIdOrSlug: string, reviewerId?: string) {
  await connectDB();
  const sub = await StrainSubmissionModel.findById(submissionId);
  if (!sub) return fail("Sugerencia no encontrada.");
  if (!targetIdOrSlug) return fail("Cepa destino no encontrada.");
  const target = await StrainModel.findOne(byIdOrSlug(targetIdOrSlug));
  if (!target) return fail("Cepa destino no encontrada.");

  const aliases = target.aliases || [];
  if (!aliases.some((a) => normalizeStrainSlug(a) === normalizeStrainSlug(sub.name))) aliases.push(sub.name);
  target.aliases = aliases;
  target.aliasSlugs = aliases.map((a) => normalizeStrainSlug(a));
  await target.save();

  sub.status = "merged_as_alias";
  sub.reviewedBy = reviewerId as any;
  sub.reviewedAt = new Date();
  sub.linkedStrainId = target._id as any;
  await sub.save();
  await awardPoints(String(sub.submittedBy), 5);
  return { ok: true as const, message: `"${sub.name}" agregado como alias de ${target.name}. +5 pts al usuario.` };
}

export type { IStrain };
