# WeedHub — Design Reference ("Verde Noche")

**Single source of truth para UI.** Si una pantalla en el código se ve distinta a este documento, este documento gana. Fuente original: `/Users/oswaldinho24k/Downloads/design_handoff_weedhub/design/`.

---

## REGLA DE ORO (nunca olvidar)

**Los estados activos/seleccionados se hacen con `style={{}}` inline usando CSS variables — no con arbitrary Tailwind (`bg-[color-mix(...)]`).** El demo usa inline styles vanilla y por eso se ven nítidos. Mis intentos con `bg-[color-mix(...)]` de Tailwind v4 se compilan mal y terminan invisibles.

Patrón canónico para cards/tiles seleccionables:

```tsx
<button
  style={{
    padding: 24,
    border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
    borderRadius: "var(--radius-lg)",
    background: active ? "var(--accent-soft)" : "var(--bg-raised)",
    transition: "all .15s",
  }}
>
```

Y siempre poner un **checkmark** de 20×20 en `top-right` cuando está activo:

```tsx
{active && (
  <div style={{
    position: "absolute", top: 14, right: 14,
    width: 20, height: 20, borderRadius: "50%",
    background: "var(--accent)", color: "var(--accent-ink)",
    display: "grid", placeItems: "center",
  }}>
    <Icon name="check" size={11} strokeWidth={3} />
  </div>
)}
```

---

## Principios (Verde Noche)

1. **Editorial, no e-commerce.** Lee como revista que se puede buscar.
2. **Data-first en cepas.** Curva de tiempo, radar de terpenos, momento del día — no decorativas.
3. **Accent es señal, no fondo.** `var(--accent)` aparece en CTAs, estados activos, un dato clave por vista. Nunca como wash.
4. **Spanish-first, LatAm-framed.** Español nativo con contexto mexicano/latino. Voz "tú". **"Bienvenide"** (neutral), no "Bienvenido".
5. **Contexto sobre scores.** Cada reseña trae método · momento · experiencia.

---

## Tokens (oklch — canónicos)

### Dark (default)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `oklch(16% 0.025 150)` | Fondo página |
| `--bg-raised` | `oklch(20% 0.028 150)` | Cards |
| `--bg-sunken` | `oklch(13% 0.022 150)` | Secciones alternas, inputs |
| `--bg-elev` | `oklch(24% 0.03 150)` | Hover, chips |
| `--line` | `oklch(32% 0.025 150)` | Bordes default |
| `--line-strong` | `oklch(42% 0.03 150)` | Bordes marcados |
| `--fg` | `oklch(94% 0.015 85)` | Texto primario |
| `--fg-muted` | `oklch(72% 0.02 85)` | Secundario |
| `--fg-dim` | `oklch(56% 0.02 85)` | Meta, labels |
| `--accent` | `oklch(76% 0.17 145)` | Verde señal |
| `--accent-ink` | `oklch(22% 0.08 145)` | Texto sobre accent |
| `--accent-soft` | `oklch(38% 0.08 145)` | Tints, fondo de seleccionado |
| `--warm` | `oklch(72% 0.13 55)` | Indica, advertencia, negativo |
| `--warm-soft` | `oklch(38% 0.07 55)` | Tints warm |
| `--lilac` | `oklch(74% 0.11 310)` | Tricoma, híbrida, editorial |
| `--lilac-soft` | `oklch(38% 0.06 310)` | Tints lilac |
| `--gold` | `oklch(82% 0.14 85)` | Estrellas, progreso de reseña |

Light theme: mismos nombres recalibrados. Ver `app/app.css` + `/ds` route.

### Radii

`--radius-sm: 4px` · `--radius: 8px` · `--radius-lg: 14px` · `--radius-xl: 22px` · `--radius-pill: 999px`

### Fuentes

| Token | Stack |
|---|---|
| `--font-display` | Fraunces (variable: opsz 9..144, wght 300..900, SOFT 30..100, WONK 0..1) |
| `--font-body` | Instrument Sans |
| `--font-mono` | JetBrains Mono |

