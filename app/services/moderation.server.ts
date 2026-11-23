/**
 * Moderation service (reviews + community posts): pure data logic.
 * Used by routes/admin.reviews.tsx, routes/admin.community.tsx and ai/actions/moderation.server.ts.
 *
 * Reviews, posts and comments hide `source: "seed"` docs by default (lib/seed-filter.server.ts).
 * Listings take `includeSeed` (default false). Operations on a specific id always include seed
 * docs, so anything an admin can see in a listing can also be moderated.
 */
import { connectDB } from "~/lib/db.server";
import { ReviewModel, type ReviewEntityType } from "~/models/review.server";
import { PostModel } from "~/models/post.server";
import { CommentModel } from "~/models/comment.server";
import { recalculateStrainRatings, recalculateEntityRatings, updateUserStats } from "~/services/review.service.server";
import { generateText } from "~/ai/generate.server";

export const REVIEW_ENTITY_TYPES: ReviewEntityType[] = ["strain", "product", "brand", "dispensary"];
export const REVIEW_STATUSES = ["published", "flagged", "removed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const SEED = { includeSeed: true };
const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

/* ───────────────────────── Reviews ───────────────────────── */

export async function listReviews(
  opts: { entityType?: string; status?: string; limit?: number; includeSeed?: boolean; withEmail?: boolean } = {}
) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (opts.entityType && REVIEW_ENTITY_TYPES.includes(opts.entityType as ReviewEntityType)) filter.entityType = opts.entityType;
  if (opts.status && REVIEW_STATUSES.includes(opts.status as ReviewStatus)) filter.status = opts.status;
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 200);

  const reviews = await ReviewModel.find(filter)
    .setOptions({ includeSeed: Boolean(opts.includeSeed) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", opts.withEmail ? "username anonymousHandle email" : "username anonymousHandle")
    .populate("strainId", "name slug")
    .lean();

  return reviews.map((r: any) => ({
    _id: String(r._id),
    entityType: r.entityType as ReviewEntityType,
    entityId: r.entityId ? String(r.entityId) : null,
    ratings: r.ratings,
    comment: r.comment as string,
    status: r.status as ReviewStatus,
    publishedAs: r.publishedAs as "username" | "anonymous",
    isSeed: r.source === "seed",
    createdAt: (r.createdAt as Date).toISOString(),
    user: r.userId
      ? {
          username: r.userId.username as string,
          anonymousHandle: r.userId.anonymousHandle as string,
          ...(opts.withEmail ? { email: r.userId.email as string } : {}),
        }
      : null,
    strain: r.strainId?.name ? { name: r.strainId.name as string, slug: r.strainId.slug as string } : null,
    strainId: String(r.strainId?._id || r.strainId),
    userId: String(r.userId?._id || r.userId),
  }));
}

export async function getReview(id: string) {
  await connectDB();
  if (!isObjectId(id)) return null;
  const r: any = await ReviewModel.findById(id).setOptions(SEED).populate("userId", "username").populate("strainId", "name slug").lean();
  if (!r) return null;
  return {
    _id: String(r._id),
    entityType: r.entityType as ReviewEntityType,
    entityId: r.entityId ? String(r.entityId) : null,
    strain: r.strainId?.name ? { name: r.strainId.name as string, slug: r.strainId.slug as string } : null,
    username: (r.userId?.username as string) ?? null,
    ratings: r.ratings,
    comment: r.comment as string,
    context: r.context,
    effectsExperienced: r.effectsExperienced ?? [],
    conditionsHelped: r.conditionsHelped ?? [],
    status: r.status as ReviewStatus,
    publishedAs: r.publishedAs,
    isSeed: r.source === "seed",
    createdAt: (r.createdAt as Date).toISOString(),
  };
}

/** Keeps entity averages and the author's stats in sync after a status change or delete. */
async function refreshAfterReviewChange(review: { strainId?: unknown; entityType?: ReviewEntityType; entityId?: unknown; userId?: unknown }) {
  if (review.strainId) await recalculateStrainRatings(String(review.strainId));
  if (review.entityType && review.entityType !== "strain" && review.entityId) {
    await recalculateEntityRatings(review.entityType, String(review.entityId));
  }
  if (review.userId) await updateUserStats(String(review.userId));
}

export async function setReviewStatus(id: string, status: string) {
  await connectDB();
  if (!REVIEW_STATUSES.includes(status as ReviewStatus)) return { ok: false as const, error: `Estado inválido: ${status}` };
  if (!isObjectId(id)) return { ok: false as const, error: "Reseña no encontrada" };
  const review = await ReviewModel.findById(id).setOptions(SEED);
  if (!review) return { ok: false as const, error: "Reseña no encontrada" };
  const previous = review.status;
  review.status = status as ReviewStatus;
  await review.save();
  await refreshAfterReviewChange(review);
  return { ok: true as const, id, status: status as ReviewStatus, previous };
}

export async function deleteReview(id: string) {
  await connectDB();
  if (!isObjectId(id)) return { ok: false as const, error: "Reseña no encontrada" };
  const review = await ReviewModel.findByIdAndDelete(id).setOptions(SEED);
  if (!review) return { ok: false as const, error: "Reseña no encontrada" };
  await refreshAfterReviewChange(review);
  return { ok: true as const, id };
}

export type ModerationDecision = "keep" | "flag" | "remove";

/**
 * AI moderation suggestion for one review. Read-only: it never changes the review.
 * Only the review content is sent to the model (no username, email or other personal data
 * from the account).
 */
export async function suggestReviewModeration(id: string) {
  const review = await getReview(id);
  if (!review) return { ok: false as const, error: "Reseña no encontrada" };

  const content = [
    `Tipo de entidad: ${review.entityType}${review.strain ? ` (${review.strain.name})` : ""}`,
    `Calificación general: ${review.ratings?.overall ?? "?"}/5`,
    review.context?.method ? `Método: ${review.context.method}` : "",
    review.effectsExperienced.length ? `Efectos: ${review.effectsExperienced.join(", ")}` : "",
    review.conditionsHelped.length ? `Condiciones: ${review.conditionsHelped.join(", ")}` : "",
    `Comentario:\n"""${review.comment || "(sin comentario)"}"""`,
  ]
    .filter(Boolean)
    .join("\n");

  const r = await generateText({
    system: `Eres moderación de contenido de WeedHub, una comunidad de reseñas de cannabis para personas adultas en Latinoamérica.
Evalúa UNA reseña y sugiere una decisión. Revisa en particular:
- spam o texto sin relación con el producto;
- ofertas de venta, precios, contacto para comprar, enlaces o promoción comercial;
- datos personales (teléfonos, correos, direcciones, nombres completos, redes sociales);
- menciones de menores de edad o consumo por menores;
- consejos de dosis peligrosos (cantidades extremas, mezclas riesgosas, conducir, embarazo) o afirmaciones de que cura enfermedades;
- insultos, acoso o discurso de odio.
Decisiones: "keep" (está bien), "flag" (dudosa, que la revise una persona), "remove" (incumple claramente).
Devuelve SOLO un JSON: {"decision": "keep"|"flag"|"remove", "reason": string (1-2 oraciones en español), "signals": string[] (de: spam, venta, datos_personales, menores, dosis_peligrosa, salud, acoso, otro; vacío si no hay)}.`,
    prompt: content,
    maxTokens: 2000,
    effort: "low",
  });
  if (!r.ok) return r;

  let parsed: { decision?: string; reason?: string; signals?: unknown };
  try {
    parsed = JSON.parse(r.text.replace(/^```(json)?|```$/g, "").trim());
  } catch {
    return { ok: false as const, error: "La IA no devolvió un formato válido; intenta de nuevo" };
  }
  const decision: ModerationDecision = ["keep", "flag", "remove"].includes(String(parsed.decision))
    ? (parsed.decision as ModerationDecision)
    : "flag";
  return {
    ok: true as const,
    reviewId: review._id,
    currentStatus: review.status,
    decision,
    reason: String(parsed.reason ?? "").trim() || "Sin motivo",
    signals: Array.isArray(parsed.signals) ? parsed.signals.map(String) : [],
  };
}

/* ───────────────────────── Community posts ───────────────────────── */

export async function listPosts(opts: { status?: string; q?: string; limit?: number; includeSeed?: boolean } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (opts.status === "published" || opts.status === "removed") filter.status = opts.status;
  if (opts.q) filter.title = { $regex: opts.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
  const includeSeed = Boolean(opts.includeSeed);

  const [posts, commentCount] = await Promise.all([
    PostModel.find(filter).setOptions({ includeSeed }).sort({ createdAt: -1 }).limit(limit).populate("userId", "username").lean(),
    CommentModel.countDocuments({ status: "published" }).setOptions({ includeSeed }),
  ]);

  return {
    posts: posts.map((p: any) => ({
      _id: String(p._id),
      slug: p.slug as string,
      title: p.title as string,
      category: p.category as string,
      status: p.status as "published" | "removed",
      upvoteCount: p.upvoteCount as number,
      commentCount: p.commentCount as number,
      publishedAs: p.publishedAs as "username" | "anonymous",
      username: (p.userId?.username as string) || "—",
      isSeed: p.source === "seed",
      createdAt: (p.createdAt as Date).toISOString(),
    })),
    commentCount,
  };
}

export async function setPostStatus(id: string, status: "published" | "removed") {
  await connectDB();
  if (!isObjectId(id)) return { ok: false as const, error: "Post no encontrado" };
  const post = await PostModel.findByIdAndUpdate(id, { status }, { new: true }).setOptions(SEED).select("title status");
  if (!post) return { ok: false as const, error: "Post no encontrado" };
  return { ok: true as const, id, title: post.title, status: post.status };
}

export const removePost = (id: string) => setPostStatus(id, "removed");
export const restorePost = (id: string) => setPostStatus(id, "published");

/** Deletes a post forever, together with all its comments. */
export async function deletePost(id: string) {
  await connectDB();
  if (!isObjectId(id)) return { ok: false as const, error: "Post no encontrado" };
  const post = await PostModel.findByIdAndDelete(id).setOptions(SEED);
  if (!post) return { ok: false as const, error: "Post no encontrado" };
  const c = await CommentModel.deleteMany({ postId: id });
  return { ok: true as const, id, title: post.title, deletedComments: c.deletedCount ?? 0 };
}
