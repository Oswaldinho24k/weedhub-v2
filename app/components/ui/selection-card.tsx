import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";
import { Icon, type IconName } from "~/components/ui/icon";

export interface SelectionCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: IconName;
  title: string;
  description?: string;
  multiSelect?: boolean;
  layout?: "vertical" | "horizontal";
}

const SelectionCard = forwardRef<HTMLButtonElement, SelectionCardProps>(
  (
    {
      className,
      active = false,
      icon,
      title,
      description,
      multiSelect = false,
      layout = "vertical",
      ...props
    },
    ref
  ) => {
    const isHorizontal = layout === "horizontal";

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={active}
        className={cn(
          "relative w-full text-left transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          "disabled:pointer-events-none disabled:opacity-50",
          isHorizontal ? "flex items-center gap-5" : "flex flex-col",
          className
        )}
        style={{
          padding: isHorizontal ? "20px 24px" : 24,
          border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
          borderRadius: "var(--radius-lg)",
          background: active ? "var(--accent-soft)" : "var(--bg-raised)",
        }}
        {...props}
      >
        {icon && (
          <div
            style={{
              width: isHorizontal ? 48 : 40,
              height: isHorizontal ? 48 : 40,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              marginBottom: isHorizontal ? 0 : 14,
              background: active ? "var(--accent-soft)" : "var(--bg-elev)",
              color: active ? "var(--accent)" : "var(--fg-muted)",
            }}
          >
            <Icon name={icon} size={22} />
          </div>
        )}

        <div className={cn("flex-1 min-w-0", isHorizontal ? "" : "")}>
          <div
            className="display font-medium"
            style={{ fontSize: isHorizontal ? 20 : 22, color: "var(--fg)" }}
          >
            {title}
          </div>
          {description && (
            <p
              className="mt-1 leading-snug"
              style={{ fontSize: 13, color: "var(--fg-muted)" }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Active indicator */}
        {active && (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--accent-ink)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              name={multiSelect ? "check" : "check"}
              size={11}
              strokeWidth={3}
            />
          </div>
        )}

        {/* Inactive indicator for horizontal radio style */}
        {!active && isHorizontal && (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              flexShrink: 0,
              border: `1.5px solid var(--line-strong)`,
              background: "transparent",
            }}
          />
        )}
      </button>
    );
  }
);
SelectionCard.displayName = "SelectionCard";

export { SelectionCard };
