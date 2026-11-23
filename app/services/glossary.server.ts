/** Glossary service: pure data logic. Used by routes/admin.glossary.tsx and ai/actions/glossary.server.ts. */
import { connectDB } from "~/lib/db.server";
import { GlossaryTermModel, type GlossaryCategory } from "~/models/glossary-term.server";
import { generateText } from "~/ai/generate.server";

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = ["cannabinoides", "terpenos", "extracciones", "cultivo", "consumo", "legal", "ciencia", "cultura"];

export interface TermInput {
  slug?: string;
  term?: string;
  category?: string;
  definition?: string;
  examples?: string[] | string;
  relatedSlugs?: string[] | string;
}

const toList = (v: unknown, sep: RegExp) =>
  (Array.isArray(v) ? v : String(v ?? "").split(sep)).map((s) => String(s).trim()).filter(Boolean);

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function listTerms(opts: { q?: string; category?: string; active?: boolean } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (opts.q) filter.term = { $regex: opts.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (opts.category) filter.category = opts.category;
  if (typeof opts.active === "boolean") filter.isActive = opts.active;
  return GlossaryTermModel.find(filter).sort({ category: 1, term: 1 }).lean();
}

export async function getTerm(idOrSlug: string) {
  await connectDB();
  const byId = /^[a-f0-9]{24}$/.test(idOrSlug);
  return GlossaryTermModel.findOne(byId ? { _id: idOrSlug } : { slug: idOrSlug }).lean();
}

export async function createTerm(input: TermInput, opts: { active?: boolean; pending?: boolean } = {}) {
  await connectDB();
  const term = String(input.term ?? "").trim();
  const slug = slugify(input.slug || term);
  if (!slug || !term) return { ok: false as const, error: "Término y slug son obligatorios" };
  if (await GlossaryTermModel.exists({ slug })) return { ok: false as const, error: `El slug "${slug}" ya existe` };
  const category = (GLOSSARY_CATEGORIES.includes(input.category as GlossaryCategory) ? input.category : "cultura") as GlossaryCategory;
  const doc = await GlossaryTermModel.create({
    slug,
    term,
    category,
    definition: String(input.definition ?? ""),
    examples: toList(input.examples, /\n/),
    relatedSlugs: toList(input.relatedSlugs, /[,\n]/),
    isActive: opts.active ?? true,
    ...(opts.pending ? { revision: { status: "pendiente", lastEditedBy: "agente IA", lastEditedAt: new Date() } } : {}),
  });
  return { ok: true as const, id: String(doc._id), slug };
}

export async function updateTerm(id: string, input: TermInput, actor: "admin" | "agente") {
  await connectDB();
  const $set: Record<string, unknown> = {};
  if (input.term != null) $set.term = String(input.term).trim();
  if (input.category != null && GLOSSARY_CATEGORIES.includes(input.category as GlossaryCategory)) $set.category = input.category;
  if (input.definition != null) $set.definition = String(input.definition);
  if (input.examples != null) $set.examples = toList(input.examples, /\n/);
  if (input.relatedSlugs != null) $set.relatedSlugs = toList(input.relatedSlugs, /[,\n]/);
  if (!Object.keys($set).length) return { ok: false as const, error: "Nada que actualizar" };
  $set["revision.lastEditedBy"] = actor === "agente" ? "agente IA" : "admin";
  $set["revision.lastEditedAt"] = new Date();
  if (actor === "agente") $set["revision.status"] = "pendiente";
  const r = await GlossaryTermModel.updateOne({ _id: id }, { $set });
  return r.matchedCount ? { ok: true as const } : { ok: false as const, error: "Término no encontrado" };
}

export async function setTermActive(id: string, active?: boolean) {
  await connectDB();
  const t = await GlossaryTermModel.findById(id);
  if (!t) return { ok: false as const, error: "Término no encontrado" };
  t.isActive = typeof active === "boolean" ? active : !t.isActive;
  await t.save();
  return { ok: true as const, isActive: t.isActive };
}

export async function deleteTerm(id: string) {
  await connectDB();
  const r = await GlossaryTermModel.deleteOne({ _id: id });
  return r.deletedCount ? { ok: true as const } : { ok: false as const, error: "Término no encontrado" };
}

/**
 * Draft a new term with AI. Saved hidden (isActive: false) and "pendiente" until a person
 * reviews it in /admin/revision and publishes it.
 */
export async function draftTerm(input: { term: string; category?: string; notes?: string }) {
  const r = await generateText({
    system: `Eres la redacción del glosario de WeedHub, una enciclopedia de cannabis en español.
Devuelve SOLO un JSON con esta forma: {"definition": string (2-4 oraciones, clara, para alguien que no sabe nada), "examples": string[] (2 ejemplos de uso en una oración), "category": una de ${GLOSSARY_CATEGORIES.join(", ")}}.`,
    prompt: `Término: ${input.term}${input.category ? `\nCategoría sugerida: ${input.category}` : ""}${input.notes ? `\nNotas de la persona: ${input.notes}` : ""}`,
    maxTokens: 4000,
  });
  if (!r.ok) return r;
  let parsed: { definition?: string; examples?: string[]; category?: string };
  try {
    parsed = JSON.parse(r.text.replace(/^```(json)?|```$/g, "").trim());
  } catch {
    return { ok: false as const, error: "La IA no devolvió un formato válido; intenta de nuevo" };
  }
  return createTerm(
    { term: input.term, category: input.category || parsed.category, definition: parsed.definition, examples: parsed.examples },
    { active: false, pending: true }
  );
}
