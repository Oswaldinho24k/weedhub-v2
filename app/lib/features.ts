/**
 * Feature flags. Constants in code: in development everything is on (so we can keep
 * building hidden sections); in production only what's `true` here is visible.
 * Turning a feature on is a one-line change + deploy. Hidden features keep their data
 * and code; their routes answer 404 and they disappear from nav, sitemap and llms.txt.
 */
export const FEATURES = {
  /** Foro /comunidad — off until there are real people to talk to. */
  foro: false,
  /** Marcas, dispensarios, productos — directory of businesses. */
  negocios: false,
  /** /planes and every payment flow (Stripe). */
  pagos: false,
  /** Top 100 — needs real community ratings. */
  top100: false,
  /** /para condition pages — need real community reports. */
  porCondicion: false,
  /** Magazine (editorial, reviewed). */
  magazine: true,
  /** AI recommender. */
  recomendador: true,
} as const;

export type Feature = keyof typeof FEATURES;

export function featureOn(f: Feature): boolean {
  if (import.meta.env.DEV) return true;
  return FEATURES[f];
}

/** Use inside loaders/actions of a gated route. */
export function requireFeature(f: Feature) {
  if (!featureOn(f)) throw new Response("Not Found", { status: 404 });
}
