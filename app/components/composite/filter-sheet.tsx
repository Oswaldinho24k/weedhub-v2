import { useState } from "react";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { STRAIN_TYPES } from "~/constants/cannabis";
import { CONDITIONS } from "~/constants/conditions";
import { useT } from "~/lib/i18n-context";

interface FilterSheetProps {
  filters: {
    type: string;
    effects: string;
    terpene: string;
    difficulty: string;
    condition: string;
    autoflowering: string;
    feminized: string;
    climate: string;
    sort: string;
  };
  effectFilters: { key: string; label: string }[];
  terpeneFilters: string[];
  updateFilter: (key: string, value: string) => void;
  total: number;
}

export function FilterSheet({
  filters,
  effectFilters,
  terpeneFilters,
  updateFilter,
  total,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const t = useT();

  const currentEffects = filters.effects ? filters.effects.split(",") : [];

  const activeCount = [
    filters.type,
    filters.effects,
    filters.terpene,
    filters.difficulty,
    filters.condition,
    filters.autoflowering,
    filters.feminized,
    filters.climate,
  ].filter(Boolean).length;

  const chips = (
    <FilterChips
      filters={filters}
      effectFilters={effectFilters}
      terpeneFilters={terpeneFilters}
      currentEffects={currentEffects}
      updateFilter={updateFilter}
      t={t}
    />
  );

  return (
    <>
      {/* Mobile trigger — hidden on md+ */}
      <div className="md:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="chip flex items-center gap-2"
        >
          <Icon name="settings" size={13} />
          Filtros
          {activeCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            className="text-xs text-fg-muted hover:text-fg"
            onClick={() => {
              ["type", "effects", "terpene", "difficulty", "condition", "autoflowering", "feminized", "climate"].forEach(
                (k) => updateFilter(k, "")
              );
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Desktop inline chips — hidden on <md */}
      <div className="hidden md:contents">{chips}</div>

      {/* Mobile bottom sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-line rounded-t-2xl max-h-[80dvh] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="font-medium text-sm">Filtros</span>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button
                    type="button"
                    className="text-xs text-fg-muted hover:text-fg"
                    onClick={() => {
                      ["type", "effects", "terpene", "difficulty", "condition", "autoflowering", "feminized", "climate"].forEach(
                        (k) => updateFilter(k, "")
                      );
                    }}
                  >
                    Limpiar todo
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)}>
                  <Icon name="x" size={16} className="text-fg-muted" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Type */}
              <FilterSection label="Tipo">
                <div className="flex flex-wrap gap-2">
                  <MobileChip active={!filters.type} onClick={() => updateFilter("type", "")}>
                    {t.strainTypes.all}
                  </MobileChip>
                  {STRAIN_TYPES.map((type) => {
                    const label =
                      type.value === "sativa"
                        ? t.strainTypes.sativa
                        : type.value === "indica"
                          ? t.strainTypes.indica
                          : t.strainTypes.hybrid;
                    return (
                      <MobileChip
                        key={type.value}
                        active={filters.type === type.value}
                        onClick={() => updateFilter("type", type.value)}
                      >
                        {label}
                      </MobileChip>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Difficulty */}
              <FilterSection label="Dificultad de cultivo">
                <div className="flex flex-wrap gap-2">
                  {(["Baja", "Moderada", "Alta"] as const).map((d) => (
                    <MobileChip
                      key={d}
                      active={filters.difficulty === d}
                      onClick={() => updateFilter("difficulty", filters.difficulty === d ? "" : d)}
                    >
                      {d}
                    </MobileChip>
                  ))}
                </div>
              </FilterSection>

              {/* Effects */}
              {effectFilters.length > 0 && (
                <FilterSection label="Efectos">
                  <div className="flex flex-wrap gap-2">
                    {effectFilters.map((effect) => {
                      const isActive = currentEffects.includes(effect.key);
                      return (
                        <MobileChip
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
                        </MobileChip>
                      );
                    })}
                  </div>
                </FilterSection>
              )}

              {/* Terpenes */}
              {terpeneFilters.length > 0 && (
                <FilterSection label="Terpenos">
                  <div className="flex flex-wrap gap-2">
                    {terpeneFilters.map((name) => (
                      <MobileChip
                        key={name}
                        active={filters.terpene === name}
                        onClick={() => updateFilter("terpene", filters.terpene === name ? "" : name)}
                      >
                        {name}
                      </MobileChip>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Climate */}
              <FilterSection label="Clima">
                <div className="flex flex-wrap gap-2">
                  {(["tropical", "mediterráneo", "continental", "frío"] as const).map((c) => (
                    <MobileChip
                      key={c}
                      active={filters.climate === c}
                      onClick={() => updateFilter("climate", filters.climate === c ? "" : c)}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </MobileChip>
                  ))}
                </div>
              </FilterSection>

              {/* Seed type */}
              <FilterSection label="Tipo de semilla">
                <div className="flex flex-wrap gap-2">
                  <MobileChip
                    active={filters.autoflowering === "1"}
                    onClick={() => updateFilter("autoflowering", filters.autoflowering === "1" ? "" : "1")}
                  >
                    Autofloreciente
                  </MobileChip>
                  <MobileChip
                    active={filters.feminized === "1"}
                    onClick={() => updateFilter("feminized", filters.feminized === "1" ? "" : "1")}
                  >
                    Feminizada
                  </MobileChip>
                </div>
              </FilterSection>

              {/* Condition */}
              <FilterSection label="Condición médica">
                <select
                  value={filters.condition}
                  onChange={(e) => updateFilter("condition", e.target.value)}
                  className="mono text-xs bg-raised border border-line rounded-md px-3 py-2 w-full focus:outline-none focus:border-accent"
                >
                  <option value="">Todas las condiciones</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.emoji} {c.labelEs}
                    </option>
                  ))}
                </select>
              </FilterSection>
            </div>

            <div className="px-5 pb-5">
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Ver {total} {total === 1 ? "cepa" : "cepas"}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="kicker text-xs mb-2">{label}</div>
      {children}
    </div>
  );
}

function MobileChip({
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

// Desktop inline chips — rendered inside the sticky filter bar
function FilterChips({
  filters,
  effectFilters,
  terpeneFilters,
  currentEffects,
  updateFilter,
  t,
}: {
  filters: FilterSheetProps["filters"];
  effectFilters: FilterSheetProps["effectFilters"];
  terpeneFilters: FilterSheetProps["terpeneFilters"];
  currentEffects: string[];
  updateFilter: FilterSheetProps["updateFilter"];
  t: any;
}) {
  return (
    <>
      <div className="flex gap-2">
        <DesktopChip active={!filters.type} onClick={() => updateFilter("type", "")}>
          {t.strainTypes.all}
        </DesktopChip>
        {STRAIN_TYPES.map((type) => {
          const label =
            type.value === "sativa"
              ? t.strainTypes.sativa
              : type.value === "indica"
                ? t.strainTypes.indica
                : t.strainTypes.hybrid;
          return (
            <DesktopChip
              key={type.value}
              active={filters.type === type.value}
              onClick={() => updateFilter("type", type.value)}
            >
              {label}
            </DesktopChip>
          );
        })}
      </div>

      <div className="w-px h-5 bg-line" />

      <div className="flex gap-2">
        {(["Baja", "Moderada", "Alta"] as const).map((d) => (
          <DesktopChip
            key={d}
            active={filters.difficulty === d}
            onClick={() => updateFilter("difficulty", filters.difficulty === d ? "" : d)}
          >
            {d}
          </DesktopChip>
        ))}
      </div>

      <div className="w-px h-5 bg-line" />

      <div className="flex gap-2 flex-wrap">
        {effectFilters.map((effect) => {
          const isActive = currentEffects.includes(effect.key);
          return (
            <DesktopChip
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
            </DesktopChip>
          );
        })}
      </div>

      {terpeneFilters.length > 0 && (
        <>
          <div className="w-px h-5 bg-line" />
          <div className="flex gap-2 flex-wrap">
            {terpeneFilters.map((name) => (
              <DesktopChip
                key={name}
                active={filters.terpene === name}
                onClick={() => updateFilter("terpene", filters.terpene === name ? "" : name)}
              >
                {name}
              </DesktopChip>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function DesktopChip({
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