Italics expresivos con `.display-wonk` → `SOFT 100 / WONK 1`.

### Sombra

Solo una, deliberada:
```
--shadow-soft: 0 1px 0 oklch(40% 0.03 150 / 0.4) inset,
               0 20px 40px -20px oklch(0% 0 0 / 0.6);
```

---

## Escala tipográfica

| Uso | Tamaño | LH |
|---|---|---|
| Hero (landing/auth) | `clamp(52px, 8.2vw, 128px)` | 0.98 |
| Page title (directorio) | 84px | 1 |
| Strain hero name | 120px | 1 |
| H2 de sección | 56px | 1.05 |
| Step title (wizard) | 56px | 1 |
| Card heading | 28–32px | 1.1 |
| Card display | 22–24px | — |
| Body L | 20px | 1.5 |
| Body | 16px | 1.55 |
| Small / meta | 12–13px | — |
| Kicker (mono uppercase) | 11px · ls 0.12em · `var(--fg-muted)` | — |
| Data (mono tnum) | 10–14px | — |

---

## Utility classes (en `app/app.css`)

- `.display`, `.display-wonk` — Fraunces + variation-settings
- `.mono`, `.tnum` — JetBrains Mono con tabular nums
- `.kicker` — mono uppercase 11px, spacing 0.12em
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-warm`, `.btn-link`
- `.pill` + variants `.accent`, `.warm`, `.lilac`, `.active`
- `.chip` + `.on`, `.on-accent`, `.on-warm`
- `.card`, `.card-strong`
- `.hrule`, `.ph` (placeholder de imagen), `.grain`, `.leaf-mark`
- `.fade-in`, `.fade-up`, `.toast-in`

---

## Iconografía

Todas Lucide (stroke 1.5–1.8, currentColor). Wrapper en `app/components/ui/icon.tsx` con mapeo `designName → LucideComponent`. Tamaños típicos: 12–22px.

Excepciones:
- **Estrellas**: SVG custom con gradiente para medio-llenado, color `var(--gold)`
- **Leaf logo**: SVG dibujado en `app/components/layout/logo.tsx`

---

## Componentes clave — comportamiento

### `.chip` seleccionado — tres tonos según contexto

| Contexto | active bg | active color | active border |
|---|---|---|---|
| Neutro (método, frecuencia, tipo) | `var(--fg)` | `var(--bg)` | `var(--fg)` |
| Positivo / seek (efectos + buscar) | `var(--accent)` | `var(--accent-ink)` | `var(--accent)` |
| Negativo / evitar | `var(--warm)` | `oklch(20% 0.04 55)` | `var(--warm)` |
| Sabores (review step 3) | `var(--lilac)` | `oklch(15% 0.04 310)` | `var(--lilac)` |

Cuando active siempre agregar `<Icon name="check" size={12} strokeWidth={3} />` al final.

### StrainThumb (SVG trichome)

- 28 puntos pseudo-random basados en `i * 31 % 100` / `i * 53 % 100`
- Radial gradient centrado en 30%/40% con `color-mix` del `strain.color` hint al 50% con `var(--bg-sunken)`
- Overlay inferior: gradient linear a `var(--bg)` al 90% (simula scrim)
- Tamaños: `sm` (48×48), `md` (1:1), `lg` (4:3)

### TimeCurve (SVG data viz — pieza distintiva)

- Canvas 480×180, padding 20
- 3 líneas: **cerebral** (accent, solid, con área llenada al 10%), **calm** (warm, solid), **energy** (lilac, dashed 4-3)
- Grid horizontal dashed `var(--line)` en 0/25/50/75/100
- Labels de tiempo abajo con mono 9px
- Legend arriba-derecha: circulos de 3px + texto 10px

### TerpeneRadar (SVG)

- 180×180, centro (90, 90), radio máx 70
- 5+ ejes según cantidad de terpenos (mínimo 5 para que se lea polígono)
- 4 rings (0.25, 0.5, 0.75, 1) con stroke `var(--line)` 0.5px
- Polígono fill `var(--accent)` al 20% + stroke 1.5px
- Puntos en cada vértice con dot 2.5px

### Momento del día (3 boxes)

```tsx
<div style={{
  flex: 1, padding: 12, textAlign: 'center',
  background: isPrimary ? 'var(--accent-soft)' : 'var(--bg-sunken)',
  borderRadius: 'var(--radius)',
  fontSize: 13,
}}>
  Mañana / Tarde / Noche
  <div className="mono tnum">{pct}%</div>
