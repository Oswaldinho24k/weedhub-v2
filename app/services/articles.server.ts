/** Magazine articles service: pure data logic. Used by routes/admin.articles.tsx and ai/actions/articles.server.ts. */
import { connectDB } from "~/lib/db.server";
import { ArticleModel, type ArticleCategory, type ArticleLocale } from "~/models/article.server";
import { generateText } from "~/ai/generate.server";
import { slugify } from "~/services/glossary.server";

export const ARTICLE_CATEGORIES: ArticleCategory[] = ["cepa", "producto", "metodos", "legal", "cultura", "ciencia", "entrevista"];
export const ARTICLE_STATUSES = ["draft", "published", "archived"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];
const LOCALES: ArticleLocale[] = ["es", "en", "pt"];

export const AI_AUTHOR = "Redacción WeedHub";

type Actor = "admin" | "agente";

export interface ArticleInput {
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  coverImage?: string;
  category?: string;
  locale?: string;
  tags?: string[] | string;
  authorName?: string;
  authorRole?: string;
  metaTitle?: string;
  metaDescription?: string;
}

const toList = (v: unknown) =>
  (Array.isArray(v) ? v : String(v ?? "").split(",")).map((s) => String(s).trim()).filter(Boolean);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** First paragraph of the markdown body, without markup, cut to ~200 chars. Used when no excerpt is given. */
