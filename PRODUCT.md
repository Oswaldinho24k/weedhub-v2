# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: the **curious adult consumer** in the Spanish- and Portuguese-speaking world (LATAM + Brazil) who wants to understand a strain — effects, risks, what to expect, how others used it — before or after trying it. Usually arrives from a search engine or an AI answer, on a phone, with a specific question.

Secondary (all served, none primary): experienced enthusiasts who review and follow; growers looking for genetics and lineage; medical/therapeutic users browsing by condition (`/para`); brands and dispensaries (B2B, paid plans).

## Product Purpose

WeedHub is the Spanish/Portuguese-first cannabis encyclopedia and community: a strain directory (3,036 strains), reviews with context (method · moment · experience), editorial (magazine, guides, glossary), legal status by country (Mapa Verde), browse-by-condition, an AI recommender, forums, profiles, and a brand/dispensary directory. Success = being the reference people (and AI answer engines) cite when someone in LATAM or Brazil asks about cannabis.

## Positioning

The only deep cannabis encyclopedia written for Spanish and Portuguese speakers, built on community reviews that carry context (method, moment of day, experience) instead of bare scores. Leafly and Weedmaps do not serve this audience.

## Operating Context

- Spanish and Brazilian Portuguese are **equal priority** markets (design voice and SEO/GEO/AEO). English is secondary. i18n routing with es/en/pt prefixes already exists.
- Mostly mobile, arriving from search or AI assistants onto a specific strain, guide or glossary page.
- Legal context varies by country; stigma is real, so anonymity matters.

## Capabilities and Constraints

- All existing features stay; the redesign rebuilds every one of them, nothing removed.
- **Anonymous posting** of reviews and forum posts must remain possible.
- **18+ / responsible use**: visible adult-only framing; never promote consumption.
- **Strict medical caution**: medical/condition content carries disclaimers and never claims cures or treatment.
- Stack: React Router v7 SSR, Tailwind v4, MongoDB Atlas (Mongoose), Cloudinary, Vercel.
- Open: whether the gender-neutral "Bienvenide" voice is a binding commitment (not confirmed).

## Evidence on Hand

- Real data: 3,036 strains (genetics, cannabinoids, terpenes, effects), ~1,570 reviews, legal-status records, glossary, 10 guides in 3 languages, magazine articles.
- **No real strain photography.** Stock (Pexels) images were removed on 2026-11-22 (backup in `backups/`); the owner will source real images later. Until then, strain visuals must come from data and type, never stock photos.
- No real testimonials: do not invent quotes, users, or usage numbers.

## Product Principles

1. Knowledge first, commerce later.
2. Context over scores: every opinion carries method, moment and experience.
3. Honest and careful: no hype, no medical claims, adults only.
4. Spanish and Portuguese are native, not translations.
5. Built to be cited: every page answers a question clearly enough for a search engine or an AI to quote it.

## Accessibility & Inclusion

Mobile-first, readable on low-end Android over slow connections; WCAG AA contrast.
