/**
 * Locale types + constants. Client-safe (no server imports).
 */

export const SUPPORTED_LOCALES = ["es", "pt", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_META: Record<
  Locale,
  { label: string; nativeLabel: string; ogLocale: string; htmlLang: string }
> = {
  es: { label: "Español", nativeLabel: "Español", ogLocale: "es_MX", htmlLang: "es" },
  pt: { label: "Portugués", nativeLabel: "Português", ogLocale: "pt_BR", htmlLang: "pt-BR" },
  en: { label: "Inglés", nativeLabel: "English", ogLocale: "en_US", htmlLang: "en" },
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Parse locale from pathname. Returns locale + remainder path.
 *   `/pt/strains`  → { locale: "pt", path: "/strains" }
 *   `/en`          → { locale: "en", path: "/" }
 *   `/strains`     → { locale: "es", path: "/strains" }  (default)
 */
export function parseLocalePath(pathname: string): { locale: Locale; path: string } {
  const match = pathname.match(/^\/(pt|en)(\/.*|$)/);
  if (match) {
    return {
      locale: match[1] as Locale,
      path: match[2] || "/",
    };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/**
 * Given a locale + path, produce the correctly-prefixed URL.
 *   localizeHref("es", "/strains")  → "/strains"
 *   localizeHref("pt", "/strains")  → "/pt/strains"
 */
export function localizeHref(locale: Locale, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return p;
  return `/${locale}${p}`;
}

/**
 * Parse Accept-Language header. Returns first matching supported locale.
 */
export function detectFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const entries = header.split(",").map((entry) => {
    const [tag] = entry.trim().split(";");
    return tag.trim().toLowerCase();
  });
  for (const tag of entries) {
    if (tag.startsWith("pt")) return "pt";
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("es")) return "es";
  }
  return DEFAULT_LOCALE;
}
