import { useState } from "react";
import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.glossary";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { GlossaryTermModel, type GlossaryCategory } from "~/models/glossary-term.server";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

const CATEGORIES: Record<GlossaryCategory, string> = {
  cannabinoides: "Cannabinoides",
  terpenos: "Terpenos",
  extracciones: "Extracciones",
  cultivo: "Cultivo",
  consumo: "Consumo",
  legal: "Legal",
  ciencia: "Ciencia",
  cultura: "Cultura",
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const terms = await GlossaryTermModel.find({}).sort({ category: 1, term: 1 }).lean();
  return { terms };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const slug = String(form.get("slug") || "").toLowerCase().trim();
    const term = String(form.get("term") || "").trim();
    if (!slug || !term) return { error: "Slug y término son obligatorios" };
    const existing = await GlossaryTermModel.findOne({ slug });
    if (existing) return { error: `El slug "${slug}" ya existe` };
    await GlossaryTermModel.create({
      slug,
      term,
      termEn: form.get("termEn") ? String(form.get("termEn")) : undefined,
      category: String(form.get("category") || "cultura") as GlossaryCategory,
      definition: String(form.get("definition") || ""),
      definitionEn: form.get("definitionEn") ? String(form.get("definitionEn")) : undefined,
      relatedSlugs: String(form.get("relatedSlugs") || "").split(",").map((s) => s.trim()).filter(Boolean),
      examples: String(form.get("examples") || "").split("\n").map((s) => s.trim()).filter(Boolean),
    });
    return { success: `Término "${term}" creado` };
  }

  if (intent === "update") {
    const id = String(form.get("id"));
    await GlossaryTermModel.findByIdAndUpdate(id, {
      definition: String(form.get("definition") || ""),
      definitionEn: form.get("definitionEn") ? String(form.get("definitionEn")) : undefined,
      relatedSlugs: String(form.get("relatedSlugs") || "").split(",").map((s) => s.trim()).filter(Boolean),
      examples: String(form.get("examples") || "").split("\n").map((s) => s.trim()).filter(Boolean),
    });
    return { success: "Término actualizado" };
  }

  if (intent === "toggle") {
    const id = String(form.get("id"));
    const t = await GlossaryTermModel.findById(id);
    if (t) { t.isActive = !t.isActive; await t.save(); }
    return { success: "Visibilidad actualizada" };
  }

  if (intent === "delete") {
    await GlossaryTermModel.findByIdAndDelete(String(form.get("id")));
    return { success: "Término eliminado" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminGlossary() {
  const { terms } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("");

  const filtered = filterCat ? terms.filter((t) => t.category === filterCat) : terms;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Icon name="book" size={18} className="text-accent" />
            Glosario de Cannabis
          </h2>
          <p className="text-sm text-fg-muted mt-0.5">{terms.length} términos</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          + Nuevo término
        </button>
      </div>

      {actionData && "error" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>{actionData.error}</div>
      )}
      {actionData && "success" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{actionData.success}</div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterCat("")} className={cn("pill text-xs cursor-pointer", !filterCat ? "accent" : "")}>
          Todos ({terms.length})
        </button>
        {(Object.entries(CATEGORIES) as [GlossaryCategory, string][]).map(([key, label]) => {
          const count = terms.filter((t) => t.category === key).length;
          if (!count) return null;
          return (
            <button key={key} onClick={() => setFilterCat(key)} className={cn("pill text-xs cursor-pointer", filterCat === key ? "accent" : "")}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {showCreate && (
        <div className="card p-6 mb-8">
          <h3 className="font-medium mb-4">Nuevo término</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)}>
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Slug (único, sin espacios) *</label>
                <input name="slug" required className="input w-full" placeholder="live-resin" />
              </div>
              <div>
                <label className="label">Categoría *</label>
                <select name="category" className="input w-full">
                  {(Object.entries(CATEGORIES) as [GlossaryCategory, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Término (ES) *</label>
                <input name="term" required className="input w-full" placeholder="Live Resin" />
              </div>
              <div>
                <label className="label">Término (EN)</label>
                <input name="termEn" className="input w-full" placeholder="Live Resin" />
              </div>
              <div className="col-span-2">
                <label className="label">Definición (ES) *</label>
                <textarea name="definition" required className="input w-full" rows={4} />
              </div>
              <div className="col-span-2">
                <label className="label">Definición (EN)</label>
                <textarea name="definitionEn" className="input w-full" rows={3} />
              </div>
              <div>
                <label className="label">Términos relacionados (slugs separados por coma)</label>
                <input name="relatedSlugs" className="input w-full" placeholder="extracciones, terpenos, hash" />
              </div>
              <div>
                <label className="label">Ejemplos (uno por línea)</label>
                <textarea name="examples" className="input w-full font-mono text-xs" rows={3} />
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
              <th className="px-4 py-3 font-medium text-fg-muted">Término</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Categoría</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Relacionados</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <>
                <tr
                  key={String(t._id)}
                  className="border-b border-line hover:bg-bg-elev/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === String(t._id) ? null : String(t._id))}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.term}</div>
                    <div className="text-xs text-fg-dim mono">{t.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="pill text-xs">{CATEGORIES[t.category as GlossaryCategory]}</span>
                  </td>
                  <td className="px-4 py-3 text-fg-dim text-xs">
                    {t.relatedSlugs?.length ? t.relatedSlugs.slice(0, 3).join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs", t.isActive ? "pill accent" : "pill")}>
                      {t.isActive ? "Activo" : "Oculto"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Icon name="chevronDown" size={14} className={cn("text-fg-dim transition-transform", expandedId === String(t._id) ? "rotate-180" : "")} />
                  </td>
                </tr>
                {expandedId === String(t._id) && (
                  <tr className="border-b border-line bg-bg-elev/20">
                    <td colSpan={5} className="px-4 py-4 space-y-4">
                      <p className="text-sm text-fg-muted max-w-3xl">{t.definition}</p>
                      {t.examples && t.examples.length > 0 && (
                        <ul className="text-xs text-fg-dim space-y-0.5">
                          {t.examples.map((ex: string, i: number) => <li key={i}>· {ex}</li>)}
                        </ul>
                      )}
                      <div className="flex gap-3 flex-wrap">
                        <Form method="post">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="id" value={String(t._id)} />
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            {t.isActive ? "Ocultar" : "Mostrar"}
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={String(t._id)} />
                          <button
                            type="submit"
                            className="btn btn-ghost text-xs !py-1 !px-2"
                            style={{ color: "var(--warm)" }}
                            onClick={(e) => { if (!confirm(`¿Eliminar "${t.term}"?`)) e.preventDefault(); }}
                          >
                            <Icon name="trash" size={12} /> Eliminar
                          </button>
                        </Form>
                      </div>
                      <details className="mt-1">
                        <summary className="text-xs text-accent cursor-pointer">Editar definición</summary>
                        <Form method="post" className="mt-3 space-y-3">
                          <input type="hidden" name="intent" value="update" />
                          <input type="hidden" name="id" value={String(t._id)} />
                          <div>
                            <label className="label text-xs">Definición (ES)</label>
                            <textarea name="definition" defaultValue={t.definition} className="input w-full text-xs" rows={4} />
                          </div>
                          <div>
                            <label className="label text-xs">Definición (EN)</label>
                            <textarea name="definitionEn" defaultValue={t.definitionEn || ""} className="input w-full text-xs" rows={3} />
                          </div>
                          <div>
                            <label className="label text-xs">Relacionados (slugs por coma)</label>
                            <input name="relatedSlugs" defaultValue={t.relatedSlugs?.join(", ") || ""} className="input w-full text-xs" />
                          </div>
                          <div>
                            <label className="label text-xs">Ejemplos (uno por línea)</label>
                            <textarea name="examples" defaultValue={t.examples?.join("\n") || ""} className="input w-full text-xs font-mono" rows={3} />
                          </div>
                          <button type="submit" className="btn btn-primary text-xs !py-1 !px-3">Guardar</button>
                        </Form>
                      </details>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-fg-dim text-sm">No hay términos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
