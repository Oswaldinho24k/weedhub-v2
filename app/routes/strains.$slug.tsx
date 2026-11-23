import { Link, useFetcher, useOutletContext, Await } from "react-router";
import { Suspense } from "react";
import type { Route } from "./+types/strains.$slug";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { SavedStrainModel } from "~/models/saved-strain.server";
import { getUserFromSession } from "~/lib/auth.server";
import { EffectBar } from "~/components/composite/effect-bar";
import { TimeCurve } from "~/components/composite/time-curve";
import { TerpeneRadar } from "~/components/composite/terpene-radar";
import { MomentoBar } from "~/components/composite/momento-bar";
import { RatingStars } from "~/components/composite/rating-stars";
import { ReviewCard } from "~/components/composite/review-card";
import { StrainCard } from "~/components/composite/strain-card";
import { StrainSign } from "~/components/composite/strain-sign";
import { Icon } from "~/components/ui/icon";
import { useT, useHref } from "~/lib/i18n-context";
import { pickStrainDescription } from "~/lib/strain-description";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { CONDITIONS_BY_SLUG } from "~/constants/conditions";
import { QuickRateWidget } from "~/components/composite/quick-rate-widget";
import { QuickRatingModel } from "~/models/quick-rating.server";
import { GeneticTree } from "~/components/composite/genetic-tree";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { strainSummary, strainFaq } from "~/lib/strain-summary";
import { effectLabels } from "~/lib/effect-labels";
import { resolveLocale } from "~/lib/locale.server";

const WALL: Record<string, string> = {
  sativa: "wall--yellow",
  indica: "wall--pink",
  hybrid: "bg-lime text-ink",
};

const STRAIN_COPY = {
  es: { noReviews: "Sin reseñas aún. Sé la primera persona en contar cómo te fue.", effectsNote: "Ordenados por frecuencia", faqTitle: "Preguntas frecuentes", disclaimer: "Información de referencia, no consejo médico. Los efectos varían por persona, dosis y método. Solo para personas adultas (+18) donde su uso sea legal." },
  pt: { noReviews: "Sem avaliações ainda. Seja a primeira pessoa a contar como foi.", effectsNote: "Ordenados por frequência", faqTitle: "Perguntas frequentes", disclaimer: "Informação de referência, não é aconselhamento médico. Os efeitos variam por pessoa, dose e método. Apenas para adultos (+18) onde o uso for legal." },
  en: { noReviews: "No reviews yet. Be the first to share how it went.", effectsNote: "Ordered by frequency", faqTitle: "Frequently asked questions", disclaimer: "Reference information, not medical advice. Effects vary by person, dose and method. Adults only (18+) where legal." },
} as const;

const TYPE_PILL: Record<string, string> = {
  sativa: "accent",
  indica: "warm",
  hybrid: "lilac",
};

const META_TITLE = {
  es: (n: string) => `${n}: efectos, THC y terpenos | WeedHub`,
  pt: (n: string) => `${n}: efeitos, THC e terpenos | WeedHub`,
  en: (n: string) => `${n} strain: effects, THC and terpenes | WeedHub`,
};

