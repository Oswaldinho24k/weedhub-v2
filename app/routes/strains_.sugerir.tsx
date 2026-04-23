import { useEffect, useRef, useState } from "react";
import { Form, Link, redirect, useActionData, useFetcher, useNavigation } from "react-router";
import type { Route } from "./+types/strains_.sugerir";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { StrainSubmissionModel } from "~/models/strain-submission.server";
import { findStrainByNameOrAlias } from "~/lib/strain-search.server";
import { normalizeStrainSlug } from "~/lib/strain-name";
import { canUserSubmitStrain } from "~/lib/rate-limit.server";
import { moderateStrainSubmission } from "~/lib/moderation.server";
import {
  UploadError,
  uploadImage,
  validateImage,
} from "~/lib/cloudinary.server";
import { MAX_IMAGE_MB } from "~/lib/upload-config";
import { awardPoints } from "~/services/gamification.service.server";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Sugerir una cepa — WeedHub",
    description:
      "¿No encuentras la cepa? Sugiérela al equipo editorial. Revisamos cada propuesta.",
    url: `${SITE_URL}/strains/sugerir`,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

const URL_RE = /\bhttps?:\/\/|\bwww\./i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

function nameLooksBad(name: string): string | null {
  if (URL_RE.test(name)) return "El nombre no puede contener URLs.";
  if (PHONE_RE.test(name)) return "El nombre no puede contener números de teléfono.";
  const upperRatio =
    name.replace(/[^A-Z]/g, "").length / Math.max(1, name.length);
  if (upperRatio > 0.6 && name.length > 6) {
    return "Evita escribir el nombre en mayúsculas.";
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();
  const form = await request.formData();

  // Honeypot: if the hidden field is non-empty, silently "succeed".
  if (String(form.get("website") || "").length > 0) {
    return redirect("/strains/sugerir?ok=1");
  }

  const name = String(form.get("name") || "").trim();
  const type = String(form.get("type") || "unknown") as
    | "sativa"
    | "indica"
    | "hybrid"
    | "unknown";
  const lineage = String(form.get("lineage") || "").trim();
  const description = String(form.get("description") || "").trim();
  const sourceUrl = String(form.get("sourceUrl") || "").trim();
  const reasoning = String(form.get("reasoning") || "").trim();
  const overrideDup = form.get("overrideDuplicate") === "on";

  if (name.length < 3 || name.length > 80) {
    return { error: "El nombre debe tener entre 3 y 80 caracteres." };
  }
  const nameIssue = nameLooksBad(name);
  if (nameIssue) return { error: nameIssue };
  if (reasoning.length < 20) {
    return {
      error: "Explícanos por qué debería estar (mínimo 20 caracteres).",
    };
  }
  if (!["sativa", "indica", "hybrid", "unknown"].includes(type)) {
    return { error: "Tipo inválido." };
  }

  // Rate limit
  const gate = await canUserSubmitStrain(String(user._id));
  if (!gate.ok) {
    return {
      error: `Alcanzaste el límite semanal de 3 sugerencias. Puedes volver a intentar el ${gate.retryAfter.toLocaleDateString("es-MX")}.`,
    };
  }

  const normalizedName = normalizeStrainSlug(name);

  // Dedup: exact match
  const existing = await findStrainByNameOrAlias(name);
  if (existing && !overrideDup) {
    return {
      duplicateFound: {
        strainName: existing.strain.name,
        strainSlug: existing.strain.slug,
        matchedAlias: existing.matchedAlias || null,
      },
    };
  }

  // Pending-submission dedup (same normalizedName, not yet acted on)
  const pending = await StrainSubmissionModel.findOne({
    normalizedName,
    status: { $in: ["pending"] },
  });
  if (pending) {
    return {
      error:
        "Alguien ya sugirió esta cepa y la tenemos en revisión. Te avisaremos cuando se resuelva.",
    };
  }

  // Optional photo upload
  let photo: string | undefined;
  const photoFile = form.get("photoFile");
  try {
    if (photoFile instanceof File && validateImage(photoFile)) {
      photo = await uploadImage(photoFile, {
        folder: "weedhub/submissions",
        transformation: "c_fill,w_1200,h_900,q_auto",
      });
    }
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  // LLM moderation
  const mod = await moderateStrainSubmission({
    name,
    type,
    lineage: lineage || undefined,
    description: description || undefined,
    reasoning,
    sourceUrl: sourceUrl || undefined,
  });

  const status = mod.safe ? "pending" : "rejected_auto";

  const submission = await StrainSubmissionModel.create({
    submittedBy: user._id,
    name,
    normalizedName,
    type,
    lineage: lineage || undefined,
    description: description || undefined,
    sourceUrl: sourceUrl || undefined,
    reasoning,
    photo,
    status,
    potentialDuplicateStrainId: overrideDup && existing ? existing.strain._id : undefined,
    userOverrodeDuplicate: overrideDup,
    moderationNotes: mod.reasons.length ? mod.reasons.join("; ") : undefined,
  });

  if (status === "pending") {
    await awardPoints(String(user._id), 2); // small nudge for contributing
  }

  return redirect(`/strains/sugerir?submitted=${submission._id}`);
}

interface SearchResponse {
  exact: {
    name: string;
    slug: string;
    aliases: string[];
    matchedBy: "slug" | "alias" | "fuzzy";
    matchedAlias: string | null;
  } | null;
  fuzzy: Array<{ name: string; slug: string; distance: number }>;
  pendingSubmission: { name: string; status: string } | null;
}

export default function SugerirStrainPage({ loaderData }: Route.ComponentProps) {
  const t = useT();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const searchFetcher = useFetcher<SearchResponse>();

  const [name, setName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const value = name.trim();
    if (value.length < 2) return;
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams({ q: value });
      searchFetcher.load(`/api/strain-search?${params}`);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const submitted = new URL(
    typeof window !== "undefined" ? window.location.href : "http://x"
  ).searchParams.get("submitted");

  if (submitted) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-20 text-center">
        <div
          className="h-14 w-14 mx-auto mb-5 rounded-full grid place-items-center"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon name="check" size={24} strokeWidth={2.4} />
        </div>
        <h1 className="display text-4xl mb-3">{t.suggest.successTitle}</h1>
        <p className="text-fg-muted mb-8">{t.suggest.successBody}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/strains" className="btn btn-primary">
            {t.suggest.backToDirectory}
            <Icon name="arrowRight" size={14} />
          </Link>
          <Link to="/profile" className="btn btn-ghost">
            {t.suggest.viewMySubmissions}
          </Link>
        </div>
      </div>
    );
  }

  const exact = searchFetcher.data?.exact;
  const fuzzy = searchFetcher.data?.fuzzy || [];
  const pendingSub = searchFetcher.data?.pendingSubmission;
  const hasDup = actionData && "duplicateFound" in actionData && actionData.duplicateFound;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <Link
        to="/strains"
        className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-6"
      >
        <Icon name="arrowLeft" size={14} />
        {t.suggest.backLink}
      </Link>

      <div className="kicker mb-2">{t.suggest.kicker}</div>
      <h1 className="display text-4xl md:text-5xl mb-4">{t.suggest.title}</h1>
      <p className="text-fg-muted mb-10 max-w-[52ch]">{t.suggest.body}</p>

      {/* Live search */}
      <div className="card p-5 mb-6">
        <label className="kicker block mb-2" htmlFor="name-search">
          {t.suggest.nameLabel}
        </label>
        <div className="flex items-center gap-3 rounded-md border border-line bg-raised px-3.5 h-11 focus-within:border-accent transition-colors">
          <Icon name="search" size={16} className="text-fg-dim" />
          <input
            id="name-search"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.suggest.namePlaceholder}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {exact && (
          <div
            className="mt-4 rounded-md border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--accent)",
              background: "var(--accent-soft)",
            }}
          >
            <div className="flex items-start gap-3">
              <Icon name="check" size={16} className="mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">
                  {exact.matchedBy === "alias"
                    ? t.suggest.matchedAlias
                        .replace("{alias}", exact.matchedAlias || "")
                        .replace("{name}", exact.name)
                    : t.suggest.matchedExact.replace("{name}", exact.name)}
                </div>
                <Link
                  to={`/strains/${exact.slug}`}
                  className="text-accent underline text-sm mt-1 inline-flex items-center gap-1"
                >
                  {t.suggest.goToStrain}
                  <Icon name="arrowRight" size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {!exact && fuzzy.length > 0 && (
          <div className="mt-4 text-sm text-fg-muted">
            <div className="kicker mb-2">{t.suggest.didYouMean}</div>
            <ul className="flex flex-wrap gap-2">
              {fuzzy.map((f) => (
                <li key={f.slug}>
                  <Link
                    to={`/strains/${f.slug}`}
                    className="pill hover:bg-elev transition-colors"
                  >
                    {f.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!exact && pendingSub && (
          <div className="mt-4 rounded-md px-4 py-3 text-sm"
               style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>
            {t.suggest.alreadyPending.replace("{name}", pendingSub.name)}
          </div>
        )}
      </div>

      {/* Duplicate-on-submit warning */}
      {hasDup && actionData?.duplicateFound && (
        <div
          className="card p-5 mb-6"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent-soft)",
          }}
        >
          <div className="kicker mb-2">{t.suggest.dupWarningKicker}</div>
          <p className="text-sm mb-3">
            {actionData.duplicateFound.matchedAlias
              ? t.suggest.matchedAlias
                  .replace(
                    "{alias}",
                    actionData.duplicateFound.matchedAlias || ""
                  )
                  .replace("{name}", actionData.duplicateFound.strainName)
              : t.suggest.matchedExact.replace(
                  "{name}",
                  actionData.duplicateFound.strainName
                )}
          </p>
          <Link
            to={`/strains/${actionData.duplicateFound.strainSlug}`}
            className="btn btn-primary !py-1.5 !px-3 text-xs inline-flex mr-2"
          >
            {t.suggest.goToStrain}
          </Link>
          <span className="text-xs text-fg-muted">
            {t.suggest.orContinue}
          </span>
        </div>
      )}

      {/* Form */}
      <Form method="post" encType="multipart/form-data" className="card p-6 space-y-5">
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          aria-hidden
        />

        <input type="hidden" name="name" value={name} />
        {hasDup && actionData?.duplicateFound && (
          <label className="inline-flex items-start gap-2 text-xs text-fg-muted cursor-pointer">
            <input
              type="checkbox"
              name="overrideDuplicate"
              className="mt-0.5 accent-[color:var(--warm)]"
            />
            <span>{t.suggest.overrideDup}</span>
          </label>
        )}

        <div>
          <label className="kicker block mb-2" htmlFor="type">
            {t.suggest.typeLabel}
          </label>
          <select
            id="type"
            name="type"
            defaultValue="unknown"
            className="w-full h-11 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
          >
            <option value="unknown">{t.suggest.typeUnknown}</option>
            <option value="sativa">{t.strainTypes.sativa}</option>
            <option value="indica">{t.strainTypes.indica}</option>
            <option value="hybrid">{t.strainTypes.hybrid}</option>
          </select>
        </div>

        <div>
          <label className="kicker block mb-2" htmlFor="reasoning">
            {t.suggest.reasoningLabel}
          </label>
          <textarea
            id="reasoning"
            name="reasoning"
            rows={3}
            minLength={20}
            maxLength={500}
            required
            placeholder={t.suggest.reasoningPlaceholder}
            className="w-full rounded-md border border-line bg-raised px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-y"
          />
          <p className="text-xs text-fg-dim mt-1">{t.suggest.reasoningHint}</p>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg inline-flex items-center gap-1">
            <Icon name="chevronRight" size={14} className="group-open:rotate-90 transition-transform" />
            {t.suggest.moreFields}
          </summary>

          <div className="mt-4 space-y-5 border-l border-line pl-4">
            <div>
              <label className="kicker block mb-2" htmlFor="lineage">
                {t.suggest.lineageLabel}
              </label>
              <input
                id="lineage"
                name="lineage"
                maxLength={200}
                placeholder="Chemdawg × Hindu Kush"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="kicker block mb-2" htmlFor="description">
                {t.suggest.descriptionLabel}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                className="w-full rounded-md border border-line bg-raised px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-y"
              />
            </div>

            <div>
              <label className="kicker block mb-2" htmlFor="sourceUrl">
                {t.suggest.sourceUrlLabel}
              </label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                type="url"
                maxLength={500}
                placeholder="https://…"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="kicker block mb-2" htmlFor="photoFile">
                {t.suggest.photoLabel}
              </label>
              <input
                id="photoFile"
                name="photoFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block text-xs text-fg-muted file:mr-3 file:border-0 file:bg-elev file:px-3 file:py-1.5 file:rounded file:text-fg file:cursor-pointer"
              />
              <p className="text-xs text-fg-dim mt-1">
                {t.suggest.photoHint.replace("{max}", String(MAX_IMAGE_MB))}
              </p>
            </div>
          </div>
        </details>

        {actionData && "error" in actionData && actionData.error && (
          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
          >
            {actionData.error}
          </div>
        )}

        <div className="flex gap-3 items-center pt-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || name.trim().length < 3 || !!exact}
          >
            {isSubmitting ? t.common.sending : t.suggest.submit}
            <Icon name="arrowRight" size={14} />
          </button>
          <Link to="/strains" className="btn btn-ghost">
            {t.common.cancel}
          </Link>
        </div>

        <p className="text-[11px] text-fg-dim">{t.suggest.disclaimer}</p>
      </Form>
    </div>
  );
}
