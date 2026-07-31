# WeedHub — CLAUDE.md

> Single source of truth for AI assistants working on this project.
> Updated: June 2026 (session 4)

## What is WeedHub?

Spanish-language cannabis encyclopedia and community platform at **weedhub.info**. Target market: Latin America, starting with Mexico. Positioning for when cannabis becomes a legal business in Mexico.

**Owner/Developer:** Oswaldo (solo founder, technical, handles code + strategy)

## Tech Stack

- **Framework:** React Router v7 (SSR mode) + React 19
- **Database:** MongoDB + Mongoose 9
- **Styling:** Tailwind CSS v4 with oklch token system (dark + light theme)
- **Build:** Vite 7, ESM (`"type": "module"`)
- **Images:** Cloudinary (upload + transform + CDN)
- **Email:** Resend (newsletter audiences)
- **Moderation:** Anthropic Claude Haiku (optional, for strain submissions)
- **Fonts:** Fraunces / Instrument Sans / JetBrains Mono
- **Icons:** Lucide React
- **Deploy:** Docker (node:20-alpine, multi-stage build)
- **i18n:** 3 locales — es (default), en, pt. Prefix routing (`/`, `/en/`, `/pt/`)

## Project Structure

```
app/
├── components/
│   ├── ui/           # 17 primitives (button, input, badge, etc.)
│   ├── layout/       # 8 layout components (navbar, footer, sidebar)
│   └── composite/    # 11 feature components (strain-card, review-card, terpene-radar)
├── content/          # i18n strings, articles, legal text
├── lib/              # 18 server/shared modules
├── models/           # 6 Mongoose models
├── routes/           # 25 page routes + 6 API routes + sitemap
├── services/         # gamification + review services
├── types/            # TypeScript type definitions
└── constants/        # shared constants
seed/
├── data/             # strains.json (870), cannabis.csv (2351), users.json, reviews.json
├── seed-full.ts      # Seeds 870 strains + 200 users + ~1500 reviews
└── migrate-*.ts      # Migration scripts
scripts/
├── gen-midjourney-prompts.ts   # Generates 870 Midjourney prompts from strains.json
├── gen-strain-cards.py         # Pillow-based strain card generator (deprecated — using Midjourney instead)
├── gen-social-posts.py         # Social media post template generator
└── upload-strain-cards.ts      # Bulk upload images to Cloudinary, updates strains.json
prompts/                        # Generated Midjourney prompts (gitignored)
```

## Models (MongoDB)

| Model | Collection | Key Fields |
|-------|-----------|------------|
| User | users | email, username, passwordHash, role, level, badges[], points |
| Strain | strains | name, slug, type (indica/sativa/hybrid), description, descriptionEs, terpenes[], effects[], flavors[], imageUrl, cannabinoidProfile |
| Review | reviews | userId, strainId, ratings (6 categories), method, context, effects[], text |
| Effect | effects | name, category, icon |
| StrainSubmission | strain_submissions | userId, strainData, status, moderationResult |
| SavedStrain | saved_strains | userId, strainId |

## Routes

**Public pages:** landing (`_index`), strains list, strain detail (`strains.$slug`), strain review form, suggest strain, community, editorial, guides hub (`guias`), guide detail (`guias.$slug`), design system (`ds`), privacy, terms
**Auth:** login/register (`auth`), logout, onboarding
**Profile:** own profile, public profile (`profile.$username`), edit profile, saved strains
**Admin:** dashboard, strains CRUD, reviews moderation, submissions queue, effects management
**API:** review voting, strain save/unsave, theme toggle, newsletter signup, locale switch, strain search

### Guides Content
Static educational guides live in `app/content/guides.{es,en,pt}.ts` — same pattern as `articles.{es,en,pt}.ts`. Dispatcher: `app/content/guides.ts` exports `getGuides(locale)` and `getGuide(slug, locale)`. All three locales exist. To add a guide: add to all three locale files with the same slug.

