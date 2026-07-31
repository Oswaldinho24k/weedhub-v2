import { data, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/mapa-verde.$country";
import { connectDB } from "~/lib/db.server";
import { LegalStatusModel, type LegalStatusType } from "~/models/legal-status.server";
import { STATUS_LABEL, STATUS_PILL, STATUS_PILL_STYLE, STATUS_DOT_STYLE } from "~/lib/legal-status-ui";
import { CountryFlag } from "~/components/ui/country-flag";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();
  const country = await LegalStatusModel.findOne({
    countryCode: params.country.toUpperCase(),
    isActive: true,
  }).lean();
  if (!country) throw data("País no encontrado", { status: 404 });
  return { country };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.country) return [{ title: "País — WeedHub" }];
  const c = data.country;
  return [
    { title: `Cannabis en ${c.countryNameEs} — Estatus Legal | WeedHub` },
    { name: "description", content: c.summary },
    {
      name: "script:ld+json",
      content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `¿Es legal el cannabis en ${c.countryNameEs}?`,
            acceptedAnswer: { "@type": "Answer", text: c.summary },
          },
          ...(c.whatYouCan?.length
            ? [{
                "@type": "Question",
                name: `¿Qué está permitido con el cannabis en ${c.countryNameEs}?`,
                acceptedAnswer: { "@type": "Answer", text: c.whatYouCan.join(". ") },
              }]
            : []),
        ],
      }),
    },
  ];
}

const STATUS_HEADLINE: Record<LegalStatusType, string> = {
  "legal-rec": "Cannabis Recreativo Legal",
  "legal-med": "Cannabis Medicinal Legal",
  decriminalized: "Descriminalizado",
  partial: "Varía por Estado / Región",
  illegal: "Cannabis Ilegal",
};

export default function MapaVerdeCountryPage() {
  const { country } = useLoaderData<typeof loader>();
  const status = country.nationalStatus as LegalStatusType;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-fg-dim mb-10">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>/</span>
        <Link to="/mapa-verde" className="hover:text-fg transition-colors">El Mapa Verde</Link>
        <span>/</span>
        <span>{country.countryNameEs}</span>
      </nav>

      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-5">
          <CountryFlag
            code={country.countryCode}
            title={country.countryNameEs}
            className="w-14 h-auto rounded-sm"
          />
          <div>
            <div className="kicker mb-1">Estatus Legal · Cannabis</div>
            <h1 className="display text-4xl">{country.countryNameEs}</h1>
          </div>
        </div>

        <span
          className={cn("text-sm", STATUS_PILL[status])}
          style={{ ...STATUS_PILL_STYLE[status], padding: "6px 14px", fontSize: "13px" }}
        >
          {STATUS_HEADLINE[status]}
        </span>

        {(country.keyDate || country.keyLaw) && (
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-fg-muted">
            {country.keyDate && (
              <div className="flex items-center gap-2">
                <Icon name="calendar" size={14} className="text-fg-dim" />
                {country.keyDate}
              </div>
            )}
            {country.keyLaw && (
              <div className="flex items-center gap-2">
                <Icon name="scale" size={14} className="text-fg-dim" />
                {country.keyLaw}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card p-6 mb-8">
        <h2 className="display text-lg mb-3">Situación actual</h2>
        <p className="text-fg-muted leading-relaxed">{country.summary}</p>
      </div>

      {/* Can / Can't — neutral cards, icon as color signal */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {country.whatYouCan && country.whatYouCan.length > 0 && (
          <div className="card p-6">
            <h2 className="display text-lg mb-4 flex items-center gap-2">
              <Icon name="check" size={16} className="text-accent" strokeWidth={2} />
              Lo que puedes hacer
            </h2>
            <ul className="space-y-3">
              {country.whatYouCan.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-fg-muted">
                  <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={STATUS_DOT_STYLE["legal-rec"]} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {country.whatYouCant && country.whatYouCant.length > 0 && (
          <div className="card p-6">
            <h2 className="display text-lg mb-4 flex items-center gap-2">
              <Icon name="x" size={16} className="text-warm" strokeWidth={2} />
              Lo que no puedes hacer
            </h2>
            <ul className="space-y-3">
              {country.whatYouCant.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-fg-muted">
                  <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={STATUS_DOT_STYLE["illegal"]} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* States / Regions */}
      {country.states && country.states.length > 0 && (
        <div className="mb-10">
          <h2 className="display text-xl mb-4">Por estado / región</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {country.states.map((state) => (
              <div key={state.name} className="card p-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="font-medium text-sm">{state.nameEs}</div>
                  <span
                    className={cn("text-xs", STATUS_PILL[state.status as LegalStatusType])}
                    style={STATUS_PILL_STYLE[state.status as LegalStatusType]}
                  >
                    {STATUS_LABEL[state.status as LegalStatusType]}
                  </span>
                </div>
                {state.note && <p className="text-xs text-fg-muted">{state.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {country.sources && country.sources.length > 0 && (
        <div className="mb-10">
          <div className="kicker mb-3">Fuentes</div>
          <ul className="space-y-1.5">
            {country.sources.map((src, i) => (
              <li key={i} className="text-sm text-fg-dim">
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors inline-flex items-center gap-1.5"
                  >
                    <Icon name="externalLink" size={12} />
                    {src.label}
                  </a>
                ) : (
                  <span className="text-fg-dim">· {src.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-5 card flex gap-3">
        <Icon name="alert" size={16} className="text-warm shrink-0 mt-0.5" />
        <div className="text-sm text-fg-muted">
          <span className="font-medium" style={{ color: "var(--warm)" }}>Aviso: </span>
          Esta información es de carácter educativo. Las leyes cambian con frecuencia — verifica siempre con fuentes oficiales antes de tomar decisiones.
          <span className="block text-xs mt-1 text-fg-dim">
            Última revisión:{" "}
            {country.lastReviewedAt
              ? new Date(country.lastReviewedAt).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
              : "—"}
          </span>
        </div>
      </div>

      {/* Back */}
      <div className="mt-10">
        <Link
          to="/mapa-verde"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <Icon name="arrowLeft" size={14} />
          Ver todos los países
        </Link>
      </div>
    </div>
  );
}
