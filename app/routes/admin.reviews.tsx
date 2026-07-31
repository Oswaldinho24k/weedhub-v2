import { Form, Link, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.reviews";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { recalculateStrainRatings, updateUserStats } from "~/services/review.service.server";
import { Icon } from "~/components/ui/icon";
import { RatingStars } from "~/components/composite/rating-stars";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") || "";
  const status = url.searchParams.get("status") || "";

  const filter: Record<string, unknown> = {};
  if (entityType && ["strain", "product", "brand", "dispensary"].includes(entityType))
    filter.entityType = entityType;
  if (status && ["published", "flagged", "removed"].includes(status))
    filter.status = status;

  const reviews = await ReviewModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("userId", "username anonymousHandle email")
    .populate("strainId", "name slug")
    .lean();

  return {
    filters: { entityType, status },
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      entityType: r.entityType,
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
  const intent = String(formData.get("intent") || "status");
  const reviewId = String(formData.get("reviewId"));

  if (intent === "delete") {
    const review = await ReviewModel.findByIdAndDelete(reviewId);
    if (!review) return { error: "Reseña no encontrada" };
    await recalculateStrainRatings(String(review.strainId));
    await updateUserStats(String(review.userId));
    return { success: true, message: "Reseña eliminada permanentemente" };
  }

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
  const { reviews, filters } = loaderData;
  const actionData = useActionData<typeof action>();
  const [, setSearchParams] = useSearchParams();

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="display text-2xl">Reseñas ({reviews.length})</h2>
        <div className="flex gap-2 ml-auto flex-wrap">
          <select
            value={filters.entityType}
            onChange={(e) => setFilter("entityType", e.target.value)}
            className="text-xs bg-raised border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-accent"
          >
            <option value="">Todos los tipos</option>
            <option value="strain">Cepas</option>
            <option value="product">Productos</option>
            <option value="brand">Marcas</option>
            <option value="dispensary">Dispensarios</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="text-xs bg-raised border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-accent"
          >
            <option value="">Todos los estados</option>
            <option value="published">Publicadas</option>
            <option value="flagged">Reportadas</option>
            <option value="removed">Eliminadas</option>
          </select>
        </div>
      </div>

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

              <div className="flex gap-2 flex-wrap">
                {review.status !== "published" && (
                  <ModBtn reviewId={review._id} status="published" icon="check" label="Publicar" />
                )}
                {review.status !== "flagged" && (
                  <ModBtn reviewId={review._id} status="flagged" icon="alert" label="Marcar" />
                )}
                {review.status !== "removed" && (
                  <ModBtn reviewId={review._id} status="removed" icon="x" label="Eliminar" tone="warm" />
                )}
                <DeleteBtn reviewId={review._id} />
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
      <input type="hidden" name="intent" value="status" />
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

function DeleteBtn({ reviewId }: { reviewId: string }) {
  return (
    <Form
      method="post"
      onSubmit={(e) => {
        if (!confirm("¿Eliminar permanentemente esta reseña? Esta acción no se puede deshacer."))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="reviewId" value={reviewId} />
      <button
        type="submit"
        className="btn btn-ghost !py-1.5 !px-3 text-xs"
        style={{ color: "var(--warm)" }}
        aria-label="Borrar permanente"
        title="Borrar permanente"
      >
        <Icon name="trash" size={14} />
      </button>
    </Form>
  );
}
