import { data, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/para.$condition";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { StrainCard } from "~/components/composite/strain-card";
import { CONDITIONS_BY_SLUG, CONDITION_CATEGORY_LABELS } from "~/constants/conditions";

export async function loader({ params }: Route.LoaderArgs) {
  const condition = CONDITIONS_BY_SLUG[params.condition];
  if (!condition) throw data("Condición no encontrada", { status: 404 });

  await connectDB();

  const strains = await StrainModel.find({
    helpsWithConditions: condition.slug,
    isArchived: false,
  })
    .sort({ [`conditionVotes.${condition.slug}`]: -1, "averageRatings.overall": -1 })
    .limit(30)
    .lean();

  return { condition, strains };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.condition) return [{ title: "WeedHub" }];
  const { condition } = data;
  return [
    { title: `Mejores cepas para ${condition.labelEs} — WeedHub` },
    {
      name: "description",
      content: `Descubre las cepas de cannabis que la comunidad WeedHub recomienda para ${condition.labelEs.toLowerCase()}. Reseñas reales, datos de la comunidad.`,
    },
    {
      name: "script:ld+json",
      content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Mejores cepas para ${condition.labelEs}`,
        description: `Cepas de cannabis recomendadas por la comunidad para ${condition.labelEs.toLowerCase()}`,
        url: `https://weedhub.info/para/${condition.slug}`,
        numberOfItems: data.strains.length,
        itemListElement: data.strains.slice(0, 10).map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.name,
          url: `https://weedhub.info/strains/${s.slug}`,
        })),
      }),
    },
    {
      name: "script:ld+json",
      content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: "https://weedhub.info" },
          { "@type": "ListItem", position: 2, name: "Para condiciones", item: "https://weedhub.info/para" },
          { "@type": "ListItem", position: 3, name: condition.labelEs },
        ],
      }),
    },
  ];
}

export default function ConditionPage() {
  const { condition, strains } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-fg-dim mb-10">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>/</span>
        <Link to="/para" className="hover:text-fg transition-colors">Para condiciones</Link>
        <span>/</span>
        <span>{condition.labelEs}</span>
      </nav>

      {/* Hero */}
      <div className="mb-14 max-w-2xl">
        <div className="kicker mb-3">
          {CONDITION_CATEGORY_LABELS[condition.category]} · Basado en reseñas de la comunidad
        </div>
        <h1 className="display text-5xl mb-5">
          Mejores cepas para {condition.labelEs}
        </h1>
        <p className="text-lg text-fg-muted leading-relaxed">
          {strains.length > 0
            ? `${strains.length} cepas recomendadas por la comunidad WeedHub. Datos basados en reseñas reales — no en afirmaciones de marcas.`
            : "Aún no hay cepas con datos suficientes para esta condición. Sé el primero en dejar una reseña."}
        </p>
      </div>

      {strains.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {strains.map((strain) => {
            const votes = (strain.conditionVotes as Record<string, number>)?.[condition.slug] ?? 0;
            return (
              <div key={strain.slug} className="relative">
                {votes > 0 && (
                  <div className="absolute top-3 right-3 z-10 pill accent text-xs">
                    {votes} {votes === 1 ? "reseña" : "reseñas"}
                  </div>
                )}
                <StrainCard strain={{ ...strain, _id: String(strain._id) } as Parameters<typeof StrainCard>[0]["strain"]} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-fg-muted mb-4">No hay cepas con datos para esta condición todavía.</p>
          <Link to="/strains" className="btn btn-primary text-sm">
            Explorar el directorio
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-16 p-5 card flex gap-3">
        <div className="shrink-0 mt-0.5" style={{ color: "var(--warm)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        </div>
        <p className="text-sm text-fg-muted">
          <span className="font-medium" style={{ color: "var(--warm)" }}>Aviso: </span>
          Esta información es educativa y se basa en experiencias reportadas por la comunidad.
          No sustituye el consejo médico profesional. Consulta a un médico antes de usar cannabis para cualquier condición de salud.
        </p>
      </div>
    </div>
  );
}
