import { Link, useSearchParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/strains";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { EffectModel } from "~/models/effect.server";
import { resolveLocale } from "~/lib/locale.server";
import { getDictionary } from "~/content/locales";
import { CONDITIONS } from "~/constants/conditions";
import { StrainCard } from "~/components/composite/strain-card";
import { FilterSheet } from "~/components/composite/filter-sheet";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";
import { Button, buttonVariants } from "~/components/ui/button";
import { useT, useHref } from "~/lib/i18n-context";
import { StrainSign } from "~/components/composite/strain-sign";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { storedValuesFor } from "~/lib/effect-labels";

const PER_PAGE = 24;

const DIR_COPY = {
  es: { sorts: { reviews: "Ordenadas por número de reseñas.", rating: "Ordenadas por calificación.", name: "Ordenadas de la A a la Z.", newest: "Las más recientes primero.", trending: "Las más comentadas últimamente.", momento: "Ordenadas por afinidad con ese momento del día." }, sub: "Filtra por momento del día, efecto o terpeno.", moment: "Momento del día", moments: { manana: "Mañana", tarde: "Tarde", noche: "Noche" }, sortLabel: "Ordenar" },
  pt: { sorts: { reviews: "Ordenadas por número de avaliações.", rating: "Ordenadas por nota.", name: "Ordenadas de A a Z.", newest: "As mais recentes primeiro.", trending: "As mais comentadas recentemente.", momento: "Ordenadas por afinidade com esse momento do dia." }, sub: "Filtre por momento do dia, efeito ou terpeno.", moment: "Momento do dia", moments: { manana: "Manhã", tarde: "Tarde", noche: "Noite" }, sortLabel: "Ordenar" },
  en: { sorts: { reviews: "Sorted by number of reviews.", rating: "Sorted by rating.", name: "Sorted A to Z.", newest: "Newest first.", trending: "Most discussed lately.", momento: "Sorted by fit for that time of day." }, sub: "Filter by time of day, effect or terpene.", moment: "Time of day", moments: { manana: "Morning", tarde: "Afternoon", noche: "Night" }, sortLabel: "Sort" },
} as const;

export function meta({ data }: Route.MetaArgs) {
  const locale = data?.locale || "es";
  const dict = getDictionary(locale);
  const prefix = locale !== "es" ? `/${locale}` : "";
  const filters = data?.filters;
  const total = data?.total ?? 0;

  let description = dict.meta.strainsDescription;
  if (filters) {
    const parts: string[] = [];
    if (filters.type) parts.push(filters.type.charAt(0).toUpperCase() + filters.type.slice(1));
    if (filters.terpene) parts.push(`terpeno ${filters.terpene}`);
    if (filters.search) parts.push(`"${filters.search}"`);
    if (parts.length > 0) {
      description = `${total.toLocaleString()} cepas ${parts.join(", ")} en WeedHub — enciclopedia cannabis LATAM.`;
    }
  }

  const page = data?.page ?? 1;
  const onlyPage = page > 1 && filters && !filters.search && !filters.type && !filters.effects && !filters.terpene && !filters.momento;
  const pageSuffix = page > 1 ? (locale === "pt" ? ` — página ${page}` : ` — página ${page}`) : "";
  return buildMeta({
    title: `${dict.meta.strainsTitle.replace(/ — WeedHub$/, "")}${pageSuffix} — WeedHub`,
    description: page > 1 ? `${description} Página ${page}.` : description,
    // Facets canonicalize to the base list; plain pagination self-canonicalizes.
    url: `${SITE_URL}${prefix}/strains${onlyPage ? `?page=${page}` : ""}`,
    canonicalPath: onlyPage ? undefined : "/strains",
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await connectDB();
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "";
  const effectsParam = url.searchParams.get("effects") || "";
  const terpene = url.searchParams.get("terpene") || "";
  const difficulty = url.searchParams.get("difficulty") || "";
  const condition = url.searchParams.get("condition") || "";
  const autoflowering = url.searchParams.get("autoflowering") || "";
  const feminized = url.searchParams.get("feminized") || "";
  const climate = url.searchParams.get("climate") || "";
  const momento = url.searchParams.get("momento") || "";
  const sort = url.searchParams.get("sort") || (momento ? `momento-${momento}` : "reviews");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));

  const filter: any = { isArchived: false };

  if (search) filter.$text = { $search: search };
  if (type && ["sativa", "indica", "hybrid"].includes(type)) filter.type = type;
  if (effectsParam) {
    filter.$and = effectsParam.split(",").filter(Boolean).map((e) => ({ effects: { $in: storedValuesFor(e) } }));
  }
  if (momento && ["manana", "tarde", "noche"].includes(momento)) filter[`momento.${momento}`] = { $gte: 50 };
  if (terpene) filter["terpenes.name"] = terpene;
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
    "momento-manana": { "momento.manana": -1, reviewCount: -1 },
    "momento-tarde": { "momento.tarde": -1, reviewCount: -1 },
    "momento-noche": { "momento.noche": -1, reviewCount: -1 },
  };
  const sortQuery = search
    ? { score: { $meta: "textScore" }, ...sortMap[sort] }
    : sortMap[sort] || sortMap.name;

  const locale = await resolveLocale(request);
  const labelKey = locale === "pt" ? "labelPt" : locale === "en" ? "labelEn" : "labelEs";

  const [strains, total, topEffects, topTerpenes] = await Promise.all([
    StrainModel.find(filter)
      .select("name slug type imageUrl colorHint dominantTerpene effects averageRatings reviewCount cannabinoidProfile momento")
      .sort(sortQuery)
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE)
      .lean(),
    StrainModel.countDocuments(filter),
    EffectModel.find({ status: "approved", category: "positive" })
      .sort({ usageCount: -1 })
      .limit(8)
      .lean(),
    StrainModel.aggregate([
      { $match: { isArchived: false } },
      { $unwind: "$terpenes" },
      { $group: { _id: "$terpenes.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
  ]);

  return {
    locale,
    strains: strains.map((s: any) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: s.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / PER_PAGE),
    filters: { search, type, momento, effects: effectsParam, terpene, difficulty, condition, autoflowering, feminized, climate, sort },
    effectFilters: topEffects.map((e) => ({ key: e.key, label: (e as any)[labelKey] || e.labelEn })),
    terpeneFilters: topTerpenes.map((t: any) => t._id as string),
  };
}

export default function StrainsPage({ loaderData }: Route.ComponentProps) {
  const { strains, total, page, totalPages, filters, effectFilters, terpeneFilters } = loaderData;
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

  const loc = (["es", "pt", "en"].includes(loaderData.locale) ? loaderData.locale : "es") as keyof typeof DIR_COPY;
  const href = useHref();
  function pageHref(p: number) {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    const q = next.toString();
    return q ? `?${q}` : ".";
  }

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

      {/* Wall header */}
      <section className="wall">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-10 grid gap-6 lg:grid-cols-[1fr_520px] lg:items-end">
          <div>
            <h1 className="display text-yellow" style={{ fontSize: "clamp(52px, 8vw, 104px)" }}>
              <span className="tnum">{total.toLocaleString()}</span> {t.directory.heroHeadlineA}
            </h1>
            <p className="mt-3 text-lg text-white/90 max-w-[46ch]">
              {DIR_COPY[loc].sorts[(filters.sort.startsWith("momento") ? "momento" : filters.sort) as keyof (typeof DIR_COPY)["es"]["sorts"]] ?? ""} {DIR_COPY[loc].sub}
            </p>
          </div>
          <div>
            <label htmlFor="dir-search" className="sr-only">{t.directory.searchPlaceholder}</label>
            <div className="flex items-center gap-3 bg-white text-ink border-[3px] border-ink px-4 h-14 focus-within:shadow-[0_0_0_4px_var(--fluor-yellow)]">
              <Icon name="search" size={20} />
              <input
                id="dir-search"
                type="search"
                className="flex-1 bg-transparent text-lg font-semibold placeholder:text-[#5f5e57] outline-none"
                placeholder={t.directory.searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus={searchParams.get("focus") === "search"}
              />
            </div>
            <Link
              to="/strains/sugerir"
              className="inline-flex items-center gap-2 mt-3 text-[15px] font-bold text-white hover:text-yellow underline decoration-2 underline-offset-4"
            >
              <Icon name="plus" size={14} />
              {t.suggest.ctaNotFound}
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-14 z-30 bg-bg border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5" role="group" aria-label={DIR_COPY[loc].moment}>
            {(["manana", "tarde", "noche"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={filters.momento === m}
                className={cn("chip", filters.momento === m && (m === "noche" ? "on-accent" : "on"))}
                onClick={() => updateFilter("momento", filters.momento === m ? "" : m)}
              >
                <Icon name={m === "manana" ? "sun" : m === "tarde" ? "cup" : "moon"} size={13} />
                {DIR_COPY[loc].moments[m]}
              </button>
            ))}
          </div>
          <FilterSheet
            filters={filters}
            effectFilters={effectFilters}
            terpeneFilters={terpeneFilters}
            updateFilter={updateFilter}
            total={total}
          />

          {/* Grow filters hidden: only 24 of 3,036 strains have grow data (params still work via URL). */}

          <div className="flex items-center gap-4">
            <span className="text-sm font-bold [font-stretch:85%] text-fg-muted tnum">
              {total} {total === 1 ? t.directory.resultsSingular : t.directory.resultsPlural}
            </span>

            <div className="flex border-2 border-ink overflow-hidden">
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
              aria-label={DIR_COPY[loc].sortLabel}
              className="text-sm font-bold bg-raised border-2 border-ink px-2 py-1.5 focus:outline-none focus:shadow-[0_0_0_3px_var(--fluor-yellow)]"
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


      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
        {strains.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="display text-3xl mb-3">{t.directory.emptyTitle}</h2>
            <p className="text-fg-muted mb-6">{t.directory.emptyBody}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                {t.directory.clearFilters}
              </Button>
              <Link to="/strains/sugerir" className={cn(buttonVariants({ variant: "primary" }), "inline-flex")}>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 pt-2">
            {strains.map((strain: any, i: number) => (
              <StrainSign
                key={strain._id}
                strain={strain}
                to={href(`/strains/${strain.slug}`)}
                locale={loc}
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Paginación" className="flex justify-center items-center gap-4 mt-14">
            {page > 1 ? (
              <Link to={pageHref(page - 1)} rel="prev" className={buttonVariants({ variant: "ghost" })}>
                <Icon name="chevronLeft" size={14} />
                {t.directory.previous}
              </Link>
            ) : (
              <span className={buttonVariants({ variant: "ghost" })} aria-disabled="true" data-disabled>
                <Icon name="chevronLeft" size={14} />
                {t.directory.previous}
              </span>
            )}
            <span className="text-base font-extrabold [font-stretch:85%] tnum">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link to={pageHref(page + 1)} rel="next" className={buttonVariants({ variant: "ghost" })}>
                {t.directory.next}
                <Icon name="chevronRight" size={14} />
              </Link>
            ) : (
              <span className={buttonVariants({ variant: "ghost" })} aria-disabled="true" data-disabled>
                {t.directory.next}
                <Icon name="chevronRight" size={14} />
              </span>
            )}
          </nav>
        )}
      </section>
    </div>
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
