import { defineAction } from "~/ai/registry.server";
import { listTerms, getTerm, createTerm, updateTerm, setTermActive, deleteTerm, draftTerm, GLOSSARY_CATEGORIES } from "~/services/glossary.server";

const M = "glosario";

defineAction({
  name: "glossary_list",
  module: M,
  risk: "read",
  description: `Lista términos del glosario (id, slug, término, categoría, si está publicado). Filtra por texto, categoría o publicados.
Usa glossary_get para ver la definición completa.`,
  inputSchema: {
    type: "object",
    properties: { q: { type: "string" }, category: { type: "string", enum: GLOSSARY_CATEGORIES }, active: { type: "boolean" } },
  },
  async execute(i) {
    const rows = await listTerms({ q: i.q as string, category: i.category as string, active: i.active as boolean | undefined });
    return { success: true, data: rows.map((t: any) => ({ id: String(t._id), slug: t.slug, term: t.term, category: t.category, isActive: t.isActive, revision: t.revision?.status ?? "pendiente" })) };
  },
});

defineAction({
  name: "glossary_get",
  module: M,
  risk: "read",
  description: "Trae un término completo por id o slug (definición, ejemplos, relacionados, estado de revisión).",
  inputSchema: { type: "object", properties: { idOrSlug: { type: "string" } }, required: ["idOrSlug"] },
  async execute(i) {
    const t = await getTerm(String(i.idOrSlug));
    return t ? { success: true, data: { ...t, _id: String((t as any)._id) } } : { success: false, error: "No encontrado" };
  },
});

defineAction({
  name: "glossary_create",
  module: M,
  risk: "write",
  description: `Crea un término con la definición que te dio la persona. Si quieres que la IA redacte la definición, usa glossary_draft.
Queda oculto y pendiente de revisión.`,
  inputSchema: {
    type: "object",
    properties: {
      term: { type: "string" },
      slug: { type: "string", description: "Opcional; se genera del término" },
      category: { type: "string", enum: GLOSSARY_CATEGORIES },
      definition: { type: "string" },
      examples: { type: "array", items: { type: "string" } },
      relatedSlugs: { type: "array", items: { type: "string" } },
    },
    required: ["term", "definition"],
  },
  async execute(i) {
    const r = await createTerm(i as any, { active: false, pending: true });
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "glossary_draft",
  module: M,
  risk: "write",
  description: `Redacta con IA un término nuevo del glosario (definición + ejemplos) y lo guarda oculto y pendiente para que la persona lo revise en /admin/revision.
Úsala cuando pidan "agrega/crea el término X". No publica nada.`,
  inputSchema: {
    type: "object",
    properties: { term: { type: "string" }, category: { type: "string", enum: GLOSSARY_CATEGORIES }, notes: { type: "string", description: "Indicaciones de la persona" } },
    required: ["term"],
  },
  async execute(i) {
    const r = await draftTerm({ term: String(i.term), category: i.category as string, notes: i.notes as string });
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "glossary_update",
  module: M,
  risk: "write",
  description: "Edita un término existente (definición, ejemplos, categoría, relacionados). Vuelve a pendiente de revisión. Pide glossary_get antes para no perder datos.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      term: { type: "string" },
      category: { type: "string", enum: GLOSSARY_CATEGORIES },
      definition: { type: "string" },
      examples: { type: "array", items: { type: "string" } },
      relatedSlugs: { type: "array", items: { type: "string" } },
    },
    required: ["id"],
  },
  async execute(i, ctx) {
    const { id, ...rest } = i;
    const r = await updateTerm(String(id), rest as any, ctx.actor === "admin" ? "admin" : "agente");
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});

defineAction({
  name: "glossary_set_published",
  module: M,
  risk: "destructive",
  description: "Publica u oculta un término en el sitio. Publicar es una decisión de la persona.",
  confirmLabel: (i) => `${i.active ? "Publicar" : "Ocultar"} término ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, active: { type: "boolean" } }, required: ["id", "active"] },
  async execute(i) {
    const r = await setTermActive(String(i.id), Boolean(i.active));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "glossary_delete",
  module: M,
  risk: "destructive",
  description: "Elimina un término para siempre. Prefiere ocultarlo con glossary_set_published.",
  confirmLabel: (i) => `Eliminar término ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    const r = await deleteTerm(String(i.id));
    return r.ok ? { success: true } : { success: false, error: r.error };
  },
});
