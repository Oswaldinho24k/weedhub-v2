import {
  LEGAL_COMPANY,
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  type LegalSection,
} from "./legal.es";
import { TERMS_SECTIONS_PT, PRIVACY_SECTIONS_PT } from "./legal.pt";
import { TERMS_SECTIONS_EN, PRIVACY_SECTIONS_EN } from "./legal.en";
import type { Locale } from "~/lib/i18n";

export { LEGAL_COMPANY, type LegalSection };

export function getTermsSections(locale: Locale): LegalSection[] {
  if (locale === "pt") return TERMS_SECTIONS_PT;
  if (locale === "en") return TERMS_SECTIONS_EN;
  return TERMS_SECTIONS;
}

export function getPrivacySections(locale: Locale): LegalSection[] {
  if (locale === "pt") return PRIVACY_SECTIONS_PT;
  if (locale === "en") return PRIVACY_SECTIONS_EN;
  return PRIVACY_SECTIONS;
}
