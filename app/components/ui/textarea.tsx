import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[120px] w-full rounded-md border border-line bg-raised px-3.5 py-3 text-sm text-fg placeholder:text-fg-dim focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-[border-color,box-shadow]",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
