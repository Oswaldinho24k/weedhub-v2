import { Form, Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/dispensarios.$slug";
import { connectDB } from "~/lib/db.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { ReviewModel } from "~/models/review.server";
import { getUserFromSession } from "~/lib/auth.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { PLAN_PRICES } from "~/lib/stripe.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  await connectDB();

  const [dispensary, sessionUser] = await Promise.all([
    DispensaryModel.findOne({ slug: params.slug, status: "active" }).lean(),
    getUserFromSession(request),
  ]);

  if (!dispensary) throw new Response("Not Found", { status: 404 });

  const reviews = await ReviewModel.find({
    entityType: "dispensary",
    entityId: dispensary._id,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()
    .select("ratings text createdAt publishedAs");

  const isOwner = sessionUser && dispensary.ownerId
    ? dispensary.ownerId.equals(sessionUser._id)
    : false;

  return {
    dispensary: {
      _id: String(dispensary._id),
      name: dispensary.name,
      slug: dispensary.slug,
      description: dispensary.description || null,
      logo: dispensary.logo || null,
      coverImage: dispensary.coverImage || null,
      address: dispensary.address,
      city: dispensary.city,
      state: dispensary.state || null,
      country: dispensary.country,
      lat: dispensary.lat || null,
      lng: dispensary.lng || null,
      phone: dispensary.phone || null,
      website: dispensary.website || null,
      instagram: dispensary.instagram || null,
      isVerified: dispensary.isVerified,
      tier: dispensary.tier,
      averageRating: dispensary.averageRating,
      reviewCount: dispensary.reviewCount,
      stripeCustomerId: dispensary.stripeCustomerId || null,
    },
    reviews: reviews.map((r) => ({
      overall: (r.ratings as any)?.overall || 0,
      text: (r as any).text || null,
      publishedAs: (r as any).publishedAs || "anonymous",
      createdAt: (r.createdAt as Date)?.toISOString(),
    })),
    isOwner: !!isOwner,
    isAdmin: sessionUser?.role === "admin",
    isLoggedIn: !!sessionUser,
  };
}

export function meta({ data }: Route.MetaArgs): ReturnType<Route.MetaFunction> {
  if (!data) return [{ title: "Dispensario — WeedHub" }];
  const { dispensary } = data;
  return buildMeta({
    title: `${dispensary.name} | WeedHub Dispensarios`,
    description:
      dispensary.description ||
      `${dispensary.name} — ${dispensary.city}, ${dispensary.country}. Calificado por la comunidad WeedHub.`,
    url: `${SITE_URL}/dispensarios/${dispensary.slug}`,
    image: dispensary.logo || dispensary.coverImage || undefined,
    canonicalPath: `/dispensarios/${dispensary.slug}`,
    locale: "es",
  });
}

const COUNTRY_NAMES: Record<string, string> = {
  MX: "México", CO: "Colombia", AR: "Argentina",
  CL: "Chile", PE: "Perú", US: "EUA", CA: "Canadá",
};

export default function DispensarioSlugPage() {
  const { dispensary, reviews, isOwner, isAdmin, isLoggedIn } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "1";

  const mapsQuery =
    dispensary.lat && dispensary.lng
      ? `${dispensary.lat},${dispensary.lng}`
      : encodeURIComponent(
          `${dispensary.address}, ${dispensary.city}, ${COUNTRY_NAMES[dispensary.country] || dispensary.country}`
        );

  const embedSrc = `https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed`;
  const mapsHref = `https://maps.google.com/maps?q=${mapsQuery}`;

  const initials = dispensary.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WeedHub", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Dispensarios", item: `${SITE_URL}/dispensarios` },
          { "@type": "ListItem", position: 3, name: dispensary.name, item: `${SITE_URL}/dispensarios/${dispensary.slug}` },
        ],
      },
      {
        "@type": "LocalBusiness",
        name: dispensary.name,
        description: dispensary.description || undefined,
        image: dispensary.logo || dispensary.coverImage || undefined,
        url: dispensary.website || `${SITE_URL}/dispensarios/${dispensary.slug}`,
        telephone: dispensary.phone || undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: dispensary.address,
          addressLocality: dispensary.city,
          addressRegion: dispensary.state || undefined,
          addressCountry: dispensary.country,
        },
        ...(dispensary.lat && dispensary.lng
          ? { geo: { "@type": "GeoCoordinates", latitude: dispensary.lat, longitude: dispensary.lng } }
          : {}),
        aggregateRating:
          dispensary.reviewCount > 0
            ? { "@type": "AggregateRating", ratingValue: dispensary.averageRating, reviewCount: dispensary.reviewCount }
            : undefined,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {dispensary.coverImage && (
        <div className="w-full h-44 md:h-56 overflow-hidden">
          <img src={dispensary.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {justUpgraded && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <span className="text-lg">✓</span>
            <div>
              <div className="font-semibold text-sm">¡Presencia Verificada activada!</div>
              <div className="text-xs opacity-80 mt-0.5">
                Tu dispensario ya aparece verificado en el directorio.
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
          <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
          <span>›</span>
          <Link to="/dispensarios" className="hover:text-fg transition-colors">Dispensarios</Link>
          <span>›</span>
          <span className="text-fg">{dispensary.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          <div>
            {/* Hero */}
            <div className="flex items-start gap-5 mb-8">
              <div
                className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold border border-line"
                style={{
                  background: dispensary.logo ? "var(--bg-elev)" : "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                {dispensary.logo ? (
                  <img src={dispensary.logo} alt={dispensary.name} className="h-full w-full object-contain p-2" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="display text-3xl">{dispensary.name}</h1>
                  {dispensary.isVerified && (
                    <span className="pill accent">✓ Verificado</span>
                  )}
                  {dispensary.tier === "enterprise" && (
                    <span
                      className="pill text-xs"
                      style={{ background: "var(--gold)", color: "oklch(22% 0.05 85)", borderColor: "transparent" }}
                    >
                      ✦ Destacado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-fg-muted flex-wrap">
                  <span>📍</span>
                  <span>{dispensary.address},</span>
                  <span>{dispensary.city}</span>
                  {dispensary.state && <span>, {dispensary.state}</span>}
                  <span>· {COUNTRY_NAMES[dispensary.country] || dispensary.country}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {dispensary.phone && (
                    <a href={`tel:${dispensary.phone}`}
                      className="text-sm text-fg-muted hover:text-fg transition-colors">
                      📞 {dispensary.phone}
                    </a>
                  )}
                  {dispensary.website && (
                    <a href={dispensary.website} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-fg-muted hover:text-fg transition-colors">
                      🌐 Sitio web
                    </a>
                  )}
                  {dispensary.instagram && (
                    <a
                      href={`https://instagram.com/${dispensary.instagram.replace("@", "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm text-fg-muted hover:text-fg transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                  {dispensary.averageRating > 0 ? dispensary.averageRating.toFixed(1) : "—"}
                </div>
                <div className="text-xs text-fg-dim mt-1">Rating</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold">{dispensary.reviewCount}</div>
                <div className="text-xs text-fg-dim mt-1">Reseñas</div>
              </div>
            </div>

            {dispensary.description && (
              <div className="mb-8">
                <div className="kicker mb-3">Sobre este dispensario</div>
                <p className="text-fg-muted leading-relaxed">{dispensary.description}</p>
              </div>
            )}

            {/* Mapa */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <div className="kicker">Ubicación</div>
                <a href={mapsHref} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-fg-dim hover:text-fg transition-colors">
                  Abrir en Google Maps →
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-line" style={{ height: 280 }}>
                <iframe
                  src={embedSrc}
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa de ${dispensary.name}`}
                />
              </div>
            </div>

            {reviews.length > 0 && (
              <div>
                <div className="kicker mb-4">Reseñas recientes</div>
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{"⭐".repeat(Math.round(r.overall))}</span>
                        <span className="text-xs text-fg-dim">
                          {r.publishedAs === "anonymous" ? "Anónimo" : "Usuario"}
                        </span>
                        <span className="text-xs text-fg-dim ml-auto">
                          {new Date(r.createdAt).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                      {r.text && (
                        <p className="text-sm text-fg-muted leading-relaxed">{r.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <DispensaryPaymentSection
              dispensary={dispensary}
              isLoggedIn={isLoggedIn}
            />

            <div className="card p-5">
              <div className="kicker mb-3">Directorio</div>
              <div className="space-y-2">
                <Link to="/dispensarios" className="block text-sm text-fg-muted hover:text-fg py-1 transition-colors">
                  → Todos los dispensarios
                </Link>
                <Link to={`/dispensarios?city=${dispensary.city}`}
                  className="block text-sm text-fg-muted hover:text-fg py-1 transition-colors">
                  → Más en {dispensary.city}
                </Link>
                <Link to="/dispensarios/agregar"
                  className="block text-sm text-fg-muted hover:text-fg py-1 transition-colors">
                  → Agregar un dispensario
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function DispensaryPaymentSection({
  dispensary,
  isLoggedIn,
}: {
  dispensary: {
    _id: string;
    slug: string;
    tier: string;
    isVerified: boolean;
    stripeCustomerId: string | null;
  };
  isLoggedIn: boolean;
}) {
  if (dispensary.tier === "enterprise") {
    return (
      <div className="card p-5" style={{ borderColor: "var(--gold)", borderWidth: "1px" }}>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--gold)" }}>
          ✦ Dispensario Destacado
        </div>
        <p className="text-xs text-fg-dim mb-4">Máxima visibilidad en el directorio.</p>
        {dispensary.stripeCustomerId && (
          <Form method="post" action="/api/stripe/portal">
            <input type="hidden" name="entityType" value="dispensary" />
            <input type="hidden" name="entityId" value={dispensary._id} />
            <input type="hidden" name="returnPath" value={`/dispensarios/${dispensary.slug}`} />
            <button type="submit" className="btn btn-ghost w-full text-xs">
              Gestionar suscripción
            </button>
          </Form>
        )}
      </div>
    );
  }

  if (dispensary.tier === "premium") {
    return (
      <div className="card p-5" style={{ borderColor: "var(--accent)", borderWidth: "1px" }}>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
          ✓ Presencia Verificada
        </div>
        <p className="text-xs text-fg-dim mb-4">Tu dispensario aparece verificado.</p>
        <Form method="post" action="/api/stripe/checkout">
          <input type="hidden" name="entityType" value="dispensary" />
          <input type="hidden" name="entityId" value={dispensary._id} />
          <input type="hidden" name="entitySlug" value={dispensary.slug} />
          <input type="hidden" name="plan" value="enterprise" />
          <button type="submit" className="btn btn-ghost w-full text-xs mb-2">
            Pasar a Destacado — {PLAN_PRICES.dispensary.enterprise}
          </button>
        </Form>
        {dispensary.stripeCustomerId && (
          <Form method="post" action="/api/stripe/portal">
            <input type="hidden" name="entityType" value="dispensary" />
            <input type="hidden" name="entityId" value={dispensary._id} />
            <input type="hidden" name="returnPath" value={`/dispensarios/${dispensary.slug}`} />
            <button type="submit" className="btn btn-ghost w-full text-xs opacity-60">
              Gestionar suscripción
            </button>
          </Form>
        )}
      </div>
    );
  }

  // Free tier — show activation CTA
  return (
    <div className="card p-5">
      <div className="kicker mb-2">¿Es tu dispensario?</div>
      <p className="text-sm text-fg-muted mb-1">
        <span className="font-semibold text-fg">Presencia Verificada</span> —{" "}
        {PLAN_PRICES.dispensary.premium}
      </p>
      <ul className="text-xs text-fg-dim space-y-1 mb-5">
        <li>✓ Badge verificado</li>
        <li>✓ Control de tu perfil y fotos</li>
        <li>✓ Posición destacada en búsqueda</li>
        <li>✓ 30 días de prueba gratis</li>
      </ul>
      {isLoggedIn ? (
        <Form method="post" action="/api/stripe/checkout">
          <input type="hidden" name="entityType" value="dispensary" />
          <input type="hidden" name="entityId" value={dispensary._id} />
          <input type="hidden" name="entitySlug" value={dispensary.slug} />
          <input type="hidden" name="plan" value="premium" />
          <button type="submit" className="btn btn-primary w-full text-sm">
            Activar Presencia Verificada
          </button>
        </Form>
      ) : (
        <Link to="/auth?mode=register" className="btn btn-primary w-full text-sm text-center">
          Crear cuenta para activar
        </Link>
      )}
      <p className="text-xs text-fg-dim mt-3 text-center">Sin contrato · Cancela cuando quieras</p>
    </div>
  );
}
