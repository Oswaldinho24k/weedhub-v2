import { useState } from "react";
import { Link } from "react-router";
import { StrainCard } from "~/components/composite/strain-card";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";
import { CONDITIONS } from "~/constants/conditions";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Encuentra tu cepa ideal — WeedHub",
    description: "Responde 4 preguntas y nuestra IA te recomienda las mejores cepas de cannabis para ti.",
    url: `${SITE_URL}/recomendar`,
    canonicalPath: "/recomendar",
  });
}

const EFFECT_OPTIONS = [
  { key: "Relajado", label: "Relajarme 😌" },
  { key: "Creativo", label: "Creatividad 🎨" },
  { key: "Energético", label: "Energía ⚡" },
  { key: "Somnoliento", label: "Dormir 💤" },
  { key: "Alivio dolor", label: "Alivio del dolor 🌡️" },
  { key: "Ansiolítico", label: "Control ansiedad 🧘" },
  { key: "Eufórico", label: "Euforia 😄" },
  { key: "Concentrado", label: "Concentración 🎯" },
];

const EXPERIENCE_OPTIONS = [
  { key: "beginner", label: "Principiante", sub: "Poca o ninguna experiencia" },
  { key: "occasional", label: "Ocasional", sub: "Consumo esporádico" },
  { key: "regular", label: "Regular", sub: "Consumidor frecuente" },
];

const METHOD_OPTIONS = [
  { key: "joint", label: "Fumar 🚬" },
  { key: "vaporizer", label: "Vaporizar 💨" },
  { key: "edible", label: "Comestibles 🍪" },
  { key: "any", label: "No sé / Me da igual" },
];

type Step = 1 | 2 | 3 | 4;

interface Recommendation {
  strain: any;
  reason: string;
}

export default function RecomendarPage() {
  const [step, setStep] = useState<Step>(1);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [experience, setExperience] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleEffect(key: string) {
    setSelectedEffects((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  }

  async function findStrains() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/find-strain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effects: selectedEffects,
          experienceLevel: experience || "regular",
          method: method || "any",
          condition: condition || undefined,
        }),
      });
      const data = await res.json();
      if (data.recommendations?.length > 0) {
        setResults(data.recommendations);
      } else {
        setError("No encontramos cepas con tu perfil exacto. Intenta con otras opciones.");
      }
    } catch {
      setError("Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (results) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="kicker mb-4">IA Cannábica</div>
        <h1 className="display text-4xl md:text-5xl mb-3">Tus cepas ideales</h1>
        <p className="text-fg-muted mb-10 max-w-[54ch]">
          Basado en tu perfil, nuestra IA seleccionó estas cepas para ti.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {results.map(({ strain, reason }, i) => (
            <div key={strain.slug} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="display text-4xl"
                  style={{ color: "var(--accent)", lineHeight: 1 }}
                >
                  {i + 1}
                </span>
              </div>
              <StrainCard strain={strain} />
              <p className="text-sm text-fg-muted px-1 leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setResults(null);
              setStep(1);
              setSelectedEffects([]);
              setExperience("");
              setMethod("");
              setCondition("");
            }}
          >
            <Icon name="arrowLeft" size={14} />
            Volver a intentar
          </button>
          <Link to="/strains" className="btn btn-primary">
            Ver directorio completo
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-16">
      {/* Header */}
      <div className="kicker mb-4">IA Cannábica</div>
      <h1 className="display text-4xl md:text-5xl mb-3">
        Encuentra tu cepa ideal
      </h1>
      <p className="text-fg-muted mb-10 max-w-[54ch]">
        4 preguntas. Nuestra IA analiza 870+ cepas y te recomienda las mejores para ti.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all"
              style={{
                background: s <= step ? "var(--accent)" : "var(--sunken)",
                color: s <= step ? "white" : "var(--fg-dim)",
              }}
            >
              {s < step ? <Icon name="check" size={12} /> : s}
            </div>
            {s < 4 && (
              <div
                className="w-8 h-px"
                style={{ background: s < step ? "var(--accent)" : "var(--line)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Effects */}
      {step === 1 && (
        <StepCard
          title="¿Qué efecto buscas?"
          subtitle="Puedes elegir varios"
          canContinue={selectedEffects.length > 0}
          onNext={() => setStep(2)}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EFFECT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleEffect(opt.key)}
                className={cn(
                  "card p-4 text-sm text-left transition-all hover:border-accent",
                  selectedEffects.includes(opt.key) && "border-accent"
                )}
                style={
                  selectedEffects.includes(opt.key)
                    ? { background: "var(--accent-soft)" }
                    : undefined
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* Step 2: Experience */}
      {step === 2 && (
        <StepCard
          title="¿Cuál es tu nivel de experiencia?"
          canContinue={!!experience}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setExperience(opt.key)}
                className={cn(
                  "card p-5 text-left transition-all hover:border-accent",
                  experience === opt.key && "border-accent"
                )}
                style={
                  experience === opt.key
                    ? { background: "var(--accent-soft)" }
                    : undefined
                }
              >
                <div className="font-medium mb-1">{opt.label}</div>
                <div className="text-xs text-fg-muted">{opt.sub}</div>
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* Step 3: Method */}
      {step === 3 && (
        <StepCard
          title="¿Cómo prefieres consumir?"
          canContinue={!!method}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        >
          <div className="grid grid-cols-2 gap-3">
            {METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMethod(opt.key)}
                className={cn(
                  "card p-4 text-sm text-left transition-all hover:border-accent",
                  method === opt.key && "border-accent"
                )}
                style={
                  method === opt.key
                    ? { background: "var(--accent-soft)" }
                    : undefined
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* Step 4: Condition (optional) */}
      {step === 4 && (
        <StepCard
          title="¿Buscas ayuda con alguna condición?"
          subtitle="Opcional — puedes saltarte este paso"
          canContinue={true}
          ctaLabel={loading ? "Buscando..." : "Encontrar mis cepas"}
          onNext={findStrains}
          onBack={() => setStep(3)}
          disabled={loading}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCondition("")}
              className={cn(
                "card p-3 text-sm text-left transition-all hover:border-accent",
                !condition && "border-accent"
              )}
              style={!condition ? { background: "var(--accent-soft)" } : undefined}
            >
              Ninguna en particular
            </button>
            {CONDITIONS.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCondition(c.slug)}
                className={cn(
                  "card p-3 text-sm text-left transition-all hover:border-accent",
                  condition === c.slug && "border-accent"
                )}
                style={
                  condition === c.slug
                    ? { background: "var(--accent-soft)" }
                    : undefined
                }
              >
                {c.emoji} {c.labelEs}
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-4 text-sm" style={{ color: "var(--warm)" }}>
              {error}
            </p>
          )}
        </StepCard>
      )}
    </div>
  );
}

function StepCard({
  title,
  subtitle,
  children,
  canContinue,
  ctaLabel = "Continuar",
  onNext,
  onBack,
  disabled,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  canContinue: boolean;
  ctaLabel?: string;
  onNext: () => void;
  onBack?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="display text-2xl md:text-3xl">{title}</h2>
        {subtitle && <p className="text-fg-muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {children}
      <div className="flex items-center gap-3 pt-2">
        {onBack && (
          <button type="button" onClick={onBack} className="btn btn-ghost">
            <Icon name="arrowLeft" size={14} />
            Atrás
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue || disabled}
          className="btn btn-primary"
        >
          {ctaLabel}
          {!disabled && <Icon name="arrowRight" size={14} />}
        </button>
      </div>
    </div>
  );
}
