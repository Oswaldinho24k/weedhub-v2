import { type VariantProps, cva } from "class-variance-authority";
import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/5 text-white",
        sativa: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        indica: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        hybrid: "bg-primary/10 text-primary border border-primary/20",
        effect: "bg-white/5 text-text-muted hover:bg-white/10",
        rating: "rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
