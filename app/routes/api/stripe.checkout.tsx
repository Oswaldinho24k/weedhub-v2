import type { Route } from "./+types/stripe.checkout";
import { redirect } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { createCheckoutSession } from "~/lib/stripe.server";

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  await connectDB();

  const form = await request.formData();
  const entityType = String(form.get("entityType") || "") as "brand" | "dispensary";
  const entityId = String(form.get("entityId") || "");
  const entitySlug = String(form.get("entitySlug") || "");
  const plan = String(form.get("plan") || "") as "premium" | "enterprise";

  if (!["brand", "dispensary"].includes(entityType)) {
    throw new Response("Invalid entityType", { status: 400 });
  }
  if (!["premium", "enterprise"].includes(plan)) {
    throw new Response("Invalid plan", { status: 400 });
  }

  // Fetch existing stripeCustomerId if available
  let stripeCustomerId: string | undefined;
  if (entityType === "brand") {
    const brand = await BrandModel.findById(entityId).select("stripeCustomerId").lean();
    stripeCustomerId = brand?.stripeCustomerId || undefined;
  } else {
    const disp = await DispensaryModel.findById(entityId).select("stripeCustomerId").lean();
    stripeCustomerId = disp?.stripeCustomerId || undefined;
  }

  const url = await createCheckoutSession({
    entityType,
    entityId,
    entitySlug,
    plan,
    stripeCustomerId,
    request,
  });

  return redirect(url);
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
