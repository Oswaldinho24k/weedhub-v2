import { Link, useOutletContext } from "react-router";
import type { Route } from "./+types/strains.$slug";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { SavedStrainModel } from "~/models/saved-strain.server";
import { getUserFromSession } from "~/lib/auth.server";
import { TERPENES } from "~/constants/cannabis";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { CannabinoidBar } from "~/components/composite/cannabinoid-bar";
import { RatingStars } from "~/components/composite/rating-stars";
import { ReviewCard } from "~/components/composite/review-card";
import { EffectsChipGroup } from "~/components/composite/effects-chip-group";
import { useFetcher } from "react-router";

const TYPE_VARIANT: Record<string, "sativa" | "indica" | "hybrid"> = {
  sativa: "sativa",
  indica: "indica",
  hybrid: "hybrid",
};
const TYPE_LABEL: Record<string, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
};

export function meta({ data }: Route.MetaArgs) {
  const name = data?.strain?.name || "Cepa";
  return [
    { title: `${name} — WeedHub` },
    { name: "description", content: data?.strain?.description || "" },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await connectDB();
  const strain = await StrainModel.findOne({ slug: params.slug, isArchived: false }).lean();
  if (!strain) throw new Response("Cepa no encontrada", { status: 404 });

  const reviews = await ReviewModel.find({ strainId: strain._id, status: "published" })
    .sort({ helpfulCount: -1, createdAt: -1 })
    .limit(10)
    .populate("userId", "displayName avatar cannabisProfile.experienceLevel")
    .lean();

  const user = await getUserFromSession(request);
  let isSaved = false;
  if (user) {
    const saved = await SavedStrainModel.findOne({ userId: user._id, strainId: strain._id });
    isSaved = !!saved;
  }

  return {
    strain: {
      ...strain,
      _id: String(strain._id),
      createdAt: strain.createdAt.toISOString(),
      updatedAt: strain.updatedAt.toISOString(),
    },
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      ratings: r.ratings,
      comment: r.comment,
      context: r.context,
      effectsExperienced: r.effectsExperienced,
      helpfulVotes: r.helpfulVotes.map(String),
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt.toISOString(),
      user: r.userId
        ? {
            _id: String((r.userId as any)._id),
            displayName: (r.userId as any).displayName,
            avatar: (r.userId as any).avatar,
            cannabisProfile: (r.userId as any).cannabisProfile,
          }
        : undefined,
    })),
    isSaved,
  };
}

