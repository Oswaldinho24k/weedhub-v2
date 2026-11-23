import { effectLabels } from "~/lib/effect-labels";

/**
 * Data-built answer text for a strain: a 40–60 word summary and an FAQ.
 * Only states what the record actually contains; missing data is omitted, never guessed.
 * Used by the strain page, its meta description and FAQPage JSON-LD.
 */

type Loc = "es" | "pt" | "en";

export interface SummaryStrain {
  name: string;
  type: "sativa" | "indica" | "hybrid";
  typeBlend?: string;
  lineage?: string;
  genetics?: { parent1?: string; parent2?: string; breeder?: string };
  cannabinoidProfile?: { thc?: { min?: number; max?: number }; cbd?: { min?: number; max?: number } };
  dominantTerpene?: string;
  terpenes?: Array<{ name: string; percentage: number }>;
  effects?: string[];
  flavors?: string[];
  momento?: { manana?: number; tarde?: number; noche?: number };
  reviewCount?: number;
}

const TYPE: Record<Loc, Record<string, string>> = {
  es: { sativa: "sativa", indica: "indica", hybrid: "híbrida" },
  pt: { sativa: "sativa", indica: "indica", hybrid: "híbrida" },
  en: { sativa: "sativa", indica: "indica", hybrid: "hybrid" },
};

const MOMENT: Record<Loc, Record<string, string>> = {
  es: { manana: "la mañana", tarde: "la tarde", noche: "la noche" },
  pt: { manana: "a manhã", tarde: "a tarde", noche: "a noite" },
  en: { manana: "the morning", tarde: "the afternoon", noche: "the evening" },
};

