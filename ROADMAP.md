# WeedHub — Roadmap de Producto

> Última actualización: Julio 2026
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

## Estado actual (Julio 2026) ✅

- [x] 870 cepas con búsqueda, filtros, páginas de detalle
- [x] Sistema de reseñas (6 categorías, contexto de consumo, efectos)
- [x] Auth + roles (user / admin / moderator)
- [x] Perfiles de usuario con gamificación (8+ badges, 5 niveles, puntos)
- [x] Onboarding flow
- [x] Panel admin: cepas, reseñas, sugerencias, efectos, usuarios
- [x] Admin AI-native chat (Claude Haiku, agent-native actions)
- [x] SEO: meta tags, OG, JSON-LD, sitemap multilingual, hreflang
- [x] i18n: es / en / pt con prefix routing
- [x] Dark/light theme
- [x] Newsletter (Resend)
- [x] AI moderación de sugerencias (Anthropic)
- [x] 10 guías educativas en 3 idiomas
- [x] Email de bienvenida (fire-and-forget)
- [x] Modelo polimórfico Review (strain / product / brand / dispensary)
- [x] Modelos: Brand, Product, ProductCategory, Dispensary, Article
- [x] Admin CRUD: Categorías, Marcas, Productos, Dispensarios
- [x] Rutas públicas stub: /marcas, /productos, /dispensarios
- [x] Script migración reviews → polimórfico
- [x] Docker deployment config

---

## Sesiones pendientes

Cada sesión = una feature completa de punta a punta (modelo → admin → public route → SEO).

---

### SESIÓN A — El Mapa Verde 🗺️ `/mapa-verde`
**Impacto: SEO muy alto + diferenciador único | Esfuerzo: medio | Monetización: media (autoridad + tráfico)**

El Mapa Verde es el tracker de legalización del cannabis en el mundo, con foco en LATAM. Nadie hace esto bien en español. Ningún competidor lo tiene. Es un recurso que medios, activistas, abogados y consumidores van a enlazar — tráfico de autoridad.

Para cada país/estado/provincia: estatus legal actual, tipo de uso permitido (medicinal / recreativo / descriminalizado / ilegal), fecha del último cambio de ley, resumen de la ley en español simple, qué puedes y no puedes hacer, hacia dónde va el debate.

- [ ] Modelo `LegalStatus` (country, region?, status: "legal-rec" | "legal-med" | "decriminalized" | "illegal", since?: Date, notes, sources[], updatedAt)
- [ ] Seed inicial: 20 países LATAM + Brasil + España + principales estados de México (CDMX, NL, JAL, etc.)
- [ ] Admin CRUD `/admin/legal-status` — actualizar cuando cambie la ley
- [ ] Ruta pública `/mapa-verde` — mapa mundial (SVG o Mapbox) + lista por región coloreada (verde / amarillo / rojo)
- [ ] Detalle por país `/mapa-verde/:country` — resumen legal, qué se permite, historia, fuentes
- [ ] Detalle por región `/mapa-verde/:country/:region` (para países con estados)
- [ ] Sección "Noticias legales recientes" (artículos del blog filtrados por categoría "legal")
- [ ] JSON-LD: FAQPage con preguntas frecuentes por país ("¿Es legal el cannabis en México?")
- [ ] Widget embebido en homepage — "¿Es legal en tu país?" con selector
- [ ] Alertas: cuando se actualice una ley, notificar a suscriptores de ese país
- [ ] i18n en/pt para Brasil y mercado anglosajón

---

### SESIÓN B — Glosario de Cannabis `/glosario`
**Impacto: SEO muy alto | Esfuerzo: bajo | Monetización: media (tráfico → conversión)**

El glosario es el quick win más grande: 150-200 términos en español donde no existe competencia.
Queries como "¿qué es el live resin?", "¿qué son los terpenos?", "¿qué es decarboxilación?" rankean rápido.

