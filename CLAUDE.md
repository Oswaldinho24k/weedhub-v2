# WeedHub — CLAUDE.md

> Single source of truth for AI assistants working on this project.
> Updated: July 2026 (session 6 — post-audit improvements)

## What is WeedHub?

Spanish-language cannabis encyclopedia and community platform at **weedhub.info**. Target market: Latin America, starting with Mexico. Positioning for when cannabis becomes a legal business in Mexico.

**Owner/Developer:** Oswaldo (solo founder, technical, handles code + strategy)

## Tech Stack

- **Framework:** React Router v7 (SSR mode) + React 19
- **Database:** MongoDB + Mongoose 9
- **Styling:** Tailwind CSS v4 with oklch token system (dark + light theme)
- **Build:** Vite 7, ESM (`"type": "module"`)
- **Images:** Cloudinary (upload + transform + CDN); Pexels API as fallback for strains without custom images
- **Email:** Resend (newsletter audiences)
- **Moderation:** Anthropic Claude Haiku (optional, for strain submissions)
- **Payments:** Stripe (B2B subscriptions for brands and dispensaries)
- **Fonts:** Fraunces / Instrument Sans / JetBrains Mono
- **Icons:** Lucide React
- **Deploy:** Docker (node:20-alpine, multi-stage build) + Vercel (weedhub-v2)
- **i18n:** 3 locales — es (default), en, pt. Prefix routing (`/`, `/en/`, `/pt/`)

## Project Structure

```
app/
├── components/
│   ├── ui/           # Primitives (button, input, badge, share-button, etc.)
│   ├── layout/       # Layout components (navbar, footer, sidebar, newsletter-signup)
│   └── composite/    # Feature components (strain-card, review-card, terpene-radar, etc.)
├── content/          # i18n strings, articles, legal text, guides, glossary
├── lib/              # Server/shared modules (auth, db, seo, stripe, email, i18n, etc.)
├── models/           # Mongoose models (see table below)
├── routes/           # All pages, API routes, sitemap
├── services/         # Gamification + review services
├── types/            # TypeScript type definitions
└── constants/        # Shared constants (cannabis, effects, locations, gamification)
seed/
├── data/             # strains.json (870), cannabis.csv (2351), users.json, reviews.json
├── seed-full.ts      # Seeds 870 strains + 200 users + ~1500 reviews
└── migrate-*.ts      # Migration scripts
scripts/
├── fill-pexels-images.ts       # Fetches Pexels images for strains without imageUrl
├── gen-midjourney-prompts.ts   # Generates 870 Midjourney prompts from strains.json
├── upload-strain-cards.ts      # Bulk upload images to Cloudinary, updates strains.json
└── gen-social-posts.py         # Social media post template generator
prompts/                        # Generated Midjourney prompts (gitignored)
```

## Models (MongoDB)

| Model | Collection | Key Fields |
|-------|-----------|------------|
| User | users | email, username, passwordHash, role, level, badges[], points, following[], savedStrainsPublic |
| Strain | strains | name, slug, type (indica/sativa/hybrid), descriptionEs, terpenes[], effects[], flavors[], imageUrl, cannabinoidProfile, averageRatings, reviewCount |
| Review | reviews | userId, strainId, entityType, entityId, ratings (6 categories), method, context, effects[], status |
| Effect | effects | name, key, category (positive/negative), icon, labelEs/En/Pt, usageCount |
| StrainSubmission | strain_submissions | userId, strainData, status, moderationResult |
| SavedStrain | saved_strains | userId, strainId |
| Brand | brands | name, slug, ownerId, tier (free/premium/enterprise), isVerified, stripeCustomerId, stripeSubscriptionId, country, city, logo, products[] |
| Dispensary | dispensaries | name, slug, ownerId, tier, isVerified, stripeCustomerId, stripeSubscriptionId, address, mapCoords |
| Product | products | name, slug, brandId, category, thcContent, imageUrl |
| Post | posts | title, slug, body, authorId, category, upvotes, commentCount, status |
| GlossaryTerm | glossary_terms | term, slug, definition, locale, isActive |
| Article | articles | title, slug, body, category, author, tags, publishedAt, status, relatedStrains[] |
| LegalStatus | legal_statuses | country, status, details, updatedAt |
| QuickRating | quick_ratings | userId, strainId, rating (1-5) |

