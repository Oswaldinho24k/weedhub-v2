# WeedHub — Roadmap de Producto

> Última actualización: Octubre 2026
> Basado en análisis competitivo de Leafly + Weedmaps + estrategia LATAM-first con AI.

---

## Visión

**Democratizar el conocimiento del cannabis en el mundo hispanohablante y lusófono.**

WeedHub no es un marketplace. Es la enciclopedia, la comunidad y la fuente de verdad del cannabis para América Latina y el mundo de habla hispana. Cuando alguien en México, Colombia, Argentina, Chile, Perú o Brasil quiera entender el cannabis — sus efectos, su cultura, su historia, su estatus legal, sus cepas — WeedHub es el lugar.

**Idiomas:**
- Español primario — LATAM es el core, 450M+ hispanohablantes
- Português — Brasil es el mercado más grande de la región, ya tenemos i18n en pt
- English — para contenido que trasciende fronteras o usuarios bilingües, no el foco

**Filosofía de contenido:**
- Conocimiento primero, comercio después
- Comunidad de consumidores y cultivadores, no solo turistas de dispensario
- Información legal precisa y actualizada sin sensacionalismo
- Vanguardia legal: siempre saber y comunicar qué está pasando con la legalización

---

## Contexto estratégico

WeedHub es la única enciclopedia de cannabis de profundidad en español para LATAM.
Ni Leafly ni Weedmaps sirven México/LATAM — Weedmaps muestra pantalla de bloqueo a usuarios en CDMX.

**Arquitectura ganadora:** enciclopedia + comunidad primero → comercio después.  
Las marcas y dispensarios vendrán cuando tengamos la audiencia.

**Ventajas estructurales:**
- Español + Portugués como lenguas primarias (cero competidores a este nivel en LATAM)
- AI-native desde el día 1 (ningún competidor tiene AI visible)
- Modelo de publicación anónima (importante en LATAM por estigma)
- Gamificación de comunidad (Leafly/Weedmaps no tienen)
- Foco en legalización: información legal por país/estado como ningún otro

---

## Estado actual (Octubre 2026) ✅

- [x] 870 cepas con búsqueda, filtros, páginas de detalle
- [x] Sistema de reseñas (6 categorías, contexto de consumo, efectos)
- [x] Ratings rápidos (1-5 estrellas sin review completa)
- [x] Auth + roles (user / admin / moderator)
- [x] Perfiles de usuario con gamificación (8+ badges, 5 niveles, puntos)
- [x] Sistema de follows + cepas guardadas
- [x] Onboarding flow (5 pasos)
- [x] Panel admin: 14 secciones (cepas, reseñas, sugerencias, efectos, usuarios, marcas, productos, dispensarios, categorías, legal-status, glosario, artículos, comunidad, dashboard)
- [x] Admin AI-native chat (Claude Haiku, agent-native actions)
- [x] SEO: meta tags, OG, JSON-LD, sitemap multilingual, hreflang en todas las rutas
- [x] i18n: es / en / pt con prefix routing
- [x] Dark/light theme
- [x] Newsletter (Resend)
- [x] AI moderación de sugerencias (Anthropic)
- [x] 10 guías educativas en 3 idiomas
- [x] Email de bienvenida + confirmación de suscripción
- [x] Modelo polimórfico Review (strain / product / brand / dispensary)
- [x] Modelos: Brand, Product, ProductCategory, Dispensary, Article, LegalStatus, GlossaryTerm
- [x] Admin CRUD: Categorías, Marcas, Productos, Dispensarios, Glosario, Artículos, Legal Status
- [x] Docker + Vercel deployment
- [x] **Sesión A** — Mapa Verde (`/mapa-verde`, `/mapa-verde/:country`, admin CRUD)
- [x] **Sesión B** — Glosario (`/glosario`, `/glosario/:slug`, admin CRUD)
- [x] **Sesión B** — Condiciones médicas (`/para`, `/para/:condition`, `helpsWithConditions` en cepas)
- [x] **Sesión E** — Ratings rápidos (`QuickRating` model, API, UI inline)
- [x] **Sesión F** — Top 100 (`/top-100`)
- [x] **Sesión H** — AI Find My Strain (`/recomendar`, `/api/ai/find-strain`)
- [x] **Sesión I** — Magazine/Blog (`/magazine`, `/magazine/:slug`, admin, RSS)
- [x] **Sesión J** — Brand Verification + Stripe (checkout, webhook, portal, claim flow, `/planes`)
- [x] **Sesión L** — Comunidad/Foros (`/comunidad`, posts, comments, voting, dual-identity)