function excerptFromBody(body: string) {
  const para = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#"));
  const plain = (para ?? "").replace(/[*_`>#\[\]]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > 200 ? `${plain.slice(0, 197).trimEnd()}...` : plain;
}

const editStamp = (actor: Actor, by?: string) => ({
  "revision.lastEditedBy": actor === "agente" ? "agente IA" : by ?? "admin",
  "revision.lastEditedAt": new Date(),
  ...(actor === "agente" ? { "revision.status": "pendiente" } : {}),
});

export async function listArticles(opts: { q?: string; status?: string; category?: string; limit?: number } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (opts.q) filter.title = { $regex: escapeRegex(opts.q), $options: "i" };
  if (opts.status && (ARTICLE_STATUSES as readonly string[]).includes(opts.status)) filter.status = opts.status;
  if (opts.category && ARTICLE_CATEGORIES.includes(opts.category as ArticleCategory)) filter.category = opts.category;
  return ArticleModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(opts.limit) || 100, 200))
    .lean();
}

export async function getArticle(idOrSlug: string) {
  await connectDB();
  const byId = /^[a-f0-9]{24}$/.test(idOrSlug);
  return ArticleModel.findOne(byId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase().trim() }).lean();
}

/** Creates an article. Always as draft; publishing is a separate, human decision (setArticlePublished). */
export async function createArticle(input: ArticleInput, opts: { actor: Actor; by?: string }) {
  await connectDB();
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  const slug = slugify(input.slug || title);
  if (!slug || !title || !body) return { ok: false as const, error: "Slug, título y cuerpo son requeridos" };
  if (await ArticleModel.exists({ slug })) return { ok: false as const, error: `El slug "${slug}" ya existe` };
  const doc = await ArticleModel.create({
    slug,
    title,
    body,
    excerpt: String(input.excerpt ?? "").trim() || excerptFromBody(body) || title,
    coverImage: String(input.coverImage ?? "").trim() || undefined,
    category: ARTICLE_CATEGORIES.includes(input.category as ArticleCategory) ? input.category : "cultura",
    locale: LOCALES.includes(input.locale as ArticleLocale) ? input.locale : "es",
    tags: toList(input.tags),
    author: { name: String(input.authorName ?? "").trim() || "WeedHub", role: String(input.authorRole ?? "").trim() },
    metaTitle: String(input.metaTitle ?? "").trim(),
    metaDescription: String(input.metaDescription ?? "").trim(),
    status: "draft",
    revision: {
      ...(opts.actor === "agente" ? { status: "pendiente" } : {}),
      lastEditedBy: opts.actor === "agente" ? "agente IA" : opts.by ?? "admin",
      lastEditedAt: new Date(),
    },
  });
  return { ok: true as const, id: String(doc._id), slug };
}

/** Partial update: only the fields present in `input` change. Slug and status are not editable here. */
export async function updateArticle(id: string, input: ArticleInput, actor: Actor, by?: string) {
  await connectDB();
  const $set: Record<string, unknown> = {};
  if (input.title != null) {
    const title = String(input.title).trim();
    if (!title) return { ok: false as const, error: "El título no puede quedar vacío" };
    $set.title = title;
  }
  if (input.body != null) {
    const body = String(input.body).trim();
    if (!body) return { ok: false as const, error: "El cuerpo no puede quedar vacío" };
    $set.body = body;
  }
  if (input.excerpt != null) {
    const excerpt = String(input.excerpt).trim() || excerptFromBody(String($set.body ?? ""));
    if (excerpt) $set.excerpt = excerpt;
  }
  if (input.coverImage != null) $set.coverImage = String(input.coverImage).trim();
  if (input.category != null && ARTICLE_CATEGORIES.includes(input.category as ArticleCategory)) $set.category = input.category;
  if (input.locale != null && LOCALES.includes(input.locale as ArticleLocale)) $set.locale = input.locale;
  if (input.tags != null) $set.tags = toList(input.tags);
  if (input.authorName != null) $set["author.name"] = String(input.authorName).trim() || "WeedHub";
  if (input.authorRole != null) $set["author.role"] = String(input.authorRole).trim();
  if (input.metaTitle != null) $set.metaTitle = String(input.metaTitle).trim();
  if (input.metaDescription != null) $set.metaDescription = String(input.metaDescription).trim();
  if (!Object.keys($set).length) return { ok: false as const, error: "Nada que actualizar" };
  Object.assign($set, editStamp(actor, by));
  const r = await ArticleModel.updateOne({ _id: id }, { $set });
  return r.matchedCount ? { ok: true as const } : { ok: false as const, error: "Artículo no encontrado" };
}

/** Publishes or unpublishes (back to draft). Without `published`, toggles. Sets publishedAt on first publish. */
export async function setArticlePublished(id: string, published?: boolean) {
  await connectDB();
  const a = await ArticleModel.findById(id);
  if (!a) return { ok: false as const, error: "Artículo no encontrado" };
  const publish = typeof published === "boolean" ? published : a.status !== "published";
  a.status = publish ? "published" : "draft";
  if (publish && !a.publishedAt) a.publishedAt = new Date();
  await a.save();
  return { ok: true as const, status: a.status, slug: a.slug };
}

export async function deleteArticle(id: string) {
  await connectDB();
  const r = await ArticleModel.deleteOne({ _id: id });
  return r.deletedCount ? { ok: true as const } : { ok: false as const, error: "Artículo no encontrado" };
}

/**
 * Drafts a magazine article with AI from a title + brief. Saved as status "draft" with
 * revision "pendiente" and author "Redacción WeedHub"; a person reviews and publishes it.
 */
export async function draftArticle(input: { title: string; brief: string; notes?: string; category?: string; slug?: string }) {
  const title = String(input.title ?? "").trim();
  const brief = String(input.brief ?? "").trim();
  if (!title || !brief) return { ok: false as const, error: "Título y brief son obligatorios" };
  const r = await generateText({
    system: `Eres la redacción del magazine de WeedHub, una enciclopedia de cannabis en español para Latinoamérica.
Escribe un artículo en markdown, entre 500 y 800 palabras:
- Empieza con 2 o 3 oraciones que respondan de forma directa la pregunta o el tema del título (sin encabezado antes).
- Después, entre 3 y 5 secciones con encabezados "## ". No uses "# " (el título ya se muestra aparte).
- Usa solo lo que sabes con seguridad y lo que te da la persona. No inventes datos, cifras, estudios, nombres, citas ni leyes; si algo hace falta verificar, márcalo como [VERIFICAR].
Devuelve SOLO un JSON con esta forma: {"excerpt": string (1-2 oraciones, máx. 200 caracteres), "body": string (el markdown), "tags": string[] (3-5, en minúsculas), "metaDescription": string (máx. 155 caracteres), "category": una de ${ARTICLE_CATEGORIES.join(", ")}}.`,
    prompt: `Título: ${title}\nBrief: ${brief}${input.category ? `\nCategoría sugerida: ${input.category}` : ""}${input.notes ? `\nNotas de la persona: ${input.notes}` : ""}`,
    maxTokens: 8000,
  });
  if (!r.ok) return r;
  let parsed: { excerpt?: string; body?: string; tags?: string[]; metaDescription?: string; category?: string };
  try {
    const raw = r.text.replace(/^```(json)?|```$/g, "").trim();
    parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  } catch {
    return { ok: false as const, error: "La IA no devolvió un formato válido; intenta de nuevo" };
  }
  if (!parsed.body?.trim()) return { ok: false as const, error: "La IA no devolvió el cuerpo del artículo; intenta de nuevo" };
  return createArticle(
    {
      title,
      slug: input.slug,
      body: parsed.body,
      excerpt: parsed.excerpt,
      tags: parsed.tags,
      metaDescription: parsed.metaDescription,
      category: input.category || parsed.category,
      authorName: AI_AUTHOR,
      locale: "es",
    },
    { actor: "agente" }
  );
}
