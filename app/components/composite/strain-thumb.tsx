import { cn } from "~/lib/utils";

interface StrainThumbProps {
  name: string;
  colorHint?: string;
  ratio?: "square" | "wide" | "tall";
  className?: string;
  imageUrl?: string;
  alt?: string;
}

const ratioClass = {
  square: "aspect-square",
  wide: "aspect-[4/3]",
  tall: "aspect-[3/4]",
};

export function StrainThumb({
  name,
  colorHint = "#6aa56a",
  ratio = "square",
  className,
  imageUrl,
  alt,
}: StrainThumbProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt || name}
        className={cn("w-full object-cover rounded-lg", ratioClass[ratio], className)}
        loading="lazy"
      />
    );
  }

  const seed = hashCode(name);
  const dots = Array.from({ length: 42 }, (_, i) => {
    const a = ((seed + i * 977) % 360) * (Math.PI / 180);
    const r = 18 + (((seed >> (i % 5)) % 30) + 10);
    const cx = 50 + r * Math.cos(a) * 0.9;
    const cy = 50 + r * Math.sin(a) * 0.9;
    const rr = 0.8 + ((seed + i) % 7) * 0.25;
    return { cx, cy, r: rr };
  });

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        ratioClass[ratio],
        className
      )}
      role="img"
      aria-label={alt || `Ilustración de ${name}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id={`sth-${seed}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={colorHint} stopOpacity="0.55" />
            <stop offset="60%" stopColor={colorHint} stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--bg-sunken)" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="var(--bg-sunken)" />
        <rect width="100" height="100" fill={`url(#sth-${seed})`} />
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill="var(--lilac)"
            opacity={0.22 + (i % 5) * 0.06}
          />
        ))}
      </svg>
    </div>
  );
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
