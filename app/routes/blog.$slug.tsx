import { Link, useLoaderData } from "react-router";
import { marked } from "marked";
import type { Route } from "./+types/blog.$slug";
import { connectDB } from "~/lib/db.server";
import { ArticleModel } from "~/models/article.server";
import { StrainModel } from "~/models/strain.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";
import { NewsletterSignup } from "~/components/layout/newsletter-signup";

marked.setOptions({ breaks: true });

export async function loader({ request, params }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  await connectDB();

  const article = await ArticleModel.findOne({ slug: params.slug, status: "published" })
    .populate("relatedStrains", "name slug type")
    .lean();

  if (!article) throw new Response("Not Found", { status: 404 });

  await ArticleModel.updateOne({ _id: article._id }, { $inc: { viewCount: 1 } });

  const bodyHtml = await marked.parse(article.body || "");

  return {
    locale,
    article: {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      bodyHtml,
      coverImage: article.coverImage || null,
      category: article.category,
      authorName: article.author?.name || "WeedHub",
      authorRole: article.author?.role || null,
      authorAvatar: article.author?.avatar || null,
      locale: article.locale,
      tags: article.tags || [],
      metaTitle: article.metaTitle || null,
      metaDescription: article.metaDescription || null,
      publishedAt: article.publishedAt?.toISOString() || null,
      updatedAt: (article.updatedAt as Date)?.toISOString(),
      relatedStrains: (article.relatedStrains as any[]).map((s) => ({
        slug: s.slug,
        name: s.name,
        type: s.type,
      })),
    },
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "Artículo | WeedHub" }];
  const { article, locale } = data;
  return buildMeta({
    title: article.metaTitle || `${article.title} | WeedHub`,
    description:
      article.metaDescription || article.excerpt || "Lee este artículo en WeedHub.",
    url: `${SITE_URL}/blog/${article.slug}`,
    image: article.coverImage || undefined,
    type: "article",
    canonicalPath: `/blog/${article.slug}`,
    locale,
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  cepa: "Cepas",
  producto: "Productos",
  metodos: "Métodos",
  legal: "Legal",
  cultura: "Cultura",
  ciencia: "Ciencia",
  entrevista: "Entrevistas",
};

const TYPE_COLORS: Record<string, string> = {
  indica: "lilac",
  sativa: "accent",
  hybrid: "warm",
};

export default function BlogSlugPage() {
  const { article } = useLoaderData<typeof loader>();
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WeedHub", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: `${SITE_URL}/blog/${article.slug}`,
          },
        ],
      },
      {
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        image: article.coverImage || undefined,
        author: {
          "@type": "Person",
          name: article.authorName,
          jobTitle: article.authorRole || undefined,
        },
        publisher: {
          "@type": "Organization",
          name: "WeedHub",
          url: SITE_URL,
        },
        datePublished: article.publishedAt || undefined,
        dateModified: article.updatedAt,
        url: `${SITE_URL}/blog/${article.slug}`,
        inLanguage: article.locale === "es" ? "es-MX" : article.locale === "pt" ? "pt-BR" : "en",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
          <Link to="/" className="hover:text-fg transition-colors">
            Inicio
          </Link>
          <span>›</span>
          <Link to="/blog" className="hover:text-fg transition-colors">
            Blog
          </Link>
          <span>›</span>
          <span className="text-fg truncate">{article.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
          <article>
            <div className="flex items-center gap-2 mb-4">
              <span className="pill">{CATEGORY_LABELS[article.category] || article.category}</span>
              {date && <span className="text-sm text-fg-dim">{date}</span>}
            </div>

            <h1 className="display text-3xl md:text-4xl mb-4 leading-tight">{article.title}</h1>

            {article.excerpt && (
              <p className="text-lg text-fg-muted leading-relaxed mb-8 border-l-2 pl-4" style={{ borderColor: "var(--accent)" }}>
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-line">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {article.authorAvatar ? (
                  <img
                    src={article.authorAvatar}
                    alt={article.authorName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  article.authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{article.authorName}</div>
                {article.authorRole && (
                  <div className="text-xs text-fg-dim">{article.authorRole}</div>
                )}
              </div>
            </div>

            {article.coverImage && (
              <div className="rounded-xl overflow-hidden mb-8 aspect-[16/9]">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div
              className="prose prose-sm max-w-none"
              style={{ color: "var(--fg)" }}
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />

            {article.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-10 pt-8 border-t border-line">
                <span className="text-xs text-fg-dim">Tags:</span>
                {article.tags.map((tag) => (
                  <span key={tag} className="pill text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-12">
              <NewsletterSignup />
            </div>
          </article>

          <aside className="space-y-8">
            {article.relatedStrains.length > 0 && (
              <div className="card p-5">
                <div className="kicker mb-3">Cepas relacionadas</div>
                <div className="space-y-2">
                  {article.relatedStrains.map((strain) => (
                    <Link
                      key={strain.slug}
                      to={`/strains/${strain.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-elev transition-colors"
                    >
                      <span
                        className={`pill text-xs ${TYPE_COLORS[strain.type] || ""}`}
                      >
                        {strain.type}
                      </span>
                      <span className="text-sm">{strain.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-5">
              <div className="kicker mb-3">Explorar</div>
              <div className="space-y-2">
                <Link
                  to="/strains"
                  className="block text-sm text-fg-muted hover:text-fg transition-colors py-1"
                >
                  → Directorio de cepas
                </Link>
                <Link
                  to="/guias"
                  className="block text-sm text-fg-muted hover:text-fg transition-colors py-1"
                >
                  → Guías educativas
                </Link>
                <Link
                  to="/recomendar"
                  className="block text-sm text-fg-muted hover:text-fg transition-colors py-1"
                >
                  → Recomiéndame una cepa
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
