import { Link, useFetcher, useOutletContext } from "react-router";
import type { Route } from "./+types/profile.$username";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { SavedStrainModel } from "~/models/saved-strain.server";
import { BADGES } from "~/constants/gamification";
import { countryLabel, countryFlag } from "~/constants/locations";
import { RatingStars } from "~/components/composite/rating-stars";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { formatDate } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { getUserFromSession } from "~/lib/auth.server";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.user?.username ? `@${data.user.username}` : "Perfil";
  return buildMeta({
    title: `${name} — WeedHub`,
    description: `Reseñas públicas de ${name} en WeedHub.`,
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
            .populate("strainId", "name slug type colorHint")
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
            colorHint: (r.strainId as any).colorHint,
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

export default function PublicProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, reviews, savedStrains, followerCount, sessionUserId, isOwnProfile, isFollowing } =
    loaderData;
  const t = useT();
  const context = useOutletContext<{ locale?: "es" | "pt" | "en" }>();
  const locale = context?.locale || "es";
  const intlTag = INTL_TAG[locale];
  const joinDate = user.createdAt
    ? new Intl.DateTimeFormat(intlTag, { month: "long", year: "numeric" }).format(
        new Date(user.createdAt)
      )
    : "";
  const showCity = user.showCityPublicly && user.city;
  const location = showCity
    ? `${user.city}, ${countryLabel(user.country)}`
    : countryLabel(user.country);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Hero */}
      <section className="flex items-start justify-between gap-6 mb-10 flex-wrap">
        <div className="flex items-start gap-5">
          <div
            className="h-20 w-20 rounded-full bg-elev border border-line overflow-hidden grid place-items-center display text-2xl shrink-0"
            style={{ color: "var(--accent)" }}
          >
            <img
              src={user.avatar || "/fallback/avatar-default.jpg"}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="kicker mb-1">{t.profile.kickerPublic}</div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="display text-4xl md:text-5xl">@{user.username}</h1>
              {user.expertLabel && (
                <span
                  className="pill text-xs px-2.5 py-1"
                  style={{
                    background: "var(--gold)",
                    color: "oklch(22% 0.05 85)",
                    borderColor: "transparent",
                  }}
                >
                  ✦ {user.expertLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-fg-muted">
              {user.country && (
                <span>
                  {countryFlag(user.country)} {location}
                </span>
              )}
              {joinDate && (
                <span>
                  · {t.profile.joinedIn} {joinDate}
                </span>
              )}
            </div>
            <div className="flex items-center gap-5 mt-3 text-sm">
              <span>
                <strong className="text-fg">{user.stats.reviewCount}</strong>{" "}
                <span className="text-fg-muted">reseñas</span>
              </span>
              <span>
                <strong className="text-fg">{user.followingCount}</strong>{" "}
                <span className="text-fg-muted">siguiendo</span>
              </span>
              <span>
                <strong className="text-fg">{followerCount}</strong>{" "}
                <span className="text-fg-muted">seguidores</span>
              </span>
            </div>
          </div>
        </div>

        {sessionUserId && !isOwnProfile && (
          <FollowButton userId={user._id} initialIsFollowing={isFollowing} />
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-6">
          {user.earnedBadges && user.earnedBadges.length > 0 && (
            <div className="card p-5">
              <div className="kicker mb-3">{t.profile.badgesEarned}</div>
              <div className="grid grid-cols-3 gap-2">
                {BADGES.filter((b) =>
                  user.earnedBadges!.find((eb) => eb.badgeId === b.id)
                ).map((badge) => (
                  <div
                    key={badge.id}
                    className="card p-3 text-center"
                    title={badge.description}
                  >
                    <div
                      className="h-7 w-7 mx-auto rounded-full grid place-items-center mb-1.5"
                      style={{ background: "var(--gold)", color: "oklch(22% 0.05 85)" }}
                    >
                      <Icon name="crown" size={14} />
                    </div>
                    <div className="text-[11px] font-medium leading-tight">{badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="space-y-10">
          {/* Reseñas */}
          <section>
            <h2 className="display text-2xl mb-5">{t.profile.recentReviews}</h2>
            {user.publishAsAnonymous ? (
              <div className="card p-10 text-center space-y-2">
                <div
                  className="h-10 w-10 mx-auto rounded-full grid place-items-center"
                  style={{ background: "var(--bg-elev)", color: "var(--fg-muted)" }}
                >
                  <Icon name="eyeOff" size={18} />
                </div>
                <p className="text-fg-muted">{t.profile.privateReviewsTitle}</p>
                <p className="text-xs text-fg-dim">{t.profile.privateReviewsHint}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="card p-10 text-center text-fg-muted">
                {t.profile.publicNoReviews}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article key={review._id} className="card p-5">
                    <header className="flex items-center justify-between mb-3">
                      {review.strain && (
                        <Link
                          to={`/strains/${review.strain.slug}`}
                          className="flex items-center gap-3 hover:text-accent transition-colors"
                        >
                          <span
                            className="h-8 w-8 rounded-md shrink-0"
                            style={{
                              background: review.strain.colorHint || "var(--bg-elev)",
                            }}
                          />
                          <span className="font-medium">{review.strain.name}</span>
                        </Link>
                      )}
                      <RatingStars rating={review.ratings.overall} size="sm" />
                    </header>
                    {review.comment && (
                      <p className="text-sm text-fg-muted line-clamp-3">{review.comment}</p>
                    )}
                    <footer className="mt-3 text-xs text-fg-dim">
                      {formatDate(review.createdAt, locale)}
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Cepas guardadas (si el usuario las hizo públicas) */}
          {user.savedStrainsPublic && savedStrains.length > 0 && (
            <section>
              <h2 className="display text-2xl mb-5">Cepas guardadas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {savedStrains.map((strain) => (
                  <Link
                    key={strain.slug}
                    to={`/strains/${strain.slug}`}
                    className="card p-3 hover:border-line-strong transition-all group"
                  >
                    <div
                      className="h-16 rounded-md mb-3 overflow-hidden"
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
                    <p
                      className="text-[10px] mt-1 capitalize"
                      style={{ color: "var(--fg-dim)" }}
                    >
                      {strain.type}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
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
        className={isFollowing ? "btn btn-ghost" : "btn btn-primary"}
        disabled={fetcher.state !== "idle"}
      >
        {isFollowing ? "Siguiendo" : "Seguir"}
      </button>
    </fetcher.Form>
  );
}
