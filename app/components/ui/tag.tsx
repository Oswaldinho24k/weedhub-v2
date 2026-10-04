import { type HTMLAttributes, forwardRef } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "~/lib/utils";

const tagVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border font-medium leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:  "bg-elev border-line text-fg-muted",
        accent:   "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]",
        sativa:   "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]",
        indica:   "bg-[var(--warm-soft)] border-[var(--warm)] text-[var(--warm)]",
        hybrid:   "bg-[var(--lilac-soft)] border-[var(--lilac)] text-[var(--lilac)]",
        warm:     "bg-[var(--warm-soft)] border-[var(--warm)] text-[var(--warm)]",
        lilac:    "bg-[var(--lilac-soft)] border-[var(--lilac)] text-[var(--lilac)]",
        gold:     "bg-[color-mix(in_oklch,var(--gold)_15%,transparent)] border-[var(--gold)] text-[var(--gold)]",
        muted:    "bg-sunken border-line text-fg-dim",
        terpene:  "bg-[var(--lilac-soft)] border-[var(--lilac)] text-[var(--lilac)]",
        effect:   "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]",
      },
      size: {
        xs: "text-[10px] px-2 py-0.5",
        sm: "text-xs px-2.5 py-1",
        md: "text-sm px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface TagProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(tagVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Tag.displayName = "Tag";

export { Tag, tagVariants };
