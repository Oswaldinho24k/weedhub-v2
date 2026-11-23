# Admin AI-native — acciones

> Generado desde el registro (`app/ai/registry.server.ts`). Cada acción llama a un service en `app/services/`; la misma lógica la usan las páginas del admin, el asistente IA del admin (`/api/admin/ai`) y clientes MCP (`/mcp`).

## Cómo funciona

- **Una operación, tres superficies:** `services/<módulo>.server.ts` (lógica) → `ai/actions/<módulo>.server.ts` (acción para el agente y MCP) → `routes/admin.<módulo>.tsx` (UI). Nunca dupliques lógica en la ruta.
- **Riesgo:** lectura (el agente la corre sola), escritura (reversible; si la hace el agente, el contenido queda "pendiente"), destructiva (borrar, publicar, archivar, roles, verificaciones, cobros: el agente la propone y la persona confirma con un botón; por MCP requiere `"confirm": true`).
- **Contenido con IA:** todo borrador (artículos, términos, notas, descripciones) se guarda como pendiente o borrador; se aprueba en `/admin/revision`.
- **Contexto de página:** el chat manda la URL actual del admin, así el agente entiende "esta cepa".
- **MCP:** `POST /mcp` con `Authorization: Bearer $ADMIN_MCP_TOKEN` (vacío = desactivado).
- **Agregar una acción:** crea o edita `ai/actions/<módulo>.server.ts` con `defineAction` y, si es módulo nuevo, impórtalo en `ai/actions/index.server.ts`.

## Acciones (83)

### cepas

| Acción | Riesgo | Qué hace |
|---|---|---|
| `strain_create_draft` | escritura | Crea una cepa nueva SOLO con los datos que te dio la persona (no inventes cifras ni genética). Queda archivada (oculta del sitio) y pendiente; la persona la revisa y la restaura con strain_set_archived. Busca antes con strain_search para no duplicar. No redacta con IA: para eso usa luego strain_draft_description. |
| `strain_draft_description` | escritura | La IA redacta la descripción en español de una cepa usando solo sus datos guardados y la guarda en descriptionEs como pendiente. Si ya tiene descripción, falla salvo overwrite: true (pregúntale a la persona). Completa datos con strain_update antes si faltan. |
| `strain_generate_image` | **destructiva** (requiere confirmación) | Genera una imagen nueva con IA (fal.ai, cuesta dinero) a partir de los datos de la cepa y REEMPLAZA su imagen actual. Úsala solo si la persona lo pide. No sube imágenes propias. |
| `strain_get` | lectura | Trae la ficha completa de una cepa por id o slug (cannabinoides, terpenos, efectos, sabores, descripciones, genética, cultivo, revisión). Llámala antes de strain_update para no perder datos. |
| `strain_get_grow_info` | lectura | Trae solo los datos de cultivo de una cepa (semanas de floración, rendimiento, altura, clima, dificultad). Para editarlos usa strain_update. |
| `strain_search` | lectura | Busca cepas por nombre o alias, con filtros de tipo, archivadas y estado de revisión. Devuelve id, slug, tipo, reseñas y estado. Úsala antes de strain_get/strain_update para obtener el slug. No trae el detalle completo. |
| `strain_set_archived` | **destructiva** (requiere confirmación) | Archiva (oculta del sitio) o restaura (publica) una cepa. Úsala también para publicar un borrador creado con strain_create_draft. No borra datos. |
| `strain_submission_approve` | **destructiva** (requiere confirmación) | Aprueba una sugerencia: crea la cepa pública y da +10 pts a quien la envió. Si ya existe la cepa, usa strain_submission_merge. Llama strain_submission_list antes. |
| `strain_submission_list` | lectura | Lista las sugerencias de cepas de la comunidad pendientes, con coincidencia exacta o parecidas del catálogo. Úsala antes de aprobar, rechazar o fusionar. No cambia nada. |
| `strain_submission_merge` | **destructiva** (requiere confirmación) | Agrega el nombre sugerido como alias de una cepa existente y da +5 pts a quien lo envió. Úsala cuando la sugerencia es un duplicado. Llama strain_submission_list antes para ver las coincidencias. |
| `strain_submission_reject` | **destructiva** (requiere confirmación) | Rechaza una sugerencia de cepa con un motivo opcional. Llama strain_submission_list antes. No borra la sugerencia. |
| `strain_update` | escritura | Edita campos de una cepa (datos, descripciones, genética, cannabinoides y cultivo). Manda solo lo que cambia; las listas reemplazan la lista completa. Llama strain_get antes. Vuelve a pendiente de revisión. No archiva ni cambia la imagen. |

