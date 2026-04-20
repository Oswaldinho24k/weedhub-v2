import { TERMS_SECTIONS, LEGAL_COMPANY } from "~/content/legal";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { LegalPage } from "~/components/layout/legal-page";

export function meta() {
  return buildMeta({
    title: "Términos de uso — WeedHub",
    description:
      "Términos que rigen el uso de WeedHub: edad mínima, contenido generado por usuarios, moderación y responsabilidades.",
    url: `${SITE_URL}/terminos`,
  });
}

export default function TerminosPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Términos de uso"
      lastUpdated={LEGAL_COMPANY.lastUpdated}
      sections={TERMS_SECTIONS}
    />
  );
}
