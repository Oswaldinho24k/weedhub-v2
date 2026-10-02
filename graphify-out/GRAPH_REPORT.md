# Graph Report - weedhub  (2026-10-01)

## Corpus Check
- 230 files · ~324,066 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .css 1)

## Summary
- 1398 nodes · 3371 edges · 83 communities (76 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Root & i18n Routing
- Auth & Anonymous Identity
- Cannabis Domain Constants
- Strain Visual Components
- UI Component Primitives
- Payments & Email
- Admin & Product Catalog
- Auth & API Core
- Legal Status & Maps
- Legal Content Pages
- Dialog & Modal UI
- Reviews & Points
- Educational Guides
- Product Catalog
- Medical Conditions
- SEO & Meta Tags
- Community Forum Model
- Package Dependencies
- User Levels & Badges
- Newsletter & Sharing
- Content & Locale Routing
- NPM Dependency Graph
- Review Card UI
- Build & Dev Scripts
- Strain Search & Rating
- Midjourney Image Pipeline
- Strain Card Component
- Locations & Admin Dashboard
- Database & Comments
- Newsletter & Validation
- Effects Seed Data
- TypeScript Config
- Onboarding Flow
- Glossary Model
- CSV Seed Import
- Strain Seed Script
- Strain Thumbnail
- SEO & Dictionary
- Footer Layout
- Project Architecture Docs
- Cloudinary Upload Pipeline
- Full Database Seed
- Rating Stars UI
- AI Admin Actions
- Gamification Constants
- Location Constants
- Design System Docs
- Dev Dependencies
- Genetics Seed Data
- Auth & Session
- Content Models Docs
- Platform Services Docs
- Identity Migration
- Strain Type Definitions
- Badge Component
- i18n Locale Content
- Admin Panel UI
- Brand Visual Identity
- Tabs UI Component
- Article Admin
- Brand Directory
- Effects Migration
- Dispensary Routes
- Glossary Routes
- Pexels Image Script
- Grow Data Seed
- Brand Claim Flow
- Review Model
- Review Types
- Cannabis Fallback Images
- Brand Tokens & Favicon
- AI Strain Finder
- User System Docs
- Cannabinoid Bar UI
- Review Constants
- Route Configuration
- API Type Definitions
- AI Features Docs
- Strain Photo Assets
- Session Management
- Error Boundaries
- Product Model Doc
- Default Avatar

## God Nodes (most connected - your core abstractions)
1. `connectDB()` - 159 edges
2. `Icon()` - 94 edges
3. `cn()` - 85 edges
4. `react-router` - 80 edges
5. `buildMeta()` - 68 edges
6. `requireUser()` - 46 edges
7. `react` - 46 edges
8. `useT()` - 41 edges
9. `requireAdmin()` - 39 edges
10. `SITE_URL` - 38 edges

## Surprising Connections (you probably didn't know these)
- `ConditionPage()` --calls--> `StrainCard()`  [EXTRACTED]
  app/routes/para.$condition.tsx → app/components/composite/strain-card.tsx
- `GlossaryTermPage()` --calls--> `NewsletterSignup()`  [EXTRACTED]
  app/routes/glosario.$slug.tsx → app/components/layout/newsletter-signup.tsx
- `Promise()` --calls--> `Icon()`  [EXTRACTED]
  app/routes/auth.tsx → app/components/ui/icon.tsx
- `ResetPasswordPage()` --calls--> `Icon()`  [EXTRACTED]
  app/routes/auth_.reset-password.tsx → app/components/ui/icon.tsx
- `EditarMarcaPage()` --calls--> `Icon()`  [EXTRACTED]
  app/routes/marcas.$slug_.editar.tsx → app/components/ui/icon.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **B2B Monetization Flow: Brand/Dispensary + Stripe + Resend** — claude_model_brand, claude_model_dispensary, claude_stripe_b2b_flow, claude_resend_email [EXTRACTED 0.95]
- **AI Content Moderation: StrainSubmission + Haiku + Admin** — claude_model_strainsubmission, claude_anthropic_haiku_moderation, claude_admin_panel [EXTRACTED 0.90]
- **SEO + i18n + robots.txt: multilingual discoverability stack** — claude_seo_system, claude_i18n_3locales, claude_robots_txt [INFERRED 0.85]

## Communities (83 total, 7 thin omitted)

### Community 0 - "App Root & i18n Routing"
Cohesion: 0.05
Nodes (48): LanguageSwitcher(), switchTo(), Logo(), LogoProps, MinimalNav(), MinimalNavProps, MenuItem(), Navbar() (+40 more)

### Community 1 - "Auth & Anonymous Identity"
Cohesion: 0.05
Nodes (44): ADJECTIVES, CREATURES, fourDigit(), generateAnonymousHandle(), random(), createUserSession(), hashPassword(), verifyPassword() (+36 more)

### Community 2 - "Cannabis Domain Constants"
Cohesion: 0.06
Nodes (44): CONSUMPTION_METHODS, EFFECTS, FLAVORS, STRAIN_TYPES, TERPENES, isValidAcquisitionSource(), isValidCountry(), ALLOWED_TYPES (+36 more)

### Community 3 - "Strain Visual Components"
Cohesion: 0.06
Nodes (41): EffectBar(), EffectBarProps, ConnectorArrow(), GeneticNode, GeneticTree(), GeneticTreeProps, NodePill(), rawParents() (+33 more)

### Community 4 - "UI Component Primitives"
Cohesion: 0.07
Nodes (29): EffectsChipGroup(), EffectsChipGroupProps, Avatar, AvatarProps, sizeClasses, Card, CardContent, CardFooter (+21 more)

### Community 5 - "Payments & Email"
Cohesion: 0.08
Nodes (27): sendSubscriptionConfirmationEmail(), createCheckoutSession(), createPortalSession(), getPriceId(), PLAN_NAMES, PLAN_PRICES, PRICE_IDS, stripe (+19 more)

### Community 6 - "Admin & Product Catalog"
Cohesion: 0.09
Nodes (23): registry, requireAdmin(), IProductCategory, ProductCategoryModel, productCategorySchema, action(), loader(), action() (+15 more)

### Community 7 - "Auth & API Core"
Cohesion: 0.10
Nodes (23): getUserFromSession(), requireUser(), connectDB(), action(), action(), action(), loader(), loader() (+15 more)

### Community 8 - "Legal Status & Maps"
Cohesion: 0.11
Nodes (23): CountryFlag(), FLAG_MAP, FlagComponent, STATUS_DOT_STYLE, STATUS_LABEL, STATUS_PILL, STATUS_PILL_STYLE, ILegalStatus (+15 more)

### Community 9 - "Legal Content Pages"
Cohesion: 0.13
Nodes (20): LegalPage(), LegalPageProps, PRIVACY_SECTIONS_EN, TERMS_SECTIONS_EN, LEGAL_COMPANY, LegalSection, PRIVACY_SECTIONS, TERMS_SECTIONS (+12 more)

### Community 10 - "Dialog & Modal UI"
Cohesion: 0.16
Nodes (16): Dialog(), DialogFooter(), DialogHeader(), DialogProps, AdminEffects(), ApprovedRow(), PendingCard(), SerializedEffect (+8 more)

### Community 11 - "Reviews & Points"
Cohesion: 0.14
Nodes (19): POINTS, action(), action(), action(), action(), ChipButton(), ChipSection(), DetailRating() (+11 more)

### Community 12 - "Educational Guides"
Cohesion: 0.14
Nodes (16): GUIDES_EN, Guide, GUIDES_ES, GuideSection, GUIDES_PT, ArticleCategory, ArticleLocale, ArticleModel (+8 more)

### Community 13 - "Product Catalog"
Cohesion: 0.11
Nodes (16): ProductCard(), ProductCardProps, IProduct, ProductModel, productSchema, loader(), meta(), ProductosPage() (+8 more)

### Community 14 - "Medical Conditions"
Cohesion: 0.11
Nodes (15): Condition, CONDITION_CATEGORY_LABELS, ConditionCategory, CONDITIONS, CONDITIONS_BY_SLUG, CATEGORY_ORDER, ConditionPage(), loader() (+7 more)

### Community 15 - "SEO & Meta Tags"
Cohesion: 0.10
Nodes (16): BRAND_IMAGE, BuildMetaOptions, DEFAULT_OG_IMAGE, LocaleKey, normLocale(), OG_LOCALE, SITE_NAME, SITE_URL (+8 more)

### Community 16 - "Community Forum Model"
Cohesion: 0.11
Nodes (14): IPost, PostCategory, PostModel, postSchema, action(), CAT_COLORS, CATEGORIES, ComunidadPage() (+6 more)

### Community 17 - "Package Dependencies"
Cohesion: 0.09
Nodes (21): name, private, type, bcryptjs, clsx, isbot, lucide-react, react-dom (+13 more)

### Community 18 - "User Levels & Badges"
Cohesion: 0.10
Nodes (16): ExperienceBadge(), ExperienceBadgeProps, LEVEL_CONFIG, Icon(), AdminArticlesPage(), AdminBrands(), AdminCommunityPage(), AdminDispensaries() (+8 more)

### Community 19 - "Newsletter & Sharing"
Cohesion: 0.14
Nodes (13): NewsletterSignup(), State, ShareButton(), ShareButtonProps, useToast(), getGuide(), GuiaDetailPage(), loader() (+5 more)

### Community 20 - "Content & Locale Routing"
Cohesion: 0.16
Nodes (16): getCommunityVoices(), getFeaturedArticles(), useLocale(), resolveLocale(), CommunityPage(), loader(), meta(), EditorialPage() (+8 more)

### Community 21 - "NPM Dependency Graph"
Cohesion: 0.10
Nodes (21): dependencies, @anthropic-ai/sdk, arctic, bcryptjs, class-variance-authority, cloudinary, clsx, country-flag-icons (+13 more)

### Community 22 - "Review Card UI"
Cohesion: 0.16
Nodes (17): AuthorHeader(), ReviewCard(), ReviewCardProps, BadgeWithPriority, getShowcaseBadge(), ReviewAuthor, reviewDisplay, ReviewLike (+9 more)

### Community 23 - "Build & Dev Scripts"
Cohesion: 0.10
Nodes (20): scripts, build, dev, images:pexels, images:pexels:dry, migrate:aliases, migrate:effects, migrate:identity (+12 more)

### Community 24 - "Strain Search & Rating"
Cohesion: 0.15
Nodes (12): StrainMatch, IQuickRating, QuickRatingModel, quickRatingSchema, IStrain, Momento, StrainModel, strainSchema (+4 more)

### Community 25 - "Midjourney Image Pipeline"
Cohesion: 0.12
Nodes (18): args, batchArg, BUD_STRUCTURE, buildPrompt(), __dirname, __filename, getColorDescription(), LIGHTING_ACCENT (+10 more)

### Community 26 - "Strain Card Component"
Cohesion: 0.19
Nodes (13): StrainCard(), StrainCardProps, TYPE_LABEL, TYPE_PILL, useT(), SavedStrainsPage(), FilterChip(), loader() (+5 more)

### Community 27 - "Locations & Admin Dashboard"
Cohesion: 0.17
Nodes (13): ACQUISITION_SOURCES, countryFlag(), countryLabel(), formatDate(), loader(), SOURCE_LABELS, AdminUsersPage(), UserRow() (+5 more)

### Community 28 - "Database & Comments"
Cohesion: 0.15
Nodes (10): CommentModel, commentSchema, IComment, action(), loader(), CAT_COLORS, CommentCard(), ComunidadSlugPage() (+2 more)

### Community 29 - "Newsletter & Validation"
Cohesion: 0.13
Nodes (12): getClient(), subscribeEmail(), SubscribeResult, authSchema, onboardingSchema, profileSchema, reviewSchema, strainSchema (+4 more)

### Community 30 - "Effects Seed Data"
Cohesion: 0.13
Nodes (11): EFFECTS_CATALOG, envPath, DRY, envPath, KNOWN_ALIASES, run(), slugifyAlias(), CATEGORIES (+3 more)

### Community 31 - "TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, baseUrl, esModuleInterop, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 32 - "Onboarding Flow"
Cohesion: 0.18
Nodes (13): IconName, EXPERIENCE, GOALS, METHODS, OnboardingNewsletter(), OnboardingPage(), RadioCard(), RadioOpt (+5 more)

### Community 33 - "Glossary Model"
Cohesion: 0.15
Nodes (10): GlossaryCategory, GlossaryTermModel, glossaryTermSchema, IGlossaryTerm, CATEGORY_LABELS, GlossaryTermPage(), loader(), __dirname (+2 more)

### Community 34 - "CSV Seed Import"
Cohesion: 0.19
Nodes (15): COLOR_PALETTE, colorHint(), difficulty(), __dirname, envPath, __filename, hashCode(), main() (+7 more)

### Community 35 - "Strain Seed Script"
Cohesion: 0.17
Nodes (15): COLOR_PALETTE, colorHint(), difficulty(), __dirname, dominantTerpene(), envPath, __filename, hashCode() (+7 more)

### Community 36 - "Strain Thumbnail"
Cohesion: 0.16
Nodes (12): FALLBACK_BUDS, hashCode(), ratioClass, StrainThumb(), StrainThumbProps, TERPENE_COLOR, TYPE_CONFIG, loader() (+4 more)

### Community 37 - "SEO & Dictionary"
Cohesion: 0.18
Nodes (15): getDictionary(), buildMeta(), meta(), meta(), meta(), meta(), meta(), meta() (+7 more)

### Community 38 - "Footer Layout"
Cohesion: 0.24
Nodes (10): Footer(), FooterColumn(), FooterLink(), getGuides(), LocaleContext, LocaleContextValue, useHref(), useLocaleContext() (+2 more)

### Community 39 - "Project Architecture Docs"
Cohesion: 0.16
Nodes (14): Admin Panel (14 sections), Cloudinary (image upload + CDN), cn() utility (clsx + tailwind-merge), i18n: es / en / pt prefix routing, Image Pipeline (Pexels fallback + Midjourney + Cloudinary), Onboarding Flow (5-step), Pexels API (image fallback), React Router v7 (SSR) (+6 more)

### Community 40 - "Cloudinary Upload Pipeline"
Cohesion: 0.15
Nodes (13): cloudinary, args, CARDS_DIR, __dirname, DRY_RUN, envPath, __filename, limitArg (+5 more)

### Community 41 - "Full Database Seed"
Cohesion: 0.20
Nodes (13): COLOR_PALETTE, colorHint(), difficulty(), __dirname, dominantTerpene(), envPath, __filename, hashCode() (+5 more)

### Community 42 - "Rating Stars UI"
Cohesion: 0.22
Nodes (9): pixelSize, RatingStars(), RatingStarsProps, Star(), AdminReviewsPage(), DeleteBtn(), loader(), ModBtn() (+1 more)

### Community 43 - "AI Admin Actions"
Cohesion: 0.22
Nodes (9): ActionResult, actionsToClaudeTools(), AdminAction, adminActions, EffectModel, effectSchema, IEffect, action() (+1 more)

### Community 44 - "Gamification Constants"
Cohesion: 0.27
Nodes (9): BADGE_BY_ID, BADGES, getCurrentLevel(), getNextLevel(), Level, LEVELS, ProfilePage(), StatPill() (+1 more)

### Community 45 - "Location Constants"
Cohesion: 0.20
Nodes (8): ACQUISITION_VALUES, AcquisitionSource, Country, COUNTRY_CODES, LATIN_COUNTRIES, action(), loader(), toSlug()

### Community 46 - "Design System Docs"
Cohesion: 0.18
Nodes (10): Tailwind CSS v4 with oklch token system, Responsive Breakpoints, Chip Component (selectable, context-aware colors), Lucide React Icons, oklch Design Tokens (dark + light), StrainThumb Component (SVG trichome), TerpeneRadar SVG Component, TimeCurve SVG Data Viz (+2 more)

### Community 47 - "Dev Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, @react-router/dev, tailwindcss, @tailwindcss/vite, tsx, @types/bcryptjs, @types/node, @types/react (+4 more)

### Community 48 - "Genetics Seed Data"
Cohesion: 0.17
Nodes (7): __dirname, envPath, __filename, data, __dirname, envPath, __filename

### Community 49 - "Auth & Session"
Cohesion: 0.25
Nodes (5): logout(), action(), action(), sessionStorage, react-router

### Community 50 - "Content Models Docs"
Cohesion: 0.22
Nodes (11): Article Model, Brand Model, Dispensary Model, LegalStatus Model, Post Model (community), QuickRating Model, Review Model, Strain Model (+3 more)

### Community 51 - "Platform Services Docs"
Cohesion: 0.18
Nodes (10): GlossaryTerm Model, Resend (newsletter / email), Stripe B2B Subscription Flow, Sesión J: Brand Verification Flow (monetization), Sesión D: Similar Strains (recommendation algorithm), Competitive References: Leafly + Weedmaps, Sesión B: Medical Conditions (/para/:condition), Sesión K: Dispensary Directory (/dispensarios) (+2 more)

### Community 52 - "Identity Migration"
Cohesion: 0.27
Nodes (10): ADJECTIVES, CREATURES, DRY, envPath, fourDigit(), rand(), run(), slugify() (+2 more)

### Community 53 - "Strain Type Definitions"
Cohesion: 0.20
Nodes (9): CannabinoidProfile, Momento, ReviewDistribution, Strain, StrainFilters, StrainRatings, StrainType, TerpeneEntry (+1 more)

### Community 54 - "Badge Component"
Cohesion: 0.28
Nodes (7): Badge, BadgeProps, badgeVariants, Button, ButtonProps, buttonVariants, class-variance-authority

### Community 55 - "i18n Locale Content"
Cohesion: 0.44
Nodes (5): en, Dictionary, es, DICTIONARIES, pt

### Community 56 - "Admin Panel UI"
Cohesion: 0.25
Nodes (5): AdminChat(), AdminLayout(), ChatMsg, loader(), NAV_ITEMS

### Community 57 - "Brand Visual Identity"
Cohesion: 0.33
Nodes (9): Brand Background Color oklch(16% 0.025 150), Brand Text Color 'hub' oklch(76% 0.17 145) green, Brand Text Color 'weed' oklch(94% 0.015 85) warm off-white, Fraunces Variable Font (opsz 144, SOFT axis, weight 500), JetBrains Mono Font (defined in brand SVG, not used in wordmark), Radial Gradient Atmospheric Overlay (top-left warm highlight), WeedHub Brand Logo SVG, OKLCH Color Token System (+1 more)

### Community 58 - "Tabs UI Component"
Cohesion: 0.25
Nodes (5): TabsContext, TabsContextType, TabsList(), TabsProps, TabsTrigger()

### Community 59 - "Article Admin"
Cohesion: 0.29
Nodes (6): action(), ArticleForm(), CATEGORIES, loader(), MarkdownPreview(), SerializedArticle

### Community 60 - "Brand Directory"
Cohesion: 0.32
Nodes (6): BrandCard(), COUNTRY_NAMES, EmptyState(), loader(), MarcasPage(), meta()

### Community 61 - "Effects Migration"
Cohesion: 0.29
Nodes (7): __dirname, envPath, ES_TO_EN_EFFECTS, ES_TO_EN_FLAVORS, __filename, main(), migrateList()

### Community 62 - "Dispensary Routes"
Cohesion: 0.33
Nodes (3): DispensariosPage(), DispensaryRow(), loader()

### Community 63 - "Glossary Routes"
Cohesion: 0.29
Nodes (4): CATEGORY_LABELS, CATEGORY_ORDER, loader(), meta()

### Community 64 - "Pexels Image Script"
Cohesion: 0.38
Nodes (6): buildImagePool(), DRY_RUN, LIMIT, main(), pexelsSearch(), SEARCH_QUERIES

### Community 65 - "Grow Data Seed"
Cohesion: 0.29
Nodes (5): Climate, __dirname, envPath, GROW_DATA, GrowEntry

### Community 66 - "Brand Claim Flow"
Cohesion: 0.40
Nodes (3): sendClaimNotificationEmail(), action(), loader()

### Community 67 - "Review Model"
Cohesion: 0.33
Nodes (5): IReview, ReviewEntityType, ReviewModel, reviewSchema, ReviewType

### Community 68 - "Review Types"
Cohesion: 0.40
Nodes (5): RatingCategories, Review, ReviewContext, ReviewStatus, StrainReview

### Community 69 - "Cannabis Fallback Images"
Cohesion: 0.40
Nodes (3): Cannabis Bud Fallback Image 0, Cannabis Bud Fallback Image 1, Cannabis Bud Fallback Image 3

### Community 70 - "Brand Tokens & Favicon"
Cohesion: 0.47
Nodes (4): Fraunces Variable Font, JetBrains Mono Font, WeedHub Favicon SVG, WeedHub Open Graph Default Image

### Community 71 - "AI Strain Finder"
Cohesion: 0.60
Nodes (3): action(), getClient(), serializeStrain()

### Community 72 - "User System Docs"
Cohesion: 0.40
Nodes (5): Dual Identity (username + anonymousHandle), Follow System (user-to-user), Gamification System (badges, levels, points), User Model, Sesión L: Community Forums (/comunidad)

### Community 74 - "Review Constants"
Cohesion: 0.50
Nodes (3): CONTEXT_SETTINGS, RATING_CATEGORIES, TIME_OF_DAY_OPTIONS

### Community 76 - "API Type Definitions"
Cohesion: 0.50
Nodes (3): ActionResponse, LoaderData, PaginatedResponse

### Community 77 - "AI Features Docs"
Cohesion: 0.67
Nodes (4): AI Strain Recommender (/recomendar), Anthropic Claude Haiku (AI moderation), StrainSubmission Model, Sesión H: AI Find My Strain (user-facing)

## Knowledge Gaps
- **431 isolated node(s):** `CannabinoidBarProps`, `toneColor`, `EffectBarProps`, `EffectsChipGroupProps`, `ExperienceBadgeProps` (+426 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 587 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router` connect `Auth & Session` to `App Root & i18n Routing`, `Auth & Anonymous Identity`, `Cannabis Domain Constants`, `Strain Visual Components`, `Payments & Email`, `Admin & Product Catalog`, `Auth & API Core`, `Legal Status & Maps`, `Legal Content Pages`, `Dialog & Modal UI`, `Reviews & Points`, `Product Catalog`, `Medical Conditions`, `SEO & Meta Tags`, `Community Forum Model`, `Package Dependencies`, `Newsletter & Sharing`, `Content & Locale Routing`, `Review Card UI`, `Strain Search & Rating`, `Strain Card Component`, `Locations & Admin Dashboard`, `Database & Comments`, `Onboarding Flow`, `Glossary Model`, `Strain Thumbnail`, `Footer Layout`, `Rating Stars UI`, `Gamification Constants`, `Location Constants`, `Admin Panel UI`, `Article Admin`, `Brand Directory`, `Dispensary Routes`, `Glossary Routes`, `Brand Claim Flow`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `mongoose` connect `Strain Search & Rating` to `Auth & Anonymous Identity`, `Cannabis Domain Constants`, `Strain Visual Components`, `Payments & Email`, `Admin & Product Catalog`, `Legal Status & Maps`, `Educational Guides`, `Product Catalog`, `Community Forum Model`, `Package Dependencies`, `Database & Comments`, `Effects Seed Data`, `Glossary Model`, `CSV Seed Import`, `Strain Seed Script`, `Full Database Seed`, `AI Admin Actions`, `Genetics Seed Data`, `Identity Migration`, `Effects Migration`, `Pexels Image Script`, `Grow Data Seed`, `Review Model`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `connectDB()` connect `Auth & API Core` to `Auth & Anonymous Identity`, `Cannabis Domain Constants`, `Strain Visual Components`, `Payments & Email`, `Admin & Product Catalog`, `Legal Status & Maps`, `Dialog & Modal UI`, `Reviews & Points`, `Educational Guides`, `Product Catalog`, `Medical Conditions`, `SEO & Meta Tags`, `Community Forum Model`, `Newsletter & Sharing`, `Content & Locale Routing`, `Strain Search & Rating`, `Strain Card Component`, `Locations & Admin Dashboard`, `Database & Comments`, `Onboarding Flow`, `Glossary Model`, `Strain Thumbnail`, `Rating Stars UI`, `AI Admin Actions`, `Gamification Constants`, `Location Constants`, `Auth & Session`, `Article Admin`, `Brand Directory`, `Dispensary Routes`, `Glossary Routes`, `Brand Claim Flow`, `AI Strain Finder`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `CannabinoidBarProps`, `toneColor`, `EffectBarProps` to the rest of the system?**
  _431 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Root & i18n Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.05157894736842105 - nodes in this community are weakly interconnected._
- **Should `Auth & Anonymous Identity` be split into smaller, more focused modules?**
  _Cohesion score 0.05370843989769821 - nodes in this community are weakly interconnected._
- **Should `Cannabis Domain Constants` be split into smaller, more focused modules?**
  _Cohesion score 0.06498015873015874 - nodes in this community are weakly interconnected._