import { cn } from "~/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl",
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
}: RatingStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              "material-symbols-outlined transition-colors",
              sizeClasses[size],
              filled ? "text-accent-amber" : "text-white/20",
              interactive && "cursor-pointer hover:text-accent-amber"
            )}
            style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            onClick={() => interactive && onChange?.(i + 1)}
          >
            star
          </button>
        );
      })}
    </div>
  );
}
