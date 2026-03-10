import { Link } from "react-router";
import type { Route } from "./+types/profile";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { BADGES } from "~/constants/gamification";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { formatDate } from "~/lib/utils";

export function meta() {
  return [{ title: "Mi Perfil — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  await connectDB();

  const recentReviews = await ReviewModel.find({ userId: user._id, status: "published" })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("strainId", "name slug type")
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
        ? { name: (r.strainId as any).name, slug: (r.strainId as any).slug, type: (r.strainId as any).type }
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

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, recentReviews } = loaderData;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
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
              <p className="text-sm text-text-muted">{user.email}</p>

              {user.cannabisProfile?.experienceLevel && (
                <Badge variant="hybrid" className="mt-3">
                  {EXPERIENCE_LABELS[user.cannabisProfile.experienceLevel] || user.cannabisProfile.experienceLevel}
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

              <Separator className="my-4" />

              <Link to="/profile/edit">
                <Button variant="secondary" size="sm" className="w-full">
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Editar Perfil
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cannabis Profile */}
          {user.onboardingCompleted && user.cannabisProfile && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">potted_plant</span>
                  Perfil Cannábico
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.cannabisProfile.preferredEffects?.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Efectos preferidos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.cannabisProfile.preferredEffects.map((e: string) => (
                        <span key={e} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badges */}
          {user.earnedBadges && user.earnedBadges.length > 0 && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-amber">emoji_events</span>
                  Insignias
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {user.earnedBadges.map((eb: any) => {
                    const badge = BADGES.find((b) => b.id === eb.badgeId);
                    if (!badge) return null;
                    return (
                      <div key={eb.badgeId} className="text-center p-3 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-2xl text-accent-amber block mb-1">
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

          {/* Recent Reviews */}
          <Card className="border-white/10">
            <CardHeader>
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                Reseñas Recientes
              </h3>
            </CardHeader>
            <CardContent>
              {recentReviews.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-muted/40 mb-2 block">
                    edit_note
                  </span>
                  <p className="text-text-muted">Aún no has escrito reseñas</p>
                  <Link to="/strains" className="text-primary text-sm hover:underline mt-1 inline-block">
                    Explora cepas para empezar
                  </Link>
                </div>
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
                      <p className="text-xs text-text-muted/60 mt-2">
                        {formatDate(review.createdAt)}
                      </p>
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
