import { defineAction } from "~/ai/registry.server";
import {
  listStrains,
  getStrain,
  getStrainGrowInfo,
  getDashboardStats,
  createStrain,
  updateStrain,
  setStrainArchived,
  generateStrainImageFor,
  draftStrainDescription,
  listSubmissions,
  approveSubmission,
  rejectSubmission,
  mergeSubmissionAsAlias,
  resolveReviewerId,
  STRAIN_TYPES,
  DIFFICULTIES,
  CLIMATES,
} from "~/services/strains.server";

const M = "cepas";
const actorOf = (a: string) => (a === "admin" ? "admin" : "agente") as "admin" | "agente";
const done = (r: { ok: boolean; error?: string }) => (r.ok ? { success: true, data: r } : { success: false, error: r.error });

const strList = { type: "array", items: { type: "string" } };
const idOrSlug = { type: "string", description: "id o slug de la cepa" };

defineAction({
  name: "strain_search",
  module: M,
  risk: "read",
  description: `Busca cepas por nombre o alias, con filtros de tipo, archivadas y estado de revisión. Devuelve id, slug, tipo, reseñas y estado.
Úsala antes de strain_get/strain_update para obtener el slug. No trae el detalle completo.`,
  inputSchema: {
    type: "object",
    properties: {
      q: { type: "string", description: "Texto del nombre o alias" },
      type: { type: "string", enum: [...STRAIN_TYPES] },
      archived: { type: "boolean", description: "true solo archivadas, false solo activas; omite para todas" },
      revision: { type: "string", enum: ["pendiente", "aprobado", "rechazado"] },
      limit: { type: "number", description: "Por defecto 20, máximo 200" },
    },
  },
  async execute(i) {
    const rows = await listStrains({
      q: i.q as string,
      type: i.type as string,
      archived: typeof i.archived === "boolean" ? i.archived : undefined,
      revision: i.revision as any,
      limit: Number(i.limit) || 20,
    });
    return { success: true, data: rows };
  },
});

defineAction({
  name: "strain_get",
  module: M,
  risk: "read",
  description: `Trae la ficha completa de una cepa por id o slug (cannabinoides, terpenos, efectos, sabores, descripciones, genética, cultivo, revisión).
Llámala antes de strain_update para no perder datos.`,
  inputSchema: { type: "object", properties: { idOrSlug }, required: ["idOrSlug"] },
  async execute(i) {
    const s = await getStrain(String(i.idOrSlug));
    return s ? { success: true, data: s } : { success: false, error: `Cepa '${i.idOrSlug}' no encontrada` };
  },
});

defineAction({
  name: "strain_get_grow_info",
  module: M,
  risk: "read",
  description: "Trae solo los datos de cultivo de una cepa (semanas de floración, rendimiento, altura, clima, dificultad). Para editarlos usa strain_update.",
  inputSchema: { type: "object", properties: { idOrSlug }, required: ["idOrSlug"] },
  async execute(i) {
    return done(await getStrainGrowInfo(String(i.idOrSlug)));
  },
});

defineAction({
  name: "strain_create_draft",
  module: M,
  risk: "write",
  description: `Crea una cepa nueva SOLO con los datos que te dio la persona (no inventes cifras ni genética). Queda archivada (oculta del sitio) y pendiente;
la persona la revisa y la restaura con strain_set_archived. Busca antes con strain_search para no duplicar. No redacta con IA: para eso usa luego strain_draft_description.`,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      type: { type: "string", enum: [...STRAIN_TYPES] },
      description: { type: "string", description: "Descripción breve con los datos dados por la persona" },
      aliases: strList,
      lineage: { type: "string" },
      parent1: { type: "string" },
      parent2: { type: "string" },
      breeder: { type: "string" },
      thcMin: { type: "number" },
      thcMax: { type: "number" },
      cbdMin: { type: "number" },
      cbdMax: { type: "number" },
      dominantTerpene: { type: "string" },
      effects: strList,
      flavors: strList,
    },
    required: ["name", "type", "description"],
  },
  async execute(i, ctx) {
    return done(await createStrain(i as any, { actor: actorOf(ctx.actor), draft: true }));
  },
});

defineAction({
  name: "strain_update",
  module: M,
  risk: "write",
  description: `Edita campos de una cepa (datos, descripciones, genética, cannabinoides y cultivo). Manda solo lo que cambia; las listas reemplazan la lista completa.
Llama strain_get antes. Vuelve a pendiente de revisión. No archiva ni cambia la imagen.`,
  inputSchema: {
    type: "object",
    properties: {
      idOrSlug,
      name: { type: "string" },
      type: { type: "string", enum: [...STRAIN_TYPES] },
      description: { type: "string" },
      descriptionEs: { type: "string" },
      aliases: strList,
      effects: { ...strList, description: "Efectos en español" },
      flavors: { ...strList, description: "Sabores en español" },
      terpenes: { type: "array", items: { type: "object", properties: { name: { type: "string" }, percentage: { type: "number" } }, required: ["name"] } },
      lineage: { type: "string" },
      colorHint: { type: "string", description: "Color CSS para el placeholder" },
      dominantTerpene: { type: "string" },
      difficulty: { type: "string", enum: [...DIFFICULTIES] },
      parent1: { type: "string" },
      parent2: { type: "string" },
      breeder: { type: "string" },
      thcMin: { type: "number" },
      thcMax: { type: "number" },
      cbdMin: { type: "number" },
      cbdMax: { type: "number" },
      cbg: { type: "number" },
      cbn: { type: "number" },
      floweringWeeksMin: { type: "number" },
      floweringWeeksMax: { type: "number" },
      yieldIndoor: { type: "string", description: "ej. '400-500 g/m²'" },
      yieldOutdoor: { type: "string", description: "ej. '600 g/planta'" },
      heightCmMin: { type: "number" },
      heightCmMax: { type: "number" },
      climate: { type: "string", enum: [...CLIMATES] },
      isAutoflowering: { type: "boolean" },
      isFeminized: { type: "boolean" },
    },
    required: ["idOrSlug"],
  },
  async execute(i, ctx) {
    const { idOrSlug: key, ...patch } = i;
    return done(await updateStrain(String(key), patch as any, actorOf(ctx.actor)));
  },
});

