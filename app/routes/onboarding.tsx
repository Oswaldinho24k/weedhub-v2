import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import type { Route } from "./+types/onboarding";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { EFFECTS, CONSUMPTION_METHODS } from "~/constants/cannabis";
import { TIME_OF_DAY_OPTIONS } from "~/constants/review";
import { POINTS } from "~/constants/gamification";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Personaliza tu experiencia — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();
  const formData = await request.formData();

  const experienceLevel = String(formData.get("experienceLevel") || "principiante");
  const preferredEffects = formData.getAll("preferredEffects").map(String);
  const preferredMethods = formData.getAll("preferredMethods").map(String);
  const preferredTime = formData.getAll("preferredTime").map(String);
  const thcPreference = String(formData.get("thcPreference") || "any");
  const cbdPreference = String(formData.get("cbdPreference") || "any");

  await UserModel.findByIdAndUpdate(user._id, {
    cannabisProfile: {
      experienceLevel,
      preferredEffects,
      preferredMethods,
      preferredTime,
      thcPreference,
      cbdPreference,
    },
    onboardingCompleted: true,
    $inc: { points: POINTS.COMPLETED_ONBOARDING },
  });

  return redirect("/strains");
}

const EXPERIENCE_LEVELS = [
  { value: "principiante", label: "Principiante", icon: "eco", desc: "Nuevo en el cannabis" },
  { value: "intermedio", label: "Intermedio", icon: "potted_plant", desc: "Algo de experiencia" },
  { value: "experimentado", label: "Experimentado", icon: "local_florist", desc: "Consumo regular" },
  { value: "experto", label: "Experto", icon: "psychology", desc: "Conocimiento profundo" },
];

const THC_CBD_OPTIONS = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
  { value: "any", label: "Sin preferencia" },
];

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -20 : 20, opacity: 0 }),
};

export default function OnboardingPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState({
    experienceLevel: "principiante",
    preferredEffects: [] as string[],
    preferredMethods: [] as string[],
    preferredTime: [] as string[],
    thcPreference: "any",
    cbdPreference: "any",
  });

  const totalSteps = 5;

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  function toggleArray(key: "preferredEffects" | "preferredMethods" | "preferredTime", value: string) {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
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

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Personaliza tu experiencia
          </h1>
          <p className="text-text-muted">
            Paso {step + 1} de {totalSteps}
          </p>
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
            {/* Step 0: Experience Level */}
            {step === 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-6 text-center">
                  ¿Cuál es tu nivel de experiencia?
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      className={cn(
                        "rounded-2xl p-6 border text-left transition-all",
                        data.experienceLevel === level.value
                          ? "bg-primary/10 border-primary"
                          : "bg-forest-deep border-white/5 hover:border-primary/30"
                      )}
                      onClick={() => setData((prev) => ({ ...prev, experienceLevel: level.value }))}
                    >
                      <span className="material-symbols-outlined text-3xl text-primary mb-3 block">
                        {level.icon}
                      </span>
                      <p className="font-bold text-white">{level.label}</p>
                      <p className="text-sm text-text-muted">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Effects */}
            {step === 1 && (
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-6 text-center">
                  ¿Qué efectos buscas?
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {EFFECTS.map((effect) => (
                    <button
                      key={effect}
                      type="button"
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        data.preferredEffects.includes(effect)
                          ? "bg-primary text-background-dark"
                          : "bg-white/5 text-white hover:bg-white/10"
                      )}
                      onClick={() => toggleArray("preferredEffects", effect)}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Methods */}
            {step === 2 && (
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-6 text-center">
                  ¿Cómo prefieres consumir?
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {CONSUMPTION_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      className={cn(
                        "rounded-2xl p-4 border text-left transition-all flex items-center gap-3",
                        data.preferredMethods.includes(method.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-forest-deep border-white/5 hover:border-primary/30"
                      )}
                      onClick={() => toggleArray("preferredMethods", method.value)}
                    >
                      <span className="material-symbols-outlined text-2xl text-primary">
                        {method.icon}
                      </span>
                      <span className="font-medium text-white">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Time */}
            {step === 3 && (
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-6 text-center">
                  ¿Cuándo prefieres consumir?
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {TIME_OF_DAY_OPTIONS.map((time) => (
                    <button
                      key={time.value}
                      type="button"
                      className={cn(
                        "rounded-2xl p-6 border text-center transition-all",
                        data.preferredTime.includes(time.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-forest-deep border-white/5 hover:border-primary/30"
                      )}
                      onClick={() => toggleArray("preferredTime", time.value)}
                    >
                      <span className="material-symbols-outlined text-3xl text-primary mb-2 block">
                        {time.icon}
                      </span>
                      <p className="font-medium text-white">{time.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: THC/CBD Preference */}
            {step === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-xl font-bold text-white mb-4 text-center">
                    Preferencia de THC
                  </h2>
                  <div className="flex gap-3 justify-center">
                    {THC_CBD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "px-6 py-3 rounded-full font-medium transition-all",
                          data.thcPreference === opt.value
                            ? "bg-primary text-background-dark"
                            : "bg-white/5 text-white hover:bg-white/10"
                        )}
                        onClick={() => setData((prev) => ({ ...prev, thcPreference: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white mb-4 text-center">
                    Preferencia de CBD
                  </h2>
                  <div className="flex gap-3 justify-center">
                    {THC_CBD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "px-6 py-3 rounded-full font-medium transition-all",
                          data.cbdPreference === opt.value
                            ? "bg-accent-purple text-white"
                            : "bg-white/5 text-white hover:bg-white/10"
                        )}
                        onClick={() => setData((prev) => ({ ...prev, cbdPreference: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Button
            variant="ghost"
            onClick={() => step > 0 && goTo(step - 1)}
            disabled={step === 0}
          >
            Anterior
          </Button>

          <div className="flex gap-3">
            <Form method="post">
              <input type="hidden" name="experienceLevel" value={data.experienceLevel} />
              {data.preferredEffects.map((e) => (
                <input key={e} type="hidden" name="preferredEffects" value={e} />
              ))}
              {data.preferredMethods.map((m) => (
                <input key={m} type="hidden" name="preferredMethods" value={m} />
              ))}
              {data.preferredTime.map((t) => (
                <input key={t} type="hidden" name="preferredTime" value={t} />
              ))}
              <input type="hidden" name="thcPreference" value={data.thcPreference} />
              <input type="hidden" name="cbdPreference" value={data.cbdPreference} />

              {step < totalSteps - 1 ? (
                <div className="flex gap-3">
                  <Button type="submit" variant="secondary" name="skip" value="true">
                    Saltar por ahora
                  </Button>
                  <Button type="button" onClick={() => goTo(step + 1)}>
                    Siguiente
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Button>
                </div>
              ) : (
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Completar"}
                  <span className="material-symbols-outlined text-lg">check</span>
                </Button>
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
