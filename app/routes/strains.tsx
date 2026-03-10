import { useSearchParams } from "react-router";
import type { Route } from "./+types/strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { STRAIN_TYPES, EFFECTS } from "~/constants/cannabis";
import { StrainCard } from "~/components/composite/strain-card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const PER_PAGE = 20;

export function meta() {
  return [
    { title: "Cepas — WeedHub" },
    { name: "description", content: "Explora nuestra colección de cepas de cannabis" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "";
  const effectsParam = url.searchParams.get("effects") || "";
  const sort = url.searchParams.get("sort") || "name";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));

  const filter: any = { isArchived: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (type && ["sativa", "indica", "hybrid"].includes(type)) {
    filter.type = type;
  }
  if (effectsParam) {
    const effects = effectsParam.split(",");
    filter.effects = { $all: effects };
  }

  const sortMap: Record<string, any> = {
    name: { name: 1 },
    rating: { "averageRatings.overall": -1 },
    reviews: { reviewCount: -1 },
    newest: { createdAt: -1 },
  };
  const sortQuery = sortMap[sort] || sortMap.name;

  const [strains, total] = await Promise.all([
    StrainModel.find(filter)
      .sort(sortQuery)
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE)
      .lean(),
    StrainModel.countDocuments(filter),
  ]);

  return {
    strains: strains.map((s) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / PER_PAGE),
    filters: { search, type, effects: effectsParam, sort },
  };
}

export default function StrainsPage({ loaderData }: Route.ComponentProps) {
  const { strains, total, page, totalPages, filters } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Explorar Cepas
        </h1>
        <p className="text-text-muted">
          {total} {total === 1 ? "cepa" : "cepas"} disponibles
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60">
            search
          </span>
          <Input
            placeholder="Buscar cepas..."
            defaultValue={filters.search}
            className="pl-12"
            onChange={(e) => {
              const timer = setTimeout(() => updateFilter("search", e.target.value), 300);
              return () => clearTimeout(timer);
            }}
            autoFocus={searchParams.get("focus") === "search"}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Type toggles */}
          <div className="flex gap-2">
            <button
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                !filters.type ? "bg-primary text-background-dark" : "bg-white/5 text-white hover:bg-white/10"
              )}
              onClick={() => updateFilter("type", "")}
            >
              Todas
            </button>
            {STRAIN_TYPES.map((t) => (
              <button
                key={t.value}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  filters.type === t.value
                    ? "bg-primary text-background-dark"
                    : "bg-white/5 text-white hover:bg-white/10"
                )}
                onClick={() => updateFilter("type", t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            className="h-12 rounded-xl border border-forest-accent bg-forest-muted px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
          >
            <option value="name">Nombre A-Z</option>
            <option value="rating">Mejor valorada</option>
            <option value="reviews">Más reseñas</option>
            <option value="newest">Más reciente</option>
          </select>
        </div>

        {/* Effects chips */}
        <div className="flex flex-wrap gap-2">
          {EFFECTS.slice(0, 10).map((effect) => {
            const currentEffects = filters.effects ? filters.effects.split(",") : [];
            const isActive = currentEffects.includes(effect);
            return (
              <button
                key={effect}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_12px_rgba(106,244,37,0.15)]"
                    : "bg-white/5 text-text-muted hover:bg-white/10 hover:scale-105"
                )}
                onClick={() => {
                  const next = isActive
                    ? currentEffects.filter((e) => e !== effect)
                    : [...currentEffects, effect];
                  updateFilter("effects", next.filter(Boolean).join(","));
                }}
              >
                {effect}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {strains.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-text-muted/40 mb-4 block">
            search_off
          </span>
          <h3 className="font-display text-xl font-bold text-white mb-2">
            No se encontraron cepas
          </h3>
          <p className="text-text-muted">Intenta ajustar tus filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {strains.map((strain: any) => (
              <StrainCard key={strain._id} strain={strain} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateFilter("page", String(page - 1))}
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                Anterior
              </Button>
              <span className="text-sm text-text-muted">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateFilter("page", String(page + 1))}
              >
                Siguiente
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
