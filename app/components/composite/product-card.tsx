import { Link } from "react-router";

type ProductCardProps = {
  slug: string;
  name: string;
  coverImage: string | null;
  categoryKey: string;
  brandName: string;
  brandSlug: string;
  price: number | null;
  priceCurrency: "MXN" | "USD";
  averageRating: number;
  reviewCount: number;
  isPromoted: boolean;
};

export function ProductCard({
  slug,
  name,
  coverImage,
  categoryKey,
  brandName,
  brandSlug,
  price,
  priceCurrency,
  averageRating,
  reviewCount,
  isPromoted,
}: ProductCardProps) {
  return (
    <div className="card group flex flex-col overflow-hidden hover:border-line-strong transition-all relative">
      {isPromoted && (
        <span
          className="absolute top-3 left-3 z-10 pill warm text-xs"
        >
          Destacado
        </span>
      )}

      <Link to={`/productos/${slug}`} className="block aspect-square overflow-hidden" style={{ background: "var(--bg-elev)" }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl opacity-25">
            📦
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="text-xs text-fg-dim">{categoryKey}</div>

        <Link
          to={`/productos/${slug}`}
          className="font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2"
        >
          {name}
        </Link>

        <Link
          to={`/marcas/${brandSlug}`}
          className="text-xs text-fg-muted hover:text-fg transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {brandName}
        </Link>

        <div className="flex items-center justify-between mt-auto pt-2">
          {price ? (
            <span className="text-sm font-semibold">
              {priceCurrency === "MXN" ? "$" : "USD "}
              {price.toLocaleString("es-MX")}
              {priceCurrency === "MXN" && <span className="text-xs font-normal text-fg-dim ml-0.5">MXN</span>}
            </span>
          ) : (
            <span className="text-xs text-fg-dim">Precio no disponible</span>
          )}

          {averageRating > 0 && (
            <span className="text-xs text-fg-muted">
              ⭐ {averageRating.toFixed(1)}
              {reviewCount > 0 && <span className="text-fg-dim"> ({reviewCount})</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
