import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/mapa-verde";
import { connectDB } from "~/lib/db.server";
import { LegalStatusModel, type LegalStatusType } from "~/models/legal-status.server";
import { STATUS_PILL, STATUS_PILL_STYLE, STATUS_DOT_STYLE, statusLabel } from "~/lib/legal-status-ui";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";
import { CountryFlag } from "~/components/ui/country-flag";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

const STATUSES: LegalStatusType[] = ["legal-rec", "legal-med", "decriminalized", "partial", "illegal"];

const UI = {
  es: {
    title: "Mapa Verde: ¿es legal el cannabis en tu país? Estatus 2026 | WeedHub",
    description: "El estatus legal del cannabis en México, América Latina, España y más: qué está permitido, qué no, fuentes oficiales y fecha de revisión.",
    h1: "Mapa Verde",
    lede: "El estatus legal del cannabis, país por país. Cada ficha dice qué está permitido, qué no, de dónde sale la información y cuándo la revisamos.",
    regions: { mexico: "México", "latam-south": "Sudamérica", "latam-central": "Centroamérica", "latam-caribe": "Caribe", europe: "Europa", "north-america": "Norteamérica", other: "Otros" } as Record<string, string>,
    countries: (n: number) => (n === 1 ? "1 país" : `${n} países`),
    more: (n: number) => `+${n} más`,
    reviewed: "Última revisión",
    disclaimer: "Información educativa, no asesoría legal. Las leyes cambian seguido: confirma siempre con una fuente oficial de tu país.",
    dateLocale: "es-MX",
  },
  pt: {
    title: "Mapa Verde: a cannabis é legal no seu país? Status 2026 | WeedHub",
    description: "O status legal da cannabis no Brasil, na América Latina, em Portugal e mais: o que é permitido, o que não é, fontes oficiais e data de revisão.",
    h1: "Mapa Verde",
    lede: "O status legal da cannabis, país por país. Cada ficha diz o que é permitido, o que não é, de onde vem a informação e quando a revisamos.",
    regions: { mexico: "México", "latam-south": "América do Sul", "latam-central": "América Central", "latam-caribe": "Caribe", europe: "Europa", "north-america": "América do Norte", other: "Outros" } as Record<string, string>,
    countries: (n: number) => (n === 1 ? "1 país" : `${n} países`),
    more: (n: number) => `+${n}`,
    reviewed: "Última revisão",
    disclaimer: "Informação educativa, não é assessoria jurídica. As leis mudam com frequência: confirme sempre com uma fonte oficial do seu país.",
    dateLocale: "pt-BR",
  },
} as const;

const REGION_ORDER = ["mexico", "latam-south", "latam-central", "latam-caribe", "europe", "north-america", "other"];

export async function loader({ request }: Route.LoaderArgs) {
  const locale = (await resolveLocale(request)) === "pt" ? "pt" : "es";
  await connectDB();
  const countries = await LegalStatusModel.find({ isActive: true }).sort({ sortOrder: 1, countryNameEs: 1 }).lean();
  const lastReviewed = countries.reduce<Date | null>((max, c) => {
    const d = c.lastReviewedAt ? new Date(c.lastReviewedAt) : null;
    return d && (!max || d > max) ? d : max;
  }, null);
  return { countries, locale, lastReviewed: lastReviewed?.toISOString() ?? null } as const;
}

export function meta({ data }: Route.MetaArgs) {
  const loc = data?.locale ?? "es";
  const U = UI[loc];
  const prefix = loc === "pt" ? "/pt" : "";
  return [
    ...buildMeta({ title: U.title, description: U.description, url: `${SITE_URL}${prefix}/mapa-verde`, canonicalPath: "/mapa-verde", locale: loc }),
    data?.countries
      ? {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: U.h1,
            url: `${SITE_URL}${prefix}/mapa-verde`,
            numberOfItems: data.countries.length,
            itemListElement: data.countries.map((c: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              name: loc === "pt" ? c.countryNamePt || c.countryNameEs : c.countryNameEs,
              url: `${SITE_URL}${prefix}/mapa-verde/${String(c.countryCode).toLowerCase()}`,
            })),
          },
        }
      : {},
  ];
}

