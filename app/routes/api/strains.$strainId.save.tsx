import type { Route } from "./+types/strains.$strainId.save";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { SavedStrainModel } from "~/models/saved-strain.server";

export async function action({ params, request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const existing = await SavedStrainModel.findOne({
    userId: user._id,
    strainId: params.strainId,
  });

  if (existing) {
    await existing.deleteOne();
    return { success: true, saved: false };
  } else {
    await SavedStrainModel.create({
      userId: user._id,
      strainId: params.strainId,
    });
    return { success: true, saved: true };
  }
}
