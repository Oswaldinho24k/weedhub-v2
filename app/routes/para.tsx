import { Link } from "react-router";
import type { Route } from "./+types/para";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { CONDITIONS, CONDITION_CATEGORY_LABELS, type ConditionCategory } from "~/constants/conditions";

export function meta(_: Route.MetaArgs) {
  return buildMeta({
    title: "Cannabis para condiciones médicas — WeedHub",
    description:
      "Explora qué cepas de cannabis recomienda la comunidad WeedHub para ansiedad, dolor, insomnio y más. Basado en reseñas reales.",
    url: `${SITE_URL}/para`,
    canonicalPath: "/para",
  });
}

const CATEGORY_ORDER: ConditionCategory[] = [
  "mental",
  "dolor",
  "sueno",
  "digestivo",
  "neurologico",
  "otro",
];

export default function ParaHubPage() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: CONDITION_CATEGORY_LABELS[cat],
    conditions: CONDITIONS.filter((c) => c.category === cat),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      {/* Hero */}
      <div className="mb-16 max-w-2xl">
        <div className="kicker mb-3">Basado en reseñas de la comunidad</div>
        <h1 className="display text-5xl mb-5">
          Cannabis para condiciones
        </h1>
        <p className="text-lg text-fg-muted leading-relaxed">
          Datos recopilados de miles de reseñas. Los porcentajes reflejan cuántos usuarios
          reportaron que una cepa les ayudó con cada condición. No es consejo médico.
        </p>
      </div>

      {/* Grid by category */}
      <div className="space-y-14">
        {grouped.map(({ cat, label, conditions }) => (
          <div key={cat}>
            <h2 className="display text-2xl mb-5">{label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {conditions.map((c) => (
                <Link
                  key={c.slug}
                  to={`/para/${c.slug}`}
                  className="card p-4 flex flex-col items-center gap-2 text-center hover:border-accent transition-colors group"
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-sm font-medium text-fg group-hover:text-accent transition-colors">
                    {c.labelEs}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-20 p-5 card flex gap-3">
        <div className="shrink-0 mt-0.5" style={{ color: "var(--warm)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        </div>
        <p className="text-sm text-fg-muted">
          <span className="font-medium" style={{ color: "var(--warm)" }}>Aviso médico: </span>
          Esta información es completamente educativa y se basa en experiencias reportadas por usuarios de la comunidad.
          WeedHub no hace afirmaciones médicas. Consulta a un profesional de salud antes de usar cannabis para tratar
          cualquier condición médica.
        </p>
      </div>
    </div>
  );
}