export default function MapaVerdePage() {
  const { countries, locale, lastReviewed } = useLoaderData<typeof loader>();
  const U = UI[locale];
  const pt = locale === "pt";
  const prefix = pt ? "/pt" : "";

  const byRegion: Record<string, any[]> = {};
  for (const c of countries as any[]) (byRegion[c.region] ??= []).push(c);
  const stats = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<LegalStatusType, number>;
  for (const c of countries as any[]) stats[c.nationalStatus as LegalStatusType]++;

  return (
    <div>
      <section className="bg-lime text-ink border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <h1 className="rotulo" style={{ fontSize: "clamp(56px, 10vw, 140px)" }}>{U.h1}</h1>
          <p className="mt-5 max-w-[58ch] text-xl font-semibold leading-snug">{U.lede}</p>
          {lastReviewed && (
            <p className="mt-4 inline-flex items-center gap-2 text-[15px] font-bold">
              <Icon name="calendar" size={15} />
              {U.reviewed}: {new Date(lastReviewed).toLocaleDateString(U.dateLocale, { month: "long", year: "numeric" })}
            </p>
          )}
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STATUSES.map((key) => (
              <li key={key} className="bg-white border-2 border-ink px-3 py-2.5">
                <span className="flex items-center gap-2 text-[13px] font-extrabold uppercase [font-stretch:78%]">
                  <span className="w-3 h-3 shrink-0" style={STATUS_DOT_STYLE[key]} />
                  {statusLabel(key, locale)}
                </span>
                <span className="rotulo text-[34px] tnum block mt-1">{stats[key]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 space-y-14">
        {REGION_ORDER.filter((r) => byRegion[r]?.length).map((region) => (
          <section key={region}>
            <h2 className="display text-[clamp(32px,4vw,48px)] mb-6 flex items-baseline gap-3">
              {U.regions[region]}
              <span className="text-base font-bold text-fg-muted [font-stretch:85%]">{U.countries(byRegion[region].length)}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byRegion[region].map((country) => {
                const name = pt ? country.countryNamePt || country.countryNameEs : country.countryNameEs;
                const st = country.nationalStatus as LegalStatusType;
                return (
                  <Link
                    key={country.countryCode}
                    to={`${prefix}/mapa-verde/${country.countryCode.toLowerCase()}`}
                    className="card p-5 hover:bg-yellow hover:text-ink transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <CountryFlag code={country.countryCode} title={name} className="w-9 h-auto border border-ink shrink-0" />
                        <div>
                          <div className="text-xl font-extrabold [font-stretch:85%] leading-tight">{name}</div>
                          {(pt ? country.keyDatePt || country.keyDate : country.keyDate) && (
                            <div className="text-xs font-semibold opacity-75 mt-0.5">{pt ? country.keyDatePt || country.keyDate : country.keyDate}</div>
                          )}
                        </div>
                      </div>
                      <span className={cn("shrink-0 text-xs", STATUS_PILL[st])} style={STATUS_PILL_STYLE[st]}>
                        {statusLabel(st, locale)}
                      </span>
                    </div>
                    <p className="text-[15px] leading-relaxed line-clamp-3">{(pt && country.summaryPt) || country.summary}</p>
                    {country.states?.length > 0 && (
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        {country.states.slice(0, 3).map((s: any) => (
                          <span key={s.name} className={cn("text-xs", STATUS_PILL[s.status as LegalStatusType])} style={STATUS_PILL_STYLE[s.status as LegalStatusType]}>
                            {pt ? s.namePt || s.nameEs : s.nameEs}
                          </span>
                        ))}
                        {country.states.length > 3 && <span className="text-xs font-bold px-1.5 py-0.5">{U.more(country.states.length - 3)}</span>}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <p className="border-2 border-ink bg-yellow text-ink px-4 py-3 text-[15px] font-semibold flex gap-3">
          <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
          {U.disclaimer}
        </p>
      </div>
    </div>
  );
}
