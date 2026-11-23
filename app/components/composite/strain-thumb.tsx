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
  const resolvedUrl = imageUrl;

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={alt || name}
        className={cn("w-full object-cover rounded-lg", ratioClass[ratio], className)}
        loading="lazy"
      />
    );
  }

  const bg = type === "sativa" ? "var(--fluor-yellow)" : type === "indica" ? "var(--fluor-pink)" : "var(--fluor-green)";
  const initials = name
    .replace(/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      role="img"
      aria-label={alt || name}
      className={cn("w-full grid place-items-center border-2 border-ink text-ink overflow-hidden", ratioClass[ratio], className)}
      style={{ background: bg, containerType: "inline-size" }}
    >
      <span className="rotulo" style={{ fontSize: "clamp(10px, 38cqw, 120px)" }}>
        {initials || "?"}
      </span>
    </div>
  );
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
