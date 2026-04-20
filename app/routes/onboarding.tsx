import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/onboarding";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { POINTS } from "~/constants/gamification";
import { Icon, type IconName } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

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

  await UserModel.findByIdAndUpdate(user._id, {
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
  });

  return redirect("/strains");
}

interface Option {
  value: string;
  label: string;
  desc?: string;
  icon: IconName;
}

const EXPERIENCE: Option[] = [
  { value: "principiante", label: "Curioso/a", desc: "Nunca o casi nunca", icon: "sprout" },
  { value: "novato", label: "Novato/a", desc: "Algunas veces al año", icon: "leaf" },
  { value: "ocasional", label: "Ocasional", desc: "Una o dos veces al mes", icon: "sun" },
  { value: "regular", label: "Regular", desc: "Varias veces al mes", icon: "flame" },
  { value: "experto", label: "Experto/a", desc: "Consumo frecuente y análisis", icon: "crown" },
];

const GOALS: Option[] = [
  { value: "relajarse", label: "Relajarme", icon: "sprout" },
  { value: "crear", label: "Ser creativo/a", icon: "palette" },
  { value: "socializar", label: "Socializar", icon: "users" },
  { value: "concentrarse", label: "Concentrarme", icon: "target" },
  { value: "aprender", label: "Aprender", icon: "book" },
  { value: "terapeutico", label: "Uso terapéutico", icon: "droplet" },
];

const METHODS: Option[] = [
  { value: "fumado", label: "Fumado", icon: "flame" },
  { value: "vaporizado", label: "Vaporizado", icon: "vape" },
  { value: "comestibles", label: "Comestibles", icon: "cookie" },
  { value: "concentrados", label: "Concentrados", icon: "diamond" },
  { value: "topicos", label: "Tópicos", icon: "droplet" },
  { value: "nosé", label: "Aún no sé", icon: "question" },
];

const POSITIVE = ["Relajado", "Feliz", "Creativo", "Euforia", "Enérgico", "Concentrado", "Hablador", "Risa"];
const AVOID = ["Hambre", "Boca seca", "Ojos rojos", "Mareo", "Paranoia", "Ansiedad"];

