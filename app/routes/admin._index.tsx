import type { Route } from "./+types/admin._index";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";
import { UserModel } from "~/models/user.server";
import { Card, CardContent } from "~/components/ui/card";

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
    { label: "Cepas", value: strainCount, icon: "potted_plant", color: "text-primary" },
    { label: "Reseñas", value: reviewCount, icon: "rate_review", color: "text-blue-400" },
    { label: "Usuarios", value: userCount, icon: "people", color: "text-purple-400" },
    { label: "Flagged", value: flaggedCount, icon: "flag", color: "text-red-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-white/10">
          <CardContent className="pt-4 text-center">
            <span className={`material-symbols-outlined text-3xl ${stat.color} mb-2 block`}>
              {stat.icon}
            </span>
            <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
