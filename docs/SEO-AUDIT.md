# WeedHub — Auditoría SEO + IA (GEO/AEO)

> 23 nov 2026. Mercados: **español (LATAM) y portugués (Brasil)**. El inglés ya no se sirve: `/en/*` redirige con 301 a español.
> Método: rastreo renderizado de 38 rutas representativas con navegador (JSON-LD real, no solo HTML), revisión de código y chequeo del dominio en producción.
> Sin acceso todavía a Search Console ni a datos de tráfico: las prioridades se basan en lo técnico y el contenido, no en rankings.

## Resumen

**Estado general:** base técnica sana (SSR, HTTPS, HSTS, respuesta de 0.3–0.5 s, sitemap, robots), con errores de idioma y de datos estructurados que ya se corrigieron en esta pasada. El reto grande ya no es técnico, es **contenido**:
- el portugués existe solo a medias;
- muchas páginas de cepa tienen pocos datos;
- casi no hay señales de autoría ni fuentes (E-E-A-T).

**Top 5 prioridades**
1. **Paridad real en portugués** (Mapa Verde, `/para`, top-100, glosario, descripciones de cepas): Brasil es mercado prioritario y hoy la mitad de las páginas pt no existen o están en español.
2. **Página "Sobre WeedHub" y política editorial** (quién escribe, cómo se hacen las fichas, de dónde salen los datos legales): es la señal de confianza que más falta, sobre todo en temas de salud y ley.
3. **Mapa Verde como activo #1 de AEO**: "¿es legal el cannabis en X?" es la pregunta que más citan las IAs. Ya tiene FAQ estructurado; falta pt, fuentes enlazadas visibles por país y fecha de revisión en el título.
4. **Fichas de cepa con datos completos**: solo 870 de 3,036 tienen terpenos. Priorizar las ~500 más buscadas.
5. **Search Console + Bing Webmaster**: enviar sitemap y medir. Sin esto no sabemos qué páginas ya rankean en posiciones 8–20 (las ganancias más rápidas).

## Corregido en esta pasada

| Problema | Impacto | Arreglo |
|---|---|---|
| Páginas pt/en de cepas apuntaban su canonical a la versión en español | Alto: Google ignoraba pt | Canonical propio por idioma |
| Inglés servido sin estrategia (contenido duplicado) | Medio | `/en/*` 301 → español; fuera del hreflang, sitemap, selector |
| Páginas solo-español (Mapa Verde, `/para`, magazine, comunidad, marcas, dispensarios, productos, planes, recomendar) anunciaban versión `/pt` que daba 404 | Alto: hreflang roto | Sin hreflang en páginas de un solo idioma |
| Sitemap listaba `/pt/magazine` y `/pt/comunidad` (404) | Alto | Corregido; ahora incluye países y condiciones |
| JSON-LD de Mapa Verde, glosario y `/para` usaba un formato que React Router no publica (salía como `<meta>`) | Alto para AEO: el FAQ legal nunca se veía | Formato `script:ld+json` correcto; dominio `www` consistente |
| Sin canonical en país, condición y término del glosario | Medio | Canonical propio |
| Glosario en `/pt` con contenido en español | Medio: duplicado | Canonical a la versión es, fuera del sitemap pt hasta traducirlo |
| Paginación del directorio: canonical a la página 1 y `robots.txt` bloqueando `?page=` | Medio: 3,000 cepas difíciles de rastrear | Página N con canonical propio y título "página N"; robots permite paginar |
| `/community` duplicaba `/comunidad` y decía "miles de voces" | Bajo | 301 → `/comunidad` |
| 226 perfiles de usuario indexables y vacíos | Medio: páginas delgadas | `noindex, follow` |
| Títulos y descripción del home genéricos ("en LATAM", "contextuales reales") | Bajo | Reescritos con lo que el sitio realmente tiene |
| Ficha de cepa: meta description = solo el nombre; schema `Product` con rating | Alto | Resumen de 40–60 palabras hecho con datos + FAQ (`FAQPage`) en es/pt |
| Sin `llms.txt`; buscadores de IA sin mención en robots | Medio para GEO | `/llms.txt` + robots que permite OAI-SearchBot, PerplexityBot, Claude-SearchBot, etc. |

## Corregido en la segunda pasada (23 nov, tarde)