defineAction({
  name: "strain_draft_description",
  module: M,
  risk: "write",
  description: `La IA redacta la descripción en español de una cepa usando solo sus datos guardados y la guarda en descriptionEs como pendiente.
Si ya tiene descripción, falla salvo overwrite: true (pregúntale a la persona). Completa datos con strain_update antes si faltan.`,
  inputSchema: {
    type: "object",
    properties: { idOrSlug, overwrite: { type: "boolean" }, notes: { type: "string", description: "Indicaciones de tono o enfoque de la persona" } },
    required: ["idOrSlug"],
  },
  async execute(i) {
    return done(await draftStrainDescription(String(i.idOrSlug), { overwrite: Boolean(i.overwrite), notes: i.notes as string }));
  },
});

defineAction({
  name: "strain_set_archived",
  module: M,
  risk: "destructive",
  description: `Archiva (oculta del sitio) o restaura (publica) una cepa. Úsala también para publicar un borrador creado con strain_create_draft.
No borra datos.`,
  confirmLabel: (i) => `${i.archived ? "Archivar" : "Restaurar y publicar"} cepa ${i.idOrSlug}`,
  inputSchema: { type: "object", properties: { idOrSlug, archived: { type: "boolean" } }, required: ["idOrSlug", "archived"] },
  async execute(i) {
    return done(await setStrainArchived(String(i.idOrSlug), Boolean(i.archived)));
  },
});

defineAction({
  name: "strain_generate_image",
  module: M,
  risk: "destructive",
  description: `Genera una imagen nueva con IA (fal.ai, cuesta dinero) a partir de los datos de la cepa y REEMPLAZA su imagen actual.
Úsala solo si la persona lo pide. No sube imágenes propias.`,
  confirmLabel: (i) => `Generar imagen con IA y reemplazar la de ${i.idOrSlug}`,
  inputSchema: { type: "object", properties: { idOrSlug }, required: ["idOrSlug"] },
  async execute(i) {
    return done(await generateStrainImageFor(String(i.idOrSlug)));
  },
});

defineAction({
  name: "strain_submission_list",
  module: M,
  risk: "read",
  description: `Lista las sugerencias de cepas de la comunidad pendientes, con coincidencia exacta o parecidas del catálogo.
Úsala antes de aprobar, rechazar o fusionar. No cambia nada.`,
  inputSchema: { type: "object", properties: {} },
  async execute() {
    return { success: true, data: await listSubmissions() };
  },
});

defineAction({
  name: "strain_submission_approve",
  module: M,
  risk: "destructive",
  description: `Aprueba una sugerencia: crea la cepa pública y da +10 pts a quien la envió. Si ya existe la cepa, usa strain_submission_merge.
Llama strain_submission_list antes.`,
  confirmLabel: (i) => `Aprobar sugerencia ${i.submissionId} y publicar la cepa`,
  inputSchema: {
    type: "object",
    properties: { submissionId: { type: "string" }, thcMax: { type: "number" }, cbdMax: { type: "number" } },
    required: ["submissionId"],
  },
  async execute(i, ctx) {
    return done(await approveSubmission(String(i.submissionId), { thcMax: i.thcMax as number, cbdMax: i.cbdMax as number }, await resolveReviewerId(ctx.by)));
  },
});

defineAction({
  name: "strain_submission_reject",
  module: M,
  risk: "destructive",
  description: "Rechaza una sugerencia de cepa con un motivo opcional. Llama strain_submission_list antes. No borra la sugerencia.",
  confirmLabel: (i) => `Rechazar sugerencia ${i.submissionId}`,
  inputSchema: { type: "object", properties: { submissionId: { type: "string" }, reason: { type: "string" } }, required: ["submissionId"] },
  async execute(i, ctx) {
    return done(await rejectSubmission(String(i.submissionId), i.reason as string, await resolveReviewerId(ctx.by)));
  },
});

defineAction({
  name: "strain_submission_merge",
  module: M,
  risk: "destructive",
  description: `Agrega el nombre sugerido como alias de una cepa existente y da +5 pts a quien lo envió. Úsala cuando la sugerencia es un duplicado.
Llama strain_submission_list antes para ver las coincidencias.`,
  confirmLabel: (i) => `Fusionar sugerencia ${i.submissionId} como alias de ${i.targetIdOrSlug}`,
  inputSchema: {
    type: "object",
    properties: { submissionId: { type: "string" }, targetIdOrSlug: { type: "string", description: "id o slug de la cepa destino" } },
    required: ["submissionId", "targetIdOrSlug"],
  },
  async execute(i, ctx) {
    return done(await mergeSubmissionAsAlias(String(i.submissionId), String(i.targetIdOrSlug), await resolveReviewerId(ctx.by)));
  },
});
