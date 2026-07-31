import { Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/comunidad";
import { connectDB } from "~/lib/db.server";
import { PostModel, type PostCategory } from "~/models/post.server";
import { getUserFromSession } from "~/lib/auth.server";
import { buildMeta, SITE_URL } from "~/lib/seo";

const CATEGORIES: { key: PostCategory | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "experiencias", label: "Experiencias" },
  { key: "cepas", label: "Cepas" },
  { key: "cultivo", label: "Cultivo" },
  { key: "legal", label: "Legal" },
  { key: "comunidad", label: "Comunidad" },
];

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const user = await getUserFromSession(request);
  const url = new URL(request.url);
  const cat = url.searchParams.get("cat") as PostCategory | null;
  const sort = url.searchParams.get("sort") || "new";

  const filter: Record<string, unknown> = { status: "published" };
  if (cat) filter.category = cat;

  const sortQuery: Record<string, 1 | -1> =
    sort === "top" ? { upvoteCount: -1, createdAt: -1 } : { createdAt: -1 };

  const posts = await PostModel.find(filter)
    .sort(sortQuery)
    .limit(40)
    .populate("userId", "username anonymousHandle")
    .populate("strainId", "name slug")
    .lean();

  return {
    user: user ? { _id: String(user._id), username: user.username } : null,
    posts: posts.map((p) => {
      const u = p.userId as any;
      const strain = p.strainId as any;
      const handle =
        p.publishedAs === "anonymous"
          ? u?.anonymousHandle || "Anónimo"
          : u?.username || "Usuario";
      return {
        _id: String(p._id),
        slug: p.slug,
        title: p.title,
        category: p.category,
        upvoteCount: p.upvoteCount,
        commentCount: p.commentCount,
        publishedAs: p.publishedAs,
        handle,
        strainName: strain?.name || null,
        strainSlug: strain?.slug || null,
        createdAt: (p.createdAt as Date).toISOString(),
      };
    }),
    activecat: cat || "todos",
    sort,
  };
}

export function meta(): ReturnType<Route.MetaFunction> {
  return buildMeta({
    title: "Comunidad WeedHub — Foros de Cannabis en Español",
    description:
      "Discusiones sobre cannabis: experiencias, cepas, cultivo, legislación y comunidad. La conversación más honesta en español.",
    url: `${SITE_URL}/comunidad`,
    canonicalPath: "/comunidad",
    locale: "es",
  });
}

export default function ComunidadPage() {
  const { user, posts, activecat, sort } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="flex items-start justify-between mb-10 gap-4">
        <div>
          <div className="kicker mb-2">Comunidad</div>
          <h1 className="display text-4xl mb-2">Foros WeedHub</h1>
          <p className="text-fg-muted max-w-lg">
            Discusiones sobre cannabis en español — sin censura moralista, con respeto.
          </p>
        </div>
        {user ? (
          <Link to="/comunidad/nuevo" className="btn btn-primary shrink-0">
            + Nuevo post
          </Link>
        ) : (
          <Link to="/auth" className="btn btn-ghost shrink-0">
            Entrar para participar
          </Link>
        )}
      </div>

      {/* Tabs de categoría */}
      <div className="flex items-center gap-1 flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setParam("cat", c.key)}
            className="pill text-sm transition-colors"
            style={
              activecat === c.key
                ? { background: "var(--accent-soft)", color: "var(--accent)" }
                : {}
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-8 border-b border-line pb-4">
        <span className="text-xs text-fg-dim">Ordenar:</span>
        {[
          { value: "new", label: "Más recientes" },
          { value: "top", label: "Más votados" },
        ].map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setParam("sort", o.value)}
            className={`text-sm transition-colors ${
              sort === o.value ? "text-fg font-medium" : "text-fg-muted hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Lista de posts */}
      {posts.length === 0 ? (
        <div className="py-24 text-center text-fg-dim">
          <p className="text-lg mb-2">Todavía no hay posts en esta categoría</p>
          {user ? (
            <Link to="/comunidad/nuevo" className="btn btn-primary mt-6 inline-block">
              Ser el primero en publicar
            </Link>
          ) : (
            <Link to="/auth" className="btn btn-ghost mt-6 inline-block">
              Unirme a la comunidad
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {posts.map((post) => (
            <PostRow key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  cultivo: "warm",
  experiencias: "accent",
  cepas: "lilac",
  legal: "",
  comunidad: "",
};

function PostRow({
  post,
}: {
  post: {
    _id: string;
    slug: string;
    title: string;
    category: string;
    upvoteCount: number;
    commentCount: number;
    handle: string;
    publishedAs: string;
    strainName: string | null;
    strainSlug: string | null;
    createdAt: string;
  };
}) {
  const date = new Date(post.createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      to={`/comunidad/${post.slug}`}
      className="card group flex items-start gap-4 px-5 py-4 hover:border-line-strong transition-all"
    >
      {/* Upvotes */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[36px] pt-0.5">
        <span className="text-xs text-fg-dim">▲</span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: post.upvoteCount > 0 ? "var(--accent)" : undefined }}
        >
          {post.upvoteCount}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`pill text-xs ${CAT_COLORS[post.category] || ""}`}>
            {post.category}
          </span>
          {post.strainName && (
            <span className="pill lilac text-xs">{post.strainName}</span>
          )}
        </div>
        <div className="font-medium leading-snug group-hover:text-accent transition-colors">
          {post.title}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-fg-dim flex-wrap">
          <span>
            {post.publishedAs === "anonymous" ? "👤" : "@"}{post.handle}
          </span>
          <span>{date}</span>
          <span>💬 {post.commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
