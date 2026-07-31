import { useState } from "react";
import { Form, useLoaderData, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.brands";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { sendBrandVerifiedEmail } from "~/lib/email.server";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

const PAGE_SIZE = 25;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const filter: Record<string, unknown> = {};
  if (q) filter.name = { $regex: q, $options: "i" };
  if (status) filter.status = status;

  const [brands, total] = await Promise.all([
    BrandModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    BrandModel.countDocuments(filter),
  ]);

  return { brands, total, page, q, status };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const name = String(form.get("name") || "").trim();
    if (!name) return { error: "El nombre es obligatorio" };
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await BrandModel.findOne({ slug });
    if (existing) return { error: `El slug "${slug}" ya existe` };
    await BrandModel.create({
      name,
      slug,
      description: form.get("description") ? String(form.get("description")) : undefined,
      country: String(form.get("country") || "MX").toUpperCase(),
      city: form.get("city") ? String(form.get("city")) : undefined,
      website: form.get("website") ? String(form.get("website")) : undefined,
      instagram: form.get("instagram") ? String(form.get("instagram")) : undefined,
      email: form.get("email") ? String(form.get("email")) : undefined,
    });
    return { success: `Marca "${name}" creada` };
  }

  if (intent === "set-tier") {
    const id = String(form.get("id"));
    const tier = String(form.get("tier")) as "free" | "premium" | "enterprise";
    const willVerify = tier !== "free";
    const brand = await BrandModel.findById(id).select("name email isVerified").lean();
    const now = new Date();
    await BrandModel.findByIdAndUpdate(id, {
      tier,
      isVerified: willVerify,
      verifiedAt: willVerify ? now : undefined,
    });
    if (brand && willVerify && !brand.isVerified && brand.email) {
      sendBrandVerifiedEmail(brand.email, brand.name);
    }
    return { success: "Tier actualizado" };
  }

  if (intent === "set-status") {
    const id = String(form.get("id"));
    const status = String(form.get("status")) as "active" | "pending" | "suspended";
    await BrandModel.findByIdAndUpdate(id, { status });
    return { success: "Estado actualizado" };
  }

  if (intent === "delete") {
    await BrandModel.findByIdAndDelete(String(form.get("id")));
    return { success: "Marca eliminada" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminBrands() {
  const { brands, total, page, q, status } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Marcas</h2>
          <p className="text-sm text-fg-muted mt-0.5">{total} marca{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          + Nueva marca
        </button>
      </div>

      {actionData && "error" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>{actionData.error}</div>
      )}
      {actionData && "success" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{actionData.success}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          defaultValue={q}
          placeholder="Buscar marca…"
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
          <option value="pending">Pendiente</option>
          <option value="active">Activa</option>
          <option value="suspended">Suspendida</option>
        </select>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-6 mb-8">
          <h3 className="font-medium mb-4">Nueva marca</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)}>
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Nombre *</label>
                <input name="name" required className="input w-full" placeholder="Verde Vida" />
              </div>
              <div className="col-span-2">
                <label className="label">Descripción</label>
                <textarea name="description" className="input w-full" rows={3} />
              </div>
              <div>
                <label className="label">País (ISO)</label>
                <input name="country" className="input w-full" defaultValue="MX" maxLength={2} />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input name="city" className="input w-full" placeholder="Ciudad de México" />
              </div>
              <div>
                <label className="label">Website</label>
                <input name="website" className="input w-full" placeholder="https://" />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input name="instagram" className="input w-full" placeholder="@marca" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary text-sm">Crear</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost text-sm">
                Cancelar
              </button>
            </div>
          </Form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Marca</th>
              <th className="px-4 py-3 font-medium text-fg-muted">País</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Tier</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Estado</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Productos</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <>
                <tr
                  key={String(brand._id)}
                  className="border-b border-line hover:bg-bg-elev/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === String(brand._id) ? null : String(brand._id))}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{brand.name}</div>
                    <div className="text-xs text-fg-dim mono">{brand.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{brand.country}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs",
                        brand.tier === "enterprise" ? "pill lilac"
                        : brand.tier === "premium" ? "pill warm"
                        : "pill"
                      )}
                    >
                      {brand.isVerified && <Icon name="check" size={10} className="inline mr-0.5" />}
                      {brand.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs",
                        brand.status === "active" ? "pill accent"
                        : brand.status === "suspended" ? "pill warm"
                        : "pill"
                      )}
                    >
                      {brand.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{brand.productCount}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {brand.averageRating > 0 ? brand.averageRating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Icon name="chevronDown" size={14} className={cn("text-fg-dim transition-transform", expandedId === String(brand._id) ? "rotate-180" : "")} />
                  </td>
                </tr>
                {expandedId === String(brand._id) && (
                  <tr className="border-b border-line bg-bg-elev/30">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex gap-4 flex-wrap">
                        <Form method="post" className="flex items-center gap-2">
                          <input type="hidden" name="intent" value="set-tier" />
                          <input type="hidden" name="id" value={String(brand._id)} />
                          <select name="tier" defaultValue={brand.tier} className="input text-xs !py-1">
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            Cambiar tier
                          </button>
                        </Form>
                        <Form method="post" className="flex items-center gap-2">
                          <input type="hidden" name="intent" value="set-status" />
                          <input type="hidden" name="id" value={String(brand._id)} />
                          <select name="status" defaultValue={brand.status} className="input text-xs !py-1">
                            <option value="pending">Pendiente</option>
                            <option value="active">Activa</option>
                            <option value="suspended">Suspendida</option>
                          </select>
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            Cambiar estado
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={String(brand._id)} />
                          <button
                            type="submit"
                            className="btn btn-ghost text-xs !py-1 !px-2"
                            style={{ color: "var(--warm)" }}
                            onClick={(e) => { if (!confirm(`¿Eliminar marca "${brand.name}"?`)) e.preventDefault(); }}
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
            {brands.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fg-dim text-sm">
                  No se encontraron marcas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end text-sm">
          {page > 1 && (
            <button
              onClick={() => setSearchParams((p) => { p.set("page", String(page - 1)); return p; })}
              className="btn btn-ghost text-sm flex items-center gap-1"
            >
              <Icon name="chevronLeft" size={14} /> Anterior
            </button>
          )}
          <span className="py-2 text-fg-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <button
              onClick={() => setSearchParams((p) => { p.set("page", String(page + 1)); return p; })}
              className="btn btn-ghost text-sm flex items-center gap-1"
            >
              Siguiente <Icon name="chevronRight" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
