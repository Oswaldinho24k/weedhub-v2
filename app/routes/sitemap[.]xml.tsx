import { featureOn } from "~/lib/features";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { GlossaryTermModel } from "~/models/glossary-term.server";
import { BrandModel } from "~/models/brand.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { ArticleModel } from "~/models/article.server";
import { PostModel } from "~/models/post.server";
import { GUIDES_ES } from "~/content/guides.es";
import { SITE_URL } from "~/lib/seo";
import { LegalStatusModel } from "~/models/legal-status.server";
import { CONDITIONS } from "~/constants/conditions";

function hreflangBlock(canonicalPath: string): string {
  const es = `${SITE_URL}${canonicalPath}`;
  return [
    `    <xhtml:link rel="alternate" hreflang="es" href="${es}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${es}"/>`,
  ].join("\n");
}

function urlBlock(loc: string, canonicalPath: string, opts: { changefreq: string; priority: string; lastmod?: string }): string {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${opts.changefreq}</changefreq>
    <priority>${opts.priority}</priority>${opts.lastmod ? `\n    <lastmod>${opts.lastmod}</lastmod>` : ""}
  </url>`;
}

function urlGroup(canonicalPath: string, opts: { changefreq: string; priority: string; lastmod?: string }): string {
  const es = `${SITE_URL}${canonicalPath}`;
  return [
    urlBlock(es, canonicalPath, opts),
  ].join("\n");
}

function urlSingle(canonicalPath: string, opts: { changefreq: string; priority: string; lastmod?: string }): string {
  return `  <url>
    <loc>${SITE_URL}${canonicalPath}</loc>
    <changefreq>${opts.changefreq}</changefreq>
    <priority>${opts.priority}</priority>${opts.lastmod ? `\n    <lastmod>${opts.lastmod}</lastmod>` : ""}
  </url>`;
}

export async function loader() {
  await connectDB();

  const [strains, glossaryTerms, brands, dispensaries, articles, posts, countries] = await Promise.all([
    StrainModel.find({ isArchived: false }).select("slug updatedAt").lean(),
    GlossaryTermModel.find({ isActive: true }).select("slug updatedAt").lean(),
    BrandModel.find({ status: "active" }).select("slug updatedAt").lean(),
    DispensaryModel.find({ status: "active" }).select("slug updatedAt").lean(),
    ArticleModel.find({ status: "published" }).select("slug updatedAt publishedAt").lean(),
    PostModel.find({ status: "published" }).select("slug updatedAt").lean(),
    LegalStatusModel.find({ isActive: true }).select("countryCode lastReviewedAt updatedAt").lean(),
  ]);

  const countriesXml = countries
    .map((c: any) =>
      urlGroup(`/mapa-verde/${String(c.countryCode).toLowerCase()}`, {
        changefreq: "monthly",
        priority: "0.7",
        lastmod: ((c.lastReviewedAt || c.updatedAt) as Date)?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  const conditionsXml = (CONDITIONS as any[])
    .map((c) => urlGroup(`/para/${c.slug}`, { changefreq: "weekly", priority: "0.6" }))
    .join("\n");

  // Public static paths (Spanish only)
  const localizedPaths = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/strains", changefreq: "daily", priority: "0.9" },
    { path: "/guias", changefreq: "monthly", priority: "0.8" },
    { path: "/sobre", changefreq: "monthly", priority: "0.5" },
    { path: "/glosario", changefreq: "weekly", priority: "0.8" },
    { path: "/mapa-verde", changefreq: "weekly", priority: "0.8" },
    ...(featureOn("top100") ? [{ path: "/top-100", changefreq: "daily", priority: "0.9" }] : []),
    ...(featureOn("porCondicion") ? [{ path: "/para", changefreq: "weekly", priority: "0.6" }] : []),
    { path: "/terminos", changefreq: "yearly", priority: "0.3" },
    { path: "/privacidad", changefreq: "yearly", priority: "0.3" },
  ];

  // Spanish-only paths (no localized variants)
  const singlePaths = [
    ...(featureOn("magazine") ? [{ path: "/magazine", changefreq: "weekly", priority: "0.8" }] : []),
    ...(featureOn("foro") ? [{ path: "/comunidad", changefreq: "daily", priority: "0.6" }] : []),
    ...(featureOn("recomendador") ? [{ path: "/recomendar", changefreq: "monthly", priority: "0.6" }] : []),
    ...(featureOn("negocios")
      ? [
          { path: "/productos", changefreq: "weekly", priority: "0.5" },
          { path: "/marcas", changefreq: "weekly", priority: "0.7" },
          { path: "/dispensarios", changefreq: "weekly", priority: "0.7" },
        ]
      : []),
    ...(featureOn("pagos") ? [{ path: "/planes", changefreq: "monthly", priority: "0.5" }] : []),
  ];

  const staticXml = localizedPaths
    .map((p) => urlGroup(p.path, { changefreq: p.changefreq, priority: p.priority }))
    .join("\n");

  const singleXml = singlePaths
    .map((p) => urlSingle(p.path, { changefreq: p.changefreq, priority: p.priority }))
    .join("\n");

  const strainsXml = strains
    .map((s) =>
      urlGroup(`/strains/${s.slug}`, {
        changefreq: "weekly",
        priority: "0.8",
        lastmod: s.updatedAt?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  const glossaryXml = glossaryTerms
    .map((t) =>
      urlGroup(`/glosario/${t.slug}`, {
        changefreq: "monthly",
        priority: "0.6",
        lastmod: t.updatedAt?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  // Guide slugs are static — use ES list (same slugs for all locales)
  const guidesXml = GUIDES_ES.map((g) =>
    urlGroup(`/guias/${g.slug}`, {
      changefreq: "monthly",
      priority: "0.7",
    })
  ).join("\n");

  const articlesXml = articles
    .map((a) =>
      urlSingle(`/magazine/${a.slug}`, {
        changefreq: "monthly",
        priority: "0.7",
        lastmod: (a.updatedAt as Date)?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  const brandsXml = brands
    .map((b) =>
      urlSingle(`/marcas/${b.slug}`, {
        changefreq: "monthly",
        priority: "0.6",
        lastmod: (b.updatedAt as Date)?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  const dispensariesXml = dispensaries
    .map((d) =>
      urlSingle(`/dispensarios/${d.slug}`, {
        changefreq: "monthly",
        priority: "0.6",
        lastmod: (d.updatedAt as Date)?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  const postsXml = posts
    .map((p) =>
      urlSingle(`/comunidad/${p.slug}`, {
        changefreq: "monthly",
        priority: "0.5",
        lastmod: (p.updatedAt as Date)?.toISOString().split("T")[0] || "",
      })
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticXml}
${singleXml}
${strainsXml}
${glossaryXml}
${guidesXml}
${featureOn("magazine") ? articlesXml : ""}
${featureOn("negocios") ? brandsXml : ""}
${featureOn("negocios") ? dispensariesXml : ""}
${countriesXml}
${featureOn("porCondicion") ? conditionsXml : ""}
${featureOn("foro") ? postsXml : ""}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
