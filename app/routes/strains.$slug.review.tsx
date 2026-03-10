import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import type { Route } from "./+types/strains.$slug.review";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { recalculateStrainRatings, updateUserStats } from "~/services/review.service.server";
import { awardPoints, checkAndAwardBadges } from "~/services/gamification.service.server";
import { EFFECTS, CONSUMPTION_METHODS } from "~/constants/cannabis";
import { RATING_CATEGORIES, CONTEXT_SETTINGS, TIME_OF_DAY_OPTIONS } from "~/constants/review";
import { POINTS } from "~/constants/gamification";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { RatingStars } from "~/components/composite/rating-stars";
import { cn } from "~/lib/utils";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Reseñar ${data?.strain?.name || "Cepa"} — WeedHub` }];
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
    strain: { _id: String(strain._id), name: strain.name, slug: strain.slug, type: strain.type },
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

  const ratings = {
    overall: Number(formData.get("rating_overall")) || 3,
    potency: Number(formData.get("rating_potency")) || 3,
    flavor: Number(formData.get("rating_flavor")) || 3,
    aroma: Number(formData.get("rating_aroma")) || 3,
    appearance: Number(formData.get("rating_appearance")) || 3,
    effects: Number(formData.get("rating_effects")) || 3,
  };

  const comment = String(formData.get("comment") || "");
  const method = String(formData.get("method") || "");
  const timeOfDay = String(formData.get("timeOfDay") || "");
  const setting = String(formData.get("setting") || "");
  const effectsExperienced = formData.getAll("effectsExperienced").map(String);

  // Upsert review
  const existing = await ReviewModel.findOne({ userId: user._id, strainId: strain._id });
  const isNew = !existing;

  if (existing) {
    existing.ratings = ratings;
    existing.comment = comment;
    existing.context = { method, timeOfDay, setting };
    existing.effectsExperienced = effectsExperienced;
    await existing.save();
  } else {
    await ReviewModel.create({
      userId: user._id,
      strainId: strain._id,
      ratings,
      comment,
      context: { method, timeOfDay, setting },
      effectsExperienced,
    });
  }

  // Update aggregations
  await recalculateStrainRatings(String(strain._id));
  await updateUserStats(String(user._id));

  // Gamification
  if (isNew) {
    let points = POINTS.REVIEW_CREATED;
    if (comment.length > 0) points += POINTS.REVIEW_WITH_COMMENT;
    await awardPoints(String(user._id), points);
    await checkAndAwardBadges(String(user._id));
  }

  return redirect(`/strains/${strain.slug}`);
}

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -20 : 20, opacity: 0 }),
};

export default function ReviewPage({ loaderData }: Route.ComponentProps) {
  const { strain, existingReview } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [ratings, setRatings] = useState(
    existingReview?.ratings || {
      overall: 0, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0,
    }
  );
  const [method, setMethod] = useState(existingReview?.context?.method || "");
  const [timeOfDay, setTimeOfDay] = useState(existingReview?.context?.timeOfDay || "");
  const [setting, setSetting] = useState(existingReview?.context?.setting || "");
  const [effectsExp, setEffectsExp] = useState<string[]>(existingReview?.effectsExperienced || []);
  const [comment, setComment] = useState(existingReview?.comment || "");

  const totalSteps = 5;

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <div className="mb-6">
        <Link to={`/strains/${strain.slug}`} className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a {strain.name}
        </Link>
      </div>

      <h1 className="font-display text-2xl font-bold text-white mb-2">
        {existingReview ? "Editar reseña de" : "Reseñar"} {strain.name}
      </h1>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-white/10"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Step 0: Ratings */}
          {step === 0 && (
            <Card className="border-white/10">
              <CardContent className="pt-6 space-y-6">
                <h2 className="font-display text-xl font-bold text-white text-center">
                  Calificaciones
                </h2>
                {RATING_CATEGORIES.map((cat) => (
                  <div key={cat.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">{cat.icon}</span>
                      <span className="text-white font-medium">{cat.label}</span>
                    </div>
                    <RatingStars
                      rating={ratings[cat.key as keyof typeof ratings]}
                      interactive
                      onChange={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Context */}
          {step === 1 && (
            <Card className="border-white/10">
              <CardContent className="pt-6 space-y-6">
                <h2 className="font-display text-xl font-bold text-white text-center">
                  Contexto
                </h2>
                <div>
                  <p className="text-sm text-text-muted mb-3">Método de consumo</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CONSUMPTION_METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        className={cn(
                          "p-3 rounded-xl border text-sm flex items-center gap-2 transition-all",
                          method === m.value
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-forest-deep border-white/5 text-text-muted hover:border-primary/30"
                        )}
                        onClick={() => setMethod(m.value)}
                      >
                        <span className="material-symbols-outlined text-primary text-lg">{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-3">Momento del día</p>
                  <div className="flex gap-3">
                    {TIME_OF_DAY_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={cn(
                          "flex-1 p-3 rounded-xl border text-center transition-all",
                          timeOfDay === t.value
                            ? "bg-primary/10 border-primary"
                            : "bg-forest-deep border-white/5 hover:border-primary/30"
                        )}
                        onClick={() => setTimeOfDay(t.value)}
                      >
                        <span className="material-symbols-outlined text-primary block mb-1">{t.icon}</span>
                        <p className="text-xs text-white">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-3">Entorno</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_SETTINGS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={cn(
                          "px-4 py-2 rounded-full text-sm transition-all",
                          setting === s
                            ? "bg-primary text-background-dark"
                            : "bg-white/5 text-white hover:bg-white/10"
                        )}
                        onClick={() => setSetting(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Effects */}
          {step === 2 && (
            <Card className="border-white/10">
              <CardContent className="pt-6">
                <h2 className="font-display text-xl font-bold text-white text-center mb-6">
                  Efectos experimentados
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {EFFECTS.map((effect) => (
                    <button
                      key={effect}
                      type="button"
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        effectsExp.includes(effect)
                          ? "bg-primary text-background-dark"
                          : "bg-white/5 text-white hover:bg-white/10"
                      )}
                      onClick={() =>
                        setEffectsExp((prev) =>
                          prev.includes(effect)
                            ? prev.filter((e) => e !== effect)
                            : [...prev, effect]
                        )
                      }
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Comment */}
          {step === 3 && (
            <Card className="border-white/10">
              <CardContent className="pt-6">
                <h2 className="font-display text-xl font-bold text-white text-center mb-6">
                  Tu comentario
                </h2>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia con esta cepa... (opcional)"
                  className="min-h-[200px]"
                  maxLength={2000}
                />
                <p className="text-xs text-text-muted/60 mt-2 text-right">
                  {comment.length}/2000
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <Card className="border-white/10">
              <CardContent className="pt-6">
                <h2 className="font-display text-xl font-bold text-white text-center mb-6">
                  Confirmar reseña
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-text-muted mb-2">Calificación general</p>
                    <RatingStars rating={ratings.overall} />
                  </div>
                  {effectsExp.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-text-muted mb-2">Efectos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {effectsExp.map((e) => (
                          <Badge key={e} variant="effect">{e}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {comment && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-text-muted mb-2">Comentario</p>
                      <p className="text-sm text-white">{comment}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="ghost"
          onClick={() => step > 0 && goTo(step - 1)}
          disabled={step === 0}
        >
          Anterior
        </Button>

        {step < totalSteps - 1 ? (
          <Button
            onClick={() => goTo(step + 1)}
            disabled={step === 0 && ratings.overall === 0}
          >
            Siguiente
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Button>
        ) : (
          <Form method="post">
            {/* Hidden fields */}
            {RATING_CATEGORIES.map((cat) => (
              <input key={cat.key} type="hidden" name={`rating_${cat.key}`} value={ratings[cat.key as keyof typeof ratings]} />
            ))}
            <input type="hidden" name="method" value={method} />
            <input type="hidden" name="timeOfDay" value={timeOfDay} />
            <input type="hidden" name="setting" value={setting} />
            <input type="hidden" name="comment" value={comment} />
            {effectsExp.map((e) => (
              <input key={e} type="hidden" name="effectsExperienced" value={e} />
            ))}
            <Button type="submit" size="lg" disabled={isSubmitting || ratings.overall === 0}>
              {isSubmitting ? "Enviando..." : "Publicar Reseña"}
              <span className="material-symbols-outlined text-lg">send</span>
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}