</div>
```

---

## Breakpoints

- **1180px** — ocultar chip decorativo de coordenadas (`.hero-coords`)
- **1100px** — sidebar de strain detail colapsa
- **900px** — 3-col → 2-col grids
- **780px** — auth deja de ser 50/50 y stackea
- **600px** — todo a 1 col
- **960px** — rail lateral colapsa a iconos (si se usa)

---

## Layout widths

| Screen | max-width | padding |
|---|---|---|
| Landing, directorio, strain, community, editorial | 1280px | 40px horizontal |
| Profile, admin | 1200px | 24px |
| Auth | 1fr 1fr, sin max (stacks <780px) | 64px en cada panel |
| Onboarding | **900px** | 40px |
| Review flow | **760px** | 40px |
| Legal (terminos/privacidad) | 720px | 24px |

---

## Patrones por pantalla

### Landing (`/`)

Orden estricto:
1. **Hero**: pill "Informa · Conecta · Cultiva" + kicker fecha · Hero headline 128px con una palabra italicizada con `.display-wonk` + copy + dos CTAs (`btn-primary` + `btn-ghost`) · stats 3-col separados por border-top
2. **Coord chip absoluto** top:92 right:40, mono 10px, `hero-coords` class (oculto <1180px)
3. **Featured strain** (card `.grain`): grid 1.2fr 1fr — StrainThumb izq, pill + display 26px + stats 4-col der
4. **Strain grid** 3-col: cards con `<StrainThumb>` + pills tipo+terpeno + display 32px name + THC mono + lineage + tags + rating footer
5. **Community voices** en `bg-sunken` con border top/bottom: h2 con italic warm + 3 blockquotes en display 24px
6. **Editorial** 1.4fr 1fr 1fr: 3 articles, primero grande con aspect 16:10 placeholder
7. **Footer** en `bg-sunken`: 2fr 1fr 1fr 1fr — Logo + blurb / Producto / Empresa / Legal

**Microcopy exacto**:
- H1: "La enciclopedia *viva* del cannabis hispano."
- Stats: "847 cepas catalogadas" · "12K reseñas verificadas" · "23 países latinos"
- "No somos un catálogo de dispensarios. Somos la comunidad que documenta, explica y respeta la planta — en español, desde México para Latinoamérica."
- Footer: "Hecho en 🇲🇽, para Latinoamérica."

### Directorio (`/strains`)

1. **Hero strip**: kicker "Directorio de Cepas" · H1 84px con número `12,394` en accent italic · search pill + botón Filtros
2. **Filter bar** sticky en `bg-sunken`: grupo Tipo (Todos/Sativa/Indica/Híbrida) · divider 1px · grupo Efecto (Relajante/Energético/Cerebral/Creativo) · contador resultados derecha · toggle grid/list · sort
3. **Results**: grid 3-col con `StrainCard` o lista con `StrainRow` (60px 1.3fr 1fr 100px 120px 140px 40px)

Chips activos usan `.chip.on` (fg/bg inversos — no accent). Solo las cepas en sí y los CTAs usan accent.

### Strain detail (`/strains/:slug`)

1. **Hero** grid 1.1fr 1fr:
   - Izquierda: botón "← Directorio" · pills tipo+lineage · display **120px** name · copy 17px · rating inline · tres botones (`Comparte tu experiencia` primary + `Guardar` ghost + share icon ghost)
   - Derecha: `StrainThumb size="lg"` + stats card 5-col (THC accent / CBD lilac / Terpeno / Efecto / Dificultad)
2. **Tab bar sticky** top:73, `bg` 90% + blur: Perfil completo · Efectos & Terpenos · Experiencias · {count} · Cultivo. Activo: `border-bottom: 2px solid var(--accent)`
3. **Effects + Time curve** grid 1fr 1fr (gap 32):
   - Card izq: "Perfil de efectos" · `EffectBar` grande por cada efecto · color según valor (>75 accent / >50 warm / else lilac)
   - Card der: "Curva en el tiempo" + svg `TimeCurve`
4. **Terpenes + Flavors** grid 1.2fr 1fr:
   - Izq: h3 "Terpenos dominantes" + TerpeneRadar + lista de terpenos con dot de color por índice `[accent, warm, lilac, gold]`
   - Der: "Sabor & aroma" con pills accent + "Mejor momento para consumir" 3 boxes horizontales
5. **Reviews** grid 300px 1fr:
   - Izq sticky: h3 "Experiencias" + card con rating 64px display + distribution de 5 barras `var(--gold)` + CTA "Escribir reseña" full width
   - Der: stack de `ReviewCard` + botón "Cargar N más" ghost

### Auth (`/auth`)

Split 50/50:
- **Izquierda** en `bg-sunken`: Logo · kicker "Manifiesto #003" · H1 80px con palabra italic accent · copy · stats 3-col bottom
- **Derecha** max-width 560: tabs login/register con underline accent · H2 44px · fields con `<Field label icon trailing>` · strength bar 4 barras accent/warm · `<Checkbox>` custom · submit primary · divider "O continúa con" · botones OAuth ghost

Stacks vertical <780px.

Copy: "Bienvenide de vuelta." / "Crea tu cuenta. / Tu voz hace que la comunidad crezca."

### Onboarding (`/onboarding`) — 5 pasos

- **Progress bar arriba**: header "Paso N de 5 · {label}" con accent % derecha, 5 segmentos de 3px
- **Main** max 900px, padding 64px 40px
- **Footer sticky** border-top: "Anterior" ghost disabled si step 0 · "Continuar" primary disabled si no `canContinue`

**canContinue por paso** (CRÍTICO — el user se quejó de esto):
```
step 0 (familiarity): !!data.familiarity   ← debe elegir
step 1 (goals): data.goals.length > 0      ← al menos uno
step 2 (methods): data.methods.length > 0  ← al menos uno
step 3 (effects): data.effects.length > 0  ← al menos uno
step 4 (complete): true
```

**Paso 0 — Radio cards** (lista vertical):
```tsx
<button style={{
  padding: '20px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 20,
  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
  borderRadius: 'var(--radius-lg)',
  background: active ? 'var(--accent-soft)' : 'var(--bg-raised)',
}}>
  <div style={{ width: 48, height: 48, borderRadius: 12, ... }}>  // icon square
  <div>title 24px + desc 13px</div>
  <div> // 20×20 radio:
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--line-strong)'}`
    background: active ? 'var(--accent)' : 'transparent'
    check visible si active
  </div>
