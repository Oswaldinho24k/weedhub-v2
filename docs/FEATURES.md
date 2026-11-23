# WeedHub — Inventario de features

> Última revisión: 23 nov 2026, después del rediseño "Rótulo y Cartulina".
> Estado verificado con prueba automática de todas las rutas (status HTTP, errores de JS, canonical, idioma, desborde en móvil) y pruebas de filtros/APIs contra la base de producción.

## Leyenda de estado

| Estado | Significa |
|---|---|
| ✅ | Funciona, verificado |
| ⚠️ | Funciona, pero tiene detalles (ver "Detalles") |
| 🫙 | El código existe pero no hay datos en producción (nunca se ha usado de verdad) |
| 🔒 | Requiere sesión; no se ha probado con usuario real todavía |
| ❓ | No probado |

## Datos en producción (MongoDB Atlas, 23 nov 2026)

| Colección | Registros | Nota |
|---|---|---|
| strains | 3,036 | Sin `imageUrl` (Pexels eliminado). 0 con descripción pt/en. Solo 870 con terpenos. |
| reviews | 1,570 | **Todas son seed** (insertadas el 2026-04-20). |
| users | 226 | 201 son seed; ~25 reales (may–nov). |
| legalstatuses | 24 | Mapa Verde |
| glossaryterms | 44 | Glosario |
| effects | 24 | Catálogo de efectos (labels es/pt/en) |
| articles | 8 | Seed (6 es, 2 pt) |
| posts / comments | 18 / 87 | Seed (13 es, 5 pt) |
| brands / products / dispensaries | 8 / 21 / 8 | Seed, ficticios, **no verificados**, sin teléfonos ni webs |
| productcategories | 16 | Del script `seed:categories` |
| quickratings / savedstrains | 418 / 183 | Seed |
| strainsubmissions | 0 | Sin uso real |

**Todo el seed del 23 nov lleva `isSeed: true, seedBatch: "2026-11-23"`.** Se borra con `node --env-file .env seed/seed-content.mjs --delete` (también revierte los votos por condición). Los usuarios seed nuevos (14, de BR/CO/AR/CL/UY) no pueden iniciar sesión.

**Cuentas de prueba:** `qa-usuario@weedhub.info` (usuario) y `qa-admin@weedhub.info` (admin). Se resetean o borran con `seed/qa-accounts.mjs` (`--delete`).

**Idiomas servidos:** solo español. `/pt/*` y `/en/*` redirigen con 301 (las traducciones pt siguen en la base).

**Lanzamiento acotado (23 nov):** foro, marcas/dispensarios/productos, planes/pagos, top-100 y `/para` están **ocultos en producción** por feature flags (`app/lib/features.ts`) y visibles en desarrollo. Todo el contenido seed está **oculto, no borrado** (`seed/hide-seed.mjs`). Revisión editorial registro por registro en `/admin/revision`.

---

## 1. Descubrir cepas

| Feature | Ruta | Idiomas | Estado | Detalles |
|---|---|---|---|---|
| Home | `/` | es/pt | ✅ | Muro + buscador + cepas más reseñadas + momento del día + reseñas + Mapa Verde + guías. |
| Directorio | `/strains` | es/pt | ✅ | Búsqueda, tipo, efecto, terpeno, momento, dificultad, orden, vista lista, paginación con links. |
| Filtro por efecto | `/strains?effects=` | | ✅ | Normalizado (los efectos estaban mezclados inglés/español). `relaxed` → 1,901. |
| Filtro momento del día | `/strains?momento=` | | ✅ | Nuevo. `noche` → 940. |
| Filtros de cultivo | `/strains?autoflowering=1&climate=` | | ⚠️ | Ocultos en la UI (solo 24 cepas con datos); siguen funcionando por URL. |
| Filtro por condición | `/strains?condition=` | | ⚠️ | Ahora con votos (seed sobre reseñas seed). |
| Detalle de cepa | `/strains/:slug` | es/pt | ✅ | Resumen escrito desde los datos + FAQ (es/pt/en), THC/CBD, efectos, curva, terpenos, sabor, momento, cultivo, árbol genético, reseñas, similares. |
| Guardar cepa | botón en detalle → `api/strains/:id/save` | | 🔒 | 0 guardadas en prod. |
| Rating rápido (1–5) | widget en detalle → `api/strains/:id/quick-rate` | | 🔒 | 0 en prod. |
| Compartir | botón en detalle | | ❓ | Web Share API; en desktop copia el link. |
| Buscador typeahead | `api/strain-search` | | ✅ | Tolera errores ("sour disel" → Sour Diesel). |
| Top 100 | `/top-100` | es/pt | ✅ | Promedio bayesiano por número de reseñas. |
| Sugerir cepa | `/strains/sugerir` | solo es | 🔒 | Moderación con Claude Haiku. 0 sugerencias en prod. |
| Recomendador IA | `/recomendar` | solo es | ✅ | Probado de punta a punta. Bug corregido: ignoraba los efectos elegidos. |
| 404 de cepa | `/strains/no-existe` | | ✅ | Responde 404 con página propia. |

## 2. Aprender

