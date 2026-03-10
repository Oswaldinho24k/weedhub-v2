import { Link } from "react-router";
import { motion } from "motion/react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface StrainCardProps {
  strain: {
    _id: string;
    name: string;
    slug: string;
    type: string;
    description: string;
    cannabinoidProfile: {
      thc: { min: number; max: number };
      cbd: { min: number; max: number };
    };
    effects: string[];
    averageRatings: { overall: number };
    reviewCount: number;
    imageUrl?: string;
  };
}

const TYPE_VARIANT: Record<string, "sativa" | "indica" | "hybrid"> = {
  sativa: "sativa",
  indica: "indica",
  hybrid: "hybrid",
};

const TYPE_LABEL: Record<string, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
};

export function StrainCard({ strain }: StrainCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Link to={`/strains/${strain.slug}`}>
        <Card className="h-full hover:glow-primary transition-all group">
          {/* Image */}
          <div className="relative h-40 rounded-xl bg-forest-muted mb-3 overflow-hidden">
            {strain.imageUrl ? (
              <img
                src={strain.imageUrl}
                alt={strain.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-forest-accent">
                  potted_plant
                </span>
              </div>
            )}

            {/* Rating badge */}
            {strain.averageRatings.overall > 0 && (
              <div className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-primary flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-accent-amber text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {strain.averageRatings.overall.toFixed(1)}
              </div>
            )}

            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <Badge variant={TYPE_VARIANT[strain.type] || "default"}>
                {TYPE_LABEL[strain.type] || strain.type}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <h3 className="font-display font-bold text-white text-lg group-hover:text-primary transition-colors">
            {strain.name}
          </h3>

          <p className="text-sm text-text-muted mt-1 line-clamp-2">
            {strain.description}
          </p>

          {/* THC/CBD */}
          <div className="flex gap-4 mt-3 text-xs">
            <span className="text-text-muted">
              THC: <span className="text-white font-bold">{strain.cannabinoidProfile.thc.min}–{strain.cannabinoidProfile.thc.max}%</span>
            </span>
            {strain.cannabinoidProfile.cbd.max > 0 && (
              <span className="text-text-muted">
                CBD: <span className="text-white font-bold">{strain.cannabinoidProfile.cbd.min}–{strain.cannabinoidProfile.cbd.max}%</span>
              </span>
            )}
          </div>

          {/* Effects */}
          {strain.effects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {strain.effects.slice(0, 3).map((effect) => (
                <span
                  key={effect}
                  className="px-3 py-1 rounded-full bg-white/5 text-xs text-text-muted hover:bg-white/10 transition-colors duration-200"
                >
                  {effect}
                </span>
              ))}
            </div>
          )}

          {/* Review count */}
          <div className="mt-3 text-xs text-text-muted/60">
            {strain.reviewCount} {strain.reviewCount === 1 ? "reseña" : "reseñas"}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
