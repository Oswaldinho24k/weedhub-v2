import { Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "~/components/ui/dialog";
import type { Route } from "./+types/admin.effects";

type SerializedEffect = {
  _id: string; key: string; labelEn: string; labelEs: string; labelPt: string;
  category: string; status: string; source: string; usageCount: number;
  rejectionReason?: string; createdAt?: string;
  submittedBy?: { username?: string; handle?: string } | null;
};
import { connectDB } from "~/lib/db.server";
import { requireAdmin } from "~/lib/auth.server";
import { EffectModel } from "~/models/effect.server";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();

  const [pending, approved] = await Promise.all([
    EffectModel.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("submittedBy", "username anonymousHandle")
      .lean(),
    EffectModel.find({ status: "approved" })
      .sort({ category: 1, usageCount: -1 })
      .lean(),
  ]);

  const serialize = (e: any) => ({
    _id: String(e._id),
    key: e.key,
    labelEn: e.labelEn,
    labelEs: e.labelEs,
    labelPt: e.labelPt,
    category: e.category,
    status: e.status,
    source: e.source,
    usageCount: e.usageCount,
    rejectionReason: e.rejectionReason,
    createdAt: e.createdAt?.toISOString(),
    submittedBy: e.submittedBy
      ? { username: e.submittedBy.username, handle: e.submittedBy.anonymousHandle }
      : null,
  });

  return {
    pending: pending.map(serialize),
    approved: approved.map(serialize),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();

  const form = await request.formData();
  const intent = String(form.get("intent"));
  const effectId = String(form.get("effectId"));

  if (intent === "approve") {
    const labelEn = String(form.get("labelEn")).trim();
    const labelEs = String(form.get("labelEs")).trim();
    const labelPt = String(form.get("labelPt")).trim();
    const category = String(form.get("category")) as "positive" | "negative";

    if (!labelEn || !labelEs || !labelPt) {
      return { error: "Todos los labels son requeridos" };
    }

    await EffectModel.findByIdAndUpdate(effectId, {
      labelEn, labelEs, labelPt, category,
      status: "approved",
    });
    return { success: "Efecto aprobado" };
  }

  if (intent === "reject") {
    const reason = String(form.get("reason") || "").trim();
    await EffectModel.findByIdAndUpdate(effectId, {
      status: "rejected",
      rejectionReason: reason || undefined,
    });
    return { success: "Efecto rechazado" };
  }

  if (intent === "merge") {
    const targetKey = String(form.get("targetKey")).trim();
    // Mark as rejected with a note pointing to the canonical key
    await EffectModel.findByIdAndUpdate(effectId, {
      status: "rejected",
      rejectionReason: `Merged into: ${targetKey}`,
    });
    return { success: `Fusionado con "${targetKey}"` };
  }

  if (intent === "edit") {
    const labelEn = String(form.get("labelEn")).trim();
    const labelEs = String(form.get("labelEs")).trim();
    const labelPt = String(form.get("labelPt")).trim();
    const category = String(form.get("category")) as "positive" | "negative";
    await EffectModel.findByIdAndUpdate(effectId, { labelEn, labelEs, labelPt, category });
    return { success: "Efecto actualizado" };
  }

  if (intent === "create") {
    const key = String(form.get("key") || "").toLowerCase().trim();
    const labelEs = String(form.get("labelEs") || "").trim();
    const labelEn = String(form.get("labelEn") || "").trim();
    const labelPt = String(form.get("labelPt") || "").trim();
    const category = String(form.get("category") || "positive") as "positive" | "negative";

    if (!key || !labelEs || !labelEn || !labelPt) {
      return { error: "Todos los campos son requeridos" };
    }

    const existing = await EffectModel.findOne({ key });
    if (existing) {
      return { error: `Ya existe un efecto con key '${key}'` };
    }

    await EffectModel.create({ key, labelEs, labelEn, labelPt, category, status: "approved", source: "system" });
    return { success: `Efecto '${labelEs}' creado` };
  }

  return { error: "Acción desconocida" };
}

export default function AdminEffects({ loaderData }: Route.ComponentProps) {
  const { pending, approved } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="kicker mb-1">Catálogo</div>
          <h2 className="display text-3xl">Efectos</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 mono text-sm text-fg-muted">
            <span><span className="text-fg">{pending.length}</span> pendientes</span>
            <span><span className="text-fg">{approved.length}</span> aprobados</span>
          </div>
          <button className="btn btn-primary text-sm" onClick={() => setShowCreate(true)}>
            + Nuevo efecto
          </button>
        </div>
      </div>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <h3 className="display text-xl">Nuevo efecto</h3>
        </DialogHeader>
        <Form method="post" className="space-y-4" onSubmit={() => setShowCreate(false)}>
          <input type="hidden" name="intent" value="create" />
          <div>
            <div className="kicker mb-2">Key (único, lowercase)</div>
            <input name="key" required placeholder="sociable" className="input w-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mono text-xs text-fg-dim">ES</label>
              <input name="labelEs" required placeholder="Sociable" className="input mt-1 w-full" />
            </div>
            <div>
              <label className="mono text-xs text-fg-dim">EN</label>
              <input name="labelEn" required placeholder="Sociable" className="input mt-1 w-full" />
            </div>
            <div>
              <label className="mono text-xs text-fg-dim">PT</label>
              <input name="labelPt" required placeholder="Sociável" className="input mt-1 w-full" />
            </div>
          </div>
          <div>
            <div className="kicker mb-2">Categoría</div>
            <select name="category" defaultValue="positive" className="input w-full">
              <option value="positive">Positivo</option>
              <option value="negative">Negativo / Side effect</option>
            </select>
          </div>
          <DialogFooter>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
            <button type="submit" disabled={busy} className="btn btn-primary">Crear efecto</button>
          </DialogFooter>
        </Form>
      </Dialog>

      {actionData && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          "error" in actionData ? "bg-warm-soft text-warm" : "bg-accent-soft text-accent"
        )}>
          {"error" in actionData ? actionData.error : actionData.success}
        </div>
      )}

      {/* Pending queue */}
      {pending.length > 0 && (
        <section>
          <h3 className="mono text-xs uppercase tracking-wider text-fg-dim mb-4">
            Cola de revisión ({pending.length})
          </h3>
          <div className="space-y-4">
            {pending.map((e) => (
              <PendingCard key={e._id} effect={e} busy={busy} />
            ))}
          </div>
        </section>
      )}

      {/* Approved catalog */}
      <section>
        <h3 className="mono text-xs uppercase tracking-wider text-fg-dim mb-4">
          Catálogo aprobado
        </h3>

        {(["positive", "negative"] as const).map((cat) => {
          const group = approved.filter((e) => e.category === cat);
          if (!group.length) return null;
          return (
            <div key={cat} className="mb-8">
              <div className="kicker mb-3">{cat === "positive" ? "Positivos" : "Negativos / Side effects"}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.map((e) => (
                  <ApprovedRow key={e._id} effect={e} busy={busy} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function PendingCard({ effect, busy }: { effect: SerializedEffect; busy: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="mono text-xs text-fg-dim">{effect.key}</span>
            <span className="chip">{effect.source}</span>
          </div>
          <div className="text-lg font-medium mt-1">
            {effect.labelEs || effect.labelEn || effect.key}
          </div>
          {effect.submittedBy && (
            <div className="text-xs text-fg-muted mt-1">
              por {effect.submittedBy.username || effect.submittedBy.handle}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn btn-ghost text-sm"
        >
          {expanded ? "Cerrar" : "Revisar"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 pt-4 border-t border-line">
          {/* Approve */}
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="approve" />
            <input type="hidden" name="effectId" value={effect._id} />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mono text-xs text-fg-dim">EN</label>
                <input name="labelEn" defaultValue={effect.labelEn} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="mono text-xs text-fg-dim">ES</label>
                <input name="labelEs" defaultValue={effect.labelEs} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="mono text-xs text-fg-dim">PT</label>
                <input name="labelPt" defaultValue={effect.labelPt} className="input mt-1 w-full" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select name="category" defaultValue={effect.category || "positive"} className="input">
                <option value="positive">Positivo</option>
                <option value="negative">Negativo</option>
              </select>
              <button type="submit" disabled={busy} className="btn btn-primary text-sm">
                <Icon name="check" size={14} /> Aprobar
              </button>
            </div>
          </Form>

          <div className="flex gap-3 flex-wrap">
            {/* Reject */}
            <Form method="post" className="flex gap-2">
              <input type="hidden" name="intent" value="reject" />
              <input type="hidden" name="effectId" value={effect._id} />
              <input name="reason" placeholder="Razón (opcional)" className="input text-sm w-48" />
              <button type="submit" disabled={busy} className="btn btn-ghost text-sm text-fg-muted">
                Rechazar
              </button>
            </Form>

            {/* Merge */}
            <Form method="post" className="flex gap-2">
              <input type="hidden" name="intent" value="merge" />
              <input type="hidden" name="effectId" value={effect._id} />
              <input name="targetKey" placeholder="key destino (ej: relaxed)" className="input text-sm w-40" />
              <button type="submit" disabled={busy} className="btn btn-ghost text-sm">
                Fusionar
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovedRow({ effect, busy }: { effect: SerializedEffect; busy: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="card p-4">
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{effect.labelEs}</span>
              <span className="mono text-xs text-fg-dim">/ {effect.labelEn}</span>
            </div>
            <div className="mono text-xs text-fg-dim mt-0.5">{effect.key}</div>
          </div>
          <div className="flex items-center gap-3">
            {effect.usageCount > 0 && (
              <span className="mono text-xs text-fg-dim">{effect.usageCount} cepas</span>
            )}
            <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost text-xs">
              Editar
            </button>
          </div>
        </div>
      ) : (
        <Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="edit" />
          <input type="hidden" name="effectId" value={effect._id} />
          <div className="grid grid-cols-3 gap-2">
            <input name="labelEn" defaultValue={effect.labelEn} className="input text-sm" />
            <input name="labelEs" defaultValue={effect.labelEs} className="input text-sm" />
            <input name="labelPt" defaultValue={effect.labelPt} className="input text-sm" />
          </div>
          <div className="flex gap-2">
            <select name="category" defaultValue={effect.category} className="input text-sm">
              <option value="positive">Positivo</option>
              <option value="negative">Negativo</option>
            </select>
            <button type="submit" disabled={busy} className="btn btn-primary text-sm">Guardar</button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost text-sm">Cancelar</button>
          </div>
        </Form>
      )}
    </div>
  );
}
