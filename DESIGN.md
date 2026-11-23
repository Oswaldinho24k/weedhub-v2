---
name: WeedHub
description: The cannabis encyclopedia of Latin America, lettered as a hand-painted street wall.
colors:
  cobalt: "#1d3fbf"
  cobalt-deep: "#142d8c"
  ink: "#141414"
  enamel: "#fbfbf8"
  fluor-pink: "#ff4fa3"
  fluor-yellow: "#f6e534"
  fluor-green: "#7cf08a"
  fluor-orange: "#ff8a2a"
  bg-raised: "#ffffff"
  bg-sunken: "#ecece6"
  line: "#cfcdc3"
  fg-muted: "#3f3e39"
  fg-dim: "#5f5e57"
  accent-soft: "#fff39a"
  warm: "#c8105c"
  warm-soft: "#ffd9ea"
  lilac: "#6a2bc4"
  lilac-soft: "#ebdfff"
  gold: "#c98a00"
  night-bg: "#0e1330"
  night-raised: "#161d45"
  night-sunken: "#0a0e25"
  night-elev: "#1d2654"
  night-line: "#2f3a72"
  night-fg: "#f6f5ef"
  night-fg-muted: "#c9cbe0"
  night-fg-dim: "#9da2c4"
  night-wall: "#1a2a8a"
  night-lilac: "#b98cff"
typography:
  masthead:
    fontFamily: "Bowlby One, Archivo, sans-serif"
    fontSize: "clamp(84px, min(13vw, 21vh), 176px)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "0em"
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(40px, 5vw, 64px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 72"
  strain-name:
    fontFamily: "Permanent Marker, Archivo, cursive"
    fontSize: "clamp(19px, 5vw, 27px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0.01em"
  price:
    fontFamily: "Bowlby One, Archivo, sans-serif"
    fontSize: "clamp(32px, 8vw, 44px)"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  prose:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
  button:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 78"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 75"
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "6px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  section: "56px"
  section-lg: "64px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.bg-raised}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-ghost:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  button-ghost-hover:
    backgroundColor: "{colors.fluor-yellow}"
    textColor: "{colors.ink}"
  button-warm:
    backgroundColor: "{colors.fluor-pink}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  button-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.enamel}"
  button-disabled:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.fg-dim}"
  chip:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  chip-hover:
    backgroundColor: "{colors.fluor-yellow}"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.enamel}"
  tag:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "3px 8px"
  tag-accent:
    backgroundColor: "{colors.fluor-yellow}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.bg-raised}"
    rounded: "{rounded.lg}"
  cartulina-sativa:
    backgroundColor: "{colors.fluor-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "16px"
  cartulina-indica:
    backgroundColor: "{colors.fluor-pink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "16px"
  cartulina-hybrid:
    backgroundColor: "{colors.fluor-green}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "16px"
  input:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  nav-strip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.enamel}"
    height: "56px"
---

# Design System: WeedHub

## Overview

**Creative North Star: "Rótulo y Cartulina"**

WeedHub is an encyclopedia lettered as a street wall: the hand-painted signs of Mexican rótulos and Brazilian abridores de letras, plus the fluorescent cartulinas a market stall pins up to announce prices. Every strain is a sign the community keeps repainting. Whole regions of a page are painted fields (cobalt by default, yellow, pink or ink per section) on a white enamel ground, and everything on them is lettered in black with a confident brush.

Density is high and legible, not airy. Pages read as a wall of boards, each with a hard 2-3px ink outline, barely rounded corners, and a slight tilt where something is pinned rather than built. Data stays honest inside the paint: a rating is lettered with the weight of its evidence, and a missing number reads "sin datos" instead of being invented. The world explicitly rejects the dark-green cannabis database with neon accents and equal photo cards it replaced.

The interface speaks Spanish and Portuguese as equals. English strings exist in content files but are not served.

**Key Characteristics:**
- Full-bleed painted wall bands own whole sections; white enamel is the ground between them.
- Three lettering hands: Bowlby One for rótulo mastheads and prices, Permanent Marker for strain names, condensed Archivo for everything else.
- Strains are fluorescent cartulinas, toned by type, pinned slightly askew, with THC lettered like a price.
- Controls are painted boards with a solid ink drop under them and five distinct states.
- One authored motion: signs settle onto the wall.

## Colors

A painted-wall palette: one deep cobalt field, flat black ink, white enamel, and four fluorescent cartulina tones used at full strength.

