import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS = {
  brand: {
    premium: process.env.STRIPE_PRICE_PRESENCIA_BRAND || "",
    enterprise: process.env.STRIPE_PRICE_DESTACADO_BRAND || "",
  },
  dispensary: {
    premium: process.env.STRIPE_PRICE_PRESENCIA_DISPENSARIO || "",
    enterprise: process.env.STRIPE_PRICE_DESTACADO_DISPENSARIO || "",
  },
} as const;

export const PLAN_NAMES: Record<"premium" | "enterprise", string> = {
  premium: "Presencia Verificada",
  enterprise: "Destacado",
};

export const PLAN_PRICES: Record<"brand" | "dispensary", Record<"premium" | "enterprise", string>> = {
  brand: { premium: "$49 USD/mes", enterprise: "$149 USD/mes" },
  dispensary: { premium: "$39 USD/mes", enterprise: "$99 USD/mes" },
};

export function getPriceId(
  entityType: "brand" | "dispensary",
  plan: "premium" | "enterprise"
): string {
  return PRICE_IDS[entityType][plan];
}

export async function createCheckoutSession(opts: {
  entityType: "brand" | "dispensary";
  entityId: string;
  entitySlug: string;
  plan: "premium" | "enterprise";
  stripeCustomerId?: string;
  request: Request;
}): Promise<string> {
  const { entityType, entityId, entitySlug, plan, stripeCustomerId } = opts;
  const origin = new URL(opts.request.url).origin;
  const basePath = entityType === "brand" ? "/marcas" : "/dispensarios";
  const successUrl = `${origin}${basePath}/${entitySlug}?upgraded=1`;
  const cancelUrl = `${origin}${basePath}/${entitySlug}`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: getPriceId(entityType, plan), quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { entityType, entityId, entitySlug, plan },
    subscription_data: {
      trial_period_days: 30,
      metadata: { entityType, entityId, plan },
    },
    allow_promotion_codes: true,
  };

  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
