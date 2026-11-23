import { useState } from "react";
import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.product-categories";
import { requireAdmin } from "~/lib/auth.server";
import { listCategories, createCategory, setCategoryActive, deleteCategory } from "~/services/businesses.server";
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const categories = await listCategories();
  return { categories };
}

// HTTP adapter only: all logic lives in services/businesses.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id") || "");
  const field = (k: string) => (form.has(k) ? String(form.get(k)) : undefined);

  if (intent === "create") {
    const r = await createCategory({
      key: field("key"),
      labelEs: field("labelEs"),
      labelEn: field("labelEn"),
      labelPt: field("labelPt"),
      icon: field("icon"),
      color: field("color"),
      sector: field("sector"),
      hasCannabinoidsProfile: form.get("hasCannabinoidsProfile") === "on",
      sortOrder: field("sortOrder"),
    });
    return r.ok ? { success: "Categoría creada" } : { error: r.error };
  }
  if (intent === "toggle") {
    const r = await setCategoryActive(id);
    return r.ok ? { success: "Estado actualizado" } : { error: r.error };
  }
  if (intent === "delete") {
    const r = await deleteCategory(id);
    return r.ok ? { success: "Categoría eliminada" } : { error: r.error };
  }
  return { error: "Intent desconocido" };
}

export default function AdminProductCategories() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Categorías de producto</h2>
        <Button onClick={() => setShowCreate(true)} variant="primary" className="text-sm">
          + Nueva categoría
        </Button>
      </div>

      {actionData && "error" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>{actionData.error}</div>
      )}
      {actionData && "success" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{actionData.success}</div>
      )}

      {showCreate && (
        <div className="card p-6 mb-8">
          <h3 className="font-medium mb-4">Nueva categoría</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)}>
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Clave (única, sin espacios)</label>
                <input name="key" required className="input w-full" placeholder="flower" />
              </div>
              <div>
                <label className="label">Icono</label>
                <input name="icon" className="input w-full" placeholder="bolt" defaultValue="bolt" />
              </div>
              <div>
                <label className="label">Etiqueta ES</label>
                <input name="labelEs" required className="input w-full" placeholder="Flor" />
              </div>
              <div>
                <label className="label">Etiqueta EN</label>
                <input name="labelEn" required className="input w-full" placeholder="Flower" />
              </div>
              <div>
                <label className="label">Etiqueta PT</label>
                <input name="labelPt" required className="input w-full" placeholder="Flor" />
              </div>
              <div>
                <label className="label">Color (opcional)</label>
                <input name="color" className="input w-full" placeholder="#22c55e" />
              </div>
              <div>
                <label className="label">Sector</label>
                <select name="sector" className="input w-full">
                  <option value="consumo">Consumo</option>
                  <option value="cultivo">Cultivo</option>
                </select>
              </div>
              <div>
                <label className="label">Orden</label>
                <input name="sortOrder" type="number" className="input w-full" defaultValue="0" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="hasCannabinoidsProfile" name="hasCannabinoidsProfile" />
                <label htmlFor="hasCannabinoidsProfile" className="text-sm">
                  Tiene perfil de cannabinoides (THC/CBD)
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="text-sm">Crear</Button>
              <Button type="button" onClick={() => setShowCreate(false)} variant="ghost" className="text-sm">
                Cancelar
              </Button>
            </div>
          </Form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Clave</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Etiqueta ES</th>
              <th className="px-4 py-3 font-medium text-fg-muted">EN</th>
              <th className="px-4 py-3 font-medium text-fg-muted">PT</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Sector</th>
              <th className="px-4 py-3 font-medium text-fg-muted">THC/CBD</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Orden</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={String(cat._id)} className="border-b border-line last:border-0 hover:bg-bg-elev/50">
                <td className="px-4 py-3 mono text-xs text-accent">{cat.key}</td>
                <td className="px-4 py-3 font-medium">{cat.labelEs}</td>
                <td className="px-4 py-3 text-fg-muted">{cat.labelEn}</td>
                <td className="px-4 py-3 text-fg-muted">{cat.labelPt}</td>
                <td className="px-4 py-3">
                  <span className={(cat as any).sector === "cultivo" ? "pill warm text-xs" : "pill accent text-xs"}>
                    {(cat as any).sector ?? "consumo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {cat.hasCannabinoidsProfile ? (
                    <Icon name="check" size={14} className="text-accent" />
                  ) : (
                    <span className="text-fg-dim text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-fg-muted">{cat.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs", cat.isActive ? "pill accent" : "pill")}>
                    {cat.isActive ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <Form method="post">
                    <input type="hidden" name="intent" value="toggle" />
                    <input type="hidden" name="id" value={String(cat._id)} />
                    <Button type="submit" variant="ghost" size="sm">
                      {cat.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={String(cat._id)} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      style={{ color: "var(--warm)" }}
                      onClick={(e) => {
                        if (!confirm(`¿Eliminar categoría "${cat.key}"?`)) e.preventDefault();
                      }}
                    >
                      <Icon name="trash" size={12} />
                    </Button>
                  </Form>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-fg-dim text-sm">
                  No hay categorías. Crea la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