### dashboard

| Acción | Riesgo | Qué hace |
|---|---|---|
| `dashboard_stats` | lectura | Números generales del admin: cepas (y archivadas), reseñas, usuarios, reseñas reportadas, top 5 países y fuentes de adquisición. Úsala para "cómo vamos" en comunidad y usuarios. No incluye la revisión editorial: para eso usa review_stats. |

### efectos

| Acción | Riesgo | Qué hace |
|---|---|---|
| `effect_approve` | **destructiva** (requiere confirmación) | Aprueba un efecto pendiente y lo agrega al catálogo público; puede corregir labels y categoría en el mismo paso. Revisa la cola con effect_list status=pending. |
| `effect_create` | escritura | Crea un efecto con labels en español, inglés y portugués. Llama effect_list antes para no duplicar. Si lo crea el agente queda en la cola de revisión (pending); no lo aprueba. |
| `effect_get` | lectura | Trae un efecto por id o key (labels ES/EN/PT, categoría, estado, uso, razón de rechazo). |
| `effect_list` | lectura | Lista efectos del catálogo (por defecto los aprobados, los más usados primero). Filtra por estado (pending = cola de revisión) o categoría. Úsala antes de crear un efecto para no duplicarlo, o para encontrar el key destino de una fusión. |
| `effect_merge` | **destructiva** (requiere confirmación) | Fusiona un efecto duplicado con uno canónico (targetKey): lo marca rechazado con "Merged into: <key>". No reescribe cepas ni reseñas que usen el key viejo. Busca el key destino con effect_list. |
| `effect_reject` | **destructiva** (requiere confirmación) | Rechaza un efecto (sale de la cola y del catálogo). Si es un duplicado de otro efecto, usa effect_merge. |
| `effect_update` | escritura | Corrige labels o categoría de un efecto existente. Solo cambia lo que envíes; no cambia su estado (para eso, effect_approve / effect_reject). |

### glosario

| Acción | Riesgo | Qué hace |
|---|---|---|
| `glossary_create` | escritura | Crea un término con la definición que te dio la persona. Si quieres que la IA redacte la definición, usa glossary_draft. Queda oculto y pendiente de revisión. |
| `glossary_delete` | **destructiva** (requiere confirmación) | Elimina un término para siempre. Prefiere ocultarlo con glossary_set_published. |
| `glossary_draft` | escritura | Redacta con IA un término nuevo del glosario (definición + ejemplos) y lo guarda oculto y pendiente para que la persona lo revise en /admin/revision. Úsala cuando pidan "agrega/crea el término X". No publica nada. |
| `glossary_get` | lectura | Trae un término completo por id o slug (definición, ejemplos, relacionados, estado de revisión). |
| `glossary_list` | lectura | Lista términos del glosario (id, slug, término, categoría, si está publicado). Filtra por texto, categoría o publicados. Usa glossary_get para ver la definición completa. |
| `glossary_set_published` | **destructiva** (requiere confirmación) | Publica u oculta un término en el sitio. Publicar es una decisión de la persona. |
| `glossary_update` | escritura | Edita un término existente (definición, ejemplos, categoría, relacionados). Vuelve a pendiente de revisión. Pide glossary_get antes para no perder datos. |

### magazine

