import { Form, Link, useActionData, useFetcher, useNavigation, useSearchParams, useSubmit } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/admin.strains";
import { requireAdmin } from "~/lib/auth.server";
import {
  listStrains,
  getStrain,
  createStrain,
  updateStrain,
  setStrainArchived,
  uploadStrainImage,
  uploadNewStrainImage,
} from "~/services/strains.server";
import { MAX_IMAGE_MB } from "~/lib/upload-config";
import { Dialog, DialogHeader, DialogFooter } from "~/components/ui/dialog";
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";

// HTTP adapter only: all logic lives in services/strains.server.ts (same functions the AI agent uses).
export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const editId = url.searchParams.get("editId");
  const archivedParam = url.searchParams.get("archived");

  const [strains, editStrain] = await Promise.all([
    listStrains({
      q: url.searchParams.get("q") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      archived: archivedParam === "true" ? true : archivedParam === "false" ? false : undefined,
    }),
    editId ? getStrain(editId) : Promise.resolve(null),
  ]);

  return {
    strains,
    editStrain: editStrain
      ? {
          _id: editStrain._id,
          name: editStrain.name,
          slug: editStrain.slug,
          type: editStrain.type,
          imageUrl: editStrain.imageUrl ?? "",
          description: editStrain.description ?? "",
          descriptionEs: editStrain.descriptionEs ?? "",
          descriptions: editStrain.descriptions ?? {},
          aliases: (editStrain.aliases ?? []).join("\n"),
          lineage: editStrain.lineage ?? "",
          colorHint: editStrain.colorHint ?? "",
          dominantTerpene: editStrain.dominantTerpene ?? "",
          difficulty: editStrain.difficulty ?? "",
          effects: (editStrain.effects ?? []).join(", "),
          flavors: (editStrain.flavors ?? []).join(", "),
          terpenes: (editStrain.terpenes ?? []).map((t) => `${t.name}, ${t.percentage}`).join("\n"),
          thcMin: editStrain.cannabinoidProfile?.thc?.min ?? 0,
          thcMax: editStrain.cannabinoidProfile?.thc?.max ?? 0,
          cbdMin: editStrain.cannabinoidProfile?.cbd?.min ?? 0,
          cbdMax: editStrain.cannabinoidProfile?.cbd?.max ?? 0,
          cbg: editStrain.cannabinoidProfile?.cbg ?? "",
          cbn: editStrain.cannabinoidProfile?.cbn ?? "",
          parent1: editStrain.genetics?.parent1 ?? "",
          parent2: editStrain.genetics?.parent2 ?? "",
          breeder: editStrain.genetics?.breeder ?? "",
          geneticsChildren: (editStrain.genetics?.children ?? []).join(", "),
          growFlowerMin: editStrain.grow?.floweringWeeks?.min ?? "",
          growFlowerMax: editStrain.grow?.floweringWeeks?.max ?? "",
          growYieldIndoor: editStrain.grow?.yieldIndoor ?? "",
          growYieldOutdoor: editStrain.grow?.yieldOutdoor ?? "",
          growHeightMin: editStrain.grow?.heightCm?.min ?? "",
          growHeightMax: editStrain.grow?.heightCm?.max ?? "",
          growClimate: editStrain.grow?.climate ?? "",
          growIsAutoflowering: editStrain.grow?.isAutoflowering ?? false,
          growIsFeminized: editStrain.grow?.isFeminized ?? false,
        }
      : null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const strainId = String(form.get("strainId") || "");
  const field = (k: string) => (form.has(k) ? String(form.get(k)) : undefined);

  if (intent === "create") {
    if (!field("name")?.trim() || !field("description")?.trim()) return { error: "Nombre y descripción son requeridos" };
    const img = await uploadNewStrainImage(form.get("imageFile"));
    if (!img.ok) return { error: img.error };
    const r = await createStrain(
      {
        name: field("name"),
        type: field("type") || "hybrid",
        description: field("description"),
        thcMin: field("thcMin"),
        thcMax: field("thcMax"),
        cbdMin: field("cbdMin"),
        cbdMax: field("cbdMax"),
        effects: field("effects"),
        flavors: field("flavors"),
        aliases: field("aliases"),
        imageUrl: img.imageUrl,
      },
      { actor: "admin" }
    );
    return r.ok ? { success: true, message: "Cepa creada exitosamente" } : { error: r.error };
  }

  if (intent === "upload-image") {
    const r = await uploadStrainImage(strainId, form.get("imageFile"));
    return r.ok ? { success: true, message: "Imagen actualizada" } : { error: r.error };
  }

  if (intent === "archive" || intent === "unarchive") {
    const r = await setStrainArchived(strainId, intent === "archive");
    return r.ok ? { success: true, message: intent === "archive" ? "Cepa archivada" : "Cepa restaurada" } : { error: r.error };
  }

  if (intent === "edit") {
    const r = await updateStrain(
      strainId,
      {
        name: field("name"),
        type: field("type") || "hybrid",
        description: field("description"),
        aliases: field("aliases") ?? "",
        effects: field("effects") ?? "",
        flavors: field("flavors") ?? "",
        terpenes: field("terpenes") ?? "",
        lineage: field("lineage"),
        colorHint: field("colorHint"),
        dominantTerpene: field("dominantTerpene"),
        difficulty: field("difficulty"),
        descriptionEs: field("descriptionEs"),
        descriptionEn: field("descriptionEn"),
        descriptionPt: field("descriptionPt"),
        parent1: field("parent1"),
        parent2: field("parent2"),
        breeder: field("breeder"),
        geneticsChildren: field("geneticsChildren") ?? "",
        thcMin: field("thcMin") || "0",
        thcMax: field("thcMax") || "0",
        cbdMin: field("cbdMin") || "0",
        cbdMax: field("cbdMax") || "0",
        cbg: field("cbg"),
        cbn: field("cbn"),
        floweringWeeksMin: field("growFlowerMin"),
        floweringWeeksMax: field("growFlowerMax"),
        yieldIndoor: field("growYieldIndoor"),
        yieldOutdoor: field("growYieldOutdoor"),
        heightCmMin: field("growHeightMin"),
        heightCmMax: field("growHeightMax"),
        climate: field("growClimate") || undefined,
        isAutoflowering: form.getAll("growIsAutoflowering").includes("true"),
        isFeminized: form.getAll("growIsFeminized").includes("true"),
      },
      "admin"
    );
    return r.ok ? { success: true, message: "Cepa actualizada" } : { error: r.error };
  }

  return { error: "Acción no válida" };
}

