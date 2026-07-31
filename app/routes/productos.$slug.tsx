import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/productos.$slug";
import { connectDB } from "~/lib/db.server";
import { ProductModel } from "~/models/product.server";
import { ReviewModel } from "~/models/review.server";
import { buildMeta, SITE_URL } from "~/lib/seo";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();

  const product = await ProductModel.findOne({ slug: params.slug, status: "active" })
    .populate("brandId", "name slug logo isVerified")
    .populate("strainId", "name slug type")
    .lean();

  if (!product) throw new Response("Not Found", { status: 404 });

  const reviews = await ReviewModel.find({
    entityType: "product",
    entityId: product._id,
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean()
    .select("ratings text createdAt publishedAs");

  const brand = product.brandId as any;
  const strain = product.strainId as any;

  return {
    product: {
      slug: product.slug,
      name: product.name,
      description: product.description || product.descriptions?.es || null,
      images: product.images || [],
      coverImage: product.coverImage || null,
      categoryKey: product.categoryKey,
      price: product.price || null,
      priceCurrency: product.priceCurrency,
      cannabinoidProfile: product.cannabinoidProfile || null,
      isPromoted: product.isPromoted,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      reviewDistribution: product.reviewDistribution as any,
    },
    brand: {
      name: brand?.name || "Marca desconocida",
      slug: brand?.slug || "",
      logo: brand?.logo || null,
      isVerified: brand?.isVerified || false,
    },
    strain: strain
      ? { name: strain.name, slug: strain.slug, type: strain.type }
      : null,
    reviews: reviews.map((r) => ({
      overall: (r.ratings as any)?.overall || 0,
      text: (r as any).text || null,
      publishedAs: (r as any).publishedAs || "anonymous",
      createdAt: (r.createdAt as Date)?.toISOString(),
    })),
  };
}

export function meta({ data }: Route.MetaArgs): ReturnType<Route.MetaFunction> {
  if (!data) return [{ title: "Producto — WeedHub" }];
  const { product, brand } = data;
  return buildMeta({
    title: `${product.name} — ${brand.name} | WeedHub`,
    description:
      product.description ||
      `${product.name} de ${brand.name}. ${product.categoryKey}. Calificado por la comunidad WeedHub.`,
    url: `${SITE_URL}/productos/${product.slug}`,
    image: product.coverImage || undefined,
    canonicalPath: `/productos/${product.slug}`,
    locale: "es",
  });
}

const TYPE_COLORS: Record<string, string> = {
  indica: "lilac",
  sativa: "accent",
  hybrid: "warm",
};

export default function ProductoSlugPage() {
  const { product, brand, strain, reviews } = useLoaderData<typeof loader>();
  const [activeImg, setActiveImg] = useState(0);

  const allImages = [
    ...(product.coverImage ? [product.coverImage] : []),
    ...product.images.filter((img) => img !== product.coverImage),
  ];

  const cannaProfile = product.cannabinoidProfile;
  const hasThc = cannaProfile && (cannaProfile.thc.max > 0);
  const hasCbd = cannaProfile && (cannaProfile.cbd.max > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WeedHub", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Productos", item: `${SITE_URL}/productos` },
          { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/productos/${product.slug}` },
        ],
      },
      {
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: allImages[0] || undefined,
        brand: { "@type": "Brand", name: brand.name },
        ...(product.price
          ? {
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: product.priceCurrency,
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
        ...(product.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.averageRating,
                reviewCount: product.reviewCount,
              },
            }
          : {}),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
          <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
          <span>›</span>
          <Link to="/productos" className="hover:text-fg transition-colors">Productos</Link>
          {product.categoryKey && (
            <>
              <span>›</span>
              <Link
                to={`/productos?cat=${product.categoryKey}`}
                className="hover:text-fg transition-colors capitalize"
              >
                {product.categoryKey}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="text-fg truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Gallery */}
          <div>
            <div
              className="rounded-2xl overflow-hidden aspect-square mb-3 border border-line"
              style={{ background: "var(--bg-elev)" }}
            >
              {allImages.length > 0 ? (
                <img
                  src={allImages[activeImg]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-6xl opacity-20">
                  📦
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all"
                    style={{
                      borderColor: activeImg === i ? "var(--accent)" : "var(--line)",
                    }}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="pill text-xs capitalize">{product.categoryKey}</span>
              {product.isPromoted && <span className="pill warm text-xs">Destacado</span>}
            </div>

            <h1 className="display text-3xl mb-2">{product.name}</h1>

            {/* Brand */}
            <Link
              to={`/marcas/${brand.slug}`}
              className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-6 w-6 rounded object-contain" />
              ) : (
                <span
                  className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {brand.name[0]}
                </span>
              )}
              <span className="text-sm text-fg-muted">{brand.name}</span>
              {brand.isVerified && (
                <span className="pill accent text-xs">✓</span>
              )}
            </Link>

            {/* Price */}
            {product.price && (
              <div className="mb-6">
                <div className="text-3xl font-bold">
                  {product.priceCurrency === "MXN" ? "$" : "USD "}
                  {product.price.toLocaleString("es-MX")}
                  {product.priceCurrency === "MXN" && (
                    <span className="text-base font-normal text-fg-dim ml-1">MXN</span>
                  )}
                </div>
              </div>
            )}

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">⭐</span>
                <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
                <span className="text-sm text-fg-dim">({product.reviewCount} reseñas)</span>
              </div>
            )}

            {/* Cannabinoid profile */}
            {(hasThc || hasCbd) && (
              <div className="card p-5 mb-6">
                <div className="kicker mb-4">Perfil de cannabinoides</div>
                <div className="space-y-4">
                  {hasThc && (
                    <CannabinoidBar
                      label="THC"
                      min={cannaProfile!.thc.min}
                      max={cannaProfile!.thc.max}
                      color="var(--accent)"
                    />
                  )}
                  {hasCbd && (
                    <CannabinoidBar
                      label="CBD"
                      min={cannaProfile!.cbd.min}
                      max={cannaProfile!.cbd.max}
                      color="var(--lilac)"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Strain link */}
            {strain && (
              <div className="mb-6">
                <div className="kicker mb-2">Cepa base</div>
                <Link
                  to={`/strains/${strain.slug}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className={`pill text-xs ${TYPE_COLORS[strain.type] || ""}`}>
                    {strain.type}
                  </span>
                  <span className="text-sm font-medium">{strain.name}</span>
                  <span className="text-xs text-fg-dim">→</span>
                </Link>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <div className="kicker mb-2">Descripción</div>
                <p className="text-sm text-fg-muted leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="border-t border-line pt-12">
            <div className="kicker mb-6">Reseñas de la comunidad</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((r, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{"⭐".repeat(Math.round(r.overall))}</span>
                    <span className="text-xs text-fg-dim ml-auto">
                      {new Date(r.createdAt).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  {r.text && (
                    <p className="text-sm text-fg-muted leading-relaxed">{r.text}</p>
                  )}
                  <div className="text-xs text-fg-dim mt-2">
                    {r.publishedAs === "anonymous" ? "Anónimo" : "Usuario"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function CannabinoidBar({
  label,
  min,
  max,
  color,
}: {
  label: string;
  min: number;
  max: number;
  color: string;
}) {
  const displayMax = Math.max(max, 35);
  const leftPct = (min / displayMax) * 100;
  const widthPct = ((max - min) / displayMax) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-sm text-fg-muted">
          {min === max ? `${max}%` : `${min}–${max}%`}
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--bg-elev)" }}>
        <div
          className="h-full rounded-full"
          style={{
            marginLeft: `${leftPct}%`,
            width: `${Math.max(widthPct, 4)}%`,
            background: color,
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
}
