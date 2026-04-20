import { Link } from "react-router";
import { Logo } from "./logo";
import { NewsletterSignup } from "./newsletter-signup";

export function Footer() {
  return (
    <footer className="border-t border-line mt-20">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12">
          <div>
            <Logo size={20} />
            <p className="text-sm text-fg-muted mt-4 max-w-xs leading-relaxed mb-8">
              La enciclopedia viva del cannabis hispano. Informa, conecta, cultiva.
            </p>
            <NewsletterSignup />
          </div>

          <FooterColumn title="Producto">
            <FooterLink to="/strains">Directorio</FooterLink>
            <FooterLink to="/community">Comunidad</FooterLink>
            <FooterLink to="/editorial">Magazine</FooterLink>
          </FooterColumn>

          <FooterColumn title="Empresa">
            <FooterLink to="/editorial">Sobre WeedHub</FooterLink>
            <FooterLink to="/auth?mode=register">Únete</FooterLink>
          </FooterColumn>

          <FooterColumn title="Legal">
            <FooterLink to="/terminos">Términos</FooterLink>
            <FooterLink to="/privacidad">Privacidad</FooterLink>
            <span className="block text-sm text-fg-dim">Solo +18</span>
          </FooterColumn>
        </div>

        <div className="mt-12 pt-8 border-t border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-fg-dim mono">
            © {new Date().getFullYear()} WEEDHUB · USO RESPONSABLE
          </p>
          <p className="text-xs text-fg-dim">
            Hecho en <span aria-label="México">🇲🇽</span>, para Latinoamérica.
          </p>
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