### Primary
- **Rótulo Cobalt** (cobalt): the default wall field (hero band, page mastheads, footer, the aside board) and the day-mode accent: primary buttons, focus ring, caret, accent figures. Its pressed tone is **Deep Cobalt** (cobalt-deep), used only as the primary button's hover.

### Secondary
- **Cartulina Yellow** (fluor-yellow): masthead lettering on cobalt, the hover paint for ghost buttons, chips and list rows, the input focus halo, text selection, accent tags, the yellow wall band, and the night-mode accent. Sativa cartulinas.
- **Cartulina Pink** (fluor-pink): the warm action board (search submit), link underlines, the pink wall band, warm tags. Indica cartulinas.
- **Cartulina Green** (fluor-green): hybrid cartulinas, the "lilac" tag slot, and the legal-recreational country band.
- **Cartulina Orange** (fluor-orange): a fourth cartulina tone, available for non-type signage.

### Tertiary
- **Magenta Paint** (warm) and its **Magenta Wash** (warm-soft): warnings, negatives and the warm-outline button on the day wall. At night `warm` becomes Cartulina Pink.
- **Violet Paint** (lilac, lilac-soft): editorial and hybrid accents in older composites.
- **Rating Gold** (gold): star ratings on the day wall; at night it becomes Cartulina Yellow.

### Neutral
- **Sign Ink** (ink): all lettering, every board outline (line-strong), the nav strip and ink wall band.
- **White Enamel** (enamel): the page ground on the day wall.
- **Board White** (bg-raised): cards, search board, ghost buttons, inputs, blank cartulinas.
- **Primed Wall** (bg-sunken): disabled boards, image placeholders, meter tracks, scrollbar track.
- **Pencil Line** (line): the only hairline; dividers inside boards and disabled outlines.
- **Faded Ink** (fg-muted) and **Chalk Ink** (fg-dim): secondary text and placeholders.
- **Butter Wash** (accent-soft): soft accent background on the day wall.

### The night wall (`.dark`)
The dark theme is the same wall after sundown, not a different world. Ground turns to **Night Navy** (night-bg) with **Night Board** (night-raised), **Night Pit** (night-sunken) and **Night Lift** (night-elev) surfaces, **Night Line** for hairlines, and **Bone** (night-fg) for text and board outlines, with night-fg-muted and night-fg-dim below it. The accent flips from cobalt to Cartulina Yellow (with ink text on it), warm flips to Cartulina Pink, lilac lifts to **Night Violet** (night-lilac), gold to yellow, and the cobalt wall darkens to **Night Cobalt** (night-wall). Cartulinas, the pink and yellow wall bands, and the ink nav strip keep their day colors.

### Named Rules
**The Full-Strength Fluor Rule.** Fluorescent tones are paint, never tint. They appear as solid fields (cartulinas, wall bands, hover paint, tags) with ink lettering on top, and never as translucent glows, gradients or colored text on white.

**The Cartulina Tone Rule.** A strain's cartulina tone follows its type: sativa yellow, indica pink, hybrid green, unknown blank white. Tone is never decorative randomness.

**The Ink-on-Fluor Rule.** Text on any fluorescent field is Sign Ink. Text on cobalt is white or yellow. Text on the ink strip is enamel, yellow on hover.

## Typography

**Rótulo Font:** Bowlby One (with Archivo, sans-serif)
**Marker Font:** Permanent Marker (with Archivo, cursive)
**Body and Display Font:** Archivo variable, width 62-125% (with system-ui, sans-serif)

All three are self-hosted in `public/fonts/` with `font-display: swap`.

**Character:** A sign painter's kit. Bowlby One is the heavy brush capital of the masthead; Permanent Marker is the felt-tip hand that writes a strain's name on its card; Archivo, condensed through `font-stretch`, is the block lettering for headings, labels and controls and relaxes to normal width for reading.

### Hierarchy
- **Masthead** (Bowlby One 400, uppercase, clamp up to 176px on home and 120-168px on section mastheads, line-height 0.86): the page's name painted on its wall band, in Cartulina Yellow with the rótulo drop shade (`text-shadow: .045em .045em 0` ink). Also the giant footer wordmark and rank numbers.
- **Price** (Bowlby One 400, 32-56px, line-height 1): THC percentage on a cartulina, with the % sign at half size; stat figures and list rank numerals at 24-40px.
- **Display** (Archivo 800, width 72%, clamp 40-64px, line-height 0.98, -0.01em, balanced wrap): section headings on the enamel ground and on wall bands.
- **Strain Name** (Permanent Marker 400, clamp 19-27px, 24-34px on large signs, line-height 1.04): the strain's name on its cartulina; it wraps anywhere rather than truncating.
- **Title** (Archivo 800, width 85%, 22px, line-height 1.2): sub-headings, prose h3, data cell values.
- **Body** (Archivo 400, 16px, line-height 1.5; 18px / 1.7 with paragraphs capped at 68ch in long-form prose): reading text at normal width.
- **Label** (Archivo 700-800, width 75-78%, 12-13px, 0.03-0.04em, uppercase): data labels, form labels, tags, footer column heads. Buttons use the same voice at 15px, width 78%, weight 800.

