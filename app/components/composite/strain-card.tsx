import { Link } from "react-router";
import { StrainThumb } from "./strain-thumb";
import { Icon } from "~/components/ui/icon";

interface StrainCardProps {
  strain: {
    _id: string;
    name: string;
    slug: string;
    type: string;
    typeBlend?: string;
    description?: string;
    descriptionEs?: string;
    lineage?: string;
    cannabinoidProfile: {
      thc: { min: number; max: number };
      cbd: { min: number; max: number };
    };
    effects: string[];
    dominantTerpene?: string;
    averageRatings: { overall: number };
    reviewCount: number;
    imageUrl?: string;
    colorHint?: string;
  };
  variant?: "card" | "row";
}

const TYPE_LABEL: Record<string, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
};

const TYPE_PILL: Record<string, string> = {
  sativa: "accent",
  indica: "warm",
  hybrid: "lilac",
};

export function StrainCard({ strain, variant = "card" }: StrainCardProps) {
  const typeLabel = strain.typeBlend || TYPE_LABEL[strain.type] || strain.type;
  const pillVariant = TYPE_PILL[strain.type] || "";
  const thcText = `${strain.cannabinoidProfile.thc.max}`;

  if (variant === "row") {
    return (
      <Link
        to={`/strains/${strain.slug}`}
        className="group grid grid-cols-[64px_1fr_auto_auto_auto_20px] items-center gap-5 py-4 border-b border-line hover:bg-elev transition-colors"
      >
        <StrainThumb
          name={strain.name}
          colorHint={strain.colorHint}
          imageUrl={strain.imageUrl}
          ratio="square"
          className="w-16 h-16"
        />
        <div>
          <div className="display text-xl text-fg">{strain.name}</div>
          <div className="text-xs text-fg-muted">
            {typeLabel}
            {strain.lineage && <span> · {strain.lineage}</span>}
          </div>
        </div>
        <div className="mono text-xs text-fg-muted">{strain.dominantTerpene || "—"}</div>
        <div className="mono text-sm tnum" style={{ color: "var(--accent)" }}>
          {thcText}%
        </div>
        <div className="flex items-center gap-1 text-sm text-fg">
          <Icon name="star" size={14} />
          <span className="tnum">{strain.averageRatings.overall.toFixed(1)}</span>
        </div>
        <Icon name="chevronRight" size={16} className="text-fg-dim" />
      </Link>
    );
  }

  return (
    <Link
      to={`/strains/${strain.slug}`}
      className="group card p-4 flex flex-col gap-3 hover:bg-elev hover:-translate-y-0.5 transition-[background,transform] duration-200"
    >
      <StrainThumb
        name={strain.name}
        colorHint={strain.colorHint}
        imageUrl={strain.imageUrl}
        ratio="wide"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`pill ${pillVariant}`}>{typeLabel}</span>
        {strain.dominantTerpene && (
          <span className="pill">{strain.dominantTerpene}</span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="display text-2xl text-fg leading-tight">{strain.name}</h3>
        <span
          className="mono text-lg tnum shrink-0"
          style={{ color: "var(--accent)" }}
        >
          {thcText}%
        </span>
      </div>
      {strain.lineage && (
        <div className="text-xs text-fg-muted -mt-1">{strain.lineage}</div>
      )}
      {(strain.descriptionEs || strain.description) && (
        <p className="text-sm text-fg-muted line-clamp-2">
          {strain.descriptionEs || strain.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-line">
        <div className="flex items-center gap-1 text-sm">
          <Icon name="star" size={14} />
          <span className="tnum">{strain.averageRatings.overall.toFixed(1)}</span>
          <span className="text-fg-dim text-xs">
            ({strain.reviewCount})
          </span>
        </div>
        <span className="mono text-[10px] uppercase tracking-wider text-fg-dim">
          Ver perfil
        </span>
      </div>
    </Link>
  );
}