## Routes

### Public content (3 locales: es/pt/en)
- `/` — Landing page (hero, stats, featured strain, top strains, community voices, editorial teaser, newsletter section)
- `/strains` — Strain directory (search, filter by type/effect/terpene)
- `/strains/:slug` — Strain detail (ratings, reviews, terpene radar, similar strains, share)
- `/magazine` — Article hub (filtered by category, RSS link)
- `/magazine/:slug` — Article detail (full article, share button, newsletter, related strains)
- `/guias` — Educational guides hub (10 guides)
- `/guias/:slug` — Guide detail (share button, newsletter CTA)
- `/glosario` — Cannabis glossary
- `/glosario/:slug` — Glossary term detail
- `/community` — Community link (redirects to `/comunidad`)
- `/editorial` — Editorial link (maps to magazine)
- `/terminos` — Terms of service
- `/privacidad` — Privacy policy

### Single-locale public
- `/top-100` — Top 100 strains ranking
- `/mapa-verde` — Legal status by country
- `/mapa-verde/:country` — Country legal detail
- `/para` — Browse by medical condition
- `/para/:condition` — Condition strain list
- `/recomendar` — AI strain recommender
- `/magazine.rss` — RSS feed (20 latest articles)
- `/marcas` — Brand directory
- `/marcas/:slug` — Brand profile (payment section for owner)
- `/marcas/registrar` — Create brand (requires auth)
- `/marcas/:slug/editar` — Edit brand (owner or admin only)
- `/marcas/:slug/reclamar` — Claim unclaimed brand
- `/dispensarios` — Dispensary directory
- `/dispensarios/:slug` — Dispensary profile
- `/dispensarios/agregar` — Add dispensary
- `/productos` — Products directory
- `/productos/:slug` — Product detail
- `/comunidad` — Community posts (6 categories, sort by votes or date)
- `/comunidad/nuevo` — Create post (requires auth)
- `/comunidad/:slug` — Post detail
- `/planes` — Pricing page (brand/dispensary tiers)
- `/ds` — Design system preview

### Auth + profile
- `/auth` — Login / Register
- `/logout` — Destroy session
- `/onboarding` — 5-step user profile setup (experience, goals, methods, effects, metadata + newsletter CTA)
- `/profile` — Own profile
- `/profile/:username` — Public profile (follow, saved strains grid if public)
- `/profile/edit` — Edit profile (includes "Zona peligrosa" → delete account)
- `/profile/saved` — Saved strains list
- `/profile/delete` — Account deletion (confirm "ELIMINAR", anonymizes reviews)

### Admin panel (`/admin/*`)
`admin._index`, `admin.strains`, `admin.reviews`, `admin.submissions`, `admin.effects`, `admin.users`, `admin.product-categories`, `admin.brands`, `admin.products`, `admin.dispensaries`, `admin.legal-status`, `admin.glossary`, `admin.articles`, `admin.community`

### API routes
- `api/stripe/checkout` — Start Stripe Checkout session
- `api/stripe/webhook` — Stripe webhook handler (checkout.completed, subscription.updated, subscription.deleted)
- `api/stripe/portal` — Open Stripe Customer Portal
- `api/users/:userId/follow` — Follow/unfollow toggle
- `api/reviews/:reviewId/vote` — Helpful vote
- `api/posts/:postId/vote` — Upvote post
- `api/comments/:commentId/vote` — Upvote comment
- `api/strains/:strainId/quick-rate` — Star rating without full review
- `api/strains/:strainId/save` — Save/unsave strain
- `api/theme` — Toggle dark/light theme
- `api/newsletter` — Newsletter signup (Resend)
- `api/locale` — Switch locale cookie
- `api/strain-search` — Typeahead search (fuzzy Levenshtein ≤2)
- `api/admin/ai` — AI moderation call
- `sitemap.xml` — Dynamic sitemap (strains ×3 locales, glossary, guides, brands, dispensaries, magazine articles, community posts)

## Key Conventions

### Language
- All user-facing content in **Spanish** (Mexican Spanish)
- Code, comments, and variable names in **English**
- Flavors, effects, and terpene names are stored in Spanish

