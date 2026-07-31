import { NewsletterSignup } from "~/components/layout/newsletter-signup";

export function meta() {
  return [
    { title: "Dispensarios de Cannabis — WeedHub" },
    { name: "description", content: "Mapa de dispensarios de cannabis verificados en México y Latinoamérica. Encuentra dónde comprar con confianza." },
  ];
}

export default function DispensariosPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-20">
      <div className="mb-16">
        <div className="kicker mb-3">WeedHub · Dispensarios</div>
        <h1 className="display text-5xl mb-6">Directorio de Dispensarios</h1>
        <p className="text-lg text-fg-muted leading-relaxed max-w-2xl">
          El primer mapa serio de puntos de venta legales en México y LATAM —
          con verificación, horarios, productos disponibles y calificaciones de la comunidad.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        <div className="card p-6">
          <div className="kicker mb-2">Solo puntos verificados</div>
          <p className="text-sm text-fg-muted">
            No listamos cualquier dirección. Cada dispensario pasa por verificación antes de aparecer.
            Si está aquí, es de fiar.
          </p>
        </div>
        <div className="card p-6">
          <div className="kicker mb-2">Primero la legalidad</div>
          <p className="text-sm text-fg-muted">
            WeedHub posiciona para el mercado legal emergente. El directorio abrirá conforme avance
            la regulación en cada país.
          </p>
        </div>
        <div className="card p-6">
          <div className="kicker mb-2">Calificado por la comunidad</div>
          <p className="text-sm text-fg-muted">
            Servicio, selección, atmósfera y precio. La comunidad califica lo que importa para tomar
            una buena decisión.
          </p>
        </div>
        <div className="card p-6">
          <div className="kicker mb-2">Mapa interactivo</div>
          <p className="text-sm text-fg-muted">
            Encuentra dispensarios cerca de ti. Filtros por ciudad, tipo de producto, horario y
            calificación mínima.
          </p>
        </div>
      </div>

      <div className="card p-8 mb-16">
        <h2 className="display text-2xl mb-3">¿Tienes un dispensario?</h2>
        <p className="text-fg-muted mb-6 max-w-xl">
          Si operas un punto de venta legal en México o LATAM, queremos listarte.
          El registro básico será gratuito para dispensarios verificados.
        </p>
        <p className="text-sm text-fg-dim">
          Lanzamos cuando la regulación lo permita — y tú ya estarás dentro.
        </p>
      </div>

      <NewsletterSignup />
    </div>
  );
}
