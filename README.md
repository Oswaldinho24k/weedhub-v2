# WeedHub — Verde Noche

Enciclopedia hispana del cannabis: directorio de cepas, reseñas con contexto (método · momento · experiencia) y editorial en español.

Stack:

- **React Router v7** (SSR)
- **Tailwind CSS v4** con sistema de tokens `oklch` (tema claro + oscuro)
- **MongoDB** + Mongoose
- **Fraunces** / **Instrument Sans** / **JetBrains Mono**
- **Lucide** para iconografía

## Requisitos

- Node.js 20+
- MongoDB 6+ (local o Atlas)

## Configuración

Copia `.env.example` a `.env` y completa los valores:

```
MONGODB_URI=mongodb://localhost:27017/weedhub
SESSION_SECRET=<al menos 32 caracteres>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Desarrollo

```bash
npm install
npm run seed      # carga ~50 cepas en la base de datos (requerido tras cada pull si cambia el modelo)
npm run dev       # arranca en http://localhost:5173
```

Otros scripts:

```bash
npm run build       # build de producción
npm run start       # sirve el build
npm run typecheck   # tipos estrictos
```

## Rutas principales

| Ruta | Descripción |
|---|---|
| `/` | Landing editorial con estadísticas reales |
| `/strains` | Directorio con filtros (tipo, efectos, vista grid/list) |
| `/strains/:slug` | Detalle de cepa con curva de efectos, radar de terpenos y momentos del día |
| `/strains/:slug/review` | Flujo de 5 pasos para publicar reseña con contexto |
| `/auth` | Login / registro 50 % narrativa / 50 % formulario |
| `/onboarding` | 5 pasos: perfil, objetivos, método, efectos, resumen |
| `/profile` · `/profile/:userId` · `/profile/edit` | Perfil propio, público y edición |
| `/community` | Voces de la comunidad + feed de reseñas |
| `/editorial` | Magazine editorial (artículos curados) |
| `/admin` | Panel de administración (solo rol `admin`) |
| `/ds` | Referencia de design system (no listada en navegación) |

## Temas

- Dark (predeterminado) y light. Selector en el header — preferencia persistida en cookie `wh:theme`.
- Todos los tokens en `oklch`; ver `app/app.css` y `/ds`.

## Diseño

Basado en el handoff "Verde Noche" (`design_handoff_weedhub/`). Los tokens en `design/styles.css` son canónicos; si un valor difiere entre el diseño y el código, la página `/ds` gana.

## Deploy

`Dockerfile` multi-stage incluido. Sirve con `npm run start` en el puerto 3000. Compatible con Fly.io, Railway, Cloud Run, etc.

```bash
docker build -t weedhub .
docker run -p 3000:3000 --env-file .env weedhub
```
