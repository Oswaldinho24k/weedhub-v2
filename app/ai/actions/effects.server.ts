import { defineAction } from "~/ai/registry.server";
import {
  listEffects,
  getEffect,
  createEffect,
  updateEffect,
  approveEffect,
  rejectEffect,
  mergeEffect,
  EFFECT_CATEGORIES,
  EFFECT_STATUSES,
} from "~/services/effects.server";

const M = "efectos";
const labelProps = {
  labelEs: { type: "string", description: "Label en español" },
  labelEn: { type: "string", description: "Label en inglés" },
  labelPt: { type: "string", description: "Label en portugués" },
  category: { type: "string", enum: [...EFFECT_CATEGORIES] },
};

defineAction({
  name: "effect_list",
  module: M,
  risk: "read",
  description: `Lista efectos del catálogo (por defecto los aprobados, los más usados primero). Filtra por estado (pending = cola de revisión) o categoría.
Úsala antes de crear un efecto para no duplicarlo, o para encontrar el key destino de una fusión.`,
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: [...EFFECT_STATUSES], description: "Default: approved" },
      category: { type: "string", enum: [...EFFECT_CATEGORIES] },
      limit: { type: "number", description: "Default 50" },
    },
  },
  async execute(i) {
    const rows = await listEffects({ status: i.status as string, category: i.category as string, limit: i.limit as number });
    return { success: true, data: rows.map((e: any) => ({ ...e, _id: String(e._id), submittedBy: e.submittedBy ? String(e.submittedBy) : undefined })) };
  },
});

defineAction({
  name: "effect_get",
  module: M,
  risk: "read",
  description: "Trae un efecto por id o key (labels ES/EN/PT, categoría, estado, uso, razón de rechazo).",
  inputSchema: { type: "object", properties: { idOrKey: { type: "string" } }, required: ["idOrKey"] },
  async execute(i) {
    const e = await getEffect(String(i.idOrKey));
    return e ? { success: true, data: { ...e, _id: String((e as any)._id) } } : { success: false, error: "No encontrado" };
  },
});

defineAction({
  name: "effect_create",
  module: M,
  risk: "write",
  description: `Crea un efecto con labels en español, inglés y portugués. Llama effect_list antes para no duplicar.
Si lo crea el agente queda en la cola de revisión (pending); no lo aprueba.`,
  inputSchema: {
    type: "object",
    properties: { key: { type: "string", description: "Key único en minúsculas, ej. 'sociable'" }, ...labelProps },
    required: ["key", "labelEs", "labelEn", "labelPt", "category"],
  },
  async execute(i, ctx) {
    const r = await createEffect(i as any, ctx.actor === "admin" ? "admin" : "agente");
    return r.ok ? { success: true, data: { id: r.id, key: r.key, labelEs: r.labelEs, status: r.status } } : { success: false, error: r.error };
  },
});

defineAction({
  name: "effect_update",
  module: M,
  risk: "write",
  description: "Corrige labels o categoría de un efecto existente. Solo cambia lo que envíes; no cambia su estado (para eso, effect_approve / effect_reject).",
  inputSchema: { type: "object", properties: { id: { type: "string" }, ...labelProps }, required: ["id"] },
  async execute(i) {
    const { id, ...rest } = i;
    const r = await updateEffect(String(id), rest as any);
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});

defineAction({
  name: "effect_approve",
  module: M,
  risk: "destructive",
  description: "Aprueba un efecto pendiente y lo agrega al catálogo público; puede corregir labels y categoría en el mismo paso. Revisa la cola con effect_list status=pending.",
  confirmLabel: (i) => `Aprobar efecto ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, ...labelProps }, required: ["id"] },
  async execute(i) {
    const { id, ...rest } = i;
    const r = await approveEffect(String(id), rest as any);
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "effect_reject",
  module: M,
  risk: "destructive",
  description: "Rechaza un efecto (sale de la cola y del catálogo). Si es un duplicado de otro efecto, usa effect_merge.",
  confirmLabel: (i) => `Rechazar efecto ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, reason: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await rejectEffect(String(i.id), i.reason as string);
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});

defineAction({
  name: "effect_merge",
  module: M,
  risk: "destructive",
  description: `Fusiona un efecto duplicado con uno canónico (targetKey): lo marca rechazado con "Merged into: <key>".
No reescribe cepas ni reseñas que usen el key viejo. Busca el key destino con effect_list.`,
  confirmLabel: (i) => `Fusionar efecto ${i.id} con "${i.targetKey}"`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, targetKey: { type: "string" } }, required: ["id", "targetKey"] },
  async execute(i) {
    const r = await mergeEffect(String(i.id), String(i.targetKey));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});
