import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/marcas";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { buildMeta, SITE_URL } from "~/lib/seo";

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();

  const brands = await BrandModel.find({ status: "active" })
    .sort({ isVerified: -1, averageRating: -1 })
    .limit(60)
    .lean()
    .select("name slug logo coverImage country city isVerified tier averageRating reviewCount productCount");

  return {
    brands: brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      logo: b.logo || null,
      country: b.country,
      city: b.city || null,
      isVerified: b.isVerified,
      tier: b.tier,
      averageRating: b.averageRating,
      reviewCount: b.reviewCount,
      productCount: b.productCount,
    })),
  };
}

export function meta(): ReturnType<Route.MetaFunction> {
  return buildMeta({
    title: "Directorio de Marcas Cannábicas — WeedHub",
    description:
      "Directorio de marcas de cannabis verificadas en México y Latinoamérica. Descubre quiénes producen con transparencia y calidad.",
    url: `${SITE_URL}/marcas`,
    canonicalPath: "/marcas",
    locale: "es",
  });
}

const COUNTRY_NAMES: Record<string, string> = {
  MX: "México",
  CO: "Colombia",
  AR: "Argentina",
  CL: "Chile",
  PE: "Perú",
  US: "EUA",
  CA: "Canadá",
};

export default function MarcasPage() {
  const { brands } = useLoaderData<typeof loader>();


  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-10">
        <div className="kicker mb-2">Directorio</div>
        <h1 className="display text-4xl mb-3">Marcas de Cannabis</h1>
        <p className="text-fg-muted max-w-xl">
          Marcas verificadas en México y LATAM. Producción transparente, calificadas por la comunidad.
        </p>
      </div>

      {brands.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {brands.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </>
      )}

      <div className="card p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="kicker mb-1">Para marcas</div>
          <h2 className="display text-xl mb-2">¿Tienes una marca de cannabis?</h2>
          <p className="text-sm text-fg-muted max-w-md">
            Crea tu perfil gratuito, obtén verificación y llega a la comunidad cannábica hispana más grande.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link to="/marcas/registrar" className="btn btn-primary">
            Registrar mi marca
          </Link>
          <Link to="/planes" className="btn btn-ghost">
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}

function BrandCard({
  brand,
}: {
  brand: {
    slug: string;
    name: string;
    logo: string | null;
    country: string;
    city: string | null;
    isVerified: boolean;
    tier: string;
    averageRating: number;
    reviewCount: number;
    productCount: number;
  };
}) {
  const initials = brand.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      to={`/marcas/${brand.slug}`}
      className="card group flex items-start gap-4 p-5 hover:border-line-strong transition-all"
    >
      <div
        className="h-14 w-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold"
        style={{
          background: brand.logo ? undefined : "var(--accent-soft)",
          color: "var(--accent)",
        }}
      >
        {brand.logo ? (
          <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain p-1" />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold truncate group-hover:text-accent transition-colors">
            {brand.name}
          </span>
          {brand.isVerified && (
            <span
              className="pill accent text-xs shrink-0"
              title="Marca verificada"
            >
              ✓ Verificada
            </span>
          )}
          {brand.tier === "premium" && !brand.isVerified && (
            <span className="pill text-xs shrink-0">Premium</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-fg-dim flex-wrap">
          <span>{COUNTRY_NAMES[brand.country] || brand.country}</span>
          {brand.city && <span>· {brand.city}</span>}
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-fg-muted">
          {brand.averageRating > 0 && (
            <span>⭐ {brand.averageRating.toFixed(1)}</span>
          )}
          {brand.reviewCount > 0 && (
            <span>{brand.reviewCount} reseñas</span>
          )}
          {brand.productCount > 0 && (
            <span>{brand.productCount} productos</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center text-fg-dim">
      <p className="text-lg mb-2">Aún no hay marcas registradas</p>
      <p className="text-sm mb-8">Sé la primera marca en WeedHub.</p>
      <Link to="/marcas/registrar" className="btn btn-primary">
        Registrar mi marca
      </Link>
    </div>
  );
}
