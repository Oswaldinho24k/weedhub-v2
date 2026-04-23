import { Link } from "react-router";
import type { Route } from "./+types/community";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { ReviewCard } from "~/components/composite/review-card";
import { getCommunityVoices } from "~/content/articles";
import { useT, useHref, useLocale } from "~/lib/i18n-context";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Comunidad — WeedHub",
    description:
      "Voces hispanohablantes del cannabis. Lee las reseñas más recientes y descubre perspectivas desde CDMX, Medellín, Santiago y más.",
    url: `${SITE_URL}/community`,
  });
}

export async function loader() {
  await connectDB();
  const reviews = await ReviewModel.find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(15)
    .populate(
      "userId",
      "username anonymousHandle avatar earnedBadges publishAsAnonymous country city showCityPublicly"
    )
    .populate("strainId", "name slug colorHint")
    .lean();

  return {
    reviews: reviews.map((r) => {
      const u = r.userId as any;
      return {
        _id: String(r._id),
        ratings: r.ratings,
        comment: r.comment,
        context: r.context,
        effectsExperienced: r.effectsExperienced,
        helpfulVotes: (r.helpfulVotes || []).map(String),
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt.toISOString(),
        publishedAs: r.publishedAs,
        user: u
          ? {
              username: u.username,
              anonymousHandle: u.anonymousHandle,
              avatar: u.avatar,
              earnedBadges: u.earnedBadges,
              publishAsAnonymous: u.publishAsAnonymous,
              country: u.country,
              city: u.city,
              showCityPublicly: u.showCityPublicly,
            }
          : undefined,
        strain: r.strainId
          ? {
              name: (r.strainId as any).name,
              slug: (r.strainId as any).slug,
              colorHint: (r.strainId as any).colorHint,
            }
          : null,
      };
    }),
  };
}

export default function CommunityPage({ loaderData }: Route.ComponentProps) {
  const { reviews } = loaderData;
  const t = useT();
  const href = useHref();
  const locale = useLocale();
  const COMMUNITY_VOICES = getCommunityVoices(locale);

  return (
    <div>
      <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-14">
        <div className="kicker mb-4">{t.community.kicker}</div>
        <h1
          className="display max-w-[18ch]"
          style={{ fontSize: "clamp(44px, 7vw, 96px)", lineHeight: 0.98 }}
        >
          {t.community.headlinePrefix}
          <span className="display-wonk" style={{ color: "var(--accent)" }}>
            {t.community.headlineAccent}
          </span>
          {t.community.headlineSuffix}
        </h1>
        <p className="mt-6 text-lg text-fg-muted max-w-[54ch] leading-relaxed">
          {t.community.body}
        </p>
      </section>

      <section className="bg-sunken border-y border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COMMUNITY_VOICES.map((v) => (
              <figure key={v.name} className="flex flex-col gap-4">
                <div
                  className="h-14 w-14 rounded-full bg-raised border border-line grid place-items-center display text-xl"
                  style={{ color: "var(--accent)" }}
                  aria-hidden
                >
                  {v.name.charAt(0)}
                </div>
                <blockquote
                  className="display-wonk text-2xl leading-snug"
                  style={{ color: "var(--fg)" }}
                >
                  <span style={{ color: "var(--accent)" }}>“</span>
                  {v.quote}
                  <span style={{ color: "var(--accent)" }}>”</span>
                </blockquote>
                <figcaption className="kicker">
                  {v.name} · {v.city} | {v.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="kicker mb-2">{t.community.feedKicker}</div>
            <h2 className="display text-3xl md:text-4xl">{t.community.feedTitle}</h2>
          </div>
          <Link to={href("/strains")} className="btn btn-ghost">
            {t.community.writeReview}
          </Link>
        </div>
        {reviews.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-fg-muted mb-4">{t.community.emptyBody}</p>
            <Link to={href("/strains")} className="btn btn-primary inline-flex">
              {t.community.emptyCta}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((review: any) => (
              <div key={review._id}>
                {review.strain && (
                  <div className="kicker mb-2">
                    {t.community.reviewAbout}{" "}
                    <Link
                      to={href(`/strains/${review.strain.slug}`)}
                      className="hover:text-fg"
                    >
                      {review.strain.name}
                    </Link>
                  </div>
                )}
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
