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
- [x] **Sesión C (parcial)** — Grow info: schema, índices, sección en cepa detail (datos aún sin seed)
- [x] **Sesión D** — Cepas similares: aggregation, SimilarityScore (effects×3 + flavors×2 + terpenes×2), sección en cepa detail
- [x] **Strains refactor** — Terpene filter, select() limiting, deferred loading (Suspense/Await), FilterSheet mobile, terpene links, dynamic SEO meta, grow empty state

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

## Refactor / Redesign — features existentes que merecen una segunda pasada

Estos ya funcionan pero su UX o arquitectura tiene deuda. Ordenados por impacto en retención y primera impresión.

---

### REFACTOR-1 — Perfil de usuario: de funcional a "algo de presumir"
**Impacto: comunidad alto | Esfuerzo: medio | Prioridad: 🔴 Alta**

El perfil propio (`/profile`) y el público (`/profile/:username`) son los más visibles para la comunidad. Hoy son listas planas sin jerarquía visual.

**Problemas actuales:**
- No hay "hero" del perfil — el nivel/puntos/badge principal no tienen protagonismo
- Las insignias son una lista sin showcase del más valioso
- El progreso de nivel (barra, % al siguiente) está enterrado
- No hay tabs para separar Reseñas / Guardadas / Sobre mí
- No hay "cepa favorita" o "efectos más usados" derivados del historial
- El perfil público no tiene diferenciación: igual si tienes 1 reseña o 200
- No se puede compartir el perfil con link visible (aunque existe la URL)

**Qué construir:**
- Hero card: avatar prominente + username + handle anónimo + país + nivel badge grande
- Barra de progreso de nivel animada con puntos restantes
- "Insignia destacada" — la de mayor rango, con tooltip de cómo se ganó
- Tabs: Reseñas | Guardadas | Sobre mí
- Resumen estadístico: cepas reseñadas, tipo favorito, efecto más reportado (derivado de reviews)
- Botón de share nativo en perfil público
- "Experto en X terpeno/efecto" — auto-calculado del historial de reseñas

---

### REFACTOR-2 — Formulario de reseña: completar lo que falta
**Impacto: datos + retención | Esfuerzo: bajo-medio | Prioridad: 🔴 Alta**

El wizard de 6 pasos (`/strains/:slug/review`) recopila flavors, frecuencia y "recomendarías" pero **no los guarda en la base de datos**.

**Problemas actuales:**
- `flavor[]`, `frequency`, `wouldRecommend` — estado en React pero sin campo en el action/modelo
- No hay modo "editar reseña" claro: si ya tienes una, el formulario la sobrescribe silenciosamente
- No hay validación visible de campos requeridos antes de intentar submit
- No hay indicador de progreso de pasos con labels (solo números)

**Qué construir:**
- Agregar `flavor[]`, `frequency`, `wouldRecommend` al Review model y al action
- Indicar claramente "Editando tu reseña del DD/MM" cuando ya existe
- Barra de progreso con labels de pasos (Valoración · Contexto · Efectos · Sabores · Extras · Resumen)
- Validación inline antes del submit final (al menos: 1 rating + 1 efecto)

---

### REFACTOR-3 — Comunidad: de lista estática a foro vivo
**Impacto: retención + contenido generado | Esfuerzo: alto | Prioridad: 🟡 Media**

`/comunidad` tiene cap duro de 40 posts, sin paginación, y el post detail tiene plain text sin markdown.

**Problemas actuales:**
- Cap de 40 posts sin paginación ni infinite scroll — los posts viejos desaparecen
- Post body en plain text — no soporta markdown, code, listas, imágenes
- No hay comentarios anidados (solo planos), sin threading
- No hay búsqueda de posts
- Las categorías no muestran conteo de posts
- No hay posts "pinned" o "destacados"
- No hay notificaciones cuando alguien responde tu post/comentario

**Qué construir (por fases):**
- Fase A: paginación cursor-based + búsqueda de posts (sin cap)
- Fase B: markdown en body del post (SimpleMDE en admin, preview en público)
- Fase C: conteo por categoría en tabs
- Fase D: notificaciones in-app (requiere Sesión O)

---

### REFACTOR-4 — Top 100: de ranking plano a showcase
**Impacto: SEO + primera impresión | Esfuerzo: bajo | Prioridad: 🟡 Media**

`/top-100` es una lista rankeada básica. Potencial editorial enorme con mínimo esfuerzo.

