import { cn } from "~/lib/utils";

interface EffectBarProps {
  label: string;
  value: number;
  max?: number;
  size?: "md" | "lg";
  className?: string;
}

export function EffectBar({ label, value, max = 100, size = "md", className }: EffectBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    pct >= 75 ? "var(--accent)" : pct >= 50 ? "var(--warm)" : "var(--lilac)";
  const height = size === "lg" ? 6 : 4;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-fg">{label}</span>
        <span className="mono text-xs text-fg-muted tnum">{Math.round(pct)}</span>
      </div>
      <div
        className="w-full rounded-full bg-sunken overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
