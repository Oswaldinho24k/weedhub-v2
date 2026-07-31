import { data } from "react-router";
import type { Route } from "./+types/strains.$strainId.quick-rate";
import { connectDB } from "~/lib/db.server";
import { getUserFromSession } from "~/lib/auth.server";
import { QuickRatingModel } from "~/models/quick-rating.server";
import { StrainModel } from "~/models/strain.server";
import { recalculateStrainRatings } from "~/services/review.service.server";

export async function action({ request, params }: Route.ActionArgs) {
  const user = await getUserFromSession(request);
  if (!user) return data({ error: "Debes iniciar sesión" }, { status: 401 });

  const { strainId } = params;
  const formData = await request.formData();
  const rating = parseInt(String(formData.get("rating") || "0"));
  const quickEffects = formData.getAll("quickEffects").map(String).filter(Boolean);

  if (!rating || rating < 1 || rating > 5) {
    return data({ error: "Rating inválido" }, { status: 400 });
  }

  await connectDB();

  const strain = await StrainModel.findById(strainId).select("_id").lean();
  if (!strain) return data({ error: "Cepa no encontrada" }, { status: 404 });

  await QuickRatingModel.findOneAndUpdate(
    { userId: user._id, strainId },
    { rating, quickEffects },
    { upsert: true, new: true }
  );

  // Delegate to the unified service — keeps all rating logic in one place
  await recalculateStrainRatings(strainId);

  const updated = await StrainModel.findById(strainId).select("averageRatings reviewCount").lean();
  return data({ ok: true, newAvg: updated?.averageRatings?.overall, totalCount: updated?.reviewCount });
}