**Current 10 guide slugs:**
- `tipos-de-cannabis` — Sativa/Indica/Híbridas explicadas
- `terpenos-que-son` — Qué son los terpenos
- `cannabinoides-thc-cbd` — THC, CBD y otros cannabinoides
- `metodos-de-consumo` — Fumar vs vaporizar vs comestibles
- `como-leer-una-resena` — Cómo interpretar una reseña en WeedHub
- `primeras-veces` — Guía para principiantes
- `almacenamiento-cannabis` — Cómo conservar tu hierba
- `terpenos-por-cepa` — Qué terpenos buscar según el efecto
- `efecto-sequito` — Entourage effect explicado
- `cultivo-basico` — Introducción al autocultivo

## Key Conventions

### Language
- All user-facing content in **Spanish** (Mexican Spanish)
- Code, comments, and variable names in **English**
- Flavors, effects, and terpene names are stored in Spanish

### Code Style
- ESM everywhere (`import`/`export`, no `require`)
- Server-only files suffixed `.server.ts` (e.g., `auth.server.ts`, `db.server.ts`)
- Zod 4 for validation
- `cn()` utility for conditional Tailwind classes (uses `clsx` + `tailwind-merge`)

### Component Patterns
- UI primitives in `components/ui/` — small, reusable, no business logic
- Composite components in `components/composite/` — feature-specific, may fetch data
- Layout components in `components/layout/` — page structure

### Image Pipeline
1. Strain images generated via Midjourney (prompts in `prompts/` folder)
2. Downloaded as `{slug}.png` into `strain-cards/` (gitignored)
3. Uploaded to Cloudinary via `scripts/upload-strain-cards.ts` → folder `weedhub/strains/{slug}`
4. `strains.json` updated with `imageUrl` field
5. `strain-thumb.tsx` renders `<img>` if `imageUrl` exists, falls back to procedural SVG placeholder

### Seeding
```bash
npm run seed         # Quick seed (~50 strains)
npm run seed:full    # Full seed (870 strains + 200 users + ~1500 reviews)
npm run seed:effects # Seed effects collection
npm run seed:csv     # Import from cannabis.csv
```

## Current Status (June 2026)

### Done ✅
- Full strain encyclopedia (870 strains, search, filter, detail pages)
- Review system (6-category ratings, consumption context, effects tracking)
- Auth (session-based, role system: user/admin/moderator)
- User profiles with gamification (8+ badges, 5-level progression, points)
- Onboarding flow
- Admin panel (strains, reviews, submissions, effects)
- SEO foundation (meta tags, OG images, JSON-LD, sitemap, robots.txt)
- i18n (es/en/pt with prefix routing)
- Dark/light theme
- Newsletter signup (Resend)
- AI moderation for strain submissions (Anthropic)
- Docker deployment config
- Midjourney prompt generator for 870 strain images
- Cloudinary upload pipeline for strain images
- Social media post template generator (6 templates)
- Expansion strategy document (data model, monetization, roadmap)
- **hreflang tags** — `buildMeta()` in `app/lib/seo.ts` now accepts `canonicalPath` and emits 4 `<link rel="alternate" hreflang>` tags (es, pt-BR, en, x-default). All localized routes updated.
- **Sitemap with locale variants** — `sitemap[.]xml.tsx` rewritten with `xmlns:xhtml`; generates 3 `<url>` blocks per page (es/pt/en) with `xhtml:link` hreflang annotations. Covers 7 static paths + 870 strains × 3 = 2,617 strain URLs.
- **Locale-aware meta descriptions** — All localized routes (`_index`, `strains`, `strains.$slug`, `editorial`, `community`, `terminos`, `privacidad`) now resolve locale in their loader and pass locale-aware title/description from the dict to `buildMeta()`. English and Portuguese meta are no longer Spanish.
- **Review page meta** — `strains.$slug.review.tsx` now uses full `buildMeta()` with OG/Twitter tags.
- **Plausible Analytics** — Script tag added in `root.tsx`, guarded by `import.meta.env.PROD`. Cookieless, no consent banner needed. Needs plausible.io account setup for `weedhub.info`.
- **Guides section** (`/guias`) — 10 educational guides in es/en/pt. Hub at `/guias` (grid of cards), detail at `/guias/:slug`. JSON-LD: CollectionPage (hub) + Article + BreadcrumbList (detail). Footer + navbar links added. Routes localized: `/guias`, `/pt/guias`, `/en/guias`.
- **Navbar guides link** — `t.nav.guides` → `/guias` in both desktop and mobile nav (`app/components/layout/navbar.tsx`).
- **Organization schema** — JSON-LD on homepage (`_index.tsx`) now returns array: `[WebSite schema, Organization schema]` with name, url, logo, foundingDate, areaServed.
- **BreadcrumbList schema** — Added on `strains.$slug.tsx` (Home → Directorio → strain name) and `guias.$slug.tsx` (Home → Guías → guide title).
- **Welcome email** — `app/lib/email.server.ts` added. `sendWelcomeEmail(email, username)` sends a dark-themed HTML email via Resend on registration (fire-and-forget, non-blocking). Needs `RESEND_API_KEY` in env and `hola@weedhub.info` verified as sender domain in Resend dashboard.
- **Email capture on guide pages** — `NewsletterSignup` component embedded at the bottom of each guide detail page (`guias.$slug.tsx`), below the body sections.

