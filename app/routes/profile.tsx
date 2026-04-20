import { Link } from "react-router";
import type { Route } from "./+types/profile";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { BADGES, getCurrentLevel, getNextLevel } from "~/constants/gamification";
import { Icon } from "~/components/ui/icon";
import { RatingStars } from "~/components/composite/rating-stars";
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

  const recentReviews = await ReviewModel.find({
    userId: user._id,
    status: "published",
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("strainId", "name slug type colorHint")
    .lean();

  return {
    user: {
      _id: String(user._id),
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
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
  };
}

const EXPERIENCE_LABELS: Record<string, string> = {
  principiante: "Principiante",
  novato: "Novato",
  ocasional: "Ocasional",
  regular: "Regular",
  intermedio: "Intermedio",
  experimentado: "Experimentado",
  experto: "Experto",
};

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, recentReviews } = loaderData;
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
          className="h-20 w-20 rounded-full bg-elev border border-line grid place-items-center display text-2xl"
          style={{ color: "var(--accent)" }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="kicker mb-1">Perfil</div>
          <h1 className="display text-4xl md:text-5xl">{user.displayName}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm text-fg-muted">{user.email}</span>
            {user.cannabisProfile?.experienceLevel && (
              <span className="pill accent">
                {EXPERIENCE_LABELS[user.cannabisProfile.experienceLevel] ||
                  user.cannabisProfile.experienceLevel}
              </span>
            )}
          </div>
        </div>
        <Link to="/profile/edit" className="btn btn-ghost">
          <Icon name="edit" size={14} />
          Editar perfil
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="card p-5">
            <div className="kicker mb-3">Nivel</div>
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
                {nextLevel.minPoints - points} pts para {nextLevel.name}
              </p>
            )}
          </div>

          <div className="card p-5 grid grid-cols-3 gap-3 text-center">
            <StatPill
              kicker="Reseñas"
              value={user.stats?.reviewCount || 0}
            />
            <StatPill
              kicker="Útiles"
              value={user.stats?.helpfulVotesReceived || 0}
            />
            <StatPill kicker="Cepas" value={user.stats?.strainsReviewed || 0} />
          </div>

          <Link to="/profile/saved" className="card p-5 flex items-center justify-between hover:bg-elev transition-colors">
            <div>
              <div className="kicker mb-1">Biblioteca</div>
              <div className="text-sm text-fg">Cepas guardadas</div>
            </div>
            <Icon name="arrowRight" size={16} className="text-fg-dim" />
          </Link>

          {user.cannabisProfile?.preferredEffects?.length ? (
            <div className="card p-5">
              <div className="kicker mb-3">Efectos preferidos</div>
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
              <h2 className="display text-2xl">Insignias</h2>
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
              <h2 className="display text-2xl">Reseñas recientes</h2>
              <Link to="/strains" className="text-sm text-fg-muted hover:text-fg">
                Explorar cepas
              </Link>
            </div>
            {recentReviews.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-fg-muted mb-4">Aún no has publicado reseñas.</p>
                <Link to="/strains" className="btn btn-primary inline-flex">
                  Escribe tu primera
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
                      {formatDate(review.createdAt)}
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

function StatPill({ kicker, value }: { kicker: string; value: number }) {
  return (
    <div>
      <div className="display text-2xl tnum">{value}</div>
      <div className="kicker mt-1">{kicker}</div>
    </div>
  );
}
