import { Form, Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.submissions";
import { requireAdmin } from "~/lib/auth.server";
import { listSubmissions, approveSubmission, rejectSubmission, mergeSubmissionAsAlias } from "~/services/strains.server";
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return { submissions: await listSubmissions() };
}

// HTTP adapter only: all logic lives in services/strains.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  const admin = await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const submissionId = String(form.get("submissionId"));
  const reviewerId = String(admin._id);

  if (intent === "approve") {
    const r = await approveSubmission(submissionId, { thcMax: String(form.get("thcMax") || 0), cbdMax: String(form.get("cbdMax") || 0) }, reviewerId);
    return r.ok ? { success: r.message } : { error: r.error };
  }
  if (intent === "reject") {
    const r = await rejectSubmission(submissionId, String(form.get("reason") || ""), reviewerId);
    return r.ok ? { success: r.message } : { error: r.error };
  }
  if (intent === "merge-alias") {
    const r = await mergeSubmissionAsAlias(submissionId, String(form.get("targetStrainId") || ""), reviewerId);
    return r.ok ? { success: r.message } : { error: r.error };
  }
  return { error: "Acción inválida." };
}

const TYPE_LABEL: Record<string, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
  unknown: "No sabe",
};

export default function AdminSubmissionsPage({
  loaderData,
}: Route.ComponentProps) {
  const { submissions } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="display text-2xl">Cola de sugerencias ({submissions.length})</h2>
        <Link to="/admin/strains" className="text-sm text-fg-muted hover:text-fg">
          Ver catálogo →
        </Link>
      </div>

      {actionData && "success" in actionData && actionData.success && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{ background: "var(--accent-soft)", color: "var(--fg)" }}
        >
          {actionData.success}
        </div>
      )}
      {actionData && "error" in actionData && actionData.error && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
        >
          {actionData.error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="card p-10 text-center text-fg-muted">
          Sin sugerencias pendientes.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <SubmissionCard key={s._id} submission={s} />
          ))}
        </div>
      )}
    </div>
  );
}

type SubmissionRow = Awaited<
  ReturnType<typeof loader>
>["submissions"][number];

