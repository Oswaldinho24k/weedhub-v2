import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/glosario";
import { connectDB } from "~/lib/db.server";
import { GlossaryTermModel, type GlossaryCategory } from "~/models/glossary-term.server";
import { buildMeta, SITE_URL } from "~/lib/seo";

export async function loader(_: Route.LoaderArgs) {
  await connectDB();
  const terms = await GlossaryTermModel.find({ isActive: true })
    .sort({ term: 1 })
    .select("slug term category")
    .lean();
  return { terms };
}

export function meta() {
  return [
    ...buildMeta({
      title: "Glosario de Cannabis — WeedHub",
      description:
        "Diccionario de cannabis en español: THC, CBD, terpenos, extracciones, cultivo y más. Entiende el lenguaje del cannabis con definiciones claras y sin rodeos.",
      url: `${SITE_URL}/glosario`,
      canonicalPath: "/glosario",
    }),
    {
      name: "script:ld+json",
      content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        name: "Glosario de Cannabis — WeedHub",
        description: "Diccionario de términos cannábicos en español",
        url: `${SITE_URL}/glosario`,
        inDefinedTermSet: `${SITE_URL}/glosario`,
      }),
    },
  ];
}

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

const CATEGORY_ORDER: GlossaryCategory[] = [
  "cannabinoides", "terpenos", "ciencia", "extracciones",
  "cultivo", "consumo", "legal", "cultura",
];

export default function GlosarioPage() {
  const { terms } = useLoaderData<typeof loader>();

  const byCategory: Record<string, typeof terms> = {};
  for (const t of terms) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  const alphabet = Array.from(
    new Set(terms.map((t) => t.term[0].toUpperCase()))
  ).sort();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16">
      {/* Hero */}
      <div className="mb-14 max-w-2xl">
        <div className="kicker mb-3">WeedHub · Glosario</div>
        <h1 className="display text-5xl mb-5">Glosario de Cannabis</h1>
        <p className="text-lg text-fg-muted leading-relaxed">
          El diccionario cannábico en español que faltaba. Desde THC y CBD hasta live resin,
          terpenos y decarboxilación — explicado sin rodeos.
        </p>
      </div>

      {/* Quick alphabet jump */}
      <div className="flex flex-wrap gap-1.5 mb-12">
        {alphabet.map((letter) => (
          <a
            key={letter}
            href={`#letra-${letter}`}
            className="pill text-xs hover:pill-accent transition-colors"
          >
            {letter}
          </a>
        ))}
      </div>

      {/* By category */}
      <div className="space-y-14">
        {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => (
          <section key={cat}>
            <h2 className="display text-2xl mb-6 pb-3 border-b border-line">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byCategory[cat].map((t) => (
                <Link
                  key={t.slug}
                  to={`/glosario/${t.slug}`}
                  id={`letra-${t.term[0].toUpperCase()}`}
                  className="card p-4 hover:bg-elev transition-colors group"
                >
                  <div className="font-medium group-hover:text-accent transition-colors">
                    {t.term}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {terms.length === 0 && (
        <div className="text-center py-20 text-fg-dim">
          El glosario está en construcción. Vuelve pronto.
        </div>
      )}
    </div>
  );
}
