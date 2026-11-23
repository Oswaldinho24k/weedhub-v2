import { data, useLoaderData, Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { buildMeta, SITE_URL } from "~/lib/seo";
import type { Route } from "./+types/para.$condition";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { StrainSign } from "~/components/composite/strain-sign";
import { Icon } from "~/components/ui/icon";
import { resolveLocale } from "~/lib/locale.server";
import { CONDITIONS_BY_SLUG } from "~/constants/conditions";

const UI = {
  es: {
    home: "Inicio", hub: "Por condición",
    title: (l: string) => `Cepas que la comunidad asocia con ${l} | WeedHub`,
    description: (l: string) => `Cepas que usuarios de WeedHub reportan para ${l}, con número de reseñas. Información de referencia, no consejo médico.`,
    h1: (l: string) => `Cepas reportadas para ${l}`,
    lede: (n: number) => `${n} ${n === 1 ? "cepa" : "cepas"} que la comunidad asocia con esta condición, ordenadas por número de reseñas que la mencionan.`,
    empty: "Todavía no hay suficientes reseñas que mencionen esta condición.",
    explore: "Explorar el directorio",
    votes: (n: number) => (n === 1 ? "1 reseña la menciona" : `${n} reseñas la mencionan`),
    warning: "Esto no es consejo médico. Que alguien lo reporte no significa que funcione para ti, y el cannabis puede interactuar con medicamentos. Habla con un profesional de salud antes de consumir.",
  },
  pt: {
    home: "Início", hub: "Por condição",
    title: (l: string) => `Variedades que a comunidade associa a ${l} | WeedHub`,
    description: (l: string) => `Variedades que usuários do WeedHub relatam para ${l}, com número de avaliações. Informação de referência, não é aconselhamento médico.`,
    h1: (l: string) => `Variedades relatadas para ${l}`,
    lede: (n: number) => `${n} ${n === 1 ? "variedade" : "variedades"} que a comunidade associa a esta condição, ordenadas pelo número de avaliações que a mencionam.`,
    empty: "Ainda não há avaliações suficientes que mencionem esta condição.",
    explore: "Explorar o diretório",
    votes: (n: number) => (n === 1 ? "1 avaliação menciona" : `${n} avaliações mencionam`),
    warning: "Isto não é aconselhamento médico. O fato de alguém relatar não significa que funcione para você, e a cannabis pode interagir com medicamentos. Converse com um profissional de saúde antes de consumir.",
  },
} as const;

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = (await resolveLocale(request)) === "pt" ? "pt" : "es";
  const condition = CONDITIONS_BY_SLUG[params.condition];
  if (!condition) throw data("Not found", { status: 404 });
  await connectDB();
  const strains = await StrainModel.find({ [`conditionVotes.${condition.slug}`]: { $gte: 2 }, isArchived: false })
    .sort({ [`conditionVotes.${condition.slug}`]: -1, reviewCount: -1 })
    .limit(24)
    .select("name slug type cannabinoidProfile effects reviewCount averageRatings conditionVotes")
    .lean();
  return {
    locale,
    condition,
    strains: strains.map((s: any) => ({
      ...s,
      _id: String(s._id),
      votes: (s.conditionVotes instanceof Map ? s.conditionVotes.get(condition.slug) : s.conditionVotes?.[condition.slug]) ?? 0,
      conditionVotes: undefined,
    })),
  } as const;
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.condition) return [{ title: "WeedHub" }];
  const { condition, locale } = data;
  const U = UI[locale];
  const label = (locale === "pt" ? condition.labelPt : condition.labelEs).toLowerCase();
  const prefix = locale === "pt" ? "/pt" : "";
  const path = `/para/${condition.slug}`;
  const url = `${SITE_URL}${prefix}${path}`;
  return [
    ...buildMeta({ title: U.title(label), description: U.description(label), url, locale, canonicalPath: path }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: U.h1(label),
        url,
        numberOfItems: data.strains.length,
        itemListElement: data.strains.slice(0, 10).map((s: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.name,
          url: `${SITE_URL}${prefix}/strains/${s.slug}`,
        })),
      },
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: U.home, item: `${SITE_URL}${prefix}/` },
          { "@type": "ListItem", position: 2, name: U.hub, item: `${SITE_URL}${prefix}/para` },
          { "@type": "ListItem", position: 3, name: locale === "pt" ? condition.labelPt : condition.labelEs, item: url },
        ],
      },
    },
  ];
}

export default function ConditionPage() {
  const { condition, strains, locale } = useLoaderData<typeof loader>();
  const U = UI[locale];
  const prefix = locale === "pt" ? "/pt" : "";
  const label = locale === "pt" ? condition.labelPt : condition.labelEs;

  return (
    <div>
      <section className="wall--pink border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-5 pb-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-bold flex-wrap">
            <Link to={`${prefix}/`} className="hover:underline underline-offset-4 decoration-2">{U.home}</Link>
            <Icon name="chevronRight" size={12} />
            <Link to={`${prefix}/para`} className="hover:underline underline-offset-4 decoration-2">{U.hub}</Link>
            <Icon name="chevronRight" size={12} />
            <span aria-current="page">{label}</span>
          </nav>
          <h1 className="display mt-8" style={{ fontSize: "clamp(40px, 6vw, 80px)" }}>{U.h1(label.toLowerCase())}</h1>
          {strains.length > 0 && <p className="mt-4 max-w-[60ch] text-lg font-semibold">{U.lede(strains.length)}</p>}
          <p className="mt-6 max-w-[72ch] bg-white text-ink border-2 border-ink px-4 py-3 text-[15px] font-semibold flex gap-3">
            <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
            {U.warning}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
        {strains.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 pt-2">
            {strains.map((s: any) => (
              <div key={s._id} className="flex flex-col gap-3">
                <StrainSign strain={s} to={`${prefix}/strains/${s.slug}`} locale={locale} />
                <span className="text-[13px] font-extrabold [font-stretch:85%] px-1">{U.votes(s.votes)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold mb-5">{U.empty}</p>
            <Link to={`${prefix}/strains`} className={buttonVariants({ variant: "primary" })}>{U.explore}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
