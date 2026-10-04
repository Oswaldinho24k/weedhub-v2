import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "~/lib/utils";
import { LEVEL_COLOR, LEVEL_EMOJI } from "~/constants/gamification";

interface LevelPillProps extends HTMLAttributes<HTMLSpanElement> {
  level: string;
  size?: "sm" | "md";
  showEmoji?: boolean;
}

const LevelPill = forwardRef<HTMLSpanElement, LevelPillProps>(
  ({ className, level, size = "md", showEmoji = true, ...props }, ref) => {
    const color = LEVEL_COLOR[level] || "var(--accent)";
    const emoji = LEVEL_EMOJI[level] || "🌱";

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-medium whitespace-nowrap",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
          className
        )}
        style={{ background: color, color: "white", border: "none" }}
        {...props}
      >
        {showEmoji && <span aria-hidden="true">{emoji}</span>}
        {level}
      </span>
    );
  }
);
LevelPill.displayName = "LevelPill";

export { LevelPill };
