import { defineAction, type ActionResult } from "~/ai/registry.server";
import {
  listBrands,
  getBrand,
  createBrand,
  setBrandStatus,
  setBrandTier,
  deleteBrand,
  listProducts,
  getProduct,
  createProduct,
  setProductStatus,
  setProductPromoted,
  deleteProduct,
  listDispensaries,
  getDispensary,
  createDispensary,
  setDispensaryStatus,
  setDispensaryVerified,
  deleteDispensary,
  listCategories,
  createCategory,
  setCategoryActive,
  deleteCategory,
  draftBusinessDescription,
  BUSINESS_STATUSES,
  BRAND_TIERS,
  PRODUCT_STATUSES,
  PRODUCT_CURRENCIES,
  CATEGORY_SECTORS,
} from "~/services/businesses.server";

const M = "negocios";

type R = { ok: true } | { ok: false; error: string };
const out = (r: R & Record<string, unknown>): ActionResult => {
  if (!r.ok) return { success: false, error: (r as { error: string }).error };
  const { ok: _ok, ...data } = r;
  return Object.keys(data).length ? { success: true, data } : { success: true };
};
const str = (v: unknown) => (v == null ? undefined : String(v));
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const sid = (d: any) => (d?._id ? String(d._id) : undefined);
const listProps = {
  q: { type: "string", description: "Texto a buscar en el nombre" },
  page: { type: "number" },
  pageSize: { type: "number", description: "Máx 100; por defecto 25" },
  includeSeed: { type: "boolean", description: "Incluir negocios ficticios de seed (ocultos por defecto)" },
};

/* ───────────── Marcas ───────────── */

defineAction({
  name: "brand_list",
  module: M,
  risk: "read",
  description: `Lista marcas (id, slug, nombre, país, estado, tier, verificada, si es seed). Filtra por texto o estado; paginada.
Los negocios ficticios de seed están ocultos salvo includeSeed: true. Usa brand_get para el detalle.`,
  inputSchema: { type: "object", properties: { ...listProps, status: { type: "string", enum: [...BUSINESS_STATUSES] } } },
  async execute(i) {
    const r = await listBrands({ q: str(i.q), status: str(i.status), page: Number(i.page) || 1, pageSize: Number(i.pageSize) || undefined, includeSeed: Boolean(i.includeSeed) });
    return {
      success: true,
      data: {
        total: r.total,
        page: r.page,
        brands: r.brands.map((b: any) => ({ id: sid(b), slug: b.slug, name: b.name, country: b.country, city: b.city, status: b.status, tier: b.tier, isVerified: b.isVerified, productCount: b.productCount, isSeed: b.source === "seed" })),
      },
    };
  },
});

defineAction({
  name: "brand_get",
  module: M,
  risk: "read",
  description: "Trae una marca completa por id o slug (incluye las de seed). Úsala antes de cambiar estado, tier o descripción.",
  inputSchema: { type: "object", properties: { idOrSlug: { type: "string" } }, required: ["idOrSlug"] },
  async execute(i) {
    const b: any = await getBrand(String(i.idOrSlug));
    if (!b) return { success: false, error: "Marca no encontrada" };
    const { stripeCustomerId: _c, stripeSubscriptionId: _s, ...rest } = b;
    return { success: true, data: { ...rest, _id: sid(b), ownerId: b.ownerId ? String(b.ownerId) : undefined } };
  },
});

defineAction({
  name: "brand_create",
  module: M,
  risk: "write",
  description: `Crea una marca con los datos que dio la persona. Queda "pending" (no pública) y sin verificar.
Para publicarla usa brand_set_status. Para redactar la descripción con IA usa brand_draft_description después.`,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      country: { type: "string", description: "ISO de 2 letras; por defecto MX" },
      city: { type: "string" },
      website: { type: "string" },
      instagram: { type: "string" },
      email: { type: "string" },
    },
    required: ["name"],
  },
  async execute(i) {
    return out(await createBrand(i as any));
  },
});

defineAction({
  name: "brand_set_status",
  module: M,
  risk: "destructive",
  description: `Cambia el estado de una marca: active (pública), pending (oculta) o suspended. Activar publica; suspender la oculta.
Llama brand_list o brand_get antes para obtener el id. No cambia tier ni verificación.`,
  confirmLabel: (i) => `Cambiar estado de la marca ${i.id} a "${i.status}"`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: [...BUSINESS_STATUSES] } }, required: ["id", "status"] },
  async execute(i) {
    return out(await setBrandStatus(String(i.id), String(i.status)));
  },
});

