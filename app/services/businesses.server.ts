/**
 * Businesses service (brands, products, dispensaries, product categories): pure data logic.
 * Used by routes/admin.{brands,products,dispensaries,product-categories}.tsx and
 * ai/actions/businesses.server.ts.
 *
 * Seed businesses (`source: "seed"`) are hidden by the hideSeed plugin. Listings take an
 * optional `includeSeed` flag; mutations by id always include seed docs so the admin can
 * still fix or delete them.
 */
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { ProductModel } from "~/models/product.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { ProductCategoryModel } from "~/models/product-category.server";
import { sendBrandVerifiedEmail } from "~/lib/email.server";
import { generateText } from "~/ai/generate.server";

export const PAGE_SIZE = 25;
export const BUSINESS_STATUSES = ["active", "pending", "suspended"] as const;
export const BRAND_TIERS = ["free", "premium", "enterprise"] as const;
export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export const PRODUCT_CURRENCIES = ["MXN", "USD"] as const;
export const CATEGORY_SECTORS = ["consumo", "cultivo"] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];
export type BrandTier = (typeof BRAND_TIERS)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const SEED = { includeSeed: true };
const fail = (error: string) => ({ ok: false as const, error });
const isId = (s: unknown) => typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const opt = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s ? s : undefined;
};

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const byIdOrSlug = (idOrSlug: string) => (isId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug });

interface ListOpts {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  includeSeed?: boolean;
}

const paging = (o: ListOpts) => {
  const pageSize = Math.min(100, Math.max(1, Number(o.pageSize) || PAGE_SIZE));
  const page = Math.max(1, Number(o.page) || 1);
  return { page, pageSize, skip: (page - 1) * pageSize };
};

/* ───────────────────────────── Brands ───────────────────────────── */

export async function listBrands(o: ListOpts = {}) {
  await connectDB();
  const { page, pageSize, skip } = paging(o);
  const filter: Record<string, unknown> = {};
  if (o.q) filter.name = { $regex: escapeRegex(o.q), $options: "i" };
  if (o.status) filter.status = o.status;
  const seed = { includeSeed: Boolean(o.includeSeed) };
  const [brands, total] = await Promise.all([
    BrandModel.find(filter).setOptions(seed).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    BrandModel.countDocuments(filter).setOptions(seed),
  ]);
  return { brands, total, page, pageSize };
}

/** Lightweight brand list for selects (products/dispensaries forms). */
export async function listBrandOptions(o: { status?: string; includeSeed?: boolean } = {}) {
  await connectDB();
  return BrandModel.find(o.status ? { status: o.status } : {})
    .setOptions({ includeSeed: Boolean(o.includeSeed) })
    .select("name slug")
    .sort({ name: 1 })
    .lean();
}

export async function getBrand(idOrSlug: string) {
  await connectDB();
  return BrandModel.findOne(byIdOrSlug(idOrSlug)).setOptions(SEED).lean();
}

export interface BrandInput {
  name?: string;
  description?: string;
  country?: string;
  city?: string;
  website?: string;
  instagram?: string;
  email?: string;
}

/** Creates a brand. New brands start as "pending" (not public) and unverified. */
export async function createBrand(input: BrandInput) {
  await connectDB();
  const name = String(input.name ?? "").trim();
  if (!name) return fail("El nombre es obligatorio");
  const slug = slugify(name);
  if (!slug) return fail("El nombre no genera un slug válido");
  if (await BrandModel.exists({ slug }).setOptions(SEED)) return fail(`El slug "${slug}" ya existe`);
  const doc = await BrandModel.create({
    name,
    slug,
    description: opt(input.description),
    country: (opt(input.country) ?? "MX").toUpperCase(),
    city: opt(input.city),
    website: opt(input.website),
    instagram: opt(input.instagram),
    email: opt(input.email),
    status: "pending",
  });
  return { ok: true as const, id: String(doc._id), slug, name };
}

export async function setBrandStatus(id: string, status: string) {
  if (!BUSINESS_STATUSES.includes(status as BusinessStatus)) return fail("Estado inválido");
  await connectDB();
  const r = await BrandModel.updateOne({ _id: id }, { $set: { status } }).setOptions(SEED);
  return r.matchedCount ? { ok: true as const, status } : fail("Marca no encontrada");
}