const TYPE_LABEL: Record<string, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
};
const TYPE_PILL: Record<string, string> = {
  sativa: "accent",
  indica: "warm",
  hybrid: "lilac",
};

export default function AdminStrainsPage({ loaderData }: Route.ComponentProps) {
  const { strains, editStrain } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const showEdit = !!editStrain;

  function openEdit(strainId: string) {
    setSearchParams({ editId: strainId });
  }
  function closeEdit() {
    setSearchParams({});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl">Cepas ({strains.length})</h2>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} />
          Nueva cepa
        </Button>
      </div>

      {actionData?.message && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{
            background: actionData.success ? "var(--accent-soft)" : "var(--warm-soft)",
            color: actionData.success ? "var(--fg)" : "var(--warm)",
          }}
        >
          {actionData.message || actionData.error}
        </div>
      )}

      <div className="card overflow-hidden">
        {strains.map((strain: any, i: number) => (
          <div
            key={strain._id}
            className={`flex items-center justify-between gap-4 px-5 py-4 ${
              i !== strains.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div className="flex items-center gap-4 flex-wrap min-w-0">
              <StrainImageUpload
                strainId={strain._id}
                imageUrl={strain.imageUrl}
                colorHint={strain.colorHint}
              />
              <div className="min-w-0">
                <Link
                  to={`/strains/${strain.slug}`}
                  className="font-medium hover:text-accent transition-colors"
                >
                  {strain.name}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`pill ${TYPE_PILL[strain.type]}`}>
                    {TYPE_LABEL[strain.type]}
                  </span>
                  {strain.isArchived && <span className="pill warm">Archivada</span>}
                  <span className="text-xs text-fg-dim">
                    {strain.reviewCount} reseñas
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                onClick={() => openEdit(strain._id)}
                variant="ghost"
                size="sm"
              >
                Editar
              </Button>
              <Form method="post">
                <input type="hidden" name="strainId" value={strain._id} />
                <Button
                  type="submit"
                  name="intent"
                  value={strain.isArchived ? "unarchive" : "archive"}
                  variant="ghost"
                  size="sm"
                >
                  {strain.isArchived ? "Restaurar" : "Archivar"}
                </Button>
              </Form>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <h3 className="display text-xl">Nueva cepa</h3>
        </DialogHeader>
        <Form
          method="post"
          encType="multipart/form-data"
          onSubmit={() => setShowCreate(false)}
          className="space-y-4"
        >
          <input type="hidden" name="intent" value="create" />
          <AdminField label="Nombre">
            <input name="name" required className="admin-input" />
          </AdminField>
          <AdminField label="Tipo">
            <select name="type" className="admin-input">
              <option value="sativa">Sativa</option>
              <option value="indica">Indica</option>
              <option value="hybrid">Híbrida</option>
            </select>
          </AdminField>
          <AdminField label="Descripción">
            <textarea
              name="description"
              required
              rows={3}
              className="admin-input !h-auto py-3"
            />
          </AdminField>
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="THC min %">
              <input
                name="thcMin"
                type="number"
                step="0.1"
                defaultValue="0"
                className="admin-input"
              />
            </AdminField>
            <AdminField label="THC max %">
              <input
                name="thcMax"
                type="number"
                step="0.1"
                defaultValue="0"
                className="admin-input"
              />
            </AdminField>
          </div>
          <AdminField label="Efectos (coma)">
            <input
              name="effects"
              placeholder="Relajación, Euforia"
              className="admin-input"
            />
          </AdminField>
          <AdminField label="Aliases (uno por línea o coma)">
            <textarea
              name="aliases"
              rows={2}
              placeholder="Larry Bird&#10;Gelato #33"
              className="admin-input !h-auto py-2"
            />
          </AdminField>
          <AdminField label="Sabores (coma)">
            <input
              name="flavors"
              placeholder="Dulce, Cítrico"
              className="admin-input"
            />
          </AdminField>
          <AdminField label={`Imagen (max ${MAX_IMAGE_MB} MB)`}>
            <input
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="admin-input !py-2 file:mr-3 file:border-0 file:bg-elev file:px-3 file:py-1 file:rounded file:text-fg file:cursor-pointer"
            />
          </AdminField>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={navigation.state === "submitting"}
            >
              Crear cepa
            </Button>
          </DialogFooter>
        </Form>
      </Dialog>

      {showEdit && editStrain && (
        <EditStrainDialog
          strain={editStrain as EditStrainData}
          onClose={closeEdit}
          navigation={navigation}
        />
      )}

      <style>{`
        .admin-input {
          display: block;
          width: 100%;
          height: 2.75rem;
          background: var(--bg-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 0 0.875rem;
          font-size: 0.875rem;
          color: var(--fg);
        }
        .admin-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 20%, transparent);
        }
        .edit-section { border-top: 1px solid var(--line); padding-top: 1rem; margin-top: 1rem; }
        .edit-section:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
      `}</style>
    </div>
  );
}

type EditStrainData = {
  _id: string; name: string; slug: string; type: string;
  imageUrl: string;
  description: string; descriptionEs: string;
  descriptions: { es?: string; en?: string; pt?: string };
  aliases: string; lineage: string; colorHint: string;
  dominantTerpene: string; difficulty: string;
  effects: string; flavors: string; terpenes: string;
  thcMin: number; thcMax: number; cbdMin: number; cbdMax: number;
  cbg: number | ""; cbn: number | "";
  parent1: string; parent2: string; breeder: string; geneticsChildren: string;
  growFlowerMin: number | ""; growFlowerMax: number | "";
  growYieldIndoor: string; growYieldOutdoor: string;
  growHeightMin: number | ""; growHeightMax: number | "";
  growClimate: string;
  growIsAutoflowering: boolean; growIsFeminized: boolean;
};

function EditStrainDialog({
  strain,
  onClose,
  navigation,
}: {
  strain: EditStrainData;
  onClose: () => void;
  navigation: ReturnType<typeof useNavigation>;
}) {
  const imageFetcher = useFetcher<{ imageUrl?: string; error?: string }>();
  const isGenerating = imageFetcher.state !== "idle";
  const [previewUrl, setPreviewUrl] = useState(strain.imageUrl || "");

  useEffect(() => {
    if (imageFetcher.data?.imageUrl) setPreviewUrl(imageFetcher.data.imageUrl);
  }, [imageFetcher.data]);

  return (
    <Dialog open onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <h3 className="display text-xl">Editar: {strain.name}</h3>
        <p className="text-xs text-fg-dim mt-1 mono">{strain.slug}</p>
      </DialogHeader>
      <Form
        method="post"
        onSubmit={onClose}
        className="space-y-0"
      >
        <input type="hidden" name="intent" value="edit" />
        <input type="hidden" name="strainId" value={strain._id} />

        {/* Imagen */}
        <div className="edit-section space-y-3">
          <div className="kicker">Imagen</div>
          <div className="flex gap-4 items-start">
            <div
              className="rounded-md overflow-hidden border border-line bg-elev shrink-0 w-40"
              style={{ aspectRatio: "4/3" }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-fg-dim text-xs">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <imageFetcher.Form method="post" action="/api/admin/generate-strain-image">
                <input type="hidden" name="strainId" value={strain._id} />
                <Button type="submit" variant="ghost" size="sm" disabled={isGenerating}>
                  {isGenerating ? "Generando..." : previewUrl ? "Regenerar imagen" : "Generar con IA"}
                </Button>
              </imageFetcher.Form>
              {imageFetcher.data?.error && (
                <p className="text-xs" style={{ color: "var(--warm)" }}>
                  {imageFetcher.data.error}
                </p>
              )}
              {imageFetcher.data?.imageUrl && (
                <p className="text-xs" style={{ color: "var(--accent)" }}>
                  ✓ Imagen guardada
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Básico */}
        <div className="edit-section space-y-4">
          <div className="kicker">Básico</div>
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Nombre">
              <input name="name" defaultValue={strain.name} required className="admin-input" />
            </AdminField>
            <AdminField label="Tipo">
              <select name="type" defaultValue={strain.type} className="admin-input">
                <option value="sativa">Sativa</option>
                <option value="indica">Indica</option>
                <option value="hybrid">Híbrida</option>
              </select>
            </AdminField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <AdminField label="Dificultad">
              <select name="difficulty" defaultValue={strain.difficulty} className="admin-input">
                <option value="">—</option>
                <option value="Baja">Baja</option>
                <option value="Moderada">Moderada</option>
                <option value="Alta">Alta</option>
              </select>
            </AdminField>
            <AdminField label="Color hint">
              <input name="colorHint" defaultValue={strain.colorHint} placeholder="#3a7d44" className="admin-input" />
            </AdminField>
            <AdminField label="Terpeno dominante">
              <input name="dominantTerpene" defaultValue={strain.dominantTerpene} className="admin-input" />
            </AdminField>
          </div>
          <AdminField label="Aliases (uno por línea o coma)">
            <textarea name="aliases" defaultValue={strain.aliases} rows={2} className="admin-input !h-auto py-2" />
          </AdminField>
        </div>

        {/* Descripción */}
        <div className="edit-section space-y-3">
          <div className="kicker">Descripción</div>
          <AdminField label="Principal (ES)">
            <textarea name="description" defaultValue={strain.description} rows={3} className="admin-input !h-auto py-3" />
          </AdminField>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="Descripción ES (i18n)">
              <textarea name="descriptionEs" defaultValue={strain.descriptions?.es ?? strain.descriptionEs} rows={3} className="admin-input !h-auto py-2 text-xs" />
            </AdminField>
            <AdminField label="Descripción EN">
              <textarea name="descriptionEn" defaultValue={strain.descriptions?.en} rows={3} className="admin-input !h-auto py-2 text-xs" />
            </AdminField>
            <AdminField label="Descripción PT">
              <textarea name="descriptionPt" defaultValue={strain.descriptions?.pt} rows={3} className="admin-input !h-auto py-2 text-xs" />
            </AdminField>
          </div>
        </div>

        {/* Cannabinoides */}
        <div className="edit-section space-y-3">
          <div className="kicker">Cannabinoides</div>
          <div className="grid grid-cols-4 gap-3">
            <AdminField label="THC min %">
              <input name="thcMin" type="number" step="0.1" defaultValue={strain.thcMin} className="admin-input" />
            </AdminField>
            <AdminField label="THC max %">
              <input name="thcMax" type="number" step="0.1" defaultValue={strain.thcMax} className="admin-input" />
            </AdminField>
            <AdminField label="CBD min %">
              <input name="cbdMin" type="number" step="0.1" defaultValue={strain.cbdMin} className="admin-input" />
            </AdminField>
            <AdminField label="CBD max %">
              <input name="cbdMax" type="number" step="0.1" defaultValue={strain.cbdMax} className="admin-input" />
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="CBG %">
              <input name="cbg" type="number" step="0.1" defaultValue={strain.cbg !== "" ? strain.cbg : ""} className="admin-input" />
            </AdminField>
            <AdminField label="CBN %">
              <input name="cbn" type="number" step="0.1" defaultValue={strain.cbn !== "" ? strain.cbn : ""} className="admin-input" />
            </AdminField>
          </div>
        </div>

        {/* Perfil sensorial */}
        <div className="edit-section space-y-3">
          <div className="kicker">Perfil sensorial</div>
          <AdminField label="Efectos (separados por coma)">
            <input name="effects" defaultValue={strain.effects} placeholder="Relajación, Euforia, Creatividad" className="admin-input" />
          </AdminField>
          <AdminField label="Sabores (separados por coma)">
            <input name="flavors" defaultValue={strain.flavors} placeholder="Dulce, Cítrico, Terroso" className="admin-input" />
          </AdminField>
          <AdminField label="Terpenos (uno por línea: Nombre, porcentaje)">
            <textarea
              name="terpenes"
              defaultValue={strain.terpenes}
              rows={4}
              placeholder={"Mirceno, 1.2\nLinaool, 0.8\nLimoneno, 0.5"}
              className="admin-input !h-auto py-2 font-mono text-xs"
            />
          </AdminField>
        </div>

        {/* Genética */}
        <div className="edit-section space-y-3">
          <div className="kicker">Genética y origen</div>
          <AdminField label="Linaje (texto libre)">
            <input name="lineage" defaultValue={strain.lineage} placeholder="OG Kush × Durban Poison" className="admin-input" />
          </AdminField>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="Padre 1">
              <input name="parent1" defaultValue={strain.parent1} className="admin-input" />
            </AdminField>
            <AdminField label="Padre 2">
              <input name="parent2" defaultValue={strain.parent2} className="admin-input" />
            </AdminField>
            <AdminField label="Breeder">
              <input name="breeder" defaultValue={strain.breeder} className="admin-input" />
            </AdminField>
          </div>
          <AdminField label="Descendientes (slugs separados por coma)">
            <input
              name="geneticsChildren"
              defaultValue={strain.geneticsChildren}
              className="admin-input"
              placeholder="blue-dream, og-kush, girl-scout-cookies"
            />
          </AdminField>
        </div>

        {/* Cultivo */}
        <div className="edit-section space-y-3">
          <div className="kicker">Cultivo</div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Floración min (sem)">
              <input name="growFlowerMin" type="number" step="1" defaultValue={strain.growFlowerMin !== "" ? strain.growFlowerMin : ""} placeholder="8" className="admin-input" />
            </AdminField>
            <AdminField label="Floración max (sem)">
              <input name="growFlowerMax" type="number" step="1" defaultValue={strain.growFlowerMax !== "" ? strain.growFlowerMax : ""} placeholder="10" className="admin-input" />
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Rendimiento indoor">
              <input name="growYieldIndoor" defaultValue={strain.growYieldIndoor} placeholder="400-500 g/m²" className="admin-input" />
            </AdminField>
            <AdminField label="Rendimiento outdoor">
              <input name="growYieldOutdoor" defaultValue={strain.growYieldOutdoor} placeholder="600 g/planta" className="admin-input" />
            </AdminField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="Altura min (cm)">
              <input name="growHeightMin" type="number" defaultValue={strain.growHeightMin !== "" ? strain.growHeightMin : ""} placeholder="80" className="admin-input" />
            </AdminField>
            <AdminField label="Altura max (cm)">
              <input name="growHeightMax" type="number" defaultValue={strain.growHeightMax !== "" ? strain.growHeightMax : ""} placeholder="120" className="admin-input" />
            </AdminField>
            <AdminField label="Clima">
              <select name="growClimate" defaultValue={strain.growClimate} className="admin-input">
                <option value="">—</option>
                <option value="tropical">Tropical</option>
                <option value="mediterráneo">Mediterráneo</option>
                <option value="continental">Continental</option>
                <option value="frío">Frío</option>
              </select>
            </AdminField>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="hidden" name="growIsAutoflowering" value="false" />
              <input type="checkbox" name="growIsAutoflowering" value="true" defaultChecked={strain.growIsAutoflowering}
                onChange={(e) => {
                  const hidden = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (hidden) hidden.disabled = e.currentTarget.checked;
                }}
                className="rounded" />
              Autofloreciente
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="hidden" name="growIsFeminized" value="false" />
              <input type="checkbox" name="growIsFeminized" value="true" defaultChecked={strain.growIsFeminized}
                onChange={(e) => {
                  const hidden = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (hidden) hidden.disabled = e.currentTarget.checked;
                }}
                className="rounded" />
              Feminizada
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={navigation.state === "submitting"}
          >
            Guardar cambios
          </Button>
        </DialogFooter>
      </Form>
    </Dialog>
  );
}


function StrainImageUpload({
  strainId,
  imageUrl,
  colorHint,
}: {
  strainId: string;
  imageUrl?: string;
  colorHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmit();

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      onChange={(e) => {
        const form = e.currentTarget;
        const file = (form.elements.namedItem("imageFile") as HTMLInputElement)
          ?.files?.[0];
        if (file) submit(form, { method: "post", encType: "multipart/form-data" });
      }}
      className="shrink-0"
    >
      <input type="hidden" name="intent" value="upload-image" />
      <input type="hidden" name="strainId" value={strainId} />
      <input
        ref={inputRef}
        name="imageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-12 w-12 rounded-md overflow-hidden border border-line hover:border-line-strong transition-colors grid place-items-center relative group"
        aria-label="Cambiar imagen"
        title="Cambiar imagen"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: colorHint || "var(--bg-elev)" }}
          />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
          <Icon name="camera" size={14} />
        </span>
      </button>
    </Form>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="kicker mb-2">{label}</div>
      {children}
    </div>
  );
}