defineAction({
  name: "brand_set_tier",
  module: M,
  risk: "destructive",
  description: `Cambia el tier de una marca (free, premium, enterprise). Premium/enterprise la marcan como verificada y le envían un email; free quita la verificación.
Normalmente lo maneja Stripe; úsala solo si la persona lo pide explícitamente. No cambia el estado.`,
  confirmLabel: (i) => `Cambiar tier de la marca ${i.id} a "${i.tier}"${i.tier !== "free" ? " (la marca como verificada)" : ""}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, tier: { type: "string", enum: [...BRAND_TIERS] } }, required: ["id", "tier"] },
  async execute(i) {
    return out(await setBrandTier(String(i.id), String(i.tier)));
  },
});

defineAction({
  name: "brand_delete",
  module: M,
  risk: "destructive",
  description: "Elimina una marca para siempre (no borra sus productos). Prefiere suspenderla con brand_set_status.",
  confirmLabel: (i) => `Eliminar marca ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    return out(await deleteBrand(String(i.id)));
  },
});

defineAction({
  name: "brand_draft_description",
  module: M,
  risk: "write",
  description: `Redacta con IA una descripción breve y neutral en español para una marca o dispensario a partir de los datos que dio la persona, y la guarda en el registro.
Llama brand_get o dispensary_get antes para el id. No verifica, no publica ni cambia estado o tier.`,
  inputSchema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["brand", "dispensary"] },
      id: { type: "string" },
      facts: { type: "string", description: "Datos que dio la persona (qué hace, dónde, desde cuándo, etc.)" },
    },
    required: ["kind", "id", "facts"],
  },
  async execute(i) {
    const kind = i.kind === "dispensary" ? "dispensary" : "brand";
    return out(await draftBusinessDescription({ kind, id: String(i.id), facts: String(i.facts ?? "") }));
  },
});

/* ───────────── Productos ───────────── */

defineAction({
  name: "product_list",
  module: M,
  risk: "read",
  description: `Lista productos (id, slug, nombre, marca, categoría, estado, promovido). Filtra por texto, estado, marca o categoría; paginada.
Usa brand_list para el brandId y product_category_list para la categoryKey. Incluye seed solo con includeSeed: true.`,
  inputSchema: {
    type: "object",
    properties: { ...listProps, status: { type: "string", enum: [...PRODUCT_STATUSES] }, brandId: { type: "string" }, categoryKey: { type: "string" } },
  },
  async execute(i) {
    const r = await listProducts({ q: str(i.q), status: str(i.status), brandId: str(i.brandId), categoryKey: str(i.categoryKey), page: Number(i.page) || 1, pageSize: Number(i.pageSize) || undefined, includeSeed: Boolean(i.includeSeed) });
    return {
      success: true,
      data: {
        total: r.total,
        page: r.page,
        products: r.products.map((p: any) => ({ id: sid(p), slug: p.slug, name: p.name, brand: p.brandId?.name ?? null, brandId: sid(p.brandId) ?? (p.brandId ? String(p.brandId) : undefined), categoryKey: p.categoryKey, status: p.status, isPromoted: p.isPromoted, price: p.price, priceCurrency: p.priceCurrency, isSeed: p.source === "seed" })),
      },
    };
  },
});

defineAction({
  name: "product_get",
  module: M,
  risk: "read",
  description: "Trae un producto completo por id o slug, con su marca (incluye seed). Úsala antes de cambiar estado o promoción.",
  inputSchema: { type: "object", properties: { idOrSlug: { type: "string" } }, required: ["idOrSlug"] },
  async execute(i) {
    const p: any = await getProduct(String(i.idOrSlug));
    return p ? { success: true, data: { ...p, _id: sid(p), brandId: p.brandId ? { id: sid(p.brandId), name: p.brandId.name, slug: p.brandId.slug } : null } } : { success: false, error: "Producto no encontrado" };
  },
});

