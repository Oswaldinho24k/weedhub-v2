import { Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/dispensarios";
import { connectDB } from "~/lib/db.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { buildMeta, SITE_URL } from "~/lib/seo";

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const cityFilter = url.searchParams.get("city") || "";
  const verifiedOnly = url.searchParams.get("verified") === "1";

  const filter: Record<string, unknown> = { status: "active" };
  if (cityFilter) filter.city = { $regex: cityFilter, $options: "i" };
  if (verifiedOnly) filter.isVerified = true;

  const [dispensaries, cities] = await Promise.all([
    DispensaryModel.find(filter)
      .sort({ isVerified: -1, averageRating: -1 })
      .limit(80)
      .lean()
      .select("name slug logo city state country address isVerified tier averageRating reviewCount lat lng"),
    DispensaryModel.distinct("city", { status: "active" }),
  ]);

  return {
    dispensaries: dispensaries.map((d) => ({
      slug: d.slug,
      name: d.name,
      logo: d.logo || null,
      city: d.city,
      state: d.state || null,
      country: d.country,
      address: d.address,
      isVerified: d.isVerified,
      tier: d.tier,
      averageRating: d.averageRating,
      reviewCount: d.reviewCount,
      hasCoords: !!(d.lat && d.lng),
    })),
    cities: (cities as string[]).sort(),
    activeCity: cityFilter,
    verifiedOnly,
  };
}

export function meta(): ReturnType<Route.MetaFunction> {
  return buildMeta({
    title: "Directorio de Dispensarios — WeedHub",
    description:
      "Encuentra dispensarios de cannabis verificados en México y Latinoamérica. Puntos de venta legales calificados por la comunidad.",
    url: `${SITE_URL}/dispensarios`,
    canonicalPath: "/dispensarios",
    locale: "es",
  });
}

export default function DispensariosPage() {
  const { dispensaries, cities, activeCity, verifiedOnly } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function setCity(city: string) {
    const next = new URLSearchParams(searchParams);
    if (city) next.set("city", city);
    else next.delete("city");
    setSearchParams(next);
  }

  function toggleVerified() {
    const next = new URLSearchParams(searchParams);
    if (verifiedOnly) next.delete("verified");
    else next.set("verified", "1");
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-10">
        <div className="kicker mb-2">Directorio</div>
        <h1 className="display text-4xl mb-3">Dispensarios</h1>
        <p className="text-fg-muted max-w-xl">
          Puntos de venta de cannabis verificados en México y LATAM, calificados por la comunidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar filtros */}
        <aside className="space-y-6">
          <div>
            <div className="kicker mb-3">Filtros</div>
            <button
              type="button"
              onClick={toggleVerified}
              className="flex items-center gap-2 text-sm w-full text-left py-1.5"
            >
              <span
                className="h-4 w-4 rounded border flex items-center justify-center shrink-0"
                style={{
                  background: verifiedOnly ? "var(--accent)" : "transparent",
                  borderColor: verifiedOnly ? "var(--accent)" : "var(--line-strong)",
                }}
              >
                {verifiedOnly && <span className="text-[10px] text-white font-bold">✓</span>}
              </span>
              Solo verificados
            </button>
          </div>

          {cities.length > 0 && (
            <div>
              <div className="kicker mb-3">Ciudad</div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setCity("")}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    !activeCity ? "text-fg font-medium" : "text-fg-muted hover:text-fg hover:bg-elev"
                  }`}
                >
                  Todas
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setCity(city)}
                    className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeCity === city
                        ? "text-fg font-medium"
                        : "text-fg-muted hover:text-fg hover:bg-elev"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Link to="/dispensarios/agregar" className="btn btn-ghost w-full text-sm text-center">
            + Agregar dispensario
          </Link>
        </aside>

        {/* Lista */}
        <div>
          {dispensaries.length === 0 ? (
            <div className="py-24 text-center text-fg-dim">
              <p className="text-lg mb-2">
                {activeCity
                  ? `No hay dispensarios en ${activeCity} todavía`
                  : "No hay dispensarios registrados aún"}
              </p>
              <Link to="/dispensarios/agregar" className="btn btn-primary mt-6 inline-block">
                Ser el primero en registrarse
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dispensaries.map((d) => (
                <DispensaryRow key={d.slug} dispensary={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DispensaryRow({
  dispensary,
}: {
  dispensary: {
    slug: string;
    name: string;
    logo: string | null;
    city: string;
    state: string | null;
    country: string;
    address: string;
    isVerified: boolean;
    averageRating: number;
    reviewCount: number;
    hasCoords: boolean;
  };
}) {
  const initials = dispensary.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      to={`/dispensarios/${dispensary.slug}`}
      className="card group flex items-center gap-4 px-5 py-4 hover:border-line-strong transition-all"
    >
      <div
        className="h-12 w-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold"
        style={{
          background: dispensary.logo ? "var(--bg-elev)" : "var(--accent-soft)",
          color: "var(--accent)",
        }}
      >
        {dispensary.logo ? (
          <img src={dispensary.logo} alt={dispensary.name} className="h-full w-full object-contain p-1" />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium group-hover:text-accent transition-colors truncate">
            {dispensary.name}
          </span>
          {dispensary.isVerified && (
            <span className="pill accent text-xs shrink-0">✓ Verificado</span>
          )}
        </div>
        <div className="text-xs text-fg-dim mt-0.5 truncate">
          {dispensary.address} · {dispensary.city}
          {dispensary.state ? `, ${dispensary.state}` : ""}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 text-sm text-fg-muted">
        {dispensary.averageRating > 0 && (
          <span>⭐ {dispensary.averageRating.toFixed(1)}</span>
        )}
        {dispensary.reviewCount > 0 && (
          <span className="hidden sm:block text-xs">{dispensary.reviewCount} reseñas</span>
        )}
        {dispensary.hasCoords && (
          <span className="hidden sm:block text-xs">📍 GPS</span>
        )}
      </div>
    </Link>
  );
}
