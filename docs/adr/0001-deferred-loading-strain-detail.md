# ADR 0001 — Deferred loading for reviews and similar strains on strain detail

**Status:** Accepted  
**Date:** October 2026

## Context

The `/strains/:slug` loader currently fetches strain data, reviews, similar strains, saved state, and quick rating in a single synchronous pass before sending any HTML. On slow mobile connections (common in LATAM), this means the user sees nothing until all 4–5 queries complete — often 500–800ms.

The strain's core data (name, description, cannabinoid profile, terpenes, effects) is fast to fetch (single indexed lookup). Reviews and similar strains are slower: reviews require a populated join + sort; similar strains run a multi-stage aggregation.

## Decision

Wrap the `reviews` and `similarStrains` queries in React Router's `defer()` so they stream to the client after the initial HTML is sent. The strain hero, stats, effects, terpenes, and grow info render immediately. Reviews and similar strains render progressively with skeleton placeholders.

The `isSaved` and `existingQuickRating` lookups remain synchronous — they affect the initial UI state of interactive controls (save button, star widget) and must be known before first render to avoid flicker.

## Trade-offs considered

**SEO:** Googlebot and modern crawlers handle deferred content correctly — they wait for the full render before indexing. The strain's core content (the part that matters for ranking) is in the synchronous payload. Reviews are user-generated content that Google already handles as dynamic; similar strains links are secondary navigation. No SEO regression expected.

**Complexity:** Adds `<Suspense>` boundaries and skeleton components. Future developers must understand that `loaderData.reviews` and `loaderData.similarStrains` are promises, not resolved values, when accessed outside `<Await>`.

**Alternative rejected:** Fetching reviews via a separate client-side API call after mount. This would require a dedicated API endpoint and add a waterfall (page load → JS parse → fetch). `defer()` parallelises the slow queries with the HTML send, which is strictly better.

## Consequences

- Time to first meaningful paint on strain detail improves for slow connections.
- `loaderData.reviews` and `loaderData.similarStrains` must be accessed inside `<Await>` wrappers.
- Skeleton components needed for both deferred sections.
