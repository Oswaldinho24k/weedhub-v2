import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.community";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { PostModel } from "~/models/post.server";
import { CommentModel } from "~/models/comment.server";
import { Icon } from "~/components/ui/icon";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();

  const [posts, commentCount] = await Promise.all([
    PostModel.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "username")
      .lean(),
    CommentModel.countDocuments({ status: "published" }),
  ]);

  return {
    posts: posts.map((p) => ({
      _id: String(p._id),
      slug: p.slug,
      title: p.title,
      category: p.category,
      status: p.status,
      upvoteCount: p.upvoteCount,
      commentCount: p.commentCount,
      publishedAs: p.publishedAs,
      username: (p.userId as any)?.username || "—",
      createdAt: (p.createdAt as Date).toISOString(),
    })),
    commentCount,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id"));

  if (intent === "remove-post") {
    await PostModel.findByIdAndUpdate(id, { status: "removed" });
    return { success: "Post eliminado" };
  }
  if (intent === "restore-post") {
    await PostModel.findByIdAndUpdate(id, { status: "published" });
    return { success: "Post restaurado" };
  }
  if (intent === "delete-post") {
    await CommentModel.deleteMany({ postId: id });
    await PostModel.findByIdAndDelete(id);
    return { success: "Post y comentarios eliminados permanentemente" };
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
                className="btn btn-ghost !py-1.5 !px-3 text-xs"
              >
                Ver
              </a>
              {post.status === "published" ? (
                <Form method="post">
                  <input type="hidden" name="intent" value="remove-post" />
                  <input type="hidden" name="id" value={post._id} />
                  <button type="submit" className="btn btn-ghost !py-1.5 !px-3 text-xs" style={{ color: "var(--warm)" }}>
                    Eliminar
                  </button>
                </Form>
              ) : (
                <Form method="post">
                  <input type="hidden" name="intent" value="restore-post" />
                  <input type="hidden" name="id" value={post._id} />
                  <button type="submit" className="btn btn-ghost !py-1.5 !px-3 text-xs">
                    Restaurar
                  </button>
                </Form>
              )}
              <Form method="post">
                <input type="hidden" name="intent" value="delete-post" />
                <input type="hidden" name="id" value={post._id} />
                <button
                  type="submit"
                  className="btn btn-ghost !py-1.5 !px-3 text-xs"
                  style={{ color: "var(--warm)" }}
                  onClick={(e) => { if (!confirm("¿Eliminar permanentemente post y todos sus comentarios?")) e.preventDefault(); }}
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
