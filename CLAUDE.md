# WeedHub — CLAUDE.md

> Single source of truth for AI assistants working on this project.
> Updated: 23 November 2026 (Rótulo y Cartulina redesign, es/pt only, SEO/AEO pass). See docs/FEATURES.md, docs/QA-ROADMAP.md, docs/SEO-AUDIT.md.

## What is WeedHub?

Spanish-language cannabis encyclopedia and community platform at **weedhub.info**. Target market: Latin America, starting with Mexico. Positioning for when cannabis becomes a legal business in Mexico.

**Owner/Developer:** Oswaldo (solo founder, technical, handles code + strategy)

## Tech Stack

- **Framework:** React Router v7 (SSR mode) + React 19
- **Database:** MongoDB + Mongoose 9
- **Styling:** Tailwind CSS v4 with oklch token system (dark + light theme)
- **Build:** Vite 7, ESM (`"type": "module"`)
- **Images:** Cloudinary (upload + transform + CDN). No stock photos: Pexels was removed 2026-11-22 (old URLs backed up in `backups/`). Strains without a real image render a type-colored initials card (`StrainThumb`) or a cartulina (`StrainSign`).
- **Email:** Resend (newsletter audiences)
- **Moderation:** Anthropic Claude Haiku (optional, for strain submissions)
- **AI Agent:** Vercel AI SDK + Claude (conversational strain recommender, streaming)
- **Image Generation:** fal.ai + Flux Schnell (`IMAGE_GEN_API_KEY`) — admin pipeline
- **Payments:** Stripe (B2B subscriptions for brands and dispensaries)
- **Design world:** "Rótulo y Cartulina" (Nov 2026 redesign) — hand-painted street signs + fluorescent market cards. Self-hosted fonts in `public/fonts/`: Bowlby One (rótulo lettering), Permanent Marker (cartulina names), Archivo variable (everything else, condensed via font-stretch). Tokens in `app/app.css`; light is default, `.dark` is the night wall. Direction contract: `.impeccable/surfaces/app-routes-index-tsx.md`.
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

## Launch scope (23 Nov 2026, narrowed)

- **Spanish only.** `SUPPORTED_LOCALES = ["es"]`; `/pt/*` and `/en/*` 301 to Spanish (`app/routes/en-redirect.tsx`). pt translations stay in the DB (`*Pt` fields) for a future relaunch.
- **Feature flags** in `app/lib/features.ts` (constants): everything is on in dev, only `true` flags show in production. Off today: `foro`, `negocios` (marcas/dispensarios/productos), `pagos` (planes + Stripe), `top100`, `porCondicion` (/para). Hidden routes 404 and leave nav, sitemap and llms.txt. Business inquiries go to contacto@weedhub.info (manual).
- **Seed hidden, not deleted.** `seed/hide-seed.mjs` marks seed docs `source: "seed"`; the `hideSeed` mongoose plugin (`app/lib/seed-filter.server.ts`) filters them from every query unless `.setOptions({ includeSeed: true })`. Strain aggregates were snapshotted to `seedSnapshot` and reset. `--restore` undoes everything.
- **Editorial review.** `app/services/content-review.server.ts` (service) → `/admin/revision` (UI route) + review actions in `app/lib/admin-actions.server.ts` (agent). Records carry `revision.{status,reviewedAt,reviewedBy}`; only a human approves in the UI; agent edits reset to "pendiente". Strain `editorialNote` is public only when approved. Drafts: `npx tsx --env-file .env scripts/generate-editorial-notes.ts`.
- Admin agent model: `claude-opus-5-5`, effort medium, full chat history. Needs `ANTHROPIC_API_KEY`.
- Dev gotcha: models are registered with `mongoose.models.X || model(...)`; after changing a schema, restart the dev server or updates silently drop new fields.

## Data caveats (Nov 2026)

- Seed batch 2026-11-23 (`seed/seed-content.mjs`, removable with `--delete`): brands/products/dispensaries (fictional, unverified), magazine articles, forum threads, condition votes, quick ratings, saved strains, 14 users from BR/CO/AR/CL/UY. QA accounts via `seed/qa-accounts.mjs`.
- Locales served: es + pt only. `/en/*` 301s to Spanish (`app/routes/en-redirect.tsx`); English strings remain in content files but are not served.
- All 1,570 reviews and 201 users were seeded on 2026-04-20 (`seed/data/reviews.json`); they are not real community activity. Owner decided to keep them for now. Don't write copy that calls them "real" or cites "miles de reseñas".
- Strain `effects` mix English and Spanish values; always go through `app/lib/effect-labels.ts` (`effectLabels`, `storedValuesFor`).
- No strain has `descriptions.pt`/`.en`; strain pages use `app/lib/strain-summary.ts` (data-built summary + FAQ) so pt/en pages aren't empty duplicates.

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
**AI pipeline (active):** Admin generates images via `app/lib/image-gen.server.ts` (fal.ai + Flux Schnell). Prompt built from strain name/terpenes/type by `app/lib/strain-image-prompt.server.ts`. Images upload to Cloudinary and update `strain.imageUrl` automatically.
- Per-strain: edit dialog → "Generar con IA" button
- Bulk: `/admin/generate-images` — Top 100 queue, 5 parallel, real-time progress