### Code Style
- ESM everywhere (`import`/`export`, no `require`)
- Server-only files suffixed `.server.ts`
- Zod 4 for validation
- `cn()` utility for conditional Tailwind classes (uses `clsx` + `tailwind-merge`)
- `inline style={{}}` for active/selected visual states (Tailwind `color-mix` arbitraries fail to compile)

### Component Patterns
- UI primitives in `components/ui/` — no business logic. Includes `ShareButton` (Web Share API + clipboard fallback)
- Composite components in `components/composite/` — feature-specific
- Layout components in `components/layout/` — page structure

### Error Boundaries
Key routes export `ErrorBoundary` for contained error handling: `strains.$slug`, `magazine.$slug`, `guias.$slug`. Root-level ErrorBoundary in `root.tsx`.

### Image Pipeline
**Current fallback (active):** `scripts/fill-pexels-images.ts` searches Pexels for cannabis images and populates `strain.imageUrl` for strains without custom images. Run: `npm run images:pexels`.

**Midjourney pipeline (paused):**
1. Prompts generated: `scripts/gen-midjourney-prompts.ts`
2. Images go into `strain-cards/` (gitignored)
3. Upload: `scripts/upload-strain-cards.ts` → Cloudinary `weedhub/strains/{slug}`

`StrainThumb` renders `<img>` if `imageUrl` exists, falls back to procedural SVG placeholder.

### Seeding
```bash
npm run seed              # Quick seed (~50 strains)
npm run seed:full         # Full seed (870 strains + 200 users + ~1500 reviews)
npm run seed:effects      # Seed effects collection
npm run seed:csv          # Import from cannabis.csv
npm run images:pexels     # Populate imageUrl from Pexels for strains without images
npm run images:pexels:dry # Preview what would be updated
```

### Stripe B2B Flow
1. User registers → creates brand/dispensary profile (free)
2. On brand/dispensary page: owner sees payment section
3. POST to `api/stripe/checkout` → redirects to Stripe Checkout (30-day trial)
4. On success: `api/stripe/webhook` sets `tier`, `isVerified: true`, stores `stripeCustomerId/SubscriptionId`
5. Manage/cancel: POST to `api/stripe/portal` → Stripe Customer Portal
6. Cancellation webhook → `tier: "free"`, `isVerified: false`

### Follow System
Users can follow other users. `profile.$username.tsx` shows follower/following counts, follow button uses `useFetcher` for optimistic UI. `api/users/:userId/follow` toggles `following[]` array.

## Current Status (July 2026)

### Done ✅

**Core platform:**
- Full strain encyclopedia (870 strains, search, filter, detail pages, AggregateRating schema)
- Review system (6-category ratings, consumption context, effects tracking, helpful votes)
- Auth (session-based, role system: user/admin/moderator)
- User profiles with gamification (8+ badges, 5-level progression, points)
- Dual identity (username + anonymousHandle, default-anonymous publishing)
- Follow system (follow/unfollow, follower/following stats on profiles)
- Saved strains (private or public grid on profile)
- Onboarding flow (5 steps, captures experience/goals/methods/effects/metadata)
- Admin panel (14 sections: strains, reviews, submissions, effects, users, brands, products, dispensaries, categories, legal-status, glossary, articles, community, dashboard)
- Account deletion (`/profile/delete`) — anonymizes reviews, destroys session

**B2B / Monetization:**
- Brand directory + brand profiles (`/marcas`)
- Self-serve brand creation (`/marcas/registrar`)
- Brand profile editing (`/marcas/:slug/editar`, owner-gated)
- Dispensary directory + profiles + adding
- Stripe integration: checkout, webhook, Customer Portal
- 30-day free trial on Presencia Verificada
- Auto-verification on payment (webhook sets `isVerified: true`)
- Pricing page (`/planes`) with all tiers
- Subscription confirmation email

**SEO:**
- `buildMeta()` with hreflang (es, pt-BR, en, x-default) on all localized routes
- Sitemap with hreflang variants: strains (870×3), glossary, guides, brands, dispensaries, magazine articles, community posts
- JSON-LD: WebSite, Organization (homepage), Product + AggregateRating (strains), Article + BreadcrumbList (magazine, guides), CollectionPage (magazine list), LocalBusiness (dispensaries)
- Locale-aware meta descriptions on all routes
- robots.txt: blocks `/api`, `/admin`, `/auth`, `/onboarding`, `/profile/edit`, `/logout`
- Plausible Analytics script (needs plausible.io account for `weedhub.info`)

