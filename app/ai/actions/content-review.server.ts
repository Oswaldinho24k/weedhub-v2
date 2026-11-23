import { defineAction } from "~/ai/registry.server";
import {
  reviewStats,
  listQueue,
  getRecord,
  updateRecord,
  incompleteStrains,
  generateEditorialNote,
  isCollectionKey,
  COLLECTIONS,
} from "~/services/content-review.server";

// The agent reads, proposes edits and drafts notes. Approve/reject is human-only (/admin/revision).
const M = "revision";
const COLL = Object.keys(COLLECTIONS);

defineAction({
  name: "review_stats",
  module: M,
  risk: "read",
  description: `Avance de la revisión editorial: pendientes, aprobados y rechazados por colección (cepas, glosario, mapa-verde, articulos) y notas de la redacción por aprobar.
Úsala cuando pregunten "cómo vamos" o qué conviene revisar.`,
  inputSchema: { type: "object", properties: {} },
  async execute() {
    return { success: true, data: await reviewStats() };
  },
});

defineAction({
  name: "review_queue",
  module: M,
  risk: "read",
  description: `Lista registros de una colección por estado de revisión. Las cepas salen por popularidad.
Usa review_get_record con el id para ver el contenido.`,
  inputSchema: {
    type: "object",
    properties: {
      collection: { type: "string", enum: COLL },
      status: { type: "string", enum: ["pendiente", "aprobado", "rechazado", "todos"] },
      q: { type: "string" },
      page: { type: "number" },
    },
    required: ["collection"],
  },
  async execute(i) {
    if (!isCollectionKey(i.collection)) return { success: false, error: "Colección inválida" };
    return { success: true, data: await listQueue({ collection: i.collection, status: (i.status as any) ?? "pendiente", q: i.q as string, page: Number(i.page) || 1 }) };
  },
});

defineAction({
  name: "review_get_record",
  module: M,
  risk: "read",
  description: "Trae un registro con sus campos editables, estado de revisión, nota de la redacción y contexto (terpenos, fuentes).",
  inputSchema: { type: "object", properties: { collection: { type: "string", enum: COLL }, id: { type: "string" } }, required: ["collection", "id"] },
  async execute(i) {
    if (!isCollectionKey(i.collection)) return { success: false, error: "Colección inválida" };
    const r = await getRecord(i.collection, String(i.id));
    return r ? { success: true, data: r } : { success: false, error: "No encontrado" };
  },
});

defineAction({
  name: "review_propose_edit",
  module: M,
  risk: "write",
  description: `Corrige campos de un registro usando los paths de review_get_record (ej. "summary", "cannabinoidProfile.thc.max").
El registro vuelve a "pendiente" para que la persona apruebe. No inventes datos.`,
  inputSchema: {
    type: "object",
    properties: { collection: { type: "string", enum: COLL }, id: { type: "string" }, values: { type: "object" } },
    required: ["collection", "id", "values"],
  },
  async execute(i, ctx) {
    if (!isCollectionKey(i.collection)) return { success: false, error: "Colección inválida" };
    const r = await updateRecord(i.collection, String(i.id), (i.values as Record<string, unknown>) ?? {}, "agente", ctx.by);
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "strain_draft_editorial_note",
  module: M,
  risk: "write",
  description: `Redacta con IA la "Nota de la redacción" de una cepa usando solo sus datos. Queda pendiente hasta que la persona la apruebe.
No reescribas notas aprobadas salvo que lo pidan.`,
  inputSchema: { type: "object", properties: { id: { type: "string", description: "id de la cepa" } }, required: ["id"] },
  async execute(i) {
    const r = await generateEditorialNote(String(i.id));
    return r.ok ? { success: true, data: { text: r.text, status: "pendiente" } } : { success: false, error: r.error };
  },
});

defineAction({
  name: "strain_find_incomplete",
  module: M,
  risk: "read",
  description: "Cepas con huecos (sin THC, terpenos, descripción o genética), las más conocidas primero. Para priorizar trabajo de datos; no completa nada.",
  inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  async execute(i) {
    return { success: true, data: await incompleteStrains(Number(i.limit) || 20) };
  },
});
