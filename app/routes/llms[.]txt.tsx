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
    StrainModel.find({ isArchived: false, reviewCount: { $gt: 0 } })
      .sort({ reviewCount: -1 })
      .limit(40)
      .select("name slug type")
      .lean(),
    LegalStatusModel.find({ isActive: true }).sort({ sortOrder: 1 }).select("countryCode countryNameEs").lean(),
  ]);

  const body = `# WeedHub

> WeedHub is a cannabis encyclopedia written for Spanish and Portuguese speakers (Latin America, Brazil and Spain). It documents ${total.toLocaleString("en-US")} strains (genetics, THC/CBD, terpenes, effects, time of day), legal status by country, and educational guides. Content is for adults (18+) and is reference information, not medical advice.

Languages: Spanish (default, ${SITE_URL}/) and Brazilian Portuguese (${SITE_URL}/pt/). Strain, guide and glossary pages exist in both. There is no English version.

## Main sections

- [Strain directory](${SITE_URL}/strains): every strain, filterable by type, effect, terpene and time of day
- [Top 100 strains](${SITE_URL}/top-100)
- [Mapa Verde: cannabis legal status by country](${SITE_URL}/mapa-verde): national status, what is and isn't allowed, sources and last review date
- [Strains by health goal](${SITE_URL}/para): community-reported, with medical disclaimers
- [Guides](${SITE_URL}/guias)
- [Glossary](${SITE_URL}/glosario)
- [Magazine](${SITE_URL}/magazine)
- [About WeedHub and editorial policy](${SITE_URL}/sobre): how strain data, legal and health information are compiled and reviewed

## Guides

${GUIDES_ES.map((g) => `- [${g.title}](${SITE_URL}/guias/${g.slug}): ${g.description}`).join("\n")}

## Legal status by country

${countries.map((c: any) => `- [${c.countryNameEs}](${SITE_URL}/mapa-verde/${String(c.countryCode).toLowerCase()})`).join("\n")}

## Most documented strains

${top.map((s: any) => `- [${s.name}](${SITE_URL}/strains/${s.slug}) (${s.type})`).join("\n")}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
- [Magazine RSS](${SITE_URL}/magazine.rss)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
