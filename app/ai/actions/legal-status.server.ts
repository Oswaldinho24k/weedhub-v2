import { defineAction } from "~/ai/registry.server";
import {
  listCountries,
  getCountry,
  createCountry,
  updateCountry,
  setCountryActive,
  reviewChecklist,
  LEGAL_STATUSES,
  LEGAL_REGIONS,
} from "~/services/legal-status.server";

const M = "mapa-verde";
const actorOf = (a: string) => (a === "admin" ? "admin" : "agente") as "admin" | "agente";

const contentProps = {
  nationalStatus: { type: "string", enum: LEGAL_STATUSES },
  summary: { type: "string", description: "1-2 oraciones, respuesta directa sobre la situación actual" },
  whatYouCan: { type: "array", items: { type: "string" } },
  whatYouCant: { type: "array", items: { type: "string" } },
  keyLaw: { type: "string" },
  keyDate: { type: "string", description: "Ej. \"Desde 2017\"" },
  sources: {
    type: "array",
    items: { type: "object", properties: { label: { type: "string" }, url: { type: "string" } }, required: ["label"] },
    description: "Reemplaza la lista completa de fuentes",
  },
  states: {
    type: "array",
    items: {
      type: "object",
      properties: { name: { type: "string" }, nameEs: { type: "string" }, status: { type: "string", enum: LEGAL_STATUSES }, note: { type: "string" } },
      required: ["nameEs", "status"],
    },
    description: "Reemplaza el desglose completo por estado/provincia",
  },
};

defineAction({
  name: "legal_status_list",
  module: M,
  risk: "read",
  description: `Lista los países del Mapa Verde (id, código ISO, nombre, región, estatus, visible, revisión, última revisión). Filtra por región, estatus o visibles.
Usa legal_status_get para ver el contenido completo de un país.`,
  inputSchema: {
    type: "object",
    properties: { region: { type: "string", enum: LEGAL_REGIONS }, status: { type: "string", enum: LEGAL_STATUSES }, active: { type: "boolean" } },
  },
  async execute(i) {
    const rows = await listCountries({ region: i.region as string, status: i.status as string, active: i.active as boolean | undefined });
    return {
      success: true,
      data: rows.map((c: any) => ({
        id: String(c._id),
        countryCode: c.countryCode,
        countryNameEs: c.countryNameEs,
        region: c.region,
        nationalStatus: c.nationalStatus,
        isActive: c.isActive,
        revision: c.revision?.status ?? "pendiente",
        lastReviewedAt: c.lastReviewedAt ?? null,
      })),
    };
  },
});

defineAction({
  name: "legal_status_get",
  module: M,
  risk: "read",
  description: "Trae la ficha completa de un país por id o código ISO (ej. \"MX\"): estatus, resumen, listas, ley, fuentes, estados y revisión. Llámala antes de legal_status_update.",
  inputSchema: { type: "object", properties: { idOrCode: { type: "string" } }, required: ["idOrCode"] },
  async execute(i) {
    const c = await getCountry(String(i.idOrCode));
    return c ? { success: true, data: { ...c, _id: String((c as any)._id) } } : { success: false, error: "No encontrado" };
  },
});

defineAction({
  name: "legal_status_review_checklist",
  module: M,
  risk: "read",
  description: `Para un país (id o código ISO), devuelve qué debe verificar una persona: revisión vieja, fuentes faltantes, listas vacías, estados sin nota y las afirmaciones a confirmar.
Se arma solo con los campos del registro; no consulta leyes ni fuentes externas ni cambia nada.`,
  inputSchema: {
    type: "object",
    properties: { idOrCode: { type: "string" }, staleAfterDays: { type: "number", description: "Default 180" } },
    required: ["idOrCode"],
  },
  async execute(i) {
    const r = await reviewChecklist(String(i.idOrCode), { staleAfterDays: i.staleAfterDays as number | undefined });
    if (!r.ok) return { success: false, error: r.error };
    const { ok: _ok, ...data } = r;
    return { success: true, data };
  },
});

defineAction({
  name: "legal_status_create",
  module: M,
  risk: "write",
  description: `Agrega un país al Mapa Verde con los datos que dio la persona. Si lo crea el agente queda oculto, pendiente y sin fecha de revisión.
No inventes leyes ni fechas; llama legal_status_list antes para no duplicar el país.`,
  inputSchema: {
    type: "object",
    properties: {
      countryCode: { type: "string", description: "ISO 3166-1 alfa-2, ej. \"CO\"" },
      countryNameEs: { type: "string" },
      countryName: { type: "string", description: "Nombre en inglés" },
      flag: { type: "string", description: "Emoji de bandera" },
      region: { type: "string", enum: LEGAL_REGIONS },
      ...contentProps,
    },
    required: ["countryCode", "countryNameEs", "nationalStatus", "summary"],
  },
  async execute(i, ctx) {
    const r = await createCountry(i as any, { actor: actorOf(ctx.actor), by: ctx.by });
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "legal_status_update",
  module: M,
  risk: "write",
  description: `Edita la ficha legal de un país (estatus, resumen, listas, ley, fecha, fuentes, estados). Solo cambia lo que envíes; queda pendiente de revisión humana.
Llama legal_status_get antes. No marca el país como revisado ni cambia su visibilidad.`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, ...contentProps }, required: ["id"] },
  async execute(i, ctx) {
    const { id, ...rest } = i;
    const r = await updateCountry(String(id), rest as any, actorOf(ctx.actor), ctx.by);
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});

defineAction({
  name: "legal_status_set_active",
  module: M,
  risk: "destructive",
  description: "Muestra u oculta un país en /mapa-verde. Mostrarlo es publicar información legal: decisión de la persona.",
  confirmLabel: (i) => `${i.active ? "Mostrar" : "Ocultar"} país ${i.id} en el Mapa Verde`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, active: { type: "boolean" } }, required: ["id", "active"] },
  async execute(i) {
    const r = await setCountryActive(String(i.id), Boolean(i.active));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});