function SubmissionCard({ submission: s }: { submission: SubmissionRow }) {
  const [mode, setMode] = useState<"" | "approve" | "reject" | "merge">("");
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";

  return (
    <article className="card p-5 space-y-4">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h3 className="display text-xl">{s.name}</h3>
            <span className="pill">{TYPE_LABEL[s.type] || s.type}</span>
            {s.status === "rejected_auto" && (
              <span className="pill warm" title={s.moderationNotes || ""}>
                Auto-flagged
              </span>
            )}
            {s.userOverrodeDuplicate && (
              <span className="pill warm">Override duplicado</span>
            )}
          </div>
          <div className="text-xs text-fg-dim">
            por{" "}
            {s.submittedBy?.username ? (
              <Link
                to={`/profile/${s.submittedBy.username}`}
                className="underline hover:text-fg"
              >
                @{s.submittedBy.username}
              </Link>
            ) : (
              "—"
            )}{" "}
            · {formatDate(s.createdAt)}
          </div>
        </div>
        {s.photo && (
          <img
            src={s.photo}
            alt=""
            className="h-16 w-16 rounded-md object-cover border border-line"
          />
        )}
      </header>

      <div className="text-sm">
        <div className="kicker mb-1">Razonamiento</div>
        <p className="text-fg-muted">{s.reasoning}</p>
      </div>

      {(s.lineage || s.description || s.sourceUrl) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {s.lineage && (
            <div>
              <div className="kicker">Genética</div>
              <div className="text-fg-muted">{s.lineage}</div>
            </div>
          )}
          {s.description && (
            <div className="md:col-span-2">
              <div className="kicker">Descripción</div>
              <div className="text-fg-muted">{s.description}</div>
            </div>
          )}
          {s.sourceUrl && (
            <div>
              <div className="kicker">Fuente</div>
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent underline break-all"
              >
                {s.sourceUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {s.exactMatch && (
        <div
          className="rounded-md px-3 py-2 text-xs"
          style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
        >
          ⚠️ Coincide con cepa existente:{" "}
          <Link
            to={`/strains/${s.exactMatch.slug}`}
            className="underline"
          >
            {s.exactMatch.name}
          </Link>
          {s.exactMatch.matchedAlias && ` (alias: ${s.exactMatch.matchedAlias})`}
        </div>
      )}

      {!s.exactMatch && s.fuzzy.length > 0 && (
        <div className="text-xs text-fg-muted">
          Parecidas:{" "}
          {s.fuzzy.map((f, i) => (
            <span key={f.slug}>
              <Link to={`/strains/${f.slug}`} className="underline">
                {f.name}
              </Link>
              {i < s.fuzzy.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap pt-2 border-t border-line">
        <Button
          type="button"
          onClick={() => setMode(mode === "approve" ? "" : "approve")}
          variant="primary"
          size="sm"
        >
          <Icon name="check" size={12} />
          Aprobar → crear cepa
        </Button>
        <Button
          type="button"
          onClick={() => setMode(mode === "merge" ? "" : "merge")}
          variant="ghost"
          size="sm"
        >
          <Icon name="plus" size={12} />
          Es alias de…
        </Button>
        <Button
          type="button"
          onClick={() => setMode(mode === "reject" ? "" : "reject")}
          variant="ghost"
          size="sm"
          style={{ color: "var(--warm)" }}
        >
          <Icon name="x" size={12} />
          Rechazar
        </Button>
      </div>

      {mode === "approve" && (
        <Form method="post" className="space-y-3 border-t border-line pt-4">
          <input type="hidden" name="intent" value="approve" />
          <input type="hidden" name="submissionId" value={s._id} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="kicker block mb-1">THC max %</span>
              <input
                name="thcMax"
                type="number"
                step="0.1"
                defaultValue="0"
                className="w-full h-9 rounded-md border border-line bg-raised px-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="kicker block mb-1">CBD max %</span>
              <input
                name="cbdMax"
                type="number"
                step="0.1"
                defaultValue="0"
                className="w-full h-9 rounded-md border border-line bg-raised px-2 text-sm"
              />
            </label>
          </div>
          <p className="text-xs text-fg-dim">
            Se crea la cepa con los datos de la sugerencia. Después podrás editarla
            desde <Link to="/admin/strains" className="underline">Cepas</Link> para
            llenar terpenos, efectos, timeCurve, etc.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={busy}
          >
            {busy ? "Creando…" : "Crear y aprobar"}
          </Button>
        </Form>
      )}

      {mode === "reject" && (
        <Form method="post" className="space-y-3 border-t border-line pt-4">
          <input type="hidden" name="intent" value="reject" />
          <input type="hidden" name="submissionId" value={s._id} />
          <label className="block text-xs">
            <span className="kicker block mb-1">Motivo (opcional)</span>
            <textarea
              name="reason"
              rows={2}
              maxLength={300}
              placeholder="Se le envía al usuario como feedback"
              className="w-full rounded-md border border-line bg-raised px-3 py-2 text-sm resize-y"
            />
          </label>
          <Button
            type="submit"
            variant="warm"
            size="sm"
            disabled={busy}
          >
            {busy ? "…" : "Confirmar rechazo"}
          </Button>
        </Form>
      )}

      {mode === "merge" && (
        <MergeAliasForm submissionId={s._id} suggestedStrains={s.fuzzy} />
      )}
    </article>
  );
}

function MergeAliasForm({
  submissionId,
  suggestedStrains,
}: {
  submissionId: string;
  suggestedStrains: { name: string; slug: string; distance: number }[];
}) {
  const [strainIdInput, setStrainIdInput] = useState("");
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";

  return (
    <Form method="post" className="space-y-3 border-t border-line pt-4">
      <input type="hidden" name="intent" value="merge-alias" />
      <input type="hidden" name="submissionId" value={submissionId} />
      <label className="block text-xs">
        <span className="kicker block mb-1">ID de la cepa destino</span>
        <input
          name="targetStrainId"
          value={strainIdInput}
          onChange={(e) => setStrainIdInput(e.target.value)}
          placeholder="ObjectId (copia desde /admin/strains)"
          className="w-full h-9 rounded-md border border-line bg-raised px-2 text-sm mono"
          required
        />
      </label>
      {suggestedStrains.length > 0 && (
        <p className="text-xs text-fg-dim">
          Parecidas en el catálogo:{" "}
          {suggestedStrains.map((s, i) => (
            <span key={s.slug}>
              <Link to={`/strains/${s.slug}`} className="underline" target="_blank">
                {s.name}
              </Link>
              {i < suggestedStrains.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={busy || !strainIdInput}
      >
        {busy ? "…" : "Agregar como alias"}
      </Button>
    </Form>
  );
}
