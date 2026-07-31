import { cn } from "~/lib/utils";

interface StrainThumbProps {
  name: string;
  type?: "sativa" | "indica" | "hybrid";
  colorHint?: string;
  dominantTerpene?: string;
  thcMax?: number;
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

const TYPE_CONFIG = {
  sativa: { gx: "20%", gy: "15%", dotColor: "var(--accent)",  turbFreq: "0.028 0.038" },
  indica: { gx: "55%", gy: "70%", dotColor: "var(--warm)",    turbFreq: "0.010 0.015" },
  hybrid: { gx: "75%", gy: "25%", dotColor: "var(--lilac)",   turbFreq: "0.018 0.025" },
};

const TERPENE_COLOR: Record<string, string> = {
  Mirceno:     "#c4832a",
  Limoneno:    "#d4a820",
  Pineno:      "#3d7a42",
  Cariofileno: "#a03535",
  Linalool:    "#9b7fb6",
  Terpinoleno: "#c47ab5",
  Humuleno:    "#9a7320",
  Ocimeno:     "#5a9e6f",
  Bisabolol:   "#d4848a",
};

export function StrainThumb({
  name,
  type = "hybrid",
  colorHint = "#6aa56a",
  dominantTerpene,
  thcMax = 20,
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
  const cfg = TYPE_CONFIG[type];
  const id = seed.toString(36);

  const terpeneColor = (dominantTerpene && TERPENE_COLOR[dominantTerpene]) || colorHint;
  const tgx = `${Math.max(5, 100 - parseInt(cfg.gx))}%`;
  const tgy = `${Math.max(5, 100 - parseInt(cfg.gy))}%`;
  const hgx = `${30 + (seed % 40)}%`;
  const hgy = `${20 + ((seed >> 3) % 40)}%`;

  // Geometric slices
  const slices = Array.from({ length: 3 }, (_, i) => {
    const angle = ((seed * (i + 1) * 137) % 80) - 40;
    const w = 60 + ((seed + i * 73) % 40);
    const h = 8 + ((seed + i * 31) % 12);
    const cx = 20 + ((seed + i * 53) % 60);
    const cy = 20 + ((seed + i * 41) % 60);
    const opacity = 0.06 + ((seed + i * 17) % 5) * 0.01;
    return { angle, w, h, cx, cy, opacity };
  });

  // Turbulence opacity scales with THC — more potent = more intense texture
  const turbOpacity = 0.12 + (Math.min(thcMax, 35) / 35) * 0.14;

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-lg", ratioClass[ratio], className)}
      role="img"
      aria-label={alt || `Arte generativo — ${name}`}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <defs>
          {/* Mesh gradients */}
          <radialGradient id={`ga-${id}`} cx={cfg.gx} cy={cfg.gy} r="80%" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%"   stopColor={colorHint} stopOpacity="0.65" />
            <stop offset="100%" stopColor={colorHint} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`gb-${id}`} cx={tgx} cy={tgy} r="65%" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%"   stopColor={terpeneColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={terpeneColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`gc-${id}`} cx={hgx} cy={hgy} r="40%" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* feTurbulence — fractalNoise seeded by strain name, freq by type */}
          <filter id={`turb-${id}`} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={cfg.turbFreq}
              numOctaves={4}
              seed={seed % 999}
            />
          </filter>

          {/* Vignette */}
          <radialGradient id={`scrim-${id}`} cx="50%" cy="50%" r="70%">
            <stop offset="40%"  stopColor="var(--bg-sunken)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--bg-sunken)" stopOpacity="0.78" />
          </radialGradient>
        </defs>

        {/* Layer 1: dark base */}
        <rect width="100" height="100" fill="var(--bg-sunken)" />

        {/* Layer 2: mesh gradients */}
        <rect width="100" height="100" fill={`url(#ga-${id})`} />
        <rect width="100" height="100" fill={`url(#gb-${id})`} />
        <rect width="100" height="100" fill={`url(#gc-${id})`} />

        {/* Layer 3: geometric slices */}
        {slices.map((s, i) => (
          <rect
            key={i}
            x={s.cx - s.w / 2}
            y={s.cy - s.h / 2}
            width={s.w}
            height={s.h}
            fill={colorHint}
            opacity={s.opacity}
            transform={`rotate(${s.angle} ${s.cx} ${s.cy})`}
          />
        ))}

        {/* Layer 4: organic turbulence texture — opacity driven by THC level */}
        <rect width="100" height="100" filter={`url(#turb-${id})`} opacity={turbOpacity} />

        {/* Layer 5: vignette */}
        <rect width="100" height="100" fill={`url(#scrim-${id})`} />
      </svg>
    </div>
  );
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
