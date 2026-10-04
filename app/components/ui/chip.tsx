import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, count, children, ...props }, ref) => (
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
      style={
        active
          ? {
              background: "var(--accent-soft)",
              borderColor: "var(--accent)",
              color: "var(--accent)",
            }
          : {
              background: "var(--bg-elev)",
              borderColor: "var(--line)",
              color: "var(--fg-muted)",
            }
      }
      {...props}
    >
      {children}
      {count !== undefined && (
        <span
          className="mono text-[10px] leading-none"
          style={{ color: active ? "var(--accent)" : "var(--fg-dim)" }}
        >
          {count}
        </span>
      )}
    </button>
  )
);
Chip.displayName = "Chip";

export { Chip };
