import { useState } from "react";
import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/admin.legal-status";
import { requireAdmin } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { LegalStatusModel, type LegalStatusType } from "~/models/legal-status.server";
import { STATUS_LABEL, STATUS_PILL, STATUS_PILL_STYLE } from "~/lib/legal-status-ui";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();
  const countries = await LegalStatusModel.find({}).sort({ sortOrder: 1, countryNameEs: 1 }).lean();
  return { countries };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const countryCode = String(form.get("countryCode") || "").toUpperCase().trim();
    if (!countryCode) return { error: "El código de país es obligatorio" };
    const existing = await LegalStatusModel.findOne({ countryCode });
    if (existing) return { error: `El país "${countryCode}" ya existe` };
    await LegalStatusModel.create({
      countryCode,
      countryName: String(form.get("countryName") || ""),
      countryNameEs: String(form.get("countryNameEs") || ""),
      flag: String(form.get("flag") || "🏳️"),
      region: String(form.get("region") || "other"),
      nationalStatus: String(form.get("nationalStatus") || "illegal") as LegalStatusType,
      summary: String(form.get("summary") || ""),
      whatYouCan: String(form.get("whatYouCan") || "").split("\n").map((s) => s.trim()).filter(Boolean),
      whatYouCant: String(form.get("whatYouCant") || "").split("\n").map((s) => s.trim()).filter(Boolean),
      keyDate: form.get("keyDate") ? String(form.get("keyDate")) : undefined,
      keyLaw: form.get("keyLaw") ? String(form.get("keyLaw")) : undefined,
      lastReviewedAt: new Date(),
    });
    return { success: `País "${countryCode}" creado` };
  }

  if (intent === "update-status") {
    const id = String(form.get("id"));
    const nationalStatus = String(form.get("nationalStatus")) as LegalStatusType;
    await LegalStatusModel.findByIdAndUpdate(id, {
      nationalStatus,
      lastReviewedAt: new Date(),
    });
    return { success: "Estado actualizado" };
  }

  if (intent === "update-summary") {
    const id = String(form.get("id"));
    await LegalStatusModel.findByIdAndUpdate(id, {
      summary: String(form.get("summary") || ""),
      whatYouCan: String(form.get("whatYouCan") || "").split("\n").map((s) => s.trim()).filter(Boolean),
      whatYouCant: String(form.get("whatYouCant") || "").split("\n").map((s) => s.trim()).filter(Boolean),
      keyDate: form.get("keyDate") ? String(form.get("keyDate")) : undefined,
      keyLaw: form.get("keyLaw") ? String(form.get("keyLaw")) : undefined,
      lastReviewedAt: new Date(),
    });
    return { success: "Información actualizada" };
  }

  if (intent === "toggle") {
    const id = String(form.get("id"));
    const country = await LegalStatusModel.findById(id);
    if (country) {
      country.isActive = !country.isActive;
      await country.save();
    }
    return { success: "Visibilidad actualizada" };
  }

  return { error: "Intent desconocido" };
}

