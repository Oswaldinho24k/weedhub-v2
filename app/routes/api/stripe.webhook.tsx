import Stripe from "stripe";
import type { Route } from "./+types/stripe.webhook";
import { connectDB } from "~/lib/db.server";
import { stripe } from "~/lib/stripe.server";
import { BrandModel } from "~/models/brand.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { sendSubscriptionConfirmationEmail } from "~/lib/email.server";

export async function action({ request }: Route.ActionArgs) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("No signature", { status: 400 });

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { entityType, entityId, plan } = session.metadata || {};
      if (!entityType || !entityId || !plan) break;

      const update = {
        tier: plan,
        isVerified: true,
        verifiedAt: new Date(),
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        stripeSubscriptionStatus: "active" as const,
        status: "active" as const,
      };

      let entityName = "";
      let entityEmail = "";

      if (entityType === "brand") {
        const doc = await BrandModel.findByIdAndUpdate(entityId, update, { new: true });
        entityName = doc?.name || "";
        entityEmail = doc?.email || session.customer_details?.email || "";
      } else if (entityType === "dispensary") {
        const doc = await DispensaryModel.findByIdAndUpdate(entityId, update, { new: true });
        entityName = doc?.name || "";
        entityEmail = session.customer_details?.email || "";
      }

      if (entityEmail && entityName) {
        const planName = plan === "premium" ? "Presencia Verificada" : "Destacado";
        sendSubscriptionConfirmationEmail(entityEmail, entityName, planName).catch(() => {});
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const { entityType, entityId } = sub.metadata || {};
      if (!entityType || !entityId) break;

      const priceId = sub.items.data[0]?.price?.id;
      const update: Record<string, unknown> = { stripeSubscriptionStatus: sub.status };

      if (priceId) {
        const presenciaPrices = [
          process.env.STRIPE_PRICE_PRESENCIA_BRAND,
          process.env.STRIPE_PRICE_PRESENCIA_DISPENSARIO,
        ];
        const destacadoPrices = [
          process.env.STRIPE_PRICE_DESTACADO_BRAND,
          process.env.STRIPE_PRICE_DESTACADO_DISPENSARIO,
        ];
        if (presenciaPrices.includes(priceId)) update.tier = "premium";
        else if (destacadoPrices.includes(priceId)) update.tier = "enterprise";
      }

      if (entityType === "brand") {
        await BrandModel.findByIdAndUpdate(entityId, update);
      } else if (entityType === "dispensary") {
        await DispensaryModel.findByIdAndUpdate(entityId, update);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { entityType, entityId } = sub.metadata || {};
      if (!entityType || !entityId) break;

      const update = {
        tier: "free",
        isVerified: false,
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: "canceled" as const,
      };

      if (entityType === "brand") {
        await BrandModel.findByIdAndUpdate(entityId, update);
      } else if (entityType === "dispensary") {
        await DispensaryModel.findByIdAndUpdate(entityId, update);
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
