import { type HTMLAttributes, type LabelHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "~/lib/utils";

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}

const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ className, label, hint, error, required, htmlFor, children, ...props }, ref) => {
    const autoId = useId();
    const id = htmlFor || autoId;

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-fg-muted uppercase tracking-wide"
          >
            {label}
            {required && <span className="ml-1 text-[var(--warm)]">*</span>}
          </label>
        )}
        <div className="relative">
          {/* Clone child with id so label maps correctly */}
          {children}
        </div>
        {hint && !error && (
          <p className="text-xs text-fg-dim">{hint}</p>
        )}
        {error && (
          <p className="text-xs" style={{ color: "var(--warm)" }}>{error}</p>
        )}
      </div>
    );
  }
);
Field.displayName = "Field";

export { Field };
