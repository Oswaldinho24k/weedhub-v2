export const SITE_URL = "https://www.weedhub.info";
export const SITE_NAME = "WeedHub";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;
export const BRAND_IMAGE = `${SITE_URL}/brand.svg`;

type LocaleKey = "es" | "pt" | "en";

const OG_LOCALE: Record<LocaleKey, { primary: string; alternates: string[] }> = {
  es: { primary: "es_MX", alternates: ["es_ES", "pt_BR", "en_US"] },
  pt: { primary: "pt_BR", alternates: ["es_MX", "en_US"] },
  en: { primary: "en_US", alternates: ["es_MX", "pt_BR"] },
};

function normLocale(locale?: string | null): LocaleKey {
  const base = (locale || "es").slice(0, 2).toLowerCase();
  if (base === "pt") return "pt";
  if (base === "en") return "en";
  return "es";
}

interface BuildMetaOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
  locale?: string | null;
}

export function buildMeta({
  title,
  description,
  url,
  image,
  type = "website",
  locale,
}: BuildMetaOptions) {
  const ogImage = image || DEFAULT_OG_IMAGE;
  const isDefault = ogImage === DEFAULT_OG_IMAGE;
  const { primary, alternates } = OG_LOCALE[normLocale(locale)];

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    ...(isDefault
      ? [
          { property: "og:image:type", content: "image/svg+xml" },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
        ]
      : []),
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: primary },
    ...alternates.map((alt) => ({
      property: "og:locale:alternate",
      content: alt,
    })),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: url },
  ];
}
