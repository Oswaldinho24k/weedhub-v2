import { useState } from "react";
import { Form, useLoaderData, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.products";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ProductModel } from "~/models/product.server";
import { BrandModel } from "~/models/brand.server";
import { ProductCategoryModel } from "~/models/product-category.server";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

const PAGE_SIZE = 25;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const brandId = url.searchParams.get("brandId") || "";
  const categoryKey = url.searchParams.get("categoryKey") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const filter: Record<string, unknown> = {};
  if (q) filter.name = { $regex: q, $options: "i" };
  if (status) filter.status = status;
  if (brandId) filter.brandId = brandId;
  if (categoryKey) filter.categoryKey = categoryKey;

  const [products, total, brands, categories] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("brandId", "name slug")
      .lean(),
    ProductModel.countDocuments(filter),
    BrandModel.find({ status: "active" }).select("name slug").sort({ name: 1 }).lean(),
    ProductCategoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
  ]);

  return { products, total, page, q, status, brandId, categoryKey, brands, categories };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const name = String(form.get("name") || "").trim();
    const brandIdVal = String(form.get("brandId") || "").trim();
    const categoryKey = String(form.get("categoryKey") || "").trim();
    if (!name || !brandIdVal || !categoryKey) return { error: "Nombre, marca y categoría son obligatorios" };

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await ProductModel.findOne({ slug });
    if (existing) return { error: `El slug "${slug}" ya existe` };

    const priceVal = form.get("price") ? Number(form.get("price")) : undefined;

    await ProductModel.create({
      name,
      slug,
      brandId: brandIdVal,
      categoryKey,
      description: form.get("description") ? String(form.get("description")) : undefined,
      price: priceVal,
      priceCurrency: String(form.get("priceCurrency") || "MXN") as "MXN" | "USD",
      status: "draft",
    });
    return { success: `Producto "${name}" creado como borrador` };
  }

  if (intent === "set-status") {
    const id = String(form.get("id"));
    const status = String(form.get("status")) as "active" | "draft" | "archived";
    await ProductModel.findByIdAndUpdate(id, { status });
    return { success: "Estado actualizado" };
  }

  if (intent === "toggle-promoted") {
    const id = String(form.get("id"));
    const product = await ProductModel.findById(id);
    if (product) {
      product.isPromoted = !product.isPromoted;
      product.promotedAt = product.isPromoted ? new Date() : undefined;
      await product.save();
    }
    return { success: "Promoción actualizada" };
  }

  if (intent === "delete") {
    await ProductModel.findByIdAndDelete(String(form.get("id")));
    return { success: "Producto eliminado" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminProducts() {
  const { products, total, page, q, status, brandId, categoryKey, brands, categories } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  type ProductWithBrand = (typeof products)[number] & {
    brandId?: { name?: string; slug?: string } | null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Productos</h2>
          <p className="text-sm text-fg-muted mt-0.5">{total} producto{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          + Nuevo producto
        </button>
      </div>

      {actionData && "error" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>{actionData.error}</div>
      )}
      {actionData && "success" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{actionData.success}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          defaultValue={q}
          placeholder="Buscar producto…"
          className="input text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value;
              setSearchParams((p) => { p.set("q", v); p.set("page", "1"); return p; });
            }
          }}
        />
        <select
          defaultValue={status}
          className="input text-sm"
          onChange={(e) => setSearchParams((p) => { p.set("status", e.target.value); p.set("page", "1"); return p; })}
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="active">Activo</option>
          <option value="archived">Archivado</option>
        </select>
        <select
          defaultValue={categoryKey}
          className="input text-sm"
          onChange={(e) => setSearchParams((p) => { p.set("categoryKey", e.target.value); p.set("page", "1"); return p; })}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>{c.labelEs}</option>
          ))}
        </select>
        <select
          defaultValue={brandId}
          className="input text-sm"
          onChange={(e) => setSearchParams((p) => { p.set("brandId", e.target.value); p.set("page", "1"); return p; })}
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={String(b._id)} value={String(b._id)}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-6 mb-8">
          <h3 className="font-medium mb-4">Nuevo producto</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)}>
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Nombre *</label>
                <input name="name" required className="input w-full" placeholder="OG Kush Premium Flower" />
              </div>
              <div>
                <label className="label">Marca *</label>
                <select name="brandId" required className="input w-full">
                  <option value="">Selecciona marca</option>
                  {brands.map((b) => (
                    <option key={String(b._id)} value={String(b._id)}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Categoría *</label>
                <select name="categoryKey" required className="input w-full">
                  <option value="">Selecciona categoría</option>
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>{c.labelEs}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Descripción</label>
                <textarea name="description" className="input w-full" rows={3} />
              </div>
              <div>
                <label className="label">Precio</label>
                <input name="price" type="number" step="0.01" className="input w-full" placeholder="250" />
              </div>
              <div>
                <label className="label">Moneda</label>
                <select name="priceCurrency" className="input w-full">
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary text-sm">Crear como borrador</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost text-sm">Cancelar</button>
            </div>
          </Form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Producto</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Marca</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Categoría</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Precio</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Estado</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(products as ProductWithBrand[]).map((product) => (
              <>
                <tr
                  key={String(product._id)}
                  className="border-b border-line hover:bg-bg-elev/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === String(product._id) ? null : String(product._id))}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      {product.name}
                      {product.isPromoted && (
                        <span className="pill warm text-xs">Promovido</span>
                      )}
                    </div>
                    <div className="text-xs text-fg-dim mono">{product.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {product.brandId ? (product.brandId as { name?: string }).name : "—"}
                  </td>
                  <td className="px-4 py-3 text-fg-muted mono text-xs">{product.categoryKey}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {product.price ? `$${product.price} ${product.priceCurrency}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs",
                        product.status === "active" ? "pill accent"
                        : product.status === "archived" ? "pill"
                        : "pill warm"
                      )}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {product.averageRating > 0 ? product.averageRating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Icon name="chevronDown" size={14} className={cn("text-fg-dim transition-transform", expandedId === String(product._id) ? "rotate-180" : "")} />
                  </td>
                </tr>
                {expandedId === String(product._id) && (
                  <tr className="border-b border-line bg-bg-elev/30">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex gap-4 flex-wrap">
                        <Form method="post" className="flex items-center gap-2">
                          <input type="hidden" name="intent" value="set-status" />
                          <input type="hidden" name="id" value={String(product._id)} />
                          <select name="status" defaultValue={product.status} className="input text-xs !py-1">
                            <option value="draft">Borrador</option>
                            <option value="active">Activo</option>
                            <option value="archived">Archivado</option>
                          </select>
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            Cambiar estado
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="toggle-promoted" />
                          <input type="hidden" name="id" value={String(product._id)} />
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            {product.isPromoted ? "Quitar promoción" : "Promover"}
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={String(product._id)} />
                          <button
                            type="submit"
                            className="btn btn-ghost text-xs !py-1 !px-2"
                            style={{ color: "var(--warm)" }}
                            onClick={(e) => { if (!confirm(`¿Eliminar "${product.name}"?`)) e.preventDefault(); }}
                          >
                            <Icon name="trash" size={12} /> Eliminar
                          </button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fg-dim text-sm">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end text-sm">
          {page > 1 && (
            <button onClick={() => setSearchParams((p) => { p.set("page", String(page - 1)); return p; })} className="btn btn-ghost text-sm flex items-center gap-1">
              <Icon name="chevronLeft" size={14} /> Anterior
            </button>
          )}
          <span className="py-2 text-fg-muted">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setSearchParams((p) => { p.set("page", String(page + 1)); return p; })} className="btn btn-ghost text-sm flex items-center gap-1">
              Siguiente <Icon name="chevronRight" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
