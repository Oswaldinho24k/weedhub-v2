import { useOutletContext } from "react-router";
import { getPrivacySections, LEGAL_COMPANY } from "~/content/legal";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { LegalPage } from "~/components/layout/legal-page";

const TITLE = {
  es: "Política de privacidad",
  pt: "Política de privacidade",
  en: "Privacy policy",
};
const KICKER = { es: "Legal", pt: "Legal", en: "Legal" };

export function meta() {
  return buildMeta({
    title: "Política de privacidad — WeedHub",
    description:
      "Qué datos recogemos, para qué los usamos y cómo ejercer tus derechos.",
    url: `${SITE_URL}/privacidad`,
  });
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
