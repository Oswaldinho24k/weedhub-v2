import { cn } from "~/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const pixelSize = { sm: 14, md: 18, lg: 22, xl: 36 };

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const px = pixelSize[size];
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rating.toFixed(1)} de ${maxRating}`}
    >
      {Array.from({ length: maxRating }).map((_, i) => {
        const n = i + 1;
        const full = rating >= n - 0.25;
        const half = !full && rating >= n - 0.75;
        return (
          <Star
            key={i}
            filled={full ? 1 : half ? 0.5 : 0}
            size={px}
            interactive={interactive}
            onClick={interactive ? () => onChange?.(n) : undefined}
            label={`${n} estrella${n === 1 ? "" : "s"}`}
          />
        );
      })}
    </div>
  );
}

function Star({
  filled,
  size,
  interactive,
  onClick,
  label,
}: {
  filled: 0 | 0.5 | 1;
  size: number;
  interactive: boolean;
  onClick?: () => void;
  label: string;
}) {
  const gradId = `sg-${size}-${label.replace(/\s+/g, "")}`;
  const Cmp = interactive ? "button" : "span";
  return (
    <Cmp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-label={interactive ? label : undefined}
      className={cn(
        "inline-flex",
        interactive && "cursor-pointer transition-transform hover:scale-110"
      )}
      style={{ color: "var(--gold)" }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <defs>
          <linearGradient id={gradId}>
            <stop offset={`${filled * 100}%`} stopColor="currentColor" />
            <stop offset={`${filled * 100}%`} stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 2.5l2.9 6.1 6.6.8-4.9 4.7 1.3 6.5L12 17.4l-5.9 3.2 1.3-6.5-4.9-4.7 6.6-.8z"
          fill={`url(#${gradId})`}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      </svg>
    </Cmp>
  );
}