export default function StrainDetailPage({ loaderData }: Route.ComponentProps) {
  const { strain, reviews, isSaved } = loaderData;
  const context = useOutletContext<{ user?: any }>();
  const currentUser = context?.user;
  const saveFetcher = useFetcher();

  const optimisticSaved =
    saveFetcher.state !== "idle" ? !isSaved : isSaved;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Image */}
        <div className="lg:col-span-1">
          <div className="relative aspect-square rounded-2xl bg-forest-deep border border-white/5 overflow-hidden">
            {strain.imageUrl ? (
              <img
                src={strain.imageUrl}
                alt={strain.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-forest-accent">
                  potted_plant
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={TYPE_VARIANT[strain.type]}>
                  {TYPE_LABEL[strain.type]}
                </Badge>
                {strain.averageRatings.overall > 0 && (
                  <div className="flex items-center gap-1">
                    <RatingStars rating={strain.averageRatings.overall} size="sm" />
                    <span className="text-sm font-bold text-white ml-1">
                      {strain.averageRatings.overall.toFixed(1)}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({strain.reviewCount})
                    </span>
                  </div>
                )}
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-white">
                {strain.name}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {currentUser && (
                <saveFetcher.Form method="post" action={`/api/strains/${strain._id}/save`}>
                  <Button variant="ghost" size="icon" type="submit">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={optimisticSaved ? { fontVariationSettings: "'FILL' 1", color: "var(--color-primary)" } : undefined}
                    >
                      bookmark
                    </span>
                  </Button>
                </saveFetcher.Form>
              )}
            </div>
          </div>

          <p className="text-text-muted leading-relaxed mb-6">
            {strain.description}
          </p>

          {/* Genetics */}
          {(strain.genetics?.parent1 || strain.genetics?.parent2) && (
            <div className="mb-6 p-4 rounded-xl bg-white/5">
              <h3 className="text-sm font-bold text-white mb-2">Genética</h3>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                {strain.genetics.parent1 && <span>{strain.genetics.parent1}</span>}
                {strain.genetics.parent1 && strain.genetics.parent2 && (
                  <span className="text-primary">×</span>
                )}
                {strain.genetics.parent2 && <span>{strain.genetics.parent2}</span>}
                {strain.genetics.breeder && (
                  <span className="text-xs text-text-muted/60 ml-2">
                    por {strain.genetics.breeder}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cannabinoids */}
          <div className="space-y-3 mb-6">
            <CannabinoidBar
              label="THC"
              min={strain.cannabinoidProfile.thc.min}
              max={strain.cannabinoidProfile.thc.max}
              color="var(--color-primary)"
            />
            <CannabinoidBar
              label="CBD"
              min={strain.cannabinoidProfile.cbd.min}
              max={strain.cannabinoidProfile.cbd.max}
              color="var(--color-accent-purple)"
            />
          </div>

          {/* CTA */}
          <Link to={`/strains/${strain.slug}/review`}>
            <Button size="lg">
              <span className="material-symbols-outlined text-lg">edit</span>
              Escribir Reseña
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Terpenes, Effects, Flavors */}
        <div className="space-y-6">
          {/* Terpenes */}
          {strain.terpenes?.length > 0 && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white">Terpenos</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {strain.terpenes.map((t: any) => {
                  const terpInfo = TERPENES.find((tp) => tp.name === t.name);
                  return (
                    <div key={t.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{t.name}</span>
                        <span className="text-text-muted">{t.percentage}%</span>
                      </div>
                      <Progress
                        value={t.percentage}
                        max={2}
                        color={terpInfo?.color || "var(--color-primary)"}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Effects */}
          {strain.effects?.length > 0 && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white">Efectos</h3>
              </CardHeader>
              <CardContent>
                <EffectsChipGroup effects={strain.effects} />
              </CardContent>
            </Card>
          )}

          {/* Flavors */}
          {strain.flavors?.length > 0 && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white">Sabores</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {strain.flavors.map((f: string) => (
                    <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-text-muted">
                      {f}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Ratings + Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rating Summary */}
          {strain.reviewCount > 0 && (
            <Card className="border-white/10">
              <CardHeader>
                <h3 className="font-display font-bold text-white">Calificaciones</h3>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8 items-start">
                  <div className="text-center">
                    <p className="font-display text-5xl font-bold text-white">
                      {strain.averageRatings.overall.toFixed(1)}
                    </p>
                    <RatingStars rating={strain.averageRatings.overall} size="sm" />
                    <p className="text-xs text-text-muted mt-1">{strain.reviewCount} reseñas</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = strain.reviewDistribution?.[star as 1|2|3|4|5] || 0;
                      const pct = strain.reviewCount > 0 ? (count / strain.reviewCount) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-4 text-right text-text-muted">{star}</span>
                          <span className="material-symbols-outlined text-accent-amber text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                          <div className="flex-1">
                            <Progress value={pct} max={100} />
                          </div>
                          <span className="w-8 text-right text-xs text-text-muted">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-white">
                Reseñas ({strain.reviewCount})
              </h3>
              <Link to={`/strains/${strain.slug}/review`}>
                <Button size="sm">
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Escribir Reseña
                </Button>
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-forest-deep border border-white/5">
                <span className="material-symbols-outlined text-4xl text-text-muted/40 mb-2 block">
                  rate_review
                </span>
                <p className="text-text-muted mb-4">Sé el primero en reseñar esta cepa</p>
                <Link to={`/strains/${strain.slug}/review`}>
                  <Button>Escribir Reseña</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
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
      </div>
    </div>
  );
}
