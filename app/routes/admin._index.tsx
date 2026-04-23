import type { Route } from "./+types/admin._index";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { UserModel } from "~/models/user.server";
import {
  countryLabel,
  countryFlag,
  ACQUISITION_SOURCES,
} from "~/constants/locations";

const SOURCE_LABELS = Object.fromEntries(
  ACQUISITION_SOURCES.map((s) => [s.value, s.label])
);

export async function loader() {
  await connectDB();
  const [
    strainCount,
    reviewCount,
    userCount,
    flaggedCount,
    countryAgg,
    sourceAgg,
  ] = await Promise.all([
    StrainModel.countDocuments(),
    ReviewModel.countDocuments(),
    UserModel.countDocuments(),
    ReviewModel.countDocuments({ status: "flagged" }),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { country: { $exists: true, $ne: null } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { acquisitionSource: { $exists: true, $ne: null } } },
      { $group: { _id: "$acquisitionSource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    strainCount,
    reviewCount,
    userCount,
    flaggedCount,
    countryAgg: countryAgg.map((c) => ({
      code: c._id,
      label: countryLabel(c._id),
      flag: countryFlag(c._id),
      count: c.count,
    })),
    sourceAgg: sourceAgg.map((s) => ({
      value: s._id,
      label: SOURCE_LABELS[s._id] || s._id,
      count: s.count,
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