**Midjourney pipeline (deprecated):** prompts exist in `scripts/gen-midjourney-prompts.ts` but the flow is replaced by the AI pipeline above.

`StrainThumb` renders `<img>` if `imageUrl` exists, otherwise a type-colored card with the strain's initials.

### Seeding
```bash
npm run seed              # Quick seed (~50 strains)
npm run seed:full         # Full seed (870 strains + 200 users + ~1500 reviews)
npm run seed:effects      # Seed effects collection
npm run seed:csv          # Import from cannabis.csv
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
- Full strain encyclopedia (3,036 strains, search, filter, detail pages, AggregateRating schema)
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
- Sitemap with hreflang variants: strains (3,036×2, es/pt), glossary, guides, brands, dispensaries, magazine articles, community posts
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
- Quick ratings (`/api/strains/:strainId/quick-rate`) — 1-5 stars without full review
- Top 100 strains (`/top-100`) — ranked by community rating
- Cannabis glossary (`/glosario`) — definitions, admin CRUD
- Mapa Verde (`/mapa-verde`) — legal status tracker by country, admin CRUD
- Condiciones médicas (`/para`) — browse strains by health goal, `helpsWithConditions` index

**UX / Conversion:**
- Newsletter section on homepage (above CTA)
- Newsletter CTA in onboarding step 5 (peak engagement)
- Share button (`ShareButton` component) on magazine articles and guide pages
- `OnboardingNewsletter` component — inline Resend form in step 5
- Error boundaries on key detail routes

**Email:**
- Welcome email on registration (`sendWelcomeEmail`) — sender: `contacto@weedhub.info`
- Subscription confirmation email (`sendSubscriptionConfirmationEmail`)
- New comment notification (`sendNewCommentEmail`) — fires when someone comments on your post
- New follower notification (`sendNewFollowerEmail`) — fires when someone follows you

**Analytics:**
- Vercel Analytics (`@vercel/analytics`) — page views, top pages, Core Web Vitals in Vercel dashboard

**Images:**
- AI image generation pipeline — fal.ai + Flux Schnell, per-strain + bulk Top 100

**UI / Design System:**
- Full DS Button refactor — zero legacy `btn btn-*` classes across all 40+ route files

### Pending 🔧
- **Stripe live mode:** Sandbox configured and tested; needs live price IDs + live secret key for production
- **RESEND_API_KEY:** Domain verified (`contacto@weedhub.info`), needs API key added to Vercel env
- **IMAGE_GEN_API_KEY:** fal.ai key needed to activate AI image generation
- **Google Search Console:** Submit sitemap, verify hreflang indexing
- **Rate limiting:** `/auth`, `/api/newsletter`, `/recomendar` have no throttling — Vercel Firewall rules (no code needed)
- **Sentry / error logging:** No production error tracking
- **Terpene name index:** Missing `{ "terpenes.name": 1 }` on Strain model — terpene filter does full scan

### Not Yet Built ❌
- **Conversational AI agent** — `/chat` or upgraded `/recomendar` with Vercel AI SDK + tool use (next priority)
- **Review forms for brands/dispensaries/products** — models exist, no submission UI
- **Reply notifications** — `CommentModel` has no `parentId` yet; add when threaded comments ship
- **Community full UX** — no rich text editor, no notification center
- **Brand analytics dashboard** — brands can't see their own traffic/review data
- **AI content tools (admin)** — strain description enrichment, article assistant, admin chat
- **Natural language search** — Claude-powered intent parsing over strain DB
- **Legal review** — privacy policy and terms for Mexican cannabis regulations

## AI-Native Vision

WeedHub is being built as an AI-native platform. AI is not a feature add-on — it's a first-class layer across both the public app and the admin. Every content, discovery, and operational workflow should have an AI path.

### Architecture

```
Vercel AI SDK (streaming, tool use, provider-agnostic)
    ↓
