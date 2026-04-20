export const SITE_URL = "https://www.weedhub.info";
export const SITE_NAME = "WeedHub";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

interface BuildMetaOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
}

export function buildMeta({
  title,
  description,
  url,
  image,
  type = "website",
}: BuildMetaOptions) {
  const ogImage = image || DEFAULT_OG_IMAGE;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "es_MX" },
    { property: "og:locale:alternate", content: "es_ES" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: url },
  ];
}