export default function OnboardingPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [step, setStep] = useState(0);
  const total = 5;

  const [experience, setExperience] = useState("novato");
  const [goals, setGoals] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [effects, setEffects] = useState<string[]>([]);
  const [avoid, setAvoid] = useState<string[]>([]);

  const toggle = (list: string[], v: string, set: (n: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canAdvance = step === 0 ? experience : true;

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <div
        className="h-1 bg-sunken"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemax={total}
      >
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex-1 mx-auto max-w-[640px] w-full px-6 py-12 fade-up">
        {step === 0 && (
          <div>
            <div className="kicker mb-4">Paso 1 · Tu perfil</div>
            <h1
              className="display mb-3"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}
            >
              ¿Qué tan{" "}
              <span className="display-wonk" style={{ color: "var(--accent)" }}>
                familiar
              </span>{" "}
              te es el cannabis?
            </h1>
            <p className="text-fg-muted mb-8">
              No hay respuesta correcta. Nos ayuda a sugerirte contenido.
            </p>
            <div className="flex flex-col gap-3">
              {EXPERIENCE.map((opt) => (
                <OptionCard
                  key={opt.value}
                  icon={opt.icon}
                  title={opt.label}
                  desc={opt.desc}
                  active={experience === opt.value}
                  onClick={() => setExperience(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="kicker mb-4">Paso 2 · Objetivos</div>
            <h1
              className="display mb-3"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}
            >
              ¿Qué{" "}
              <span className="display-wonk" style={{ color: "var(--accent)" }}>
                buscas
              </span>{" "}
              en la planta?
            </h1>
            <p className="text-fg-muted mb-8">Selecciona todo lo que aplique.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GOALS.map((g) => (
                <OptionTile
                  key={g.value}
                  icon={g.icon}
                  label={g.label}
                  active={goals.includes(g.value)}
                  onClick={() => toggle(goals, g.value, setGoals)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="kicker mb-4">Paso 3 · Método</div>
            <h1
              className="display mb-3"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}
            >
              ¿Cuál es tu{" "}
              <span className="display-wonk" style={{ color: "var(--accent)" }}>
                método
              </span>{" "}
              preferido?
            </h1>
            <p className="text-fg-muted mb-8">Puedes elegir más de uno.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {METHODS.map((m) => (
                <OptionTile
                  key={m.value}
                  icon={m.icon}
                  label={m.label}
                  active={methods.includes(m.value)}
                  onClick={() => toggle(methods, m.value, setMethods)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="kicker mb-4">Paso 4 · Efectos</div>
            <h1
              className="display mb-3"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}
            >
              ¿Qué efectos{" "}
              <span className="display-wonk" style={{ color: "var(--accent)" }}>
                buscas
              </span>
              … o evitas?
            </h1>
            <p className="text-fg-muted mb-8">
              Los segundos indican qué te gustaría minimizar.
            </p>

            <div className="mb-8">
              <div className="kicker mb-3 flex items-center gap-2" style={{ color: "var(--accent)" }}>
                <Icon name="smile" size={14} />
                Positivos
              </div>
              <div className="flex flex-wrap gap-2">
                {POSITIVE.map((e) => (
                  <ToggleChip
                    key={e}
                    active={effects.includes(e)}
                    tone="accent"
                    onClick={() => toggle(effects, e, setEffects)}
                  >
                    {e}
                  </ToggleChip>
                ))}
              </div>
            </div>

            <div>
              <div className="kicker mb-3 flex items-center gap-2" style={{ color: "var(--warm)" }}>
                <Icon name="alert" size={14} />
                Evitar
              </div>
              <div className="flex flex-wrap gap-2">
                {AVOID.map((e) => (
                  <ToggleChip
                    key={e}
                    active={avoid.includes(e)}
                    tone="warm"
                    onClick={() => toggle(avoid, e, setAvoid)}
                  >
                    {e}
                  </ToggleChip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div
              className="mx-auto mb-6 h-20 w-20 rounded-full grid place-items-center"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Icon name="check" size={36} strokeWidth={2.2} />
            </div>
            <div className="kicker mb-3" style={{ color: "var(--accent)" }}>
              Perfil actualizado
            </div>
            <h1
              className="display mb-4"
              style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1.02 }}
            >
              Listo. Ya te conocemos un poco.
            </h1>
            <p className="text-fg-muted max-w-[48ch] mx-auto mb-10">
              Ajustamos el directorio y las recomendaciones. Podrás editar todo
              desde tu perfil cuando quieras.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[560px] mx-auto mb-10 text-left">
              <SummaryCard kicker="Perfil" value={EXPERIENCE.find((e) => e.value === experience)?.label || "—"} icon="user" />
              <SummaryCard kicker="Objetivos" value={`${goals.length} selecc.`} icon="target" />
              <SummaryCard kicker="Método" value={`${methods.length} selecc.`} icon="flame" />
            </div>

            <Form method="post" className="inline-flex gap-3 flex-wrap justify-center">
              <input type="hidden" name="experienceLevel" value={experience} />
              {goals.map((g) => (
                <input key={g} type="hidden" name="preferredEffects" value={g} />
              ))}
              {methods.map((m) => (
                <input key={m} type="hidden" name="preferredMethods" value={m} />
              ))}
              {effects.map((e) => (
                <input key={e} type="hidden" name="preferredTime" value={e} />
              ))}
              {avoid.map((a) => (
                <input key={a} type="hidden" name="avoidEffects" value={a} />
              ))}
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Guardando…" : "Explorar cepas"}
                <Icon name="arrowRight" size={14} />
              </button>
              <Link to="/profile/edit" className="btn btn-ghost">
                Editar mi perfil
              </Link>
            </Form>
          </div>
        )}
      </div>

      {step < total - 1 && (
        <div className="border-t border-line bg-bg sticky bottom-0">
          <div className="mx-auto max-w-[640px] px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <Icon name="arrowLeft" size={14} />
              Atrás
            </button>
            <div className="mono text-xs text-fg-dim tnum">
              {step + 1} / {total}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canAdvance}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            >
              Continuar
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionCard({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: IconName;
  title: string;
  desc?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        "w-full text-left card p-5 flex items-center gap-4 transition-all",
        active && "border-accent bg-[color-mix(in_oklch,var(--accent-soft)_50%,var(--bg-raised))]"
      )}
    >
      <span
        className={cn(
          "h-12 w-12 rounded-full grid place-items-center shrink-0 transition-colors",
          active
            ? ""
            : "bg-elev text-fg-muted"
        )}
        style={
          active
            ? { background: "var(--accent)", color: "var(--accent-ink)" }
            : undefined
        }
      >
        <Icon name={icon} size={20} />
      </span>
      <span className="flex-1">
        <span className="display text-xl block">{title}</span>
        {desc && <span className="text-sm text-fg-muted block mt-0.5">{desc}</span>}
      </span>
      <span
        className={cn(
          "h-5 w-5 rounded-full border shrink-0",
          active ? "bg-accent border-accent" : "border-line-strong"
        )}
        aria-hidden
      />
    </button>
  );
}

function OptionTile({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        "card p-4 flex flex-col items-start gap-3 transition-colors",
        active && "border-accent bg-[color-mix(in_oklch,var(--accent-soft)_50%,var(--bg-raised))]"
      )}
    >
      <Icon name={icon} size={20} className={active ? "text-accent" : "text-fg-muted"} />
      <span className="text-sm text-fg">{label}</span>
    </button>
  );
}

function ToggleChip({
  active,
  tone = "accent",
  onClick,
  children,
}: {
  active?: boolean;
  tone?: "accent" | "warm";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const onClass = tone === "accent" ? "on-accent" : "on-warm";
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

function SummaryCard({
  kicker,
  value,
  icon,
}: {
  kicker: string;
  value: string;
  icon: IconName;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={14} className="text-accent" />
        <span className="kicker">{kicker}</span>
      </div>
      <div className="text-fg">{value}</div>
    </div>
  );
}