export function meta({ data }: Route.MetaArgs) {
  const strain = data?.strain;
  if (!strain) return [{ title: "WeedHub" }];
  const locale = (data?.locale || "es") as keyof typeof META_TITLE;
  const prefix = locale !== "es" ? `/${locale}` : "";
  const description = strainSummary(strain as any, locale);
  return buildMeta({
    title: META_TITLE[locale](strain.name),
    description: description.length > 158 ? description.slice(0, 155).replace(/\s+\S*$/, "") + "…" : description,
    url: `${SITE_URL}${prefix}/strains/${strain.slug}`,
    image: strain.imageUrl || undefined,
    type: "article",
    locale,
    canonicalPath: `/strains/${strain.slug}`,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await connectDB();
  const strain = await StrainModel.findOne({ slug: params.slug, isArchived: false }).lean();
  if (!strain) throw new Response("Cepa no encontrada", { status: 404 });

  // Synchronous: affects initial render state (save button, star widget)
  const user = await getUserFromSession(request);
  let isSaved = false;
  let existingQuickRating: number | undefined;
  if (user) {
    const [saved, qr] = await Promise.all([
      SavedStrainModel.findOne({ userId: user._id, strainId: strain._id }),
      QuickRatingModel.findOne({ userId: user._id, strainId: strain._id }).select("rating").lean(),
    ]);
    isSaved = !!saved;
    existingQuickRating = qr?.rating;
  }

  const strainEffects = strain.effects || [];
  const strainFlavors = strain.flavors || [];
  const strainTerpeneNames = (strain.terpenes || []).map((t: any) => t.name);

  // Deferred: slow queries that stream after initial HTML is sent
  const reviewsPromise = ReviewModel.find({ strainId: strain._id, status: "published" })
    .sort({ helpfulCount: -1, createdAt: -1 })
    .limit(10)
    .populate(
      "userId",
      "username anonymousHandle avatar earnedBadges publishAsAnonymous country city showCityPublicly"
    )
    .lean()
    .then((reviews) =>
      reviews.map((r) => {
        const u = r.userId as any;
        return {
          _id: String(r._id),
          ratings: r.ratings,
          comment: r.comment,
          context: r.context,
          effectsExperienced: r.effectsExperienced,
          helpfulVotes: (r.helpfulVotes || []).map(String),
          helpfulCount: r.helpfulCount,
          createdAt: r.createdAt.toISOString(),
          publishedAs: r.publishedAs,
          user: u
            ? {
                username: u.username,
                anonymousHandle: u.anonymousHandle,
                avatar: u.avatar,
                earnedBadges: u.earnedBadges,
                publishAsAnonymous: u.publishAsAnonymous,
                country: u.country,
                city: u.city,
                showCityPublicly: u.showCityPublicly,
              }
            : undefined,
        };
      })
    );

  const similarStrainsPromise = StrainModel.aggregate([
    {
      $match: {
        isArchived: false,
        _id: { $ne: strain._id },
        effects: { $elemMatch: { $in: strainEffects } },
      },
    },
    {
      $addFields: {
        sharedEffects: { $size: { $setIntersection: ["$effects", strainEffects] } },
        sharedFlavors: { $size: { $setIntersection: ["$flavors", strainFlavors] } },
        sharedTerpeneNames: {
          $filter: {
            input: { $map: { input: "$terpenes", as: "t", in: "$$t.name" } },
            as: "name",
            cond: { $in: ["$$name", strainTerpeneNames] },
          },
        },
      },
    },
    {
      $addFields: {
        sharedTerpeneCount: { $size: "$sharedTerpeneNames" },
        similarityScore: {
          $add: [
            { $multiply: ["$sharedEffects", 3] },
            { $multiply: ["$sharedFlavors", 2] },
            { $multiply: [{ $size: "$sharedTerpeneNames" }, 2] },
          ],
        },
      },
    },
    { $sort: { similarityScore: -1, "averageRatings.overall": -1 } },
    { $limit: 4 },
  ]).then((results) =>
    results.map((s: any) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: s.updatedAt?.toISOString?.() || new Date().toISOString(),
      sharedEffects: s.sharedEffects ?? 0,
      sharedFlavors: s.sharedFlavors ?? 0,
    }))
  );

  return {
    locale: await resolveLocale(request),
    strain: {
      ...strain,
      _id: String(strain._id),
      createdAt: strain.createdAt.toISOString(),
      updatedAt: strain.updatedAt.toISOString(),
    },
    reviews: reviewsPromise,
    isSaved,
    existingQuickRating,
    similarStrains: similarStrainsPromise,
  };
}