/** Paid tiers imply verification; moving to a paid tier emails the brand if it wasn't verified yet. */
export async function setBrandTier(id: string, tier: string) {
  if (!BRAND_TIERS.includes(tier as BrandTier)) return fail("Tier inválido");
  await connectDB();
  const brand = await BrandModel.findById(id).setOptions(SEED);
  if (!brand) return fail("Marca no encontrada");
  const willVerify = tier !== "free";
  const wasVerified = brand.isVerified;
  brand.tier = tier as BrandTier;
  brand.isVerified = willVerify;
  brand.verifiedAt = willVerify ? (wasVerified && brand.verifiedAt ? brand.verifiedAt : new Date()) : undefined;
  await brand.save();
  if (willVerify && !wasVerified && brand.email) sendBrandVerifiedEmail(brand.email, brand.name);
  return { ok: true as const, tier, isVerified: willVerify };
}

export async function deleteBrand(id: string) {
  await connectDB();
  const r = await BrandModel.deleteOne({ _id: id });
  return r.deletedCount ? { ok: true as const } : fail("Marca no encontrada");
}

/* ───────────────────────────── Products ───────────────────────────── */

export async function listProducts(o: ListOpts & { brandId?: string; categoryKey?: string } = {}) {
  await connectDB();
  const { page, pageSize, skip } = paging(o);
  const filter: Record<string, unknown> = {};
  if (o.q) filter.name = { $regex: escapeRegex(o.q), $options: "i" };
  if (o.status) filter.status = o.status;
  if (o.brandId && isId(o.brandId)) filter.brandId = o.brandId;
  if (o.categoryKey) filter.categoryKey = o.categoryKey;
  const seed = { includeSeed: Boolean(o.includeSeed) };
  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .setOptions(seed)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate({ path: "brandId", select: "name slug", options: seed })
      .lean(),
    ProductModel.countDocuments(filter).setOptions(seed),
  ]);
  return { products, total, page, pageSize };
}

export async function getProduct(idOrSlug: string) {
  await connectDB();
  return ProductModel.findOne(byIdOrSlug(idOrSlug))
    .setOptions(SEED)
    .populate({ path: "brandId", select: "name slug", options: SEED })
    .lean();
}

export interface ProductInput {
  name?: string;
  brandId?: string;
  categoryKey?: string;
  description?: string;
  price?: number | string;
  priceCurrency?: string;
}

/** Creates a product as "draft" (not public). */
export async function createProduct(input: ProductInput) {
  await connectDB();
  const name = String(input.name ?? "").trim();
  const brandId = String(input.brandId ?? "").trim();
  const categoryKey = String(input.categoryKey ?? "").trim().toLowerCase();
  if (!name || !brandId || !categoryKey) return fail("Nombre, marca y categoría son obligatorios");
  if (!isId(brandId) || !(await BrandModel.exists({ _id: brandId }).setOptions(SEED))) return fail("Marca no encontrada");
  if (!(await ProductCategoryModel.exists({ key: categoryKey }))) return fail(`La categoría "${categoryKey}" no existe`);
  const slug = slugify(name);
  if (!slug) return fail("El nombre no genera un slug válido");
  if (await ProductModel.exists({ slug }).setOptions(SEED)) return fail(`El slug "${slug}" ya existe`);
  const price = input.price === undefined || input.price === "" ? undefined : Number(input.price);
  if (price !== undefined && (!Number.isFinite(price) || price < 0)) return fail("Precio inválido");
  const priceCurrency = PRODUCT_CURRENCIES.includes(input.priceCurrency as "MXN") ? input.priceCurrency : "MXN";
  const doc = await ProductModel.create({
    name,
    slug,
    brandId,
    categoryKey,
    description: opt(input.description),
    price,
    priceCurrency,
    status: "draft",
  });
  return { ok: true as const, id: String(doc._id), slug, name };
}

export async function setProductStatus(id: string, status: string) {
  if (!PRODUCT_STATUSES.includes(status as ProductStatus)) return fail("Estado inválido");
  await connectDB();
  const r = await ProductModel.updateOne({ _id: id }, { $set: { status } }).setOptions(SEED);
  return r.matchedCount ? { ok: true as const, status } : fail("Producto no encontrado");
}

