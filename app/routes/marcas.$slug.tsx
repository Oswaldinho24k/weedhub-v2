import { Form, Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/marcas.$slug";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { ProductModel } from "~/models/product.server";
import { ReviewModel } from "~/models/review.server";
import { getUserFromSession } from "~/lib/auth.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { PLAN_PRICES, PLAN_NAMES } from "~/lib/stripe.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  await connectDB();

  const [brand, sessionUser] = await Promise.all([
    BrandModel.findOne({ slug: params.slug, status: "active" }).lean(),
    getUserFromSession(request),
  ]);

  if (!brand) throw new Response("Not Found", { status: 404 });

  const [products, reviews] = await Promise.all([
    ProductModel.find({ brandId: brand._id, status: "active" })
      .sort({ isPromoted: -1, createdAt: -1 })
      .limit(6)
      .lean()
      .select("name slug coverImage categoryKey price priceCurrency isPromoted"),
    ReviewModel.find({ entityType: "brand", entityId: brand._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .select("ratings text createdAt publishedAs"),
  ]);

  const sessionUserId = sessionUser ? String(sessionUser._id) : null;
  const isOwner = sessionUser && brand.ownerId
    ? brand.ownerId.equals(sessionUser._id)
    : false;
  const isAdmin = sessionUser?.role === "admin";

  return {
    brand: {
      _id: String(brand._id),
      name: brand.name,
      slug: brand.slug,
      description: brand.description || brand.descriptions?.es || null,
      logo: brand.logo || null,
      coverImage: brand.coverImage || null,
      country: brand.country,
      city: brand.city || null,
      website: brand.website || null,
      instagram: brand.instagram || null,
      tiktok: brand.tiktok || null,
      isVerified: brand.isVerified,
      tier: brand.tier,
      averageRating: brand.averageRating,
      reviewCount: brand.reviewCount,
      productCount: brand.productCount,
      stripeCustomerId: brand.stripeCustomerId || null,
    },
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      coverImage: p.coverImage || null,
      categoryKey: p.categoryKey,
      price: p.price || null,
      priceCurrency: p.priceCurrency,
      isPromoted: p.isPromoted,
    })),
    reviews: reviews.map((r) => ({
      overall: (r.ratings as any)?.overall || 0,
      text: (r as any).text || null,
      publishedAs: (r as any).publishedAs || "anonymous",
      createdAt: (r.createdAt as Date)?.toISOString(),
    })),
    sessionUserId,
    isOwner: !!isOwner,
    isAdmin: !!isAdmin,
  };
}

export function meta({ data }: Route.MetaArgs): ReturnType<Route.MetaFunction> {
  if (!data) return [{ title: "Marca — WeedHub" }];
  const { brand } = data;
  return buildMeta({
    title: `${brand.name} | WeedHub Marcas`,
    description:
      brand.description ||
      `Perfil de ${brand.name} en WeedHub — productos, calificaciones y más.`,
    url: `${SITE_URL}/marcas/${brand.slug}`,
    image: brand.logo || brand.coverImage || undefined,
    canonicalPath: `/marcas/${brand.slug}`,
    locale: "es",
  });
}

const COUNTRY_NAMES: Record<string, string> = {
  MX: "México", CO: "Colombia", AR: "Argentina",
  CL: "Chile", PE: "Perú", US: "EUA", CA: "Canadá",
};

const TIER_LABELS: Record<string, string> = {
  free: "En Directorio",
  premium: "Presencia Verificada",
  enterprise: "Destacado",
};