- [ ] Modelo `GlossaryTerm` (key, labelEs, definition, category, relatedTerms[], relatedStrains[])
- [ ] Seed inicial: ~50 términos prioritarios (terpenos, cannabinoides, extracciones, cultivo, legal)
- [ ] Admin CRUD `/admin/glossary`
- [ ] Ruta pública hub `/glosario` (grid de términos por categoría)
- [ ] Ruta pública detalle `/glosario/:slug`
- [ ] JSON-LD: `DefinedTerm` + `DefinedTermSet`
- [ ] Links desde páginas de cepas (terpenos, efectos → glosario)
- [ ] i18n en/pt

---

### SESIÓN B — Condiciones médicas/terapéuticas en cepas
**Impacto: SEO muy alto | Esfuerzo: medio | Monetización: media**

"Mejores cepas para la ansiedad", "cannabis para dormir" — queries de altísima intención, cero respuestas de calidad en español. Es el feature de mayor tráfico de Leafly.

- [ ] Agregar `helpsWithConditions: string[]` al modelo Strain
- [ ] Seed: mapear condiciones a las 870 cepas (con Claude Haiku batch)
- [ ] Checkbox en review form: "¿Te ayudó con alguna condición?"
- [ ] % de usuarios por condición en página de cepa (igual que Leafly)
- [ ] Filtro por condición en `/strains`
- [ ] Páginas de condición `/para/:condition` (stress, insomnio, dolor, ansiedad, etc.)
- [ ] JSON-LD MedicalCondition en páginas de condición

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

### SESIÓN E — Ratings rápidos (sin review completa)
**Impacto: comunidad alto | Esfuerzo: bajo-medio | Monetización: baja**

Reducir fricción para calificar. Weedmaps tiene 22k ratings / 2.2k reviews por cepa — esa separación es clave para datos estadísticamente útiles.

- [ ] Modelo `QuickRating` (userId, entityType, entityId, overall: 1-5)
- [ ] Unique constraint por user+entity
- [ ] UI: 5 estrellas inline en página de cepa (sin modal, sin texto obligatorio)
- [ ] Mostrar "X,XXX calificaciones | XXX reseñas" separados
- [ ] Recalcular averageRating incluyendo quickRatings (peso menor que full review)
- [ ] API endpoint `/api/ratings` (POST)

---

### SESIÓN F — "Las 100 Mejores Cepas" — editorial anual
**Impacto: SEO alto + prensa | Esfuerzo: bajo-medio | Monetización: media (tráfico + sponsorship)**

Anchor content. Genera links, prensa, autoridad editorial. Leafly hace esto anualmente (Strain of the Year, Top 100).

- [ ] Content type `FeaturedList` en Article model (o lista especial)
- [ ] Ruta `/mejores-cepas` con diseño especial (ranked cards)
- [ ] Primera edición: "Las 100 Mejores Cepas según la comunidad WeedHub" — ordenadas por rating + reseñas
- [ ] Versión editorial: top 10 elegidos por el equipo con justificación
- [ ] OG image especial para redes
- [ ] Plan de publicación anual (420 = 20 de abril)

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

### SESIÓN H — AI "Encuentra tu cepa" (user-facing)
**Impacto: conversión alto + diferenciador | Esfuerzo: medio | Monetización: media**

Leafly tiene un quiz básico. Nadie tiene uno con AI. Diferenciador real para WeedHub.

- [ ] Flow conversacional (3-4 preguntas): efecto buscado → experiencia → método → condición
- [ ] Claude Haiku: strain matching con datos estructurados
- [ ] Resultado: 3-5 cepas recomendadas con explicación en español
- [ ] Widget embebido en homepage + `/strains`
- [ ] Guardar preferencias en perfil de usuario (mejora personalización)
- [ ] Opcional: share result como card en redes

---

### SESIÓN I — Blog / Artículos (admin + público)
**Impacto: SEO alto (contenido long-tail) | Esfuerzo: medio | Monetización: media (sponsored content)**

Modelo `Article` ya creado. Falta admin para publicar + rutas públicas.

