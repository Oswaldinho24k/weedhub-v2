import { type LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("kicker block mb-2 leading-none", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
