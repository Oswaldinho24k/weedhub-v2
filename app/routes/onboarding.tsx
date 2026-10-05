import { useState } from "react";
import { Form, Link, redirect, useNavigation, useFetcher } from "react-router";
import type { Route } from "./+types/onboarding";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { EffectModel } from "~/models/effect.server";
import { resolveLocale } from "~/lib/locale.server";
import { POINTS } from "~/constants/gamification";
import { ACQUISITION_SOURCES, isValidAcquisitionSource } from "~/constants/locations";
import { type IconName } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { SelectionCard } from "~/components/ui/selection-card";
import { Chip } from "~/components/ui/chip";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Field } from "~/components/ui/field";
import { Icon } from "~/components/ui/icon";

export function meta() {
  return [{ title: "Personaliza tu perfil — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  await connectDB();
  const locale = await resolveLocale(request);
  const labelKey = locale === "pt" ? "labelPt" : locale === "en" ? "labelEn" : "labelEs";
  const allEffects = await EffectModel.find({ status: "approved" }).sort({ usageCount: -1 }).lean();
  const makeList = (cat: "positive" | "negative") =>
    allEffects.filter((e) => e.category === cat).map((e) => ({ key: e.key, label: (e as any)[labelKey] || e.labelEn }));
  return { positiveEffects: makeList("positive"), negativeEffects: makeList("negative") };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();
  const formData = await request.formData();

  const experienceLevel = String(formData.get("experienceLevel") || "principiante");
  const preferredEffects = formData.getAll("preferredEffects").map(String);
  const preferredMethods = formData.getAll("preferredMethods").map(String);
  const preferredTime = formData.getAll("preferredTime").map(String);
  const avoidEffects = formData.getAll("avoidEffects").map(String);

  const birthYearRaw = String(formData.get("birthYear") || "").trim();
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : undefined;
  const validBirthYear =
    birthYear && birthYear >= 1900 && birthYear <= new Date().getFullYear() - 18
      ? birthYear
      : undefined;

  const acquisitionRaw = String(formData.get("acquisitionSource") || "").trim();
  const acquisitionSource = isValidAcquisitionSource(acquisitionRaw) ? acquisitionRaw : undefined;

  const update: Record<string, unknown> = {
    cannabisProfile: {
      experienceLevel,
      preferredEffects,
      preferredMethods,
      preferredTime,
      avoidEffects,
      thcPreference: "any",
      cbdPreference: "any",
    },
    onboardingCompleted: true,
    $inc: { points: POINTS.COMPLETED_ONBOARDING },
  };
  if (validBirthYear) update.birthYear = validBirthYear;
  if (acquisitionSource) update.acquisitionSource = acquisitionSource;

  await UserModel.findByIdAndUpdate(user._id, update);

  return redirect("/strains");
}

interface StepOption {
  value: string;
  title: string;
  description: string;
  icon: IconName;
}

const EXPERIENCE: StepOption[] = [
  { value: "curioso",   title: "Curioso",   description: "Recién empezando a explorar la planta.",       icon: "sprout" },
  { value: "novato",    title: "Novato",    description: "He probado algunas veces y conozco lo básico.", icon: "leaf" },
  { value: "ocasional", title: "Ocasional", description: "Consumo de vez en cuando, en eventos sociales.",icon: "smile" },
  { value: "regular",   title: "Regular",   description: "Consumidor habitual con preferencias claras.",  icon: "flame" },
  { value: "experto",   title: "Experto",   description: "Conocedor profundo de cepas, terpenos y métodos.", icon: "target" },
];

const GOALS: StepOption[] = [
  { value: "relax",   title: "Relajarme",        description: "Descanso, sueño",      icon: "moon" },
  { value: "create",  title: "Ser creativo",      description: "Escribir, arte, música", icon: "sparkle" },
  { value: "social",  title: "Socializar",        description: "Amigos, fiestas",      icon: "users" },
  { value: "focus",   title: "Concentrarme",      description: "Trabajo, estudio",     icon: "target" },
  { value: "learn",   title: "Aprender",          description: "Entender la planta",   icon: "book" },
  { value: "medical", title: "Uso terapéutico",   description: "Dolor, ansiedad",      icon: "droplet" },
];

const METHODS: StepOption[] = [
  { value: "smoke",   title: "Fumado",       description: "Cigarro, pipa",        icon: "flame" },
  { value: "vape",    title: "Vaporizado",   description: "Flor o concentrado",   icon: "vape" },
  { value: "edible",  title: "Comestibles",  description: "Brownies, gomitas",    icon: "cookie" },
  { value: "concent", title: "Concentrados", description: "Hash, rosin, BHO",     icon: "diamond" },
  { value: "topical", title: "Tópicos",      description: "Cremas, aceites",      icon: "droplet" },
  { value: "unsure",  title: "Aún no sé",    description: "Quiero explorar",      icon: "question" },
];

const STEP_LABELS = [
  "Perfil de consumidor",
  "Objetivos",
  "Método",
  "Efectos deseados",
  "Listo",
];

export default function OnboardingPage({ loaderData }: Route.ComponentProps) {
  const { positiveEffects, negativeEffects } = loaderData;
  const t = useT();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [step, setStep] = useState(0);
  const stepLabelsLocalized = [
    t.onboarding.stepLabels.familiarity,
    t.onboarding.stepLabels.goals,
    t.onboarding.stepLabels.methods,
    t.onboarding.stepLabels.effects,
    t.onboarding.stepLabels.done,
  ];
  const total = stepLabelsLocalized.length;

  const [experience, setExperience] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [effects, setEffects] = useState<string[]>([]);

  const toggleArr = (list: string[], v: string, set: (n: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const seekEffects = effects.filter((e) => e.startsWith("+")).map((e) => e.slice(1));
  const avoidEffects = effects.filter((e) => e.startsWith("-")).map((e) => e.slice(1));

  const canContinue =
    step === 0 ? !!experience :
    step === 1 ? goals.length > 0 :
    step === 2 ? methods.length > 0 :
    step === 3 ? effects.length > 0 :
    true;

  const progress = Math.round(((step + 1) / total) * 100);

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-56px)]">
      {/* Progress */}
      <div className="max-w-[900px] w-full mx-auto px-6 md:px-10 pt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="kicker">
            {t.onboarding.stepOf
              .replace("{current}", String(step + 1))
              .replace("{total}", String(total))}{" "}
            · {stepLabelsLocalized[step]}
          </div>
          <div className="mono tnum text-xs" style={{ color: "var(--accent)" }}>
            {progress}%
          </div>
        </div>
        <div className="flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-sm transition-colors"
              style={{ background: i <= step ? "var(--accent)" : "var(--bg-elev)" }}
            />
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-[900px] w-full mx-auto px-6 md:px-10 py-16">

        {/* Step 0 — Experiencia */}
        {step === 0 && (
          <div>
            <StepTitle accent={t.onboarding.familiarityAccent}>
              {t.onboarding.familiarityTitle}
            </StepTitle>
            <p className="text-[17px] mb-10 max-w-[560px]" style={{ color: "var(--fg-muted)" }}>
              {t.onboarding.familiarityBody}
            </p>
            <div className="flex flex-col gap-2.5">
              {EXPERIENCE.map((o) => (
                <SelectionCard
                  key={o.value}
                  layout="horizontal"
                  active={experience === o.value}
                  onClick={() => setExperience(o.value)}
                  icon={o.icon}
                  title={o.title}
                  description={o.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Objetivos */}
        {step === 1 && (
          <div>
            <StepTitle accent={t.onboarding.goalsAccent}>
              {t.onboarding.goalsTitle}
            </StepTitle>
            <p className="text-[17px] mb-10" style={{ color: "var(--fg-muted)" }}>
              {t.onboarding.goalsBody}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {GOALS.map((g) => (
                <SelectionCard
                  key={g.value}
                  layout="vertical"
                  multiSelect
                  active={goals.includes(g.value)}
                  onClick={() => toggleArr(goals, g.value, setGoals)}
                  icon={g.icon}
                  title={g.title}
                  description={g.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Métodos */}
        {step === 2 && (
          <div>
            <StepTitle accent={t.onboarding.methodsAccent}>
              {t.onboarding.methodsTitle}
            </StepTitle>
            <p className="text-[17px] mb-10" style={{ color: "var(--fg-muted)" }}>
              {t.onboarding.methodsBody}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {METHODS.map((m) => (
                <SelectionCard
                  key={m.value}
                  layout="vertical"
                  multiSelect
                  active={methods.includes(m.value)}
                  onClick={() => toggleArr(methods, m.value, setMethods)}
                  icon={m.icon}
                  title={m.title}
                  description={m.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Efectos */}
        {step === 3 && (
          <div>
            <StepTitle accent={t.onboarding.effectsAccent}>
              {t.onboarding.effectsTitle}
            </StepTitle>
            <p className="text-[17px] mb-10" style={{ color: "var(--fg-muted)" }}>
              {t.onboarding.effectsBody}
            </p>

            <div className="mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <Icon name="smile" size={18} className="text-accent" />
                <h3 className="kicker" style={{ color: "var(--accent)" }}>
                  {t.onboarding.effectsPositive}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {positiveEffects.map((e) => (
                  <Chip
                    key={e.key}
                    colorScheme="accent"
                    active={effects.includes("+" + e.key)}
                    onClick={() => toggleArr(effects, "+" + e.key, setEffects)}
                    className="px-4 py-2.5 text-sm"
                  >
                    {e.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Icon name="alert" size={18} style={{ color: "var(--warm)" }} />
                <h3 className="kicker" style={{ color: "var(--warm)" }}>
                  {t.onboarding.effectsAvoid}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {negativeEffects.map((e) => (
                  <Chip
                    key={e.key}
                    colorScheme="warm"
                    active={effects.includes("-" + e.key)}
                    onClick={() => toggleArr(effects, "-" + e.key, setEffects)}
                    className="px-4 py-2.5 text-sm"
                  >
                    {e.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="text-center pt-5">
            <div
              className="h-[72px] w-[72px] rounded-full grid place-items-center mx-auto mb-6"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Icon name="check" size={32} strokeWidth={2.4} />
            </div>
            <div className="kicker mb-3" style={{ color: "var(--accent)" }}>
              {t.onboarding.doneKicker}
            </div>
            <h1
              className="display mb-6"
              style={{ fontSize: "clamp(44px, 7vw, 84px)", lineHeight: 0.95 }}
            >
              {t.onboarding.doneTitleLine1}
              <br />
              {t.onboarding.doneTitleLine2}
            </h1>
            <p
              className="text-[18px] max-w-[520px] mx-auto mb-12"
              style={{ color: "var(--fg-muted)" }}
            >
              {t.onboarding.doneBody}
            </p>

            <OnboardingNewsletter />

            <div className="grid grid-cols-3 gap-4 text-left mb-10">
              <SummaryCard
                icon="history"
                kicker={t.onboarding.summaryFrequency}
                value={experience ? experience[0].toUpperCase() + experience.slice(1) : "—"}
              />
              <SummaryCard
                icon="target"
                kicker={t.onboarding.summaryGoals}
                value={t.onboarding.summaryGoalsSelected.replace("{count}", String(goals.length))}
              />
              <SummaryCard
                icon="cookie"
                kicker={t.onboarding.summaryMethod}
                value={t.onboarding.summaryMethodPreferred.replace("{count}", String(methods.length))}
              />
            </div>

            <Form method="post" className="flex flex-col items-center gap-6">
              <input type="hidden" name="experienceLevel" value={experience} />
              {goals.map((g) => (
                <input key={g} type="hidden" name="preferredEffects" value={g} />
              ))}
              {methods.map((m) => (
                <input key={m} type="hidden" name="preferredMethods" value={m} />
              ))}
              {seekEffects.map((e) => (
                <input key={e} type="hidden" name="preferredTime" value={e} />
              ))}
              {avoidEffects.map((a) => (
                <input key={a} type="hidden" name="avoidEffects" value={a} />
              ))}

              <Card variant="sunken" className="w-full max-w-[520px] text-left">
                <div className="kicker mb-1">{t.onboarding.growKicker}</div>
                <p className="text-xs text-fg-dim mb-4">{t.onboarding.growHint}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.onboarding.birthYearLabel} htmlFor="birthYear">
                    <input
                      id="birthYear"
                      name="birthYear"
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() - 18}
                      placeholder="1995"
                      className="w-full h-10 rounded-[var(--radius)] border border-line bg-raised px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </Field>
                  <Field label={t.onboarding.acquisitionLabel} htmlFor="acquisitionSource">
                    <select
                      id="acquisitionSource"
                      name="acquisitionSource"
                      defaultValue=""
                      className="w-full h-10 rounded-[var(--radius)] border border-line bg-raised px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      <option value="">—</option>
                      {ACQUISITION_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Card>

              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.common.saving : t.onboarding.primaryCta}
                  <Icon name="arrowRight" size={15} />
                </Button>
                <Link to="/profile/edit" className="btn btn-ghost" style={{ padding: "14px 24px" }}>
                  {t.onboarding.editProfile}
                </Link>
              </div>
            </Form>
          </div>
        )}
      </main>

      {/* Footer navigation */}
      {step < total - 1 && (
        <footer
          className="sticky bottom-0"
          style={{ borderTop: "1px solid var(--line)", background: "var(--bg)" }}
        >
          <div className="max-w-[900px] w-full mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              style={{ opacity: step === 0 ? 0.3 : 1 }}
            >
              <Icon name="arrowLeft" size={14} />
              {t.onboarding.previous}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!canContinue}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              style={{ opacity: canContinue ? 1 : 0.4 }}
            >
              {t.common.continue}
              <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

function StepTitle({ accent, children }: { accent: string; children: string }) {
  const parts = children.split(accent);
  return (
    <h1
      className="display mb-4"
      style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1 }}
    >
      {parts[0]}
      <em style={{ color: "var(--accent)", fontStyle: "italic" }} className="display-wonk">
        {accent}
      </em>
      {parts[1]}
    </h1>
  );
}

function SummaryCard({ icon, kicker, value }: { icon: IconName; kicker: string; value: string }) {
  return (
    <Card variant="sunken" className="p-[22px]">
      <Icon name={icon} size={18} style={{ color: "var(--accent)", marginBottom: 14 }} />
      <div className="kicker" style={{ marginBottom: 6 }}>{kicker}</div>
      <div style={{ fontSize: 16 }}>{value}</div>
    </Card>
  );
}

function OnboardingNewsletter() {
  const fetcher = useFetcher();
  const isDone = fetcher.data?.ok;
  const isSubmitting = fetcher.state !== "idle";

  if (isDone) {
    return (
      <Card className="mb-10 max-w-[480px] mx-auto text-center" style={{ borderColor: "var(--accent)" }}>
        <div className="kicker mb-1" style={{ color: "var(--accent)" }}>Suscrito</div>
        <p className="text-sm text-fg-muted">Te escribimos pronto. Revisa tu bandeja.</p>
      </Card>
    );
  }

  return (
    <Card className="mb-10 max-w-[480px] mx-auto text-left">
      <div className="kicker mb-1" style={{ color: "var(--accent)" }}>Antes de explorar</div>
      <p className="text-sm text-fg-muted mb-4">
        Recibe recomendaciones de cepas basadas en tu perfil — dos veces al mes, sin spam.
      </p>
      <fetcher.Form method="post" action="/api/newsletter" className="flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="tu@correo.com"
          required
          className="flex-1 h-10 rounded-[var(--radius)] border border-line bg-raised px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "..." : "Suscribirme"}
        </Button>
      </fetcher.Form>
    </Card>
  );
}
