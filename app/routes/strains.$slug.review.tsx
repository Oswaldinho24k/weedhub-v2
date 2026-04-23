import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/strains.$slug.review";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { recalculateStrainRatings, updateUserStats } from "~/services/review.service.server";
import { awardPoints, checkAndAwardBadges } from "~/services/gamification.service.server";
import { POINTS } from "~/constants/gamification";
import { RatingStars } from "~/components/composite/rating-stars";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { cn } from "~/lib/utils";

const POSITIVE_EFFECTS = [
  "Relajado", "Feliz", "Creativo", "Euforia",
  "Enérgico", "Concentrado", "Hablador", "Risa",
];
const NEGATIVE_EFFECTS = [
  "Hambre", "Boca seca", "Ojos rojos",
  "Mareo", "Paranoia", "Ansiedad",
];
const METHODS = ["Fumado", "Vaporizado", "Comestible", "Concentrado"];
const TIMES = ["Mañana", "Tarde", "Noche"];
const SITUATIONS = ["Solo", "Con amigos", "Creativo", "Descanso"];
const FLAVORS = [
  "Arándano", "Dulce", "Terroso", "Pino", "Cítrico", "Pimienta",
  "Especia", "Baya", "Vainilla", "Menta", "Tropical", "Diesel",
  "Caramelo", "Miel", "Uva",
];
const FREQUENCIES = ["Primera vez", "2–5 veces", "Semanal", "Frecuente"];

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Reseñar ${data?.strain?.name || "cepa"} — WeedHub` }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  await connectDB();
  const strain = await StrainModel.findOne({ slug: params.slug }).lean();
  if (!strain) throw new Response("Cepa no encontrada", { status: 404 });

  const existing = await ReviewModel.findOne({
    userId: user._id,
    strainId: strain._id,
  }).lean();

  return {
    strain: {
      _id: String(strain._id),
      name: strain.name,
      slug: strain.slug,
      type: strain.type,
      typeBlend: strain.typeBlend,
      lineage: strain.lineage,
      colorHint: strain.colorHint,
    },
    existingReview: existing
      ? {
          ratings: existing.ratings,
          comment: existing.comment,
          context: existing.context,
          effectsExperienced: existing.effectsExperienced,
        }
      : null,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();
  const strain = await StrainModel.findOne({ slug: params.slug });
  if (!strain) throw new Response("Cepa no encontrada", { status: 404 });

  const formData = await request.formData();

  const overall = Number(formData.get("rating_overall")) || 3;
  const ratings = {
    overall,
    potency: Number(formData.get("rating_potency")) || overall,
    flavor: Number(formData.get("rating_flavor")) || overall,
    aroma: Number(formData.get("rating_aroma")) || overall,
    appearance: Number(formData.get("rating_appearance")) || overall,
    effects: Number(formData.get("rating_effects")) || overall,
  };

  const comment = String(formData.get("comment") || "");
  const method = String(formData.get("method") || "");
  const timeOfDay = String(formData.get("timeOfDay") || "");
  const setting = String(formData.get("setting") || "");
  const effectsExperienced = formData.getAll("effectsExperienced").map(String);

  const existing = await ReviewModel.findOne({ userId: user._id, strainId: strain._id });
  const isNew = !existing;

  const publishedAs = user.publishAsAnonymous === false ? "username" : "anonymous";

  if (existing) {
    existing.ratings = ratings;
    existing.comment = comment;
    existing.context = { method, timeOfDay, setting };
    existing.effectsExperienced = effectsExperienced;
    // publishedAs stays as originally set — snapshot is preserved
    await existing.save();
  } else {
    await ReviewModel.create({
      userId: user._id,
      strainId: strain._id,
      ratings,
      comment,
      context: { method, timeOfDay, setting },
      effectsExperienced,
      publishedAs,
    });
  }

  await recalculateStrainRatings(String(strain._id));
  await updateUserStats(String(user._id));

  if (isNew) {
    let points = POINTS.REVIEW_CREATED;
    if (comment.length > 0) points += POINTS.REVIEW_WITH_COMMENT;
    await awardPoints(String(user._id), points);
    await checkAndAwardBadges(String(user._id));
  }

  return redirect(`/strains/${strain.slug}?reviewed=1`);
}

const MOODS = ["😶", "🙁", "😐", "🙂", "🤩", "🤯"]; // idx 0..5

export default function ReviewPage({ loaderData }: Route.ComponentProps) {
  const { strain, existingReview } = loaderData;
  const t = useT();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [step, setStep] = useState(0);
  const total = 5;

  const [overall, setOverall] = useState(existingReview?.ratings?.overall || 0);
  const [rFlavor, setRFlavor] = useState(existingReview?.ratings?.flavor || 0);
  const [rPotency, setRPotency] = useState(existingReview?.ratings?.potency || 0);
  const [rEffects, setREffects] = useState(existingReview?.ratings?.effects || 0);

  const [method, setMethod] = useState(existingReview?.context?.method || "");
  const [timeOfDay, setTimeOfDay] = useState(existingReview?.context?.timeOfDay || "");
  const [setting, setSetting] = useState(existingReview?.context?.setting || "");
  const [effects, setEffects] = useState<string[]>(
    existingReview?.effectsExperienced || []
  );
  const [flavors, setFlavors] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [recommend, setRecommend] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState(existingReview?.comment || "");

  const toggle = (list: string[], v: string, set: (n: string[]) => void) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const canAdvance = [
    overall > 0,
    !!method && !!timeOfDay,
    true,
    true,
    true,
  ][step];

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <div
        className="h-1 bg-sunken overflow-hidden"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemax={total}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${((step + 1) / total) * 100}%`,
            background: "var(--gold)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[760px] w-full px-6 pt-6">
        <div className="card p-4 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-md shrink-0"
            style={{ background: strain.colorHint || "var(--bg-elev)" }}
            aria-hidden
          />
          <div>
            <div className="text-sm font-medium">{strain.name}</div>
            <div className="kicker">
              {strain.typeBlend || strain.type}
              {strain.lineage && ` · ${strain.lineage}`}
            </div>
          </div>
          <Link
            to={`/strains/${strain.slug}`}
            className="ml-auto text-xs text-fg-muted hover:text-fg"
          >
            {t.review.cancelStep}
          </Link>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-[760px] w-full px-6 py-10 fade-up">
        {step === 0 && (
          <div className="text-center">
            <h1 className="display text-4xl md:text-5xl mb-3">{t.review.ratingTitle}</h1>
            <p className="text-fg-muted mb-8">{t.review.ratingBody}</p>
            <div className="text-6xl mb-6" aria-hidden>
              {MOODS[Math.max(0, Math.min(5, Math.round(overall)))]}
            </div>
            <div className="flex justify-center mb-10">
              <RatingStars
                rating={overall}
                interactive
                size="xl"
                onChange={setOverall}
              />
            </div>
            <div className="card p-5 text-left space-y-4 max-w-[460px] mx-auto">
              <div className="kicker">{t.review.detailedRating}</div>
              <DetailRating label={t.review.detailedEffect} value={rEffects} onChange={setREffects} />
              <DetailRating label={t.review.detailedFlavor} value={rFlavor} onChange={setRFlavor} />
              <DetailRating label={t.review.detailedPotency} value={rPotency} onChange={setRPotency} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="display text-4xl mb-3">{t.review.contextTitle}</h1>
            <p className="text-fg-muted mb-8">{t.review.contextBody}</p>
            <ChipSection
              label={t.review.contextMethod}
              options={METHODS}
              selected={method ? [method] : []}
              onToggle={(v) => setMethod(method === v ? "" : v)}
              tone="accent"
            />
            <ChipSection
              label={t.review.contextTime}
              options={TIMES}
              selected={timeOfDay ? [timeOfDay] : []}
              onToggle={(v) => setTimeOfDay(timeOfDay === v ? "" : v)}
              tone="accent"
            />
            <ChipSection
              label={t.review.contextSetting}
              options={SITUATIONS}
              selected={setting ? [setting] : []}
              onToggle={(v) => setSetting(setting === v ? "" : v)}
              tone="accent"
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="display text-4xl mb-3">{t.review.effectsTitle}</h1>
            <p className="text-fg-muted mb-8">{t.review.effectsBody}</p>
            <div className="mb-8">
              <div className="kicker flex items-center gap-2 mb-3" style={{ color: "var(--accent)" }}>
                <Icon name="smile" size={14} />
                {t.review.effectsPositive}
              </div>
              <div className="flex flex-wrap gap-2">
                {POSITIVE_EFFECTS.map((e) => (
                  <ChipButton
                    key={e}
                    active={effects.includes(e)}
                    tone="accent"
                    onClick={() => toggle(effects, e, setEffects)}
                  >
                    {e}
                  </ChipButton>
                ))}
              </div>
            </div>
            <div>
              <div className="kicker flex items-center gap-2 mb-3" style={{ color: "var(--warm)" }}>
                <Icon name="alert" size={14} />
                {t.review.effectsNegative}
              </div>
              <div className="flex flex-wrap gap-2">
                {NEGATIVE_EFFECTS.map((e) => (
                  <ChipButton
                    key={e}
                    active={effects.includes(e)}
                    tone="warm"
                    onClick={() => toggle(effects, e, setEffects)}
                  >
                    {e}
                  </ChipButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="display text-4xl mb-3">{t.review.flavorsTitle}</h1>
            <p className="text-fg-muted mb-8">{t.review.flavorsBody}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-[560px] mx-auto">
              {FLAVORS.map((f) => (
                <ChipButton
                  key={f}
                  active={flavors.includes(f)}
                  onClick={() => toggle(flavors, f, setFlavors)}
                >
                  {f}
                </ChipButton>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="display text-4xl mb-3">{t.review.detailsTitle}</h1>
            <p className="text-fg-muted mb-8">{t.review.detailsBody}</p>

            <div className="mb-6">
              <div className="kicker mb-3">{t.review.frequencyQuestion}</div>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIES.map((f) => (
                  <ChipButton
                    key={f}
                    active={frequency === f}
                    onClick={() => setFrequency(frequency === f ? "" : f)}
                  >
                    {f}
                  </ChipButton>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="kicker mb-3">{t.review.recommendQuestion}</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRecommend("up")}
                  className={cn(
                    "btn",
                    recommend === "up" ? "btn-primary" : "btn-ghost"
                  )}
                >
                  <Icon name="thumbUp" size={14} /> {t.review.recommendYes}
                </button>
                <button
                  type="button"
                  onClick={() => setRecommend("down")}
                  className={cn(
                    "btn",
                    recommend === "down" ? "btn-warm" : "btn-ghost"
                  )}
                >
                  <Icon name="thumbDown" size={14} /> {t.review.recommendNo}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="kicker block mb-3" htmlFor="comment">
                {t.review.tellMoreLabel}{" "}
                <span className="text-fg-dim">
                  ({t.review.tellMoreCounter.replace("{count}", String(comment.length))})
                </span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={4}
                placeholder={t.review.tellMorePlaceholder}
                className="w-full rounded-md border border-line bg-raised px-4 py-3 text-sm focus:outline-none focus:border-accent resize-y"
              />
            </div>

            <div className="text-xs text-fg-dim">
              {t.review.communityGuidelines}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-bg sticky bottom-0">
        <div className="mx-auto max-w-[760px] px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <Icon name="arrowLeft" size={14} />
            {t.review.previousStep}
          </button>
          <div className="mono text-xs text-fg-dim tnum">
            {step + 1} / {total}
          </div>
          {step < total - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canAdvance}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            >
              {t.review.nextStep}
              <Icon name="arrowRight" size={14} />
            </button>
          ) : (
            <Form method="post">
              <input type="hidden" name="rating_overall" value={overall} />
              <input type="hidden" name="rating_flavor" value={rFlavor || overall} />
              <input type="hidden" name="rating_potency" value={rPotency || overall} />
              <input type="hidden" name="rating_effects" value={rEffects || overall} />
              <input type="hidden" name="rating_aroma" value={overall} />
              <input type="hidden" name="rating_appearance" value={overall} />
              <input type="hidden" name="method" value={method} />
              <input type="hidden" name="timeOfDay" value={timeOfDay} />
              <input type="hidden" name="setting" value={setting} />
              <input type="hidden" name="comment" value={comment} />
              {effects.map((e) => (
                <input key={e} type="hidden" name="effectsExperienced" value={e} />
              ))}
              <button
                type="submit"
                className="btn"
                style={{
                  background: "var(--gold)",
                  color: "oklch(22% 0.05 85)",
                }}
                disabled={isSubmitting || overall === 0}
              >
                {isSubmitting ? t.common.sending : t.review.publish}
                <Icon name="send" size={14} />
              </button>
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

function ChipSection({
  label,
  options,
  selected,
  onToggle,
  tone = "neutral",
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="mb-8">
      <div className="kicker mb-3">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <ChipButton
            key={o}
            active={selected.includes(o)}
            onClick={() => onToggle(o)}
            tone={tone}
          >
            {o}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}

function ChipButton({
  active,
  tone = "neutral",
  onClick,
  children,
}: {
  active?: boolean;
  tone?: "neutral" | "accent" | "warm";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const onClass = tone === "accent" ? "on-accent" : tone === "warm" ? "on-warm" : "on";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("chip", active && onClass)}
      aria-pressed={!!active}
    >
      {children}
    </button>
  );
}
