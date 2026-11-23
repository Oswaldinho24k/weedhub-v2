import { Link, useLoaderData } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
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
      "Directorio de marcas de cannabis verificadas. Descubre quiénes producen con transparencia y calidad.",
    url: `${SITE_URL}/marcas`,
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
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
      <div className="mb-10 wall--yellow border-[3px] border-ink p-6 md:p-8">
        <h1 className="rotulo" style={{ fontSize: "clamp(48px, 8vw, 104px)" }}>Marcas</h1>
        <p className="mt-3 text-lg font-semibold max-w-xl">
          Marcas de cannabis y cáñamo de América Latina, con reseñas de la comunidad. La insignia de verificada solo aparece cuando la marca lo está.
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
          <h2 className="display text-xl mb-2">¿Tienes una marca de cannabis?</h2>
          <p className="text-sm text-fg-muted max-w-md">
            Crea tu perfil gratuito, obtén verificación y llega a la comunidad cannábica más grande en LATAM.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link to="/marcas/registrar" className={buttonVariants({ variant: "primary" })}>
            Registrar mi marca
          </Link>
          <Link to="/planes" className={buttonVariants({ variant: "ghost" })}>
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
      <Link to="/marcas/registrar" className={buttonVariants({ variant: "primary" })}>
        Registrar mi marca
      </Link>
    </div>
  );
}
