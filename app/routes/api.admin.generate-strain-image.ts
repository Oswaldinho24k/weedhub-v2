import { requireUser } from "~/lib/auth.server";
import { generateStrainImageFor } from "~/services/strains.server";

// HTTP adapter only: logic in services/strains.server.ts (same function as the strain_generate_image action).
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

  const r = await generateStrainImageFor(strainId);
  if (r.ok) return Response.json({ imageUrl: r.imageUrl });
  return Response.json({ error: r.error }, { status: r.error === "Cepa no encontrada" ? 404 : 500 });
}