/** Sets promotion explicitly, or toggles it when `promoted` is omitted. */
export async function setProductPromoted(id: string, promoted?: boolean) {
  await connectDB();
  const p = await ProductModel.findById(id).setOptions(SEED);
  if (!p) return fail("Producto no encontrado");
  p.isPromoted = typeof promoted === "boolean" ? promoted : !p.isPromoted;
  p.promotedAt = p.isPromoted ? new Date() : undefined;
  await p.save();
  return { ok: true as const, isPromoted: p.isPromoted };
}

export async function deleteProduct(id: string) {
  await connectDB();
  const r = await ProductModel.deleteOne({ _id: id });
  return r.deletedCount ? { ok: true as const } : fail("Producto no encontrado");
}

/* ───────────────────────────── Dispensaries ───────────────────────────── */

export async function listDispensaries(o: ListOpts = {}) {
  await connectDB();
  const { page, pageSize, skip } = paging(o);
  const filter: Record<string, unknown> = {};
  if (o.q) {
    const rx = { $regex: escapeRegex(o.q), $options: "i" };
    filter.$or = [{ name: rx }, { city: rx }];
  }
  if (o.status) filter.status = o.status;
  const seed = { includeSeed: Boolean(o.includeSeed) };
  const [dispensaries, total] = await Promise.all([
    DispensaryModel.find(filter).setOptions(seed).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    DispensaryModel.countDocuments(filter).setOptions(seed),
  ]);
  return { dispensaries, total, page, pageSize };
}

export async function getDispensary(idOrSlug: string) {
  await connectDB();
  return DispensaryModel.findOne(byIdOrSlug(idOrSlug)).setOptions(SEED).lean();
}

export interface DispensaryInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  brandId?: string;
  description?: string;
}

/** Creates a dispensary as "pending" (not public) and unverified. */
export async function createDispensary(input: DispensaryInput) {
  await connectDB();
  const name = String(input.name ?? "").trim();
  const address = String(input.address ?? "").trim();
  const city = String(input.city ?? "").trim();
  if (!name || !address || !city) return fail("Nombre, dirección y ciudad son obligatorios");
  const slug = slugify(name);
  if (!slug) return fail("El nombre no genera un slug válido");
  if (await DispensaryModel.exists({ slug }).setOptions(SEED)) return fail(`El slug "${slug}" ya existe`);
  const brandId = opt(input.brandId);
  if (brandId && (!isId(brandId) || !(await BrandModel.exists({ _id: brandId }).setOptions(SEED)))) return fail("Marca no encontrada");
  const doc = await DispensaryModel.create({
    name,
    slug,
    address,
    city,
    state: opt(input.state),
    country: (opt(input.country) ?? "MX").toUpperCase(),
    phone: opt(input.phone),
    website: opt(input.website),
    instagram: opt(input.instagram),
    description: opt(input.description),
    brandId,
    status: "pending",
  });
  return { ok: true as const, id: String(doc._id), slug, name };
}

export async function setDispensaryStatus(id: string, status: string) {
  if (!BUSINESS_STATUSES.includes(status as BusinessStatus)) return fail("Estado inválido");
  await connectDB();
  const r = await DispensaryModel.updateOne({ _id: id }, { $set: { status } }).setOptions(SEED);
  return r.matchedCount ? { ok: true as const, status } : fail("Dispensario no encontrado");
}

/** Sets verification explicitly, or toggles it when `verified` is omitted. Verifying upgrades to premium. */
export async function setDispensaryVerified(id: string, verified?: boolean) {
  await connectDB();
  const d = await DispensaryModel.findById(id).setOptions(SEED);
  if (!d) return fail("Dispensario no encontrado");
  d.isVerified = typeof verified === "boolean" ? verified : !d.isVerified;
  if (d.isVerified) d.tier = "premium";
  await d.save();
  return { ok: true as const, isVerified: d.isVerified, tier: d.tier };
}

export async function deleteDispensary(id: string) {
  await connectDB();
  const r = await DispensaryModel.deleteOne({ _id: id });
  return r.deletedCount ? { ok: true as const } : fail("Dispensario no encontrado");
}

/* ───────────────────────────── Product categories ───────────────────────────── */

export async function listCategories(o: { active?: boolean } = {}) {
  await connectDB();
  const filter = typeof o.active === "boolean" ? { isActive: o.active } : {};
  return ProductCategoryModel.find(filter).sort({ sortOrder: 1, labelEs: 1 }).lean();
}