### Named Rules
**The Three Hands Rule.** Bowlby One letters only mastheads, prices and rank numerals; Permanent Marker letters only strain names; every other word is Archivo. A fourth face, or a marker heading, breaks the wall.

**The Shade Is for Mastheads Rule.** The rótulo drop shade belongs to display lettering on a wall band. Body text, buttons and headings on the enamel ground carry none.

**The Condense, Don't Shrink Rule.** Hierarchy among Archivo roles comes from weight and `font-stretch` (72-85% for lettering, 100% for reading), not from adding faces or italics. Italic is not part of the system.

## Layout

A single centered container (1280px max, 760-1100px for reading pages) with a 16px gutter on mobile and 24px from `sm`. Wall bands run full-bleed behind the container and are separated by 3px ink borders top and bottom; sections inside the enamel ground breathe at 56-64px vertical padding.

Compositions are asymmetric two-column grids at `lg` (for example 1fr / 440px for the masthead and search board, 0.9fr / 1.6fr for the momento band) that collapse to one column on mobile. Boards overlap band edges by pulling up with negative margin (the cartulina row sits 24px into the hero band). Cartulina rows run as responsive grids of five on desktop.

The nav is a 56px sticky ink strip. Lists inside boards (guides, country rows) are dense rows divided by 2px ink rules or the pencil line, painted yellow on hover.

## Elevation & Depth

Depth is painted, not lit. Boards sit flat on the wall, outlined in ink; the one consistent "shadow" is the solid ink drop under a painted button (3px at rest), which is a physical edge, not a blur. The world uses hard offsets natively because a painted board on a wall has a visible lower edge.

### Shadow Vocabulary
- **Board drop** (`box-shadow: 0 3px 0 var(--line-strong)`): every `.btn` at rest; grows to 4px on hover and collapses to 0 when pressed.
- **Focus halo** (`box-shadow: 0 0 0 3px var(--fluor-yellow)`; 4px on the hero search board): inputs and search boards on focus.
- **Soft lift** (`--shadow-soft`): reserved for floating menus and toasts; not used on boards.

### Named Rules
**The Painted Edge Rule.** The only offset shadow is the ink drop under a control, and only controls get it. Cards, cartulinas and wall bands stay flat; their outline is their edge.

## Shapes

Signs are cut boards: corners are barely rounded (2px cartulinas, 3px buttons, chips, tags and inputs, 4px cards, 6px maximum). Outlines are always ink: 1.5px on tags, 2px on buttons, chips, inputs, cards and cartulinas, 3px on hero boards, strong cards and band borders. Pinned things tilt: cartulinas take a stable per-name rotation between -2.25° and +2.25°, the search board and section tags lean -1° to -1.5°, and the logo's "hub" plate leans -3°. A pinned cartulina carries a 14px ink push-pin centered on its top edge.

Pill shapes are not part of the vocabulary; even the "pill" token is 3px.

## Components

### Buttons
Painted boards: heavy, condensed, uppercase, and visibly pressable.
- **Shape:** cut board (3px radius), 2px ink outline, 3px solid ink drop beneath.
- **Primary:** cobalt with white lettering on the day wall, yellow with ink lettering at night; 11px 18px padding, Archivo 800 at 15px, width 78%, uppercase.
- **Ghost:** board white with ink lettering; hover paints it Cartulina Yellow.
- **Warm:** Cartulina Pink with ink lettering; the search and submit board.
- **Link:** no board: ink text, weight 600, a 2px pink underline offset 4px that turns accent on hover.
- **States:** hover lifts 1px and deepens the drop to 4px; pressed sinks 3px and the drop disappears (80ms); active or `aria-pressed` paints the board ink with ground-colored lettering; disabled goes primed-wall gray with a dashed pencil outline, dim lettering and no drop.

### Chips
- **Style:** board white, 2px ink outline, 3px radius, Archivo 700 at 14px width 85%, 6px 12px padding.
- **State:** hover paints yellow; pressed sinks 2px; selected (`aria-pressed`) is ink with ground lettering; the "noche" momento chip selects to the accent instead. Filter rows such as momento del día are chips.

