import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background-dark">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                potted_plant
              </span>
              <span className="font-display text-lg font-bold text-white">
                Weed<span className="text-primary">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted">
              Tu guía de cannabis en español. Descubre, reseña y comparte tus
              experiencias con la comunidad.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-white mb-3">Explora</h4>
            <nav className="space-y-2">
              <Link
                to="/strains"
                className="block text-sm text-text-muted hover:text-white transition-colors"
              >
                Cepas
              </Link>
              <span className="block text-sm text-text-muted/40">
                Guías (próximamente)
              </span>
              <span className="block text-sm text-text-muted/40">
                Comunidad (próximamente)
              </span>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-bold text-white mb-3">Legal</h4>
            <nav className="space-y-2">
              <span className="block text-sm text-text-muted/40">
                Términos de uso
              </span>
              <span className="block text-sm text-text-muted/40">
                Privacidad
              </span>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-text-muted/60">
            &copy; {new Date().getFullYear()} WeedHub. Uso responsable.
            Solo para mayores de edad.
          </p>
        </div>
      </div>
    </footer>
  );
}
