import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.community";
import { requireAdmin } from "~/lib/auth.server";
import { listPosts, removePost, restorePost, deletePost } from "~/services/moderation.server";
import { Icon } from "~/components/ui/icon";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const includeSeed = new URL(request.url).searchParams.get("includeSeed") === "1";
  return listPosts({ limit: 50, includeSeed });
}

// HTTP adapter only: all logic lives in services/moderation.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id"));

  if (intent === "remove-post") {
    const r = await removePost(id);
    return r.ok ? { success: "Post eliminado" } : { error: r.error };
  }
  if (intent === "restore-post") {
    const r = await restorePost(id);
    return r.ok ? { success: "Post restaurado" } : { error: r.error };
  }
  if (intent === "delete-post") {
    const r = await deletePost(id);
    return r.ok ? { success: "Post y comentarios eliminados permanentemente" } : { error: r.error };
  }

  return { error: "Intent desconocido" };
}

export default function AdminCommunityPage({ loaderData }: Route.ComponentProps) {
  const { posts, commentCount } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl">Comunidad</h2>
        <div className="flex items-center gap-4 text-sm text-fg-dim">
          <span>{posts.length} posts</span>
          <span>{commentCount} comentarios</span>
        </div>
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

      <div className="card overflow-hidden">
        {posts.length === 0 && (
          <div className="p-10 text-center text-fg-dim text-sm">No hay posts todavía.</div>
        )}
        {posts.map((post, i) => (
          <div
            key={post._id}
            className={`flex items-start gap-4 px-5 py-4 ${i < posts.length - 1 ? "border-b border-line" : ""} ${post.status === "removed" ? "opacity-50" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{post.title}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-fg-dim flex-wrap">
                <span className="pill text-xs">{post.category}</span>
                <span>@{post.username}</span>
                <span>▲ {post.upvoteCount}</span>
                <span>💬 {post.commentCount}</span>
                <span>{new Date(post.createdAt).toLocaleDateString("es-MX")}</span>
                {post.status === "removed" && (
                  <span className="pill warm text-xs">Eliminado</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/comunidad/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Ver
              </a>
              {post.status === "published" ? (
                <Form method="post">
                  <input type="hidden" name="intent" value="remove-post" />
                  <input type="hidden" name="id" value={post._id} />
                  <Button type="submit" variant="ghost" size="sm" style={{ color: "var(--warm)" }}>
                    Eliminar
                  </Button>
                </Form>
              ) : (
                <Form method="post">
                  <input type="hidden" name="intent" value="restore-post" />
                  <input type="hidden" name="id" value={post._id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Restaurar
                  </Button>
                </Form>
              )}
              <Form method="post">
                <input type="hidden" name="intent" value="delete-post" />
                <input type="hidden" name="id" value={post._id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  style={{ color: "var(--warm)" }}
                  onClick={(e) => { if (!confirm("¿Eliminar permanentemente post y todos sus comentarios?")) e.preventDefault(); }}
                >
                  <Icon name="trash" size={12} />
                </Button>
              </Form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
