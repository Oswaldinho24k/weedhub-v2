import { Progress } from "~/components/ui/progress";

interface CannabinoidBarProps {
  label: string;
  min: number;
  max: number;
  color?: string;
  unit?: string;
}

export function CannabinoidBar({
  label,
  min,
  max,
  color = "var(--color-primary)",
  unit = "%",
}: CannabinoidBarProps) {
  const displayValue = max > 0 ? `${min}–${max}${unit}` : `< 1${unit}`;
  const barValue = max;
  const maxScale = 35; // THC rarely exceeds 35%

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="font-bold" style={{ color }}>
          {displayValue}
        </span>
      </div>
      <Progress value={barValue} max={maxScale} color={color} />
    </div>
  );
}