export default function StrainDetailPage({ loaderData }: Route.ComponentProps) {
  const { strain, isSaved, existingQuickRating } = loaderData;
  const context = useOutletContext<{ user?: any; locale?: "es" | "pt" | "en" }>();
  const currentUser = context?.user;
  const locale = context?.locale || "es";
  const t = useT();
  const href = useHref();
  const saveFetcher = useFetcher();
  const optimisticSaved = saveFetcher.state !== "idle" ? !isSaved : isSaved;
  const pillVariant = TYPE_PILL[strain.type] || "";
  const typeLabel =
    strain.type === "sativa"
      ? t.strainTypes.sativa
      : strain.type === "indica"
        ? t.strainTypes.indica
        : t.strainTypes.hybrid;
  const strainDescription = pickStrainDescription(strain, locale);

  // Normalize effects for bars: use flat strain.effects list with synthetic values
  // based on position (seed doesn't have numeric effect values).
  const tEffect = (key: string) => (t.effects as Record<string, string>)[key] ?? key;
  const tFlavor = (key: string) => (t.flavors as Record<string, string>)[key] ?? key;

  const effectList = effectLabels(strain.effects || [], locale).slice(0, 6);
  const summary = strainSummary(strain as any, locale);
  const faq = strainFaq(strain as any, locale);

  // Terpene radar expects 0..1 values. Scale percentages (usually 0..2%).
  const radarData = (strain.terpenes || []).slice(0, 6).map((t: any) => ({
    name: t.name,
    value: Math.min(1, t.percentage / 2),
  }));

  const prefix = locale !== "es" ? `/${locale}` : "";

  const pageUrl = `${SITE_URL}${prefix}/strains/${strain.slug}`;
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    name: strain.name,
    inLanguage: locale === "pt" ? "pt-BR" : locale,
    description: summary,
    dateModified: strain.updatedAt,
    isPartOf: { "@type": "WebSite", name: "WeedHub", url: SITE_URL },
    about: {
      "@type": "Thing",
      name: strain.name,
      alternateName: strain.aliases?.length ? strain.aliases : undefined,
      description: summary,
    },
  };
  const faqJsonLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "WeedHub",
        item: `${SITE_URL}${prefix}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t.nav.directory,
        item: `${SITE_URL}${prefix}/strains`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: strain.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Wall: type-colored field with the strain lettered on it */}
      <section className={cn("border-b-[3px] border-ink", WALL[strain.type] ?? "wall")}>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-5 pb-12">
          <nav aria-label="Breadcrumb" className="text-[14px] font-bold [font-stretch:85%] flex items-center gap-1.5 flex-wrap opacity-90">
            <Link to={href("/")} className="hover:underline underline-offset-4 decoration-2">WeedHub</Link>
            <Icon name="chevronRight" size={12} />
            <Link to={href("/strains")} className="hover:underline underline-offset-4 decoration-2">{t.nav.directory}</Link>
            <Icon name="chevronRight" size={12} />
            <span aria-current="page">{strain.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            <div>
              <h1 className="rotulo break-words" style={{ fontSize: "clamp(48px, 8.5vw, 112px)", lineHeight: 0.9 }}>
                {strain.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-4">
                <span className="pill active">{strain.typeBlend || typeLabel}</span>
                {strain.lineage && <span className="pill">{strain.lineage}</span>}
              </div>
              {strain.aliases && strain.aliases.length > 0 && (
                <p className="mt-3 text-[15px] font-semibold">
                  {t.strain.alsoKnownAs}: {strain.aliases.join(" · ")}
                </p>
              )}

              {/* Direct answer block (40–60 words, built from data) */}
              <p className="mt-6 text-[19px] leading-relaxed font-medium max-w-[56ch]">{summary}</p>
              {strain.editorialNote?.status === "aprobado" && strain.editorialNote.text && (
                <aside className="mt-6 max-w-[58ch] bg-white text-ink border-2 border-ink p-4 -rotate-[0.6deg]">
                  <p className="text-[13px] font-extrabold uppercase [font-stretch:78%] mb-1.5">Nota de la redacción</p>
                  <p className="text-[17px] leading-relaxed">{strain.editorialNote.text}</p>
                </aside>
              )}
              {strainDescription && strainDescription !== summary && strainDescription.trim() !== strain.name && strainDescription.length > 40 && (
                <p className="mt-4 text-[16px] leading-relaxed max-w-[60ch] opacity-90">{strainDescription}</p>
              )}

              <div className="mt-8 flex items-center gap-3 flex-wrap">
                <Link to={`/strains/${strain.slug}/review`} className={buttonVariants({ variant: "primary" })}>
                  <Icon name="edit" size={15} />
                  {t.strain.publishReview}
                </Link>
                {currentUser && (
                  <saveFetcher.Form method="post" action={`/api/strains/${strain._id}/save`}>
                    <Button type="submit" variant="ghost" aria-pressed={optimisticSaved}>
                      <Icon name={optimisticSaved ? "bookmarkOn" : "bookmark"} size={15} />
                      {optimisticSaved ? t.strain.savedStrain : t.strain.saveStrain}
                    </Button>
                  </saveFetcher.Form>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && "share" in navigator) {
                      navigator.share({ title: strain.name, url: window.location.href });
                    } else if (typeof navigator !== "undefined") {
                      (navigator as Navigator).clipboard?.writeText(window.location.href);
                    }
                  }}
                >
                  <Icon name="share" size={15} />
                  {t.strain.share}
                </Button>
              </div>
            </div>

            {/* The price card: lettered data */}
            <dl className="cartulina cartulina--blank cartulina-pin bg-white p-6 lg:rotate-[1.5deg] grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="col-span-2 border-b-2 border-ink pb-4">
                <dt className="text-[13px] font-extrabold uppercase [font-stretch:78%]">{t.strain.heroStats.thc}</dt>
                <dd className="rotulo leading-none mt-1" style={{ fontSize: "clamp(64px, 9vw, 96px)" }}>
                  {strain.cannabinoidProfile?.thc?.max ? (
                    <>
                      {strain.cannabinoidProfile.thc.max}
                      <span style={{ fontSize: "0.45em" }}>%</span>
                    </>
                  ) : (
                    <span className="font-[Archivo] text-2xl font-bold normal-case">—</span>
                  )}
                </dd>
              </div>
              <DataCell label={t.strain.heroStats.cbd} value={strain.cannabinoidProfile?.cbd?.max ? `${strain.cannabinoidProfile.cbd.max}%` : "—"} />
              <DataCell label={t.strain.heroStats.terpene} value={strain.dominantTerpene || "—"} />
              <DataCell label={t.strain.heroStats.effect} value={effectList[0] || "—"} />
              <DataCell label={t.strain.heroStats.difficulty} value={strain.difficulty || "—"} />
              <div className="col-span-2 border-t-2 border-ink pt-4 flex items-center gap-3 flex-wrap">
                {strain.reviewCount > 0 ? (
                  <>
                    <RatingStars rating={strain.averageRatings.overall || 0} size="md" />
                    <span className={cn("tnum", strain.reviewCount >= 10 ? "text-2xl font-black" : "text-lg font-bold")}>
                      {(strain.averageRatings.overall || 0).toFixed(1)}
                    </span>
                    <span className="text-sm font-bold">
                      {strain.reviewCount} {t.strain.reviewsCount}
                    </span>
                  </>
                ) : (
                  <span className="text-[15px] font-bold">{STRAIN_COPY[locale].noReviews}</span>
                )}
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Genetics tree */}
      {(strain.genetics?.parent1 || strain.genetics?.parent2 || (strain.genetics?.children && strain.genetics.children.length > 0)) && (
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 border-t-[3px] border-ink">
          <h2 className="display text-2xl mb-6">Árbol genético</h2>
          <GeneticTree strain={strain as any} />
        </section>
      )}

      {/* Effects + Time curve */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="display text-2xl">{t.strain.effectsPanelTitle}</h2>
              <span className="text-sm font-semibold text-fg-muted">{STRAIN_COPY[locale].effectsNote}</span>
            </div>
            {effectList.length > 0 ? (
              <ol className="flex flex-col">
                {effectList.map((e, i) => (
                  <li key={e} className="flex items-center gap-4 py-2.5 border-b-2 border-ink last:border-b-0">
                    <span className="rotulo text-xl w-6 text-cobalt">{i + 1}</span>
                    <span className="text-lg font-bold [font-stretch:85%]">{e}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-fg-muted">{t.strain.noEffectsData}</p>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="display text-2xl">{t.strain.curvePanelTitle}</h2>
              <span className="kicker">{t.strain.curveSubtitle}</span>
            </div>
            {strain.timeCurve && strain.timeCurve.length > 0 ? (
              <TimeCurve data={strain.timeCurve as any} />
            ) : (
              <p className="text-sm text-fg-muted">{t.strain.noCurve}</p>
            )}
          </div>
        </div>
      </section>

      {/* Terpenes + Flavors/Momento */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
          <div className="card p-6">
            <h2 className="display text-2xl mb-5">{t.strain.terpenesTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-6 items-center">
              {radarData.length > 0 && <TerpeneRadar terpenes={radarData} />}
              <ul className="flex flex-col gap-3">
                {(strain.terpenes || []).slice(0, 6).map((terp: any) => (
                  <li
                    key={terp.name}
                    className="flex items-baseline justify-between border-b border-line pb-2"
                  >
                    <Link
                      to={`${prefix}/strains?terpene=${encodeURIComponent(terp.name)}`}
                      className="text-sm text-fg hover:text-accent transition-colors"
                    >
                      {terp.name}
                    </Link>
                    <span className="mono text-xs text-fg-muted tnum">
                      {terp.percentage.toFixed(2)}%
                    </span>
                  </li>
                ))}
                {(!strain.terpenes || strain.terpenes.length === 0) && (
                  <li className="text-sm text-fg-muted">{t.strain.noTerpenes}</li>
                )}
              </ul>
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <div>
              <h2 className="display text-2xl mb-4">{t.strain.flavorsTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {(strain.flavors || []).map((f: string) => (
                  <span key={f} className="pill accent">
                    {tFlavor(f)}
                  </span>
                ))}
                {(!strain.flavors || strain.flavors.length === 0) && (
                  <span className="text-sm text-fg-muted">{t.strain.noFlavors}</span>
                )}
              </div>
            </div>
            {strain.momento && (
              <MomentoBar
                locale={locale}
                manana={strain.momento.manana || 0}
                tarde={strain.momento.tarde || 0}
                noche={strain.momento.noche || 0}
              />
            )}
          </div>
        </div>
      </section>

      {/* Grow info */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 border-t-[3px] border-ink">
        <h2 className="display text-2xl md:text-3xl mb-6">Datos de cultivo</h2>
        {strain.grow && (strain.grow.floweringWeeks || strain.grow.yieldIndoor || strain.grow.yieldOutdoor || strain.grow.climate || strain.grow.isAutoflowering || strain.grow.isFeminized) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {strain.grow.floweringWeeks && (
              <GrowStat
                label="Floración"
                value={`${strain.grow.floweringWeeks.min}–${strain.grow.floweringWeeks.max} sem`}
              />
            )}
            {strain.difficulty && (
              <GrowStat label="Dificultad" value={strain.difficulty} />
            )}
            {strain.grow.yieldIndoor && (
              <GrowStat label="Indoor" value={strain.grow.yieldIndoor} />
            )}
            {strain.grow.yieldOutdoor && (
              <GrowStat label="Outdoor" value={strain.grow.yieldOutdoor} />
            )}
            {strain.grow.heightCm && (
              <GrowStat
                label="Altura"
                value={`${strain.grow.heightCm.min}–${strain.grow.heightCm.max} cm`}
              />
            )}
            {strain.grow.climate && (
              <GrowStat label="Clima" value={capitalizeFirst(strain.grow.climate)} />
            )}
            {strain.grow.isAutoflowering && <GrowStat label="Tipo" value="Autofloreciente" />}
            {strain.grow.isFeminized && <GrowStat label="Semillas" value="Feminizadas" />}
          </div>
        ) : (
          <p className="text-sm text-fg-muted">Datos de cultivo no disponibles aún para esta cepa.</p>
        )}
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <h2 className="display text-3xl">{t.strain.experiencesFromCommunity}</h2>
            <div className="card p-5">
              <div className="display text-6xl tnum mb-1">
                {(strain.averageRatings.overall || 0).toFixed(1)}
              </div>
              <RatingStars rating={strain.averageRatings.overall || 0} size="md" />
              <div className="kicker mt-2">
                {strain.reviewCount} {t.strain.reviewsCount}
              </div>

              {strain.reviewCount > 0 && (
                <div className="mt-5 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      strain.reviewDistribution?.[star as 1 | 2 | 3 | 4 | 5] || 0;
                    const pct =
                      strain.reviewCount > 0 ? (count / strain.reviewCount) * 100 : 0;
                    return (
                      <div
                        key={star}
                        className="grid grid-cols-[14px_1fr_28px] items-center gap-2 text-xs"
                      >
                        <span className="text-fg-dim tnum">{star}</span>
                        <span className="h-1 rounded-full bg-sunken overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${pct}%`, background: "var(--fg)" }}
                          />
                        </span>
                        <span className="text-fg-dim tnum text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Link
              to={`/strains/${strain.slug}/review`}
              className={cn(buttonVariants({ variant: "primary" }), "w-full")}
            >
              <Icon name="edit" size={14} />
              {t.strain.writeReview}
            </Link>

            <div className="card p-4 space-y-2">
              <div className="kicker text-xs">Rating rápido</div>
              <QuickRateWidget
                strainId={strain._id}
                isLoggedIn={!!currentUser}
                existingRating={existingQuickRating}
              />
            </div>
          </aside>

          <Suspense fallback={<ReviewsSkeleton />}>
            <Await resolve={loaderData.reviews}>
              {(reviews: any[]) => (
                <div>
                  {reviews.length === 0 ? (
                    <div className="card p-10 text-center">
                      <p className="text-fg-muted mb-4">{t.strain.noReviewsYet}</p>
                      <Link
                        to={`/strains/${strain.slug}/review`}
                        className={cn(buttonVariants({ variant: "primary" }), "inline-flex")}
                      >
                        {t.strain.beFirst}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {reviews.map((review: any) => (
                        <ReviewCard
                          key={review._id}
                          review={review}
                          currentUserId={currentUser?._id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Await>
          </Suspense>
        </div>
      </section>

      {/* Condition votes */}
      {strain.conditionVotes && Object.keys(strain.conditionVotes).length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 border-t-[3px] border-ink">
          <h2 className="display text-2xl md:text-3xl mb-3">{locale === "pt" ? "Para que a comunidade usa" : "¿Para qué la usa la comunidad?"}</h2>
          <p className="mb-6 max-w-[60ch] text-[15px] font-semibold border-2 border-ink bg-yellow text-ink px-3 py-2">{STRAIN_COPY[locale].disclaimer}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            {Object.entries(strain.conditionVotes as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([slug, votes]) => {
                const cond = CONDITIONS_BY_SLUG[slug];
                if (!cond) return null;
                const pct = strain.reviewCount > 0 ? Math.round((votes / strain.reviewCount) * 100) : 0;
                return (
                  <Link
                    key={slug}
                    to={`${prefix}/para/${slug}`}
                    className="card p-4 flex items-center gap-3 hover:bg-yellow hover:text-ink transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-fg">{locale === "pt" ? cond.labelPt : cond.labelEs}</div>
                      <div className="h-2 mt-1.5 overflow-hidden border border-ink" style={{ background: "var(--bg-sunken)" }}>
                        <div className="h-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                    <div className="shrink-0 mono text-xs text-fg-muted tnum">{pct}%</div>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      {/* FAQ: plain answers built from the record */}
      {faq.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14 border-t-[3px] border-ink">
          <h2 className="display text-3xl md:text-5xl mb-8">{STRAIN_COPY[locale].faqTitle}</h2>
          <div className="grid gap-x-10 md:grid-cols-2">
            {faq.map((f) => (
              <div key={f.q} className="py-5 border-b-2 border-ink">
                <h3 className="text-xl font-extrabold [font-stretch:85%] leading-snug">{f.q}</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-fg-muted">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold text-fg-muted max-w-[70ch]">{STRAIN_COPY[locale].disclaimer}</p>
        </section>
      )}

      {/* Similar */}
      <Suspense fallback={<SimilarStrainsSkeleton />}>
        <Await resolve={loaderData.similarStrains}>
          {(similarStrains: any[]) =>
            similarStrains.length > 0 ? (
              <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14 border-t-[3px] border-ink">
                <h2 className="display text-3xl md:text-4xl mb-8">{t.strain.similarTitle}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 pt-2">
                  {similarStrains.map((s: any) => (
                    <div key={s._id} className="flex flex-col gap-3">
                      <StrainSign strain={s} to={href(`/strains/${s.slug}`)} locale={locale} />
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {s.sharedEffects > 0 && (
                          <span className="pill accent text-xs">
                            {s.sharedEffects} efecto{s.sharedEffects !== 1 ? "s" : ""} comunes
                          </span>
                        )}
                        {s.sharedFlavors > 0 && (
                          <span className="pill text-xs">
                            {s.sharedFlavors} sabor{s.sharedFlavors !== 1 ? "es" : ""} similares
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          }
        </Await>
      </Suspense>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-elev" />
            <div className="h-3 w-32 rounded bg-elev" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-elev" />
            <div className="h-3 w-4/5 rounded bg-elev" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SimilarStrainsSkeleton() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14 border-t-[3px] border-ink">
      <div className="h-3 w-24 rounded bg-elev mb-3 animate-pulse" />
      <div className="h-8 w-64 rounded bg-elev mb-8 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="aspect-[4/3] rounded bg-elev mb-3" />
            <div className="h-4 w-3/4 rounded bg-elev mb-2" />
            <div className="h-3 w-1/2 rounded bg-elev" />
          </div>
        ))}
      </div>
    </section>
  );
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function GrowStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="kicker mb-1.5">{label}</div>
      <div className="mono text-sm" style={{ color: "var(--accent)" }}>{value}</div>
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] font-extrabold uppercase [font-stretch:78%]">{label}</dt>
      <dd className="text-xl font-extrabold [font-stretch:85%] leading-tight mt-0.5 break-words">{value}</dd>
    </div>
  );
}

function HeroStat({
  kicker,
  value,
  tone,
}: {
  kicker: string;
  value: string | number;
  tone?: "accent";
}) {
  return (
    <div>
      <div className="kicker mb-1">{kicker}</div>
      <div
        className="mono text-sm tnum"
        style={{ color: tone === "accent" ? "var(--accent)" : "var(--fg)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-24 text-center">
      <h1 className="display text-3xl mb-4">Cepa no encontrada</h1>
      <p className="text-fg-muted mb-8">Esta cepa no existe o fue archivada.</p>
      <a href="/strains" className={buttonVariants({ variant: "primary" })}>Ver todas las cepas</a>
    </div>
  );
}