defineAction({
  name: "product_create",
  module: M,
  risk: "write",
  description: `Crea un producto como borrador (no público). Requiere brandId (de brand_list) y categoryKey (de product_category_list).
Para publicarlo usa product_set_status. No lo promueve.`,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      brandId: { type: "string" },
      categoryKey: { type: "string" },
      description: { type: "string" },
      price: { type: "number" },
      priceCurrency: { type: "string", enum: [...PRODUCT_CURRENCIES] },
    },
    required: ["name", "brandId", "categoryKey"],
  },
  async execute(i) {
    return out(await createProduct(i as any));
  },
});

defineAction({
  name: "product_set_status",
  module: M,
  risk: "destructive",
  description: `Cambia el estado de un producto: active (público), draft (borrador) o archived. Activar lo publica.
Llama product_list o product_get antes para el id. No cambia la promoción.`,
  confirmLabel: (i) => `Cambiar estado del producto ${i.id} a "${i.status}"`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: [...PRODUCT_STATUSES] } }, required: ["id", "status"] },
  async execute(i) {
    return out(await setProductStatus(String(i.id), String(i.status)));
  },
});

defineAction({
  name: "product_set_promoted",
  module: M,
  risk: "destructive",
  description: `Promueve o quita la promoción de un producto (destacado en el sitio). Úsala solo si la persona lo pide.
Llama product_get antes para ver el estado actual. No cambia el estado del producto.`,
  confirmLabel: (i) => `${i.promoted ? "Promover" : "Quitar promoción del"} producto ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, promoted: { type: "boolean" } }, required: ["id", "promoted"] },
  async execute(i) {
    return out(await setProductPromoted(String(i.id), bool(i.promoted)));
  },
});

defineAction({
  name: "product_delete",
  module: M,
  risk: "destructive",
  description: "Elimina un producto para siempre. Prefiere archivarlo con product_set_status.",
  confirmLabel: (i) => `Eliminar producto ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    return out(await deleteProduct(String(i.id)));
  },
});

/* ───────────── Dispensarios ───────────── */

defineAction({
  name: "dispensary_list",
  module: M,
  risk: "read",
  description: `Lista dispensarios (id, slug, nombre, ciudad, estado, verificado, si es seed). Busca por nombre o ciudad y filtra por estado; paginada.
Los de seed están ocultos salvo includeSeed: true. Usa dispensary_get para el detalle.`,
  inputSchema: { type: "object", properties: { ...listProps, status: { type: "string", enum: [...BUSINESS_STATUSES] } } },
  async execute(i) {
    const r = await listDispensaries({ q: str(i.q), status: str(i.status), page: Number(i.page) || 1, pageSize: Number(i.pageSize) || undefined, includeSeed: Boolean(i.includeSeed) });
    return {
      success: true,
      data: {
        total: r.total,
        page: r.page,
        dispensaries: r.dispensaries.map((d: any) => ({ id: sid(d), slug: d.slug, name: d.name, city: d.city, state: d.state, country: d.country, status: d.status, tier: d.tier, isVerified: d.isVerified, isSeed: d.source === "seed" })),
      },
    };
  },
});

defineAction({
  name: "dispensary_get",
  module: M,
  risk: "read",
  description: "Trae un dispensario completo por id o slug (incluye seed). Úsala antes de cambiar estado, verificación o descripción.",
  inputSchema: { type: "object", properties: { idOrSlug: { type: "string" } }, required: ["idOrSlug"] },
  async execute(i) {
    const d: any = await getDispensary(String(i.idOrSlug));
    if (!d) return { success: false, error: "Dispensario no encontrado" };
    const { stripeCustomerId: _c, stripeSubscriptionId: _s, ...rest } = d;
    return { success: true, data: { ...rest, _id: sid(d), brandId: d.brandId ? String(d.brandId) : undefined, ownerId: d.ownerId ? String(d.ownerId) : undefined } };
  },
});

defineAction({
  name: "dispensary_create",
  module: M,
  risk: "write",
  description: `Crea un dispensario con los datos que dio la persona (nombre, dirección y ciudad obligatorios). Queda "pending" (no público) y sin verificar.
Para publicarlo usa dispensary_set_status; para la descripción con IA usa brand_draft_description con kind "dispensary".`,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      address: { type: "string" },
      city: { type: "string" },
      state: { type: "string" },
      country: { type: "string", description: "ISO de 2 letras; por defecto MX" },
      phone: { type: "string" },
      website: { type: "string" },
      instagram: { type: "string" },
      brandId: { type: "string", description: "Opcional; marca asociada (de brand_list)" },
      description: { type: "string" },
    },
    required: ["name", "address", "city"],
  },
  async execute(i) {
    return out(await createDispensary(i as any));
  },
});

