import { useState } from "react";
import { Form, useLoaderData, useActionData, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.dispensaries";
import { requireAdmin } from "~/lib/auth.server";
import { listDispensaries, listBrandOptions, createDispensary, setDispensaryStatus, setDispensaryVerified, deleteDispensary } from "~/services/businesses.server";

const PAGE_SIZE = 25; // keep in sync with services/businesses.server.ts (client-safe copy)
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const includeSeed = url.searchParams.get("includeSeed") === "1";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const [{ dispensaries, total }, brands] = await Promise.all([
    listDispensaries({ q, status, page, includeSeed }),
    listBrandOptions({ status: "active", includeSeed }),
  ]);

  return { dispensaries, total, page, q, status, includeSeed, brands };
}

// HTTP adapter only: all logic lives in services/businesses.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id") || "");
  const field = (k: string) => (form.has(k) ? String(form.get(k)) : undefined);

  if (intent === "create") {
    const r = await createDispensary({
      name: field("name"),
      address: field("address"),
      city: field("city"),
      state: field("state"),
      country: field("country"),
      phone: field("phone"),
      website: field("website"),
      instagram: field("instagram"),
      brandId: field("brandId"),
    });
    return r.ok ? { success: `Dispensario "${r.name}" creado` } : { error: r.error };
  }
  if (intent === "set-status") {
    const r = await setDispensaryStatus(id, String(form.get("status")));
    return r.ok ? { success: "Estado actualizado" } : { error: r.error };
  }
  if (intent === "verify") {
    const r = await setDispensaryVerified(id);
    return r.ok ? { success: "Verificación actualizada" } : { error: r.error };
  }
  if (intent === "delete") {
    const r = await deleteDispensary(id);
    return r.ok ? { success: "Dispensario eliminado" } : { error: r.error };
  }
  return { error: "Intent desconocido" };
}

export default function AdminDispensaries() {
  const { dispensaries, total, page, q, status, includeSeed, brands } = useLoaderData<typeof loader>();
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
        <Button onClick={() => setShowCreate(true)} variant="primary" className="text-sm">
          + Nuevo dispensario
        </Button>
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
        <label className="flex items-center gap-1.5 text-sm text-fg-muted">
          <input
            type="checkbox"
            defaultChecked={includeSeed}
            onChange={(e) => setSearchParams((p) => { if (e.target.checked) p.set("includeSeed", "1"); else p.delete("includeSeed"); p.set("page", "1"); return p; })}
          />
          Incluir seed
        </label>
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
              <Button type="submit" variant="primary" className="text-sm">Crear</Button>
              <Button type="button" onClick={() => setShowCreate(false)} variant="ghost" className="text-sm">Cancelar</Button>
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
                    <div className="text-xs text-fg-dim mono">{disp.slug}{(disp as { source?: string }).source === "seed" && <span className="pill text-xs ml-1">seed</span>}</div>
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
                          <Button type="submit" variant="ghost" size="sm">Cambiar estado</Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="verify" />
                          <input type="hidden" name="id" value={String(disp._id)} />
                          <Button type="submit" variant="ghost" size="sm">
                            {disp.isVerified ? "Quitar verificación" : "Verificar (→ Premium)"}
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={String(disp._id)} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            style={{ color: "var(--warm)" }}
                            onClick={(e) => { if (!confirm(`¿Eliminar "${disp.name}"?`)) e.preventDefault(); }}
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
