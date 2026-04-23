import { Form, Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.submissions";
import { connectDB } from "~/lib/db.server";
import { requireAdmin } from "~/lib/auth.server";
import { StrainSubmissionModel } from "~/models/strain-submission.server";
import { StrainModel } from "~/models/strain.server";
import {
  findStrainByNameOrAlias,
  fuzzyStrainSuggestions,
} from "~/lib/strain-search.server";
import { normalizeStrainSlug } from "~/lib/strain-name";
import { awardPoints } from "~/services/gamification.service.server";
import { slugify } from "~/lib/utils";
import { Icon } from "~/components/ui/icon";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();

  const submissions = await StrainSubmissionModel.find({
    status: { $in: ["pending", "rejected_auto"] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("submittedBy", "username anonymousHandle")
    .populate("potentialDuplicateStrainId", "name slug")
    .lean();

  // Attach fuzzy suggestions per submission
  const withSuggestions = await Promise.all(
    submissions.map(async (s) => {
      const exact = await findStrainByNameOrAlias(s.name);
      const fuzzy = exact ? [] : await fuzzyStrainSuggestions(s.name, 3);
      return {
        _id: String(s._id),
        name: s.name,
        type: s.type,
        lineage: s.lineage,
        description: s.description,
        sourceUrl: s.sourceUrl,
        reasoning: s.reasoning,
        photo: s.photo,
        status: s.status,
        moderationNotes: s.moderationNotes,
        userOverrodeDuplicate: s.userOverrodeDuplicate,
        createdAt: s.createdAt.toISOString(),
        submittedBy: s.submittedBy
          ? {
              username: (s.submittedBy as any).username,
              anonymousHandle: (s.submittedBy as any).anonymousHandle,
            }
          : null,
        submittedById: String(s.submittedBy?._id || s.submittedBy),
        exactMatch: exact
          ? {
              name: exact.strain.name,
              slug: exact.strain.slug,
              matchedAlias: exact.matchedAlias,
            }
          : null,
        fuzzy: fuzzy.map((f) => ({
          name: f.strain.name,
          slug: f.strain.slug,
          distance: f.distance,
        })),
      };
    })
  );

  return { submissions: withSuggestions };
}

export async function action({ request }: Route.ActionArgs) {
  const admin = await requireAdmin(request);
  await connectDB();
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const submissionId = String(form.get("submissionId"));

  const sub = await StrainSubmissionModel.findById(submissionId);
  if (!sub) return { error: "Sugerencia no encontrada." };

  if (intent === "approve") {
    const thcMax = Number(form.get("thcMax") || 0);
    const cbdMax = Number(form.get("cbdMax") || 0);

    const slug = slugify(sub.name);
    const exists = await StrainModel.findOne({ slug });
    if (exists) {
      return { error: `Ya existe una cepa con slug ${slug}. Usa "Merge as alias".` };
    }

    const strain = await StrainModel.create({
      name: sub.name,
      slug,
      type: sub.type === "unknown" ? "hybrid" : sub.type,
      description: sub.description || sub.reasoning,
      descriptionEs: sub.description || sub.reasoning,
      lineage: sub.lineage,
      cannabinoidProfile: {
        thc: { min: 0, max: thcMax },
        cbd: { min: 0, max: cbdMax },
      },
      effects: [],
      flavors: [],
      imageUrl: sub.photo,
      isArchived: false,
    });

    sub.status = "approved";
    sub.reviewedBy = admin._id as any;
    sub.reviewedAt = new Date();
    sub.linkedStrainId = strain._id as any;
    await sub.save();

    await awardPoints(String(sub.submittedBy), 10);
    return { success: `Cepa "${sub.name}" creada y aprobada. +10 pts al usuario.` };
  }

  if (intent === "reject") {
    const reason = String(form.get("reason") || "").trim();
    sub.status = "rejected";
    sub.reviewedBy = admin._id as any;
    sub.reviewedAt = new Date();
    sub.rejectionReason = reason || undefined;
    await sub.save();
    return { success: "Sugerencia rechazada." };
  }

  if (intent === "merge-alias") {
    const targetStrainId = String(form.get("targetStrainId") || "");
    const target = await StrainModel.findById(targetStrainId);
    if (!target) return { error: "Cepa destino no encontrada." };

    const aliases = target.aliases || [];
    if (!aliases.some((a) => normalizeStrainSlug(a) === normalizeStrainSlug(sub.name))) {
      aliases.push(sub.name);
    }
    target.aliases = aliases;
    target.aliasSlugs = aliases.map((a) => normalizeStrainSlug(a));
    await target.save();

    sub.status = "merged_as_alias";
    sub.reviewedBy = admin._id as any;
    sub.reviewedAt = new Date();
    sub.linkedStrainId = target._id as any;
    await sub.save();

    await awardPoints(String(sub.submittedBy), 5);
    return {
      success: `"${sub.name}" agregado como alias de ${target.name}. +5 pts al usuario.`,
    };
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
        <button
          type="button"
          onClick={() => setMode(mode === "approve" ? "" : "approve")}
          className="btn btn-primary !py-1.5 !px-3 text-xs"
        >
          <Icon name="check" size={12} />
          Aprobar → crear cepa
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "merge" ? "" : "merge")}
          className="btn btn-ghost !py-1.5 !px-3 text-xs"
        >
          <Icon name="plus" size={12} />
          Es alias de…
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "reject" ? "" : "reject")}
          className="btn btn-ghost !py-1.5 !px-3 text-xs"
          style={{ color: "var(--warm)" }}
        >
          <Icon name="x" size={12} />
          Rechazar
        </button>
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
          <button
            type="submit"
            className="btn btn-primary !py-1.5 !px-3 text-xs"
            disabled={busy}
          >
            {busy ? "Creando…" : "Crear y aprobar"}
          </button>
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
          <button
            type="submit"
            className="btn btn-warm !py-1.5 !px-3 text-xs"
            disabled={busy}
          >
            {busy ? "…" : "Confirmar rechazo"}
          </button>
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
      <button
        type="submit"
        className="btn btn-primary !py-1.5 !px-3 text-xs"
        disabled={busy || !strainIdInput}
      >
        {busy ? "…" : "Agregar como alias"}
      </button>
    </Form>
  );
}