### In Progress 🔧
- **Strain images:** 870 Midjourney prompts generated, need to execute in Midjourney and upload. Style: macro photography, black background, vertical centered bud (see `prompts/` folder and style guide doc)
- **Data expansion:** Plan to scale from 870 to 8000+ strains via Cannabis Reports API and open datasets
- **Plausible setup:** Script is deployed but needs plausible.io account created with domain `weedhub.info` to actually collect data.

### Not Yet Built ❌
- **Community section** (`/comunidad`) — user discussions/forums, stubbed as "coming soon"
- **Product categories** — flowers, extracts, edibles, topicals (planned in expansion strategy)
- **Dispensary directory** — for when Mexico legalizes commercial sales
- **Brand verification system** — paid tier for brands to get verified and post products
- **Marketplace/Advertising** — sponsored listings, brand pages
- **Email flows** — review notifications, weekly digest (welcome email is done)
- **Legal review** — privacy policy and terms exist but may need legal review for Mexico

### Marketing — Remaining Gaps
From the Website Launch Framework audit. Done items removed.
- **Email capture optimization** — Newsletter form is on guide pages; optimize placement/copy/incentive (e.g., lead magnet, offer exclusive strain guide on signup).
- **A/B testing infrastructure** — No tooling yet; Plausible doesn't do A/B. Consider PostHog if needed.
- **OG images per strain** — Default SVG OG image is used when a strain has no `imageUrl`. Once Midjourney images are uploaded, each strain detail page will auto-use its real image. No code change needed.
- **Schema markup — FAQPage** — Skipped: current guide content uses descriptive headings, not Q&A pairs. Would need guide content restructured first.
- **Google Search Console verification** — Not yet verified. Needed to submit sitemap and monitor hreflang indexing.
- **Resend sender domain** — `hola@weedhub.info` needs DNS verification in Resend dashboard before welcome emails send. Also need to create plausible.io account for `weedhub.info`.

## Monetization Strategy (Planned)

Three tiers, no product sales:
1. **Free:** Brand profiles, basic analytics, community access
2. **Premium ($50-200/mo):** Verified badge, product listings, priority placement, detailed analytics
3. **Enterprise ($500+/mo):** White-label, API access, custom branding, dedicated support

Additional: advertising/sponsored content, marketplace commissions, content premium, API access

## Environment Variables

```
MONGODB_URI=            # MongoDB connection string
SESSION_SECRET=         # Session encryption (min 32 chars)
CLOUDINARY_CLOUD_NAME=  # Cloudinary cloud name
CLOUDINARY_API_KEY=     # Cloudinary API key
CLOUDINARY_API_SECRET=  # Cloudinary API secret
RESEND_API_KEY=         # Resend email API key
RESEND_AUDIENCE_ID=     # Resend newsletter audience
ANTHROPIC_API_KEY=      # Optional — AI moderation
```

## Common Commands

```bash
npm run dev              # Dev server at localhost:5173
npm run build            # Production build
npm run seed:full        # Full database seed
npm run typecheck        # Type checking

# Scripts (run from project root)
npx tsx scripts/upload-strain-cards.ts              # Upload images to Cloudinary
npx tsx scripts/upload-strain-cards.ts --dry-run    # Preview what would upload
npx tsx scripts/upload-strain-cards.ts --skip-existing  # Skip already-uploaded
node scripts/gen-midjourney-prompts.ts              # Regenerate Midjourney prompts
```
