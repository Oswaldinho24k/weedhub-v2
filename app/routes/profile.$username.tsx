import { Link, useOutletContext } from "react-router";
import type { Route } from "./+types/profile.$username";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { BADGES } from "~/constants/gamification";
import { countryLabel, countryFlag } from "~/constants/locations";
import { RatingStars } from "~/components/composite/rating-stars";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { formatDate } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.user?.username ? `@${data.user.username}` : "Perfil";
  return buildMeta({
    title: `${name} — WeedHub`,
    description: `Reseñas públicas de ${name} en WeedHub.`,
    url: `${SITE_URL}/profile/${data?.user?.username || ""}`,
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();
  const username = String(params.username || "").toLowerCase();
  const user = await UserModel.findOne({ username })
    .select("-passwordHash -email -cannabisProfile -birthYear -acquisitionSource -locale")
    .lean();
  if (!user) throw new Response("Usuario no encontrado", { status: 404 });

  const publicReviews = user.publishAsAnonymous
    ? []
    : await ReviewModel.find({
        userId: user._id,
        status: "published",
        publishedAs: "username",
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("strainId", "name slug type colorHint")
        .lean();

  return {
    user: {
      _id: String(user._id),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      earnedBadges: user.earnedBadges,
      publishAsAnonymous: !!user.publishAsAnonymous,
      country: user.country,
      city: user.city,
      showCityPublicly: !!user.showCityPublicly,
      createdAt: user.createdAt?.toISOString?.(),
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
  };
}

const INTL_TAG = { es: "es-MX", pt: "pt-BR", en: "en-US" } as const;

export default function PublicProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, reviews } = loaderData;
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
      <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-start gap-6 mb-10">
        <div
          className="h-20 w-20 rounded-full bg-elev border border-line overflow-hidden grid place-items-center display text-2xl"
          style={{ color: "var(--accent)" }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="kicker mb-1">{t.profile.kickerPublic}</div>
          <h1 className="display text-4xl md:text-5xl">@{user.username}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-fg-muted">
            {user.country && (
              <span>
                {countryFlag(user.country)} {location}
              </span>
            )}
            {joinDate && <span>· {t.profile.joinedIn} {joinDate}</span>}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
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

        <div className="space-y-10">
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
                <p className="text-xs text-fg-dim">
                  {t.profile.privateReviewsHint}
                </p>
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
                              background:
                                review.strain.colorHint || "var(--bg-elev)",
                            }}
                          />
                          <span className="font-medium">{review.strain.name}</span>
                        </Link>
                      )}
                      <RatingStars rating={review.ratings.overall} size="sm" />
                    </header>
                    {review.comment && (
                      <p className="text-sm text-fg-muted line-clamp-3">
                        {review.comment}
                      </p>
                    )}
                    <footer className="mt-3 text-xs text-fg-dim">
                      {formatDate(review.createdAt, locale)}
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