**Content:**
- Magazine (`/magazine`) — article hub with categories, RSS feed
- Educational guides (`/guias`) — 10 guides in es/en/pt
- Cannabis glossary (`/glosario`) with definitions
- Mapa Verde (`/mapa-verde`) — legal status by country
- Condiciones médicas (`/para`) — browse strains by health goal
- AI strain recommender (`/recomendar`) — Claude-powered
- Community forums (`/comunidad`) — posts, categories, voting, comments

**UX / Conversion:**
- Newsletter section on homepage (above CTA)
- Newsletter CTA in onboarding step 5 (peak engagement)
- Share button (`ShareButton` component) on magazine articles and guide pages
- `OnboardingNewsletter` component — inline Resend form in step 5
- Error boundaries on key detail routes

**Email:**
- Welcome email on registration (`sendWelcomeEmail`)
- Subscription confirmation email (`sendSubscriptionConfirmationEmail`)

**Images:**
- `fill-pexels-images.ts` script — populates `imageUrl` for strains without images
- `PEXELS_API_KEY` set in Vercel (production)

### Pending 🔧
- **Plausible setup:** Script deployed, needs plausible.io account for `weedhub.info`
- **Resend domain verification:** `hola@weedhub.info` needs DNS verification
- **Google Search Console:** Submit sitemap, verify hreflang indexing
- **Stripe live mode:** Currently set up for test mode, needs production price IDs
- **Pexels images:** Run `npm run images:pexels` against production DB to populate strain images
- **Rate limiting:** Auth, newsletter, search, AI endpoints have no rate limiting (critical before scale)
- **Sentry / error logging:** No production error tracking yet

### Not Yet Built ❌
- **Review forms for brands/dispensaries/products** — models exist, no submission UI
- **Community section full UX** — exists but minimal (no rich text editor, no notifications)
- **Email flows** — review notifications, weekly digest (welcome + subscription emails done)
- **A/B testing** — no tooling (PostHog if needed)
- **Brand analytics dashboard** — brands can't see their own traffic/review data
- **Legal review** — privacy policy and terms may need review for Mexican cannabis regulations

## Environment Variables

```
# Database + sessions
MONGODB_URI=            # MongoDB connection string
SESSION_SECRET=         # Session encryption (min 32 chars)

# Cloudinary (strain image upload + CDN)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Images fallback
PEXELS_API_KEY=         # Pexels API key for strain image fallback (set in Vercel ✅)

# Email (Resend)
RESEND_API_KEY=
RESEND_AUDIENCE_ID=

# AI moderation (optional)
ANTHROPIC_API_KEY=

# Stripe (B2B self-serve)
STRIPE_SECRET_KEY=                   # sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=               # whsec_...
STRIPE_PRICE_PRESENCIA_BRAND=        # $49/mes — Presencia Verificada (marcas)
STRIPE_PRICE_DESTACADO_BRAND=        # $149/mes — Destacado (marcas)
STRIPE_PRICE_PRESENCIA_DISPENSARIO=  # $39/mes — Presencia Verificada (dispensarios)
STRIPE_PRICE_DESTACADO_DISPENSARIO=  # $99/mes — Destacado (dispensarios)
```

## Common Commands

```bash
npm run dev              # Dev server at localhost:5173
npm run build            # Production build
npm run typecheck        # Type check (runs react-router typegen + tsc)
npm run seed:full        # Full database seed (870 strains + 200 users + ~1500 reviews)
npm run images:pexels    # Populate imageUrl from Pexels for strains without images
npm run images:pexels:dry  # Dry run — preview what would be updated

# Stripe dev
stripe listen --forward-to localhost:5173/api/stripe/webhook

# Image pipeline (Midjourney path — paused)
npx tsx scripts/upload-strain-cards.ts --dry-run    # Preview uploads
npx tsx scripts/upload-strain-cards.ts --skip-existing  # Upload new only
```
