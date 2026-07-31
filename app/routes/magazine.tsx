import { Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/magazine";
import { connectDB } from "~/lib/db.server";
import { ArticleModel, type ArticleCategory } from "~/models/article.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  cepa: "Cepas",
  producto: "Productos",
  metodos: "Métodos",
  legal: "Legal",
  cultura: "Cultura",
  ciencia: "Ciencia",
  entrevista: "Entrevistas",
};

export async function loader({ request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  await connectDB();
  const url = new URL(request.url);
  const category = url.searchParams.get("cat") as ArticleCategory | null;

  const filter: Record<string, unknown> = { status: "published" };
  if (category && CATEGORY_LABELS[category]) filter.category = category;

  const articles = await ArticleModel.find(filter)
    .sort({ publishedAt: -1 })
    .limit(48)
    .lean()
    .select("slug title excerpt coverImage category author publishedAt tags");

  return {
    locale,
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      coverImage: a.coverImage || null,
      category: a.category,
      authorName: a.author?.name || "WeedHub",
      publishedAt: a.publishedAt?.toISOString() || null,
      tags: a.tags || [],
    })),
    activeCategory: category,
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "Magazine | WeedHub" }];
  return buildMeta({
    title: "Magazine — WeedHub | Cannabis en español",
    description:
      "Artículos sobre cepas, cultivo, métodos de consumo, legislación y cultura cannabis en México y Latinoamérica.",
    url: "https://www.weedhub.info/magazine",
    canonicalPath: "/magazine",
    locale: data.locale,
  });
}

export default function MagazinePage() {
  const { articles, activeCategory } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function setCategory(cat: string | null) {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set("cat", cat);
    else next.delete("cat");
    setSearchParams(next);
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "WeedHub Magazine",
    description: "Artículos sobre cannabis: cepas, cultivo, métodos, ciencia y cultura en español.",
    url: `${SITE_URL}/magazine`,
    publisher: { "@type": "Organization", name: "WeedHub", url: SITE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-10">
        <div className="kicker mb-2">Magazine</div>
        <h1 className="display text-4xl mb-3">WeedHub Magazine</h1>
        <p className="text-fg-muted max-w-xl">
          Artículos sobre cannabis: cepas, cultivo, métodos, ciencia y cultura en español.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-10">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className="pill"
          style={
            !activeCategory
              ? { background: "var(--accent-soft)", color: "var(--accent)" }
              : {}
          }
        >
          Todos
        </button>
        {(Object.entries(CATEGORY_LABELS) as [ArticleCategory, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className="pill"
            style={
              activeCategory === key
                ? { background: "var(--accent-soft)", color: "var(--accent)" }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="py-24 text-center text-fg-dim">
          <p className="text-lg mb-2">No hay artículos publicados aún</p>
          <p className="text-sm">Vuelve pronto — estamos trabajando en ello.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-line flex items-center gap-4">
        <a
          href="/magazine.rss"
          className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <span className="pill warm text-xs">RSS</span>
          Feed RSS
        </a>
      </div>
    </div>
    </>
  );
}

function ArticleCard({
  article,
}: {
  article: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string | null;
    category: ArticleCategory;
    authorName: string;
    publishedAt: string | null;
    tags: string[];
  };
}) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      to={`/magazine/${article.slug}`}
      className="card group flex flex-col overflow-hidden hover:border-line-strong transition-all"
    >
      {article.coverImage ? (
        <div className="aspect-[16/9] overflow-hidden bg-elev">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className="aspect-[16/9] flex items-center justify-center"
          style={{ background: "var(--bg-elev)" }}
        >
          <span className="text-4xl opacity-40">📝</span>
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="pill text-xs">{CATEGORY_LABELS[article.category]}</span>
          {date && <span className="text-xs text-fg-dim">{date}</span>}
        </div>
        <h2 className="font-semibold leading-snug group-hover:text-accent transition-colors">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-sm text-fg-muted line-clamp-3 leading-relaxed flex-1">
            {article.excerpt}
          </p>
        )}
        <div className="text-xs text-fg-dim mt-auto pt-2">Por {article.authorName}</div>
      </div>
    </Link>
  );
}
