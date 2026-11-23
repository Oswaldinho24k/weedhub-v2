import { data, useLoaderData, Link } from "react-router";
import { buildMeta, SITE_URL } from "~/lib/seo";
import type { Route } from "./+types/glosario.$slug";
import { connectDB } from "~/lib/db.server";
import { GlossaryTermModel, type GlossaryCategory } from "~/models/glossary-term.server";
import { Icon } from "~/components/ui/icon";
import { resolveLocale } from "~/lib/locale.server";
import { GLOSSARY_CATEGORY, localizedTerm } from "~/lib/glossary-ui";

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  cannabinoides: "Cannabinoides",
  terpenos: "Terpenos",
  extracciones: "Extracciones",
  cultivo: "Cultivo",
  consumo: "Consumo",
  legal: "Legal",
  ciencia: "Ciencia",
  cultura: "Cultura",
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = (await resolveLocale(request)) === "pt" ? "pt" : "es";
  await connectDB();
  const term = await GlossaryTermModel.findOne({ slug: params.slug, isActive: true }).lean();
  if (!term) throw data("Término no encontrado", { status: 404 });

  const related = term.relatedSlugs?.length
    ? await GlossaryTermModel.find({ slug: { $in: term.relatedSlugs }, isActive: true })
        .select("slug term termPt category")
        .lean()
    : [];

  return { term, related, locale } as const;
}

const UI = {
  es: { home: "Inicio", glossary: "Glosario", title: (t: string) => `¿Qué es ${t}? Significado y ejemplos | WeedHub`, examples: "Ejemplos", related: "Ver también", back: "Ver todo el glosario", set: "Glosario de cannabis de WeedHub" },
  pt: { home: "Início", glossary: "Glossário", title: (t: string) => `O que é ${t}? Significado e exemplos | WeedHub`, examples: "Exemplos", related: "Veja também", back: "Ver todo o glossário", set: "Glossário de cannabis do WeedHub" },
} as const;

export function meta({ data }: Route.MetaArgs) {
  if (!data?.term) return [{ title: "WeedHub" }];
  const loc = data.locale;
  const U = UI[loc];
  const L = localizedTerm(data.term as any, loc);
  const prefix = loc === "pt" ? "/pt" : "";
  const path = `/glosario/${data.term.slug}`;
  const url = `${SITE_URL}${prefix}${path}`;
  const desc = L.definition.length > 155 ? L.definition.slice(0, 152).replace(/\s+\S*$/, "") + "…" : L.definition;
  return [
    ...buildMeta({ title: U.title(L.term), description: desc, url, type: "article", locale: loc, canonicalPath: path }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name: L.term,
        description: L.definition,
        url,
        inLanguage: loc === "pt" ? "pt-BR" : "es",
        inDefinedTermSet: { "@type": "DefinedTermSet", name: U.set, url: `${SITE_URL}${prefix}/glosario` },
      },
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: U.home, item: `${SITE_URL}${prefix}/` },
          { "@type": "ListItem", position: 2, name: U.glossary, item: `${SITE_URL}${prefix}/glosario` },
          { "@type": "ListItem", position: 3, name: L.term, item: url },
        ],
      },
    },
  ];
}

export default function GlossaryTermPage() {
  const { term, related, locale } = useLoaderData<typeof loader>();
  const U = UI[locale];
  const L = localizedTerm(term as any, locale);
  const prefix = locale === "pt" ? "/pt" : "";

  return (
    <div>
      <section className="wall--yellow border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 pt-5 pb-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-bold flex-wrap">
            <Link to={`${prefix}/`} className="hover:underline underline-offset-4 decoration-2">{U.home}</Link>
            <Icon name="chevronRight" size={12} />
            <Link to={`${prefix}/glosario`} className="hover:underline underline-offset-4 decoration-2">{U.glossary}</Link>
            <Icon name="chevronRight" size={12} />
            <span aria-current="page">{L.term}</span>
          </nav>
          <h1 className="rotulo mt-8 break-words" style={{ fontSize: "clamp(48px, 9vw, 120px)" }}>{L.term}</h1>
          <p className="mt-3"><span className="pill active">{GLOSSARY_CATEGORY[locale][term.category as GlossaryCategory]}</span></p>
          {/* Direct definition: the answer block */}
          <p className="mt-6 max-w-[62ch] text-[20px] leading-relaxed font-medium">{L.definition}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 py-12">
        {L.examples.length > 0 && (
          <section className="mb-10">
            <h2 className="display text-[30px] mb-4">{U.examples}</h2>
            <ul className="space-y-3">
              {L.examples.map((ex: string, i: number) => (
                <li key={i} className="flex gap-3 text-[17px] leading-snug"><span className="mt-2 w-2 h-2 bg-ink shrink-0" />{ex}</li>
              ))}
            </ul>
          </section>
        )}
        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="display text-[30px] mb-4">{U.related}</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r: any) => (
                <Link key={r.slug} to={`${prefix}/glosario/${r.slug}`} className="chip">
                  {localizedTerm(r, locale).term}
                </Link>
              ))}
            </div>
          </section>
        )}
        <Link to={`${prefix}/glosario`} className="btn btn-ghost">
          <Icon name="arrowLeft" size={15} />
          {U.back}
        </Link>
      </div>
    </div>
  );
}
