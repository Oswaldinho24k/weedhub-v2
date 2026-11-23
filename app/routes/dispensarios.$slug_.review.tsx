import { requireFeature } from "~/lib/features";
import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/dispensarios.$slug_.review";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { ReviewModel } from "~/models/review.server";
import { recalculateEntityRatings, updateUserStats } from "~/services/review.service.server";
import { awardPoints, checkAndAwardBadges } from "~/services/gamification.service.server";
import { POINTS } from "~/constants/gamification";
import { RatingStars } from "~/components/composite/rating-stars";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.dispensary?.name || "dispensario";
  return buildMeta({
    title: `Reseña de ${name} | WeedHub`,
    description: `Comparte tu experiencia en ${name} en WeedHub.`,
    url: `${SITE_URL}/dispensarios/${data?.dispensary?.slug || ""}/review`,
    locale: "es",
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  requireFeature("negocios");
  const user = await requireUser(request);
  await connectDB();

  const dispensary = await DispensaryModel.findOne({ slug: params.slug, status: "active" }).lean();
  if (!dispensary) throw new Response("Dispensario no encontrado", { status: 404 });

  const existing = await ReviewModel.findOne({
    userId: user._id,
    entityType: "dispensary",
    entityId: dispensary._id,
  }).lean();

  return {
    dispensary: {
      _id: String(dispensary._id),
      name: dispensary.name,
      slug: dispensary.slug,
      city: dispensary.city,
      logo: dispensary.logo || null,
    },
    existingReview: existing
      ? {
          ratings: existing.ratings,
          comment: existing.comment,
          publishedAs: existing.publishedAs,
        }
      : null,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  requireFeature("negocios");
  const user = await requireUser(request);
  await connectDB();

  const dispensary = await DispensaryModel.findOne({ slug: params.slug, status: "active" });
  if (!dispensary) throw new Response("Dispensario no encontrado", { status: 404 });

  const formData = await request.formData();
  const overall = Number(formData.get("rating_overall")) || 1;

  const ratings = {
    overall,
    service: Number(formData.get("rating_service")) || undefined,
    atmosphere: Number(formData.get("rating_atmosphere")) || undefined,
    selection: Number(formData.get("rating_selection")) || undefined,
    value: Number(formData.get("rating_value")) || undefined,
  };

  const comment = String(formData.get("comment") || "").trim().slice(0, 500);
  const publishedAs = formData.get("publishedAs") === "username" ? "username" : "anonymous";

  const existing = await ReviewModel.findOne({
    userId: user._id,
    entityType: "dispensary",
    entityId: dispensary._id,
  });
  const isNew = !existing;

  if (existing) {
    existing.ratings = ratings as typeof existing.ratings;
    existing.comment = comment;
    await existing.save();
  } else {
    await ReviewModel.create({
      userId: user._id,
      entityType: "dispensary",
      entityId: dispensary._id,
      ratings,
      comment,
      publishedAs,
    });
  }

  await recalculateEntityRatings("dispensary", String(dispensary._id));
  await updateUserStats(String(user._id));

  if (isNew) {
    let points = POINTS.REVIEW_CREATED;
    if (comment.length > 0) points += POINTS.REVIEW_WITH_COMMENT;
    await awardPoints(String(user._id), points);
    await checkAndAwardBadges(String(user._id));
  }

  return redirect(`/dispensarios/${dispensary.slug}?reviewed=1`);
}

const MOODS = ["Sin calificar", "Mala", "Regular", "Buena", "Muy buena", "Excelente"]; // idx 0..5

export default function DispensarioReviewPage({ loaderData }: Route.ComponentProps) {
  const { dispensary, existingReview } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [step, setStep] = useState(0);
  const total = 2;

  const [overall, setOverall] = useState(existingReview?.ratings?.overall || 0);
  const [rService, setRService] = useState(existingReview?.ratings?.service || 0);
  const [rAtmosphere, setRAtmosphere] = useState(existingReview?.ratings?.atmosphere || 0);
  const [rSelection, setRSelection] = useState(existingReview?.ratings?.selection || 0);
  const [rValue, setRValue] = useState(existingReview?.ratings?.value || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [publishedAs, setPublishedAs] = useState<"username" | "anonymous">(
    existingReview?.publishedAs || "anonymous"
  );

  const canAdvance = step === 0 ? overall > 0 : true;

  const initials = dispensary.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Progress bar */}
      <div
        className="h-1 bg-sunken overflow-hidden"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemax={total}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${((step + 1) / total) * 100}%`, background: "var(--gold)" }}
        />
      </div>

      {/* Entity header */}
      <div className="mx-auto max-w-[760px] w-full px-6 pt-6">
        <div className="card p-4 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold border border-line"
            style={{
              background: dispensary.logo ? "var(--bg-elev)" : "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            {dispensary.logo ? (
              <img src={dispensary.logo} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{dispensary.name}</div>
            <div className="kicker">Dispensario · {dispensary.city}</div>
          </div>
          <Link
            to={`/dispensarios/${dispensary.slug}`}
            className="ml-auto text-xs text-fg-muted hover:text-fg"
          >
            Cancelar
          </Link>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-[760px] w-full px-6 py-10 fade-up">
        {step === 0 && (
          <div className="text-center">
            <h1 className="display text-4xl md:text-5xl mb-3">¿Cómo fue tu visita?</h1>
            <p className="text-fg-muted mb-8">
              Tu experiencia ayuda a la comunidad a encontrar los mejores dispensarios.
            </p>
            <div className="rotulo text-[44px] mb-6" aria-live="polite">
              {MOODS[Math.max(0, Math.min(5, Math.round(overall)))]}
            </div>
            <div className="flex justify-center mb-10">
              <RatingStars rating={overall} interactive size="xl" onChange={setOverall} />
            </div>
            <div className="card p-5 text-left space-y-4 max-w-[460px] mx-auto">
              <div className="kicker">Detalle (opcional)</div>
              <DetailRating label="Atención al cliente" value={rService} onChange={setRService} />
              <DetailRating label="Ambiente" value={rAtmosphere} onChange={setRAtmosphere} />
              <DetailRating label="Variedad / selección" value={rSelection} onChange={setRSelection} />
              <DetailRating label="Precio-valor" value={rValue} onChange={setRValue} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="display text-4xl mb-3">Cuéntanos más</h1>
            <p className="text-fg-muted mb-8">Opcional — una reseña ayuda a todos.</p>

            <div className="mb-6">
              <label className="kicker block mb-3" htmlFor="comment">
                Tu reseña{" "}
                <span className="text-fg-dim">({comment.length}/500)</span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="¿Cómo fue la experiencia? ¿Recomendarías este dispensario?"
                className="w-full rounded-md border border-line bg-raised px-4 py-3 text-sm focus:outline-none focus:border-accent resize-y"
              />
            </div>

            <div className="mb-6">
              <div className="kicker mb-3">¿Publicar como?</div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={publishedAs === "anonymous" ? "primary" : "ghost"}
                  onClick={() => setPublishedAs("anonymous")}
                >
                  <Icon name="user" size={14} />
                  Anónimo
                </Button>
                <Button
                  type="button"
                  variant={publishedAs === "username" ? "primary" : "ghost"}
                  onClick={() => setPublishedAs("username")}
                >
                  <Icon name="user" size={14} />
                  Con mi usuario
                </Button>
              </div>
            </div>

            <p className="text-xs text-fg-dim">
              Mantén un tono respetuoso. Las reseñas que violen nuestras normas serán removidas.
            </p>
          </div>
        )}
      </div>

      {/* Sticky footer nav */}
      <div className="border-t border-line bg-bg sticky bottom-0">
        <div className="mx-auto max-w-[760px] px-6 py-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <Icon name="arrowLeft" size={14} />
            Anterior
          </Button>
          <div className="mono text-xs text-fg-dim tnum">
            {step + 1} / {total}
          </div>
          {step < total - 1 ? (
            <Button
              type="button"
              variant="primary"
              disabled={!canAdvance}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            >
              Siguiente
              <Icon name="arrowRight" size={14} />
            </Button>
          ) : (
            <Form method="post">
              <input type="hidden" name="rating_overall" value={overall} />
              {rService > 0 && <input type="hidden" name="rating_service" value={rService} />}
              {rAtmosphere > 0 && <input type="hidden" name="rating_atmosphere" value={rAtmosphere} />}
              {rSelection > 0 && <input type="hidden" name="rating_selection" value={rSelection} />}
              {rValue > 0 && <input type="hidden" name="rating_value" value={rValue} />}
              <input type="hidden" name="comment" value={comment} />
              <input type="hidden" name="publishedAs" value={publishedAs} />
              <Button
                type="submit"
                variant="ghost"
                style={{ background: "var(--gold)", color: "oklch(22% 0.05 85)" }}
                disabled={isSubmitting || overall === 0}
              >
                {isSubmitting ? "Publicando..." : "Publicar reseña"}
                <Icon name="send" size={14} />
              </Button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-fg">{label}</span>
      <RatingStars rating={value} interactive size="md" onChange={onChange} />
    </div>
  );
}
