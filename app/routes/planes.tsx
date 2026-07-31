import { Link } from "react-router";
import type { Route } from "./+types/planes";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta(): ReturnType<Route.MetaFunction> {
  return buildMeta({
    title: "Planes para Marcas y Dispensarios — WeedHub",
    description:
      "Activa tu presencia verificada en WeedHub. Desde $39 USD/mes. Sin contratos anuales. 30 días de prueba gratis.",
    url: `${SITE_URL}/planes`,
    canonicalPath: "/planes",
    locale: "es",
  });
}

const BRAND_PLANS = [
  {
    key: "free",
    name: "En Directorio",
    price: null,
    priceNote: "Gratis para siempre",
    description: "Tu marca en la enciclopedia cannábica más grande en español.",
    features: [
      "Perfil básico en el directorio",
      "Nombre, país y descripción",
      "Reseñas de la comunidad",
    ],
    missing: [
      "Badge de verificación",
      "Control del perfil y fotos",
      "Posicionamiento destacado",
      "Catálogo de productos activo",
    ],
    cta: "Registrar mi marca",
    ctaTo: "/marcas/registrar",
    primary: false,
  },
  {
    key: "premium",
    name: "Presencia Verificada",
    price: "$49",
    priceNote: "USD/mes · 30 días gratis",
    description: "Control total de tu perfil y badge de verificación.",
    badge: "Más popular",
    features: [
      "Badge ✓ Verificada en el directorio",
      "Control total: logo, fotos, descripción",
      "Catálogo de productos activo",
      "Posición sobre marcas sin verificar",
      "Sin contratos anuales obligatorios",
    ],
    missing: [
      "Posición top en listas",
      "Rotación en homepage",
    ],
    cta: "Empezar 30 días gratis",
    ctaTo: "/marcas/registrar",
    primary: true,
  },
  {
    key: "enterprise",
    name: "Destacado",
    price: "$149",
    priceNote: "USD/mes",
    description: "Máxima exposición. Primero en listas y homepage.",
    features: [
      "Todo lo de Presencia Verificada",
      "Posición top en el directorio",
      "Rotación en homepage de WeedHub",
      "Badge ✦ Destacada",
    ],
    missing: [],
    cta: "Empezar gratis",
    ctaTo: "/marcas/registrar",
    primary: false,
  },
] as const;

const DISPENSARY_PLANS = [
  { name: "En Directorio", price: "Gratis" },
  { name: "Presencia Verificada", price: "$39 USD/mes" },
  { name: "Destacado", price: "$99 USD/mes" },
] as const;

export default function PlanesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="kicker mb-3">Planes y Precios</div>
        <h1 className="display text-4xl mb-4">
          Crece con WeedHub
        </h1>
        <p className="text-fg-muted max-w-xl mx-auto">
          El directorio cannábico de referencia en español. Regístrate gratis — activa tu verificación
          cuando quieras. Sin contratos anuales.
        </p>
      </div>

      {/* Planes para marcas */}
      <div className="mb-4">
        <div className="kicker mb-6 text-center">Para marcas de cannabis</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {BRAND_PLANS.map((plan) => (
          <div
            key={plan.key}
            className="card p-7 flex flex-col relative"
            style={
              plan.primary
                ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }
                : {}
            }
          >
            {plan.primary && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
              >
                Más popular
              </div>
            )}

            <div className="mb-1 font-bold text-lg">{plan.name}</div>

            <div className="mb-1">
              {plan.price ? (
                <span className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
                  {plan.price}
                </span>
              ) : (
                <span className="text-3xl font-bold text-fg-dim">Gratis</span>
              )}
            </div>
            <div className="text-xs text-fg-dim mb-4">{plan.priceNote}</div>

            <p className="text-sm text-fg-muted mb-6">{plan.description}</p>

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span style={{ color: "var(--accent)" }} className="mt-0.5 shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
              {plan.missing.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-fg-dim">
                  <span className="mt-0.5 shrink-0 opacity-40">—</span>
                  <span className="opacity-50">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to={plan.ctaTo}
              className={`btn text-sm text-center ${plan.primary ? "btn-primary" : "btn-ghost"}`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Nota dispensarios */}
      <div className="card p-6 mb-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="kicker mb-1">Para dispensarios y clubes</div>
            <p className="text-sm text-fg-muted">
              Precios especiales para puntos de venta y clubes cannábicos.
            </p>
            <div className="flex gap-6 mt-3">
              {DISPENSARY_PLANS.map((p) => (
                <div key={p.name}>
                  <div className="text-xs text-fg-dim">{p.name}</div>
                  <div className="font-semibold text-sm mt-0.5" style={{ color: "var(--accent)" }}>
                    {p.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link to="/dispensarios/agregar" className="btn btn-ghost text-sm shrink-0">
            Agregar mi dispensario →
          </Link>
        </div>
      </div>

      {/* Argumentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div>
          <div className="kicker mb-2">Flujo, no transacción</div>
          <p className="text-sm text-fg-muted leading-relaxed">
            Nuestros usuarios buscan información antes de comprar. Tu marca aparece en el momento
            exacto de decisión, no en un banner ignorado.
          </p>
        </div>
        <div>
          <div className="kicker mb-2">Sin comisiones</div>
          <p className="text-sm text-fg-muted leading-relaxed">
            No cobramos porcentaje sobre ventas. Una cuota mensual fija y el resto es tuyo. Modelo
            transparente para el mercado emergente.
          </p>
        </div>
        <div>
          <div className="kicker mb-2">Entra antes del boom</div>
          <p className="text-sm text-fg-muted leading-relaxed">
            Posicionarse en WeedHub hoy equivale a ser de los primeros en el directorio cuando
            México y LATAM regularicen el mercado commercial.
          </p>
        </div>
      </div>

      <div className="text-center border-t border-line pt-12">
        <p className="text-sm text-fg-muted mb-4">¿Dudas antes de registrarte?</p>
        <a
          href="mailto:hola@weedhub.info?subject=Consulta planes WeedHub"
          className="btn btn-ghost"
        >
          Escríbenos a hola@weedhub.info
        </a>
      </div>
    </div>
  );
}