---

## Sesiones en progreso / pendientes

Cada sesión = una feature completa de punta a punta (modelo → admin → public route → SEO).

---

### SESIÓN C — Grow info por cepa
**Impacto: SEO alto | Esfuerzo: medio | Monetización: baja (tráfico cultivadores)**

Cultivadores en casa = audiencia masiva en LATAM. "Cómo cultivar Blue Dream" = cero competencia en español.

- [ ] Agregar `growInfo` al modelo Strain: difficulty, height, yield, floweringWeeks, indoor, outdoor, techniques[]
- [ ] Seed: poblar grow info con Claude Haiku batch (extraer de fuentes abiertas)
- [ ] Sección visual en página de cepa (meters: dificultad, rendimiento, semanas)
- [ ] Filtro "Para cultivar" en `/strains`
- [ ] Hub `/cultivo` con guías de cultivo + links a cepas por dificultad
- [ ] 10-15 guías de cultivo en `/guias` (seed-to-harvest, SOG/SCROG, cosecha, cura)

---

### SESIÓN D — Cepas similares (algoritmo de recomendación)
**Impacto: SEO alto (linking interno) | Esfuerzo: bajo | Monetización: baja**

Mejora retención, reduce bounce rate, genera linking interno (topic clusters). Ambos competidores lo tienen.

- [ ] Query MongoDB: similitud por terpenos compartidos + efectos + tipo
- [ ] Sección "Cepas similares" en página de detalle (4-6 tarjetas)
- [ ] "Si te gusta X, prueba Y" — copy en español
- [ ] API endpoint `/api/strains/:slug/similar`
- [ ] Integrar en recomendaciones del AI chat (admin + futuro user-facing)

---

### SESIÓN G — Árbol de genética por cepa
**Impacto: SEO medio-alto | Esfuerzo: medio | Monetización: baja**

Leafly tiene visualización de árbol (padre → cepa → hijos). Alta diferenciación visual y bueno para linking interno.

- [ ] Agregar `genetics.parent1`, `genetics.parent2`, `genetics.children[]` al modelo (ya existen parent1/2, falta children)
- [ ] Seed: mapear genética de las 870 cepas
- [ ] Componente visual `GeneticTree` (SVG o librería de grafos simple)
- [ ] Sección en página de cepa
- [ ] Links cruzados padre ↔ hijo ↔ hermano

---

### SESIÓN K — Directorio de Dispensarios (público)
**Impacto: SEO local alto | Esfuerzo: medio | Monetización: media**

Cuando México legalice, el directorio de dispensarios es el revenue principal (igual que Weedmaps).
Empezar ahora con clubes/asociaciones, tiendas de hemp, grow shops.

- [ ] Página pública `/dispensarios` con mapa + lista
- [ ] Página pública `/dispensarios/:slug`
- [ ] Filtros: ciudad, estado, tipo, verificado
- [ ] Google Maps embed (o Leaflet/OSM para evitar costos)
- [ ] "Agregar mi dispensario" → formulario de solicitud
- [ ] Reviews de dispensarios (usa el Review model polimórfico ya hecho)

---

### SESIÓN M — Catálogo público de Productos
**Impacto: SEO medio + monetización | Esfuerzo: medio | Monetización: alta (promoted listings)**

Las páginas de producto son el puente entre el directorio de marcas y las reseñas de productos.

- [ ] Página pública `/productos` con filtros (marca, categoría, precio)
- [ ] Página pública `/productos/:slug` con galería, info, reviews
- [ ] Reviews de producto (usa Review model polimórfico)
- [ ] "Producto promovido" badge (monetización)
- [ ] Seed: categorías de producto iniciales (flower, preroll, vape, edible, concentrate, topical, accessory)

---

### SESIÓN N — Perfiles de usuario mejorados
**Impacto: comunidad alto | Esfuerzo: medio | Monetización: baja**

