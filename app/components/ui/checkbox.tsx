import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        ref={ref}
        id={id}
        className={cn(
          "h-5 w-5 rounded border-2 border-forest-accent bg-forest-muted text-primary focus:ring-primary focus:ring-2 cursor-pointer accent-primary transition-all duration-200",
          className
        )}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm text-text-muted cursor-pointer">
          {label}
        </label>
      )}
    </div>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