defineAction({
  name: "dispensary_set_status",
  module: M,
  risk: "destructive",
  description: `Cambia el estado de un dispensario: active (público), pending (oculto) o suspended. Activar lo publica.
Llama dispensary_list o dispensary_get antes para el id. No cambia la verificación.`,
  confirmLabel: (i) => `Cambiar estado del dispensario ${i.id} a "${i.status}"`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: [...BUSINESS_STATUSES] } }, required: ["id", "status"] },
  async execute(i) {
    return out(await setDispensaryStatus(String(i.id), String(i.status)));
  },
});

defineAction({
  name: "dispensary_set_verified",
  module: M,
  risk: "destructive",
  description: `Marca o desmarca un dispensario como verificado; verificar también lo sube a tier premium.
Úsala solo si la persona confirmó la verificación por fuera. No cambia el estado (activo/pendiente).`,
  confirmLabel: (i) => `${i.verified ? "Verificar (y pasar a premium)" : "Quitar verificación del"} dispensario ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, verified: { type: "boolean" } }, required: ["id", "verified"] },
  async execute(i) {
    return out(await setDispensaryVerified(String(i.id), bool(i.verified)));
  },
});

defineAction({
  name: "dispensary_delete",
  module: M,
  risk: "destructive",
  description: "Elimina un dispensario para siempre. Prefiere suspenderlo con dispensary_set_status.",
  confirmLabel: (i) => `Eliminar dispensario ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    return out(await deleteDispensary(String(i.id)));
  },
});

/* ───────────── Categorías de producto ───────────── */

defineAction({
  name: "product_category_list",
  module: M,
  risk: "read",
  description: "Lista categorías de producto (id, key, nombres, sector, activa). Úsala para obtener la categoryKey antes de product_create o product_list.",
  inputSchema: { type: "object", properties: { active: { type: "boolean" } } },
  async execute(i) {
    const rows = await listCategories({ active: bool(i.active) });
    return { success: true, data: rows.map((c: any) => ({ id: sid(c), key: c.key, labelEs: c.labelEs, sector: c.sector, hasCannabinoidsProfile: c.hasCannabinoidsProfile, sortOrder: c.sortOrder, isActive: c.isActive })) };
  },
});

defineAction({
  name: "product_category_create",
  module: M,
  risk: "write",
  description: `Crea una categoría de producto inactiva (no visible en el sitio). La key es única y sin espacios.
Para activarla usa product_category_set_active. Revisa product_category_list antes para no duplicar.`,
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string" },
      labelEs: { type: "string" },
      labelEn: { type: "string" },
      labelPt: { type: "string" },
      icon: { type: "string" },
      color: { type: "string" },
      sector: { type: "string", enum: [...CATEGORY_SECTORS] },
      hasCannabinoidsProfile: { type: "boolean" },
      sortOrder: { type: "number" },
    },
    required: ["key", "labelEs"],
  },
  async execute(i, ctx) {
    return out(await createCategory(i as any, { active: ctx.actor === "admin" }));
  },
});

defineAction({
  name: "product_category_set_active",
  module: M,
  risk: "destructive",
  description: "Activa (visible en el sitio) o desactiva una categoría de producto. Llama product_category_list antes para el id.",
  confirmLabel: (i) => `${i.active ? "Activar" : "Desactivar"} categoría ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" }, active: { type: "boolean" } }, required: ["id", "active"] },
  async execute(i) {
    return out(await setCategoryActive(String(i.id), bool(i.active)));
  },
});

defineAction({
  name: "product_category_delete",
  module: M,
  risk: "destructive",
  description: "Elimina una categoría para siempre; falla si tiene productos. Prefiere desactivarla con product_category_set_active.",
  confirmLabel: (i) => `Eliminar categoría ${i.id}`,
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  async execute(i) {
    return out(await deleteCategory(String(i.id)));
  },
});
