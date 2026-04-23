import { useOutletContext } from "react-router";
import { getTermsSections, LEGAL_COMPANY } from "~/content/legal";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { LegalPage } from "~/components/layout/legal-page";

const TITLE = {
  es: "Términos de uso",
  pt: "Termos de uso",
  en: "Terms of service",
};
const KICKER = { es: "Legal", pt: "Legal", en: "Legal" };

export function meta() {
  return buildMeta({
    title: "Términos de uso — WeedHub",
    description:
      "Términos que rigen el uso de WeedHub: edad mínima, contenido generado por usuarios, moderación y responsabilidades.",
    url: `${SITE_URL}/terminos`,
  });
}

export default function TerminosPage() {
  const context = useOutletContext<{ locale?: "es" | "pt" | "en" }>();
  const locale = context?.locale || "es";
  return (
    <LegalPage
      kicker={KICKER[locale]}
      title={TITLE[locale]}
      lastUpdated={LEGAL_COMPANY.lastUpdated}
      sections={getTermsSections(locale)}
    />
  );
}