function list(items: string[], loc: Loc) {
  const and = loc === "en" ? "and" : loc === "pt" ? "e" : "y";
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

function topMoment(m?: SummaryStrain["momento"]): "manana" | "tarde" | "noche" | null {
  if (!m) return null;
  const entries = (["manana", "tarde", "noche"] as const).map((k) => [k, m[k] ?? 0] as const);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : null;
}

function parents(s: SummaryStrain): string[] {
  const p = [s.genetics?.parent1, s.genetics?.parent2].filter(Boolean) as string[];
  if (p.length) return p;
  if (s.lineage && s.lineage.includes("×")) return s.lineage.split("×").map((x) => x.trim()).filter(Boolean);
  if (s.lineage && s.lineage.includes(" x ")) return s.lineage.split(" x ").map((x) => x.trim()).filter(Boolean);
  return [];
}

function normLoc(locale?: string): Loc {
  return locale === "pt" || locale === "en" ? locale : "es";
}

export function strainSummary(s: SummaryStrain, locale?: string): string {
  const loc = normLoc(locale);
  const type = TYPE[loc][s.type] ?? s.type;
  const thc = s.cannabinoidProfile?.thc?.max ?? 0;
  const cbd = s.cannabinoidProfile?.cbd?.max ?? 0;
  const par = parents(s);
  const eff = effectLabels(s.effects, loc).slice(0, 3).map((e) => e.toLowerCase());
  const mom = topMoment(s.momento);
  const parts: string[] = [];

  if (loc === "es") {
    parts.push(`${s.name} es una cepa ${type}${par.length === 2 ? `, cruce de ${par[0]} y ${par[1]}` : ""}.`);
    if (thc > 0) parts.push(`Tiene hasta ${thc}% de THC${cbd > 0 ? ` y ${cbd}% de CBD` : ""}.`);
    if (s.dominantTerpene) parts.push(`Su terpeno dominante es el ${s.dominantTerpene.toLowerCase()}.`);
    if (eff.length) parts.push(`Se asocia con ${list(eff, loc)}.`);
    if (mom) parts.push(`Se recomienda sobre todo para ${MOMENT.es[mom]}.`);
  } else if (loc === "pt") {
    parts.push(`${s.name} é uma cepa ${type}${par.length === 2 ? `, cruzamento de ${par[0]} e ${par[1]}` : ""}.`);
    if (thc > 0) parts.push(`Tem até ${thc}% de THC${cbd > 0 ? ` e ${cbd}% de CBD` : ""}.`);
    if (s.dominantTerpene) parts.push(`Seu terpeno dominante é o ${s.dominantTerpene.toLowerCase()}.`);
    if (eff.length) parts.push(`É associada a ${list(eff, loc)}.`);
    if (mom) parts.push(`É recomendada principalmente para ${MOMENT.pt[mom]}.`);
  } else {
    parts.push(`${s.name} is a ${type} strain${par.length === 2 ? `, a cross of ${par[0]} and ${par[1]}` : ""}.`);
    if (thc > 0) parts.push(`It reaches up to ${thc}% THC${cbd > 0 ? ` and ${cbd}% CBD` : ""}.`);
    if (s.dominantTerpene) parts.push(`Its dominant terpene is ${s.dominantTerpene.toLowerCase()}.`);
    if (eff.length) parts.push(`It's associated with ${list(eff, loc)} effects.`);
    if (mom) parts.push(`It's mostly recommended for ${MOMENT.en[mom]}.`);
  }
  return parts.join(" ");
}

export interface FaqItem {
  q: string;
  a: string;
}

export function strainFaq(s: SummaryStrain, locale?: string): FaqItem[] {
  const loc = normLoc(locale);
  const type = TYPE[loc][s.type] ?? s.type;
  const thc = s.cannabinoidProfile?.thc;
  const cbd = s.cannabinoidProfile?.cbd;
  const par = parents(s);
  const eff = effectLabels(s.effects, loc).slice(0, 5).map((e) => e.toLowerCase());
  const mom = topMoment(s.momento);
  const terps = (s.terpenes ?? []).slice(0, 3).map((t) => t.name.toLowerCase());
  const out: FaqItem[] = [];
  const range = (r?: { min?: number; max?: number }) =>
    r?.max ? (r.min && r.min !== r.max ? `${r.min}–${r.max}%` : `${r.max}%`) : null;

  const T = {
    es: {
      type: [`¿${s.name} es sativa, indica o híbrida?`, `${s.name} es una cepa ${type}${s.typeBlend ? ` (${s.typeBlend})` : ""}.`],
      thc: [`¿Cuánto THC tiene ${s.name}?`, (r: string) => `${s.name} tiene ${r} de THC${range(cbd) ? ` y ${range(cbd)} de CBD` : ""}, según los datos registrados en WeedHub.`],
      eff: [`¿Qué efectos tiene ${s.name}?`, (e: string) => `Los efectos más asociados a ${s.name} son ${e}. Los efectos varían según la persona, la dosis y el método de consumo.`],
      mom: [`¿A qué hora del día conviene ${s.name}?`, (m: string) => `La comunidad recomienda ${s.name} sobre todo para ${m}.`],
      gen: [`¿De qué cepas viene ${s.name}?`, (p: string) => `${s.name} es un cruce de ${p}.`],
      ter: [`¿Qué terpenos tiene ${s.name}?`, (t: string) => `Los terpenos principales de ${s.name} son ${t}.`],
    },
    pt: {
      type: [`${s.name} é sativa, indica ou híbrida?`, `${s.name} é uma cepa ${type}${s.typeBlend ? ` (${s.typeBlend})` : ""}.`],
      thc: [`Quanto THC tem ${s.name}?`, (r: string) => `${s.name} tem ${r} de THC${range(cbd) ? ` e ${range(cbd)} de CBD` : ""}, segundo os dados registrados no WeedHub.`],
      eff: [`Quais são os efeitos de ${s.name}?`, (e: string) => `Os efeitos mais associados a ${s.name} são ${e}. Os efeitos variam conforme a pessoa, a dose e o método de consumo.`],
      mom: [`Em que hora do dia ${s.name} é mais indicada?`, (m: string) => `A comunidade recomenda ${s.name} principalmente para ${m}.`],
      gen: [`De quais cepas vem ${s.name}?`, (p: string) => `${s.name} é um cruzamento de ${p}.`],
      ter: [`Quais terpenos tem ${s.name}?`, (t: string) => `Os principais terpenos de ${s.name} são ${t}.`],
    },
    en: {
      type: [`Is ${s.name} sativa, indica or hybrid?`, `${s.name} is a ${type} strain${s.typeBlend ? ` (${s.typeBlend})` : ""}.`],
      thc: [`How much THC does ${s.name} have?`, (r: string) => `${s.name} has ${r} THC${range(cbd) ? ` and ${range(cbd)} CBD` : ""}, according to the data recorded on WeedHub.`],
      eff: [`What are the effects of ${s.name}?`, (e: string) => `The effects most associated with ${s.name} are ${e}. Effects vary by person, dose and consumption method.`],
      mom: [`What time of day suits ${s.name}?`, (m: string) => `The community mostly recommends ${s.name} for ${m}.`],
      gen: [`What strains is ${s.name} bred from?`, (p: string) => `${s.name} is a cross of ${p}.`],
      ter: [`What terpenes does ${s.name} have?`, (t: string) => `The main terpenes in ${s.name} are ${t}.`],
    },
  }[loc];

  out.push({ q: T.type[0] as string, a: T.type[1] as string });
  if (range(thc)) out.push({ q: T.thc[0] as string, a: (T.thc[1] as (r: string) => string)(range(thc)!) });
  if (eff.length) out.push({ q: T.eff[0] as string, a: (T.eff[1] as (e: string) => string)(list(eff, loc)) });
  if (mom) out.push({ q: T.mom[0] as string, a: (T.mom[1] as (m: string) => string)(MOMENT[loc][mom]) });
  if (par.length === 2) out.push({ q: T.gen[0] as string, a: (T.gen[1] as (p: string) => string)(list(par, loc)) });
  if (terps.length) out.push({ q: T.ter[0] as string, a: (T.ter[1] as (t: string) => string)(list(terps, loc)) });
  return out;
}
