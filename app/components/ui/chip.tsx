import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  colorScheme?: "accent" | "warm";
}

const ACTIVE_STYLES: Record<NonNullable<ChipProps["colorScheme"]>, React.CSSProperties> = {
  accent: { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" },
  warm:   { background: "var(--warm-soft)",   borderColor: "var(--warm)",   color: "var(--warm)" },
};

const INACTIVE_STYLE: React.CSSProperties = {
  background: "var(--bg-elev)", borderColor: "var(--line)", color: "var(--fg-muted)",
};

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, count, colorScheme = "accent", children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={active ? ACTIVE_STYLES[colorScheme] : INACTIVE_STYLE}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span
          className="mono text-[10px] leading-none"
          style={{ color: active ? ACTIVE_STYLES[colorScheme].color : "var(--fg-dim)" }}
        >
          {count}
        </span>
      )}
    </button>
  )
);
Chip.displayName = "Chip";

export { Chip };
