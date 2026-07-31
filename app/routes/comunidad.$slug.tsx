import { Form, Link, useLoaderData, useActionData, useFetcher, useNavigation } from "react-router";
import type { Route } from "./+types/comunidad.$slug";
import { connectDB } from "~/lib/db.server";
import { PostModel } from "~/models/post.server";
import { CommentModel } from "~/models/comment.server";
import { getUserFromSession } from "~/lib/auth.server";
import { buildMeta, SITE_URL } from "~/lib/seo";

export async function loader({ request, params }: Route.LoaderArgs) {
  await connectDB();
  const user = await getUserFromSession(request);

  const post = await PostModel.findOne({ slug: params.slug, status: "published" })
    .populate("userId", "username anonymousHandle")
    .populate("strainId", "name slug type")
    .lean();

  if (!post) throw new Response("Not Found", { status: 404 });

  const comments = await CommentModel.find({ postId: post._id, status: "published" })
    .sort({ createdAt: 1 })
    .populate("userId", "username anonymousHandle")
    .lean();

  const userId = user ? String(user._id) : null;
  const u = post.userId as any;
  const strain = post.strainId as any;

  return {
    user: user ? { _id: userId!, username: user.username, anonymousHandle: user.anonymousHandle } : null,
    post: {
      _id: String(post._id),
      slug: post.slug,
      title: post.title,
      body: post.body,
      category: post.category,
      upvoteCount: post.upvoteCount,
      commentCount: post.commentCount,
      publishedAs: post.publishedAs,
      handle:
        post.publishedAs === "anonymous"
          ? u?.anonymousHandle || "Anónimo"
          : u?.username || "Usuario",
      hasVoted: userId ? post.upvotes.map(String).includes(userId) : false,
      strainName: strain?.name || null,
      strainSlug: strain?.slug || null,
      strainType: strain?.type || null,
      createdAt: (post.createdAt as Date).toISOString(),
    },
    comments: comments.map((c) => {
      const cu = c.userId as any;
      return {
        _id: String(c._id),
        body: c.body,
        upvoteCount: c.upvoteCount,
        publishedAs: c.publishedAs,
        handle:
          c.publishedAs === "anonymous"
            ? cu?.anonymousHandle || "Anónimo"
            : cu?.username || "Usuario",
        hasVoted: userId ? c.upvotes.map(String).includes(userId) : false,
        createdAt: (c.createdAt as Date).toISOString(),
      };
    }),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await connectDB();
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "comment") {
    const { requireUser } = await import("~/lib/auth.server");
    const user = await requireUser(request);
    const body = String(form.get("body") || "").trim();
    const publishedAs = String(form.get("publishedAs") || "username") as "username" | "anonymous";

    if (!body) return { error: "El comentario no puede estar vacío" };
    if (body.length > 2000) return { error: "El comentario no puede superar 2000 caracteres" };

    const post = await PostModel.findOne({ slug: params.slug }).lean().select("_id");
    if (!post) throw new Response("Not Found", { status: 404 });

    await CommentModel.create({
      postId: post._id,
      userId: user._id,
      body,
      publishedAs,
    });

    await PostModel.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });

    return { success: "Comentario publicado" };
  }

  return { error: "Intent desconocido" };
}

export function meta({ data }: Route.MetaArgs): ReturnType<Route.MetaFunction> {
  if (!data) return [{ title: "Post — WeedHub Comunidad" }];
  return buildMeta({
    title: `${data.post.title} | WeedHub Comunidad`,
    description: data.post.body.slice(0, 160),
    url: `${SITE_URL}/comunidad/${data.post.slug}`,
    canonicalPath: `/comunidad/${data.post.slug}`,
    locale: "es",
  });
}

const CAT_COLORS: Record<string, string> = {
  cultivo: "warm",
  experiencias: "accent",
  cepas: "lilac",
  legal: "",
  comunidad: "",
};

const TYPE_COLORS: Record<string, string> = {
  indica: "lilac",
  sativa: "accent",
  hybrid: "warm",
};

