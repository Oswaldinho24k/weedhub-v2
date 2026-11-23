import { data, useLoaderData, Link } from "react-router";
import { buildMeta, SITE_URL } from "~/lib/seo";
import type { Route } from "./+types/mapa-verde.$country";
import { connectDB } from "~/lib/db.server";
import { LegalStatusModel, type LegalStatusType } from "~/models/legal-status.server";
import { STATUS_LABEL, STATUS_PILL, STATUS_PILL_STYLE, STATUS_DOT_STYLE } from "~/lib/legal-status-ui";
import { CountryFlag } from "~/components/ui/country-flag";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";
import { resolveLocale } from "~/lib/locale.server";
import { statusLabel, ptIn } from "~/lib/legal-status-ui";

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = (await resolveLocale(request)) === "pt" ? "pt" : "es";
  await connectDB();
  const country = await LegalStatusModel.findOne({
    countryCode: params.country.toUpperCase(),
    isActive: true,
  }).lean();
  if (!country) throw data("País no encontrado", { status: 404 });
  return { country, locale } as const;
}

const M = {
  es: {
    title: (n: string) => `¿Es legal el cannabis en ${n}? Estatus 2026 | WeedHub`,
    q1: (n: string) => `¿Es legal el cannabis en ${n}?`,
    q2: (n: string) => `¿Qué está permitido con el cannabis en ${n}?`,
    q3: (n: string) => `¿Qué sigue prohibido en ${n}?`,
    home: "Inicio",
  },
  pt: {
    title: (n: string) => `A cannabis é legal ${n}? Status 2026 | WeedHub`,
    q1: (n: string) => `A cannabis é legal ${n}?`,
    q2: (n: string) => `O que é permitido com a cannabis ${n}?`,
    q3: (n: string) => `O que continua proibido ${n}?`,
    home: "Início",
  },
} as const;

export function meta({ data }: Route.MetaArgs) {
  if (!data?.country) return [{ title: "País — WeedHub" }];
  const c = data.country as any;
  const loc = data.locale;
  const L = M[loc];
  const pt = loc === "pt";
  const name = pt ? c.countryNamePt || c.countryNameEs : c.countryNameEs;
  const inName = pt ? ptIn(c.countryCode, name) : name;
  const summary: string = (pt && c.summaryPt) || c.summary;
  const can: string[] = (pt && c.whatYouCanPt) || c.whatYouCan || [];
  const cant: string[] = (pt && c.whatYouCantPt) || c.whatYouCant || [];
  const path = `/mapa-verde/${String(c.countryCode).toLowerCase()}`;
  const url = `${SITE_URL}${pt ? "/pt" : ""}${path}`;
  const desc = summary.length > 155 ? summary.slice(0, 152).replace(/\s+\S*$/, "") + "…" : summary;
  const reviewed = c.lastReviewedAt ? new Date(c.lastReviewedAt).toISOString() : undefined;
  return [
    ...buildMeta({ title: L.title(inName), description: desc, url, type: "article", locale: loc, canonicalPath: path }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        url,
        inLanguage: pt ? "pt-BR" : "es",
        ...(reviewed ? { dateModified: reviewed } : {}),
        mainEntity: [
          { "@type": "Question", name: L.q1(inName), acceptedAnswer: { "@type": "Answer", text: summary } },
          ...(can.length ? [{ "@type": "Question", name: L.q2(inName), acceptedAnswer: { "@type": "Answer", text: can.join(". ") } }] : []),
          ...(cant.length ? [{ "@type": "Question", name: L.q3(inName), acceptedAnswer: { "@type": "Answer", text: cant.join(". ") } }] : []),
        ],
      },
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: L.home, item: `${SITE_URL}${pt ? "/pt" : ""}/` },
          { "@type": "ListItem", position: 2, name: "Mapa Verde", item: `${SITE_URL}${pt ? "/pt" : ""}/mapa-verde` },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    },
  ];
}

const UI = {
  es: {
    home: "Inicio", headline: { "legal-rec": "Cannabis recreativo legal", "legal-med": "Cannabis medicinal legal", decriminalized: "Descriminalizado", partial: "Varía por estado o región", illegal: "Cannabis ilegal" },
    can: "Lo que puedes hacer", cant: "Lo que no puedes hacer", states: "Por estado o región", sources: "Fuentes oficiales",
    reviewed: "Revisado en", disclaimer: "Información educativa, no asesoría legal. Las leyes cambian seguido: confirma con la autoridad o con un abogado de tu país.",
    back: "Ver todos los países", dateLocale: "es-MX",
  },
  pt: {
    home: "Início", headline: { "legal-rec": "Cannabis recreativa legal", "legal-med": "Cannabis medicinal legal", decriminalized: "Descriminalizada", partial: "Varia por estado ou região", illegal: "Cannabis ilegal" },
    can: "O que você pode fazer", cant: "O que você não pode fazer", states: "Por estado ou região", sources: "Fontes oficiais",
    reviewed: "Revisado em", disclaimer: "Informação educativa, não é assessoria jurídica. As leis mudam com frequência: confirme com a autoridade ou com um advogado do seu país.",
    back: "Ver todos os países", dateLocale: "pt-BR",
  },
} as const;

