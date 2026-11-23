import { defineAction } from "~/ai/registry.server";
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  setArticlePublished,
  deleteArticle,
  draftArticle,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES,
} from "~/services/articles.server";

const M = "magazine";
const actorOf = (a: string) => (a === "admin" ? "admin" : "agente") as "admin" | "agente";

const fieldProps = {
  title: { type: "string" },
  excerpt: { type: "string", description: "Bajada de 1-2 oraciones" },
  body: { type: "string", description: "Cuerpo en markdown" },
  category: { type: "string", enum: ARTICLE_CATEGORIES },
  tags: { type: "array", items: { type: "string" } },
  coverImage: { type: "string", description: "URL de Cloudinary" },
  authorName: { type: "string" },
  authorRole: { type: "string" },
  metaTitle: { type: "string" },
  metaDescription: { type: "string" },
};

defineAction({
  name: "article_list",
  module: M,
  risk: "read",
  description: `Lista artículos del magazine (id, slug, título, categoría, estado, revisión, fecha de publicación). Filtra por texto en el título, estado o categoría.
No trae el cuerpo: usa article_get para eso.`,
  inputSchema: {
    type: "object",
    properties: {
      q: { type: "string" },
      status: { type: "string", enum: [...ARTICLE_STATUSES] },
      category: { type: "string", enum: ARTICLE_CATEGORIES },
      limit: { type: "number", description: "Default 100, máx. 200" },
    },
  },
  async execute(i) {
    const rows = await listArticles({ q: i.q as string, status: i.status as string, category: i.category as string, limit: i.limit as number });
    return {
      success: true,
      data: rows.map((a: any) => ({
        id: String(a._id),
        slug: a.slug,
        title: a.title,
        category: a.category,
        status: a.status,
        revision: a.revision?.status ?? "pendiente",
        publishedAt: a.publishedAt ?? null,
      })),
    };
  },
});

defineAction({
  name: "article_get",
  module: M,
  risk: "read",
  description: "Trae un artículo completo por id o slug (cuerpo markdown, bajada, SEO, autor, estado y revisión). Llámala antes de article_update.",
  inputSchema: { type: "object", properties: { idOrSlug: { type: "string" } }, required: ["idOrSlug"] },
  async execute(i) {
    const a = await getArticle(String(i.idOrSlug));
    return a ? { success: true, data: { ...a, _id: String((a as any)._id) } } : { success: false, error: "No encontrado" };
  },
});

defineAction({
  name: "article_create",
  module: M,
  risk: "write",
  description: `Crea un artículo con el texto que te dio la persona. Queda como borrador y pendiente de revisión; no lo publica.
Si la persona quiere que la IA lo escriba, usa article_draft.`,
  inputSchema: {
    type: "object",
    properties: { slug: { type: "string", description: "Opcional; se genera del título" }, ...fieldProps },
    required: ["title", "body"],
  },
  async execute(i, ctx) {
    const r = await createArticle(i as any, { actor: actorOf(ctx.actor), by: ctx.by });
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "article_draft",
  module: M,
  risk: "write",
  description: `Redacta con IA un artículo del magazine (markdown, 500-800 palabras) a partir de un título y un brief, y lo guarda como borrador pendiente de revisión.
Úsala cuando pidan "escribe/redacta un artículo sobre X". No publica nada; la persona lo revisa en /admin/revision.`,
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      brief: { type: "string", description: "De qué trata y qué debe responder" },
      notes: { type: "string", description: "Datos o indicaciones de la persona (opcional)" },
      category: { type: "string", enum: ARTICLE_CATEGORIES },
    },
    required: ["title", "brief"],
  },
  async execute(i) {
    const r = await draftArticle({ title: String(i.title), brief: String(i.brief), notes: i.notes as string, category: i.category as string });
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "article_update",
  module: M,
  risk: "write",
  description: `Edita campos de un artículo (título, cuerpo, bajada, SEO, tags, categoría). Solo cambia lo que envíes y vuelve a pendiente de revisión.
Llama article_get antes. No cambia el slug ni publica: para eso está article_set_published.`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, ...fieldProps }, required: ["id"] },
  async execute(i, ctx) {
    const { id, ...rest } = i;
    const r = await updateArticle(String(id), rest as any, actorOf(ctx.actor), ctx.by);
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});

defineAction({
  name: "article_set_published",
  module: M,
  risk: "destructive",
  description: "Publica un artículo en /magazine o lo regresa a borrador. Publicar es decisión de la persona; revisa antes que esté aprobado en /admin/revision.",
  confirmLabel: (i) => `${i.published ? "Publicar" : "Despublicar"} artículo ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, published: { type: "boolean" } }, required: ["id", "published"] },
  async execute(i) {
    const r = await setArticlePublished(String(i.id), Boolean(i.published));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "article_delete",
  module: M,
  risk: "destructive",
  description: "Elimina un artículo para siempre. Si solo hay que sacarlo del sitio, usa article_set_published con published=false.",
  confirmLabel: (i) => `Eliminar artículo ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await deleteArticle(String(i.id));
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});
