import { PRIVACY_SECTIONS, LEGAL_COMPANY } from "~/content/legal";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { LegalPage } from "~/components/layout/legal-page";

export function meta() {
  return buildMeta({
    title: "Política de privacidad — WeedHub",
    description:
      "Qué datos recogemos, para qué los usamos y cómo ejercer tus derechos de acceso, rectificación y eliminación.",
    url: `${SITE_URL}/privacidad`,
  });
}

export default function PrivacidadPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Política de privacidad"
      lastUpdated={LEGAL_COMPANY.lastUpdated}
      sections={PRIVACY_SECTIONS}
    />
  );
}
