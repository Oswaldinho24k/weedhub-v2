import { CLASSIC_STRAINS } from "~/lib/classics";
import { featureOn } from "~/lib/features";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { LegalStatusModel } from "~/models/legal-status.server";
import { GUIDES_ES } from "~/content/guides.es";
import { SITE_URL } from "~/lib/seo";

/** /llms.txt — plain-text map of WeedHub for AI assistants (llmstxt.org). */
export async function loader() {
  await connectDB();
  const [total, top, countries] = await Promise.all([
    StrainModel.countDocuments({ isArchived: false }),
    StrainModel.find({ isArchived: false, slug: { $in: [...CLASSIC_STRAINS] } })
      .select("name slug type")
      .lean(),
    LegalStatusModel.find({ isActive: true }).sort({ sortOrder: 1 }).select("countryCode countryNameEs").lean(),
  ]);

  const body = `# WeedHub

> WeedHub is a cannabis encyclopedia written in Spanish for Latin America and Spain. It documents ${total.toLocaleString("en-US")} strains (genetics, THC/CBD, terpenes, effects, time of day), legal status by country, and educational guides. Content is for adults (18+) and is reference information, not medical advice.

Language: Spanish. All content is written in Spanish for Latin America.

## Main sections

- [Strain directory](${SITE_URL}/strains): every strain, filterable by type, effect, terpene and time of day
${featureOn("top100") ? `- [Top 100 strains](${SITE_URL}/top-100)\n` : ""}- [Mapa Verde: cannabis legal status by country](${SITE_URL}/mapa-verde): national status, what is and isn't allowed, sources and last review date
${featureOn("porCondicion") ? `- [Strains by health goal](${SITE_URL}/para): community-reported, with medical disclaimers\n` : ""}- [Guides](${SITE_URL}/guias)
- [Glossary](${SITE_URL}/glosario)
${featureOn("magazine") ? `- [Magazine](${SITE_URL}/magazine)\n` : ""}- [About WeedHub and editorial policy](${SITE_URL}/sobre): how strain data, legal and health information are compiled and reviewed

## Guides

${GUIDES_ES.map((g) => `- [${g.title}](${SITE_URL}/guias/${g.slug}): ${g.description}`).join("\n")}

## Legal status by country

${countries.map((c: any) => `- [${c.countryNameEs}](${SITE_URL}/mapa-verde/${String(c.countryCode).toLowerCase()})`).join("\n")}

## Well-documented strains

${top.map((s: any) => `- [${s.name}](${SITE_URL}/strains/${s.slug}) (${s.type})`).join("\n")}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
- [Magazine RSS](${SITE_URL}/magazine.rss)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
