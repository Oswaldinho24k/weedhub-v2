import { Link } from "react-router";
import { Logo } from "./logo";
import { NewsletterSignup } from "./newsletter-signup";
import { useT, useHref } from "~/lib/i18n-context";

export function Footer() {
  const t = useT();
  const href = useHref();
  const year = new Date().getFullYear();
  const madeIn = t.footer.madeIn.replace("{flag}", "🇲🇽");

  return (
    <footer className="border-t border-line mt-20">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12">
          <div>
            <Logo size={20} />
            <p className="text-sm text-fg-muted mt-4 max-w-xs leading-relaxed mb-8">
              {t.footer.tagline}
            </p>
            <NewsletterSignup />
          </div>

          <FooterColumn title={t.footer.productTitle}>
            <FooterLink to={href("/strains")}>{t.nav.directory}</FooterLink>
            <FooterLink to={href("/community")}>{t.nav.community}</FooterLink>
            <FooterLink to={href("/editorial")}>{t.nav.editorial}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.footer.companyTitle}>
            <FooterLink to={href("/editorial")}>{t.footer.about}</FooterLink>
            <FooterLink to="/auth?mode=register">{t.footer.joinUs}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.footer.legalTitle}>
            <FooterLink to={href("/terminos")}>{t.footer.terms}</FooterLink>
            <FooterLink to={href("/privacidad")}>{t.footer.privacy}</FooterLink>
            <span className="block text-sm text-fg-dim">{t.footer.ageGate}</span>
          </FooterColumn>
        </div>

        <div className="mt-12 pt-8 border-t border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-fg-dim mono">
            © {year} WEEDHUB · {t.footer.responsibleUse}
          </p>
          <p className="text-xs text-fg-dim">{madeIn}</p>
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
      <div className="kicker mb-3">{title}</div>
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
      className="text-sm text-fg-muted hover:text-fg transition-colors"
    >
      {children}
    </Link>
  );
}
