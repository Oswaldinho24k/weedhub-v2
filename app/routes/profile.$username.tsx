import { useState } from "react";
import { Link, useFetcher, useOutletContext } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/profile.$username";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { SavedStrainModel } from "~/models/saved-strain.server";
import { BADGES, getCurrentLevel, getNextLevel, getShowcaseBadge, LEVEL_COLOR, LEVEL_COLOR_DARK, LEVEL_EMOJI } from "~/constants/gamification";
import { countryLabel, countryFlag } from "~/constants/locations";
import { RatingStars } from "~/components/composite/rating-stars";
import { ShareButton } from "~/components/ui/share-button";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { formatDate } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { getUserFromSession } from "~/lib/auth.server";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.user?.username ? `@${data.user.username}` : "Perfil";
  const level = data?.user?.levelName ? ` · ${data.user.levelName}` : "";
  return buildMeta({
    title: `${name}${level} — WeedHub`,
    description: `${data?.user?.stats?.reviewCount ?? 0} reseñas publicadas por ${name} en WeedHub.`,
    url: `${SITE_URL}/profile/${data?.user?.username || ""}`,
  });
}

const EXPERT_BADGES: Record<string, string> = {
  "reviewer-100": "Leyenda Cannábica",
  "reviewer-25": "Crítico Experto",
  "explorer-50": "Gran Catador",
};

export async function loader({ params, request }: Route.LoaderArgs) {
  await connectDB();
  const username = String(params.username || "").toLowerCase();

  const [user, sessionUser] = await Promise.all([
    UserModel.findOne({ username })
      .select(
        "-passwordHash -email -birthYear -acquisitionSource -locale -cannabisProfile"
      )
      .lean(),
    getUserFromSession(request),
  ]);

  if (!user) throw new Response("Usuario no encontrado", { status: 404 });

  const sessionUserId = sessionUser ? String(sessionUser._id) : null;
  const isOwnProfile = sessionUserId === String(user._id);

  const [publicReviews, followerCount, savedStrainDocs, isFollowing] =
    await Promise.all([
      user.publishAsAnonymous
        ? Promise.resolve([])
        : ReviewModel.find({
            userId: user._id,
            status: "published",
            publishedAs: "username",
          })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("strainId", "name slug type colorHint imageUrl")
            .lean(),
      UserModel.countDocuments({ following: user._id }),
      user.savedStrainsPublic
        ? SavedStrainModel.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate("strainId", "name slug type colorHint imageUrl")
            .lean()
        : Promise.resolve([]),
      sessionUserId && !isOwnProfile
        ? UserModel.exists({ _id: sessionUserId, following: user._id }).then(
            (r) => r !== null
          )
        : Promise.resolve(false),
    ]);

  const expertLabel =
    Object.entries(EXPERT_BADGES).find(([badgeId]) =>
      user.earnedBadges.some((eb) => eb.badgeId === badgeId)
    )?.[1] ?? null;

  const points = user.points || 0;
  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(points);

  return {
    user: {
      _id: String(user._id),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      earnedBadges: user.earnedBadges.map((eb) => ({
        badgeId: eb.badgeId,
        earnedAt: eb.earnedAt?.toISOString?.() ?? null,
      })),
      publishAsAnonymous: !!user.publishAsAnonymous,
      country: user.country,
      city: user.city,
      showCityPublicly: !!user.showCityPublicly,
      savedStrainsPublic: !!user.savedStrainsPublic,
      followingCount: user.following?.length ?? 0,
      createdAt: user.createdAt?.toISOString?.(),
      stats: {
        reviewCount: user.stats?.reviewCount ?? 0,
        strainsReviewed: user.stats?.strainsReviewed ?? 0,
      },
      expertLabel,
      points,
      levelName: currentLevel.name,
      levelMinPoints: currentLevel.minPoints,
      nextLevelMinPoints: nextLevel?.minPoints ?? null,
      nextLevelName: nextLevel?.name ?? null,
    },
    reviews: publicReviews.map((r) => ({
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
            imageUrl: (r.strainId as any).imageUrl ?? null,
          }
        : null,
    })),
    savedStrains: savedStrainDocs.map((s) => {
      const st = s.strainId as any;
      return {
        name: st?.name ?? "",
        slug: st?.slug ?? "",
        type: st?.type ?? "",
        colorHint: st?.colorHint ?? null,
        imageUrl: st?.imageUrl ?? null,
      };
    }),
    followerCount,
    sessionUserId,
    isOwnProfile,
    isFollowing,
  };
}

