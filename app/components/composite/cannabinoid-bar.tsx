interface CannabinoidBarProps {
  label: string;
  min: number;
  max: number;
  unit?: string;
  tone?: "accent" | "warm" | "lilac";
}

const toneColor = {
  accent: "var(--accent)",
  warm: "var(--warm)",
  lilac: "var(--lilac)",
};

export function CannabinoidBar({
  label,
  min,
  max,
  unit = "%",
  tone = "accent",
}: CannabinoidBarProps) {
  const displayValue = max > 0 ? `${min}–${max}${unit}` : `< 1${unit}`;
  const maxScale = 35;
  const pct = Math.min(100, (max / maxScale) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-fg">{label}</span>
        <span className="mono text-xs tnum" style={{ color: toneColor[tone] }}>
          {displayValue}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-sunken overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: toneColor[tone] }}
        />
      </div>
    </div>
  );
}
