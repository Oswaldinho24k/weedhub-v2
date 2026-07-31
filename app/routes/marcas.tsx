import { Link } from "react-router";
import { NewsletterSignup } from "~/components/layout/newsletter-signup";

export function meta() {
  return [
    { title: "Marcas de Cannabis — WeedHub" },
    { name: "description", content: "Directorio de marcas de cannabis verificadas en México y Latinoamérica. Descubre quiénes producen con transparencia y calidad." },
  ];
}

export default function MarcasPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-20">
      <div className="mb-16">
        <div className="kicker mb-3">WeedHub · Marcas</div>
        <h1 className="display text-5xl mb-6">Directorio de Marcas</h1>
        <p className="text-lg text-fg-muted leading-relaxed max-w-2xl">
          Estamos construyendo el primer directorio serio de marcas cannábicas en LATAM — con perfiles verificados,
          transparencia en producción y reseñas reales de la comunidad.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-16">
        <div className="card p-6">
          <div className="kicker mb-2">Marcas verificadas</div>
          <p className="text-sm text-fg-muted">
            Cada marca pasa por un proceso de verificación antes de aparecer en el directorio. Sin spam, sin perfiles falsos.
          </p>
        </div>
        <div className="card p-6">
          <div className="kicker mb-2">Reseñas reales</div>
          <p className="text-sm text-fg-muted">
            La comunidad WeedHub califica productos, servicio y consistencia. Los números no mienten.
          </p>
        </div>
        <div className="card p-6">
          <div className="kicker mb-2">Primero LATAM</div>
          <p className="text-sm text-fg-muted">
            Empezamos en México y vamos por toda la región. Nos interesa el mercado legal emergente, no solo el de EUA.
          </p>
        </div>
      </div>

      <div className="card p-8 mb-16">
        <h2 className="display text-2xl mb-3">¿Tienes una marca?</h2>
        <p className="text-fg-muted mb-6 max-w-xl">
          Si produces o distribuyes cannabis legal en México o LATAM, queremos que estés aquí.
          El registro básico es gratuito. Lanzamos en los próximos meses.
        </p>
        <Link to="/#newsletter" className="btn btn-primary">
          Notifícame cuando abra el registro
        </Link>
      </div>

      <NewsletterSignup />
    </div>
  );
}
