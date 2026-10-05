import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { buildStrainImagePrompt } from "~/lib/strain-image-prompt.server";
import { generateStrainImage } from "~/lib/image-gen.server";
import { uploadImageFromUrl } from "~/lib/cloudinary.server";

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const strainId = String(formData.get("strainId") || "").trim();
  if (!strainId) {
    return Response.json({ error: "strainId requerido" }, { status: 400 });
  }

  await connectDB();
  const strain = await StrainModel.findById(strainId)
    .select("name type dominantTerpene terpenes effects flavors")
    .lean();

  if (!strain) {
    return Response.json({ error: "Cepa no encontrada" }, { status: 404 });
  }

  try {
    const prompt = buildStrainImagePrompt(strain as any);
    const rawUrl = await generateStrainImage(prompt);
    const imageUrl = await uploadImageFromUrl(rawUrl, {
      folder: "weedhub/strains",
      transformation: "c_fill,w_1200,h_900,q_auto",
    });

    await StrainModel.findByIdAndUpdate(strainId, { imageUrl });
    return Response.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando imagen";
    return Response.json({ error: message }, { status: 500 });
  }
}
