import { Link, useSearchParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { EffectModel } from "~/models/effect.server";
import { resolveLocale } from "~/lib/locale.server";
import { getDictionary } from "~/content/locales";
import { STRAIN_TYPES } from "~/constants/cannabis";
import { CONDITIONS } from "~/constants/conditions";
import { StrainCard } from "~/components/composite/strain-card";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";
import { useT } from "~/lib/i18n-context";
import { buildMeta, SITE_URL } from "~/lib/seo";

const PER_PAGE = 20;

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const prefix = locale !== "es" ? `/${locale}` : "";
  return buildMeta({
    title: dict.meta.strainsTitle,
    description: dict.meta.strainsDescription,
    url: `${SITE_URL}${prefix}/strains`,
    canonicalPath: "/strains",
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "";
  const effectsParam = url.searchParams.get("effects") || "";
  const difficulty = url.searchParams.get("difficulty") || "";
  const condition = url.searchParams.get("condition") || "";
  const autoflowering = url.searchParams.get("autoflowering") || "";
  const feminized = url.searchParams.get("feminized") || "";
  const climate = url.searchParams.get("climate") || "";
  const sort = url.searchParams.get("sort") || "name";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));

  const filter: any = { isArchived: false };

  if (search) filter.$text = { $search: search };
  if (type && ["sativa", "indica", "hybrid"].includes(type)) filter.type = type;
  if (effectsParam) filter.effects = { $all: effectsParam.split(",") };
  if (difficulty && ["Baja", "Moderada", "Alta"].includes(difficulty)) filter.difficulty = difficulty;
  if (condition) filter.helpsWithConditions = condition;
  if (autoflowering === "1") filter["grow.isAutoflowering"] = true;
  if (feminized === "1") filter["grow.isFeminized"] = true;
  if (climate && ["tropical", "mediterráneo", "continental", "frío"].includes(climate))
    filter["grow.climate"] = climate;

  const sortMap: Record<string, any> = {
    name: { name: 1 },
    rating: { "averageRatings.overall": -1 },
    reviews: { reviewCount: -1 },
    newest: { createdAt: -1 },
    trending: { lastReviewedAt: -1 },
  };
  const sortQuery = search
    ? { score: { $meta: "textScore" }, ...sortMap[sort] }
    : sortMap[sort] || sortMap.name;

  const locale = await resolveLocale(request);
  const labelKey = locale === "pt" ? "labelPt" : locale === "en" ? "labelEn" : "labelEs";

  const [strains, total, topEffects] = await Promise.all([
    StrainModel.find(filter)
      .sort(sortQuery)
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE)
      .lean(),
    StrainModel.countDocuments(filter),
    EffectModel.find({ status: "approved", category: "positive" })
      .sort({ usageCount: -1 })
      .limit(8)
      .lean(),
  ]);

  return {
    locale,
    strains: strains.map((s) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / PER_PAGE),
    filters: { search, type, effects: effectsParam, difficulty, condition, autoflowering, feminized, climate, sort },
    effectFilters: topEffects.map((e) => ({ key: e.key, label: (e as any)[labelKey] || e.labelEn })),
  };
}

