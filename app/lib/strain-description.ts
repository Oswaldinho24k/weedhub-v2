import type { Locale } from "./i18n";

interface StrainLike {
  descriptions?: {
    es?: string;
    pt?: string;
    en?: string;
  } | null;
  descriptionEs?: string;
  description?: string;
}

/**
 * Resolve the best strain description for the active locale.
 * Fallback chain: `descriptions[locale]` → `descriptions.es` → `descriptionEs` → `description`.
 * Pure, client-safe.
 */
export function pickStrainDescription(
  strain: StrainLike,
  locale: Locale
): string {
  const map = strain.descriptions;
  if (map) {
    if (map[locale]) return map[locale]!;
    if (map.es) return map.es;
  }
  return strain.descriptionEs || strain.description || "";
}
