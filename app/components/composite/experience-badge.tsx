import { cn } from "~/lib/utils";
import { Icon, type IconName } from "~/components/ui/icon";

interface ExperienceBadgeProps {
  level: string;
  className?: string;
}

const LEVEL_CONFIG: Record<
  string,
  { label: string; icon: IconName; tone: "accent" | "warm" | "lilac" | "neutral" }
> = {
  principiante: { label: "Principiante", icon: "sprout", tone: "accent" },
  intermedio: { label: "Intermedio", icon: "leaf", tone: "lilac" },
  experimentado: { label: "Experimentado", icon: "tree", tone: "warm" },
  experto: { label: "Experto", icon: "crown", tone: "warm" },
};

export function ExperienceBadge({ level, className }: ExperienceBadgeProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.principiante;
  const variantClass =
    config.tone === "accent"
      ? "accent"
      : config.tone === "warm"
        ? "warm"
        : config.tone === "lilac"
          ? "lilac"
          : "";
  return (
    <span className={cn("pill", variantClass, className)}>
      <Icon name={config.icon} size={14} />
      {config.label}
    </span>
  );
}
