import { useOutletContext } from "react-router";
import type { Route } from "./+types/privacidad";
import { getPrivacySections, LEGAL_COMPANY } from "~/content/legal";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { LegalPage } from "~/components/layout/legal-page";
import { resolveLocale } from "~/lib/locale.server";
import { getDictionary } from "~/content/locales";

const TITLE = {
  es: "Política de privacidad",
  pt: "Política de privacidade",
  en: "Privacy policy",
};
const KICKER = { es: "Legal", pt: "Legal", en: "Legal" };

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const prefix = locale !== "es" ? `/${locale}` : "";
  return buildMeta({
    title: dict.meta.privacidadTitle,
    description: dict.meta.privacidadDescription,
    url: `${SITE_URL}${prefix}/privacidad`,
    canonicalPath: "/privacidad",
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  return { locale };
}

export default function PrivacidadPage() {
  const context = useOutletContext<{ locale?: "es" | "pt" | "en" }>();
  const locale = context?.locale || "es";
  return (
    <LegalPage
      kicker={KICKER[locale]}
      title={TITLE[locale]}
      lastUpdated={LEGAL_COMPANY.lastUpdated}
      sections={getPrivacySections(locale)}
    />
  );
}
