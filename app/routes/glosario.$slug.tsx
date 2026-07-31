import { data, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/glosario.$slug";
import { connectDB } from "~/lib/db.server";
import { GlossaryTermModel, type GlossaryCategory } from "~/models/glossary-term.server";
import { NewsletterSignup } from "~/components/layout/newsletter-signup";

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

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();
  const term = await GlossaryTermModel.findOne({ slug: params.slug, isActive: true }).lean();
  if (!term) throw data("Término no encontrado", { status: 404 });

  const related = term.relatedSlugs?.length
    ? await GlossaryTermModel.find({ slug: { $in: term.relatedSlugs }, isActive: true })
        .select("slug term category")
        .lean()
    : [];

  return { term, related };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.term) return [{ title: "Glosario — WeedHub" }];
  const t = data.term;
  return [
    { title: `¿Qué es ${t.term}? — Glosario de Cannabis | WeedHub` },
    {
      name: "description",
      content: t.definition.slice(0, 160),
    },
    {
      name: "script:ld+json",
      content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name: t.term,
        description: t.definition,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: "Glosario de Cannabis — WeedHub",
          url: "https://weedhub.info/glosario",
        },
      }),
    },
    {
      name: "script:ld+json",
      content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: "https://weedhub.info" },
          { "@type": "ListItem", position: 2, name: "Glosario", item: "https://weedhub.info/glosario" },
          { "@type": "ListItem", position: 3, name: t.term },
        ],
      }),
    },
  ];
}

export default function GlossaryTermPage() {
  const { term, related } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-fg-dim mb-10">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>/</span>
        <Link to="/glosario" className="hover:text-fg transition-colors">Glosario</Link>
        <span>/</span>
        <span>{term.term}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="pill text-xs">{CATEGORY_LABELS[term.category as GlossaryCategory]}</span>
          {term.termEn && term.termEn !== term.term && (
            <span className="text-xs text-fg-dim mono">{term.termEn}</span>
          )}
        </div>
        <h1 className="display text-5xl mb-2">{term.term}</h1>
      </div>

      {/* Definition */}
      <div className="card p-7 mb-8">
        <p className="text-fg-muted leading-relaxed text-[15px]">{term.definition}</p>
      </div>

      {/* Examples */}
      {term.examples && term.examples.length > 0 && (
        <div className="mb-10">
          <div className="kicker mb-3">Ejemplos</div>
          <ul className="space-y-2">
            {term.examples.map((ex: string, i: number) => (
              <li key={i} className="flex gap-2.5 text-sm text-fg-muted">
                <span className="text-accent mt-0.5 shrink-0">·</span>
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related terms */}
      {related.length > 0 && (
        <div className="mb-14">
          <div className="kicker mb-4">Ver también</div>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/glosario/${r.slug}`}
                className="pill hover:pill-accent transition-colors"
              >
                {r.term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mb-14">
        <Link to="/glosario" className="text-sm text-accent hover:underline inline-flex items-center gap-1.5">
          ← Ver todo el glosario
        </Link>
      </div>

      <NewsletterSignup />
    </div>
  );
}
