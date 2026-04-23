import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { UserModel } from "~/models/user.server";
import { StrainCard } from "~/components/composite/strain-card";
import { StrainThumb } from "~/components/composite/strain-thumb";
import { Icon } from "~/components/ui/icon";
import { getCommunityVoices, getFeaturedArticles } from "~/content/articles";
import { useT, useHref, useLocale } from "~/lib/i18n-context";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "WeedHub — La enciclopedia viva del cannabis hispano",
    description:
      "Informa, conecta, cultiva. Comunidad hispanohablante de reseñas cannábicas con contexto real — método, momento, experiencia.",
    url: SITE_URL,
  });
}

export async function loader() {
  await connectDB();

  const [topStrains, featuredStrain, totalStrains, totalUsers, totalReviews] =
    await Promise.all([
      StrainModel.find({ isArchived: false })
        .sort({ "averageRatings.overall": -1, reviewCount: -1 })
        .limit(6)
        .lean(),
      StrainModel.findOne({ slug: "acapulco-gold" }).lean(),
      StrainModel.countDocuments({ isArchived: false }),
      UserModel.countDocuments(),
      ReviewModel.countDocuments({ status: "published" }),
    ]);

  return {
    topStrains: topStrains.map((s) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    featured: featuredStrain
      ? {
          ...featuredStrain,
          _id: String(featuredStrain._id),
          createdAt: featuredStrain.createdAt.toISOString(),
          updatedAt: featuredStrain.updatedAt.toISOString(),
        }
      : null,
    stats: { totalStrains, totalUsers, totalReviews },
  };
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const { topStrains, featured, stats } = loaderData;
  const t = useT();
  const href = useHref();
  const locale = useLocale();
  const COMMUNITY_VOICES = getCommunityVoices(locale);
  const FEATURED_ARTICLES = getFeaturedArticles(locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WeedHub",
    inLanguage: "es",
    url: SITE_URL,
    description:
      "Enciclopedia hispana de cannabis con reseñas contextuales, datos reales y perspectiva latinoamericana.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/strains?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-[1200px] px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="flex items-center gap-2 mb-6">
          <Icon name="sparkle" size={14} className="text-accent" />
          <span className="kicker">{t.landing.heroKickerSuperchip}</span>
        </div>
        <div className="kicker mb-6">{t.landing.heroKickerIssue}</div>
        <h1
          className="display max-w-[18ch]"
          style={{ fontSize: "clamp(52px, 8.2vw, 128px)", lineHeight: 0.98 }}
        >
          {t.landing.heroHeadlinePrefix}
          <span className="display-wonk" style={{ color: "var(--accent)" }}>
            {t.landing.heroHeadlineAccent}
          </span>
          {t.landing.heroHeadlineSuffix}
        </h1>
        <p className="mt-8 text-lg md:text-xl text-fg-muted max-w-[52ch] leading-relaxed">
          {t.landing.heroBody}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link to={href("/strains")} className="btn btn-primary">
            {t.landing.heroCtaPrimary}
            <Icon name="arrowRight" size={16} />
          </Link>
          <Link to="/onboarding" className="btn btn-ghost">
            {t.landing.heroCtaGhost}
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-8 max-w-[640px]">
          <Stat value={stats.totalStrains} label={t.landing.statsStrains} />
          <Stat value={stats.totalReviews} label={t.landing.statsReviews} />
          <Stat value={stats.totalUsers} label={t.landing.statsVoices} />
        </div>
      </section>

      <hr className="hrule mx-6 max-w-[1200px] md:mx-auto" />

      {/* Featured strain */}
      {featured && (
        <section className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="kicker mb-2">{t.landing.featuredKicker}</div>
              <h2 className="display text-4xl md:text-5xl">{featured.name}</h2>
            </div>
            <Link
              to={href(`/strains/${featured.slug}`)}
              className="hidden sm:inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
            >
              {t.landing.featuredSeeFull}
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          <div className="card p-8 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10">
            <StrainThumb
              name={featured.name}
              colorHint={featured.colorHint}
              imageUrl={featured.imageUrl}
              ratio="wide"
              className="w-full"
            />
            <div className="flex flex-col gap-5 justify-center">
              <div className="flex flex-wrap gap-2">
                <span className="pill lilac">{featured.typeBlend || featured.type}</span>
                {featured.lineage && <span className="pill">{featured.lineage}</span>}
              </div>
              <p className="text-fg-muted leading-relaxed">
                {featured.descriptionEs || featured.description}
              </p>
              <div className="grid grid-cols-4 gap-4 pt-3 border-t border-line">
                <MicroStat
                  kicker={t.landing.microStat.thc}
                  value={`${featured.cannabinoidProfile.thc.max}%`}
                  tone="accent"
                />
                <MicroStat
                  kicker={t.landing.microStat.cbd}
                  value={`${featured.cannabinoidProfile.cbd.max || 0}%`}
                />
                <MicroStat kicker={t.landing.microStat.type} value={featured.type} />
                <MicroStat
                  kicker={t.landing.microStat.terpene}
                  value={featured.dominantTerpene || "—"}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <hr className="hrule mx-6 max-w-[1200px] md:mx-auto" />

      {/* Strain grid */}
      {topStrains.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
            <div>
              <div className="kicker mb-2">{t.landing.directoryKicker}</div>
              <h2 className="display text-4xl md:text-5xl max-w-[20ch]">
                {t.landing.directoryHeadlinePrefix}
                <span className="display-wonk" style={{ color: "var(--accent)" }}>
                  {t.landing.directoryHeadlineAccent}
                </span>
                {t.landing.directoryHeadlineSuffix}
              </h2>
            </div>
            <Link to={href("/strains")} className="btn btn-ghost">
              {t.landing.directoryCta}
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topStrains.map((strain: any) => (
              <StrainCard key={strain._id} strain={strain} />
            ))}
          </div>
        </section>
      )}

      {/* Community voices */}
      <section className="bg-sunken border-y border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="kicker mb-3">{t.landing.voicesKicker}</div>
          <h2 className="display text-4xl md:text-5xl max-w-[22ch] mb-14">
            {t.landing.voicesHeadlinePrefix}
            <span className="display-wonk" style={{ color: "var(--accent)" }}>
              {t.landing.voicesHeadlineAccent}
            </span>
            {t.landing.voicesHeadlineSuffix}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COMMUNITY_VOICES.map((v) => (
              <figure key={v.name} className="flex flex-col gap-4">
                <div
                  className="display-wonk text-3xl leading-snug"
                  style={{ color: "var(--fg)" }}
                >
                  <span style={{ color: "var(--accent)" }}>“</span>
                  {v.quote}
                  <span style={{ color: "var(--accent)" }}>”</span>
                </div>
                <figcaption className="kicker">
                  {v.name} · {v.city} | {v.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial teaser */}
      <section className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <div className="kicker mb-2">{t.landing.magazineKicker}</div>
            <h2 className="display text-4xl md:text-5xl">{t.landing.magazineTitle}</h2>
          </div>
          <Link to={href("/editorial")} className="btn btn-ghost">
            {t.landing.magazineCta}
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-6">
          {FEATURED_ARTICLES.slice(0, 3).map((a, i) => (
            <Link
              key={a.slug}
              to={href("/editorial")}
              className={`card p-5 flex flex-col gap-3 hover:bg-elev transition-colors ${i === 0 ? "md:row-span-1" : ""}`}
            >
              <div
                className="ph"
                style={{ aspectRatio: i === 0 ? "16/10" : "4/3" }}
              >
                {a.kicker}
              </div>
              <div className="flex items-center gap-2">
                <span className="pill lilac">{a.kicker}</span>
                <span className="kicker">{a.readTime}</span>
              </div>
              <h3
                className="display"
                style={{ fontSize: i === 0 ? 36 : 24, lineHeight: 1.08 }}
              >
                {a.title}
              </h3>
              <p className="text-sm text-fg-muted line-clamp-2">{a.dek}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="card-strong p-10 md:p-14 text-center">
          <div className="kicker mb-3" style={{ color: "var(--accent)" }}>
            {t.landing.ctaKicker}
          </div>
          <h2 className="display text-4xl md:text-5xl mb-4">
            {t.landing.ctaHeadline}
          </h2>
          <p className="text-fg-muted max-w-lg mx-auto mb-8">
            {t.landing.ctaBody}
          </p>
          <Link to="/auth?mode=register" className="btn btn-primary inline-flex">
            {t.landing.ctaButton}
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="display text-4xl md:text-5xl tnum">{value.toLocaleString()}</div>
      <div className="kicker mt-1">{label}</div>
    </div>
  );
}

function MicroStat({
  kicker,
  value,
  tone,
}: {
  kicker: string;
  value: string | number;
  tone?: "accent";
}) {
  return (
    <div>
      <div className="kicker mb-1">{kicker}</div>
      <div
        className="mono text-lg tnum"
        style={{ color: tone === "accent" ? "var(--accent)" : "var(--fg)" }}
      >
        {value}
      </div>
    </div>
  );
}
