import { resolveLocale } from "~/lib/locale.server";
import { StrainSign } from "~/components/composite/strain-sign";
import { effectLabels } from "~/lib/effect-labels";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/top-100";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { StrainThumb } from "~/components/composite/strain-thumb";
import { RatingStars } from "~/components/composite/rating-stars";
import { Icon } from "~/components/ui/icon";

const UI = {
  es: {
    title: "Top 100 cepas de cannabis según la comunidad | WeedHub",
    description: "Las 100 cepas mejor calificadas por la comunidad de WeedHub, ponderadas por número de reseñas, con THC y tipo.",
    h1: "Top 100",
    lede: "Las cepas mejor calificadas, ponderando cuántas reseñas tiene cada una: un 5.0 con dos reseñas no le gana a un 4.4 con veinte.",
    reviews: (n: number) => (n === 1 ? "1 reseña" : `${n} reseñas`),
    empty: "Todavía no hay suficientes reseñas para armar el ranking.",
    explore: "Explorar cepas",
    types: { sativa: "Sativa", indica: "Indica", hybrid: "Híbrida" } as Record<string, string>,
  },
  pt: {
    title: "Top 100 variedades de cannabis segundo a comunidade | WeedHub",
    description: "As 100 variedades mais bem avaliadas pela comunidade do WeedHub, ponderadas pelo número de avaliações, com THC e tipo.",
    h1: "Top 100",
    lede: "As variedades mais bem avaliadas, ponderando quantas avaliações cada uma tem: um 5.0 com duas avaliações não ganha de um 4.4 com vinte.",
    reviews: (n: number) => (n === 1 ? "1 avaliação" : `${n} avaliações`),
    empty: "Ainda não há avaliações suficientes para montar o ranking.",
    explore: "Explorar variedades",
    types: { sativa: "Sativa", indica: "Indica", hybrid: "Híbrida" } as Record<string, string>,
  },
} as const;

export function meta({ data }: Route.MetaArgs) {
  const loc = data?.locale ?? "es";
  const U = UI[loc];
  const prefix = loc === "pt" ? "/pt" : "";
  return [
    ...buildMeta({ title: U.title, description: U.description, url: `${SITE_URL}${prefix}/top-100`, canonicalPath: "/top-100", locale: loc }),
    data?.strains
      ? {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: U.title.replace(/ \| WeedHub$/, ""),
            url: `${SITE_URL}${prefix}/top-100`,
            numberOfItems: data.strains.length,
            itemListElement: data.strains.slice(0, 20).map((s: any) => ({ "@type": "ListItem", position: s.rank, name: s.name, url: `${SITE_URL}${prefix}/strains/${s.slug}` })),
          },
        }
      : {},
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const locale = (await resolveLocale(request)) === "pt" ? "pt" : "es";
  await connectDB();

  // Bayesian average: a 5.0 from 3 reviews shouldn't beat a 4.3 from 12.
  // score = (n / (n + m)) * avg + (m / (n + m)) * C, where C = site mean, m = prior weight.
  const [{ C = 4 } = {}] = await StrainModel.aggregate([
    { $match: { isArchived: false, reviewCount: { $gte: 1 } } },
    { $group: { _id: null, C: { $avg: "$averageRatings.overall" } } },
  ]);
  const m = 5;
  const strains = await StrainModel.aggregate([
    { $match: { isArchived: false, reviewCount: { $gte: 1 } } },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: [{ $divide: ["$reviewCount", { $add: ["$reviewCount", m] }] }, "$averageRatings.overall"] },
            { $multiply: [{ $divide: [m, { $add: ["$reviewCount", m] }] }, C] },
          ],
        },
      },
    },
    { $sort: { score: -1, reviewCount: -1 } },
    { $limit: 100 },
    {
      $project: {
        name: 1, slug: 1, type: 1, typeBlend: 1, averageRatings: 1, reviewCount: 1, effects: 1,
        imageUrl: 1, colorHint: 1, dominantTerpene: 1, "cannabinoidProfile.thc.max": 1,
      },
    },
  ]);

  return {
    strains: strains.map((s: any, i: number) => ({
      rank: i + 1,
      _id: String(s._id),
      name: s.name,
      slug: s.slug,
      type: s.type,
      typeBlend: s.typeBlend,
      overall: s.averageRatings?.overall ?? 0,
      reviewCount: s.reviewCount ?? 0,
      effects: effectLabels(s.effects ?? [], locale).slice(0, 3),
      rawEffects: s.effects ?? [],
      cannabinoidProfile: s.cannabinoidProfile,
      averageRatings: s.averageRatings,
      imageUrl: s.imageUrl,
      colorHint: s.colorHint,
      dominantTerpene: s.dominantTerpene,
      thcMax: (s.cannabinoidProfile as any)?.thc?.max ?? 0,
    })),
    updatedAt: new Date().toISOString(),
    locale,
  } as const;
}