- [ ] Historial de reseñas público (con filtro anónimo/username)
- [ ] Cepas guardadas públicas (opcional)
- [ ] Badges visibles en perfil
- [ ] "Experto en X" basado en badges admin-granted
- [ ] Seguir a otros usuarios
- [ ] Feed de actividad

---

---

## Infraestructura pendiente (quick wins)

Estos no son features — son gaps de producción que hay que cerrar antes de que llegue tráfico real.

| Prioridad | Item | Esfuerzo | Notas |
|---|---|---|---|
| 🔴 Alta | **Rate limiting** en `/auth`, `/api/newsletter`, `/api/ai/find-strain` | ~30 min | Vercel Firewall rules, sin código |
| 🔴 Alta | **SESSION_SECRET fallback** — `app/sessions.server.ts` tiene `\|\| "dev-secret-change-me"` | 5 min | Cambiar a `throw new Error(...)` |
| 🔴 Alta | **Sentry** — cero visibilidad de errores en producción | ~1h | `@sentry/react`, tier gratuito |
| 🟡 Media | **Terpene index** — falta `{ "terpenes.name": 1 }` en Strain model | 5 min | Full scan en filtro de terpenos |
| 🟡 Media | **Resend domain verification** — `hola@weedhub.info` va a spam | ~15 min | DNS TXT record |
| 🟡 Media | **Google Search Console** — sin visibilidad de hreflang indexing | ~10 min | Crítico para LATAM SEO |
| 🟡 Media | **Stripe live mode** — precio IDs de test en producción | ~30 min | Swap keys + price IDs |
| 🟢 Baja | **Pexels en prod DB** — cepas sin imagen en producción | ~5 min | `npm run images:pexels` contra prod |

---

## Stack técnico adicional planificado

| Herramienta | Para qué |
|---|---|
| Stripe | Pagos de tiers Premium/Enterprise |
| Resend (ampliar) | Flows: confirmación de claim, digest semanal, notificación de review |
| Cloudinary (ya activo) | Cover images de artículos, logos de marcas |
| Mapbox / Leaflet | Mapa de dispensarios |
| Tiptap o SimpleMDE | Editor Markdown para blog admin |
| Vercel Analytics (activo) | Métricas de tráfico |
| PostHog (futuro) | A/B testing, funnels de conversión |

---

## Métricas de éxito por fase

| Métrica | Hoy (Oct 2026) | Meta 6 meses | Meta 12 meses |
|---|---|---|---|
| Cepas indexadas | 870 | 3,000 | 8,000+ |
| Términos en glosario | activo (seed) | 200 | 500 |
| Artículos de blog | activo (magazine) | 30 | 100 |
| Marcas verificadas | 0 (Stripe en test) | 10 | 50 |
| MRR | $0 | $500 | $5,000 |
| Usuarios registrados | ~seed | 500 | 5,000 |
| Reseñas totales | ~seed | 2,000 | 15,000 |

---

## Orden recomendado (actualizado Octubre 2026)

```
[Infra]  SESSION_SECRET + Rate limiting + Sentry  → seguridad/visibilidad antes de tráfico
[Infra]  Terpene index + Resend DNS + GSC          → SEO + deliverability
D (Cepas similares)    → mayor impacto incompleto: retención, linking interno, bajo esfuerzo
C (Grow info)          → audiencia cultivadores, data existe, falta UI
G (Árbol genética)     → componente existe, seed existe, falta integración en detalle
K (Dispensarios mapa)  → directorio funciona, mapa es el diferenciador real
M (Productos reviews)  → rutas existen, reviews de producto completan el modelo polimórfico
N (Perfiles mejorados) → activity feed + "Experto en X" después de comunidad activa
```

### Por qué el Mapa Verde va primero

Es el feature más único que nadie más tiene en español. Crea autoridad editorial inmediata —
medios, activistas y abogados lo van a enlazar. Y cada vez que un país actualiza sus leyes
(México, Colombia, Brasil, Alemania, etc.) WeedHub es la fuente de referencia en español.
Es también el puente perfecto hacia el contenido legal del blog y hacia la comunidad:
la gente busca "¿es legal en mi país?" antes de buscar cepas.