export default function ComunidadSlugPage() {
  const { user, post, comments } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const voteFetcher = useFetcher();
  const submitting = navigation.state === "submitting";

  const date = new Date(post.createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>›</span>
        <Link to="/comunidad" className="hover:text-fg transition-colors">Comunidad</Link>
        <span>›</span>
        <Link
          to={`/comunidad?cat=${post.category}`}
          className="hover:text-fg transition-colors capitalize"
        >
          {post.category}
        </Link>
      </div>

      {/* Post */}
      <article className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`pill text-xs ${CAT_COLORS[post.category] || ""}`}>
            {post.category}
          </span>
          {post.strainName && post.strainSlug && (
            <Link to={`/strains/${post.strainSlug}`} className={`pill text-xs ${TYPE_COLORS[post.strainType || ""] || ""}`}>
              {post.strainName}
            </Link>
          )}
          <span className="text-xs text-fg-dim ml-auto">{date}</span>
        </div>

        <h1 className="display text-2xl md:text-3xl mb-4 leading-tight">{post.title}</h1>

        <div className="text-sm text-fg-dim mb-6">
          {post.publishedAs === "anonymous" ? "👤" : "@"}{post.handle}
        </div>

        <div className="text-fg-muted leading-relaxed whitespace-pre-wrap border-t border-line pt-6">
          {post.body}
        </div>

        {/* Vote */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-line">
          <voteFetcher.Form method="post" action={`/api/posts/${post._id}/vote`}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm rounded-lg px-3 py-1.5 transition-colors border"
              style={
                post.hasVoted
                  ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)" }
                  : { borderColor: "var(--line)", color: "var(--fg-muted)" }
              }
            >
              ▲ {post.upvoteCount}
            </button>
          </voteFetcher.Form>
          <span className="text-sm text-fg-dim">
            💬 {post.commentCount} {post.commentCount === 1 ? "comentario" : "comentarios"}
          </span>
          <Link to="/comunidad" className="text-xs text-fg-dim hover:text-fg ml-auto transition-colors">
            ← Volver
          </Link>
        </div>
      </article>

      {/* Comentarios */}
      <section>
        <div className="kicker mb-4">
          {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
        </div>

        {comments.length > 0 && (
          <div className="space-y-3 mb-8">
            {comments.map((c) => (
              <CommentCard key={c._id} comment={c} />
            ))}
          </div>
        )}

        {/* Form de comentario */}
        {user ? (
          <div className="card p-5">
            <div className="kicker mb-4">Añadir comentario</div>

            {actionData && "error" in actionData && (
              <div
                className="px-3 py-2 rounded text-sm mb-4"
                style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
              >
                {actionData.error}
              </div>
            )}
            {actionData && "success" in actionData && (
              <div
                className="px-3 py-2 rounded text-sm mb-4"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {actionData.success}
              </div>
            )}

            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="comment" />
              <textarea
                name="body"
                required
                rows={4}
                maxLength={2000}
                className="input w-full !h-auto py-3"
                placeholder="Escribe tu comentario..."
              />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="publishedAs"
                      value="username"
                      defaultChecked
                      className="accent-[color:var(--accent)]"
                    />
                    <span>@{user.username}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="publishedAs"
                      value="anonymous"
                      className="accent-[color:var(--accent)]"
                    />
                    <span>{user.anonymousHandle}</span>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                  {submitting ? "Publicando..." : "Comentar"}
                </button>
              </div>
            </Form>
          </div>
        ) : (
          <div className="card p-5 text-center">
            <p className="text-sm text-fg-muted mb-3">Inicia sesión para comentar</p>
            <Link to="/auth" className="btn btn-primary text-sm">
              Entrar
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function CommentCard({
  comment,
}: {
  comment: {
    _id: string;
    body: string;
    upvoteCount: number;
    publishedAs: string;
    handle: string;
    hasVoted: boolean;
    createdAt: string;
  };
}) {
  const voteFetcher = useFetcher();
  const date = new Date(comment.createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2 text-xs text-fg-dim">
        <span>{comment.publishedAs === "anonymous" ? "👤" : "@"}{comment.handle}</span>
        <span>·</span>
        <span>{date}</span>
      </div>
      <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-wrap">{comment.body}</p>
      <div className="mt-3 pt-2 border-t border-line">
        <voteFetcher.Form method="post" action={`/api/comments/${comment._id}/vote`}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs transition-colors rounded-md px-2 py-1 border"
            style={
              comment.hasVoted
                ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)" }
                : { borderColor: "transparent", color: "var(--fg-dim)" }
            }
          >
            ▲ {comment.upvoteCount}
          </button>
        </voteFetcher.Form>
      </div>
    </div>
  );
}
