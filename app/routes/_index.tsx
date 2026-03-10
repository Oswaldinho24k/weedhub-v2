import { Link } from "react-router";
import { motion } from "motion/react";
import type { Route } from "./+types/_index";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { UserModel } from "~/models/user.server";
import { StrainCard } from "~/components/composite/strain-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { RatingStars } from "~/components/composite/rating-stars";
import { Avatar } from "~/components/ui/avatar";
import { formatRelativeTime } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "WeedHub — Tu guía de cannabis en español",
    description: "Descubre, reseña y comparte tu experiencia cannábica con la comunidad hispanohablante más grande.",
    url: SITE_URL,
  });
}

export async function loader() {
  await connectDB();

  const [topStrains, recentReviews, totalStrains, totalUsers, totalReviews] = await Promise.all([
    StrainModel.find({ isArchived: false })
      .sort({ "averageRatings.overall": -1, reviewCount: -1 })
      .limit(6)
      .lean(),
    ReviewModel.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("userId", "displayName avatar")
      .populate("strainId", "name slug type")
      .lean(),
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
    recentReviews: recentReviews.map((r) => ({
      _id: String(r._id),
      ratings: r.ratings,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: r.userId
        ? { displayName: (r.userId as any).displayName, avatar: (r.userId as any).avatar }
        : null,
      strain: r.strainId
        ? { name: (r.strainId as any).name, slug: (r.strainId as any).slug, type: (r.strainId as any).type }
        : null,
    })),
    stats: { totalStrains, totalUsers, totalReviews },
  };
}

const HOW_IT_WORKS = [
  {
    icon: "search",
    title: "Explora",
    desc: "Busca entre cientos de cepas con filtros por tipo, efectos y más.",
  },
  {
    icon: "rate_review",
    title: "Reseña",
    desc: "Comparte tu experiencia y ayuda a la comunidad con reseñas detalladas.",
  },
  {
    icon: "emoji_events",
    title: "Gana",
    desc: "Acumula puntos e insignias mientras contribuyes a la comunidad.",
  },
];

const sectionReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.6 },
};

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const { topStrains, recentReviews, stats } = loaderData;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WeedHub",
    url: SITE_URL,
    description: "Tu guía de cannabis en español. Descubre cepas, comparte reseñas y conecta con la comunidad.",
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
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20 lg:py-32 text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Tu guía de cannabis{" "}
            <span className="text-primary">en español</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
            Descubre cepas, comparte reseñas y conecta con la comunidad cannábica
            hispanohablante más grande. Información verificada por usuarios reales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/strains">
              <Button size="lg">
                Explorar Cepas
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex justify-center gap-12">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">{stats.totalStrains}+</p>
              <p className="text-sm text-text-muted">Cepas</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-sm text-text-muted">Usuarios</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">{stats.totalReviews}</p>
              <p className="text-sm text-text-muted">Reseñas</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <motion.section
        className="mx-auto max-w-[1200px] px-6 py-20"
        {...sectionReveal}
      >
        <h2 className="font-display text-3xl font-bold text-white text-center mb-12">
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((item, i) => (
            <Card key={i} className="text-center border-white/10 p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-primary">
                  {item.icon}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Featured Strains */}
      {topStrains.length > 0 && (
        <motion.section
          className="mx-auto max-w-[1200px] px-6 py-20"
          {...sectionReveal}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold text-white">
              Cepas Destacadas
            </h2>
            <Link to="/strains">
              <Button variant="ghost">
                Ver todas
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topStrains.map((strain: any) => (
              <StrainCard key={strain._id} strain={strain} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <motion.section
          className="mx-auto max-w-[1200px] px-6 py-20"
          {...sectionReveal}
        >
          <h2 className="font-display text-3xl font-bold text-white mb-8">
            Reseñas Recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReviews.map((review: any, index: number) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border-white/10">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar fallback={review.user?.displayName?.charAt(0) || "?"} size="sm" />
                        <span className="text-sm font-medium text-white">
                          {review.user?.displayName || "Anónimo"}
                        </span>
                      </div>
                      <RatingStars rating={review.ratings.overall} size="sm" />
                    </div>
                    {review.strain && (
                      <Link
                        to={`/strains/${review.strain.slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {review.strain.name}
                      </Link>
                    )}
                    {review.comment && (
                      <p className="text-sm text-text-muted line-clamp-3">{review.comment}</p>
                    )}
                    <p className="text-xs text-text-muted/60">
                      {formatRelativeTime(review.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* CTA */}
      <motion.section
        className="mx-auto max-w-[1200px] px-6 py-20"
        {...sectionReveal}
      >
        <Card className="border-primary/20 glow-primary p-8 lg:p-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Únete a la comunidad
          </h2>
          <p className="text-text-muted max-w-lg mx-auto mb-8">
            Comparte tus experiencias, descubre nuevas cepas y gana puntos e insignias.
            Tu voz importa.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Crear Cuenta Gratis
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Button>
          </Link>
        </Card>
      </motion.section>
    </div>
  );
}