export default function MapaVerdeCountryPage() {
  const { country: c0, locale } = useLoaderData<typeof loader>();
  const country = c0 as any;
  const pt = locale === "pt";
  const U = UI[locale];
  const prefix = pt ? "/pt" : "";
  const status = country.nationalStatus as LegalStatusType;
  const name = pt ? country.countryNamePt || country.countryNameEs : country.countryNameEs;
  const summary: string = (pt && country.summaryPt) || country.summary;
  const can: string[] = (pt && country.whatYouCanPt) || country.whatYouCan || [];
  const cant: string[] = (pt && country.whatYouCantPt) || country.whatYouCant || [];
  const keyDate: string | undefined = (pt && country.keyDatePt) || country.keyDate;
  const reviewed = country.lastReviewedAt
    ? new Date(country.lastReviewedAt).toLocaleDateString(U.dateLocale, { month: "long", year: "numeric" })
    : null;

  return (
    <div>
      <section className={cn("border-b-[3px] border-ink", status === "legal-rec" ? "bg-lime text-ink" : status === "illegal" ? "wall--ink" : status === "legal-med" ? "wall--yellow" : "wall--pink")}>
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-5 pb-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-bold flex-wrap">
            <Link to={`${prefix}/`} className="hover:underline underline-offset-4 decoration-2">{U.home}</Link>
            <Icon name="chevronRight" size={12} />
            <Link to={`${prefix}/mapa-verde`} className="hover:underline underline-offset-4 decoration-2">Mapa Verde</Link>
            <Icon name="chevronRight" size={12} />
            <span aria-current="page">{name}</span>
          </nav>
          <div className="mt-8 flex items-center gap-4">
            <CountryFlag code={country.countryCode} title={name} className="w-14 h-auto border-2 border-ink" />
            <h1 className="rotulo" style={{ fontSize: "clamp(44px, 8vw, 96px)" }}>{name}</h1>
          </div>
          <p className="mt-5 inline-block bg-white text-ink border-2 border-ink px-3 py-1.5 text-lg font-extrabold uppercase [font-stretch:80%]">
            {U.headline[status]}
          </p>
          {/* Direct answer */}
          <p className="mt-6 max-w-[62ch] text-[19px] leading-relaxed font-medium">{summary}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-bold">
            {reviewed && (
              <span className="inline-flex items-center gap-2"><Icon name="calendar" size={15} />{U.reviewed} {reviewed}</span>
            )}
            {keyDate && <span className="inline-flex items-center gap-2"><Icon name="history" size={15} />{keyDate}</span>}
            {country.keyLaw && <span className="inline-flex items-center gap-2"><Icon name="scale" size={15} />{country.keyLaw}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {can.length > 0 && (
            <section className="cartulina cartulina--green">
              <h2 className="display text-[28px] mb-4 flex items-center gap-2"><Icon name="check" size={22} strokeWidth={3} />{U.can}</h2>
              <ul className="space-y-3">
                {can.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[16px] leading-snug font-medium"><span className="mt-2 w-2 h-2 bg-ink shrink-0" />{item}</li>
                ))}
              </ul>
            </section>
          )}
          {cant.length > 0 && (
            <section className="cartulina cartulina--pink">
              <h2 className="display text-[28px] mb-4 flex items-center gap-2"><Icon name="x" size={22} strokeWidth={3} />{U.cant}</h2>
              <ul className="space-y-3">
                {cant.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[16px] leading-snug font-medium"><span className="mt-2 w-2 h-2 bg-ink shrink-0" />{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {country.states?.length > 0 && (
          <section className="mb-12">
            <h2 className="display text-[32px] mb-5">{U.states}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {country.states.map((st: any) => (
                <div key={st.name} className="card p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="font-extrabold [font-stretch:85%] text-lg">{pt ? st.namePt || st.nameEs : st.nameEs}</div>
                    <span className={cn("text-xs", STATUS_PILL[st.status as LegalStatusType])} style={STATUS_PILL_STYLE[st.status as LegalStatusType]}>
                      {statusLabel(st.status as LegalStatusType, locale)}
                    </span>
                  </div>
                  {(pt ? st.notePt || st.note : st.note) && <p className="text-sm text-fg-muted">{pt ? st.notePt || st.note : st.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {country.sources?.length > 0 && (
          <section className="mb-10">
            <h2 className="display text-[28px] mb-3">{U.sources}</h2>
            <ul className="space-y-2">
              {country.sources.map((src: any, i: number) => (
                <li key={i} className="text-[15px] font-semibold">
                  {src.url ? (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline decoration-2 underline-offset-4 decoration-[var(--fluor-pink)] hover:decoration-[var(--cobalt)]">
                      <Icon name="externalLink" size={13} />{src.label}
                    </a>
                  ) : (
                    <span>{src.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="border-2 border-ink bg-yellow text-ink px-4 py-3 text-[15px] font-semibold flex gap-3">
          <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
          {U.disclaimer}
        </p>

        <Link to={`${prefix}/mapa-verde`} className="btn btn-ghost mt-10">
          <Icon name="arrowLeft" size={15} />
          {U.back}
        </Link>
      </div>
    </div>
  );
}
