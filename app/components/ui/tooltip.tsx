import { type ReactNode, useState } from "react";
import { cn } from "~/lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-forest-deep border border-white/10 rounded-lg whitespace-nowrap z-50",
            className
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-forest-deep" />
        </div>
      )}
    </div>
  );
}

export { Tooltip };
