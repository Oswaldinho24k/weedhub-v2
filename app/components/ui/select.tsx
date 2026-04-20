import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-raised px-3.5 text-sm text-fg focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer transition-[border-color,box-shadow]",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = "Select";

export { Select };