</button>
```

**Paso 1-2 — Tiles multi-select** (grid 3-col):
```tsx
<button style={{ padding: 24, borderRadius: 'var(--radius-lg)', position: 'relative',
  border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
  background: on ? 'var(--accent-soft)' : 'var(--bg-raised)',
}}>
  <Icon size={22} style={{ color: on ? 'var(--accent)' : 'var(--fg-muted)', marginBottom: 14 }} />
  <div className="display" style={{ fontSize: 22 }}>{title}</div>
  <p style={{ fontSize: 12 }}>{desc}</p>
  {on && <div style={{ position: 'absolute', top: 14, right: 14, width: 20, height: 20,
    borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-ink)' }}>
    <Icon name="check" size={11} strokeWidth={3} />
  </div>}
</button>
```

**Paso 3 — Bifurcated chips**: sección "Positivos (busco)" con icon smile + kicker accent, y "Evitar" con icon alert + kicker warm. Chips usan estilo inline (ver tabla de chips arriba).

**Paso 4 — Complete**: check circle 72×72 `accent-soft` bg + `accent` color · kicker accent "Perfil actualizado" · display 84px "Listo.\nYa te conocemos un poco." · 3 summary cards · botones Explorar primary + Editar perfil ghost

### Review flow (`/strains/:slug/review`) — 5 pasos

- **Progress bar en `var(--gold)`** (no accent — es el motif de ratings)
- Max-width 760, strain badge card arriba con thumb+nombre+lineage
- **Paso 0 — Rating**: h1 centrado 56px · emoji 64px que cambia con valor · `BigStarInput` size=48 con scale 1.1 on hover · card "Calificación detallada" con Effect/Sabor/Potencia usando `StarRating` size=22
- **Paso 1 — Context**: h1 centrado · 3 secciones (Método/Momento/Situación) con chips `.on` neutro
- **Paso 2 — Effects**: h1 centrado · "Positivos" con chips accent · "Neutrales o negativos" con chips warm
- **Paso 3 — Flavors**: chips **lilac** seleccionados, centrados
- **Paso 4 — Details**: frecuencia chips neutro · recomend 2-col thumbUp/thumbDown cards (accent/warm) · textarea 500 chars con counter · photo upload dashed area

Botón final Publicar usa `background: var(--gold); color: oklch(20% 0.04 85);` — no accent.

### Community (`/community`)

Hero strip: kicker + H1 84px "Miles de *voces*, una sola conversación." · grid 3-col de cards con avatar circle accent + nombre/city·role + blockquote display 20px.

### Editorial (`/editorial`)

Hero: kicker "Magazine" + H1 84px "Ciencia, cultura y *crónica* cannábica." · grid 2-col de article cards con placeholder 16:9 + pill lilac categoria + display 32px title + dek.

### Legal (`/terminos`, `/privacidad`)

Max 720px, kicker + H1 display · "Última actualización" kicker · secciones con h2 24px display + p con `fg-muted` leading-relaxed.

---

## Pitfalls que ya cometí (no repetir)

1. **Tailwind arbitrary `color-mix`** en estados activos — no renderiza confiablemente en v4. Usar `style={{}}` inline.
2. **Placeholders por defecto en selects** — si el estado inicial coincide con una opción válida, el user puede avanzar sin elegir. Empezar con `""` y gate con `!!value`.
3. **Material Symbols** — ya no se usa. Todo Lucide vía `Icon` wrapper.
4. **`framer-motion` / `motion`** — eliminado. Usar `.fade-in` / `.fade-up` CSS.
5. **Outline + box-shadow ring grueso** en estados activos — se ve "web 2.0", no editorial. El demo solo usa border 1px accent + bg accent-soft. No agregar outline de 2px.
6. **Emojis en UI seria** (familiaridad, métodos) — el critique original lo llama fuera expresamente. Solo Lucide. Emojis permitidos en microcopy tipo 🇲🇽 o en rating mood (moods emoji son decorativos en step 0 del review).
7. **Neon green / glow effects** — prohibido. El accent verde aparece solo en elementos activos, nunca como glow de fondo.

---

## Assets pendientes

- `public/og-default.png` — todavía falta. Cualquier imagen editorial 1200×630 funcionará.
- Imágenes reales de strains (actualmente usamos StrainThumb SVG por defecto). Direction: luz natural cálida, profundidad de campo, superficies terrosas. Estilo *Kinfolk* × guía botánica. **Evitar** filtro verde / neón / estética "stoner".
- Avatares reales (ya tenemos upload en /profile/edit).

---

## Referencias en código

- Tokens y utilities: `app/app.css`
- Componentes UI (primitivos): `app/components/ui/`
- Componentes compuestos (charts, cards): `app/components/composite/`
- Layout: `app/components/layout/`
- `/ds` (`app/routes/ds.tsx`) — página interna con todos los tokens y componentes vivos
- Este documento: `DESIGN.md` (raíz)
