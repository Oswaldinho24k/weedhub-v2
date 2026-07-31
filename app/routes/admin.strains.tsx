import { Form, Link, useActionData, useNavigation, useSearchParams, useSubmit } from "react-router";
import { useRef, useState } from "react";
import type { Route } from "./+types/admin.strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { slugify } from "~/lib/utils";
import { UploadError, uploadImage, validateImage } from "~/lib/cloudinary.server";
import { MAX_IMAGE_MB } from "~/lib/upload-config";
import { Dialog, DialogHeader, DialogFooter } from "~/components/ui/dialog";
import { Icon } from "~/components/ui/icon";

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const editId = url.searchParams.get("editId");

  const [strains, editStrain] = await Promise.all([
    StrainModel.find()
      .sort({ name: 1 })
      .select("name slug type reviewCount isArchived imageUrl colorHint")
      .lean(),
    editId ? StrainModel.findById(editId).lean() : Promise.resolve(null),
  ]);

  return {
    strains: strains.map((s) => ({
      _id: String(s._id),
      name: s.name,
      slug: s.slug,
      type: s.type,
      reviewCount: s.reviewCount,
      isArchived: s.isArchived,
      imageUrl: s.imageUrl,
      colorHint: s.colorHint,
    })),
    editStrain: editStrain
      ? {
          _id: String(editStrain._id),
          name: editStrain.name,
          slug: editStrain.slug,
          type: editStrain.type,
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
          terpenes: (editStrain.terpenes ?? [])
            .map((t) => `${t.name}, ${t.percentage}`)
            .join("\n"),
          thcMin: editStrain.cannabinoidProfile?.thc?.min ?? 0,
          thcMax: editStrain.cannabinoidProfile?.thc?.max ?? 0,
          cbdMin: editStrain.cannabinoidProfile?.cbd?.min ?? 0,
          cbdMax: editStrain.cannabinoidProfile?.cbd?.max ?? 0,
          cbg: editStrain.cannabinoidProfile?.cbg ?? "",
          cbn: editStrain.cannabinoidProfile?.cbn ?? "",
          parent1: editStrain.genetics?.parent1 ?? "",
          parent2: editStrain.genetics?.parent2 ?? "",
          breeder: editStrain.genetics?.breeder ?? "",
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
  await connectDB();
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "create") {
    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "hybrid");
    const description = String(formData.get("description") || "").trim();
    const thcMin = Number(formData.get("thcMin") || 0);
    const thcMax = Number(formData.get("thcMax") || 0);
    const cbdMin = Number(formData.get("cbdMin") || 0);
    const cbdMax = Number(formData.get("cbdMax") || 0);
    const effects = String(formData.get("effects") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const flavors = String(formData.get("flavors") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const aliases = String(formData.get("aliases") || "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const aliasSlugs = aliases.map((a) =>
      a
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );

    if (!name || !description) {
      return { error: "Nombre y descripción son requeridos" };
    }

    const slug = slugify(name);
    const existing = await StrainModel.findOne({ slug });
    if (existing) {
      return { error: "Ya existe una cepa con este nombre" };
    }

    let imageUrl: string | undefined;
    const imageFile = formData.get("imageFile");
    try {
      if (imageFile instanceof File && validateImage(imageFile)) {
        imageUrl = await uploadImage(imageFile, {
          folder: "weedhub/strains",
          transformation: "c_fill,w_1200,h_900,q_auto",
        });
      }
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }

    await StrainModel.create({
      name,
      slug,
      aliases,
      aliasSlugs,
      type,
      description,
      cannabinoidProfile: {
        thc: { min: thcMin, max: thcMax },
        cbd: { min: cbdMin, max: cbdMax },
      },
      effects,
      flavors,
      imageUrl,
    });

    return { success: true, message: "Cepa creada exitosamente" };
  }

  if (intent === "upload-image") {
    const strainId = String(formData.get("strainId"));
    const imageFile = formData.get("imageFile");
    try {
      if (!(imageFile instanceof File) || !validateImage(imageFile)) {
        return { error: "No se recibió ninguna imagen." };
      }
      const imageUrl = await uploadImage(imageFile, {
        folder: "weedhub/strains",
        transformation: "c_fill,w_1200,h_900,q_auto",
      });
      await StrainModel.findByIdAndUpdate(strainId, { imageUrl });
      return { success: true, message: "Imagen actualizada" };
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  if (intent === "archive") {
    const strainId = String(formData.get("strainId"));
    await StrainModel.findByIdAndUpdate(strainId, { isArchived: true });
    return { success: true, message: "Cepa archivada" };
  }

  if (intent === "unarchive") {
    const strainId = String(formData.get("strainId"));
    await StrainModel.findByIdAndUpdate(strainId, { isArchived: false });
    return { success: true, message: "Cepa restaurada" };
  }

  if (intent === "edit") {
    const strainId = String(formData.get("strainId"));
    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "hybrid");
    const description = String(formData.get("description") || "").trim();
    const aliases = String(formData.get("aliases") || "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const aliasSlugs = aliases.map((a) =>
      a
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
    const effects = String(formData.get("effects") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const flavors = String(formData.get("flavors") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const terpenes = String(formData.get("terpenes") || "")
      .split("\n")
      .map((line) => {
        const [tname, pct] = line.split(",").map((s) => s.trim());
        return tname ? { name: tname, percentage: parseFloat(pct) || 0 } : null;
      })
      .filter(Boolean) as { name: string; percentage: number }[];

    const $set: Record<string, unknown> = {
      name: name || undefined,
      type,
      description: description || undefined,
      aliases,
      aliasSlugs,
      effects,
      flavors,
      terpenes,
      lineage: String(formData.get("lineage") || "").trim() || undefined,
      colorHint: String(formData.get("colorHint") || "").trim() || undefined,
      dominantTerpene: String(formData.get("dominantTerpene") || "").trim() || undefined,
      difficulty: String(formData.get("difficulty") || "") || undefined,
      "descriptions.es": String(formData.get("descriptionEs") || "").trim() || undefined,
      "descriptions.en": String(formData.get("descriptionEn") || "").trim() || undefined,
      "descriptions.pt": String(formData.get("descriptionPt") || "").trim() || undefined,
      "genetics.parent1": String(formData.get("parent1") || "").trim() || undefined,
      "genetics.parent2": String(formData.get("parent2") || "").trim() || undefined,
      "genetics.breeder": String(formData.get("breeder") || "").trim() || undefined,
      "cannabinoidProfile.thc": {
        min: parseFloat(String(formData.get("thcMin") || "0")),
        max: parseFloat(String(formData.get("thcMax") || "0")),
      },
      "cannabinoidProfile.cbd": {
        min: parseFloat(String(formData.get("cbdMin") || "0")),
        max: parseFloat(String(formData.get("cbdMax") || "0")),
      },
    };
    const cbg = parseFloat(String(formData.get("cbg") || ""));
    if (!isNaN(cbg)) $set["cannabinoidProfile.cbg"] = cbg;
    const cbn = parseFloat(String(formData.get("cbn") || ""));
    if (!isNaN(cbn)) $set["cannabinoidProfile.cbn"] = cbn;

    // Grow info
    const growFlowerMin = parseFloat(String(formData.get("growFlowerMin") || ""));
    const growFlowerMax = parseFloat(String(formData.get("growFlowerMax") || ""));
    const growYieldIndoor = String(formData.get("growYieldIndoor") || "").trim();
    const growYieldOutdoor = String(formData.get("growYieldOutdoor") || "").trim();
    const growHeightMin = parseFloat(String(formData.get("growHeightMin") || ""));
    const growHeightMax = parseFloat(String(formData.get("growHeightMax") || ""));
    const growClimate = String(formData.get("growClimate") || "").trim();
    const growIsAutoflowering = formData.getAll("growIsAutoflowering").includes("true");
    const growIsFeminized = formData.getAll("growIsFeminized").includes("true");
    if (!isNaN(growFlowerMin) && !isNaN(growFlowerMax))
      $set["grow.floweringWeeks"] = { min: growFlowerMin, max: growFlowerMax };
    if (growYieldIndoor) $set["grow.yieldIndoor"] = growYieldIndoor;
    if (growYieldOutdoor) $set["grow.yieldOutdoor"] = growYieldOutdoor;
    if (!isNaN(growHeightMin) && !isNaN(growHeightMax))
      $set["grow.heightCm"] = { min: growHeightMin, max: growHeightMax };
    if (growClimate) $set["grow.climate"] = growClimate;
    $set["grow.isAutoflowering"] = growIsAutoflowering;
    $set["grow.isFeminized"] = growIsFeminized;

    // Remove undefined values
    Object.keys($set).forEach((k) => $set[k] === undefined && delete $set[k]);

    await StrainModel.findByIdAndUpdate(strainId, { $set });
    return { success: true, message: "Cepa actualizada" };
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
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} />
          Nueva cepa
        </button>
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
              <button
                type="button"
                onClick={() => openEdit(strain._id)}
                className="btn btn-ghost !py-1.5 !px-3 text-xs"
              >
                Editar
              </button>
              <Form method="post">
                <input type="hidden" name="strainId" value={strain._id} />
                <button
                  type="submit"
                  name="intent"
                  value={strain.isArchived ? "unarchive" : "archive"}
                  className="btn btn-ghost !py-1.5 !px-3 text-xs"
                >
                  {strain.isArchived ? "Restaurar" : "Archivar"}
                </button>
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
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={navigation.state === "submitting"}
            >
              Crear cepa
            </button>
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
  description: string; descriptionEs: string;
  descriptions: { es?: string; en?: string; pt?: string };
  aliases: string; lineage: string; colorHint: string;
  dominantTerpene: string; difficulty: string;
  effects: string; flavors: string; terpenes: string;
  thcMin: number; thcMax: number; cbdMin: number; cbdMax: number;
  cbg: number | ""; cbn: number | "";
  parent1: string; parent2: string; breeder: string;
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
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={navigation.state === "submitting"}
          >
            Guardar cambios
          </button>
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
