import { useFetcher } from "react-router";
import { useState } from "react";
import { Icon } from "~/components/ui/icon";

const QUICK_EFFECTS = [
  "Relajación", "Euforia", "Creatividad", "Energía",
  "Somnolencia", "Concentración", "Sociabilidad", "Apetito",
];

interface Props {
  strainId: string;
  isLoggedIn: boolean;
  existingRating?: number;
}

export function QuickRateWidget({ strainId, isLoggedIn, existingRating }: Props) {
  const fetcher = useFetcher();
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(existingRating ?? 0);
  const [effects, setEffects] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(!!existingRating);

  const displayRating = hover || selected;

  function toggleEffect(e: string) {
    setEffects((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : prev.length < 3 ? [...prev, e] : prev
    );
  }

  function submit(rating: number) {
    if (!isLoggedIn) return;
    setSelected(rating);
    setSubmitted(true);
    const fd = new FormData();
    fd.set("rating", String(rating));
    effects.forEach((e) => fd.append("quickEffects", e));
    fetcher.submit(fd, {
      method: "post",
      action: `/api/strains/${strainId}/quick-rate`,
    });
  }

  if (submitted && fetcher.state === "idle") {
    return (
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon name="check" size={14} className="text-accent" />
        Gracias por tu rating
        <button
          type="button"
          className="underline text-xs ml-1"
          onClick={() => setSubmitted(false)}
        >
          Cambiar
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="text-sm text-fg-dim">
        <a href="/auth" className="text-accent hover:underline">Inicia sesión</a>
        {" "}para calificar rápidamente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(star)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${star} estrellas`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={star <= displayRating ? "var(--gold)" : "none"}
              stroke={star <= displayRating ? "var(--gold)" : "var(--line-strong)"}
              strokeWidth="1.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>

      {selected > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-fg-dim">¿Qué efectos sentiste? (máx. 3)</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EFFECTS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => toggleEffect(e)}
                className={`pill text-xs cursor-pointer transition-colors ${effects.includes(e) ? "accent" : ""}`}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => submit(selected)}
            className="btn btn-primary !py-1.5 !px-4 text-xs mt-1"
            disabled={fetcher.state !== "idle"}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