| Problema | Arreglo |
|---|---|
| Portugués incompleto | Mapa Verde (24 países), `/para` (20 condiciones), top-100, glosario (44 términos) y `/sobre` ya existen en `/pt` con contenido traducido, canonical propio, hreflang y sitemap. Preposiciones correctas en pt ("no Brasil", "na Colômbia"). |
| Sin señales E-E-A-T | Página `/sobre` (es/pt) con política editorial: origen de datos, revisión legal, política de salud, anonimato, +18, marcas, contacto. Schema `AboutPage` + `Organization`. |
| `/editorial` duplicaba el magazine | 301 → `/magazine`; "Sobre WeedHub" apunta a `/sobre`. |
| Mapa Verde: "última revisión" mostraba la fecha de hoy | Usa la fecha real más reciente de `lastReviewedAt`; cada país muestra su fecha, fuentes enlazadas y la respuesta directa arriba. Índice con `ItemList`. |
| OG image en SVG (no se ve en WhatsApp/Facebook/X) | `og-default.png` 1200×630 con el diseño nuevo. |
| Top 100 sin ponderar | Promedio bayesiano (m=5 sobre la media del sitio). |
| Artículos: autor como `Person`, sin imagen, sin `lang` | Autor `Organization` (Redacción WeedHub → `/sobre`), imagen por defecto, `lang="pt-BR"` en artículos en portugués. |
| Recomendador ignoraba los efectos elegidos | Mapeo de efectos normalizado; principiantes filtrados a THC ≤ 18 %. |

## Pendiente por feature

### Cepas (`/strains`, `/strains/:slug`, `/top-100`)
- **Contenido:** completar terpenos, cannabinoides y genética en las cepas más buscadas; descripciones propias en pt para las top 300 (revisadas, no traducción masiva sin control).
- **Páginas de hub que faltan (alto potencial):** "cepas para dormir", "cepas sativa para el día", "cepas con mirceno", etc. Hoy existen solo como filtros con canonical a `/strains`; convertir las 10–15 combinaciones con más demanda en páginas reales con texto propio.
- **Freshness:** mostrar "Actualizado el …" en la ficha (ya está `dateModified` en schema).

### Mapa Verde (`/mapa-verde`, `/mapa-verde/:pais`)
- Fuentes oficiales enlazadas y visibles en cada país (la data ya trae `sources`) + "Revisado el …" junto al título.
- Respuesta directa de 1–2 frases arriba ("Sí/No/Parcialmente: …"): ya existe como `summary`; hacerla el primer párrafo visible.
- Índice `/mapa-verde` sin schema: agregar `ItemList` de países.

### Para condiciones (`/para/:condicion`)
- Es contenido YMYL (salud): exige el más alto estándar. Agregar disclaimer arriba, número de reseñas por cepa, enlace a guías y fuentes. Considerar `noindex` hasta tener datos de reseñas reales (hoy son votos seed).

### Guías y glosario
- Guías: autor y fecha visibles; enlazar cada guía a 3–5 cepas y términos (interlinking).

### Magazine y editorial
- Artículos con autor ("Redacción WeedHub" + página de autor), fecha visible y fuentes al final.

### Comunidad, marcas, dispensarios, productos
- Fichas de marca/dispensario/producto: agregar `Organization` / `LocalBusiness` / `Product` según el caso, ya con datos sembrados.
- Foros: las conversaciones son buen contenido long-tail; asegurar títulos únicos y `DiscussionForumPosting` schema.

### Sitio completo
- **E-E-A-T:** agregar `sameAs` en `Organization` cuando existan redes oficiales.
- **Dominio:** `weedhub.info` → `www` responde **307 (temporal)**; cambiar a 308 permanente en Vercel → Domains.
- **Medición:** Search Console (es + pt), Bing Webmaster (alimenta Copilot y ChatGPT search), y un set de 20 preguntas para revisar cada mes en ChatGPT / Perplexity / Google AI Overviews, en español y portugués.

## Preguntas a monitorear en IAs (mensual, 3–5 corridas cada una)

| Español | Português |
|---|---|
| ¿Es legal el cannabis en México? | A maconha é legal no Brasil? |
| ¿Es legal la marihuana en Colombia? | O que o STF decidiu sobre porte de maconha? |
| ¿Qué efectos tiene la Sour Diesel? | Quais os efeitos da Sour Diesel? |
| ¿Qué cepa es buena para dormir? | Qual variedade é boa para dormir? |
| ¿Qué son los terpenos? | O que são terpenos? |
| Diferencia entre sativa e indica | Diferença entre sativa e indica |
| ¿Cuánto tardan en hacer efecto los comestibles? | Quanto tempo demora o efeito de comestíveis? |
| ¿Qué es el THC? | O que é THC? |
| Mejores cepas para principiantes | Melhores variedades para iniciantes |
| ¿Cómo funciona el registro REPROCANN? | Como funciona a compra em farmácias no Uruguai? |

Anotar: ¿nos citan? (sí/no, n=…), quién sí, qué página.
