# WeedHub — Glossary

Domain language for the WeedHub codebase. Keep free of implementation details.

---

## Strain

A cannabis cultivar with a defined genetic lineage, chemical profile (cannabinoids, terpenes), sensory profile (effects, flavors), and cultivation characteristics. The core entity of the platform.

---

## Terpene

An aromatic compound produced by cannabis (and other plants) that contributes to the strain's scent, flavor, and pharmacological effects. Each strain carries a **terpene profile** — an ordered list of terpenes by concentration (percentage). The dominant terpene is the one with the highest concentration.

---

## SimilarityScore

A composite integer score used to rank strains by relevance to a reference strain. Currently computed as:

```
(sharedEffects × 3) + (sharedFlavors × 2) + (sharedTerpeneCount × 2)
```

Higher scores indicate more pharmacologically and sensorially similar strains. Only strains sharing at least one effect with the reference strain are considered candidates.

---

## TerpeneFilter

A query constraint on the strains directory that limits results to strains whose terpene profile contains a given terpene name. Operates on `terpenes[].name` (not percentage). A strain matches if any terpene in its profile matches the filter value.

---

## GrowInfo

The cultivation metadata attached to a strain: difficulty level, indoor/outdoor yield, flowering weeks, height range, preferred climate, and seed type flags (autoflowering, feminized). Not all strains have GrowInfo populated.

---

## QuickRating

A 1–5 star rating a user can submit without writing a review text. Distinct from a full Review. Contributes to `averageRatings` at a lower weight than a full Review.

---

## DeferredSection

A page section whose data is fetched in parallel with the main loader but streamed to the client after the initial HTML is sent. Used for heavy sections (reviews, similar strains) that should not block Time to First Byte on the strain detail page.
