import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/admin.reviews";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { recalculateStrainRatings, updateUserStats } from "~/services/review.service.server";
import { Icon } from "~/components/ui/icon";
import { RatingStars } from "~/components/composite/rating-stars";
import { formatDate } from "~/lib/utils";

export async function loader() {
  await connectDB();
  const reviews = await ReviewModel.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("userId", "username anonymousHandle email")
    .populate("strainId", "name slug")
    .lean();

  return {
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      ratings: r.ratings,
      comment: r.comment,
      status: r.status,
      publishedAs: r.publishedAs,
      createdAt: r.createdAt.toISOString(),
      user: r.userId
        ? {
            username: (r.userId as any).username,
            anonymousHandle: (r.userId as any).anonymousHandle,
            email: (r.userId as any).email,
          }
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

  return {
    success: true,
    message: `Reseña ${
      newStatus === "published" ? "publicada" : newStatus === "removed" ? "eliminada" : "marcada"
    }`,
  };
}

const STATUS_PILL: Record<string, string> = {
  published: "accent",
  flagged: "warm",
  removed: "warm",
};

export default function AdminReviewsPage({ loaderData }: Route.ComponentProps) {
  const { reviews } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <h2 className="display text-2xl">Reseñas ({reviews.length})</h2>

      {actionData?.message && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{
            background: actionData.success ? "var(--accent-soft)" : "var(--warm-soft)",
            color: actionData.success ? "var(--fg)" : "var(--warm)",
          }}
        >
          {actionData.message || actionData.error}
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((review: any) => (
          <article key={review._id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {review.user?.username ? `@${review.user.username}` : "Anónimo"}
                  </span>
                  {review.publishedAs === "anonymous" && review.user?.anonymousHandle && (
                    <span className="mono text-xs text-fg-dim">
                      publicado como {review.user.anonymousHandle}
                    </span>
                  )}
                  <span className="text-xs text-fg-dim">{review.user?.email}</span>
                  <span className={`pill ${STATUS_PILL[review.status]}`}>
                    {review.status}
                  </span>
                </div>
                {review.strain && (
                  <Link
                    to={`/strains/${review.strain.slug}`}
                    className="text-sm text-fg hover:text-accent"
                  >
                    {review.strain.name}
                  </Link>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={review.ratings.overall} size="sm" />
                  <span className="text-xs text-fg-dim">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-fg-muted mt-2 line-clamp-3">
                    {review.comment}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {review.status !== "published" && (
                  <ModBtn reviewId={review._id} status="published" icon="check" label="Publicar" />
                )}
                {review.status !== "flagged" && (
                  <ModBtn reviewId={review._id} status="flagged" icon="alert" label="Marcar" />
                )}
                {review.status !== "removed" && (
                  <ModBtn reviewId={review._id} status="removed" icon="x" label="Eliminar" tone="warm" />
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ModBtn({
  reviewId,
  status,
  icon,
  label,
  tone,
}: {
  reviewId: string;
  status: string;
  icon: "check" | "alert" | "x";
  label: string;
  tone?: "warm";
}) {
  return (
    <Form method="post">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="btn btn-ghost !py-1.5 !px-3 text-xs"
        style={tone === "warm" ? { color: "var(--warm)" } : undefined}
        aria-label={label}
      >
        <Icon name={icon} size={14} />
        {label}
      </button>
    </Form>
  );
}
