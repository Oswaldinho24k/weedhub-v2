import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.articles";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { Icon } from "~/components/ui/icon";

// Lazy-load the model since it may not exist yet
async function getArticleModel() {
  const mongoose = await import("mongoose");
  if (mongoose.default.models.Article) return mongoose.default.models.Article;
  const schema = new mongoose.default.Schema(
    {
      slug: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      titleEn: String,
      titlePt: String,
      excerpt: String,
      body: String,
      category: { type: String, default: "general" },
      imageUrl: String,
      publishedAt: Date,
      isPublished: { type: Boolean, default: false },
      locale: { type: String, default: "es" },
      author: String,
    },
    { timestamps: true }
  );
  return mongoose.default.model("Article", schema);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const Article = await getArticleModel();
  const articles = await Article.find({}).sort({ createdAt: -1 }).limit(50).lean();
  return {
    articles: articles.map((a: any) => ({
      _id: String(a._id),
      slug: a.slug,
      title: a.title,
      category: a.category,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt?.toISOString() || null,
      createdAt: a.createdAt?.toISOString(),
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const Article = await getArticleModel();

  if (intent === "create") {
    const slug = String(form.get("slug") || "").toLowerCase().trim();
    const title = String(form.get("title") || "").trim();
    if (!slug || !title) return { error: "Slug y título son requeridos" };
    const existing = await Article.findOne({ slug });
    if (existing) return { error: `El slug "${slug}" ya existe` };
    await Article.create({
      slug,
      title,
      excerpt: String(form.get("excerpt") || "").trim(),
      category: String(form.get("category") || "general"),
      isPublished: false,
    });
    return { success: "Artículo creado" };
  }

  if (intent === "toggle") {
    const id = String(form.get("id"));
    const article = await Article.findById(id);
    if (article) {
      article.isPublished = !article.isPublished;
      if (article.isPublished && !article.publishedAt) article.publishedAt = new Date();
      await article.save();
    }
    return { success: "Estado actualizado" };
  }

  if (intent === "delete") {
    await Article.findByIdAndDelete(String(form.get("id")));
    return { success: "Artículo eliminado" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminArticlesPage({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl">Artículos ({articles.length})</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} />
          Nuevo artículo
        </button>
      </div>

      {actionData && "error" in actionData && (
        <div className="px-4 py-3 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="px-4 py-3 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          {actionData.success}
        </div>
      )}

      {showCreate && (
        <div className="card p-6">
          <h3 className="font-medium mb-4">Nuevo artículo</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)} className="space-y-4">
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Slug (URL)</label>
                <input name="slug" required className="input w-full" placeholder="como-usar-cannabis" />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select name="category" className="input w-full">
                  <option value="general">General</option>
                  <option value="cultivo">Cultivo</option>
                  <option value="consumo">Consumo</option>
                  <option value="salud">Salud</option>
                  <option value="legal">Legal</option>
                  <option value="ciencia">Ciencia</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Título</label>
              <input name="title" required className="input w-full" />
            </div>
            <div>
              <label className="label">Extracto</label>
              <textarea name="excerpt" rows={2} className="input w-full !h-auto py-2" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary text-sm" disabled={navigation.state === "submitting"}>
                Crear
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost text-sm">
                Cancelar
              </button>
            </div>
          </Form>
        </div>
      )}

      <div className="card overflow-hidden">
        {articles.length === 0 && (
          <div className="p-10 text-center text-fg-dim text-sm">
            No hay artículos. Crea el primero para el blog editorial.
          </div>
        )}
        {articles.map((article, i) => (
          <div
            key={article._id}
            className={`flex items-center gap-4 px-5 py-4 ${i < articles.length - 1 ? "border-b border-line" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{article.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="mono text-xs text-fg-dim">{article.slug}</span>
                <span className="pill text-xs">{article.category}</span>
                <span className={`pill text-xs ${article.isPublished ? "accent" : ""}`}>
                  {article.isPublished ? "Publicado" : "Borrador"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Form method="post">
                <input type="hidden" name="intent" value="toggle" />
                <input type="hidden" name="id" value={article._id} />
                <button type="submit" className="btn btn-ghost !py-1.5 !px-3 text-xs">
                  {article.isPublished ? "Despublicar" : "Publicar"}
                </button>
              </Form>
              <Form method="post">
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={article._id} />
                <button
                  type="submit"
                  className="btn btn-ghost !py-1.5 !px-3 text-xs"
                  style={{ color: "var(--warm)" }}
                  onClick={(e) => { if (!confirm(`¿Eliminar "${article.title}"?`)) e.preventDefault(); }}
                >
                  <Icon name="trash" size={12} />
                </button>
              </Form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
