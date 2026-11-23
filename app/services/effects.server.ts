/** Effects catalog service: pure data logic. Used by routes/admin.effects.tsx and ai/actions/effects.server.ts. */
import { connectDB } from "~/lib/db.server";
import { EffectModel } from "~/models/effect.server";

export const EFFECT_CATEGORIES = ["positive", "negative"] as const;
export const EFFECT_STATUSES = ["approved", "pending", "rejected"] as const;
export type EffectCategory = (typeof EFFECT_CATEGORIES)[number];
export type EffectStatus = (typeof EFFECT_STATUSES)[number];

type Actor = "admin" | "agente";

export interface EffectLabels {
  labelEs?: string;
  labelEn?: string;
  labelPt?: string;
  category?: string;
}

const isCategory = (v: unknown): v is EffectCategory => EFFECT_CATEGORIES.includes(v as EffectCategory);
const isStatus = (v: unknown): v is EffectStatus => EFFECT_STATUSES.includes(v as EffectStatus);
const clean = (v: unknown) => String(v ?? "").trim();
const normKey = (v: unknown) => clean(v).toLowerCase();

/** Same behavior as the legacy `list_effects`: default status "approved", limit 50, most used first. */
export async function listEffects(opts: { status?: string; category?: string; limit?: number } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = { status: isStatus(opts.status) ? opts.status : "approved" };
  if (isCategory(opts.category)) filter.category = opts.category;
  return EffectModel.find(filter)
    .sort({ usageCount: -1 })
    .limit(Number(opts.limit) || 50)
    .lean();
}

/** Admin board: pending queue (with submitter) + approved catalog. */
export async function getEffectsBoard() {
  await connectDB();
  const [pending, approved] = await Promise.all([
    EffectModel.find({ status: "pending" }).sort({ createdAt: -1 }).populate("submittedBy", "username anonymousHandle").lean(),
    EffectModel.find({ status: "approved" }).sort({ category: 1, usageCount: -1 }).lean(),
  ]);
  return { pending, approved };
}

export async function getEffect(idOrKey: string) {
  await connectDB();
  return EffectModel.findOne(/^[a-f0-9]{24}$/.test(idOrKey) ? { _id: idOrKey } : { key: normKey(idOrKey) }).lean();
}

/**
 * Creates an effect. Admin-created effects go straight to the approved catalog (as before);
 * agent-created ones land in the pending queue, because approving is a human decision.
 */
export async function createEffect(input: EffectLabels & { key?: string }, actor: Actor) {
  await connectDB();
  const key = normKey(input.key);
  const labelEs = clean(input.labelEs);
  const labelEn = clean(input.labelEn);
  const labelPt = clean(input.labelPt);
  if (!key || !labelEs || !labelEn || !labelPt) return { ok: false as const, error: "Todos los campos son requeridos (key y labels ES/EN/PT)" };
  if (await EffectModel.exists({ key })) return { ok: false as const, error: `Ya existe un efecto con key '${key}'` };
  const effect = await EffectModel.create({
    key,
    labelEs,
    labelEn,
    labelPt,
    category: isCategory(input.category) ? input.category : "positive",
    status: actor === "agente" ? "pending" : "approved",
    source: "system",
  });
  return { ok: true as const, id: String(effect._id), key: effect.key, labelEs: effect.labelEs, status: effect.status };
}

/** Edits labels/category of an effect without changing its status. */
export async function updateEffect(id: string, input: EffectLabels) {
  await connectDB();
  const $set: Record<string, unknown> = {};
  for (const k of ["labelEs", "labelEn", "labelPt"] as const) {
    if (input[k] == null) continue;
    const v = clean(input[k]);
    if (!v) return { ok: false as const, error: "Los labels no pueden quedar vacíos" };
    $set[k] = v;
  }
  if (input.category != null) {
    if (!isCategory(input.category)) return { ok: false as const, error: `Categoría inválida: ${input.category}` };
    $set.category = input.category;
  }
  if (!Object.keys($set).length) return { ok: false as const, error: "Nada que actualizar" };
  const r = await EffectModel.updateOne({ _id: id }, { $set });
  return r.matchedCount ? { ok: true as const } : { ok: false as const, error: "Efecto no encontrado" };
}

/** Approves a pending effect, optionally fixing its labels/category in the same step. */
export async function approveEffect(id: string, input: EffectLabels = {}) {
  await connectDB();
  const e = await EffectModel.findById(id);
  if (!e) return { ok: false as const, error: "Efecto no encontrado" };
  const labelEs = input.labelEs != null ? clean(input.labelEs) : e.labelEs;
  const labelEn = input.labelEn != null ? clean(input.labelEn) : e.labelEn;
  const labelPt = input.labelPt != null ? clean(input.labelPt) : e.labelPt;
  if (!labelEn || !labelEs || !labelPt) return { ok: false as const, error: "Todos los labels son requeridos" };
  e.labelEs = labelEs;
  e.labelEn = labelEn;
  e.labelPt = labelPt;
  if (input.category != null) {
    if (!isCategory(input.category)) return { ok: false as const, error: `Categoría inválida: ${input.category}` };
    e.category = input.category;
  }
  e.status = "approved";
  e.rejectionReason = undefined;
  await e.save();
  return { ok: true as const, key: e.key };
}

export async function rejectEffect(id: string, reason?: string) {
  await connectDB();
  const r = await EffectModel.updateOne({ _id: id }, { $set: { status: "rejected", rejectionReason: clean(reason) || undefined } });
  return r.matchedCount ? { ok: true as const } : { ok: false as const, error: "Efecto no encontrado" };
}

/**
 * Merges a (usually pending) effect into a canonical one: marks it rejected with
 * "Merged into: <targetKey>". Does not rewrite strains or reviews that use the old key.
 */
export async function mergeEffect(id: string, targetKey: string) {
  await connectDB();
  const key = normKey(targetKey);
  if (!key) return { ok: false as const, error: "Indica el key destino" };
  const [source, target] = await Promise.all([EffectModel.findById(id).lean(), EffectModel.findOne({ key }).lean()]);
  if (!source) return { ok: false as const, error: "Efecto no encontrado" };
  if (!target) return { ok: false as const, error: `No existe un efecto con key '${key}'` };
  if (String(target._id) === String(source._id)) return { ok: false as const, error: "No puedes fusionar un efecto consigo mismo" };
  await EffectModel.updateOne({ _id: id }, { $set: { status: "rejected", rejectionReason: `Merged into: ${key}` } });
  return { ok: true as const, from: source.key, into: key };
}
