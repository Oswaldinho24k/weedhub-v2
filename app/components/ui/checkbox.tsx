import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-3 cursor-pointer select-none text-sm text-fg-muted"
    >
      <input
        type="checkbox"
        ref={ref}
        id={id}
        className={cn("peer sr-only", className)}
        {...props}
      />
      <span
        aria-hidden
        className="relative h-[18px] w-[18px] shrink-0 rounded-[4px] border border-line-strong bg-raised flex items-center justify-center transition peer-checked:bg-accent peer-checked:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[color-mix(in_oklch,var(--accent)_30%,transparent)] [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-ink transition-opacity"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {label && <span>{label}</span>}
    </label>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
