import { defineAction } from "~/ai/registry.server";
import {
  listReviews,
  getReview,
  setReviewStatus,
  deleteReview,
  suggestReviewModeration,
  listPosts,
  removePost,
  restorePost,
  deletePost,
  REVIEW_ENTITY_TYPES,
  REVIEW_STATUSES,
} from "~/services/moderation.server";

// Community moderation: reviews and forum posts. Outputs never include email or other account data.
const M = "moderacion";
const includeSeed = { type: "boolean", description: "Incluir contenido seed (oculto en el sitio). Por defecto false." };

/* ───────────── Reviews ───────────── */

defineAction({
  name: "moderation_list_reviews",
  module: M,
  risk: "read",
  description: `Lista reseñas de usuarios (las más recientes primero) filtrando por estado (published/flagged/removed) o tipo de entidad.
Úsala para revisar reportadas ("flagged"). No es la revisión editorial de cepas/glosario: para eso usa review_queue.`,
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: [...REVIEW_STATUSES] },
      entityType: { type: "string", enum: REVIEW_ENTITY_TYPES },
      limit: { type: "number", description: "Por defecto 50, máx 200" },
      includeSeed,
    },
  },
  async execute(i) {
    const rows = await listReviews({
      status: i.status as string,
      entityType: i.entityType as string,
      limit: Number(i.limit) || 50,
      includeSeed: Boolean(i.includeSeed),
    });
    return {
      success: true,
      data: rows.map((r) => ({
        id: r._id,
        status: r.status,
        entityType: r.entityType,
        strain: r.strain?.name ?? null,
        overall: r.ratings?.overall,
        comment: r.comment.length > 280 ? `${r.comment.slice(0, 280)}…` : r.comment,
        author: r.publishedAs === "anonymous" ? r.user?.anonymousHandle ?? null : r.user?.username ?? null,
        isSeed: r.isSeed,
        createdAt: r.createdAt,
      })),
    };
  },
});

defineAction({
  name: "moderation_get_review",
  module: M,
  risk: "read",
  description: "Trae una reseña completa por id (comentario, calificaciones, contexto, efectos, estado). Obtén el id con moderation_list_reviews.",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await getReview(String(i.id));
    return r ? { success: true, data: r } : { success: false, error: "Reseña no encontrada" };
  },
});

defineAction({
  name: "review_moderation_suggestion",
  module: M,
  risk: "read",
  description: `Pide a la IA una sugerencia de moderación (keep / flag / remove) con motivo para una reseña: revisa spam, venta, datos personales, menores y dosis peligrosas.
Solo sugiere; no cambia nada. Para aplicar usa moderation_set_review_status o moderation_remove_review.`,
  inputSchema: { type: "object", properties: { id: { type: "string", description: "Id de la reseña" } }, required: ["id"] },
  async execute(i) {
    const r = await suggestReviewModeration(String(i.id));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "moderation_set_review_status",
  module: M,
  risk: "write",
  description: `Marca una reseña como reportada ("flagged") o la vuelve a publicar ("published"); recalcula promedios y stats del autor.
Para ocultarla del sitio usa moderation_remove_review; para borrarla, moderation_delete_review.`,
  inputSchema: {
    type: "object",
    properties: { id: { type: "string" }, status: { type: "string", enum: ["published", "flagged"] } },
    required: ["id", "status"],
  },
  async execute(i) {
    const status = String(i.status);
    if (status !== "published" && status !== "flagged") return { success: false, error: "Usa moderation_remove_review para retirar una reseña" };
    const r = await setReviewStatus(String(i.id), status);
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "moderation_remove_review",
  module: M,
  risk: "destructive",
  description: `Retira una reseña del sitio (estado "removed"); se puede revertir con moderation_set_review_status. Recalcula promedios.
Úsala tras revisarla (moderation_get_review o review_moderation_suggestion). No la borra de la base.`,
  confirmLabel: (i) => `Retirar reseña ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await setReviewStatus(String(i.id), "removed");
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "moderation_delete_review",
  module: M,
  risk: "destructive",
  description: "Borra una reseña para siempre y recalcula promedios. No se puede deshacer; prefiere moderation_remove_review.",
  confirmLabel: (i) => `Borrar permanentemente la reseña ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await deleteReview(String(i.id));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

/* ───────────── Community posts ───────────── */

defineAction({
  name: "community_list_posts",
  module: M,
  risk: "read",
  description: `Lista posts del foro de comunidad (título, categoría, autor, votos, comentarios, estado) y el total de comentarios publicados.
Filtra por estado (published/removed) o texto en el título. No trae el cuerpo del post.`,
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["published", "removed"] },
      q: { type: "string", description: "Texto a buscar en el título" },
      limit: { type: "number", description: "Por defecto 50, máx 200" },
      includeSeed,
    },
  },
  async execute(i) {
    const r = await listPosts({ status: i.status as string, q: i.q as string, limit: Number(i.limit) || 50, includeSeed: Boolean(i.includeSeed) });
    return { success: true, data: r };
  },
});

defineAction({
  name: "community_remove_post",
  module: M,
  risk: "destructive",
  description: "Oculta un post del foro (estado \"removed\"); se revierte con community_restore_post. Obtén el id con community_list_posts.",
  confirmLabel: (i) => `Ocultar post ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await removePost(String(i.id));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "community_restore_post",
  module: M,
  risk: "destructive",
  description: "Vuelve a publicar un post del foro que estaba oculto (\"removed\"). No recupera posts borrados con community_delete_post.",
  confirmLabel: (i) => `Restaurar post ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await restorePost(String(i.id));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "community_delete_post",
  module: M,
  risk: "destructive",
  description: "Borra para siempre un post del foro y todos sus comentarios. No se puede deshacer; prefiere community_remove_post.",
  confirmLabel: (i) => `Borrar permanentemente el post ${i.id} y sus comentarios`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await deletePost(String(i.id));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});
