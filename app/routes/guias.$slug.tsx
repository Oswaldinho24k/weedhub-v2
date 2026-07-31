import { Link } from "react-router";
import type { Route } from "./+types/guias.$slug";
import { resolveLocale } from "~/lib/locale.server";
import { getGuide } from "~/content/guides";
import { getDictionary } from "~/content/locales";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { useT, useHref, useLocale } from "~/lib/i18n-context";
import { Icon } from "~/components/ui/icon";
import { NewsletterSignup } from "~/components/layout/newsletter-signup";

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const guide = data?.guide;
  const prefix = locale !== "es" ? `/${locale}` : "";
  return buildMeta({
    title: dict.meta.guideDetailTitle.replace("{title}", guide?.title || ""),
    description: guide?.description || dict.meta.guidesDescription,
    url: `${SITE_URL}${prefix}/guias/${guide?.slug || ""}`,
    canonicalPath: `/guias/${guide?.slug || ""}`,
    locale,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  const guide = getGuide(params.slug, locale);
  if (!guide) throw new Response("Guía no encontrada", { status: 404 });
  return { guide, locale };
}

export default function GuiaDetailPage({ loaderData }: Route.ComponentProps) {
  const { guide, locale } = loaderData;
  const t = useT();
  const href = useHref();
  const currentLocale = useLocale();
  const prefix = currentLocale !== "es" ? `/${currentLocale}` : "";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: `${SITE_URL}${prefix}/guias/${guide.slug}`,
    inLanguage: currentLocale === "pt" ? "pt-BR" : currentLocale === "en" ? "en" : "es",
    publisher: { "@type": "Organization", name: "WeedHub", url: SITE_URL },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "WeedHub",
        item: `${SITE_URL}${prefix}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t.guides.kicker,
        item: `${SITE_URL}${prefix}/guias`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${SITE_URL}${prefix}/guias/${guide.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[760px] px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Link
        to={href("/guias")}
        className="inline-flex items-center gap-2 kicker text-fg-muted hover:text-fg mb-10 transition-colors"
      >
        <Icon name="arrowLeft" size={12} />
        {t.guides.backToGuides}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <span className="pill lilac">{guide.kicker}</span>
        <span className="kicker">
          {t.guides.readTime.replace("{min}", guide.readTime)}
        </span>
      </div>

      <h1
        className="display mb-8"
        style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.05 }}
      >
        {guide.title}
      </h1>

      <p className="text-lg text-fg-muted leading-relaxed mb-12">
        {guide.description}
      </p>

      <div className="space-y-10">
        {guide.body.map((section, i) => (
          <section key={i}>
            <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
            <p className="text-fg-muted leading-relaxed">{section.content}</p>
          </section>
        ))}
      </div>

      {/* Email capture */}
      <div className="mt-16 card p-6">
        <div className="kicker mb-2" style={{ color: "var(--accent)" }}>
          {t.guides.newsletterKicker}
        </div>
        <p className="text-sm text-fg-muted mb-5">{t.guides.newsletterBody}</p>
        <NewsletterSignup />
      </div>

      <div className="mt-10 pt-8 border-t border-line">
        <Link
          to={href("/guias")}
          className="inline-flex items-center gap-2 kicker text-fg-muted hover:text-fg transition-colors"
        >
          <Icon name="arrowLeft" size={12} />
          {t.guides.backToGuides}
        </Link>
      </div>
    </div>
  );
}