- [ ] Admin `/admin/articles` con editor Markdown (textarea + preview)
- [ ] CRUD completo: crear, editar, publicar/despublicar, archivar
- [ ] Gestión de autor (WeedHub editorial o usuario experto)
- [ ] Upload de cover image a Cloudinary
- [ ] Ruta pública `/blog` (hub por categoría)
- [ ] Ruta pública `/blog/:slug` (artículo)
- [ ] JSON-LD: Article + Author + BreadcrumbList
- [ ] Related strains/products/brands en sidebar
- [ ] RSS feed `/blog.rss`

---

### SESIÓN J — Brand Verification Flow (monetización)
**Impacto: monetización muy alto | Esfuerzo: medio | Monetización: MUY ALTA**

El primer flujo de revenue real. Marcas del mercado gris en México + marcas de hemp/CBD ya operando.

- [ ] Página pública `/marcas` con directorio real (no stub)
- [ ] Página pública `/marcas/:slug` con perfil completo
- [ ] Botón "Reclamar esta marca" → formulario de solicitud
- [ ] Email de solicitud al admin (Resend)
- [ ] Admin: aprobar claim → asignar tier → enviar email de confirmación
- [ ] Badge verificado visible en perfil de marca
- [ ] Dashboard básico de marca (futuro: analytics, productos, reviews)
- [ ] Pricing page `/planes` explicando tiers Free/Premium/Enterprise

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

### SESIÓN L — Comunidad / Foros
**Impacto: comunidad muy alto | Esfuerzo: alto | Monetización: baja**

Actualmente stub de "próximamente". La comunidad es el foso a largo plazo — ni Leafly ni Weedmaps tienen foros reales.

- [ ] Modelo `Post` (userId, title, body, category, tags[], cepaRelacionada?, votes, commentCount)
- [ ] Modelo `Comment` (postId, userId, body, votes)
- [ ] Categorías: Cultivo, Experiencias, Cepas, Legal, Comunidad
- [ ] Ruta `/comunidad` hub
- [ ] Ruta `/comunidad/:category`
- [ ] Ruta `/comunidad/post/:slug`
- [ ] Votación (upvote/downvote)
- [ ] Publicación anónima / con username (ya tenemos dual-identity)
- [ ] Moderación en admin

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

| Métrica | Hoy | Meta 6 meses | Meta 12 meses |
|---|---|---|---|
| Cepas indexadas | 870 | 3,000 | 8,000+ |
| Términos en glosario | 0 | 200 | 500 |
| Artículos de blog | 0 | 30 | 100 |
| Marcas verificadas | 0 | 10 | 50 |
| MRR | $0 | $500 | $5,000 |
| Usuarios registrados | ~seed | 500 | 5,000 |
| Reseñas totales | ~seed | 2,000 | 15,000 |

---

## Orden recomendado

```
A (Mapa Verde)         → diferenciador único, SEO legal muy alto, LATAM-first
B (Glosario)           → SEO quick win, bajo esfuerzo, cero competencia en español
C (Condiciones médicas)→ SEO máximo impacto, esfuerzo medio
D (Grow info)          → audiencia cultivadores, seed con AI
E (Cepas similares)    → retención, bajo esfuerzo
F (Ratings rápidos)    → volumen de datos, bajo esfuerzo
G (Top 100 editorial)  → branding + prensa, publicar cada 420
H (Árbol genética)     → diferenciación visual
I (AI Find My Strain)  → diferenciador AI, Q1 2027
J (Blog / admin)       → contenido long-tail, monetización sponsorship
K (Brand verification) → REVENUE — cuando haya tráfico base
L (Dispensarios)       → post-legalización o grey market
M (Comunidad/foros)    → largo plazo, requiere masa crítica
N (Productos público)  → después de marcas verificadas
O (Perfiles mejorados) → después de comunidad
```

### Por qué el Mapa Verde va primero

Es el feature más único que nadie más tiene en español. Crea autoridad editorial inmediata —
medios, activistas y abogados lo van a enlazar. Y cada vez que un país actualiza sus leyes
(México, Colombia, Brasil, Alemania, etc.) WeedHub es la fuente de referencia en español.
Es también el puente perfecto hacia el contenido legal del blog y hacia la comunidad:
la gente busca "¿es legal en mi país?" antes de buscar cepas.
