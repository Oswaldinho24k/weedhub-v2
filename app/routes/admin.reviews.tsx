import { Form, Link, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.reviews";
import { requireAdmin } from "~/lib/auth.server";
import { listReviews, setReviewStatus, deleteReview } from "~/services/moderation.server";
import { Icon } from "~/components/ui/icon";
import { RatingStars } from "~/components/composite/rating-stars";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") || "";
  const status = url.searchParams.get("status") || "";
  const includeSeed = url.searchParams.get("includeSeed") === "1";
  // Email is shown only here, in the admin UI; AI actions never receive it.
  const reviews = await listReviews({ entityType, status, includeSeed, withEmail: true, limit: 100 });
  return { filters: { entityType, status }, reviews };
}

// HTTP adapter only: all logic lives in services/moderation.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "status");
  const reviewId = String(formData.get("reviewId"));

  if (intent === "delete") {
    const r = await deleteReview(reviewId);
    return r.ok ? { success: true, message: "Reseña eliminada permanentemente" } : { success: false, error: r.error, message: r.error };
  }

  const newStatus = String(formData.get("status"));
  const r = await setReviewStatus(reviewId, newStatus);
  if (!r.ok) return { success: false, error: r.error, message: r.error };
  return {
    success: true,
    message: `Reseña ${newStatus === "published" ? "publicada" : newStatus === "removed" ? "eliminada" : "marcada"}`,
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
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        style={tone === "warm" ? { color: "var(--warm)" } : undefined}
        aria-label={label}
      >
        <Icon name={icon} size={14} />
        {label}
      </Button>
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
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        style={{ color: "var(--warm)" }}
        aria-label="Borrar permanente"
        title="Borrar permanente"
      >
        <Icon name="trash" size={14} />
      </Button>
    </Form>
  );
}