**Problemas actuales:**
- No hay filtros (por tipo: sativa/indica/hybrid, por efecto, por terpeno)
- No hay diferenciación visual para el podio (1-2-3)
- No hay selector de periodo (todo el tiempo vs. últimos 30 días)
- La posición de rank (#1, #2...) no es prominente visualmente
- No hay meta descripción dinámica por filtro para SEO

**Qué construir:**
- Podio visual para top 3 (card más grande, corona, diferente fondo)
- Filtros por tipo inline (sativa / indica / hybrid)
- Rank badge prominent (#N) en cada fila
- Meta descripción dinámica: "Top 10 cepas Indica más valoradas en WeedHub"
- (Futuro) selector de periodo: Semana / Mes / Todo

---

### REFACTOR-5 — AI Recommender: de wizard desechable a herramienta
**Impacto: conversión + retención | Esfuerzo: medio | Prioridad: 🟡 Media**

`/recomendar` funciona pero los resultados desaparecen al recargar y no hay "¿por qué esta cepa?".

**Problemas actuales:**
- Resultados no se guardan — cada vez que recarga la página se pierden
- No hay explicación por cepa (¿por qué te recomendamos Blue Dream?)
- No hay seguimiento de preguntas ("¿quieres algo más energético?")
- Sin auth, no se puede personalizar con historial real del usuario
- No hay CTA a guardar/reseñar la cepa recomendada

**Qué construir:**
- "Guardar mis recomendaciones" (para usuarios autenticados)
- Snippets de explicación por cepa: "Porque buscas relajación y tiene alto Mirceno"
- CTA inline: "Guardar cepa" / "Escribir reseña" por cada resultado
- Si el usuario tiene historial, alimentarlo al prompt para mejores recomendaciones

---

### REFACTOR-6 — Magazine: de blog a publicación editorial
**Impacto: SEO + autoridad editorial | Esfuerzo: bajo | Prioridad: 🟢 Baja**

`/magazine` y `/magazine/:slug` son funcionales pero sin diferenciación editorial.

**Problemas actuales:**
- No hay estimated reading time en artículos
- No hay search de artículos
- No hay agrupación por series/colecciones
- Los artículos relacionados se muestran pero sin diseño destacado
- No hay autor bio con foto/link al perfil

**Qué construir:**
- Reading time estimado ("5 min de lectura") — calcular de words count
- Barra de búsqueda en `/magazine`
- "Serie:" label en artículos que pertenecen a una colección
- Autor bio card al final de cada artículo (si tiene perfil en WeedHub)

---

## Nuevas features — ideas para el mercado LATAM

---

### NEW-A — Comparador de cepas
**Impacto: SEO alto + retención | Esfuerzo: medio | Prioridad: 🔴 Alta**

"Blue Dream vs. OG Kush" genera millones de búsquedas. Ningún competidor lo hace bien en español.

- Ruta `/comparar?a=blue-dream&b=og-kush`
- Comparación lado a lado: cannabinoids, terpenos, efectos, ratings, grow info
- Gráfico radar de perfiles de terpenos superpuestos
- CTA: "¿Cuál es mejor para ti?" → link al AI recommender
- Compartible: URL con slugs es shareable en redes sociales
- Indexable: meta title "Blue Dream vs OG Kush — Comparación en WeedHub"

---

### NEW-B — Diario de consumo (privado)
**Impacto: retención altísima + datos de usuario | Esfuerzo: alto | Prioridad: 🟡 Media**

Zero competidores en español. Alta retención porque crea hábito diario. Los datos de mood + cepa son oro para recomendaciones.

- Botón "Registrar consumo" desde cepa detail o navbar
- Formulario rápido: cepa + dosis estimada + método + mood antes/después + notas
- Dashboard personal: cepas más consumidas, efectos promedio por cepa, mood trend
- Completamente privado (no visible en perfil público)
- (Futuro) exportar a CSV para el usuario

---

### NEW-C — Notificaciones in-app
**Impacto: retención + comunidad | Esfuerzo: medio | Prioridad: 🟡 Media**

Sin notificaciones, los usuarios no vuelven a ver respuestas a sus posts o comentarios en sus reseñas.

- Bell icon en navbar con contador
- Triggers: alguien vota tu reseña · alguien responde tu post · alguien te sigue · tu sugerencia de cepa fue aprobada
- Modelo `Notification` — userId, type, relatedId, read, createdAt
- API `/api/notifications` — GET (lista) + PATCH (marcar leído)
- Email digest opcional (1 email/semana con resumen de actividad)

---

### NEW-D — Calculadora de edibles
**Impacto: SEO + utilidad | Esfuerzo: bajo | Prioridad: 🟢 Baja**

"Cuánto THC tiene un brownie de 3g" — búsqueda muy frecuente, respuesta simple, sin competencia en español.

- Ruta `/calculadora` (o widget embebido en artículos de guías)
- Inputs: gramos de cannabis · % THC de la cepa · dividir entre N porciones
- Output: mg THC por porción + recomendación de dosis según experiencia del usuario
- No requiere auth
- Rich result schema para calculadoras

---

### NEW-E — Mapa de dispensarios con reviews integradas
**Impacto: SEO local + monetización futura | Esfuerzo: alto | Prioridad: 🟡 Media**

El directorio de dispensarios existe (`/dispensarios`) pero sin mapa y sin reviews. El mapa es el diferenciador vs. una lista.

*(Ya registrado como Sesión K — este item amplía el scope con reviews)*

- Mapa interactivo Leaflet/OSM (gratis, sin API key)
- Pin por dispensario con mini-card en hover
- Reviews de dispensarios usando el modelo polimórfico ya existente
- Filtros: ciudad, estado, verificado, tipo

---

### NEW-F — Feed de actividad de la comunidad
**Impacto: social + retención | Esfuerzo: medio | Prioridad: 🟢 Baja**

Un feed global de actividad reciente — qué están reseñando los usuarios ahora mismo.

- Ruta `/actividad` o widget en homepage
- Items: nueva reseña destacada · cepa guardada por 5+ usuarios esta semana · post trending en comunidad
- Filtrable por following (solo actividad de usuarios que sigues)
- Actualizable sin reload (polling ligero cada 60s o SSE)

---

## Infraestructura pendiente (quick wins)

Estos no son features — son gaps de producción que hay que cerrar antes de que llegue tráfico real.

| Prioridad | Item | Esfuerzo | Notas |
|---|---|---|---|
| ~~🔴 Alta~~ ✅ | ~~**Rate limiting**~~ — vercel.json con Firewall rules | ✅ Hecho | auth 10/min, newsletter 5/min, ai 10/min, search 60/min |
| ~~🔴 Alta~~ ✅ | ~~**SESSION_SECRET fallback**~~ — ahora lanza `throw new Error(...)` | ✅ Hecho | — |
| 🔴 Alta | **Sentry** — cero visibilidad de errores en producción | ~1h | `@sentry/react`, tier gratuito |
| ~~🟡 Media~~ ✅ | ~~**Terpene index**~~ — `{ "terpenes.name": 1 }` en Strain model | ✅ Hecho | — |
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
[✅ Hecho] SESSION_SECRET throw + Rate limiting vercel.json + Terpene index
[✅ Hecho] Strains refactor — terpene filter, deferred loading, FilterSheet, SimilarityScore
[✅ Hecho] Sesión D — Cepas similares

[Infra]    Sentry + Resend DNS + GSC + Stripe live mode  → antes de tráfico real

[Refactor] REFACTOR-2 — Review: guardar flavors/frecuencia  → datos incompletos desde el día 1
[Refactor] REFACTOR-1 — Perfil: hero card + tabs + progreso → primera impresión comunitaria
[Refactor] REFACTOR-4 — Top 100: podio + filtros            → bajo esfuerzo, alto impacto editorial
[Refactor] REFACTOR-3 — Comunidad: paginación + markdown    → escala de contenido (fase A primero)
[Refactor] REFACTOR-5 — AI Recommender: guardar + explicar  → conversión + retención

[Sesión C] Grow info seed      → componente existe, datos sin poblar
[Sesión G] Árbol genética      → componente existe, seed existe, falta integración
[Sesión K] Dispensarios mapa   → directorio funciona, mapa es el diferenciador

[Nueva A]  Comparador de cepas → SEO viral "X vs Y", ningún competidor en español
[Nueva B]  Diario de consumo   → retención máxima, hábito diario, zero competidores
[Nueva C]  Notificaciones      → usuarios vuelven cuando hay actividad
[Sesión M] Productos reviews   → completa el modelo polimórfico
[Nueva D]  Calculadora edibles → quick win SEO, bajo esfuerzo
```

### Por qué el Mapa Verde va primero

Es el feature más único que nadie más tiene en español. Crea autoridad editorial inmediata —
medios, activistas y abogados lo van a enlazar. Y cada vez que un país actualiza sus leyes
(México, Colombia, Brasil, Alemania, etc.) WeedHub es la fuente de referencia en español.
Es también el puente perfecto hacia el contenido legal del blog y hacia la comunidad:
la gente busca "¿es legal en mi país?" antes de buscar cepas.
