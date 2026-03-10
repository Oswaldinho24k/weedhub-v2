import { cn } from "~/lib/utils";

interface ExperienceBadgeProps {
  level: string;
  className?: string;
}

const LEVEL_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  principiante: { label: "Principiante", icon: "eco", color: "text-green-400" },
  intermedio: { label: "Intermedio", icon: "potted_plant", color: "text-blue-400" },
  experimentado: { label: "Experimentado", icon: "local_florist", color: "text-purple-400" },
  experto: { label: "Experto", icon: "psychology", color: "text-accent-amber" },
};

export function ExperienceBadge({ level, className }: ExperienceBadgeProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.principiante;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium",
        className
      )}
    >
      <span className={cn("material-symbols-outlined text-sm", config.color)}>
        {config.icon}
      </span>
      <span className="text-white">{config.label}</span>
    </div>
  );
}
