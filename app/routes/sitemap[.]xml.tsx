import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { SITE_URL } from "~/lib/seo";

export async function loader() {
  await connectDB();

  const strains = await StrainModel.find({ isArchived: false })
    .select("slug updatedAt")
    .lean();

  const staticUrls = [
    { url: SITE_URL, priority: "1.0", changefreq: "daily" },
    { url: `${SITE_URL}/strains`, priority: "0.9", changefreq: "daily" },
  ];

  const dynamicUrls = strains.map((s) => ({
    url: `${SITE_URL}/strains/${s.slug}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: s.updatedAt?.toISOString().split("T")[0] || "",
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
${dynamicUrls
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
