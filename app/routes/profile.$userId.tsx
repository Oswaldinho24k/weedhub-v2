import { Link } from "react-router";
import type { Route } from "./+types/profile.$userId";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { BADGES } from "~/constants/gamification";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar } from "~/components/ui/avatar";
import { formatDate } from "~/lib/utils";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.user?.displayName || "Perfil";
  return [{ title: `${name} — WeedHub` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();
  const user = await UserModel.findById(params.userId).select("-passwordHash -email").lean();
  if (!user) throw new Response("Usuario no encontrado", { status: 404 });

  const recentReviews = await ReviewModel.find({ userId: user._id, status: "published" })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("strainId", "name slug type")
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
        ? { name: (r.strainId as any).name, slug: (r.strainId as any).slug }
        : null,
    })),
  };
}

const EXPERIENCE_LABELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  experimentado: "Experimentado",
  experto: "Experto",
};

export default function PublicProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, recentReviews } = loaderData;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="text-center border-white/10">
            <CardContent className="pt-6">
              <Avatar
                src={user.avatar}
                fallback={user.displayName.charAt(0).toUpperCase()}
                size="lg"
                className="mx-auto mb-4"
              />
              <h1 className="font-display text-xl font-bold text-white">
                {user.displayName}
              </h1>
              {user.cannabisProfile?.experienceLevel && (
                <Badge variant="hybrid" className="mt-2">
                  {EXPERIENCE_LABELS[user.cannabisProfile.experienceLevel]}
                </Badge>
              )}
              <div className="mt-6 flex justify-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{user.stats?.reviewCount || 0}</p>
                  <p className="text-xs text-text-muted">Reseñas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{user.stats?.helpfulVotesReceived || 0}</p>
                  <p className="text-xs text-text-muted">Útiles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{user.points || 0}</p>
                  <p className="text-xs text-text-muted">Puntos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {user.earnedBadges && user.earnedBadges.length > 0 && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white">Insignias</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {user.earnedBadges.map((eb: any) => {
                    const badge = BADGES.find((b) => b.id === eb.badgeId);
                    if (!badge) return null;
                    return (
                      <div key={eb.badgeId} className="text-center p-3 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-xl text-accent-amber block mb-1">
                          {badge.icon}
                        </span>
                        <p className="text-xs font-bold text-white">{badge.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-white/10">
            <CardHeader>
              <h3 className="font-display font-bold text-white">Reseñas</h3>
            </CardHeader>
            <CardContent>
              {recentReviews.length === 0 ? (
                <p className="text-center text-text-muted py-8">Sin reseñas aún</p>
              ) : (
                <div className="space-y-4">
                  {recentReviews.map((review: any) => (
                    <div key={review._id} className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        {review.strain && (
                          <Link
                            to={`/strains/${review.strain.slug}`}
                            className="font-bold text-white hover:text-primary transition-colors"
                          >
                            {review.strain.name}
                          </Link>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-accent-amber text-sm">star</span>
                          <span className="text-sm font-bold text-white">{review.ratings.overall}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-text-muted line-clamp-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-text-muted/60 mt-2">{formatDate(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
