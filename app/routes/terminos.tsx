import { useOutletContext } from "react-router";
import type { Route } from "./+types/terminos";
import { getTermsSections, LEGAL_COMPANY } from "~/content/legal";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { LegalPage } from "~/components/layout/legal-page";
import { resolveLocale } from "~/lib/locale.server";
import { getDictionary } from "~/content/locales";

const TITLE = {
  es: "Términos de uso",
  pt: "Termos de uso",
  en: "Terms of service",
};
const KICKER = { es: "Legal", pt: "Legal", en: "Legal" };

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const prefix = locale !== "es" ? `/${locale}` : "";
  return buildMeta({
    title: dict.meta.terminosTitle,
    description: dict.meta.terminosDescription,
    url: `${SITE_URL}${prefix}/terminos`,
    canonicalPath: "/terminos",
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  return { locale };
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
