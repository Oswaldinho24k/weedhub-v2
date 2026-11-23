import type { Route } from "./+types/admin._index";
import { requireAdmin } from "~/lib/auth.server";
import { dashboardStats } from "~/services/users.server";
import {
  countryLabel,
  countryFlag,
  ACQUISITION_SOURCES,
} from "~/constants/locations";

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  ACQUISITION_SOURCES.map((s) => [s.value, s.label])
);

// HTTP adapter only: numbers come from services/users.server.ts (same as the dashboard_stats action).
export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const s = await dashboardStats();
  return {
    strainCount: s.strainCount,
    reviewCount: s.reviewCount,
    userCount: s.userCount,
    flaggedCount: s.flaggedCount,
    countryAgg: s.topCountries.map((c) => ({
      code: c.code,
      label: countryLabel(c.code),
      flag: countryFlag(c.code),
      count: c.count,
    })),
    sourceAgg: s.topSources.map((src) => ({
      value: src.value,
      label: SOURCE_LABELS[src.value] || src.value,
      count: src.count,
    })),
  };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { strainCount, reviewCount, userCount, flaggedCount, countryAgg, sourceAgg } =
    loaderData;
  const stats = [
    { kicker: "Cepas", value: strainCount, tone: "accent" as const },
    { kicker: "Reseñas", value: reviewCount, tone: "neutral" as const },
    { kicker: "Usuarios", value: userCount, tone: "neutral" as const },
    { kicker: "Flagged", value: flaggedCount, tone: "warm" as const },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.kicker} className="card p-5">
            <div className="kicker mb-2">{s.kicker}</div>
            <div
              className="display text-4xl tnum"
              style={{
                color:
                  s.tone === "accent"
                    ? "var(--accent)"
                    : s.tone === "warm"
                      ? "var(--warm)"
                      : "var(--fg)",
              }}
            >
              {s.value.toLocaleString("es-MX")}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="kicker mb-4">Top 5 · País</div>
          {countryAgg.length === 0 ? (
            <p className="text-sm text-fg-dim">Sin datos todavía.</p>
          ) : (
            <ul className="space-y-3">
              {countryAgg.map((c, i) => (
                <li
                  key={c.code}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="mono text-fg-dim tnum w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      {c.flag} {c.label}
                    </span>
                  </span>
                  <span className="mono tnum text-fg-muted">
                    {c.count.toLocaleString("es-MX")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="kicker mb-4">Top 5 · Fuente de adquisición</div>
          {sourceAgg.length === 0 ? (
            <p className="text-sm text-fg-dim">Sin datos todavía.</p>
          ) : (
            <ul className="space-y-3">
              {sourceAgg.map((s, i) => (
                <li
                  key={s.value}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="mono text-fg-dim tnum w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{s.label}</span>
                  </span>
                  <span className="mono tnum text-fg-muted">
                    {s.count.toLocaleString("es-MX")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
