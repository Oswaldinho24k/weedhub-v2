import type { Route } from "./+types/stripe.portal";
import { redirect } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { createPortalSession } from "~/lib/stripe.server";

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const form = await request.formData();
  const entityType = String(form.get("entityType") || "") as "brand" | "dispensary";
  const entityId = String(form.get("entityId") || "");
  const returnPath = String(form.get("returnPath") || "/marcas");

  let stripeCustomerId: string | null = null;

  if (entityType === "brand") {
    const brand = await BrandModel.findById(entityId).select("stripeCustomerId").lean();
    stripeCustomerId = brand?.stripeCustomerId || null;
  } else if (entityType === "dispensary") {
    const disp = await DispensaryModel.findById(entityId).select("stripeCustomerId").lean();
    stripeCustomerId = disp?.stripeCustomerId || null;
  }

  if (!stripeCustomerId) {
    throw new Response("No hay suscripción activa para gestionar", { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const url = await createPortalSession(stripeCustomerId, `${origin}${returnPath}`);
  return redirect(url);
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
