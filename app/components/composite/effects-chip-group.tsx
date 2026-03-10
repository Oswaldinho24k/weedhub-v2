import { cn } from "~/lib/utils";

interface EffectsChipGroupProps {
  effects: string[];
  selected?: string[];
  onToggle?: (effect: string) => void;
  interactive?: boolean;
  className?: string;
}

export function EffectsChipGroup({
  effects,
  selected = [],
  onToggle,
  interactive = false,
  className,
}: EffectsChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {effects.map((effect) => {
        const isSelected = selected.includes(effect);
        return interactive ? (
          <button
            key={effect}
            type="button"
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              isSelected
                ? "bg-primary text-background-dark"
                : "bg-white/5 text-white hover:bg-white/10"
            )}
            onClick={() => onToggle?.(effect)}
          >
            {effect}
          </button>
        ) : (
          <span
            key={effect}
            className="px-4 py-1.5 rounded-full bg-white/5 text-sm font-medium text-text-muted"
          >
            {effect}
          </span>
        );
      })}
    </div>
  );
}
