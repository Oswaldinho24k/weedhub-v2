import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/top-100";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { StrainThumb } from "~/components/composite/strain-thumb";
import { RatingStars } from "~/components/composite/rating-stars";
import { Icon } from "~/components/ui/icon";

export function meta(_: Route.MetaArgs) {
  return buildMeta({
    title: "Las 100 Mejores Cepas de Cannabis — WeedHub",
    description:
      "El ranking definitivo en español: las 100 cepas de cannabis mejor calificadas por la comunidad WeedHub. Actualizado con reseñas reales.",
    url: `${SITE_URL}/top-100`,
    // top-100 is Spanish-only; no localized variants, so no canonicalPath/hreflang needed
  });
}

export async function loader() {
  await connectDB();

  const strains = await StrainModel.find({
    isArchived: false,
    reviewCount: { $gte: 1 },
  })
    .sort({ "averageRatings.overall": -1, reviewCount: -1 })
    .limit(100)
    .select(
      "name slug type typeBlend averageRatings reviewCount effects imageUrl colorHint dominantTerpene cannabinoidProfile.thc.max"
    )
    .lean();

  return {
    strains: strains.map((s, i) => ({
      rank: i + 1,
      _id: String(s._id),
      name: s.name,
      slug: s.slug,
      type: s.type,
      typeBlend: s.typeBlend,
      overall: s.averageRatings?.overall ?? 0,
      reviewCount: s.reviewCount ?? 0,
      effects: (s.effects ?? []).slice(0, 3),
      imageUrl: s.imageUrl,
      colorHint: s.colorHint,
      dominantTerpene: s.dominantTerpene,
      thcMax: (s.cannabinoidProfile as any)?.thc?.max ?? 0,
    })),
    updatedAt: new Date().toISOString(),
  };
}

const TYPE_PILL: Record<string, string> = { sativa: "accent", indica: "warm", hybrid: "lilac" };
const TYPE_LABEL: Record<string, string> = { sativa: "Sativa", indica: "Indica", hybrid: "Híbrida" };

export default function Top100Page() {
  const { strains, updatedAt } = useLoaderData<typeof loader>();
  const year = new Date(updatedAt).getFullYear();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Las 100 Mejores Cepas de Cannabis",
    description: "Ranking de cepas de cannabis basado en reseñas de la comunidad WeedHub",
    url: `${SITE_URL}/top-100`,
    numberOfItems: strains.length,
    itemListElement: strains.slice(0, 10).map((s) => ({
      "@type": "ListItem",
      position: s.rank,
      name: s.name,
      url: `${SITE_URL}/strains/${s.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="mb-14 max-w-2xl">
        <div className="kicker mb-3">Ranking {year} · Comunidad WeedHub</div>
        <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 96px)", lineHeight: 0.96 }}>
          Las 100 Mejores Cepas
        </h1>
        <p className="text-lg text-fg-muted leading-relaxed mt-5">
          Ranking basado en miles de reseñas reales. Solo cepas con al menos una reseña verificada.
          Actualizado continuamente conforme la comunidad crece.
        </p>
      </div>

      {/* Top 3 podium */}
      {strains.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {strains.slice(0, 3).map((s) => (
            <Link
              key={s.slug}
              to={`/strains/${s.slug}`}
              className="card p-5 flex flex-col gap-3 hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span
                  className="display text-5xl"
                  style={{ color: s.rank === 1 ? "var(--gold)" : s.rank === 2 ? "var(--fg-muted)" : "var(--warm)" }}
                >
                  #{s.rank}
                </span>
                <span className={`pill ${TYPE_PILL[s.type] || ""}`}>
                  {s.typeBlend || TYPE_LABEL[s.type]}
                </span>
              </div>
              <div className="h-24 w-full overflow-hidden rounded-md">
                <StrainThumb
                  name={s.name}
                  type={s.type as any}
                  colorHint={s.colorHint}
                  imageUrl={s.imageUrl}
                  ratio="wide"
                  className="w-full h-full"
                />
              </div>
              <div>
                <h2 className="display text-xl group-hover:text-accent transition-colors">
                  {s.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={s.overall} size="sm" />
                  <span className="mono text-sm tnum">{s.overall.toFixed(1)}</span>
                  <span className="text-xs text-fg-dim">{s.reviewCount} reseñas</span>
                </div>
              </div>
              {s.effects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.effects.map((e) => (
                    <span key={e} className="pill text-xs">{e}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Full list */}
      <div className="card overflow-hidden">
        {strains.slice(3).map((s, i) => (
          <Link
            key={s.slug}
            to={`/strains/${s.slug}`}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-elev transition-colors ${
              i < strains.length - 4 ? "border-b border-line" : ""
            }`}
          >
            {/* Rank */}
            <div className="shrink-0 w-8 text-right mono text-sm text-fg-dim tnum">
              {s.rank}
            </div>

            {/* Thumb */}
            <div className="shrink-0 h-12 w-12 rounded-md overflow-hidden">
              <StrainThumb
                name={s.name}
                type={s.type as any}
                colorHint={s.colorHint}
                imageUrl={s.imageUrl}
                ratio="square"
                className="w-full h-full"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{s.name}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`pill ${TYPE_PILL[s.type] || ""} text-xs`}>
                  {s.typeBlend || TYPE_LABEL[s.type]}
                </span>
                {s.effects.slice(0, 2).map((e) => (
                  <span key={e} className="pill text-xs hidden sm:inline-flex">{e}</span>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="shrink-0 text-right">
              <div className="mono text-sm tnum" style={{ color: "var(--accent)" }}>
                {s.overall.toFixed(1)}
              </div>
              <div className="text-xs text-fg-dim">{s.reviewCount} reseñas</div>
            </div>

            <Icon name="arrowRight" size={14} className="shrink-0 text-fg-dim" />
          </Link>
        ))}
      </div>

      {strains.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-fg-muted">Aún no hay suficientes reseñas para generar el ranking.</p>
          <Link to="/strains" className="btn btn-primary mt-4">
            Explorar cepas
          </Link>
        </div>
      )}

      {/* SEO footer note */}
      <p className="text-xs text-fg-dim mt-10 text-center">
        Ranking generado automáticamente a partir de reseñas de la comunidad WeedHub ·{" "}
        {new Date(updatedAt).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
