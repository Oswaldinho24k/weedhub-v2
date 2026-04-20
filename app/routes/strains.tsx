import { useSearchParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { STRAIN_TYPES, EFFECTS } from "~/constants/cannabis";
import { StrainCard } from "~/components/composite/strain-card";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";

const PER_PAGE = 20;
const STRAINS_URL = `${SITE_URL}/strains`;

export function meta() {
  return buildMeta({
    title: "Directorio de cepas — WeedHub",
    description:
      "Explora cientos de cepas con filtros por tipo, efectos y terpeno dominante. Cada perfil se construye con reseñas contextuales de la comunidad.",
    url: STRAINS_URL,
  });
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
  const view = (searchParams.get("view") as "grid" | "list") || "grid";
  const [searchValue, setSearchValue] = useState(filters.search);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => updateFilter("search", value), 300);
  }

  const currentEffects = filters.effects ? filters.effects.split(",") : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cepas de Cannabis",
    url: STRAINS_URL,
    numberOfItems: total,
    itemListElement: strains.map((s: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/strains/${s.slug}`,
      name: s.name,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero strip */}
      <section className="mx-auto max-w-[1200px] px-6 pt-14 pb-10">
        <div className="kicker mb-4">Directorio · v0.1</div>
        <h1
          className="display max-w-[18ch]"
          style={{ fontSize: "clamp(40px, 6.2vw, 84px)", lineHeight: 1.02 }}
        >
          {total.toLocaleString("es-MX")} cepas.{" "}
          <span className="display-wonk tnum" style={{ color: "var(--accent)" }}>
            {(total * 145).toLocaleString("es-MX")}
          </span>{" "}
          experiencias. Una sola fuente de verdad.
        </h1>
        <div className="mt-8 flex items-center gap-3 max-w-[720px]">
          <div className="flex-1 flex items-center gap-3 bg-raised border border-line rounded-md px-4 h-12 focus-within:border-accent transition-colors">
            <Icon name="search" size={16} className="text-fg-dim" />
            <input
              className="flex-1 bg-transparent text-sm placeholder:text-fg-dim outline-none"
              placeholder="Buscar por nombre, aroma, efecto…"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus={searchParams.get("focus") === "search"}
            />
            <kbd className="mono text-[10px] border border-line rounded px-1.5 py-0.5 text-fg-dim">
              ⌘K
            </kbd>
          </div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-16 z-30 bg-[color-mix(in_oklch,var(--bg)_90%,transparent)] backdrop-blur border-y border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            <FilterChip active={!filters.type} onClick={() => updateFilter("type", "")}>
              Todos
            </FilterChip>
            {STRAIN_TYPES.map((t) => (
              <FilterChip
                key={t.value}
                active={filters.type === t.value}
                onClick={() => updateFilter("type", t.value)}
              >
                {t.label}
              </FilterChip>
            ))}
          </div>

          <div className="hidden md:block w-px h-5 bg-line" />

          <div className="flex gap-2 flex-wrap">
            {EFFECTS.slice(0, 6).map((effect) => {
              const isActive = currentEffects.includes(effect);
              return (
                <FilterChip
                  key={effect}
                  active={isActive}
                  tone="accent"
                  onClick={() => {
                    const next = isActive
                      ? currentEffects.filter((e) => e !== effect)
                      : [...currentEffects, effect];
                    updateFilter("effects", next.filter(Boolean).join(","));
                  }}
                >
                  {effect}
                </FilterChip>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="mono text-xs text-fg-dim tnum">
              {total} {total === 1 ? "resultado" : "resultados"}
            </span>

            <div className="flex border border-line rounded-md overflow-hidden">
              <ViewToggle active={view === "grid"} onClick={() => updateFilter("view", "")}>
                <Icon name="grid" size={14} />
              </ViewToggle>
              <ViewToggle
                active={view === "list"}
                onClick={() => updateFilter("view", "list")}
              >
                <Icon name="list" size={14} />
              </ViewToggle>
            </div>

            <select
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="mono text-xs bg-raised border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-accent"
            >
              <option value="name">Nombre A–Z</option>
              <option value="rating">Mejor valorada</option>
              <option value="reviews">Más reseñas</option>
              <option value="newest">Más reciente</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-10">
        {strains.length === 0 ? (
          <div className="text-center py-20">
            <div className="kicker mb-3">Sin coincidencias</div>
            <h2 className="display text-3xl mb-3">
              Ninguna cepa cumple esos filtros.
            </h2>
            <p className="text-fg-muted mb-6">
              Prueba ajustando el tipo, limpiando efectos o con otro término.
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Limpiar filtros
            </button>
          </div>
        ) : view === "list" ? (
          <div>
            {strains.map((strain: any) => (
              <StrainCard key={strain._id} strain={strain} variant="row" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strains.map((strain: any) => (
              <StrainCard key={strain._id} strain={strain} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-14">
            <button
              className="btn btn-ghost"
              disabled={page <= 1}
              onClick={() => updateFilter("page", String(page - 1))}
            >
              <Icon name="chevronLeft" size={14} />
              Anterior
            </button>
            <span className="mono text-xs text-fg-muted tnum">
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={() => updateFilter("page", String(page + 1))}
            >
              Siguiente
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  tone = "neutral",
  onClick,
  children,
}: {
  active?: boolean;
  tone?: "neutral" | "accent";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const onClass = tone === "accent" ? "on-accent" : "on";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("chip", active && onClass)}
      aria-pressed={!!active}
    >
      {children}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 w-9 grid place-items-center transition-colors",
        active ? "bg-elev text-fg" : "text-fg-muted hover:bg-elev/60"
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