| Acción | Riesgo | Qué hace |
|---|---|---|
| `article_create` | escritura | Crea un artículo con el texto que te dio la persona. Queda como borrador y pendiente de revisión; no lo publica. Si la persona quiere que la IA lo escriba, usa article_draft. |
| `article_delete` | **destructiva** (requiere confirmación) | Elimina un artículo para siempre. Si solo hay que sacarlo del sitio, usa article_set_published con published=false. |
| `article_draft` | escritura | Redacta con IA un artículo del magazine (markdown, 500-800 palabras) a partir de un título y un brief, y lo guarda como borrador pendiente de revisión. Úsala cuando pidan "escribe/redacta un artículo sobre X". No publica nada; la persona lo revisa en /admin/revision. |
| `article_get` | lectura | Trae un artículo completo por id o slug (cuerpo markdown, bajada, SEO, autor, estado y revisión). Llámala antes de article_update. |
| `article_list` | lectura | Lista artículos del magazine (id, slug, título, categoría, estado, revisión, fecha de publicación). Filtra por texto en el título, estado o categoría. No trae el cuerpo: usa article_get para eso. |
| `article_set_published` | **destructiva** (requiere confirmación) | Publica un artículo en /magazine o lo regresa a borrador. Publicar es decisión de la persona; revisa antes que esté aprobado en /admin/revision. |
| `article_update` | escritura | Edita campos de un artículo (título, cuerpo, bajada, SEO, tags, categoría). Solo cambia lo que envíes y vuelve a pendiente de revisión. Llama article_get antes. No cambia el slug ni publica: para eso está article_set_published. |

### mapa-verde

| Acción | Riesgo | Qué hace |
|---|---|---|
| `legal_status_create` | escritura | Agrega un país al Mapa Verde con los datos que dio la persona. Si lo crea el agente queda oculto, pendiente y sin fecha de revisión. No inventes leyes ni fechas; llama legal_status_list antes para no duplicar el país. |
| `legal_status_get` | lectura | Trae la ficha completa de un país por id o código ISO (ej. "MX"): estatus, resumen, listas, ley, fuentes, estados y revisión. Llámala antes de legal_status_update. |
| `legal_status_list` | lectura | Lista los países del Mapa Verde (id, código ISO, nombre, región, estatus, visible, revisión, última revisión). Filtra por región, estatus o visibles. Usa legal_status_get para ver el contenido completo de un país. |
| `legal_status_review_checklist` | lectura | Para un país (id o código ISO), devuelve qué debe verificar una persona: revisión vieja, fuentes faltantes, listas vacías, estados sin nota y las afirmaciones a confirmar. Se arma solo con los campos del registro; no consulta leyes ni fuentes externas ni cambia nada. |
| `legal_status_set_active` | **destructiva** (requiere confirmación) | Muestra u oculta un país en /mapa-verde. Mostrarlo es publicar información legal: decisión de la persona. |
| `legal_status_update` | escritura | Edita la ficha legal de un país (estatus, resumen, listas, ley, fecha, fuentes, estados). Solo cambia lo que envíes; queda pendiente de revisión humana. Llama legal_status_get antes. No marca el país como revisado ni cambia su visibilidad. |

### moderacion

| Acción | Riesgo | Qué hace |
|---|---|---|
| `community_delete_post` | **destructiva** (requiere confirmación) | Borra para siempre un post del foro y todos sus comentarios. No se puede deshacer; prefiere community_remove_post. |
| `community_list_posts` | lectura | Lista posts del foro de comunidad (título, categoría, autor, votos, comentarios, estado) y el total de comentarios publicados. Filtra por estado (published/removed) o texto en el título. No trae el cuerpo del post. |
| `community_remove_post` | **destructiva** (requiere confirmación) | Oculta un post del foro (estado "removed"); se revierte con community_restore_post. Obtén el id con community_list_posts. |
| `community_restore_post` | **destructiva** (requiere confirmación) | Vuelve a publicar un post del foro que estaba oculto ("removed"). No recupera posts borrados con community_delete_post. |
| `moderation_delete_review` | **destructiva** (requiere confirmación) | Borra una reseña para siempre y recalcula promedios. No se puede deshacer; prefiere moderation_remove_review. |
| `moderation_get_review` | lectura | Trae una reseña completa por id (comentario, calificaciones, contexto, efectos, estado). Obtén el id con moderation_list_reviews. |
| `moderation_list_reviews` | lectura | Lista reseñas de usuarios (las más recientes primero) filtrando por estado (published/flagged/removed) o tipo de entidad. Úsala para revisar reportadas ("flagged"). No es la revisión editorial de cepas/glosario: para eso usa review_queue. |
| `moderation_remove_review` | **destructiva** (requiere confirmación) | Retira una reseña del sitio (estado "removed"); se puede revertir con moderation_set_review_status. Recalcula promedios. Úsala tras revisarla (moderation_get_review o review_moderation_suggestion). No la borra de la base. |
| `moderation_set_review_status` | escritura | Marca una reseña como reportada ("flagged") o la vuelve a publicar ("published"); recalcula promedios y stats del autor. Para ocultarla del sitio usa moderation_remove_review; para borrarla, moderation_delete_review. |
| `review_moderation_suggestion` | lectura | Pide a la IA una sugerencia de moderación (keep / flag / remove) con motivo para una reseña: revisa spam, venta, datos personales, menores y dosis peligrosas. Solo sugiere; no cambia nada. Para aplicar usa moderation_set_review_status o moderation_remove_review. |

