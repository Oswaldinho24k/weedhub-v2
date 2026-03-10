import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/admin.reviews";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { recalculateStrainRatings, updateUserStats } from "~/services/review.service.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { RatingStars } from "~/components/composite/rating-stars";
import { formatDate } from "~/lib/utils";

export async function loader() {
  await connectDB();
  const reviews = await ReviewModel.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("userId", "displayName email")
    .populate("strainId", "name slug")
    .lean();

  return {
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      ratings: r.ratings,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      user: r.userId
        ? { displayName: (r.userId as any).displayName, email: (r.userId as any).email }
        : null,
      strain: r.strainId
        ? { name: (r.strainId as any).name, slug: (r.strainId as any).slug }
        : null,
      strainId: String(r.strainId?._id || r.strainId),
      userId: String(r.userId?._id || r.userId),
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const formData = await request.formData();
  const reviewId = String(formData.get("reviewId"));
  const newStatus = String(formData.get("status"));

  const review = await ReviewModel.findById(reviewId);
  if (!review) return { error: "Reseña no encontrada" };

  review.status = newStatus as any;
  await review.save();

  await recalculateStrainRatings(String(review.strainId));
  await updateUserStats(String(review.userId));

  return { success: true, message: `Reseña ${newStatus === "published" ? "publicada" : newStatus === "removed" ? "eliminada" : "flagged"}` };
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-primary/10 text-primary",
  flagged: "bg-accent-amber/10 text-accent-amber",
  removed: "bg-red-500/10 text-red-400",
};

export default function AdminReviewsPage({ loaderData }: Route.ComponentProps) {
  const { reviews } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-white">
        Reseñas ({reviews.length})
      </h2>

      {actionData?.message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          actionData.success
            ? "bg-primary/10 border border-primary/20 text-primary"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {actionData.message || actionData.error}
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((review: any) => (
          <div
            key={review._id}
            className="p-4 rounded-xl bg-forest-deep border border-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-white">
                    {review.user?.displayName || "Anónimo"}
                  </span>
                  <span className="text-xs text-text-muted">{review.user?.email}</span>
                  <Badge className={STATUS_STYLES[review.status]}>
                    {review.status}
                  </Badge>
                </div>
                {review.strain && (
                  <Link
                    to={`/strains/${review.strain.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {review.strain.name}
                  </Link>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={review.ratings.overall} size="sm" />
                  <span className="text-xs text-text-muted">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-text-muted mt-2 line-clamp-2">
                    {review.comment}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {review.status !== "published" && (
                  <Form method="post">
                    <input type="hidden" name="reviewId" value={review._id} />
                    <input type="hidden" name="status" value="published" />
                    <Button variant="ghost" size="sm" type="submit">
                      <span className="material-symbols-outlined text-sm text-primary">check</span>
                    </Button>
                  </Form>
                )}
                {review.status !== "flagged" && (
                  <Form method="post">
                    <input type="hidden" name="reviewId" value={review._id} />
                    <input type="hidden" name="status" value="flagged" />
                    <Button variant="ghost" size="sm" type="submit">
                      <span className="material-symbols-outlined text-sm text-accent-amber">flag</span>
                    </Button>
                  </Form>
                )}
                {review.status !== "removed" && (
                  <Form method="post">
                    <input type="hidden" name="reviewId" value={review._id} />
                    <input type="hidden" name="status" value="removed" />
                    <Button variant="ghost" size="sm" type="submit">
                      <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                    </Button>
                  </Form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
