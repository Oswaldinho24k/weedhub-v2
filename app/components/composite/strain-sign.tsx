import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { Icon } from "~/components/ui/icon";
import { effectLabels } from "~/lib/effect-labels";

export type SignTone = "pink" | "yellow" | "green" | "orange" | "blank";

const TYPE_TONE: Record<string, SignTone> = {
  sativa: "yellow",
  indica: "pink",
  hybrid: "green",
};

const TYPE_LABEL: Record<string, Record<string, string>> = {
  es: { sativa: "Sativa", indica: "Indica", hybrid: "Híbrida" },
  pt: { sativa: "Sativa", indica: "Indica", hybrid: "Híbrida" },
  en: { sativa: "Sativa", indica: "Indica", hybrid: "Hybrid" },
};

const COPY: Record<string, { reviews: (n: number) => string; none: string; few: string; noThc: string; write: string }> = {
  es: { reviews: (n) => (n === 1 ? "1 reseña" : `${n} reseñas`), none: "Sin reseñas aún", few: "pocas reseñas", noThc: "THC sin datos", write: "Pinta tu reseña" },
  pt: { reviews: (n) => (n === 1 ? "1 avaliação" : `${n} avaliações`), none: "Sem avaliações ainda", few: "poucas avaliações", noThc: "THC sem dados", write: "Escreva a sua" },
  en: { reviews: (n) => (n === 1 ? "1 review" : `${n} reviews`), none: "No reviews yet", few: "few reviews", noThc: "THC no data", write: "Write a review" },
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface StrainSignData {
  name: string;
  slug: string;
  type: "sativa" | "indica" | "hybrid";
  cannabinoidProfile?: { thc?: { max?: number } };
  effects?: string[];
  reviewCount?: number;
  averageRatings?: { overall?: number };
}

/** A fluorescent market cartulina for one strain. Tone follows type; tilt is stable per name. */
export function StrainSign({
  strain,
  to,
  locale = "es",
  tilt = true,
  size = "md",
  className,
  style,
}: {
  strain: StrainSignData;
  to: string;
  locale?: string;
  tilt?: boolean;
  size?: "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = COPY[locale] ?? COPY.es;
  const tone = TYPE_TONE[strain.type] ?? "blank";
  const h = hash(strain.name);
  const deg = tilt ? ((h % 7) - 3) * 0.75 : 0;
  const thc = strain.cannabinoidProfile?.thc?.max ?? 0;
  const n = strain.reviewCount ?? 0;
  const rating = strain.averageRatings?.overall ?? 0;
  const effect = effectLabels(strain.effects, locale)[0];
  const typeLabel = (TYPE_LABEL[locale] ?? TYPE_LABEL.es)[strain.type] ?? strain.type;

  return (
    <div
      className={cn(
        "cartulina cartulina-pin pin-in group relative flex flex-col gap-1.5 transition-transform duration-150 hover:!rotate-0 hover:-translate-y-1 focus-within:!rotate-0",
        `cartulina--${tone}`,
        size === "lg" ? "p-5 min-h-[240px]" : "min-h-[210px]",
        className
      )}
      style={{ ["--tilt" as string]: `${deg}deg`, transform: `rotate(${deg}deg)`, ...style }}
    >
      <Link
        to={to}
        className="marker leading-[1.04] [overflow-wrap:anywhere] after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        style={{ fontSize: size === "lg" ? "clamp(24px, 6vw, 34px)" : "clamp(19px, 5vw, 27px)" }}
      >
        {strain.name}
      </Link>
      <span className="mt-auto pt-2">
        {thc > 0 ? (
          <span className="rotulo leading-none block" style={{ fontSize: size === "lg" ? "clamp(38px, 9vw, 56px)" : "clamp(32px, 8vw, 44px)" }}>
            {Math.round(thc)}
            <span style={{ fontSize: "0.5em" }}>%</span>
          </span>
        ) : (
          <span className="text-[14px] font-bold [font-stretch:85%] block">{c.noThc}</span>
        )}
        <span className="block text-[12px] font-extrabold uppercase [font-stretch:78%] tracking-[.03em] mt-1">
          {thc > 0 ? "THC · " : ""}
          {typeLabel}
          {effect ? ` · ${effect}` : ""}
        </span>
      </span>
      <span className="flex items-end justify-between gap-2 border-t-2 border-ink pt-2 mt-1">
        <Evidence n={n} rating={rating} c={c} />
        <Link
          to={`/strains/${strain.slug}/review`}
          aria-label={`${c.write}: ${strain.name}`}
          className="relative z-10 inline-flex items-center gap-1 text-[12px] font-extrabold uppercase [font-stretch:78%] bg-ink text-white px-1.5 py-1 hover:bg-white hover:text-ink border-2 border-ink transition-colors"
        >
          <Icon name="edit" size={11} />
          <span className="hidden sm:inline">{c.write}</span>
        </Link>
      </span>
    </div>
  );
}

/** Rating lettered with the weight of its evidence: more reviews, stronger paint. */
function Evidence({ n, rating, c }: { n: number; rating: number; c: (typeof COPY)["es"] }) {
  if (n === 0) {
    return <span className="text-[12px] font-bold [font-stretch:85%] opacity-80">{c.none}</span>;
  }
  const strong = n >= 10;
  return (
    <span className="leading-tight">
      <span
        className={cn("inline-flex items-center gap-1 tnum", strong ? "text-2xl font-black" : "text-lg font-bold opacity-85")}
        style={{ fontStretch: "80%" }}
      >
        <Icon name="star" size={strong ? 18 : 14} className="fill-current" />
        {rating.toFixed(1)}
      </span>
      <span className="block text-[12px] font-bold [font-stretch:85%]">
        {c.reviews(n)}
        {n < 3 ? ` · ${c.few}` : ""}
      </span>
    </span>
  );
}
