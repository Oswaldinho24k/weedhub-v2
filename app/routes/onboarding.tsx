import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/onboarding";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { POINTS } from "~/constants/gamification";
import { ACQUISITION_SOURCES, isValidAcquisitionSource } from "~/constants/locations";
import { Icon, type IconName } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";

export function meta() {
  return [{ title: "Personaliza tu perfil — WeedHub" }];
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
  const avoidEffects = formData.getAll("avoidEffects").map(String);

  // Optional metadata from the last-step card
  const birthYearRaw = String(formData.get("birthYear") || "").trim();
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : undefined;
  const validBirthYear =
    birthYear && birthYear >= 1900 && birthYear <= new Date().getFullYear() - 18
      ? birthYear
      : undefined;

  const acquisitionRaw = String(formData.get("acquisitionSource") || "").trim();
  const acquisitionSource = isValidAcquisitionSource(acquisitionRaw)
    ? acquisitionRaw
    : undefined;

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

interface RadioOpt {
  value: string;
  title: string;
  desc: string;
  icon: IconName;
}

interface TileOpt {
  value: string;
  title: string;
  desc: string;
  icon: IconName;
}

const EXPERIENCE: RadioOpt[] = [
  { value: "curioso", title: "Curioso", desc: "Recién empezando a explorar la planta.", icon: "sprout" },
  { value: "novato", title: "Novato", desc: "He probado algunas veces y conozco lo básico.", icon: "leaf" },
  { value: "ocasional", title: "Ocasional", desc: "Consumo de vez en cuando, en eventos sociales.", icon: "smile" },
  { value: "regular", title: "Regular", desc: "Consumidor habitual con preferencias claras.", icon: "flame" },
  { value: "experto", title: "Experto", desc: "Conocedor profundo de cepas, terpenos y métodos.", icon: "target" },
];

const GOALS: TileOpt[] = [
  { value: "relax", title: "Relajarme", desc: "Descanso, sueño", icon: "moon" },
  { value: "create", title: "Ser creativo", desc: "Escribir, arte, música", icon: "sparkle" },
  { value: "social", title: "Socializar", desc: "Amigos, fiestas", icon: "users" },
  { value: "focus", title: "Concentrarme", desc: "Trabajo, estudio", icon: "target" },
  { value: "learn", title: "Aprender", desc: "Entender la planta", icon: "book" },
  { value: "medical", title: "Uso terapéutico", desc: "Dolor, ansiedad", icon: "droplet" },
];

const METHODS: TileOpt[] = [
  { value: "smoke", title: "Fumado", desc: "Cigarro, pipa", icon: "flame" },
  { value: "vape", title: "Vaporizado", desc: "Flor o concentrado", icon: "vape" },
  { value: "edible", title: "Comestibles", desc: "Brownies, gomitas", icon: "cookie" },
  { value: "concent", title: "Concentrados", desc: "Hash, rosin, BHO", icon: "diamond" },
  { value: "topical", title: "Tópicos", desc: "Cremas, aceites", icon: "droplet" },
  { value: "unsure", title: "Aún no sé", desc: "Quiero explorar", icon: "question" },
];

const POSITIVE = ["Relajado", "Feliz", "Creativo", "Euforia", "Enérgico", "Concentrado", "Hablador", "Risa"];
const AVOID = ["Hambre", "Boca seca", "Ojos rojos", "Mareo", "Paranoia", "Ansiedad"];

const STEP_LABELS = [
  "Perfil de consumidor",
  "Objetivos",
  "Método",
  "Efectos deseados",
  "Listo",
];

export default function OnboardingPage() {
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
  const [effects, setEffects] = useState<string[]>([]); // `+${label}` for seek, `-${label}` for avoid

  const toggleArr = (list: string[], v: string, set: (n: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const seekEffects = effects.filter((e) => e.startsWith("+")).map((e) => e.slice(1));
  const avoidEffects = effects.filter((e) => e.startsWith("-")).map((e) => e.slice(1));

  const canContinue =
    step === 0
      ? !!experience
      : step === 1
        ? goals.length > 0
        : step === 2
          ? methods.length > 0
          : step === 3
            ? effects.length > 0
            : true;

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
          <div
            className="mono tnum text-xs"
            style={{ color: "var(--accent)" }}
          >
            {progress}%
          </div>
        </div>
        <div className="flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-sm transition-colors"
              style={{
                background: i <= step ? "var(--accent)" : "var(--bg-elev)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-[900px] w-full mx-auto px-6 md:px-10 py-16">
        {step === 0 && (
          <div>
            <StepTitle accent={t.onboarding.familiarityAccent}>
              {t.onboarding.familiarityTitle}
            </StepTitle>
            <p
              className="text-[17px] mb-10 max-w-[560px]"
              style={{ color: "var(--fg-muted)" }}
            >
              {t.onboarding.familiarityBody}
            </p>
            <div className="flex flex-col gap-2.5">
              {EXPERIENCE.map((o) => (
                <RadioCard
                  key={o.value}
                  active={experience === o.value}
                  onClick={() => setExperience(o.value)}
                  icon={o.icon}
                  title={o.title}
                  desc={o.desc}
                />
              ))}
            </div>
          </div>
        )}

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
                <TileCard
                  key={g.value}
                  active={goals.includes(g.value)}
                  onClick={() => toggleArr(goals, g.value, setGoals)}
                  icon={g.icon}
                  title={g.title}
                  desc={g.desc}
                />
              ))}
            </div>
          </div>
        )}

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
                <TileCard
                  key={m.value}
                  active={methods.includes(m.value)}
                  onClick={() => toggleArr(methods, m.value, setMethods)}
                  icon={m.icon}
                  title={m.title}
                  desc={m.desc}
                />
              ))}
            </div>
          </div>
        )}

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
                {POSITIVE.map((p) => {
                  const on = effects.includes("+" + p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleArr(effects, "+" + p, setEffects)}
                      className="chip"
                      style={{
                        padding: "10px 16px",
                        fontSize: 14,
                        background: on ? "var(--accent)" : "transparent",
                        color: on ? "var(--accent-ink)" : "var(--fg)",
                        borderColor: on ? "var(--accent)" : "var(--line)",
                      }}
                    >
                      {p}
                      {on && <Icon name="check" size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
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
                {AVOID.map((p) => {
                  const on = effects.includes("-" + p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleArr(effects, "-" + p, setEffects)}
                      className="chip"
                      style={{
                        padding: "10px 16px",
                        fontSize: 14,
                        background: on ? "var(--warm)" : "transparent",
                        color: on ? "oklch(20% 0.04 55)" : "var(--fg)",
                        borderColor: on ? "var(--warm)" : "var(--line)",
                      }}
                    >
                      {p}
                      {on && <Icon name="check" size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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

            <div className="grid grid-cols-3 gap-4 text-left mb-10">
              <SummaryCard
                icon="history"
                kicker={t.onboarding.summaryFrequency}
                value={
                  experience
                    ? experience[0].toUpperCase() + experience.slice(1)
                    : "—"
                }
              />
              <SummaryCard
                icon="target"
                kicker={t.onboarding.summaryGoals}
                value={t.onboarding.summaryGoalsSelected.replace(
                  "{count}",
                  String(goals.length)
                )}
              />
              <SummaryCard
                icon="cookie"
                kicker={t.onboarding.summaryMethod}
                value={t.onboarding.summaryMethodPreferred.replace(
                  "{count}",
                  String(methods.length)
                )}
              />
            </div>

            <Form
              method="post"
              className="flex flex-col items-center gap-6"
            >
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

              {/* Growth metadata — optional */}
              <div
                className="card p-5 w-full max-w-[520px] text-left"
                style={{ background: "var(--bg-sunken)" }}
              >
                <div className="kicker mb-1">{t.onboarding.growKicker}</div>
                <p className="text-xs text-fg-dim mb-4">{t.onboarding.growHint}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="kicker block mb-2"
                      htmlFor="birthYear"
                    >
                      {t.onboarding.birthYearLabel}
                    </label>
                    <input
                      id="birthYear"
                      name="birthYear"
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() - 18}
                      placeholder="1995"
                      className="w-full h-10 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label
                      className="kicker block mb-2"
                      htmlFor="acquisitionSource"
                    >
                      {t.onboarding.acquisitionLabel}
                    </label>
                    <select
                      id="acquisitionSource"
                      name="acquisitionSource"
                      defaultValue=""
                      className="w-full h-10 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
                    >
                      <option value="">—</option>
                      {ACQUISITION_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "16px 32px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? t.common.saving : t.onboarding.primaryCta}
                <Icon name="arrowRight" size={15} />
              </button>
              <Link
                to="/profile/edit"
                className="btn btn-ghost"
                style={{ padding: "16px 24px" }}
              >
                {t.onboarding.editProfile}
              </Link>
              </div>
            </Form>
          </div>
        )}
      </main>

      {/* Footer */}
      {step < total - 1 && (
        <footer
          className="sticky bottom-0"
          style={{
            borderTop: "1px solid var(--line)",
            background: "var(--bg)",
          }}
        >
          <div className="max-w-[900px] w-full mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              style={{ opacity: step === 0 ? 0.3 : 1 }}
            >
              <Icon name="arrowLeft" size={14} />
              {t.onboarding.previous}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              style={{ opacity: canContinue ? 1 : 0.4 }}
            >
              {t.common.continue}
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

function StepTitle({
  accent,
  children,
}: {
  accent: string;
  children: string;
}) {
  const parts = children.split(accent);
  return (
    <h1
      className="display mb-4"
      style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1 }}
    >
      {parts[0]}
      <em
        style={{ color: "var(--accent)", fontStyle: "italic" }}
        className="display-wonk"
      >
        {accent}
      </em>
      {parts[1]}
    </h1>
  );
}

function RadioCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "20px 24px",
        textAlign: "left",
        border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
        borderRadius: "var(--radius-lg)",
        background: active ? "var(--accent-soft)" : "var(--bg-raised)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        transition: "all .15s",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: active ? "var(--accent)" : "var(--bg-elev)",
          color: active ? "var(--accent-ink)" : "var(--fg-muted)",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="display" style={{ fontSize: 24 }}>
          {title}
        </div>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 2 }}>
          {desc}
        </p>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `1.5px solid ${
            active ? "var(--accent)" : "var(--line-strong)"
          }`,
          background: active ? "var(--accent)" : "transparent",
          display: "grid",
          placeItems: "center",
          color: "var(--accent-ink)",
          flexShrink: 0,
        }}
        aria-hidden
      >
        {active && <Icon name="check" size={11} strokeWidth={3} />}
      </div>
    </button>
  );
}

function TileCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: 24,
        textAlign: "left",
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
        background: active ? "var(--accent-soft)" : "var(--bg-raised)",
        transition: "all .15s",
        position: "relative",
      }}
    >
      <Icon
        name={icon}
        size={22}
        style={{
          color: active ? "var(--accent)" : "var(--fg-muted)",
          marginBottom: 14,
        }}
      />
      <div className="display" style={{ fontSize: 22, marginBottom: 2 }}>
        {title}
      </div>
      <p style={{ fontSize: 12, color: "var(--fg-muted)" }}>{desc}</p>
      {active && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            display: "grid",
            placeItems: "center",
          }}
          aria-hidden
        >
          <Icon name="check" size={11} strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function SummaryCard({
  icon,
  kicker,
  value,
}: {
  icon: IconName;
  kicker: string;
  value: string;
}) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <Icon
        name={icon}
        size={18}
        style={{ color: "var(--accent)", marginBottom: 14 }}
      />
      <div className="kicker" style={{ marginBottom: 6 }}>
        {kicker}
      </div>
      <div style={{ fontSize: 16 }}>{value}</div>
    </div>
  );
}
