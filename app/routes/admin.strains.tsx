import { Form, Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { slugify } from "~/lib/utils";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogHeader, DialogFooter } from "~/components/ui/dialog";

export async function loader() {
  await connectDB();
  const strains = await StrainModel.find()
    .sort({ name: 1 })
    .select("name slug type reviewCount isArchived")
    .lean();

  return {
    strains: strains.map((s) => ({
      _id: String(s._id),
      name: s.name,
      slug: s.slug,
      type: s.type,
      reviewCount: s.reviewCount,
      isArchived: s.isArchived,
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
    const effects = String(formData.get("effects") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const flavors = String(formData.get("flavors") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const imageUrl = String(formData.get("imageUrl") || "").trim();

    if (!name || !description) {
      return { error: "Nombre y descripción son requeridos" };
    }

    const slug = slugify(name);
    const existing = await StrainModel.findOne({ slug });
    if (existing) {
      return { error: "Ya existe una cepa con este nombre" };
    }

    await StrainModel.create({
      name,
      slug,
      type,
      description,
      cannabinoidProfile: {
        thc: { min: thcMin, max: thcMax },
        cbd: { min: cbdMin, max: cbdMax },
      },
      effects,
      flavors,
      imageUrl: imageUrl || undefined,
    });

    return { success: true, message: "Cepa creada exitosamente" };
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

export default function AdminStrainsPage({ loaderData }: Route.ComponentProps) {
  const { strains } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white">
          Cepas ({strains.length})
        </h2>
        <Button onClick={() => setShowCreate(true)}>
          <span className="material-symbols-outlined text-lg">add</span>
          Nueva Cepa
        </Button>
      </div>

      {actionData?.message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          actionData.success
            ? "bg-primary/10 border border-primary/20 text-primary"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {actionData.message || actionData.error}
        </div>
      )}

      {/* Strain List */}
      <div className="space-y-2">
        {strains.map((strain: any) => (
          <div
            key={strain._id}
            className="flex items-center justify-between p-4 rounded-xl bg-forest-deep border border-white/5"
          >
            <div className="flex items-center gap-3">
              <Link
                to={`/strains/${strain.slug}`}
                className="font-bold text-white hover:text-primary transition-colors"
              >
                {strain.name}
              </Link>
              <Badge variant={strain.type === "sativa" ? "sativa" : strain.type === "indica" ? "indica" : "hybrid"}>
                {TYPE_LABEL[strain.type]}
              </Badge>
              {strain.isArchived && (
                <Badge variant="default" className="text-red-400 bg-red-500/10">Archivada</Badge>
              )}
              <span className="text-xs text-text-muted">{strain.reviewCount} reseñas</span>
            </div>
            <Form method="post">
              <input type="hidden" name="strainId" value={strain._id} />
              <Button
                variant="ghost"
                size="sm"
                name="intent"
                value={strain.isArchived ? "unarchive" : "archive"}
                type="submit"
              >
                {strain.isArchived ? "Restaurar" : "Archivar"}
              </Button>
            </Form>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <h3 className="font-display text-xl font-bold text-white">Nueva Cepa</h3>
        </DialogHeader>
        <Form method="post" onSubmit={() => setShowCreate(false)}>
          <input type="hidden" name="intent" value="create" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select name="type" className="flex h-12 w-full rounded-xl border border-forest-accent bg-forest-muted px-4 text-white">
                <option value="sativa">Sativa</option>
                <option value="indica">Indica</option>
                <option value="hybrid">Híbrida</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>THC Min %</Label>
                <Input name="thcMin" type="number" step="0.1" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label>THC Max %</Label>
                <Input name="thcMax" type="number" step="0.1" defaultValue="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Efectos (separados por coma)</Label>
              <Input name="effects" placeholder="Relajación, Euforia, Felicidad" />
            </div>
            <div className="space-y-2">
              <Label>Sabores (separados por coma)</Label>
              <Input name="flavors" placeholder="Dulce, Cítrico, Terroso" />
            </div>
            <div className="space-y-2">
              <Label>URL de imagen</Label>
              <Input name="imageUrl" type="url" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={navigation.state === "submitting"}>
              Crear Cepa
            </Button>
          </DialogFooter>
        </Form>
      </Dialog>
    </div>
  );
}
