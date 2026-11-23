# WeedHub — Roadmap de QA (una pasada por feature)

> Objetivo: recorrer cada feature, confirmar que **jala**, que **funciona bien** y anotar **qué detalles faltan**.
> Inventario y estado actual: [`FEATURES.md`](./FEATURES.md).
> Las fases van en orden de impacto: primero lo que trae tráfico (SEO) y lo que usa todo visitante, al final lo interno.

## Cómo hacemos cada pasada

1. **Automático (lo corro yo):** status, errores de JS, canonical/idioma, desborde en móvil, y llamadas reales a filtros y APIs.
2. **Manual (juntos, en el navegador):** flujo completo como usuario en celular y en desktop, en **es** y **pt**.
3. **Resultado:** cada casilla queda ✅ (jala), ⚠️ (jala con detalles, se anota) o ❌ (no jala, se arregla).
4. **Criterio de listo de la fase:** cero ❌ y cada ⚠️ convertido en tarea o descartado a propósito.

Cuentas de prueba (creadas el 23 nov): `qa-usuario@weedhub.info` y `qa-admin@weedhub.info`. Contraseñas en la conversación; se resetean con `node --env-file .env seed/qa-accounts.mjs`.
SEO/IA: ver [`SEO-AUDIT.md`](./SEO-AUDIT.md) para pendientes por feature.

---

## Fase 1 — Descubrir cepas (lo que trae tráfico)

**Qué probar**
- [ ] Home en es/pt/en: buscador manda al directorio con el término; los chips de efecto filtran bien; las tarjetas abren la cepa; "Pinta tu reseña" lleva al flujo.
- [ ] Directorio: buscar (nombre, efecto, aroma), cada filtro solo y combinado, quitar filtros, orden, vista lista, paginación (adelante/atrás y URL compartible).
- [ ] Detalle de cepa con y sin reseñas, con y sin terpenos, con y sin genética: que nada salga vacío o raro.
- [ ] Resumen y FAQ correctos en es/pt/en (revisar 10 cepas al azar contra sus datos).
- [ ] Guardar, rating rápido y compartir (con sesión).
- [ ] Top 100, buscador typeahead, sugerir cepa, recomendador IA de punta a punta.
- [ ] Cepa inexistente → 404 bonito.

**Detalles ya detectados**
- [x] Subtítulo del directorio no cambia con el orden elegido.
- [ ] Filtro por condición da 0 (no hay `conditionVotes`) → esconderlo o llenar datos.
- [x] Filtros de cultivo casi vacíos → esconder hasta tener datos.
- [x] Top 100 sin ponderar por número de reseñas → usar promedio bayesiano.
- [ ] "blue dream" devuelve 250 resultados → revisar que la coincidencia exacta salga primero.
- [x] Recomendador y top-100 solo en español.

## Fase 2 — Cuenta y reseñas (escribir)

**Qué probar**
- [ ] Registro, login, logout, Google OAuth, olvidé/restablecer contraseña (¿llega el correo?).
- [ ] Onboarding de 5 pasos completo y que se guarde.
- [ ] Escribir reseña de 5 pasos: pública y **anónima**; que aparezca en la cepa y recalcule promedio y conteo.
- [ ] Voto "útil", editar perfil, cepas guardadas, perfil público, seguir/dejar de seguir.
- [ ] Borrar cuenta: anonimiza reseñas y cierra sesión.
- [ ] Badges, niveles y puntos suben al hacer acciones.

**Detalles ya detectados**
- [ ] Emails dependen de `RESEND_API_KEY` en Vercel.
- [ ] Decidir qué hacer con las 1,570 reseñas seed antes de lanzar (hoy: se quedan).

## Fase 3 — Aprender + paridad en portugués

**Qué probar**
- [ ] Guías es/pt/en: lectura en móvil, links internos, compartir.
- [ ] Glosario: índice A–Z, detalle, "ver también".
- [ ] Mapa Verde: los 24 países, fuentes y fecha de revisión visibles, estados correctos.
- [ ] `/para`: cada condición, disclaimer médico visible.

