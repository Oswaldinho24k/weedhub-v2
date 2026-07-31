import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/mapa-verde";
import { connectDB } from "~/lib/db.server";
import { LegalStatusModel, type LegalStatusType } from "~/models/legal-status.server";
import { STATUS_LABEL, STATUS_PILL, STATUS_PILL_STYLE, STATUS_DOT_STYLE } from "~/lib/legal-status-ui";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { CountryFlag } from "~/components/ui/country-flag";
import { cn } from "~/lib/utils";

export async function loader(_: Route.LoaderArgs) {
  await connectDB();
  const countries = await LegalStatusModel.find({ isActive: true })
    .sort({ sortOrder: 1, countryNameEs: 1 })
    .lean();
  return { countries };
}

export function meta() {
  return buildMeta({
    title: "El Mapa Verde — Estatus Legal del Cannabis en el Mundo | WeedHub",
    description:
      "¿Es legal el cannabis en tu país? Mapa global del estatus legal del cannabis: México, LATAM, Europa, Norteamérica y más. Información actualizada.",
    url: `${SITE_URL}/mapa-verde`,
    canonicalPath: "/mapa-verde",
  });
}

const REGION_LABELS: Record<string, string> = {
  mexico: "México",
  "latam-south": "Sudamérica",
  "latam-central": "Centroamérica",
  "latam-caribe": "Caribe",
  europe: "Europa",
  "north-america": "Norteamérica",
  other: "Otros",
};

const REGION_ORDER = [
  "mexico", "latam-south", "latam-central", "latam-caribe", "europe", "north-america", "other",
];

export default function MapaVerdePage() {
  const { countries } = useLoaderData<typeof loader>();

  const byRegion: Record<string, typeof countries> = {};
  for (const c of countries) {
    if (!byRegion[c.region]) byRegion[c.region] = [];
    byRegion[c.region].push(c);
  }

  const stats: Record<LegalStatusType, number> = {
    "legal-rec": 0, "legal-med": 0, decriminalized: 0, partial: 0, illegal: 0,
  };
  for (const c of countries) {
    stats[c.nationalStatus as LegalStatusType]++;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      {/* Hero */}
      <div className="mb-16 max-w-3xl">
        <div className="kicker mb-3">WeedHub · Regulación</div>
        <h1 className="display text-5xl md:text-6xl mb-6">El Mapa Verde</h1>
        <p className="text-lg text-fg-muted leading-relaxed max-w-2xl">
          El estatus legal del cannabis, país por país, en todo el mundo.
          Con foco en LATAM y el mundo hispanohablante — para que sepas exactamente qué está permitido donde estás.
        </p>
      </div>

      {/* Stats — neutral cards, dot as sole color signal */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-16">
        {(Object.entries(STATUS_LABEL) as [LegalStatusType, string][]).map(([key, label]) => (
          <div key={key} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={STATUS_DOT_STYLE[key]}
              />
              <span className="text-xs text-fg-dim">{label}</span>
            </div>
            <div className="display text-3xl tnum">{stats[key]}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-12 items-center">
        <span className="kicker">Leyenda</span>
        {(Object.entries(STATUS_LABEL) as [LegalStatusType, string][]).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-sm text-fg-muted">
            <span className="w-2 h-2 rounded-full" style={STATUS_DOT_STYLE[key]} />
            {label}
          </span>
        ))}
      </div>

      {/* Regions */}
      <div className="space-y-16">
        {REGION_ORDER.filter((r) => byRegion[r]?.length).map((region) => (
          <section key={region}>
            <h2 className="display text-2xl mb-6 flex items-center gap-3">
              {REGION_LABELS[region]}
              <span className="text-base font-normal text-fg-dim" style={{ fontFamily: "var(--font-body)" }}>
                {byRegion[region].length} {byRegion[region].length === 1 ? "país" : "países"}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byRegion[region].map((country) => (
                <Link
                  key={country.countryCode}
                  to={`/mapa-verde/${country.countryCode.toLowerCase()}`}
                  className="card p-5 hover:bg-elev transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <CountryFlag
                        code={country.countryCode}
                        title={country.countryNameEs}
                        className="w-8 h-auto rounded-sm shrink-0"
                      />
                      <div>
                        <div className="font-medium group-hover:text-accent transition-colors">
                          {country.countryNameEs}
                        </div>
                        {country.keyDate && (
                          <div className="text-xs text-fg-dim mt-0.5">{country.keyDate}</div>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn("shrink-0 text-xs", STATUS_PILL[country.nationalStatus as LegalStatusType])}
                      style={STATUS_PILL_STYLE[country.nationalStatus as LegalStatusType]}
                    >
                      {STATUS_LABEL[country.nationalStatus as LegalStatusType]}
                    </span>
                  </div>
                  <p className="text-sm text-fg-muted leading-relaxed line-clamp-3">
                    {country.summary}
                  </p>
                  {country.states && country.states.length > 0 && (
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {country.states.slice(0, 3).map((s) => (
                        <span
                          key={s.name}
                          className={cn("text-xs", STATUS_PILL[s.status as LegalStatusType])}
                          style={STATUS_PILL_STYLE[s.status as LegalStatusType]}
                        >
                          {s.nameEs}
                        </span>
                      ))}
                      {country.states.length > 3 && (
                        <span className="text-xs text-fg-dim px-1.5 py-0.5">
                          +{country.states.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-20 p-6 card flex gap-3">
        <div className="shrink-0 mt-0.5" style={{ color: "var(--warm)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        </div>
        <div>
          <div className="font-medium text-sm mb-1">Aviso legal</div>
          <p className="text-sm text-fg-muted">
            Esta información es de carácter educativo y se actualiza periódicamente. Las leyes cambian
            frecuentemente — siempre verifica el estatus legal vigente en tu país con una fuente oficial
            antes de tomar decisiones. WeedHub no proporciona asesoría legal.
          </p>
          <p className="text-xs text-fg-dim mt-2">
            Última revisión: {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
