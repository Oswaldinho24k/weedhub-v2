import { Form, Link, useActionData, useNavigation, useSubmit } from "react-router";
import { useRef, useState } from "react";
import type { Route } from "./+types/admin.strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { slugify } from "~/lib/utils";
import { UploadError, uploadImage, validateImage } from "~/lib/cloudinary.server";
import { MAX_IMAGE_MB } from "~/lib/upload-config";
import { Dialog, DialogHeader, DialogFooter } from "~/components/ui/dialog";
import { Icon } from "~/components/ui/icon";

export async function loader() {
  await connectDB();
  const strains = await StrainModel.find()
    .sort({ name: 1 })
    .select("name slug type reviewCount isArchived imageUrl colorHint")
    .lean();

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
  const { strains } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showCreate, setShowCreate] = useState(false);

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
            <Form method="post" className="shrink-0">
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
      `}</style>
    </div>
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