export default function MarcaSlugPage() {
  const { brand, products, reviews, isOwner, isAdmin, sessionUserId } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get("registrada") === "1";
  const justUpgraded = searchParams.get("upgraded") === "1";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WeedHub", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Marcas", item: `${SITE_URL}/marcas` },
          { "@type": "ListItem", position: 3, name: brand.name, item: `${SITE_URL}/marcas/${brand.slug}` },
        ],
      },
      {
        "@type": "Brand",
        name: brand.name,
        url: brand.website || `${SITE_URL}/marcas/${brand.slug}`,
        logo: brand.logo || undefined,
        description: brand.description || undefined,
      },
    ],
  };

  const initials = brand.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {brand.coverImage && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img src={brand.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Success banners */}
        {justRegistered && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <span className="text-lg">✓</span>
            <div>
              <div className="font-semibold text-sm">¡Perfil creado exitosamente!</div>
              <div className="text-xs opacity-80 mt-0.5">
                Activa tu Presencia Verificada para obtener tu badge y aparecer destacado.
              </div>
            </div>
          </div>
        )}
        {justUpgraded && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <span className="text-lg">✦</span>
            <div>
              <div className="font-semibold text-sm">
                ¡{TIER_LABELS[brand.tier]} activado!
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                Tu badge de verificación ya aparece en el directorio. Bienvenido a WeedHub.
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
          <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
          <span>›</span>
          <Link to="/marcas" className="hover:text-fg transition-colors">Marcas</Link>
          <span>›</span>
          <span className="text-fg">{brand.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <div>
            {/* Hero */}
            <div className="flex items-start gap-5 mb-8">
              <div
                className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold border border-line"
                style={{
                  background: brand.logo ? "var(--bg-elev)" : "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain p-2" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="display text-3xl">{brand.name}</h1>
                  {brand.isVerified && (
                    <span className="pill accent">✓ Verificada</span>
                  )}
                  {brand.tier === "enterprise" && (
                    <span
                      className="pill text-xs"
                      style={{ background: "var(--gold)", color: "oklch(22% 0.05 85)", borderColor: "transparent" }}
                    >
                      ✦ Destacada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-fg-muted flex-wrap">
                  <span>{COUNTRY_NAMES[brand.country] || brand.country}</span>
                  {brand.city && <span>· {brand.city}</span>}
                  {brand.website && (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer"
                      className="hover:text-fg transition-colors">
                      🌐 Sitio web
                    </a>
                  )}
                  {brand.instagram && (
                    <a
                      href={`https://instagram.com/${brand.instagram.replace("@", "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="hover:text-fg transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>

              {/* Owner controls */}
              {(isOwner || isAdmin) && (
                <Link
                  to={`/marcas/${brand.slug}/editar`}
                  className="btn btn-ghost !py-1.5 !px-3 text-xs shrink-0"
                >
                  Editar perfil
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                  {brand.averageRating > 0 ? brand.averageRating.toFixed(1) : "—"}
                </div>
                <div className="text-xs text-fg-dim mt-1">Rating</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold">{brand.reviewCount}</div>
                <div className="text-xs text-fg-dim mt-1">Reseñas</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold">{brand.productCount}</div>
                <div className="text-xs text-fg-dim mt-1">Productos</div>
              </div>
            </div>

            {brand.description && (
              <div className="mb-10">
                <div className="kicker mb-3">Sobre la marca</div>
                <p className="text-fg-muted leading-relaxed">{brand.description}</p>
              </div>
            )}

            {products.length > 0 && (
              <div className="mb-10">
                <div className="kicker mb-4">Productos</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/productos/${p.slug}`}
                      className="card group overflow-hidden hover:border-line-strong transition-all"
                    >
                      <div className="aspect-square overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                        {p.coverImage ? (
                          <img src={p.coverImage} alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl opacity-30">📦</div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-fg-dim mb-0.5">{p.categoryKey}</div>
                        <div className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                          {p.name}
                        </div>
                        {p.price && (
                          <div className="text-xs text-fg-muted mt-1">
                            {p.priceCurrency === "MXN" ? "$" : "USD "}
                            {p.price.toLocaleString("es-MX")}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {brand.productCount > 6 && (
                  <Link to={`/productos?brand=${brand.slug}`}
                    className="block mt-4 text-sm text-fg-muted hover:text-fg transition-colors">
                    Ver todos los productos ({brand.productCount}) →
                  </Link>
                )}
              </div>
            )}

            {reviews.length > 0 && (
              <div>
                <div className="kicker mb-4">Reseñas recientes</div>
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{"⭐".repeat(Math.round(r.overall))}</span>
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
            <PaymentSection
              brand={brand}
              isOwnerOrAdmin={isOwner || isAdmin}
              isLoggedIn={!!sessionUserId}
            />

            <div className="card p-5">
              <div className="kicker mb-3">Explorar</div>
              <div className="space-y-2">
                <Link to="/marcas" className="block text-sm text-fg-muted hover:text-fg py-1 transition-colors">
                  → Todas las marcas
                </Link>
                <Link to="/productos" className="block text-sm text-fg-muted hover:text-fg py-1 transition-colors">
                  → Catálogo de productos
                </Link>
                <Link to="/planes" className="block text-sm text-fg-muted hover:text-fg py-1 transition-colors">
                  → Ver planes
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function PaymentSection({
  brand,
  isOwnerOrAdmin,
  isLoggedIn,
}: {
  brand: {
    _id: string;
    slug: string;
    tier: string;
    isVerified: boolean;
    stripeCustomerId: string | null;
  };
  isOwnerOrAdmin: boolean;
  isLoggedIn: boolean;
}) {
  if (brand.tier === "enterprise") {
    return (
      <div className="card p-5" style={{ borderColor: "var(--gold)", borderWidth: "1px" }}>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--gold)" }}>
          ✦ Marca Destacada
        </div>
        <p className="text-xs text-fg-dim mb-4">Máxima visibilidad en WeedHub.</p>
        {brand.stripeCustomerId && (
          <Form method="post" action="/api/stripe/portal">
            <input type="hidden" name="entityType" value="brand" />
            <input type="hidden" name="entityId" value={brand._id} />
            <input type="hidden" name="returnPath" value={`/marcas/${brand.slug}`} />
            <button type="submit" className="btn btn-ghost w-full text-xs">
              Gestionar suscripción
            </button>
          </Form>
        )}
      </div>
    );
  }

  if (brand.tier === "premium") {
    return (
      <div className="card p-5" style={{ borderColor: "var(--accent)", borderWidth: "1px" }}>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
          ✓ Presencia Verificada
        </div>
        <p className="text-xs text-fg-dim mb-4">
          Tu marca aparece verificada en el directorio.
        </p>
        <Form method="post" action="/api/stripe/checkout">
          <input type="hidden" name="entityType" value="brand" />
          <input type="hidden" name="entityId" value={brand._id} />
          <input type="hidden" name="entitySlug" value={brand.slug} />
          <input type="hidden" name="plan" value="enterprise" />
          <button type="submit" className="btn btn-ghost w-full text-xs mb-2">
            Pasar a Destacado — {PLAN_PRICES.brand.enterprise}
          </button>
        </Form>
        {brand.stripeCustomerId && (
          <Form method="post" action="/api/stripe/portal">
            <input type="hidden" name="entityType" value="brand" />
            <input type="hidden" name="entityId" value={brand._id} />
            <input type="hidden" name="returnPath" value={`/marcas/${brand.slug}`} />
            <button type="submit" className="btn btn-ghost w-full text-xs opacity-60">
              Gestionar suscripción
            </button>
          </Form>
        )}
      </div>
    );
  }

  // Free tier
  return (
    <div className="card p-5">
      <div className="kicker mb-2">Activa tu presencia</div>
      <p className="text-sm text-fg-muted mb-1">
        <span className="font-semibold text-fg">Presencia Verificada</span> —{" "}
        {PLAN_PRICES.brand.premium}
      </p>
      <ul className="text-xs text-fg-dim space-y-1 mb-5">
        <li>✓ Badge verificada en el directorio</li>
        <li>✓ Control total de tu perfil</li>
        <li>✓ Posición sobre marcas free</li>
        <li>✓ 30 días de prueba gratis</li>
      </ul>

      {isLoggedIn ? (
        <Form method="post" action="/api/stripe/checkout">
          <input type="hidden" name="entityType" value="brand" />
          <input type="hidden" name="entityId" value={brand._id} />
          <input type="hidden" name="entitySlug" value={brand.slug} />
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
