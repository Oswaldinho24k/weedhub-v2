import { Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/productos";
import { connectDB } from "~/lib/db.server";
import { ProductModel } from "~/models/product.server";
import { ProductCategoryModel } from "~/models/product-category.server";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { ProductCard } from "~/components/composite/product-card";

type SortKey = "rating" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rating", label: "Mejor calificados" },
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

const SORT_MAP: Record<SortKey, Record<string, unknown>> = {
  rating: { averageRating: -1 },
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const cat = url.searchParams.get("cat") || "";
  const brand = url.searchParams.get("brand") || "";
  const sort = (url.searchParams.get("sort") || "rating") as SortKey;
  const promoted = url.searchParams.get("promoted") === "1";

  const filter: Record<string, unknown> = { status: "active" };
  if (cat) filter.categoryKey = cat;
  if (brand) filter["brand.slug"] = brand;
  if (promoted) filter.isPromoted = true;

  const [products, categories] = await Promise.all([
    ProductModel.find(filter)
      .sort({ isPromoted: -1, ...(SORT_MAP[sort] || SORT_MAP.rating) })
      .limit(60)
      .populate("brandId", "name slug")
      .lean(),
    ProductCategoryModel.find({ isActive: true })
      .sort({ sector: 1, sortOrder: 1 })
      .lean()
      .select("key labelEs sector"),
  ]);

  return {
    products: products.map((p) => {
      const brandDoc = p.brandId as any;
      return {
        slug: p.slug,
        name: p.name,
        coverImage: p.coverImage || null,
        categoryKey: p.categoryKey,
        brandName: brandDoc?.name || "Marca desconocida",
        brandSlug: brandDoc?.slug || "",
        price: p.price || null,
        priceCurrency: p.priceCurrency,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        isPromoted: p.isPromoted,
      };
    }),
    categories: categories.map((c) => ({
      key: c.key,
      label: c.labelEs,
      sector: c.sector,
    })),
    activeFilters: { cat, brand, sort, promoted },
  };
}

export function meta(): ReturnType<Route.MetaFunction> {
  return buildMeta({
    title: "Catálogo de Productos Cannabis — WeedHub",
    description:
      "Flores, concentrados, comestibles, semillas y equipo de cultivo. Productos de cannabis verificados.",
    url: `${SITE_URL}/productos`,
    canonicalPath: "/productos",
    locale: "es",
  });
}

export default function ProductosPage() {
  const { products, categories, activeFilters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  const consumo = categories.filter((c) => c.sector === "consumo");
  const cultivo = categories.filter((c) => c.sector === "cultivo");
  const allCategories = [...consumo, ...cultivo];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-10">
        <div className="kicker mb-2">Catálogo</div>
        <h1 className="display text-4xl mb-3">Productos Cannabis</h1>
        <p className="text-fg-muted max-w-xl">
          Flores, concentrados, comestibles y equipo de cultivo — verificados por marca, calificados por la comunidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-7">
          {/* Destacados */}
          <div>
            <button
              type="button"
              onClick={() => setParam("promoted", activeFilters.promoted ? null : "1")}
              className="flex items-center gap-2 text-sm w-full text-left py-1.5"
            >
              <span
                className="h-4 w-4 rounded border flex items-center justify-center shrink-0"
                style={{
                  background: activeFilters.promoted ? "var(--warm)" : "transparent",
                  borderColor: activeFilters.promoted ? "var(--warm)" : "var(--line-strong)",
                }}
              >
                {activeFilters.promoted && <span className="text-[10px] text-white font-bold">✓</span>}
              </span>
              Solo destacados
            </button>
          </div>

          {/* Categorías */}
          {allCategories.length > 0 && (
            <div>
              <div className="kicker mb-3">Categoría</div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setParam("cat", null)}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    !activeFilters.cat ? "text-fg font-medium" : "text-fg-muted hover:text-fg hover:bg-elev"
                  }`}
                >
                  Todas
                </button>
                {consumo.length > 0 && (
                  <div className="pt-2">
                    <div className="px-3 text-xs text-fg-dim mb-1">Consumo</div>
                    {consumo.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setParam("cat", c.key)}
                        className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                          activeFilters.cat === c.key
                            ? "text-fg font-medium"
                            : "text-fg-muted hover:text-fg hover:bg-elev"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                {cultivo.length > 0 && (
                  <div className="pt-2">
                    <div className="px-3 text-xs text-fg-dim mb-1">Cultivo</div>
                    {cultivo.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setParam("cat", c.key)}
                        className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                          activeFilters.cat === c.key
                            ? "text-fg font-medium"
                            : "text-fg-muted hover:text-fg hover:bg-elev"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <div className="kicker mb-3">Ordenar</div>
            <div className="space-y-0.5">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setParam("sort", o.value)}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeFilters.sort === o.value
                      ? "text-fg font-medium"
                      : "text-fg-muted hover:text-fg hover:bg-elev"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <Link to="/marcas" className="block text-sm text-fg-muted hover:text-fg transition-colors">
            → Ver marcas
          </Link>
        </aside>

        {/* Grid */}
        <div>
          {products.length === 0 ? (
            <div className="py-24 text-center text-fg-dim">
              <p className="text-lg mb-2">No hay productos disponibles aún</p>
              <p className="text-sm mb-8">
                Las marcas registradas irán agregando su catálogo.
              </p>
              <Link to="/marcas" className="btn btn-primary inline-block">
                Ver marcas
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-fg-dim">{products.length} productos</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.slug} {...p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