### negocios

| Acción | Riesgo | Qué hace |
|---|---|---|
| `brand_create` | escritura | Crea una marca con los datos que dio la persona. Queda "pending" (no pública) y sin verificar. Para publicarla usa brand_set_status. Para redactar la descripción con IA usa brand_draft_description después. |
| `brand_delete` | **destructiva** (requiere confirmación) | Elimina una marca para siempre (no borra sus productos). Prefiere suspenderla con brand_set_status. |
| `brand_draft_description` | escritura | Redacta con IA una descripción breve y neutral en español para una marca o dispensario a partir de los datos que dio la persona, y la guarda en el registro. Llama brand_get o dispensary_get antes para el id. No verifica, no publica ni cambia estado o tier. |
| `brand_get` | lectura | Trae una marca completa por id o slug (incluye las de seed). Úsala antes de cambiar estado, tier o descripción. |
| `brand_list` | lectura | Lista marcas (id, slug, nombre, país, estado, tier, verificada, si es seed). Filtra por texto o estado; paginada. Los negocios ficticios de seed están ocultos salvo includeSeed: true. Usa brand_get para el detalle. |
| `brand_set_status` | **destructiva** (requiere confirmación) | Cambia el estado de una marca: active (pública), pending (oculta) o suspended. Activar publica; suspender la oculta. Llama brand_list o brand_get antes para obtener el id. No cambia tier ni verificación. |
| `brand_set_tier` | **destructiva** (requiere confirmación) | Cambia el tier de una marca (free, premium, enterprise). Premium/enterprise la marcan como verificada y le envían un email; free quita la verificación. Normalmente lo maneja Stripe; úsala solo si la persona lo pide explícitamente. No cambia el estado. |
| `dispensary_create` | escritura | Crea un dispensario con los datos que dio la persona (nombre, dirección y ciudad obligatorios). Queda "pending" (no público) y sin verificar. Para publicarlo usa dispensary_set_status; para la descripción con IA usa brand_draft_description con kind "dispensary". |
| `dispensary_delete` | **destructiva** (requiere confirmación) | Elimina un dispensario para siempre. Prefiere suspenderlo con dispensary_set_status. |
| `dispensary_get` | lectura | Trae un dispensario completo por id o slug (incluye seed). Úsala antes de cambiar estado, verificación o descripción. |
| `dispensary_list` | lectura | Lista dispensarios (id, slug, nombre, ciudad, estado, verificado, si es seed). Busca por nombre o ciudad y filtra por estado; paginada. Los de seed están ocultos salvo includeSeed: true. Usa dispensary_get para el detalle. |
| `dispensary_set_status` | **destructiva** (requiere confirmación) | Cambia el estado de un dispensario: active (público), pending (oculto) o suspended. Activar lo publica. Llama dispensary_list o dispensary_get antes para el id. No cambia la verificación. |
| `dispensary_set_verified` | **destructiva** (requiere confirmación) | Marca o desmarca un dispensario como verificado; verificar también lo sube a tier premium. Úsala solo si la persona confirmó la verificación por fuera. No cambia el estado (activo/pendiente). |
| `product_category_create` | escritura | Crea una categoría de producto inactiva (no visible en el sitio). La key es única y sin espacios. Para activarla usa product_category_set_active. Revisa product_category_list antes para no duplicar. |
| `product_category_delete` | **destructiva** (requiere confirmación) | Elimina una categoría para siempre; falla si tiene productos. Prefiere desactivarla con product_category_set_active. |
| `product_category_list` | lectura | Lista categorías de producto (id, key, nombres, sector, activa). Úsala para obtener la categoryKey antes de product_create o product_list. |
| `product_category_set_active` | **destructiva** (requiere confirmación) | Activa (visible en el sitio) o desactiva una categoría de producto. Llama product_category_list antes para el id. |
| `product_create` | escritura | Crea un producto como borrador (no público). Requiere brandId (de brand_list) y categoryKey (de product_category_list). Para publicarlo usa product_set_status. No lo promueve. |
| `product_delete` | **destructiva** (requiere confirmación) | Elimina un producto para siempre. Prefiere archivarlo con product_set_status. |
| `product_get` | lectura | Trae un producto completo por id o slug, con su marca (incluye seed). Úsala antes de cambiar estado o promoción. |
| `product_list` | lectura | Lista productos (id, slug, nombre, marca, categoría, estado, promovido). Filtra por texto, estado, marca o categoría; paginada. Usa brand_list para el brandId y product_category_list para la categoryKey. Incluye seed solo con includeSeed: true. |
| `product_set_promoted` | **destructiva** (requiere confirmación) | Promueve o quita la promoción de un producto (destacado en el sitio). Úsala solo si la persona lo pide. Llama product_get antes para ver el estado actual. No cambia el estado del producto. |
| `product_set_status` | **destructiva** (requiere confirmación) | Cambia el estado de un producto: active (público), draft (borrador) o archived. Activar lo publica. Llama product_list o product_get antes para el id. No cambia la promoción. |