export default function AdminLegalStatus() {
  const { countries } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Icon name="globe" size={18} className="text-accent" />
            Mapa Verde — Estatus Legal
          </h2>
          <p className="text-sm text-fg-muted mt-0.5">{countries.length} países registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          + Agregar país
        </button>
      </div>

      {actionData && "error" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>{actionData.error}</div>
      )}
      {actionData && "success" in actionData && (
        <div className="mb-4 px-3 py-2 rounded text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{actionData.success}</div>
      )}

      {/* Leyenda */}
      <div className="flex gap-3 flex-wrap mb-6 p-4 card">
        <span className="text-xs text-fg-muted mr-1">Leyenda:</span>
        {(Object.entries(STATUS_LABEL) as [LegalStatusType, string][]).map(([k, v]) => (
          <span key={k} className={cn("text-xs", STATUS_PILL[k])} style={STATUS_PILL_STYLE[k]}>{v}</span>
        ))}
      </div>

      {showCreate && (
        <div className="card p-6 mb-8">
          <h3 className="font-medium mb-4">Nuevo país</h3>
          <Form method="post" onSubmit={() => setShowCreate(false)}>
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Código ISO (2 letras) *</label>
                <input name="countryCode" required className="input w-full uppercase" placeholder="MX" maxLength={2} />
              </div>
              <div>
                <label className="label">Bandera (emoji)</label>
                <input name="flag" className="input w-full" placeholder="🇲🇽" />
              </div>
              <div>
                <label className="label">Nombre (inglés)</label>
                <input name="countryName" className="input w-full" placeholder="Mexico" />
              </div>
              <div>
                <label className="label">Nombre (español) *</label>
                <input name="countryNameEs" required className="input w-full" placeholder="México" />
              </div>
              <div>
                <label className="label">Región</label>
                <select name="region" className="input w-full">
                  <option value="mexico">México</option>
                  <option value="latam-central">Centroamérica</option>
                  <option value="latam-south">Sudamérica</option>
                  <option value="latam-caribe">Caribe</option>
                  <option value="europe">Europa</option>
                  <option value="north-america">Norteamérica</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="label">Estatus nacional</label>
                <select name="nationalStatus" className="input w-full">
                  {(Object.entries(STATUS_LABEL) as [LegalStatusType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Resumen (1-2 oraciones en español)</label>
                <textarea name="summary" className="input w-full" rows={3} />
              </div>
              <div>
                <label className="label">Ley o decreto clave</label>
                <input name="keyLaw" className="input w-full" placeholder="Ley N.° 19.172" />
              </div>
              <div>
                <label className="label">Fecha clave</label>
                <input name="keyDate" className="input w-full" placeholder="Desde 2017" />
              </div>
              <div className="col-span-2">
                <label className="label">¿Qué puedes hacer? (una por línea)</label>
                <textarea name="whatYouCan" className="input w-full font-mono text-xs" rows={4} placeholder={"Poseer hasta 20g para consumo personal\nUsar cannabis medicinal con receta"} />
              </div>
              <div className="col-span-2">
                <label className="label">¿Qué no puedes hacer? (una por línea)</label>
                <textarea name="whatYouCant" className="input w-full font-mono text-xs" rows={4} placeholder={"Vender cannabis recreativo\nConsumir en espacios públicos"} />
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
              <th className="px-4 py-3 font-medium text-fg-muted w-12" />
              <th className="px-4 py-3 font-medium text-fg-muted">País</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Región</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Estatus</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Revisado</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Visible</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <>
                <tr
                  key={String(country._id)}
                  className="border-b border-line hover:bg-bg-elev/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === String(country._id) ? null : String(country._id))}
                >
                  <td className="px-4 py-3 text-xl">{country.flag}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{country.countryNameEs}</div>
                    <div className="text-xs text-fg-dim mono">{country.countryCode}</div>
                  </td>
                  <td className="px-4 py-3 text-fg-muted text-xs">{country.region}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn("text-xs", STATUS_PILL[country.nationalStatus as LegalStatusType])}
                      style={STATUS_PILL_STYLE[country.nationalStatus as LegalStatusType]}
                    >
                      {STATUS_LABEL[country.nationalStatus as LegalStatusType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-dim text-xs">
                    {country.lastReviewedAt
                      ? new Date(country.lastReviewedAt).toLocaleDateString("es-MX", { year: "numeric", month: "short" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("pill text-xs", country.isActive ? "accent" : "")}>
                      {country.isActive ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Icon name="chevronDown" size={14} className={cn("text-fg-dim transition-transform", expandedId === String(country._id) ? "rotate-180" : "")} />
                  </td>
                </tr>
                {expandedId === String(country._id) && (
                  <tr className="border-b border-line bg-bg-elev/20">
                    <td colSpan={7} className="px-4 py-4 space-y-4">
                      <p className="text-sm text-fg-muted max-w-2xl">{country.summary}</p>
                      <div className="flex gap-4 flex-wrap">
                        {/* Cambiar estatus */}
                        <Form method="post" className="flex items-center gap-2">
                          <input type="hidden" name="intent" value="update-status" />
                          <input type="hidden" name="id" value={String(country._id)} />
                          <select name="nationalStatus" defaultValue={country.nationalStatus} className="input text-xs !py-1">
                            {(Object.entries(STATUS_LABEL) as [LegalStatusType, string][]).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <button type="submit" className="btn btn-primary text-xs !py-1 !px-2">
                            Actualizar estatus
                          </button>
                        </Form>

                        {/* Toggle visibilidad */}
                        <Form method="post">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="id" value={String(country._id)} />
                          <button type="submit" className="btn btn-ghost text-xs !py-1 !px-2">
                            {country.isActive ? "Ocultar" : "Mostrar"}
                          </button>
                        </Form>
                      </div>

                      {/* Editar contenido */}
                      <details className="mt-2">
                        <summary className="text-xs text-accent cursor-pointer">Editar resumen y listas</summary>
                        <Form method="post" className="mt-3 space-y-3">
                          <input type="hidden" name="intent" value="update-summary" />
                          <input type="hidden" name="id" value={String(country._id)} />
                          <div>
                            <label className="label text-xs">Resumen</label>
                            <textarea name="summary" defaultValue={country.summary} className="input w-full text-xs" rows={3} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="label text-xs">Ley clave</label>
                              <input name="keyLaw" defaultValue={country.keyLaw || ""} className="input w-full text-xs" />
                            </div>
                            <div>
                              <label className="label text-xs">Fecha clave</label>
                              <input name="keyDate" defaultValue={country.keyDate || ""} className="input w-full text-xs" />
                            </div>
                            <div>
                              <label className="label text-xs">¿Qué puedes hacer? (una por línea)</label>
                              <textarea name="whatYouCan" defaultValue={country.whatYouCan?.join("\n") || ""} className="input w-full text-xs font-mono" rows={4} />
                            </div>
                            <div>
                              <label className="label text-xs">¿Qué no puedes hacer? (una por línea)</label>
                              <textarea name="whatYouCant" defaultValue={country.whatYouCant?.join("\n") || ""} className="input w-full text-xs font-mono" rows={4} />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary text-xs !py-1 !px-3">Guardar</button>
                        </Form>
                      </details>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