### Tags
- **Style:** small painted labels: 1.5px ink outline, 3px radius, 12px uppercase Archivo 700 width 80%, 3px 8px padding, on board white.
- **Variants:** active (ink), accent (yellow), warm (pink), green, each with ink lettering.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** board white (night board at night).
- **Shadow Strategy:** flat; see The Painted Edge Rule.
- **Border:** 2px ink; the strong variant is 3px on the elevated surface.
- **Internal Padding:** 16-28px (p-4 to p-7).

### Inputs / Fields
- **Style:** board white, 2px ink outline, 3px radius, 9px 12px padding, 15px text; placeholder in chalk ink. Labels are 13px uppercase Archivo 800, width 78%.
- **Focus:** a 3px yellow halo outside the outline (no outline color change).
- **Disabled:** primed-wall gray with a dashed outline.
- **Global focus:** every focusable element gets a 3px accent outline at 3px offset.

### Navigation
- **Style:** a 56px sticky ink strip. The logo is "Weed" in yellow Bowlby One beside "hub" on a pink plate tilted -3°.
- **Links:** Archivo 800 at 15px, width 80%, uppercase, enamel; hover and open state turn yellow. Dropdown groups open with the fade-up settle.
- **Footer:** a cobalt wall with a tilted yellow +18 sign, yellow column heads, and the WEEDHUB wordmark painted full width in shaded Bowlby One.

### Strain Sign (signature component)
The cartulina for one strain, used in the home wall, directory and top lists.
- Toned by type (see The Cartulina Tone Rule), 2px ink outline, 2px radius, push-pin on top, stable per-name tilt; hover and keyboard focus straighten it and lift it 4px.
- Name in Permanent Marker; THC as a Bowlby price with half-size %; below it a 12px uppercase line of "THC · type · first effect".
- A 2px ink rule separates the footer: the evidence-weighted rating on the left and an ink "Pinta tu reseña" / "Escreva a sua" board on the right that inverts to white on hover. The whole card is the link to the strain; the review board sits above it.

### Wall Bands
Full-bleed painted fields owning a section: cobalt (white text), yellow, pink and ink (ink or enamel text), and green for a legal-recreational country page. Mapa Verde country mastheads pick their band from legal status.

### Motion
One authored moment: **pin-in**. Signs settle onto the wall, dropping 10px into their tilt over 500ms on `cubic-bezier(.16,1,.3,1)`. Menus use a smaller 6px **fade-up** over 350ms on the same curve; toasts slide in over 200ms. All three are removed under `prefers-reduced-motion`. Control feedback is 80-120ms.

## Do's and Don'ts

### Do:
- **Do** give each major section a painted wall band (cobalt, yellow, pink, ink) bounded by 3px ink borders, and keep white enamel as the ground between them.
- **Do** letter strain names in Permanent Marker on a cartulina whose tone follows the strain's type.
- **Do** letter ratings with the weight of their evidence: 10 or more reviews read large and black (24px, weight 900); fewer read smaller and lighter (18px, weight 700, 85% opacity); under 3 reviews add "pocas reseñas"; zero reviews read "Sin reseñas aún" with no stars.
- **Do** print "sin datos" / "sem dados" (for example "THC sin datos") wherever a value is missing. Never estimate or fill a number.
- **Do** give every control distinct rest, hover, pressed, active and disabled states as specified under Buttons.
- **Do** ship every public string in Spanish and Portuguese with equal care; English is not served (`/en/*` redirects to Spanish).
- **Do** carry active and selected visual states with class states (`.chip.on`, `aria-pressed`) or inline `style={{}}` reading CSS variables (for example `var(--accent)`); Tailwind `color-mix` arbitraries fail to compile.
- **Do** use the condensed Archivo label voice (12px, uppercase, width 75%) only for data labels, stat labels and form labels.

### Don't:
- **Don't** put a small uppercase label (kicker or eyebrow) above a heading. Headings stand on their own; the label voice is for data.
- **Don't** set accent words in italic or a second face inside a heading.
- **Don't** use emoji as icons; icons are inline SVG line glyphs.
- **Don't** use stock photography. A strain without a real image is a cartulina or a type-colored initials card.
- **Don't** use pill shapes, soft blurred shadows on boards, gradients, or translucent neon glows.
- **Don't** add the rótulo drop shade to anything but masthead lettering on a wall band.
- **Don't** return to dark green as a brand field; the night wall is navy and cobalt.
