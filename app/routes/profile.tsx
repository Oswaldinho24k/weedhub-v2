import { useState } from "react";
import { Link, useOutletContext } from "react-router";
import type { Route } from "./+types/profile";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { StrainSubmissionModel } from "~/models/strain-submission.server";
import { BADGES, getCurrentLevel, getNextLevel, getShowcaseBadge, LEVEL_EMOJI, LEVEL_COLOR, LEVEL_COLOR_DARK } from "~/constants/gamification";
import { countryLabel, countryFlag } from "~/constants/locations";
import { Icon } from "~/components/ui/icon";
import { buttonVariants } from "~/components/ui/button";
import { StatusPill } from "~/components/ui/status-pill";
import { Tag } from "~/components/ui/tag";
import { RatingStars } from "~/components/composite/rating-stars";
import { useT } from "~/lib/i18n-context";
import { formatDate, cn } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Mi perfil — WeedHub",
    description:
      "Tu perfil en WeedHub: reseñas, insignias y tu progreso en la comunidad cannábica.",
    url: `${SITE_URL}/profile`,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  await connectDB();

  const [recentReviews, mySubmissions, typeAgg] = await Promise.all([
    ReviewModel.find({
      userId: user._id,
      status: "published",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("strainId", "name slug type colorHint imageUrl")
      .lean(),
    StrainSubmissionModel.find({ submittedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("linkedStrainId", "name slug")
      .lean(),
    ReviewModel.aggregate([
      { $match: { userId: user._id, status: "published" } },
      { $lookup: { from: "strains", localField: "strainId", foreignField: "_id", as: "strain" } },
      { $unwind: { path: "$strain", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$strain.type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  return {
    user: {
      _id: String(user._id),
      username: user.username,
      anonymousHandle: user.anonymousHandle,
      publishAsAnonymous: user.publishAsAnonymous !== false,
      displayName: user.displayName || user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      country: user.country || "MX",
      city: user.city,
      showCityPublicly: !!user.showCityPublicly,
      cannabisProfile: user.cannabisProfile,
      stats: user.stats,
      earnedBadges: user.earnedBadges,
      points: user.points,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt?.toISOString(),
    },
    favoriteType: (typeAgg[0]?._id as string | null) ?? null,
    recentReviews: recentReviews.map((r) => ({
      _id: String(r._id),
      ratings: r.ratings,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      strain: r.strainId
        ? {
            name: (r.strainId as any).name,
            slug: (r.strainId as any).slug,
            type: (r.strainId as any).type,
            colorHint: (r.strainId as any).colorHint,
            imageUrl: (r.strainId as any).imageUrl,
          }
        : null,
    })),
    mySubmissions: mySubmissions.map((s) => ({
      _id: String(s._id),
      name: s.name,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      rejectionReason: s.rejectionReason,
      linkedStrain: s.linkedStrainId
        ? {
            name: (s.linkedStrainId as any).name,
            slug: (s.linkedStrainId as any).slug,
          }
        : null,
    })),
  };
}

type Tab = "reviews" | "badges" | "saved";

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, recentReviews, mySubmissions, favoriteType } = loaderData;
  const t = useT();
  const context = useOutletContext<{ locale?: "es" | "pt" | "en" }>();
  const locale = context?.locale || "es";
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  const points = user.points || 0;
  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;
  const showcaseBadge = getShowcaseBadge(user.earnedBadges as any);
  const levelColor = LEVEL_COLOR[currentLevel.name] || "var(--accent)";
  const levelColorDark = LEVEL_COLOR_DARK[currentLevel.name] || "var(--accent)";
  const levelEmoji = LEVEL_EMOJI[currentLevel.name] || "🌱";
  const earnedCount = user.earnedBadges?.length || 0;

  return (
    <div>
      {/* Hero banner */}
      <div
        className="relative h-32 md:h-44"
        style={{ background: `linear-gradient(135deg, ${levelColor} 0%, ${levelColorDark} 100%)` }}
      />

      <div className="mx-auto max-w-[1200px] px-6">
        {/* Avatar + identity row */}
        <div className="relative -mt-14 md:-mt-16 flex items-end justify-between gap-4 pb-6 border-b border-line flex-wrap">
          <div className="flex items-end gap-4">
            <div className="relative shrink-0">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-elev border-4 overflow-hidden"
                style={{ borderColor: "var(--bg)" }}>
                <img
                  src={user.avatar || "/fallback/avatar-default.jpg"}
                  alt={user.displayName}
                  className="h-full w-full object-cover"
                />
              </div>
              {showcaseBadge && (
                <div
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 grid place-items-center text-base leading-none"
                  style={{ borderColor: "var(--bg)", background: "var(--gold)" }}
                  title={showcaseBadge.name}
                >
                  {showcaseBadge.emoji || "⭐"}
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="display text-2xl md:text-3xl">{user.displayName}</h1>
                <span
                  className="pill text-xs"
                  style={{ background: levelColor, color: "white", borderColor: "transparent" }}
                >
                  {levelEmoji} {currentLevel.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-fg-muted flex-wrap">
                <span>@{user.username}</span>
                <span>·</span>
                <span className="mono text-xs">{user.anonymousHandle}</span>
                <span>·</span>
                <span>
                  {countryFlag(user.country)}{" "}
                  {user.showCityPublicly && user.city
                    ? `${user.city}, ${countryLabel(user.country)}`
                    : countryLabel(user.country)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            <Link to="/profile/edit" className={buttonVariants({ variant: "ghost" })}>
              <Icon name="edit" size={14} />
              {t.profile.editButton}
            </Link>
            {!user.publishAsAnonymous && (
              <Link to={`/profile/${user.username}`} className={buttonVariants({ variant: "ghost" })}>
                <Icon name="eye" size={14} />
                {t.profile.seePublic}
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-line">
          <StatCard value={user.stats?.reviewCount || 0} label={t.profile.stats.reviews} />
          <StatCard value={user.stats?.strainsReviewed || 0} label={t.profile.stats.strains} />
          <StatCard value={user.stats?.helpfulVotesReceived || 0} label={t.profile.stats.helpful} />
          <StatCard value={`${earnedCount}/${BADGES.length}`} label="Insignias" />
        </div>

        {/* Level progress */}
        <div className="py-5 border-b border-line">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-fg-muted">{t.profile.level}: <strong style={{ color: levelColor }}>{currentLevel.name}</strong></span>
            <span className="mono text-xs text-fg-dim tnum">{points} pts{nextLevel ? ` · faltan ${nextLevel.minPoints - points} para ${nextLevel.name}` : " · nivel máximo"}</span>
          </div>
          <div className="h-1.5 bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.min(100, progress)}%`, background: levelColor }}
            />
          </div>
          {favoriteType && (
            <p className="text-xs text-fg-dim mt-2">
              Tipo favorito: <span className="capitalize font-medium" style={{ color: "var(--fg)" }}>{favoriteType}</span>
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line mt-0">
          {(["reviews", "badges", "saved"] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              reviews: t.profile.recentReviews,
              badges: t.profile.badgesTitle,
              saved: t.profile.savedStrains,
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-5 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab ? "var(--fg)" : "var(--fg-muted)",
                  borderBottom: activeTab === tab ? `2px solid ${levelColor}` : "2px solid transparent",
                }}
              >
                {labels[tab]}
                {tab === "reviews" && recentReviews.length > 0 && (
                  <span className="ml-1.5 mono text-[10px] text-fg-dim">{recentReviews.length}</span>
                )}
                {tab === "badges" && (
                  <span className="ml-1.5 mono text-[10px] text-fg-dim">{earnedCount}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="py-8">
          {/* Reviews tab */}
          {activeTab === "reviews" && (
            <div>
              {recentReviews.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-fg-muted mb-4">{t.profile.noReviews}</p>
                  <Link to="/strains" className={buttonVariants({ variant: "primary" })}>
                    {t.profile.writeFirst}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentReviews.map((review: any) => (
                    <ReviewMiniCard key={review._id} review={review} locale={locale} />
                  ))}
                </div>
              )}

              {mySubmissions && mySubmissions.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 className="display text-xl">Mis sugerencias de cepas</h2>
                    <Link
                      to="/strains/sugerir"
                      className="text-sm text-fg-muted hover:text-fg inline-flex items-center gap-1"
                    >
                      Sugerir otra <Icon name="plus" size={12} />
                    </Link>
                  </div>
                  <ul className="space-y-3">
                    {mySubmissions.map((s) => (
                      <li key={s._id} className="card p-4 flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-fg-dim">
                            {formatDate(s.createdAt, locale)}
                            {s.linkedStrain && (
                              <>
                                {" · "}
                                <Link to={`/strains/${s.linkedStrain.slug}`} className="underline hover:text-fg">
                                  {s.linkedStrain.name}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                        <StatusPill status={s.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Badges tab */}
          {activeTab === "badges" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {BADGES.map((badge) => {
                  const earned = user.earnedBadges?.find((eb: any) => eb.badgeId === badge.id);
                  const isEarned = !!earned;
                  return (
                    <div
                      key={badge.id}
                      className={`card p-5 text-center transition-all ${isEarned ? "" : "opacity-40 grayscale"}`}
                    >
                      <div
                        className="text-3xl mb-3 leading-none"
                        title={badge.description}
                      >
                        {badge.emoji || "🏅"}
                      </div>
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className="text-[11px] text-fg-dim mt-1 leading-snug">{badge.description}</div>
                      {isEarned && earned?.earnedAt && typeof earned.earnedAt === "string" && (
                        <div className="text-[10px] text-fg-dim mt-2 mono">
                          {formatDate(earned.earnedAt, locale)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved tab */}
          {activeTab === "saved" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-fg-muted">Tus cepas guardadas.</p>
                <Link to="/profile/saved" className={cn(buttonVariants({ variant: "ghost" }), "text-sm")}>
                  Ver todas <Icon name="arrowRight" size={13} />
                </Link>
              </div>
              {user.cannabisProfile?.preferredEffects?.length ? (
                <div className="card p-5 mb-5">
                  <div className="kicker mb-3">{t.profile.preferredEffects}</div>
                  <div className="flex flex-wrap gap-2">
                    {user.cannabisProfile.preferredEffects.map((e: string) => (
                      <Tag key={e} variant="effect">{e}</Tag>
                    ))}
                  </div>
                </div>
              ) : null}
              <Link
                to="/profile/saved"
                className="card p-10 text-center hover:bg-elev transition-colors block"
              >
                <Icon name="bookmark" size={24} className="mx-auto mb-3 text-fg-dim" />
                <p className="text-fg-muted text-sm">Ver biblioteca completa de cepas guardadas</p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="display text-2xl tnum">{value}</div>
      <div className="kicker mt-1">{label}</div>
    </div>
  );
}

function ReviewMiniCard({ review, locale }: { review: any; locale: string }) {
  return (
    <article className="card p-5">
      <header className="flex items-start justify-between gap-3 mb-3">
        {review.strain ? (
          <Link
            to={`/strains/${review.strain.slug}`}
            className="flex items-center gap-3 hover:text-accent transition-colors min-w-0"
          >
            {review.strain.imageUrl ? (
              <img
                src={review.strain.imageUrl}
                alt={review.strain.name}
                className="h-10 w-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg shrink-0"
                style={{ background: review.strain.colorHint || "var(--bg-elev)" }}
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{review.strain.name}</div>
              <div className="text-xs text-fg-dim capitalize">{review.strain.type}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        <RatingStars rating={review.ratings?.overall} size="sm" />
      </header>
      {review.comment && (
        <p className="text-sm text-fg-muted line-clamp-2">{review.comment}</p>
      )}
      <footer className="mt-3 text-xs text-fg-dim">{formatDate(review.createdAt, locale)}</footer>
    </article>
  );
}
