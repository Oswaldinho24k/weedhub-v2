import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showcaseBadge?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm:  "h-8 w-8 text-xs",
  md:  "h-10 w-10 text-sm",
  lg:  "h-14 w-14 text-base",
  xl:  "h-20 w-20 text-lg",
  "2xl": "h-24 w-24 md:h-28 md:w-28 text-xl",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", showcaseBadge, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex shrink-0", className)} {...props}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-elev border border-line",
          sizeClasses[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-medium text-accent uppercase">
            {fallback || "?"}
          </span>
        )}
      </div>
      {showcaseBadge && (
        <div
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 grid place-items-center text-base leading-none"
          style={{ borderColor: "var(--bg)", background: "var(--gold)" }}
          aria-label={`Insignia: ${showcaseBadge}`}
        >
          {showcaseBadge}
        </div>
      )}
    </div>
  )
);
Avatar.displayName = "Avatar";

export { Avatar };
