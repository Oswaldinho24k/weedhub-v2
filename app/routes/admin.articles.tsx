import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.articles";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ArticleModel, type ArticleCategory } from "~/models/article.server";
import { Icon } from "~/components/ui/icon";

const CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: "cepa", label: "Cepa" },
  { value: "producto", label: "Producto" },
  { value: "metodos", label: "Métodos" },
  { value: "legal", label: "Legal" },
  { value: "cultura", label: "Cultura" },
  { value: "ciencia", label: "Ciencia" },
  { value: "entrevista", label: "Entrevista" },
];

type SerializedArticle = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  category: ArticleCategory;
  status: "draft" | "published" | "archived";
  authorName: string;
  authorRole: string;
  locale: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string | null;
  createdAt: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const articles = await ArticleModel.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return {
    articles: articles.map((a) => ({
      _id: String(a._id),
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      body: a.body,
      coverImage: a.coverImage || "",
      category: a.category,
      status: a.status,
      authorName: a.author?.name || "",
      authorRole: a.author?.role || "",
      locale: a.locale,
      tags: (a.tags || []).join(", "),
      metaTitle: a.metaTitle || "",
      metaDescription: a.metaDescription || "",
      publishedAt: a.publishedAt?.toISOString() || null,
      createdAt: (a.createdAt as Date)?.toISOString(),
    })) as SerializedArticle[],
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = String(form.get("intent"));

  const parseArticleFields = () => ({
    slug: String(form.get("slug") || "")
      .toLowerCase()
      .trim(),
    title: String(form.get("title") || "").trim(),
    excerpt: String(form.get("excerpt") || "").trim(),
    body: String(form.get("body") || "").trim(),
    coverImage: String(form.get("coverImage") || "").trim(),
    category: String(form.get("category") || "cultura") as ArticleCategory,
    locale: String(form.get("locale") || "es"),
    tags: String(form.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    author: {
      name: String(form.get("authorName") || "WeedHub").trim(),
      role: String(form.get("authorRole") || "").trim(),
    },
    metaTitle: String(form.get("metaTitle") || "").trim(),
    metaDescription: String(form.get("metaDescription") || "").trim(),
  });

  if (intent === "create") {
    const fields = parseArticleFields();
    if (!fields.slug || !fields.title || !fields.body)
      return { error: "Slug, título y cuerpo son requeridos" };
    const existing = await ArticleModel.findOne({ slug: fields.slug });
    if (existing) return { error: `El slug "${fields.slug}" ya existe` };
    await ArticleModel.create({ ...fields, status: "draft" });
    return { success: "Artículo creado como borrador" };
  }

  if (intent === "edit") {
    const id = String(form.get("id"));
    const fields = parseArticleFields();
    if (!fields.title || !fields.body)
      return { error: "Título y cuerpo son requeridos" };
    await ArticleModel.findByIdAndUpdate(id, fields);
    return { success: "Artículo actualizado" };
  }

  if (intent === "publish") {
    const id = String(form.get("id"));
    const article = await ArticleModel.findById(id);
    if (article) {
      article.status = article.status === "published" ? "draft" : "published";
      if (article.status === "published" && !article.publishedAt)
        article.publishedAt = new Date();
      await article.save();
    }
    return { success: "Estado actualizado" };
  }

  if (intent === "delete") {
    await ArticleModel.findByIdAndDelete(String(form.get("id")));
    return { success: "Artículo eliminado" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminArticlesPage({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editArticle, setEditArticle] = useState<SerializedArticle | null>(null);

  function openEdit(article: SerializedArticle) {
    setEditArticle(article);
    setMode("edit");
  }

  function resetMode() {
    setMode("list");
    setEditArticle(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl">
          Artículos ({articles.length})
        </h2>
        {mode === "list" && (
          <button className="btn btn-primary" onClick={() => setMode("create")}>
            <Icon name="plus" size={14} />
            Nuevo artículo
          </button>
        )}
        {mode !== "list" && (
          <button className="btn btn-ghost" onClick={resetMode}>
            ← Volver
          </button>
        )}
      </div>

      {actionData && "error" in actionData && (
        <div
          className="px-4 py-3 rounded text-sm"
          style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
        >
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div
          className="px-4 py-3 rounded text-sm"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {actionData.success}
        </div>
      )}

      {(mode === "create" || mode === "edit") && (
        <ArticleForm
          intent={mode === "create" ? "create" : "edit"}
          article={editArticle}
          submitting={submitting}
          onCancel={resetMode}
        />
      )}

      {mode === "list" && (
        <div className="card overflow-hidden">
          {articles.length === 0 && (
            <div className="p-10 text-center text-fg-dim text-sm">
              No hay artículos. Crea el primero para el blog.
            </div>
          )}
          {articles.map((article, i) => (
            <div
              key={article._id}
              className={`flex items-center gap-4 px-5 py-4 ${i < articles.length - 1 ? "border-b border-line" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{article.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="mono text-xs text-fg-dim">{article.slug}</span>
                  <span className="pill text-xs">{article.category}</span>
                  <span className="pill text-xs">{article.locale}</span>
                  <span
                    className={`pill text-xs ${article.status === "published" ? "accent" : ""}`}
                  >
                    {article.status === "published"
                      ? "Publicado"
                      : article.status === "archived"
                        ? "Archivado"
                        : "Borrador"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(article)}
                  className="btn btn-ghost !py-1.5 !px-3 text-xs"
                >
                  <Icon name="edit" size={12} />
                  Editar
                </button>
                <Form method="post">
                  <input type="hidden" name="intent" value="publish" />
                  <input type="hidden" name="id" value={article._id} />
                  <button type="submit" className="btn btn-ghost !py-1.5 !px-3 text-xs">
                    {article.status === "published" ? "Despublicar" : "Publicar"}
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={article._id} />
                  <button
                    type="submit"
                    className="btn btn-ghost !py-1.5 !px-3 text-xs"
                    style={{ color: "var(--warm)" }}
                    onClick={(e) => {
                      if (!confirm(`¿Eliminar "${article.title}"?`)) e.preventDefault();
                    }}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </Form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleForm({
  intent,
  article,
  submitting,
  onCancel,
}: {
  intent: "create" | "edit";
  article: SerializedArticle | null;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const [bodyVal, setBodyVal] = useState(article?.body || "");

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-6 text-lg">
        {intent === "create" ? "Nuevo artículo" : `Editando: ${article?.title}`}
      </h3>
      <Form method="post" className="space-y-5">
        <input type="hidden" name="intent" value={intent} />
        {intent === "edit" && article && (
          <input type="hidden" name="id" value={article._id} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Slug (URL) *</label>
            <input
              name="slug"
              required={intent === "create"}
              defaultValue={article?.slug || ""}
              readOnly={intent === "edit"}
              className="input w-full"
              placeholder="como-usar-cannabis"
            />
          </div>
          <div>
            <label className="label">Locale</label>
            <select name="locale" defaultValue={article?.locale || "es"} className="input w-full">
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Título *</label>
          <input
            name="title"
            required
            defaultValue={article?.title || ""}
            className="input w-full"
          />
        </div>

        <div>
          <label className="label">Extracto</label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={article?.excerpt || ""}
            className="input w-full !h-auto py-2"
            placeholder="Descripción corta del artículo (se usa en cards y SEO)"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Cuerpo (Markdown) *</label>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="text-xs text-fg-dim hover:text-fg transition-colors"
            >
              {preview ? "← Editar" : "Vista previa"}
            </button>
          </div>
          {!preview ? (
            <textarea
              name="body"
              required
              rows={20}
              value={bodyVal}
              onChange={(e) => setBodyVal(e.target.value)}
              className="input w-full !h-auto py-3 font-mono text-sm"
              placeholder="# Título&#10;&#10;Escribe en **Markdown**..."
            />
          ) : (
            <div
              className="card p-6 prose prose-sm max-w-none min-h-[200px]"
              style={{ color: "var(--fg)" }}
            >
              <MarkdownPreview content={bodyVal} />
              <input type="hidden" name="body" value={bodyVal} />
            </div>
          )}
        </div>

        <div>
          <label className="label">Cover image URL</label>
          <input
            name="coverImage"
            type="url"
            defaultValue={article?.coverImage || ""}
            className="input w-full"
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Categoría</label>
            <select
              name="category"
              defaultValue={article?.category || "cultura"}
              className="input w-full"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tags (separados por coma)</label>
            <input
              name="tags"
              defaultValue={article?.tags || ""}
              className="input w-full"
              placeholder="cultivo, indoor, cosecha"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Autor (nombre)</label>
            <input
              name="authorName"
              defaultValue={article?.authorName || "WeedHub"}
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Cargo del autor</label>
            <input
              name="authorRole"
              defaultValue={article?.authorRole || ""}
              className="input w-full"
              placeholder="Editor WeedHub"
            />
          </div>
        </div>

        <div className="border-t border-line pt-5 space-y-4">
          <div className="kicker">SEO overrides (opcionales)</div>
          <div>
            <label className="label">Meta título</label>
            <input
              name="metaTitle"
              defaultValue={article?.metaTitle || ""}
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Meta descripción</label>
            <textarea
              name="metaDescription"
              rows={2}
              defaultValue={article?.metaDescription || ""}
              className="input w-full !h-auto py-2"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
            {submitting ? "Guardando..." : intent === "create" ? "Crear borrador" : "Guardar cambios"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-ghost text-sm">
            Cancelar
          </button>
        </div>
      </Form>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-6 mb-4">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc pl-5 space-y-1 my-3">
          {items.map((item, j) => (
            <li key={j} className="text-sm">
              {item}
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed my-2">
          {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      );
    }
    i++;
  }

  return <>{elements}</>;
}
