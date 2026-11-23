import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { StrainSign } from "~/components/composite/strain-sign";
import { LegalStatusModel } from "~/models/legal-status.server";
import { STATUS_LABEL, STATUS_DOT_STYLE, statusLabel } from "~/lib/legal-status-ui";
import { Icon } from "~/components/ui/icon";
import { getGuides } from "~/content/guides";
import { EFFECTS } from "~/lib/effect-labels";
import { useT, useHref, useLocale } from "~/lib/i18n-context";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";
import { getDictionary } from "~/content/locales";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const prefix = locale !== "es" ? `/${locale}` : "";
  return buildMeta({
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    url: `${SITE_URL}${prefix}/`,
    canonicalPath: "/",
    locale,
  });
}

const COPY = {
  es: {
    lede: "La enciclopedia del cannabis en español y português.",
    langs: ["español", "português"],
    sub: (s: number, r: number) => `${s.toLocaleString("es-MX")} cepas y ${r.toLocaleString("es-MX")} reseñas con contexto: método, momento y experiencia.`,
    searchTitle: "¿Qué cepa buscas?",
    searchPlaceholder: "Nombre, efecto o aroma",
    searchCta: "Buscar",
    quick: "O busca por efecto",
    wallTitle: "Las más reseñadas",
    wallCta: "Ver las 3,000+ cepas",
    momentTitle: "¿Para qué momento?",
    momentBody: "Cada cepa trae cuándo la recomienda la comunidad. Elige tu momento.",
    moments: { manana: "Mañana", tarde: "Tarde", noche: "Noche" },
    momentHint: { manana: "Activa, enfocada", tarde: "Social, creativa", noche: "Calma, descanso" },
    reviewsTitle: "Lo que dice la comunidad",
    reviewsBody: "Reseñas con contexto: método, momento y experiencia. Puedes publicar de forma anónima.",
    reviewCta: "Pinta tu reseña",
    anon: "Anónimo",
    method: "Método",
    moment: "Momento",
    legalTitle: "¿Es legal en tu país?",
    legalBody: "El estatus legal del cannabis, país por país, con fuentes y fecha de revisión.",
    legalCta: "Abrir el Mapa Verde",
    learnTitle: "Aprende lo básico",
    learnCta: "Todas las guías",
    recommendTitle: "¿No sabes por dónde empezar?",
    recommendBody: "Cuéntanos qué buscas y te sugerimos cepas con datos de la comunidad.",
    recommendCta: "Encuentra tu cepa",
  },
  pt: {
    lede: "A enciclopédia da cannabis em espanhol e português.",
    langs: ["espanhol", "português"],
    sub: (s: number, r: number) => `${s.toLocaleString("pt-BR")} cepas e ${r.toLocaleString("pt-BR")} avaliações com contexto: método, momento e experiência.`,
    searchTitle: "Qual cepa você procura?",
    searchPlaceholder: "Nome, efeito ou aroma",
    searchCta: "Buscar",
    quick: "Ou busque por efeito",
    wallTitle: "As mais avaliadas",
    wallCta: "Ver as 3.000+ cepas",
    momentTitle: "Para qual momento?",
    momentBody: "Cada cepa mostra quando a comunidade a recomenda. Escolha o seu momento.",
    moments: { manana: "Manhã", tarde: "Tarde", noche: "Noite" },
    momentHint: { manana: "Ativa, focada", tarde: "Social, criativa", noche: "Calma, descanso" },
    reviewsTitle: "O que a comunidade diz",
    reviewsBody: "Avaliações com contexto: método, momento e experiência. Você pode publicar de forma anônima.",
    reviewCta: "Escreva sua avaliação",
    anon: "Anônimo",
    method: "Método",
    moment: "Momento",
    legalTitle: "É legal no seu país?",
    legalBody: "O status legal da cannabis, país por país, com fontes e data de revisão.",
    legalCta: "Abrir o Mapa Verde",
    learnTitle: "Aprenda o básico",
    learnCta: "Todos os guias",
    recommendTitle: "Não sabe por onde começar?",
    recommendBody: "Conte o que você procura e sugerimos cepas com dados da comunidade.",
    recommendCta: "Encontre sua cepa",
  },
  en: {
    lede: "The cannabis encyclopedia in Spanish and Portuguese.",
    langs: ["Spanish", "Portuguese"],
    sub: (s: number, r: number) => `${s.toLocaleString("en-US")} strains and ${r.toLocaleString("en-US")} reviews with context: method, moment and experience.`,
    searchTitle: "Which strain are you after?",
    searchPlaceholder: "Name, effect or aroma",
    searchCta: "Search",
    quick: "Or search by effect",
    wallTitle: "Most reviewed",
    wallCta: "See all 3,000+ strains",
    momentTitle: "For which moment?",
    momentBody: "Every strain shows when the community recommends it. Pick your moment.",
    moments: { manana: "Morning", tarde: "Afternoon", noche: "Night" },
    momentHint: { manana: "Active, focused", tarde: "Social, creative", noche: "Calm, rest" },
    reviewsTitle: "What the community says",
    reviewsBody: "Reviews with context: method, moment and experience. You can post anonymously.",
    reviewCta: "Write a review",
    anon: "Anonymous",
    method: "Method",
    moment: "Moment",
    legalTitle: "Is it legal where you live?",
    legalBody: "Cannabis legal status country by country, with sources and review dates.",
    legalCta: "Open the Green Map",
    learnTitle: "Learn the basics",
    learnCta: "All guides",
    recommendTitle: "Not sure where to start?",
    recommendBody: "Tell us what you're after and we'll suggest strains backed by community data.",
    recommendCta: "Find your strain",
  },
} as const;

