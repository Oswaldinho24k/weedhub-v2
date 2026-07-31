import { Link, useFetcher, useOutletContext } from "react-router";
import type { Route } from "./+types/strains.$slug";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { SavedStrainModel } from "~/models/saved-strain.server";
import { getUserFromSession } from "~/lib/auth.server";
import { StrainThumb } from "~/components/composite/strain-thumb";
import { EffectBar } from "~/components/composite/effect-bar";
import { TimeCurve } from "~/components/composite/time-curve";
import { TerpeneRadar } from "~/components/composite/terpene-radar";
import { MomentoBar } from "~/components/composite/momento-bar";
import { RatingStars } from "~/components/composite/rating-stars";
import { ReviewCard } from "~/components/composite/review-card";
import { StrainCard } from "~/components/composite/strain-card";
import { Icon } from "~/components/ui/icon";
import { useT, useHref } from "~/lib/i18n-context";
import { pickStrainDescription } from "~/lib/strain-description";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { CONDITIONS_BY_SLUG } from "~/constants/conditions";
import { QuickRateWidget } from "~/components/composite/quick-rate-widget";
import { QuickRatingModel } from "~/models/quick-rating.server";
import { GeneticTree } from "~/components/composite/genetic-tree";

const TYPE_PILL: Record<string, string> = {
  sativa: "accent",
  indica: "warm",
  hybrid: "lilac",
};

export function meta({ data }: Route.MetaArgs) {
  const strain = data?.strain;
  const name = strain?.name || "Cepa";
  const description = strain?.descriptionEs || strain?.description || "";
  return buildMeta({
    title: `${name} — WeedHub`,
    description: description.slice(0, 160),
    url: `${SITE_URL}/strains/${strain?.slug || ""}`,
    image: strain?.imageUrl || undefined,
    type: "product",
    canonicalPath: `/strains/${strain?.slug || ""}`,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await connectDB();
  const strain = await StrainModel.findOne({ slug: params.slug, isArchived: false }).lean();
  if (!strain) throw new Response("Cepa no encontrada", { status: 404 });

  const reviews = await ReviewModel.find({ strainId: strain._id, status: "published" })
    .sort({ helpfulCount: -1, createdAt: -1 })
    .limit(10)
    .populate(
      "userId",
      "username anonymousHandle avatar earnedBadges publishAsAnonymous country city showCityPublicly"
    )
    .lean();

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

  const similarStrains = await StrainModel.aggregate([
    {
      $match: {
        isArchived: false,
        _id: { $ne: strain._id },
        // Must share at least one effect to be relevant
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
          ],
        },
      },
    },
    { $sort: { similarityScore: -1, "averageRatings.overall": -1 } },
    { $limit: 4 },
  ]);

  return {
    strain: {
      ...strain,
      _id: String(strain._id),
      createdAt: strain.createdAt.toISOString(),
      updatedAt: strain.updatedAt.toISOString(),
    },
    reviews: reviews.map((r) => {
      const u = r.userId as any;
      return {
        _id: String(r._id),
        ratings: r.ratings,
        comment: r.comment,
        context: r.context,
        effectsExperienced: r.effectsExperienced,
        helpfulVotes: r.helpfulVotes.map(String),
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
    }),
    isSaved,
    existingQuickRating,
    similarStrains: similarStrains.map((s: any) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: s.updatedAt?.toISOString?.() || new Date().toISOString(),
      // Keep similarity metadata for UI
      sharedEffects: s.sharedEffects ?? 0,
      sharedFlavors: s.sharedFlavors ?? 0,
    })),
  };
}