| Feature | Ruta | Idiomas | Estado | Detalles |
|---|---|---|---|---|
| Guías (10) | `/guias`, `/guias/:slug` | es/pt | ✅ | Contenido traducido. |
| Glosario (44 términos) | `/glosario`, `/glosario/:slug` | es/pt | ✅ | Traducido a pt-BR; canonical y hreflang por idioma. |
| Mapa Verde (24 países) | `/mapa-verde`, `/mapa-verde/:pais` | es/pt | ✅ | Traducido; FAQ estructurado, fuentes y fecha de revisión visibles. |
| Cannabis para condiciones | `/para`, `/para/:condicion` | es/pt | ⚠️ | Las páginas de condición salen vacías (sin `conditionVotes`). Tiene disclaimer médico. Sin canonical en el detalle. |
| Magazine (BD) | `/magazine`, `/magazine/:slug`, `/magazine.rss` | es (+2 pt) | ⚠️ | 8 artículos seed. Placeholder con emoji en vez de imagen. |
| Editorial | `/editorial` | | ✅ | Redirige 301 a `/magazine`. |
| Sobre WeedHub | `/sobre` | es/pt | ✅ | Política editorial, datos, salud, anonimato, +18, contacto. |
| Página legacy "community" | `/community` | | ✅ | Redirige 301 a `/comunidad`. |

## 3. Comunidad y reseñas

| Feature | Ruta | Estado | Detalles |
|---|---|---|---|
| Escribir reseña (5 pasos, anónima opcional) | `/strains/:slug/review` | 🔒 | Pide login (redirige a `/auth`). Probar flujo completo. |
| Voto "útil" en reseña | `api/reviews/:id/vote` | 🔒 | |
| Reseñas de marcas / dispensarios | `/marcas/:slug/review`, `/dispensarios/:slug/review` | ⚠️ | Bug corregido en BD: índice único viejo `userId+strainId` impedía a un usuario dejar más de una reseña de negocio. |
| Foros | `/comunidad`, `/comunidad/nuevo`, `/comunidad/:slug` | ⚠️ | 18 hilos y 87 comentarios seed. Falta revisar UI con el diseño nuevo. |
| Votos de posts / comentarios | `api/posts/:id/vote`, `api/comments/:id/vote` | 🫙 | |
| Perfil público | `/profile/:username` | ✅ | Probado con usuario seed. |
| Seguir usuarios | `api/users/:id/follow` | 🔒 | |
| Gamificación (badges, niveles, puntos) | perfil | ❓ | |
| Emails: bienvenida, comentario nuevo, seguidor nuevo | Resend | ❓ | Falta `RESEND_API_KEY` en Vercel (según CLAUDE.md). |

## 4. Cuenta

| Feature | Ruta | Estado | Detalles |
|---|---|---|---|
| Registro / login | `/auth` | 🔒 | Rediseñado (muro cobalto). |
| Google OAuth | `/auth/google` | ❓ | |
| Olvidé contraseña | `/auth/forgot-password`, `/auth/reset-password` | ⚠️ | Carga bien; el envío depende de Resend. |
| Onboarding (5 pasos) | `/onboarding` | 🔒 | |
| Mi perfil / editar / guardadas / borrar cuenta | `/profile`, `/profile/edit`, `/profile/saved`, `/profile/delete` | 🔒 | |
| Tema claro/oscuro | `api/theme` | ✅ | Claro por defecto; oscuro = "muro de noche". |
| Idioma | `api/locale` + prefijos `/pt`, `/en` | ✅ | |
| Newsletter | `api/newsletter` | ❓ | Depende de Resend. |

## 5. Negocios (B2B)

| Feature | Ruta | Estado | Detalles |
|---|---|---|---|
| Directorio de marcas | `/marcas` | ⚠️ | 8 marcas seed. Avatares y placeholders con estilo viejo. |
| Registrar / reclamar / editar marca | `/marcas/registrar`, `/marcas/:slug/reclamar`, `/marcas/:slug/editar` | 🔒 | |
| Dispensarios | `/dispensarios`, `/dispensarios/agregar` | ⚠️ | `agregar` abre sin login: confirmar si es intencional. |
| Productos | `/productos`, `/productos/:slug` | ⚠️ | 21 productos seed. Categoría sin traducir ("accessory"); placeholder emoji. |
| Planes | `/planes` | ✅ | |
| Stripe checkout / portal / webhook | `api/stripe/*` | ❓ | Solo sandbox; faltan precios y llave live. |

## 6. Admin (`/admin`, rol admin)

| Sección | Estado |
|---|---|
| Dashboard, cepas, reseñas, sugerencias, efectos, usuarios, categorías, marcas, productos, dispensarios, estatus legal, glosario, artículos, comunidad | 🔒 Sin revisar tras el rediseño (heredan los tokens nuevos). |
| Chat IA de admin (`api/admin/ai`) | ❓ |
| Generación de imágenes IA (`/admin/generate-images`) | ❓ Requiere `IMAGE_GEN_API_KEY` (fal.ai). |

## 7. SEO, GEO/AEO e infraestructura

| Feature | Estado | Detalles |
|---|---|---|
| `sitemap.xml` | ✅ | Ya sin URLs pt/en que daban 404; incluye países y condiciones. |
| `llms.txt` | ✅ | Nuevo. |
| `robots.txt` | ✅ | Permite buscadores de IA (OAI-SearchBot, PerplexityBot, Claude-SearchBot…). |
| hreflang + canonical por idioma | ⚠️ | Bien en home, directorio, cepas y guías. Mal en glosario pt/en; faltan en país, condición y glosario detalle. |
| Schema (WebSite, Organization, WebPage, FAQPage, Breadcrumb, ItemList, Article) | ✅ | Cepas ya no usan `Product`. |
| RSS del magazine | ✅ | Vacío porque no hay artículos. |
| Vercel Analytics | ❓ | |
| Sentry | ⚠️ | Configurado pero sin commitear. |
| Google Search Console | ❓ | Pendiente de enviar sitemap. |
