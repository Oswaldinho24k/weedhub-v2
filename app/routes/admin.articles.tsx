import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.articles";
import { requireAdmin } from "~/lib/auth.server";
import type { ArticleCategory } from "~/models/article.server";
import { listArticles, createArticle, updateArticle, setArticlePublished, deleteArticle, draftArticle } from "~/services/articles.server";
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";

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
  const articles = await listArticles({ limit: 100 });
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
      publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : null,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
    })) as SerializedArticle[],
  };
}

// HTTP adapter only: all logic lives in services/articles.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  const by = user.username;
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id") || "");
  const field = (k: string) => (form.has(k) ? String(form.get(k)) : undefined);
  const fields = () => ({
    title: field("title"),
    excerpt: field("excerpt"),
    body: field("body"),
    coverImage: field("coverImage"),
    category: field("category"),
    locale: field("locale"),
    tags: field("tags"),
    authorName: field("authorName"),
    authorRole: field("authorRole"),
    metaTitle: field("metaTitle"),
    metaDescription: field("metaDescription"),
  });

  if (intent === "create") {
    const r = await createArticle({ slug: field("slug"), ...fields() }, { actor: "admin", by });
    return r.ok ? { success: "Artículo creado como borrador" } : { error: r.error };
  }
  if (intent === "ai-draft") {
    const r = await draftArticle({ title: field("title") ?? "", brief: field("brief") ?? "", notes: field("notes"), category: field("category") || undefined });
    return r.ok ? { success: `Borrador creado (${r.slug}), pendiente de revisión. Revísalo en /admin/revision?c=articulos` } : { error: r.error };
  }
  if (intent === "edit") {
    const r = await updateArticle(id, fields(), "admin", by);
    return r.ok ? { success: "Artículo actualizado" } : { error: r.error };
  }
  if (intent === "publish") {
    const r = await setArticlePublished(id);
    return r.ok ? { success: r.status === "published" ? "Artículo publicado" : "Artículo regresado a borrador" } : { error: r.error };
  }
  if (intent === "delete") {
    const r = await deleteArticle(id);
    return r.ok ? { success: "Artículo eliminado" } : { error: r.error };
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
          <Button variant="primary" onClick={() => setMode("create")}>
            <Icon name="plus" size={14} />
            Nuevo artículo
          </Button>
        )}
        {mode !== "list" && (
          <Button variant="ghost" onClick={resetMode}>
            ← Volver
          </Button>
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

      {/* AI draft: same service the agent uses (draftArticle) */}
      {mode === "list" && (
        <Form method="post" className="card p-4 flex flex-wrap items-end gap-3 bg-yellow/30">
          <input type="hidden" name="intent" value="ai-draft" />
          <label className="flex-1 min-w-[200px]">
            <span className="label">Borrador con IA: título</span>
            <input name="title" required placeholder="Ej. ¿Qué es el rosin y cómo se hace?" className="input w-full" />
          </label>
          <label className="w-40">
            <span className="label">Categoría</span>
            <select name="category" defaultValue="" className="input w-full">
              <option value="">Que la IA elija</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="basis-full">
            <span className="label">Brief (de qué trata y qué debe responder)</span>
            <textarea name="brief" required rows={2} className="input w-full !h-auto py-2" placeholder="Ej. explicar qué es, cómo se diferencia de otros extractos y qué cuidar al comprarlo" />
          </label>
          <label className="flex-1 min-w-[220px]">
            <span className="label">Notas y datos (opcional)</span>
            <input name="notes" placeholder="Datos que sí quieres que use; la IA no inventa cifras ni leyes" className="input w-full" />
          </label>
          <Button type="submit" variant="primary" disabled={submitting}>
            <Icon name="sparkle" size={14} /> {submitting ? "Redactando..." : "Crear borrador"}
          </Button>
          <p className="basis-full text-xs font-semibold text-fg-muted">Se guarda como borrador, pendiente de revisión, firmado por Redacción WeedHub. Lo revisas en Revisión y lo publicas aquí.</p>
        </Form>
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
                <Button
                  type="button"
                  onClick={() => openEdit(article)}
                  variant="ghost"
                  size="sm"
                >
                  <Icon name="edit" size={12} />
                  Editar
                </Button>
                <Form method="post">
                  <input type="hidden" name="intent" value="publish" />
                  <input type="hidden" name="id" value={article._id} />
                  <Button type="submit" variant="ghost" size="sm">
                    {article.status === "published" ? "Despublicar" : "Publicar"}
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={article._id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    style={{ color: "var(--warm)" }}
                    onClick={(e) => {
                      if (!confirm(`¿Eliminar "${article.title}"?`)) e.preventDefault();
                    }}
                  >
                    <Icon name="trash" size={12} />
                  </Button>
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
          <Button type="submit" variant="primary" className="text-sm" disabled={submitting}>
            {submitting ? "Guardando..." : intent === "create" ? "Crear borrador" : "Guardar cambios"}
          </Button>
          <Button type="button" onClick={onCancel} variant="ghost" className="text-sm">
            Cancelar
          </Button>
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