export interface CategoryInput {
  key?: string;
  labelEs?: string;
  labelEn?: string;
  labelPt?: string;
  icon?: string;
  color?: string;
  sector?: string;
  hasCannabinoidsProfile?: boolean;
  sortOrder?: number | string;
}

export async function createCategory(input: CategoryInput, opts: { active?: boolean } = {}) {
  await connectDB();
  const key = String(input.key ?? "").toLowerCase().trim();
  if (!key) return fail("La clave es obligatoria");
  if (/\s/.test(key)) return fail("La clave no puede tener espacios");
  if (await ProductCategoryModel.exists({ key })) return fail(`La clave "${key}" ya existe`);
  const labelEs = String(input.labelEs ?? "").trim();
  if (!labelEs) return fail("El nombre en español es obligatorio");
  const doc = await ProductCategoryModel.create({
    key,
    labelEs,
    // Model requires en/pt labels; fall back to the Spanish one.
    labelEn: opt(input.labelEn) ?? labelEs,
    labelPt: opt(input.labelPt) ?? labelEs,
    icon: opt(input.icon) ?? "bolt",
    color: opt(input.color),
    sector: CATEGORY_SECTORS.includes(input.sector as "consumo") ? input.sector : "consumo",
    hasCannabinoidsProfile: Boolean(input.hasCannabinoidsProfile),
    sortOrder: Number(input.sortOrder) || 0,
    isActive: opts.active ?? true,
  });
  return { ok: true as const, id: String(doc._id), key };
}

/** Sets active explicitly, or toggles it when `active` is omitted. */
export async function setCategoryActive(id: string, active?: boolean) {
  await connectDB();
  const c = await ProductCategoryModel.findById(id);
  if (!c) return fail("Categoría no encontrada");
  c.isActive = typeof active === "boolean" ? active : !c.isActive;
  await c.save();
  return { ok: true as const, isActive: c.isActive };
}

export async function deleteCategory(id: string) {
  await connectDB();
  const c = await ProductCategoryModel.findById(id).lean();
  if (!c) return fail("Categoría no encontrada");
  const inUse = await ProductModel.countDocuments({ categoryKey: c.key }).setOptions(SEED);
  if (inUse) return fail(`La categoría "${c.key}" tiene ${inUse} producto(s); desactívala en lugar de eliminarla`);
  await ProductCategoryModel.deleteOne({ _id: id });
  return { ok: true as const };
}

/* ───────────────────────────── AI helper ───────────────────────────── */

/**
 * Drafts a short, neutral Spanish description for a brand or dispensary from facts the person
 * gives, and saves it as the record's `description`. Never touches status, tier or verification.
 */
export async function draftBusinessDescription(input: { kind: "brand" | "dispensary"; id: string; facts: string }) {
  const facts = String(input.facts ?? "").trim();
  if (!facts) return fail("Faltan los datos para redactar la descripción");
  const isBrand = input.kind === "brand";
  const rec = isBrand ? await getBrand(input.id) : await getDispensary(input.id);
  if (!rec) return fail(isBrand ? "Marca no encontrada" : "Dispensario no encontrado");
  const r: any = rec;
  const place = [r.address, r.city, r.state, r.country].filter(Boolean).join(", ");

  const g = await generateText({
    system: `Redactas descripciones de negocios para el directorio de WeedHub.
Escribe 2-3 oraciones neutrales y descriptivas en español sobre ${isBrand ? "la marca" : "el dispensario"}, usando SOLO los datos que te dan.
No digas que el negocio está verificado, certificado, avalado o recomendado por WeedHub. No uses superlativos ni lenguaje publicitario, no inventes productos, precios, premios ni licencias, y no hagas afirmaciones de salud.
Devuelve solo el texto de la descripción, sin comillas ni encabezados.`,
    prompt: `Nombre: ${r.name}${place ? `\nUbicación: ${place}` : ""}\nDatos de la persona:\n${facts}`,
    maxTokens: 2000,
    effort: "low",
  });
  if (!g.ok) return g;
  const description = g.text.replace(/^["“]|["”]$/g, "").trim().slice(0, 1200);
  const res = isBrand
    ? await BrandModel.updateOne({ _id: r._id }, { $set: { description } }).setOptions(SEED)
    : await DispensaryModel.updateOne({ _id: r._id }, { $set: { description } }).setOptions(SEED);
  return res.matchedCount ? { ok: true as const, id: String(r._id), description } : fail("No se pudo guardar la descripción");
}
