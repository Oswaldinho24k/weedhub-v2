import { useState } from "react";
import { Form, useLoaderData, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.products";
import { requireAdmin } from "~/lib/auth.server";
import { listProducts, listBrandOptions, listCategories, createProduct, setProductStatus, setProductPromoted, deleteProduct } from "~/services/businesses.server";

const PAGE_SIZE = 25; // keep in sync with services/businesses.server.ts (client-safe copy)
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const brandId = url.searchParams.get("brandId") || "";
  const categoryKey = url.searchParams.get("categoryKey") || "";
  const includeSeed = url.searchParams.get("includeSeed") === "1";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const [{ products, total }, brands, categories] = await Promise.all([
    listProducts({ q, status, brandId, categoryKey, page, includeSeed }),
    listBrandOptions({ status: "active", includeSeed }),
    listCategories({ active: true }),
  ]);

  return { products, total, page, q, status, brandId, categoryKey, includeSeed, brands, categories };
}

// HTTP adapter only: all logic lives in services/businesses.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id") || "");
  const field = (k: string) => (form.has(k) ? String(form.get(k)) : undefined);

  if (intent === "create") {
    const r = await createProduct({ name: field("name"), brandId: field("brandId"), categoryKey: field("categoryKey"), description: field("description"), price: field("price"), priceCurrency: field("priceCurrency") });
    return r.ok ? { success: `Producto "${r.name}" creado como borrador` } : { error: r.error };
  }
  if (intent === "set-status") {
    const r = await setProductStatus(id, String(form.get("status")));
    return r.ok ? { success: "Estado actualizado" } : { error: r.error };
  }
  if (intent === "toggle-promoted") {
    const r = await setProductPromoted(id);
    return r.ok ? { success: "Promoción actualizada" } : { error: r.error };
  }
  if (intent === "delete") {
    const r = await deleteProduct(id);
    return r.ok ? { success: "Producto eliminado" } : { error: r.error };
  }
  return { error: "Intent desconocido" };
}

export default function AdminProducts() {
  const { products, total, page, q, status, brandId, categoryKey, includeSeed, brands, categories } =
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
        <Button onClick={() => setShowCreate(true)} variant="primary" className="text-sm">
          + Nuevo producto
        </Button>
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
        <label className="flex items-center gap-1.5 text-sm text-fg-muted">
          <input
            type="checkbox"
            defaultChecked={includeSeed}
            onChange={(e) => setSearchParams((p) => { if (e.target.checked) p.set("includeSeed", "1"); else p.delete("includeSeed"); p.set("page", "1"); return p; })}
          />
          Incluir seed
        </label>
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
              <Button type="submit" variant="primary" className="text-sm">Crear como borrador</Button>
              <Button type="button" onClick={() => setShowCreate(false)} variant="ghost" className="text-sm">Cancelar</Button>
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
                    <div className="text-xs text-fg-dim mono">{product.slug}{(product as { source?: string }).source === "seed" && <span className="pill text-xs ml-1">seed</span>}</div>
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
                          <Button type="submit" variant="ghost" size="sm">
                            Cambiar estado
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="toggle-promoted" />
                          <input type="hidden" name="id" value={String(product._id)} />
                          <Button type="submit" variant="ghost" size="sm">
                            {product.isPromoted ? "Quitar promoción" : "Promover"}
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={String(product._id)} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            style={{ color: "var(--warm)" }}
                            onClick={(e) => { if (!confirm(`¿Eliminar "${product.name}"?`)) e.preventDefault(); }}
                          >
                            <Icon name="trash" size={12} /> Eliminar
                          </Button>
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
            <Button onClick={() => setSearchParams((p) => { p.set("page", String(page - 1)); return p; })} variant="ghost" className="text-sm flex items-center gap-1">
              <Icon name="chevronLeft" size={14} /> Anterior
            </Button>
          )}
          <span className="py-2 text-fg-muted">{page} / {totalPages}</span>
          {page < totalPages && (
            <Button onClick={() => setSearchParams((p) => { p.set("page", String(page + 1)); return p; })} variant="ghost" className="text-sm flex items-center gap-1">
              Siguiente <Icon name="chevronRight" size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