**Detalles ya detectados**
- [x] Glosario en `/pt` y `/en` sigue en español y su canonical apunta a `/glosario`.
- [x] Sin canonical: glosario detalle, país, condición, `/dispensarios/agregar`.
- [x] Mapa Verde, `/para`, top-100, comunidad y magazine no existen en pt.
- [ ] 0 cepas con descripción pt/en (hoy se cubre con el resumen automático).
- [x] `/community` dice "Miles de voces" → redirigir a `/comunidad`.
- [x] Magazine (BD, vacío) vs Editorial (estático) → elegir uno.

## Fase 4 — Comunidad (foros)

**Qué probar**
- [ ] Crear post, comentar, votar post y comentario, filtros por categoría, orden.
- [ ] Email de comentario nuevo y de seguidor nuevo.
- [ ] Moderación desde admin.

**Detalles ya detectados**
- [ ] Revisar UI del foro con el diseño nuevo (encabezado plano, votos).
- [ ] Comunidad, magazine y recomendador siguen solo en español.

## Fase 5 — Negocios (B2B) y pagos

**Qué probar**
- [ ] Registrar marca, reclamar, editar, reseñar marca.
- [ ] Agregar dispensario, reseñarlo; productos y su detalle.
- [ ] Stripe sandbox: checkout con prueba de 30 días, webhook marca verificado, portal, cancelación regresa a free.

**Detalles ya detectados**
- [x] Restos del estilo viejo: avatares azul claro, placeholders con emoji, categorías sin traducir.
- [ ] `/dispensarios/agregar` abre sin login: confirmar si es intencional.
- [ ] Stripe live: faltan precios y llave de producción.

## Fase 6 — Admin e IA

**Qué probar**
- [ ] Las 14 secciones: listar, crear, editar, borrar (con confirmación en lo destructivo).
- [ ] Chat IA de admin responde con datos reales.
- [ ] Generar imagen de cepa (si activamos fal.ai) o subir foto real a Cloudinary.

**Detalles ya detectados**
- [ ] El admin no se revisó visualmente tras el rediseño.

## Fase 7 — SEO, monitoreo y lanzamiento

**Qué probar**
- [ ] Enviar `sitemap.xml` a Google Search Console y revisar cobertura/hreflang.
- [ ] Validar schema (Rich Results Test) en home, cepa, guía.
- [ ] Probar 20 preguntas en ChatGPT/Perplexity/Google ("¿qué efectos tiene Sour Diesel?", "¿es legal el cannabis en Colombia?", en es y pt) y anotar si nos citan.
- [ ] Sentry: commitear y confirmar que llegan errores.
- [ ] Core Web Vitals en Vercel.

**Detalles ya detectados**
- [x] `DESIGN.md` describe el diseño viejo; reescribirlo con el sistema nuevo.
- [ ] Cambios del rediseño sin commitear.

---

## Registro de pasadas

| Fecha | Fase | Quién | Resultado | Notas |
|---|---|---|---|---|
| 2026-11-23 | Prueba automática de 55 rutas + filtros | Claude | 0 errores de JS, 0 desbordes en móvil, 0 rutas rotas | Hallazgos ya listados arriba |
| 2026-11-23 | Paridad pt (Mapa Verde, /para, top-100, glosario, /sobre), pasada de estilo B2B/magazine/foro, OG PNG, top-100 bayesiano, fix recomendador y bug de Stripe en cliente | Claude | 52 rutas sin errores ni desbordes | Falta: encabezados "muro" en foro/magazine/marcas; recomendador y comunidad/magazine en pt |
| 2026-11-23 | Inglés retirado, seed de secciones vacías, auditoría SEO/IA | Claude | 12 problemas SEO corregidos; bug de índice de reseñas corregido | Pendientes de estilo en marcas/productos/magazine/foros (Fase 4–5) |
