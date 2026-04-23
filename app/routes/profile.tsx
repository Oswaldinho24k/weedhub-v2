import { Link, useOutletContext } from "react-router";
import type { Route } from "./+types/profile";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { StrainSubmissionModel } from "~/models/strain-submission.server";
import { BADGES, getCurrentLevel, getNextLevel } from "~/constants/gamification";
import { countryLabel, countryFlag } from "~/constants/locations";
import { Icon } from "~/components/ui/icon";
import { RatingStars } from "~/components/composite/rating-stars";
import { useT } from "~/lib/i18n-context";
import { formatDate } from "~/lib/utils";
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

  const [recentReviews, mySubmissions] = await Promise.all([
    ReviewModel.find({
      userId: user._id,
      status: "published",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("strainId", "name slug type colorHint")
      .lean(),
    StrainSubmissionModel.find({ submittedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("linkedStrainId", "name slug")
      .lean(),
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

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, recentReviews, mySubmissions } = loaderData;
  const t = useT();
  const context = useOutletContext<{ locale?: "es" | "pt" | "en" }>();
  const locale = context?.locale || "es";
  const points = user.points || 0;
  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = nextLevel
    ? ((points - currentLevel.minPoints) /
        (nextLevel.minPoints - currentLevel.minPoints)) *
      100
    : 100;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Header */}
      <section className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start gap-6 mb-10">
        <div
          className="h-20 w-20 rounded-full bg-elev border border-line overflow-hidden grid place-items-center display text-2xl"
          style={{ color: "var(--accent)" }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (user.displayName || "?").charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="kicker mb-1">{t.profile.kickerPrivate}</div>
          <h1 className="display text-4xl md:text-5xl">{user.displayName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-fg-muted">
            <span className="font-medium">@{user.username}</span>
            <span>·</span>
            <span className="mono text-xs">{user.anonymousHandle}</span>
            <span>·</span>
            <span>
              {countryFlag(user.country)} {user.showCityPublicly && user.city
                ? `${user.city}, ${countryLabel(user.country)}`
                : countryLabel(user.country)}
            </span>
          </div>
          <div className="mt-3 kicker" style={{ color: user.publishAsAnonymous ? "var(--lilac)" : "var(--accent)" }}>
            {t.profile.publishingAs} {user.publishAsAnonymous ? t.profile.asAnonymous : t.profile.asReal}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Link to="/profile/edit" className="btn btn-ghost">
            <Icon name="edit" size={14} />
            {t.profile.editButton}
          </Link>
          {!user.publishAsAnonymous && (
            <Link
              to={`/profile/${user.username}`}
              className="text-xs text-fg-muted hover:text-fg inline-flex items-center gap-1"
            >
              <Icon name="eye" size={12} />
              {t.profile.seePublic}
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="card p-5">
            <div className="kicker mb-3">{t.profile.level}</div>
            <div className="flex items-baseline justify-between">
              <span className="display text-2xl">{currentLevel.name}</span>
              <span className="mono text-sm text-fg-muted tnum">
                {points} pts
              </span>
            </div>
            <div className="h-1.5 bg-sunken rounded-full mt-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%`, background: "var(--accent)" }}
              />
            </div>
            {nextLevel && (
              <p className="text-xs text-fg-dim mt-2">
                {nextLevel.minPoints - points} {t.profile.pointsTo} {nextLevel.name}
              </p>
            )}
          </div>

          <div className="card p-5 grid grid-cols-3 gap-3 text-center">
            <StatPill
              kicker={t.profile.stats.reviews}
              value={user.stats?.reviewCount || 0}
            />
            <StatPill
              kicker={t.profile.stats.helpful}
              value={user.stats?.helpfulVotesReceived || 0}
            />
            <StatPill kicker={t.profile.stats.strains} value={user.stats?.strainsReviewed || 0} />
          </div>

          <Link to="/profile/saved" className="card p-5 flex items-center justify-between hover:bg-elev transition-colors">
            <div>
              <div className="kicker mb-1">{t.profile.libraryKicker}</div>
              <div className="text-sm text-fg">{t.profile.savedStrains}</div>
            </div>
            <Icon name="arrowRight" size={16} className="text-fg-dim" />
          </Link>

          {user.cannabisProfile?.preferredEffects?.length ? (
            <div className="card p-5">
              <div className="kicker mb-3">{t.profile.preferredEffects}</div>
              <div className="flex flex-wrap gap-2">
                {user.cannabisProfile.preferredEffects.map((e: string) => (
                  <span key={e} className="pill accent">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-10">
          {/* Badges */}
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="display text-2xl">{t.profile.badgesTitle}</h2>
              <span className="kicker">
                {user.earnedBadges?.length || 0} / {BADGES.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BADGES.map((badge) => {
                const earned = user.earnedBadges?.find(
                  (eb: any) => eb.badgeId === badge.id
                );
                const isEarned = !!earned;
                return (
                  <div
                    key={badge.id}
                    className={`card p-4 text-center transition-opacity ${
                      isEarned ? "" : "opacity-55"
                    }`}
                    title={badge.description}
                  >
                    <div
                      className="h-9 w-9 mx-auto rounded-full grid place-items-center mb-2"
                      style={{
                        background: isEarned ? "var(--gold)" : "var(--bg-elev)",
                        color: isEarned ? "oklch(22% 0.05 85)" : "var(--fg-dim)",
                      }}
                    >
                      <Icon name="crown" size={16} />
                    </div>
                    <div className="text-sm font-medium">{badge.name}</div>
                    <div className="text-[10px] text-fg-dim mt-1 line-clamp-1">
                      {badge.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Reviews */}
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="display text-2xl">{t.profile.recentReviews}</h2>
              <Link to="/strains" className="text-sm text-fg-muted hover:text-fg">
                {t.profile.exploreStrains}
              </Link>
            </div>
            {recentReviews.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-fg-muted mb-4">{t.profile.noReviews}</p>
                <Link to="/strains" className="btn btn-primary inline-flex">
                  {t.profile.writeFirst}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review: any) => (
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
                          <span className="font-medium">
                            {review.strain.name}
                          </span>
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

          {/* My strain suggestions */}
          {mySubmissions && mySubmissions.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="display text-2xl">Mis sugerencias</h2>
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
                            <Link
                              to={`/strains/${s.linkedStrain.slug}`}
                              className="underline hover:text-fg"
                            >
                              {s.linkedStrain.name}
                            </Link>
                          </>
                        )}
                        {s.rejectionReason && s.status === "rejected" && (
                          <>
                            {" · "}
                            <span className="text-warm">{s.rejectionReason}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <SubmissionStatusPill status={s.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: string }> = {
    pending: { label: "En revisión", variant: "" },
    approved: { label: "Aprobada", variant: "accent" },
    merged_as_alias: { label: "Agregada como alias", variant: "accent" },
    rejected: { label: "Rechazada", variant: "warm" },
    rejected_auto: { label: "Bloqueada", variant: "warm" },
    duplicate: { label: "Duplicada", variant: "warm" },
  };
  const m = map[status] || { label: status, variant: "" };
  return <span className={`pill ${m.variant}`}>{m.label}</span>;
}

function StatPill({ kicker, value }: { kicker: string; value: number }) {
  return (
    <div>
      <div className="display text-2xl tnum">{value}</div>
      <div className="kicker mt-1">{kicker}</div>
    </div>
  );
}
