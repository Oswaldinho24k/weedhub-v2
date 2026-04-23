import { es, type Dictionary } from "./es";
import { pt } from "./pt";
import { en } from "./en";
import type { Locale } from "~/lib/i18n";

export type { Dictionary } from "./es";

const DICTIONARIES: Record<Locale, Dictionary> = { es, pt, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] || DICTIONARIES.es;
}
