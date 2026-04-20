import { cn } from "~/lib/utils";

interface EffectsChipGroupProps {
  effects: string[];
  selected?: string[];
  onToggle?: (effect: string) => void;
  interactive?: boolean;
  tone?: "accent" | "warm" | "neutral";
  className?: string;
}

export function EffectsChipGroup({
  effects,
  selected = [],
  onToggle,
  interactive = false,
  tone = "neutral",
  className,
}: EffectsChipGroupProps) {
  const onClass =
    tone === "accent" ? "on-accent" : tone === "warm" ? "on-warm" : "on";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {effects.map((effect) => {
        const isSelected = selected.includes(effect);
        if (interactive) {
          return (
            <button
              key={effect}
              type="button"
              className={cn("chip", isSelected && onClass)}
              onClick={() => onToggle?.(effect)}
              aria-pressed={isSelected}
            >
              {effect}
            </button>
          );
        }
        return (
          <span key={effect} className="chip">
            {effect}
          </span>
        );
      })}
    </div>
  );
}
