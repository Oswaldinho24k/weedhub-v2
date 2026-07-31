import { useState } from "react";
import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.product-categories";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ProductCategoryModel } from "~/models/product-category.server";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const categories = await ProductCategoryModel.find({}).sort({ sortOrder: 1, labelEs: 1 }).lean();
  return { categories };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const key = String(form.get("key") || "").toLowerCase().trim();
    if (!key) return { error: "La clave es obligatoria" };
    const existing = await ProductCategoryModel.findOne({ key });
    if (existing) return { error: `La clave "${key}" ya existe` };
    await ProductCategoryModel.create({
      key,
      labelEs: String(form.get("labelEs") || ""),
      labelEn: String(form.get("labelEn") || ""),
      labelPt: String(form.get("labelPt") || ""),
      icon: String(form.get("icon") || "bolt"),
      color: form.get("color") ? String(form.get("color")) : undefined,
      sector: String(form.get("sector") || "consumo") as "consumo" | "cultivo",
      hasCannabinoidsProfile: form.get("hasCannabinoidsProfile") === "on",
      sortOrder: Number(form.get("sortOrder") || 0),
      isActive: true,
    });
    return { success: "Categoría creada" };
  }

  if (intent === "toggle") {
    const id = String(form.get("id"));
    const cat = await ProductCategoryModel.findById(id);
    if (cat) {
      cat.isActive = !cat.isActive;
      await cat.save();
    }
    return { success: "Estado actualizado" };
  }

  if (intent === "delete") {
    await ProductCategoryModel.findByIdAndDelete(String(form.get("id")));
    return { success: "Categoría eliminada" };
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
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          + Nueva categoría
        </button>
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
                    <button type="submit" className="btn btn-ghost !py-1 !px-2 text-xs">
                      {cat.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={String(cat._id)} />
                    <button
                      type="submit"
                      className="btn btn-ghost !py-1 !px-2 text-xs"
                      style={{ color: "var(--warm)" }}
                      onClick={(e) => {
                        if (!confirm(`¿Eliminar categoría "${cat.key}"?`)) e.preventDefault();
                      }}
                    >
                      <Icon name="trash" size={12} />
                    </button>
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
