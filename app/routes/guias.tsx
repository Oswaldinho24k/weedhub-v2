import { Link } from "react-router";
import type { Route } from "./+types/guias";
import { resolveLocale } from "~/lib/locale.server";
import { getGuides } from "~/content/guides";
import { getDictionary } from "~/content/locales";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { useT, useHref, useLocale } from "~/lib/i18n-context";

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const prefix = locale !== "es" ? `/${locale}` : "";
  return buildMeta({
    title: dict.meta.guidesTitle,
    description: dict.meta.guidesDescription,
    url: `${SITE_URL}${prefix}/guias`,
    canonicalPath: "/guias",
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  const guides = getGuides(locale);
  return { locale, guides };
}

export default function GuiasPage() {
  const t = useT();
  const href = useHref();
  const locale = useLocale();
  const guides = getGuides(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.meta.guidesTitle,
    description: t.meta.guidesDescription,
    url: `${SITE_URL}${locale !== "es" ? `/${locale}` : ""}/guias`,
    inLanguage: locale === "pt" ? "pt-BR" : locale === "en" ? "en" : "es",
    hasPart: guides.map((g) => ({
      "@type": "Article",
      name: g.title,
      description: g.description,
      url: `${SITE_URL}${locale !== "es" ? `/${locale}` : ""}/guias/${g.slug}`,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-10">
        <div className="kicker mb-4">{t.guides.kicker}</div>
        <h1
          className="display max-w-[22ch]"
          style={{ fontSize: "clamp(44px, 7vw, 80px)", lineHeight: 0.98 }}
        >
          {t.guides.headline}
        </h1>
        <p className="mt-6 text-lg text-fg-muted max-w-[52ch] leading-relaxed">
          {t.guides.body}
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((g) => (
            <Link
              key={g.slug}
              to={href(`/guias/${g.slug}`)}
              className="card overflow-hidden flex flex-col hover:border-accent/40 transition-colors"
            >
              <div className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="pill lilac">{g.kicker}</span>
                  <span className="kicker">
                    {t.guides.readTime.replace("{min}", g.readTime)}
                  </span>
                </div>
                <h2
                  className="display"
                  style={{ fontSize: 26, lineHeight: 1.15 }}
                >
                  {g.title}
                </h2>
                <p className="text-sm text-fg-muted leading-relaxed line-clamp-3">
                  {g.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
