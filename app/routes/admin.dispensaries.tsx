import { useState } from "react";
import { Form, useLoaderData, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.dispensaries";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { BrandModel } from "~/models/brand.server";
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
  if (q) filter.$or = [
    { name: { $regex: q, $options: "i" } },
    { city: { $regex: q, $options: "i" } },
  ];
  if (status) filter.status = status;

  const [dispensaries, total, brands] = await Promise.all([
    DispensaryModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    DispensaryModel.countDocuments(filter),
    BrandModel.find({ status: "active" }).select("name slug").sort({ name: 1 }).lean(),
  ]);

  return { dispensaries, total, page, q, status, brands };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const name = String(form.get("name") || "").trim();
    const address = String(form.get("address") || "").trim();
    const city = String(form.get("city") || "").trim();
    if (!name || !address || !city) return { error: "Nombre, dirección y ciudad son obligatorios" };
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await DispensaryModel.findOne({ slug });
    if (existing) return { error: `El slug "${slug}" ya existe` };
    await DispensaryModel.create({
      name,
      slug,
      address,
      city,
      state: form.get("state") ? String(form.get("state")) : undefined,
      country: String(form.get("country") || "MX").toUpperCase(),
      phone: form.get("phone") ? String(form.get("phone")) : undefined,
      website: form.get("website") ? String(form.get("website")) : undefined,
      instagram: form.get("instagram") ? String(form.get("instagram")) : undefined,
      brandId: form.get("brandId") ? String(form.get("brandId")) : undefined,
    });
    return { success: `Dispensario "${name}" creado` };
  }

  if (intent === "set-status") {
    const id = String(form.get("id"));
    const status = String(form.get("status")) as "active" | "pending" | "suspended";
    await DispensaryModel.findByIdAndUpdate(id, { status });
    return { success: "Estado actualizado" };
  }

  if (intent === "verify") {
    const id = String(form.get("id"));
    const disp = await DispensaryModel.findById(id);
    if (disp) {
      disp.isVerified = !disp.isVerified;
      if (disp.isVerified) disp.tier = "premium";
      await disp.save();
    }
    return { success: "Verificación actualizada" };
  }

  if (intent === "delete") {
    await DispensaryModel.findByIdAndDelete(String(form.get("id")));
    return { success: "Dispensario eliminado" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminDispensaries() {
  const { dispensaries, total, page, q, status, brands } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Dispensarios</h2>
          <p className="text-sm text-fg-muted mt-0.5">{total} dispensario{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          + Nuevo dispensario
        </button>
      </div>

      {actionData && "error" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>{actionData.error}</div>
      )}
      {actionData && "success" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{actionData.success}</div>
      )}

      <div className="flex gap-3 mb-6">
        <input
          defaultValue={q}
          placeholder="Buscar por nombre o ciudad…"
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
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>

      {showCreate && (
        <div className="card p-6 mb-8">
          <h3 className="font-medium mb-4">Nuevo dispensario</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)}>
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Nombre *</label>
                <input name="name" required className="input w-full" placeholder="Cannavida CDMX" />
              </div>
              <div className="col-span-2">
                <label className="label">Dirección *</label>
                <input name="address" required className="input w-full" placeholder="Av. Insurgentes Sur 1234" />
              </div>
              <div>
                <label className="label">Ciudad *</label>
                <input name="city" required className="input w-full" placeholder="Ciudad de México" />
              </div>
              <div>
                <label className="label">Estado</label>
                <input name="state" className="input w-full" placeholder="CDMX" />
              </div>
              <div>
                <label className="label">País (ISO)</label>
                <input name="country" className="input w-full" defaultValue="MX" maxLength={2} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input name="phone" className="input w-full" placeholder="+52 55 1234 5678" />
              </div>
              <div>
                <label className="label">Website</label>
                <input name="website" className="input w-full" placeholder="https://" />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input name="instagram" className="input w-full" placeholder="@dispensario" />
              </div>
              <div className="col-span-2">
                <label className="label">Marca asociada (opcional)</label>
                <select name="brandId" className="input w-full">
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={String(b._id)} value={String(b._id)}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary text-sm">Crear</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost text-sm">Cancelar</button>
            </div>
          </Form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Dispensario</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Ciudad</th>
              <th className="px-4 py-3 font-medium text-fg-muted">País</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Estado</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Verificado</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {dispensaries.map((disp) => (
              <>
                <tr
                  key={String(disp._id)}
                  className="border-b border-line hover:bg-bg-elev/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === String(disp._id) ? null : String(disp._id))}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{disp.name}</div>
                    <div className="text-xs text-fg-dim mono">{disp.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{disp.city}</td>
                  <td className="px-4 py-3 text-fg-muted">{disp.country}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs",
                        disp.status === "active" ? "pill accent"
                        : disp.status === "suspended" ? "pill warm"
                        : "pill"
                      )}
                    >
                      {disp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {disp.isVerified ? (
                      <Icon name="check" size={14} className="text-accent" />
                    ) : (
                      <span className="text-fg-dim text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {disp.averageRating > 0 ? disp.averageRating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Icon name="chevronDown" size={14} className={cn("text-fg-dim transition-transform", expandedId === String(disp._id) ? "rotate-180" : "")} />
                  </td>
                </tr>
                {expandedId === String(disp._id) && (
                  <tr className="border-b border-line bg-bg-elev/30">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex gap-4 flex-wrap">
                        <Form method="post" className="flex items-center gap-2">
                          <input type="hidden" name="intent" value="set-status" />
                          <input type="hidden" name="id" value={String(disp._id)} />
                          <select name="status" defaultValue={disp.status} className="input text-xs !py-1">
                            <option value="pending">Pendiente</option>
                            <option value="active">Activo</option>
                            <option value="suspended">Suspendido</option>
                          </select>
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">Cambiar estado</button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="verify" />
                          <input type="hidden" name="id" value={String(disp._id)} />
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            {disp.isVerified ? "Quitar verificación" : "Verificar (→ Premium)"}
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={String(disp._id)} />
                          <button
                            type="submit"
                            className="btn btn-ghost text-xs !py-1 !px-2"
                            style={{ color: "var(--warm)" }}
                            onClick={(e) => { if (!confirm(`¿Eliminar "${disp.name}"?`)) e.preventDefault(); }}
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
            {dispensaries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fg-dim text-sm">
                  No se encontraron dispensarios.
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
