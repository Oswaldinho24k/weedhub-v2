import { Link } from "react-router";
import type { Route } from "./+types/profile.$userId";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { BADGES, getCurrentLevel } from "~/constants/gamification";
import { RatingStars } from "~/components/composite/rating-stars";
import { Icon } from "~/components/ui/icon";
import { formatDate } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.user?.displayName || "Perfil";
  return buildMeta({
    title: `${name} — WeedHub`,
    description: `Perfil público de ${name}. Reseñas con contexto, insignias y actividad en la comunidad.`,
    url: `${SITE_URL}/profile/${data?.user?._id || ""}`,
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();
  const user = await UserModel.findById(params.userId).select("-passwordHash -email").lean();
  if (!user) throw new Response("Usuario no encontrado", { status: 404 });

  const recentReviews = await ReviewModel.find({
    userId: user._id,
    status: "published",
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("strainId", "name slug type colorHint")
    .lean();

  return {
    user: {
      _id: String(user._id),
      displayName: user.displayName,
      avatar: user.avatar,
      cannabisProfile: user.cannabisProfile,
      stats: user.stats,
      earnedBadges: user.earnedBadges,
      points: user.points,
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

export default function PublicProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, recentReviews } = loaderData;
  const currentLevel = getCurrentLevel(user.points || 0);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-start gap-6 mb-10">
        <div
          className="h-20 w-20 rounded-full bg-elev border border-line grid place-items-center display text-2xl"
          style={{ color: "var(--accent)" }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="kicker mb-1">Perfil público</div>
          <h1 className="display text-4xl md:text-5xl">{user.displayName}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {user.cannabisProfile?.experienceLevel && (
              <span className="pill accent">
                {EXPERIENCE_LABELS[user.cannabisProfile.experienceLevel]}
              </span>
            )}
            <span className="pill">{currentLevel.name}</span>
            <span className="text-sm text-fg-muted">{user.points || 0} pts</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="card p-5 grid grid-cols-3 gap-3 text-center">
            <StatPill kicker="Reseñas" value={user.stats?.reviewCount || 0} />
            <StatPill kicker="Útiles" value={user.stats?.helpfulVotesReceived || 0} />
            <StatPill kicker="Cepas" value={user.stats?.strainsReviewed || 0} />
          </div>
        </aside>

        <div className="space-y-10">
          <section>
            <h2 className="display text-2xl mb-5">Insignias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BADGES.map((badge) => {
                const isEarned = !!user.earnedBadges?.find(
                  (eb: any) => eb.badgeId === badge.id
                );
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
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="display text-2xl mb-5">Reseñas</h2>
            {recentReviews.length === 0 ? (
              <div className="card p-10 text-center text-fg-muted">
                Sin reseñas publicadas.
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
