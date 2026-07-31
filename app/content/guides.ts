import { GUIDES_ES } from "./guides.es";
import { GUIDES_EN } from "./guides.en";
import { GUIDES_PT } from "./guides.pt";
import type { Locale } from "~/lib/i18n";

export type { Guide, GuideSection } from "./guides.es";

export function getGuides(locale: Locale) {
  if (locale === "pt") return GUIDES_PT;
  if (locale === "en") return GUIDES_EN;
  return GUIDES_ES;
}

export function getGuide(slug: string, locale: Locale) {
  return getGuides(locale).find((g) => g.slug === slug);
}
