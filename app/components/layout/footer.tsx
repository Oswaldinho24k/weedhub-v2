import { featureOn } from "~/lib/features";
import { Link } from "react-router";
import { NewsletterSignup } from "./newsletter-signup";
import { useT, useHref } from "~/lib/i18n-context";

export function Footer() {
  const t = useT();
  const href = useHref();
  const year = new Date().getFullYear();
  const madeIn = t.footer.madeIn.replace("{flag}", "México");

  return (
    <footer className="wall mt-20 overflow-hidden">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-14 pb-6">
        <div className="inline-flex items-center gap-3 mb-12 bg-yellow text-ink border-2 border-ink px-4 py-2 -rotate-1">
          <span className="rotulo text-2xl">+18</span>
          <span className="font-extrabold uppercase [font-stretch:80%] text-sm leading-tight">{t.footer.ageGate}<br />{t.footer.responsibleUse}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12">
          <div>
            <p className="text-lg font-semibold max-w-xs leading-snug mb-6">
              {t.footer.tagline}
            </p>
            <NewsletterSignup />
          </div>

          <FooterColumn title={t.nav.strains}>
            <FooterLink to={href("/strains")}>{t.nav.directory}</FooterLink>
            {featureOn("top100") && <FooterLink to={href("/top-100")}>{t.nav.top100}</FooterLink>}
            {featureOn("porCondicion") && <FooterLink to={href("/para")}>{t.nav.conditions}</FooterLink>}
            {featureOn("recomendador") && <FooterLink to="/recomendar">{t.nav.findMyStrain}</FooterLink>}
            <FooterLink to="/strains/sugerir">Sugerir cepa</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.nav.learn}>
            {featureOn("magazine") && <FooterLink to="/magazine">{t.nav.magazine}</FooterLink>}
            <FooterLink to={href("/guias")}>{t.nav.guides}</FooterLink>
            <FooterLink to={href("/glosario")}>{t.nav.glossary}</FooterLink>
            <FooterLink to={href("/mapa-verde")}>{t.nav.greenMap}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.footer.companyTitle}>
            {featureOn("negocios") && <FooterLink to="/marcas">Marcas</FooterLink>}
            {featureOn("pagos") ? (
              <FooterLink to="/planes">Planes</FooterLink>
            ) : (
              <a href="mailto:contacto@weedhub.info?subject=Marca%20o%20negocio%20en%20WeedHub" className="text-[15px] font-medium text-white/90 hover:text-yellow hover:underline underline-offset-4 decoration-2">
                ¿Tienes una marca? Escríbenos
              </a>
            )}
            <FooterLink to={href("/sobre")}>{t.footer.about}</FooterLink>
            <FooterLink to="/auth?mode=register">{t.footer.joinUs}</FooterLink>
            <hr className="border-white/30 my-1" />
            <FooterLink to={href("/terminos")}>{t.footer.terms}</FooterLink>
            <FooterLink to={href("/privacidad")}>{t.footer.privacy}</FooterLink>
          </FooterColumn>
        </div>

        <div aria-hidden className="rotulo rotulo-shade text-yellow mt-16 select-none whitespace-nowrap leading-none" style={{ fontSize: "min(16.2vw, 212px)", marginLeft: "-0.03em" }}>
          WEEDHUB
        </div>
        <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-sm font-semibold text-white/85">
          <p>© {year} WeedHub</p>
          <p>{madeIn}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-extrabold uppercase [font-stretch:78%] text-yellow text-base mb-3">{title}</div>
      <nav className="flex flex-col gap-2">{children}</nav>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="text-[15px] font-medium text-white/90 hover:text-yellow hover:underline underline-offset-4 decoration-2 transition-colors"
    >
      {children}
    </Link>
  );
}
