import type { Route } from "./+types/admin._index";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { UserModel } from "~/models/user.server";

export async function loader() {
  await connectDB();
  const [strainCount, reviewCount, userCount, flaggedCount] = await Promise.all([
    StrainModel.countDocuments(),
    ReviewModel.countDocuments(),
    UserModel.countDocuments(),
    ReviewModel.countDocuments({ status: "flagged" }),
  ]);

  return { strainCount, reviewCount, userCount, flaggedCount };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { strainCount, reviewCount, userCount, flaggedCount } = loaderData;
  const stats = [
    { kicker: "Cepas", value: strainCount, tone: "accent" as const },
    { kicker: "Reseñas", value: reviewCount, tone: "neutral" as const },
    { kicker: "Usuarios", value: userCount, tone: "neutral" as const },
    { kicker: "Flagged", value: flaggedCount, tone: "warm" as const },
  ];

  return (
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
  );
}