export default function StrainsPage({ loaderData }: Route.ComponentProps) {
  const { strains, total, page, totalPages, filters, effectFilters } = loaderData;
  const [showGrowFilters, setShowGrowFilters] = useState(
    !!(filters.autoflowering || filters.feminized || filters.climate || filters.condition)
  );
  const t = useT();
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
    url: `${SITE_URL}/strains`,
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
        <div className="kicker mb-4">{t.directory.heroKicker}</div>
        <h1
          className="display max-w-[18ch]"
          style={{ fontSize: "clamp(40px, 6.2vw, 84px)", lineHeight: 1.02 }}
        >
          {total.toLocaleString()} {t.directory.heroHeadlineA}.{" "}
          <span className="display-wonk tnum" style={{ color: "var(--accent)" }}>
            {(total * 145).toLocaleString()}
          </span>{" "}
          {t.directory.heroHeadlineB}
        </h1>
        <div className="mt-8 flex items-center gap-3 max-w-[720px]">
          <div className="flex-1 flex items-center gap-3 bg-raised border border-line rounded-md px-4 h-12 focus-within:border-accent transition-colors">
            <Icon name="search" size={16} className="text-fg-dim" />
            <input
              className="flex-1 bg-transparent text-sm placeholder:text-fg-dim outline-none"
              placeholder={t.directory.searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus={searchParams.get("focus") === "search"}
            />
          </div>
        </div>
        <Link
          to="/strains/sugerir"
          className="inline-flex items-center gap-2 mt-4 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <Icon name="plus" size={14} />
          {t.suggest.ctaNotFound}
          <Icon name="arrowRight" size={12} />
        </Link>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-16 z-30 bg-[color-mix(in_oklch,var(--bg)_90%,transparent)] backdrop-blur border-y border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            <FilterChip active={!filters.type} onClick={() => updateFilter("type", "")}>
              {t.strainTypes.all}
            </FilterChip>
            {STRAIN_TYPES.map((type) => {
              const label =
                type.value === "sativa"
                  ? t.strainTypes.sativa
                  : type.value === "indica"
                    ? t.strainTypes.indica
                    : t.strainTypes.hybrid;
              return (
                <FilterChip
                  key={type.value}
                  active={filters.type === type.value}
                  onClick={() => updateFilter("type", type.value)}
                >
                  {label}
                </FilterChip>
              );
            })}
          </div>

          <div className="hidden md:block w-px h-5 bg-line" />

          <div className="flex gap-2">
            {(["Baja", "Moderada", "Alta"] as const).map((d) => (
              <FilterChip
                key={d}
                active={filters.difficulty === d}
                onClick={() => updateFilter("difficulty", filters.difficulty === d ? "" : d)}
              >
                {d}
              </FilterChip>
            ))}
          </div>

          <div className="hidden md:block w-px h-5 bg-line" />

          <div className="flex gap-2 flex-wrap">
            {effectFilters.map((effect) => {
              const isActive = currentEffects.includes(effect.key);
              return (
                <FilterChip
                  key={effect.key}
                  active={isActive}
                  tone="accent"
                  onClick={() => {
                    const next = isActive
                      ? currentEffects.filter((e) => e !== effect.key)
                      : [...currentEffects, effect.key];
                    updateFilter("effects", next.filter(Boolean).join(","));
                  }}
                >
                  {effect.label}
                </FilterChip>
              );
            })}
          </div>

          {/* Grow filters toggle */}
          <button
            type="button"
            onClick={() => setShowGrowFilters((v) => !v)}
            className={cn("chip ml-auto", showGrowFilters && "on")}
          >
            <Icon name="sprout" size={12} />
            Cultivo
          </button>

          <div className="flex items-center gap-4">
            <span className="mono text-xs text-fg-dim tnum">
              {total} {total === 1 ? t.directory.resultsSingular : t.directory.resultsPlural}
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
              <option value="name">{t.directory.sortName}</option>
              <option value="rating">{t.directory.sortRating}</option>
              <option value="reviews">{t.directory.sortReviews}</option>
              <option value="newest">{t.directory.sortNewest}</option>
              <option value="trending">{t.directory.sortTrending}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grow filters — secondary bar */}
      {showGrowFilters && (
        <section className="border-b border-line bg-sunken">
          <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <span className="kicker text-xs">Clima</span>
              {(["tropical", "mediterráneo", "continental", "frío"] as const).map((c) => (
                <FilterChip
                  key={c}
                  active={filters.climate === c}
                  onClick={() => updateFilter("climate", filters.climate === c ? "" : c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </FilterChip>
              ))}
            </div>
            <div className="w-px h-5 bg-line" />
            <div className="flex items-center gap-2">
              <FilterChip
                active={filters.autoflowering === "1"}
                onClick={() => updateFilter("autoflowering", filters.autoflowering === "1" ? "" : "1")}
              >
                Autofloreciente
              </FilterChip>
              <FilterChip
                active={filters.feminized === "1"}
                onClick={() => updateFilter("feminized", filters.feminized === "1" ? "" : "1")}
              >
                Feminizada
              </FilterChip>
            </div>
            <div className="w-px h-5 bg-line" />
            <div className="flex items-center gap-2">
              <span className="kicker text-xs">Condición</span>
              <select
                value={filters.condition}
                onChange={(e) => updateFilter("condition", e.target.value)}
                className="mono text-xs bg-raised border border-line rounded-md px-2 py-1.5 focus:outline-none focus:border-accent"
              >
                <option value="">Todas</option>
                {CONDITIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.emoji} {c.labelEs}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1200px] px-6 py-10">
        {strains.length === 0 ? (
          <div className="text-center py-20">
            <div className="kicker mb-3">{t.directory.emptyKicker}</div>
            <h2 className="display text-3xl mb-3">{t.directory.emptyTitle}</h2>
            <p className="text-fg-muted mb-6">{t.directory.emptyBody}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                className="btn btn-ghost"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                {t.directory.clearFilters}
              </button>
              <Link to="/strains/sugerir" className="btn btn-primary inline-flex">
                <Icon name="plus" size={14} />
                {t.suggest.ctaEmptyState}
              </Link>
            </div>
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
              {t.directory.previous}
            </button>
            <span className="mono text-xs text-fg-muted tnum">
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={() => updateFilter("page", String(page + 1))}
            >
              {t.directory.next}
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
