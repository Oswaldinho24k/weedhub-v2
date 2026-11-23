/** Client-safe plan display data (no Stripe secrets). Price IDs stay in stripe.server.ts. */
export const PLAN_NAMES: Record<"premium" | "enterprise", string> = {
  premium: "Presencia Verificada",
  enterprise: "Destacado",
};

export const PLAN_PRICES: Record<"brand" | "dispensary", Record<"premium" | "enterprise", string>> = {
  brand: { premium: "$49 USD/mes", enterprise: "$149 USD/mes" },
  dispensary: { premium: "$39 USD/mes", enterprise: "$99 USD/mes" },
};