const INTL_TAG = { es: "es-MX", pt: "pt-BR", en: "en-US" } as const;

type PublicTab = "reviews" | "badges" | "saved";

export default function PublicProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, reviews, savedStrains, followerCount, sessionUserId, isOwnProfile, isFollowing } =
    loaderData;
  const t = useT();
  const context = useOutletContext<{ locale?: "es" | "pt" | "en" }>();
  const locale = context?.locale || "es";
  const [activeTab, setActiveTab] = useState<PublicTab>("reviews");

  const intlTag = INTL_TAG[locale];
  const joinDate = user.createdAt
    ? new Intl.DateTimeFormat(intlTag, { month: "long", year: "numeric" }).format(
        new Date(user.createdAt)
      )
    : "";
  const showCity = user.showCityPublicly && user.city;
  const location = showCity ? `${user.city}, ${countryLabel(user.country)}` : countryLabel(user.country);

  const points = user.points ?? 0;
  const levelColor = LEVEL_COLOR[user.levelName] || "var(--accent)";
  const levelColorDark = LEVEL_COLOR_DARK[user.levelName] || "var(--accent)";
  const levelEmoji = LEVEL_EMOJI[user.levelName] || "🌱";
  const showcaseBadge = getShowcaseBadge(user.earnedBadges as any);
  const earnedBadgeIds = new Set(user.earnedBadges?.map((eb) => eb.badgeId) ?? []);
  const progress = user.nextLevelMinPoints
    ? ((points - user.levelMinPoints) / (user.nextLevelMinPoints - user.levelMinPoints)) * 100
    : 100;

  const pageUrl = `${SITE_URL}/profile/${user.username}`;
  const shareText = `Mira el perfil de @${user.username} en WeedHub`;

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
              <div
                className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-elev border-4 overflow-hidden"
                style={{ borderColor: "var(--bg)" }}
              >
                <img
                  src={user.avatar || "/fallback/avatar-default.jpg"}
                  alt={user.username}
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
                <h1 className="display text-2xl md:text-3xl">@{user.username}</h1>
                <span
                  className="pill text-xs"
                  style={{ background: levelColor, color: "white", borderColor: "transparent" }}
                >
                  {levelEmoji} {user.levelName}
                </span>
                {user.expertLabel && (
                  <span
                    className="pill text-xs"
                    style={{ background: "var(--gold)", color: "oklch(22% 0.05 85)", borderColor: "transparent" }}
                  >
                    ✦ {user.expertLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-fg-muted flex-wrap">
                {user.country && (
                  <span>{countryFlag(user.country)} {location}</span>
                )}
                {joinDate && <><span>·</span><span>{t.profile.joinedIn} {joinDate}</span></>}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span><strong>{user.stats.reviewCount}</strong> <span className="text-fg-muted">reseñas</span></span>
                <span><strong>{user.followingCount}</strong> <span className="text-fg-muted">siguiendo</span></span>
                <span><strong>{followerCount}</strong> <span className="text-fg-muted">seguidores</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {sessionUserId && !isOwnProfile && (
              <FollowButton userId={user._id} initialIsFollowing={isFollowing} />
            )}
            {isOwnProfile && (
              <Link to="/profile" className={buttonVariants({ variant: "ghost" })}>
                <Icon name="settings" size={14} />
                Mi perfil
              </Link>
            )}
            <ShareButton url={pageUrl} title={`@${user.username} en WeedHub`} text={shareText} />
          </div>
        </div>

        {/* Level progress bar */}
        <div className="py-4 border-b border-line">
          <div className="flex items-center justify-between mb-1.5 text-xs text-fg-dim">
            <span><strong style={{ color: levelColor }}>{user.levelName}</strong></span>
            <span className="mono tnum">{points} pts{user.nextLevelName ? ` · faltan ${user.nextLevelMinPoints! - points} para ${user.nextLevelName}` : " · nivel máximo"}</span>
          </div>
          <div className="h-1 bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.min(100, progress)}%`, background: levelColor }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line">
          {(["reviews", "badges", "saved"] as PublicTab[]).map((tab) => {
            const labels: Record<PublicTab, string> = {
              reviews: t.profile.recentReviews,
              badges: "Insignias",
              saved: "Guardadas",
            };
            const counts: Record<PublicTab, number | null> = {
              reviews: reviews.length,
              badges: earnedBadgeIds.size,
              saved: savedStrains.length || null,
            };
            const count = counts[tab];
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-5 py-3 text-sm font-medium transition-colors"
                style={{
                  color: activeTab === tab ? "var(--fg)" : "var(--fg-muted)",
                  borderBottom: activeTab === tab ? `2px solid ${levelColor}` : "2px solid transparent",
                }}
              >
                {labels[tab]}
                {count !== null && count > 0 && (
                  <span className="ml-1.5 mono text-[10px] text-fg-dim">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="py-8">
          {/* Reviews tab */}
          {activeTab === "reviews" && (
            <div>
              {user.publishAsAnonymous ? (
                <div className="card p-12 text-center space-y-3">
                  <Icon name="eyeOff" size={24} className="mx-auto text-fg-dim" />
                  <p className="text-fg-muted">{t.profile.privateReviewsTitle}</p>
                  <p className="text-xs text-fg-dim">{t.profile.privateReviewsHint}</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="card p-10 text-center text-fg-muted">
                  {t.profile.publicNoReviews}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <article key={review._id} className="card p-5">
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
                        ) : <div />}
                        <RatingStars rating={review.ratings.overall} size="sm" />
                      </header>
                      {review.comment && (
                        <p className="text-sm text-fg-muted line-clamp-2">{review.comment}</p>
                      )}
                      <footer className="mt-3 text-xs text-fg-dim">{formatDate(review.createdAt, locale)}</footer>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Badges tab */}
          {activeTab === "badges" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {BADGES.map((badge) => {
                const earned = user.earnedBadges?.find((eb) => eb.badgeId === badge.id);
                const isEarned = !!earned;
                return (
                  <div
                    key={badge.id}
                    className={`card p-5 text-center transition-all ${isEarned ? "" : "opacity-40 grayscale"}`}
                  >
                    <div className="text-3xl mb-3 leading-none">{badge.emoji || "🏅"}</div>
                    <div className="font-medium text-sm">{badge.name}</div>
                    <div className="text-[11px] text-fg-dim mt-1 leading-snug">{badge.description}</div>
                    {isEarned && earned?.earnedAt && typeof earned.earnedAt === "string" && (
                      <div className="text-[10px] text-fg-dim mt-2 mono">{formatDate(earned.earnedAt, locale)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Saved tab */}
          {activeTab === "saved" && (
            <div>
              {!user.savedStrainsPublic ? (
                <div className="card p-10 text-center">
                  <Icon name="lock" size={24} className="mx-auto mb-3 text-fg-dim" />
                  <p className="text-fg-muted text-sm">Esta biblioteca es privada.</p>
                </div>
              ) : savedStrains.length === 0 ? (
                <div className="card p-10 text-center text-fg-muted text-sm">
                  Ninguna cepa guardada aún.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {savedStrains.map((strain) => (
                    <Link
                      key={strain.slug}
                      to={`/strains/${strain.slug}`}
                      className="card p-3 hover:border-line-strong transition-all group"
                    >
                      <div
                        className="h-20 rounded-md mb-3 overflow-hidden"
                        style={{ background: strain.colorHint || "var(--bg-elev)" }}
                      >
                        {strain.imageUrl && (
                          <img
                            src={strain.imageUrl}
                            alt={strain.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <p className="text-xs font-medium leading-tight group-hover:text-accent transition-colors line-clamp-2">
                        {strain.name}
                      </p>
                      <p className="text-[10px] mt-1 capitalize" style={{ color: "var(--fg-dim)" }}>
                        {strain.type}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FollowButton({
  userId,
  initialIsFollowing,
}: {
  userId: string;
  initialIsFollowing: boolean;
}) {
  const fetcher = useFetcher<{ following: boolean }>();
  const isFollowing = fetcher.data?.following ?? initialIsFollowing;

  return (
    <fetcher.Form method="post" action={`/api/users/${userId}/follow`}>
      <button
        type="submit"
        className={cn(isFollowing ? buttonVariants({ variant: "ghost" }) : buttonVariants({ variant: "primary" }))}
        disabled={fetcher.state !== "idle"}
      >
        {isFollowing ? "Siguiendo" : "Seguir"}
      </button>
    </fetcher.Form>
  );
}
