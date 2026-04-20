import { type VariantProps, cva } from "class-variance-authority";
import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

const badgeVariants = cva("pill", {
  variants: {
    variant: {
      default: "",
      sativa: "accent",
      indica: "warm",
      hybrid: "lilac",
      effect: "",
      rating: "accent",
      accent: "accent",
      warm: "warm",
      lilac: "lilac",
      active: "active",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