### revision

| Acción | Riesgo | Qué hace |
|---|---|---|
| `review_get_record` | lectura | Trae un registro con sus campos editables, estado de revisión, nota de la redacción y contexto (terpenos, fuentes). |
| `review_propose_edit` | escritura | Corrige campos de un registro usando los paths de review_get_record (ej. "summary", "cannabinoidProfile.thc.max"). El registro vuelve a "pendiente" para que la persona apruebe. No inventes datos. |
| `review_queue` | lectura | Lista registros de una colección por estado de revisión. Las cepas salen por popularidad. Usa review_get_record con el id para ver el contenido. |
| `review_stats` | lectura | Avance de la revisión editorial: pendientes, aprobados y rechazados por colección (cepas, glosario, mapa-verde, articulos) y notas de la redacción por aprobar. Úsala cuando pregunten "cómo vamos" o qué conviene revisar. |
| `strain_draft_editorial_note` | escritura | Redacta con IA la "Nota de la redacción" de una cepa usando solo sus datos. Queda pendiente hasta que la persona la apruebe. No reescribas notas aprobadas salvo que lo pidan. |
| `strain_find_incomplete` | lectura | Cepas con huecos (sin THC, terpenos, descripción o genética), las más conocidas primero. Para priorizar trabajo de datos; no completa nada. |

### usuarios

| Acción | Riesgo | Qué hace |
|---|---|---|
| `users_get` | lectura | Trae un usuario por id o username (rol, país, reseñas, puntos, badges, onboarding). No devuelve correo ni datos de acceso. |
| `users_list` | lectura | Lista o busca usuarios (más recientes primero) por username parcial, país (MX, CO…) o rol. Devuelve rol, reseñas, puntos y badges. Úsala antes de users_set_role o users_reset_points para confirmar el usuario. No devuelve correos. |
| `users_reset_points` | **destructiva** (requiere confirmación) | Reinicia a 0 los puntos de un usuario y borra sus badges ganados. No toca sus reseñas ni su rol. No se puede deshacer. |
| `users_set_role` | **destructiva** (requiere confirmación) | Cambia el rol de un usuario: "admin" da acceso al panel, "user" lo quita. No permite quitar al último admin. Confirma antes el usuario con users_list o users_get. |