export default function StrainDetailPage({ loaderData }: Route.ComponentProps) {
  const { strain, reviews, isSaved, similarStrains, existingQuickRating } = loaderData;
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

  const effectValues = (strain.effects || []).slice(0, 5).map((e: string, i: number) => ({
    label: tEffect(e),
    value: 90 - i * 10,
  }));

  // Terpene radar expects 0..1 values. Scale percentages (usually 0..2%).
  const radarData = (strain.terpenes || []).slice(0, 6).map((t: any) => ({
    name: t.name,
    value: Math.min(1, t.percentage / 2),
  }));

  const prefix = locale !== "es" ? `/${locale}` : "";

  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: strain.name,
    description: strain.descriptionEs || strain.description,
    url: `${SITE_URL}/strains/${strain.slug}`,
    ...(strain.imageUrl ? { image: strain.imageUrl } : {}),
  };
  if (strain.reviewCount > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: strain.averageRatings.overall.toFixed(1),
      reviewCount: strain.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

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
        item: `${SITE_URL}/strains/${strain.slug}`,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Back */}
      <div className="mx-auto max-w-[1200px] px-6 pt-6">
        <Link
          to={href("/strains")}
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <Icon name="arrowLeft" size={14} />
          {t.strain.backToDirectory}
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pt-8 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className={`pill ${pillVariant}`}>
                {strain.typeBlend || typeLabel}
              </span>
              {strain.lineage && <span className="pill">{strain.lineage}</span>}
            </div>
            <h1
              className="display"
              style={{ fontSize: "clamp(48px, 7vw, 120px)", lineHeight: 0.98 }}
            >
              {strain.name}
            </h1>
            {strain.aliases && strain.aliases.length > 0 && (
              <div className="mt-3 text-xs text-fg-dim">
                <span className="kicker mr-2">{t.strain.alsoKnownAs}</span>
                {strain.aliases.join(" · ")}
              </div>
            )}
            <p className="mt-6 text-lg text-fg-muted leading-relaxed max-w-[54ch]">
              {strainDescription}
            </p>

            <div className="mt-6 flex items-center gap-4">
              <RatingStars rating={strain.averageRatings.overall || 0} size="md" />
              <span className="mono text-sm tnum">
                {(strain.averageRatings.overall || 0).toFixed(1)}
              </span>
              <span className="text-sm text-fg-dim">
                {strain.reviewCount} {t.strain.reviewsCount}
              </span>
            </div>

            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link
                to={`/strains/${strain.slug}/review`}
                className="btn btn-primary"
              >
                <Icon name="edit" size={14} />
                {t.strain.publishReview}
              </Link>
              {currentUser && (
                <saveFetcher.Form method="post" action={`/api/strains/${strain._id}/save`}>
                  <button type="submit" className="btn btn-ghost">
                    <Icon name={optimisticSaved ? "bookmarkOn" : "bookmark"} size={14} />
                    {optimisticSaved ? t.strain.savedStrain : t.strain.saveStrain}
                  </button>
                </saveFetcher.Form>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (typeof navigator !== "undefined" && "share" in navigator) {
                    navigator.share({
                      title: strain.name,
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Icon name="share" size={14} />
                {t.strain.share}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <StrainThumb
              name={strain.name}
              type={strain.type as any}
              colorHint={strain.colorHint}
              dominantTerpene={strain.dominantTerpene}
              thcMax={strain.cannabinoidProfile?.thc?.max}
              imageUrl={strain.imageUrl}
              ratio="wide"
              className="w-full"
            />
            <div className="card p-5 grid grid-cols-5 gap-3">
              <HeroStat kicker={t.strain.heroStats.thc} value={`${strain.cannabinoidProfile.thc.max}%`} tone="accent" />
              <HeroStat kicker={t.strain.heroStats.cbd} value={`${strain.cannabinoidProfile.cbd.max || 0}%`} />
              <HeroStat kicker={t.strain.heroStats.terpene} value={strain.dominantTerpene || "—"} />
              <HeroStat
                kicker={t.strain.heroStats.effect}
                value={tEffect((strain.effects || [])[0] || "") || "—"}
              />
              <HeroStat kicker={t.strain.heroStats.difficulty} value={strain.difficulty || "—"} />
            </div>
          </div>
        </div>
      </section>

      {/* Genetics tree */}
      {(strain.genetics?.parent1 || strain.genetics?.parent2 || (strain.genetics?.children && strain.genetics.children.length > 0)) && (
        <section className="mx-auto max-w-[1200px] px-6 py-8 border-t border-line">
          <div className="kicker mb-3">Genética</div>
          <h2 className="display text-2xl mb-6">Árbol genético</h2>
          <GeneticTree strain={strain as any} />
        </section>
      )}

      {/* Effects + Time curve */}
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="display text-2xl">{t.strain.effectsPanelTitle}</h2>
              <span className="kicker">
                {t.strain.effectsAccording.replace("{count}", String(strain.reviewCount || 0))}
              </span>
            </div>
            <div className="space-y-4">
              {effectValues.length > 0 ? (
                effectValues.map((e) => (
                  <EffectBar key={e.label} label={e.label} value={e.value} />
                ))
              ) : (
                <p className="text-sm text-fg-muted">{t.strain.noEffectsData}</p>
              )}
            </div>
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
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
          <div className="card p-6">
            <h2 className="display text-2xl mb-5">{t.strain.terpenesTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-center">
              {radarData.length > 0 && <TerpeneRadar terpenes={radarData} />}
              <ul className="flex flex-col gap-3">
                {(strain.terpenes || []).slice(0, 6).map((terp: any) => (
                  <li
                    key={terp.name}
                    className="flex items-baseline justify-between border-b border-line pb-2"
                  >
                    <span className="text-sm text-fg">{terp.name}</span>
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
                manana={strain.momento.manana || 0}
                tarde={strain.momento.tarde || 0}
                noche={strain.momento.noche || 0}
              />
            )}
          </div>
        </div>
      </section>

      {/* Grow info */}
      {strain.grow && (strain.grow.floweringWeeks || strain.grow.yieldIndoor || strain.grow.yieldOutdoor) && (
        <section className="mx-auto max-w-[1200px] px-6 py-10 border-t border-line">
          <div className="kicker mb-3">Para cultivadores</div>
          <h2 className="display text-2xl md:text-3xl mb-6">Datos de cultivo</h2>
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
        </section>
      )}

      {/* Reviews */}
      <section className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="kicker">{t.strain.experiencesTitle}</div>
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
                            style={{ width: `${pct}%`, background: "var(--gold)" }}
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
              className="btn btn-primary w-full"
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

          <div>
            {reviews.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-fg-muted mb-4">{t.strain.noReviewsYet}</p>
                <Link
                  to={`/strains/${strain.slug}/review`}
                  className="btn btn-primary inline-flex"
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
        </div>
      </section>

      {/* Condition votes */}
      {strain.conditionVotes && Object.keys(strain.conditionVotes).length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-10 border-t border-line">
          <div className="kicker mb-3">Reportado por la comunidad</div>
          <h2 className="display text-2xl md:text-3xl mb-6">¿Para qué ayuda?</h2>
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
                    to={`/para/${slug}`}
                    className="card p-4 flex items-center gap-3 hover:border-accent transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ background: "var(--sunken)" }}>
                      {cond.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-fg">{cond.labelEs}</div>
                      <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "var(--sunken)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                    <div className="shrink-0 mono text-xs text-fg-muted tnum">{pct}%</div>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      {/* Similar */}
      {similarStrains.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-14 border-t border-line">
          <div className="kicker mb-3">{t.strain.similarKicker}</div>
          <h2 className="display text-3xl md:text-4xl mb-8">{t.strain.similarTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarStrains.map((s: any) => (
              <div key={s._id} className="flex flex-col gap-2">
                <StrainCard strain={s} />
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
      )}
    </div>
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