const QUICK_EFFECTS = ["relaxed", "creative", "euphoric", "energetic", "sleepy", "focused"] as const;
const LATAM_REGIONS = ["mexico", "latam-central", "latam-south", "latam-caribe"];

export async function loader({ request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  await connectDB();

  const [topStrains, totalStrains, totalReviews, recentReviews, legal] = await Promise.all([
    StrainModel.find({ isArchived: false, reviewCount: { $gt: 0 } })
      .sort({ reviewCount: -1, "averageRatings.overall": -1 })
      .limit(10)
      .select("name slug type cannabinoidProfile effects reviewCount averageRatings")
      .lean(),
    StrainModel.countDocuments({ isArchived: false }),
    ReviewModel.countDocuments({ status: "published" }),
    ReviewModel.find({
      status: "published",
      strainId: { $exists: true },
      $expr: { $gte: [{ $strLenCP: { $ifNull: ["$comment", ""] } }, 80] },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("userId", "username anonymousHandle")
      .populate("strainId", "name slug type")
      .lean(),
    LegalStatusModel.find({ isActive: true, region: { $in: LATAM_REGIONS } })
      .sort({ sortOrder: 1 })
      .limit(12)
      .select("countryCode countryNameEs countryNamePt countryName nationalStatus slug")
      .lean(),
  ]);

  return {
    locale,
    topStrains: topStrains.map((s: any) => ({ ...s, _id: String(s._id) })),
    reviews: recentReviews
      .filter((r: any) => r.strainId)
      .map((r: any) => ({
        _id: String(r._id),
        comment: r.comment as string,
        rating: r.ratings?.overall ?? 0,
        method: r.context?.method ?? "",
        timeOfDay: r.context?.timeOfDay ?? "",
        author: r.publishedAs === "anonymous" ? null : r.userId?.username ?? null,
        handle: r.userId?.anonymousHandle ?? null,
        strain: { name: r.strainId.name, slug: r.strainId.slug, type: r.strainId.type },
        date: new Date(r.createdAt).toISOString(),
      })),
    legal: legal.map((l: any) => ({
      code: l.countryCode as string,
      nameEs: l.countryNameEs as string,
      namePt: (l.countryNamePt as string) || (l.countryNameEs as string),
      name: l.countryName as string,
      status: l.nationalStatus as keyof typeof STATUS_LABEL,
    })),
    stats: { totalStrains, totalReviews },
  };
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const { topStrains, stats, reviews, legal } = loaderData;
  const href = useHref();
  const locale = useLocale();
  const c = COPY[(locale as keyof typeof COPY)] ?? COPY.es;
  const guides = getGuides(locale).slice(0, 5);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "WeedHub",
      inLanguage: ["es", "pt-BR"],
      url: SITE_URL,
      description: c.lede,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/strains?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "WeedHub",
      url: SITE_URL,
      logo: `${SITE_URL}/brand.svg`,
      description: c.lede,
      foundingDate: "2026",
      areaServed: ["MX", "BR", "CO", "AR", "CL", "PE", "UY", "ES"],
    },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* The wall: masthead + search board */}
      <section className="wall relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-8 pb-12 md:pt-10 md:pb-14 grid gap-8 lg:grid-cols-[1fr_440px] lg:items-end">
          <div>
            <h1 className="sr-only">WeedHub. {c.lede}</h1>
            <div aria-hidden className="rotulo rotulo-shade text-yellow" style={{ fontSize: "clamp(84px, min(13vw, 21vh), 176px)" }}>
              Weed
              <br />
              Hub
            </div>
            <p className="mt-5 max-w-[24ch] text-[clamp(26px,3vw,38px)] font-extrabold leading-[1.1] [font-stretch:80%]">
              {highlight(c.lede, c.langs)}
            </p>
            <p className="mt-3 max-w-[52ch] text-lg text-white/90">{c.sub(stats.totalStrains, stats.totalReviews)}</p>
          </div>

          <form
            method="get"
            action={href("/strains")}
            role="search"
            className="bg-white text-ink border-[3px] border-ink p-5 md:p-6 lg:-rotate-[1.5deg] lg:mb-2"
          >
            <label htmlFor="home-search" className="marker block text-[30px] leading-tight">
              {c.searchTitle}
            </label>
            <div className="mt-4 flex items-center gap-2 border-b-[3px] border-ink pb-2">
              <Icon name="search" size={20} />
              <input
                id="home-search"
                name="search"
                type="search"
                autoComplete="off"
                placeholder={c.searchPlaceholder}
                className="w-full bg-transparent text-xl font-semibold outline-none placeholder:text-[#5f5e57]"
              />
            </div>
            <button type="submit" className={cn(buttonVariants({ variant: "warm" }), "mt-4 w-full !text-lg !py-3")}>
              {c.searchCta}
              <Icon name="arrowRight" size={18} />
            </button>
            <div className="mt-5">
              <div className="text-[13px] font-extrabold uppercase [font-stretch:78%] mb-2">{c.quick}</div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EFFECTS.map((e) => (
                  <Link key={e} to={href(`/strains?effects=${e}`)} className="chip !text-[13px] !py-1 !px-2.5">
                    {EFFECTS[e][(locale === "pt" || locale === "en" ? locale : "es") as "es"]}
                  </Link>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Pinned cartulinas: most reviewed */}
      {topStrains.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 -mt-6 pb-16 relative z-10">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="inline-block bg-ink text-yellow px-3 py-1.5 text-xl font-extrabold uppercase [font-stretch:78%] -rotate-1">{c.wallTitle}</h2>
            <Link to={href("/strains?sort=reviews")} className={buttonVariants({ variant: "ghost" })}>
              {c.wallCta}
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-5">
            {topStrains.slice(0, 10).map((s: any, i: number) => (
              <StrainSign
                key={s._id}
                strain={s}
                to={href(`/strains/${s.slug}`)}
                locale={locale}
                style={{ animationDelay: `${i * 45}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Momento del día */}
      <section className="wall--yellow border-y-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14 grid gap-8 lg:grid-cols-[0.9fr_1.6fr] lg:items-center">
          <div>
            <h2 className="display text-[clamp(40px,5vw,64px)]">{c.momentTitle}</h2>
            <p className="mt-3 text-lg font-medium max-w-[38ch]">{c.momentBody}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["manana", "tarde", "noche"] as const).map((m) => (
              <Link
                key={m}
                to={href(`/strains?momento=${m}`)}
                className={cn(
                  "group border-[3px] border-ink p-5 flex flex-col justify-between min-h-[150px] transition-transform hover:-translate-y-1 active:translate-y-0.5",
                  m === "manana" && "bg-white text-ink",
                  m === "tarde" && "bg-orange text-ink",
                  m === "noche" && "bg-cobalt text-white"
                )}
              >
                <span className="rotulo text-[40px]">{c.moments[m]}</span>
                <span className="flex items-center justify-between font-bold">
                  {c.momentHint[m]}
                  <Icon name="arrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Real reviews with context */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-9">
            <div>
              <h2 className="display text-[clamp(40px,5vw,64px)]">{c.reviewsTitle}</h2>
              <p className="mt-2 text-lg text-fg-muted">{c.reviewsBody}</p>
            </div>
            <Link to={href("/strains")} className={buttonVariants({ variant: "primary" })}>
              <Icon name="edit" size={16} />
              {c.reviewCta}
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r: any, i: number) => (
              <figure
                key={r._id}
                className="cartulina cartulina--blank cartulina-pin flex flex-col gap-3"
                style={{ transform: `rotate(${[-1, 0.8, -0.5][i % 3]}deg)` }}
              >
                <Link to={href(`/strains/${r.strain.slug}`)} className="marker text-2xl leading-tight hover:underline decoration-2 underline-offset-4">
                  {r.strain.name}
                </Link>
                <blockquote className="text-[16px] leading-relaxed line-clamp-5">{r.comment}</blockquote>
                <dl className="mt-auto flex flex-wrap gap-1.5 text-[12px]">
                  {r.method && (
                    <div className="pill"><dt className="sr-only">{c.method}</dt><dd>{r.method}</dd></div>
                  )}
                  {r.timeOfDay && (
                    <div className="pill accent"><dt className="sr-only">{c.moment}</dt><dd>{r.timeOfDay}</dd></div>
                  )}
                </dl>
                <figcaption className="text-sm font-bold [font-stretch:85%] border-t-2 border-ink pt-2 flex justify-between">
                  <span>{r.author ? `@${r.author}` : r.handle || c.anon}</span>
                  <span className="inline-flex items-center gap-1"><Icon name="star" size={13} className="fill-current" />{r.rating}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Mapa Verde */}
      {legal.length > 0 && (
        <section className="wall--pink border-y-[3px] border-ink">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="display text-[clamp(40px,5vw,64px)]">{c.legalTitle}</h2>
              <p className="mt-3 text-lg font-medium max-w-[40ch]">{c.legalBody}</p>
              <Link to={href("/mapa-verde")} className={cn(buttonVariants({ variant: "ghost" }), "mt-6")}>
                <Icon name="map" size={16} />
                {c.legalCta}
              </Link>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-white border-[3px] border-ink px-4 py-2">
              {legal.map((l: any) => (
                <li key={l.code}>
                  <Link
                    to={href(`/mapa-verde/${l.code.toLowerCase()}`)}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-line font-semibold hover:bg-yellow -mx-2 px-2"
                  >
                    <span>{locale === "pt" ? l.namePt : l.nameEs}</span>
                    <span className="inline-flex items-center gap-2 text-[13px] font-bold [font-stretch:85%]">
                      <span className="inline-block w-3 h-3" style={STATUS_DOT_STYLE[l.status as keyof typeof STATUS_DOT_STYLE]} />
                      {statusLabel(l.status, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Guides + recommender */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="display text-[clamp(36px,4.5vw,56px)]">{c.learnTitle}</h2>
            <Link to={href("/guias")} className="btn-link text-base">{c.learnCta}</Link>
          </div>
          <ol className="border-t-[3px] border-ink">
            {guides.map((g, i) => (
              <li key={g.slug}>
                <Link
                  to={href(`/guias/${g.slug}`)}
                  className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-3 py-4 border-b-2 border-ink hover:bg-yellow transition-colors px-1"
                >
                  <span className="rotulo text-2xl text-cobalt group-hover:text-ink">{i + 1}</span>
                  <span>
                    <span className="block text-xl font-extrabold [font-stretch:85%] leading-tight">{g.title}</span>
                    <span className="block text-fg-muted mt-1 line-clamp-1">{g.description}</span>
                  </span>
                  <span className="text-sm font-bold whitespace-nowrap">{g.readTime}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <aside className="wall border-[3px] border-ink p-7 flex flex-col gap-4 self-start lg:rotate-[1deg]">
          <h2 className="display text-[40px] text-yellow">{c.recommendTitle}</h2>
          <p className="text-lg text-white/90">{c.recommendBody}</p>
          <Link to="/recomendar" className={cn(buttonVariants({ variant: "warm" }), "self-start")}>
            {c.recommendCta}
            <Icon name="arrowRight" size={16} />
          </Link>
        </aside>
      </section>
    </div>
  );
}

function highlight(text: string, words: readonly string[]) {
  const re = new RegExp(`(${words.join("|")})`, "g");
  return text.split(re).map((part, i) =>
    words.includes(part) ? (
      <span key={i} className="bg-pink text-ink px-1.5 [box-decoration-break:clone]">
        {part}
      </span>
    ) : (
      part
    )
  );
}
