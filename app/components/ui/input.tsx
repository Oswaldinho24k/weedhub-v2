import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border bg-raised px-3.5 text-sm text-fg placeholder:text-fg-dim focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow]",
        "border-line",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
