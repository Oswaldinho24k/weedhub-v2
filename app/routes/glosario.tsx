import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/glosario";
import { connectDB } from "~/lib/db.server";
import { GlossaryTermModel } from "~/models/glossary-term.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";
import { GLOSSARY_CATEGORY, GLOSSARY_ORDER, localizedTerm } from "~/lib/glossary-ui";

const UI = {
  es: {
    title: "Glosario de cannabis: términos explicados en español | WeedHub",
    description: "Qué significan THC, CBD, terpenos, tricomas, decarboxilación, rosin y más. Definiciones claras, con ejemplos, en español.",
    h1: "Glosario",
    lede: "Las palabras del cannabis explicadas sin rodeos: de THC y CBD a tricomas, rosin y decarboxilación.",
    set: "Glosario de cannabis de WeedHub",
  },
  pt: {
    title: "Glossário de cannabis: termos explicados em português | WeedHub",
    description: "O que significam THC, CBD, terpenos, tricomas, descarboxilação, rosin e mais. Definições claras, com exemplos, em português.",
    h1: "Glossário",
    lede: "As palavras da cannabis explicadas sem enrolação: de THC e CBD a tricomas, rosin e descarboxilação.",
    set: "Glossário de cannabis do WeedHub",
  },
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const locale = (await resolveLocale(request)) === "pt" ? "pt" : "es";
  await connectDB();
  const terms = await GlossaryTermModel.find({ isActive: true }).select("slug term termPt category").lean();
  const list = terms
    .map((t: any) => ({ slug: t.slug, category: t.category, label: localizedTerm(t, locale).term }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  return { terms: list, locale } as const;
}

export function meta({ data }: Route.MetaArgs) {
  const loc = data?.locale ?? "es";
  const U = UI[loc];
  const url = `${SITE_URL}${loc === "pt" ? "/pt" : ""}/glosario`;
  return [
    ...buildMeta({ title: U.title, description: U.description, url, canonicalPath: "/glosario", locale: loc }),
    { "script:ld+json": { "@context": "https://schema.org", "@type": "DefinedTermSet", name: U.set, inLanguage: loc === "pt" ? "pt-BR" : "es", url } },
  ];
}

export default function GlosarioPage() {
  const { terms, locale } = useLoaderData<typeof loader>();
  const U = UI[locale];
  const prefix = locale === "pt" ? "/pt" : "";
  const cats = GLOSSARY_CATEGORY[locale];
  const byCategory: Record<string, typeof terms> = {};
  for (const t of terms) (byCategory[t.category] ??= []).push(t);

  return (
    <div>
      <section className="wall--yellow border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <h1 className="rotulo" style={{ fontSize: "clamp(56px, 10vw, 140px)" }}>{U.h1}</h1>
          <p className="mt-5 max-w-[56ch] text-xl font-semibold leading-snug">{U.lede}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 space-y-12">
        {GLOSSARY_ORDER.filter((c) => byCategory[c]?.length).map((cat) => (
          <section key={cat}>
            <h2 className="display text-[clamp(30px,3.6vw,44px)] mb-5">{cats[cat]}</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 border-t-[3px] border-ink">
              {byCategory[cat].map((t) => (
                <li key={t.slug}>
                  <Link to={`${prefix}/glosario/${t.slug}`} className="block py-3 border-b-2 border-ink text-lg font-extrabold [font-stretch:85%] hover:bg-yellow hover:text-ink px-1 transition-colors">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