Claude (Anthropic) — reasoning, chat, content         fal.ai — image generation
    ↓                                                       ↓
Tool calls → MongoDB (real strain/user data)        Cloudinary (store + CDN)
```

- **Vercel AI SDK** is the primary layer for all conversational/streaming AI in the app
- **Claude Haiku** for fast, cheap tasks (moderation, search, quick suggestions)
- **Claude Sonnet** for quality tasks (full conversations, content generation)
- **fal.ai + Flux Schnell** for image generation (~$0.003/image)
- All agents have tool access to real WeedHub data (strains, effects, glossary) — not generic cannabis knowledge
- Provider-agnostic: swap models via env var without code changes

### AI Features — Current ✅

| Feature | Route / File | Model | Notes |
|---------|-------------|-------|-------|
| Strain submission moderation | `api/admin/ai` + `app/lib/moderation.server.ts` | Claude Haiku | Optional — skips if no API key |
| AI strain recommender (wizard) | `/recomendar` | Claude Haiku | 4-step structured wizard |
| AI image generation (per-strain) | `api/admin/generate-strain-image` + edit dialog | fal.ai Flux Schnell | Admin only, preview in dialog |
| AI image generation (bulk) | `/admin/generate-images` | fal.ai Flux Schnell | Top 100 queue, 5 parallel |

### AI Features — Planned 🔧

#### Web (user-facing)

**1. Conversational strain agent** — priority next feature
- Route: upgrade `/recomendar` or new `/chat`
- Stack: Vercel AI SDK + Claude Sonnet, streaming
- Tools the agent can call:
  - `searchStrains(filters)` — queries MongoDB, returns matching strains
  - `getStrainDetail(slug)` — full strain profile
  - `getEffectInfo(effectKey)` — effect description + common strains
  - `searchGlossary(term)` — definition lookup
- Context injected per request: user's experience level, preferred effects, consumption method (from `cannabisProfile`)
- Spanish, LATAM-aware system prompt
- No login required for basic queries; logged-in users get personalized context

**2. Natural language search**
- "algo relajante para el dolor de cabeza sin quedarse dormido" → strain results
- Replaces/augments the current fuzzy Levenshtein search at `api/strain-search`
- Claude parses intent → structured filters → MongoDB query

**3. Personalized homepage recommendations**
- For logged-in users: "Para ti" section on `/` based on saved strains + review history + onboarding profile
- Claude Haiku generates the filter set; MongoDB executes it

#### Admin (operational)

**4. Strain description enrichment**
- In edit dialog: "Mejorar descripción" button → Claude rewrites/translates descriptions (ES/EN/PT)
- Also: auto-suggest terpenes/effects/flavors from the description text

**5. Magazine article assistant**
- In article editor: AI drafts article body from a title + outline
- Auto-suggests SEO meta description, tags, related strains

**6. Admin chat (natural language queries)**
- "¿Cuántas reseñas se publicaron esta semana?" → Claude queries the DB via tools and answers
- Replaces hand-written MongoDB queries for non-technical admin tasks

### AI Conventions

- All AI server code lives in `app/lib/` with `.server.ts` suffix
- `app/lib/moderation.server.ts` — submission moderation
- `app/lib/image-gen.server.ts` — image generation (provider-agnostic wrapper)
- `app/lib/strain-image-prompt.server.ts` — prompt builder (color/structure logic)
- Future: `app/lib/ai-agent.server.ts` — conversational agent tools
- All AI calls are fire-and-forget where possible; never block user actions waiting for AI
- Always degrade gracefully: if API key missing → log + return null, never throw to user

## Environment Variables

```
# Database + sessions
MONGODB_URI=            # MongoDB connection string
SESSION_SECRET=         # Session encryption (min 32 chars)

# Cloudinary (strain image upload + CDN)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Resend) — sender: contacto@weedhub.info (domain verified ✅)
RESEND_API_KEY=
RESEND_AUDIENCE_ID=

# AI — Anthropic (moderation + conversational agent)
ANTHROPIC_API_KEY=

# AI — Image generation
IMAGE_GEN_API_KEY=      # fal.ai key (https://fal.ai/dashboard/keys)
IMAGE_GEN_PROVIDER=fal  # fal | replicate | openai

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe (B2B self-serve)
STRIPE_SECRET_KEY=                   # sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=               # whsec_... (stripe listen --forward-to localhost:5173/api/stripe/webhook)
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

# Stripe dev (get webhook secret for local testing)
stripe listen --forward-to localhost:5173/api/stripe/webhook
```