const TYPE_PILL: Record<string, string> = { sativa: "accent", indica: "warm", hybrid: "lilac" };
const TYPE_LABEL: Record<string, string> = { sativa: "Sativa", indica: "Indica", hybrid: "Híbrida" };

export default function Top100Page() {
  const { strains, locale } = useLoaderData<typeof loader>();
  const U = UI[locale];
  const prefix = locale === "pt" ? "/pt" : "";

  return (
    <div>
      <section className="wall border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <h1 className="rotulo rotulo-shade text-yellow" style={{ fontSize: "clamp(64px, 12vw, 168px)" }}>{U.h1}</h1>
          <p className="mt-5 max-w-[58ch] text-xl font-semibold leading-snug">{U.lede}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
        {strains.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-12 mb-14 pt-4">
            {strains.slice(0, 3).map((s: any) => (
              <div key={s.slug} className="relative">
                <span className="rotulo absolute -top-7 -left-2 z-10 bg-ink text-yellow px-3 py-1 text-3xl -rotate-3">#{s.rank}</span>
                <StrainSign
                  strain={{ name: s.name, slug: s.slug, type: s.type, cannabinoidProfile: s.cannabinoidProfile, effects: s.rawEffects, reviewCount: s.reviewCount, averageRatings: s.averageRatings }}
                  to={`${prefix}/strains/${s.slug}`}
                  locale={locale}
                  size="lg"
                />
              </div>
            ))}
          </div>
        )}

        <ol className="border-t-[3px] border-ink">
          {strains.slice(3).map((s: any) => (
            <li key={s.slug}>
              <Link
                to={`${prefix}/strains/${s.slug}`}
                className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_8rem] items-center gap-3 py-3 border-b-2 border-ink hover:bg-yellow hover:text-ink transition-colors px-1"
              >
                <span className="rotulo text-2xl text-cobalt tnum">{s.rank}</span>
                <span className="min-w-0">
                  <span className="block text-lg font-extrabold [font-stretch:85%] truncate">{s.name}</span>
                  <span className="block text-sm font-semibold text-fg-muted truncate">
                    {U.types[s.type] ?? s.type}
                    {s.effects.length ? ` · ${s.effects.slice(0, 2).join(" · ")}` : ""}
                  </span>
                </span>
                <span className="hidden sm:block text-sm font-bold tnum">{s.thcMax ? `THC ${s.thcMax}%` : ""}</span>
                <span className="text-right">
                  <span className="inline-flex items-center gap-1 text-lg font-black tnum"><Icon name="star" size={14} className="fill-current" />{s.overall.toFixed(1)}</span>
                  <span className="block text-xs font-bold text-fg-muted">{U.reviews(s.reviewCount)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {strains.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-lg font-semibold">{U.empty}</p>
            <Link to={`${prefix}/strains`} className={cn(buttonVariants({ variant: "primary" }), "mt-4")}>{U.explore}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
