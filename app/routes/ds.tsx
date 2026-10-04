import { useState } from "react";
import { StrainThumb } from "~/components/composite/strain-thumb";
import { RatingStars } from "~/components/composite/rating-stars";
import { EffectBar } from "~/components/composite/effect-bar";
import { TimeCurve } from "~/components/composite/time-curve";
import { TerpeneRadar } from "~/components/composite/terpene-radar";
import { MomentoBar } from "~/components/composite/momento-bar";
import { Button } from "~/components/ui/button";
import { Tag } from "~/components/ui/tag";
import { Chip } from "~/components/ui/chip";
import { Card, CardHeader, CardContent, CardFooter } from "~/components/ui/card";
import { Avatar } from "~/components/ui/avatar";
import { Field } from "~/components/ui/field";
import { SelectionCard } from "~/components/ui/selection-card";
import type { IconName } from "~/components/ui/icon";
import { StatusPill } from "~/components/ui/status-pill";
import { LevelPill } from "~/components/ui/level-pill";

export function meta() {
  return [
    { title: "Design System — WeedHub" },
    { name: "robots", content: "noindex" },
  ];
}

const COLOR_GROUPS: Array<{ title: string; tokens: Array<{ name: string; use: string }> }> = [
  {
    title: "Superficies",
    tokens: [
      { name: "--bg", use: "Fondo de página" },
      { name: "--bg-raised", use: "Cards, paneles" },
      { name: "--bg-sunken", use: "Inputs, secciones" },
      { name: "--bg-elev", use: "Hover de card, chips" },
    ],
  },
  {
    title: "Líneas",
    tokens: [
      { name: "--line", use: "Bordes por defecto" },
      { name: "--line-strong", use: "Bordes acentuados" },
    ],
  },
  {
    title: "Texto",
    tokens: [
      { name: "--fg", use: "Texto primario" },
      { name: "--fg-muted", use: "Texto secundario" },
      { name: "--fg-dim", use: "Texto terciario, meta" },
    ],
  },
  {
    title: "Acentos",
    tokens: [
      { name: "--accent", use: "Signal green — CTA, activo" },
      { name: "--accent-soft", use: "Fondos activos sutiles" },
      { name: "--warm", use: "Indica, advertencia, destructivo" },
      { name: "--warm-soft", use: "Fondos de advertencia" },
      { name: "--lilac", use: "Trichomas, híbrida" },
      { name: "--lilac-soft", use: "Fondos lilac" },
      { name: "--gold", use: "Ratings, estrellas, premium" },
    ],
  },
];

const SPACING = [2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120];
const RADII = [
  { name: "--radius-sm", value: "4px" },
  { name: "--radius", value: "8px" },
  { name: "--radius-lg", value: "14px" },
  { name: "--radius-xl", value: "22px" },
  { name: "--radius-pill", value: "999px" },
];

const SAMPLE_CURVE = [
  { t: "0", label: "0 min", energy: 0, calm: 0, cerebral: 0 },
  { t: "15", label: "15 min", energy: 40, calm: 30, cerebral: 60 },
  { t: "30", label: "30 min", energy: 55, calm: 50, cerebral: 80 },
  { t: "60", label: "1 h", energy: 45, calm: 70, cerebral: 75 },
  { t: "120", label: "2 h", energy: 30, calm: 65, cerebral: 55 },
  { t: "180", label: "3 h", energy: 15, calm: 45, cerebral: 30 },
];

const SAMPLE_RADAR = [
  { name: "Mirceno", value: 0.82 },
  { name: "Limoneno", value: 0.55 },
  { name: "Cariofileno", value: 0.4 },
  { name: "Linalol", value: 0.3 },
  { name: "Pineno", value: 0.6 },
  { name: "Humuleno", value: 0.25 },
];

const LEVELS = ["Semilla", "Brote", "Planta", "Árbol", "Bosque"];

const ALL_STATUSES = [
  "pending", "approved", "merged_as_alias", "rejected", "rejected_auto", "duplicate",
  "published", "hidden",
  "free", "premium", "enterprise",
  "verified", "unverified",
] as const;

function ChipGroupDemo() {
  const [active, setActive] = useState<string | null>("indica");
  const options = [
    { id: "sativa", label: "Sativa", count: 245 },
    { id: "indica", label: "Indica", count: 312 },
    { id: "hybrid", label: "Híbrida", count: 313 },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <Chip
          key={o.id}
          active={active === o.id}
          count={o.count}
          onClick={() => setActive(active === o.id ? null : o.id)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function SelectionCardVerticalDemo() {
  const [selected, setSelected] = useState<string | null>("recreativo");
  const options: { id: string; icon: IconName; title: string; description: string }[] = [
    { id: "recreativo", icon: "smile", title: "Recreativo", description: "Relajarme, socializar, disfrutar" },
    { id: "medico", icon: "sparkle", title: "Médico", description: "Dolor, ansiedad, insomnio" },
    { id: "creativo", icon: "bolt", title: "Creativo", description: "Música, arte, concentración" },
    { id: "espiritual", icon: "star", title: "Espiritual", description: "Meditación, introspección" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <SelectionCard
          key={o.id}
          active={selected === o.id}
          icon={o.icon}
          title={o.title}
          description={o.description}
          onClick={() => setSelected(o.id)}
        />
      ))}
    </div>
  );
}

function SelectionCardHorizontalDemo() {
  const [selected, setSelected] = useState<string | null>("principiante");
  const options: { id: string; icon: IconName; title: string; description: string }[] = [
    { id: "principiante", icon: "sprout", title: "Principiante", description: "Llevo menos de 1 año" },
    { id: "intermedio", icon: "leaf", title: "Intermedio", description: "1–3 años de experiencia" },
    { id: "experto", icon: "tree", title: "Experto", description: "Más de 3 años" },
  ];
  return (
    <div className="flex flex-col gap-3">
      {options.map((o) => (
        <SelectionCard
          key={o.id}
          active={selected === o.id}
          icon={o.icon}
          title={o.title}
          description={o.description}
          layout="horizontal"
          onClick={() => setSelected(o.id)}
        />
      ))}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 space-y-24">
      {/* Header */}
      <header>
        <div className="kicker mb-3">Design System · para handoff</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 1 }}
        >
          WeedHub{" "}
          <span className="display-wonk" style={{ color: "var(--accent)" }}>
            DS
          </span>{" "}
          · v0.2
        </h1>
        <p className="mt-6 text-fg-muted max-w-[56ch] leading-relaxed">
          Tokens, tipografía y componentes. Si un valor difiere entre una pantalla
          y este documento, este documento gana.
        </p>
      </header>

      {/* Color */}
      <section>
        <div className="kicker mb-3">Color</div>
        <h2 className="display text-3xl mb-8">Tokens de color</h2>
        <div className="space-y-10">
          {COLOR_GROUPS.map((g) => (
            <div key={g.title}>
              <div className="kicker mb-3">{g.title}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {g.tokens.map((t) => (
                  <div key={t.name} className="card overflow-hidden">
                    <div className="h-20" style={{ background: `var(${t.name})` }} />
                    <div className="p-4">
                      <div className="mono text-xs">{t.name}</div>
                      <div className="text-xs text-fg-muted mt-1">{t.use}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <div className="kicker mb-3">Tipografía</div>
        <h2 className="display text-3xl mb-8">Tres familias</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="display text-5xl mb-2">Aa</div>
            <div className="kicker">Fraunces</div>
            <div className="text-xs text-fg-muted mt-1">Display · --font-display</div>
          </div>
          <div className="card p-6" style={{ fontFamily: "var(--font-body)" }}>
            <div className="text-5xl mb-2">Aa</div>
            <div className="kicker">Instrument Sans</div>
            <div className="text-xs text-fg-muted mt-1">Body · --font-body</div>
          </div>
          <div className="card p-6 mono">
            <div className="text-5xl mb-2">Aa</div>
            <div className="kicker">JetBrains Mono</div>
            <div className="text-xs text-fg-muted mt-1">Data · --font-mono</div>
          </div>
        </div>
        <div className="mt-10 card p-6 space-y-4">
          <SampleLine name="Display XL" style="display" fontSize={96}>
            La enciclopedia viva
          </SampleLine>
          <SampleLine name="Display L" style="display" fontSize={64}>
            Cada cepa contada
          </SampleLine>
          <SampleLine name="Display M" style="display" fontSize={36}>
            Directorio de cepas
          </SampleLine>
          <SampleLine name="Body L" style="body" fontSize={20}>
            Texto largo para lectura cómoda.
          </SampleLine>
          <SampleLine name="Body" style="body" fontSize={16}>
            Texto normal del sistema.
          </SampleLine>
          <SampleLine name="Kicker" style="kicker" fontSize={11}>
            NOMBRE DE SECCIÓN
          </SampleLine>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">Button</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="kicker mb-4">Variantes</div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="warm">Warm</Button>
              <Button variant="warm-outline">Warm Outline</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructivo</Button>
            </div>
          </Card>
          <Card>
            <div className="kicker mb-4">Tamaños</div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" variant="ghost" aria-label="icon button">⭐</Button>
            </div>
          </Card>
          <Card>
            <div className="kicker mb-4">Estados</div>
            <div className="flex gap-3 flex-wrap">
              <Button disabled>Deshabilitado</Button>
              <Button variant="ghost" disabled>Ghost off</Button>
              <Button variant="warm" disabled>Warm off</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Tags */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">Tag</h2>
        <Card className="space-y-6">
          <div>
            <div className="kicker mb-3">Variantes (size sm)</div>
            <div className="flex gap-2 flex-wrap">
              <Tag variant="default">Neutral</Tag>
              <Tag variant="accent">Accent</Tag>
              <Tag variant="sativa">Sativa</Tag>
              <Tag variant="indica">Indica</Tag>
              <Tag variant="hybrid">Híbrida</Tag>
              <Tag variant="warm">Warm</Tag>
              <Tag variant="lilac">Lilac</Tag>
              <Tag variant="gold">Gold</Tag>
              <Tag variant="muted">Muted</Tag>
              <Tag variant="terpene">Terpeno</Tag>
              <Tag variant="effect">Efecto</Tag>
            </div>
          </div>
          <div>
            <div className="kicker mb-3">Tamaños (variant accent)</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Tag variant="accent" size="xs">XS · Extra pequeño</Tag>
              <Tag variant="accent" size="sm">SM · Pequeño</Tag>
              <Tag variant="accent" size="md">MD · Mediano</Tag>
            </div>
          </div>
          <div>
            <div className="kicker mb-3">Uso real</div>
            <div className="flex gap-2 flex-wrap">
              <Tag variant="sativa">🌿 Sativa</Tag>
              <Tag variant="terpene">Mirceno</Tag>
              <Tag variant="terpene">Limoneno</Tag>
              <Tag variant="effect">Eufórico</Tag>
              <Tag variant="effect">Relajado</Tag>
              <Tag variant="gold">★ Premium</Tag>
            </div>
          </div>
        </Card>
      </section>

      {/* Chips */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">Chip</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="kicker mb-3">Interactivo (haz click)</div>
            <ChipGroupDemo />
          </Card>
          <Card>
            <div className="kicker mb-3">Estados estáticos</div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Chip>Sin activar</Chip>
                <Chip active>Activado</Chip>
                <Chip active count={24}>Con conteo</Chip>
              </div>
              <div className="flex gap-2">
                <Chip disabled>Deshabilitado</Chip>
                <Chip count={0}>Cero</Chip>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Cards */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default">
            <CardHeader><div className="kicker">Default</div></CardHeader>
            <CardContent>
              <p className="text-sm text-fg-muted">
                <span className="mono text-xs">variant="default"</span> — bg-raised, borde, padding estándar.
                La superficie más común para paneles y filas.
              </p>
            </CardContent>
            <CardFooter><span className="text-xs text-fg-dim">Footer opcional</span></CardFooter>
          </Card>

          <Card variant="sunken">
            <CardHeader><div className="kicker">Sunken</div></CardHeader>
            <CardContent>
              <p className="text-sm text-fg-muted">
                <span className="mono text-xs">variant="sunken"</span> — bg-sunken, mismo borde.
                Para secciones embebidas dentro de otra card.
              </p>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader><div className="kicker">Interactive</div></CardHeader>
            <CardContent>
              <p className="text-sm text-fg-muted">
                <span className="mono text-xs">variant="interactive"</span> — hover state.
                Para cards que son clicables (cepa, marca, etc.).
              </p>
            </CardContent>
          </Card>

          <Card variant="flat">
            <CardHeader><div className="kicker">Flat</div></CardHeader>
            <CardContent>
              <p className="text-sm text-fg-muted">
                <span className="mono text-xs">variant="flat"</span> — bg-transparent.
                Para secciones dentro de un layout sin duplicar elevación.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Avatars */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">Avatar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="kicker mb-4">Tamaños (iniciales)</div>
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar size="sm" fallback="OA" />
                <span className="mono text-[10px] text-fg-dim">sm</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="md" fallback="OA" />
                <span className="mono text-[10px] text-fg-dim">md</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="lg" fallback="OA" />
                <span className="mono text-[10px] text-fg-dim">lg</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="xl" fallback="OA" />
                <span className="mono text-[10px] text-fg-dim">xl</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="2xl" fallback="OA" />
                <span className="mono text-[10px] text-fg-dim">2xl</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="kicker mb-4">Con showcaseBadge</div>
            <div className="flex items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <Avatar size="xl" fallback="WH" showcaseBadge="⭐" />
                <span className="mono text-[10px] text-fg-dim">Primer reseña</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="xl" fallback="WH" showcaseBadge="🏆" />
                <span className="mono text-[10px] text-fg-dim">Top reseñador</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar size="2xl" fallback="WH" showcaseBadge="💎" />
                <span className="mono text-[10px] text-fg-dim">2xl + badge</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* LevelPill + StatusPill */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">LevelPill · StatusPill</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="kicker mb-4">LevelPill — los 5 niveles</div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-fg-dim mb-2">size="md" (default)</div>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((l) => (
                    <LevelPill key={l} level={l} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-fg-dim mb-2">size="sm"</div>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((l) => (
                    <LevelPill key={l} level={l} size="sm" />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-fg-dim mb-2">showEmoji=false</div>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((l) => (
                    <LevelPill key={l} level={l} showEmoji={false} />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="kicker mb-4">StatusPill — todos los estados</div>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <StatusPill key={s} status={s} />
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Fields */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">Field</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="kicker mb-4">Campo base</div>
            <Field label="Nombre de usuario">
              <input
                className="w-full rounded-[var(--radius)] border border-line bg-sunken px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="tucanna420"
              />
            </Field>
          </Card>

          <Card>
            <div className="kicker mb-4">Con hint</div>
            <Field label="Email" hint="Solo para notificaciones, nunca spam.">
              <input
                className="w-full rounded-[var(--radius)] border border-line bg-sunken px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="tu@correo.com"
                type="email"
              />
            </Field>
          </Card>

          <Card>
            <div className="kicker mb-4">Con error</div>
            <Field label="Contraseña" error="Mínimo 8 caracteres.">
              <input
                className="w-full rounded-[var(--radius)] border bg-sunken px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--warm)" }}
                type="password"
                defaultValue="123"
              />
            </Field>
          </Card>

          <Card>
            <div className="kicker mb-4">Requerido</div>
            <Field label="País" required hint="Para personalizar tu experiencia.">
              <select className="w-full rounded-[var(--radius)] border border-line bg-sunken px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <option value="">Seleccionar…</option>
                <option value="mx">México</option>
                <option value="co">Colombia</option>
                <option value="ar">Argentina</option>
              </select>
            </Field>
          </Card>
        </div>
      </section>

      {/* SelectionCard */}
      <section>
        <div className="kicker mb-3">Componentes · UI</div>
        <h2 className="display text-3xl mb-8">SelectionCard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="kicker mb-4">layout="vertical" (grid 2×2)</div>
            <SelectionCardVerticalDemo />
          </Card>
          <Card>
            <div className="kicker mb-4">layout="horizontal" (lista radio)</div>
            <SelectionCardHorizontalDemo />
          </Card>
        </div>
      </section>

      {/* Legacy CSS primitives */}
      <section>
        <div className="kicker mb-3">Componentes · CSS legacy</div>
        <h2 className="display text-3xl mb-8">Pills &amp; chips CSS</h2>
        <p className="text-sm text-fg-muted mb-6 max-w-[56ch]">
          Clases CSS globales (<span className="mono">.pill</span>, <span className="mono">.chip</span>).
          Preferir <span className="mono">{"<Tag>"}</span> y <span className="mono">{"<Chip>"}</span> para código nuevo.
        </p>
        <Card className="space-y-4">
          <div>
            <div className="kicker mb-2">Pills</div>
            <div className="flex gap-2 flex-wrap">
              <span className="pill">Neutral</span>
              <span className="pill accent">Accent</span>
              <span className="pill warm">Warm</span>
              <span className="pill lilac">Lilac</span>
            </div>
          </div>
          <div>
            <div className="kicker mb-2">Chips CSS</div>
            <div className="flex gap-2 flex-wrap">
              <span className="chip">Chip off</span>
              <span className="chip on">Chip on</span>
              <span className="chip on-accent">Accent on</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Composite components */}
      <section>
        <div className="kicker mb-3">Componentes · Composite</div>
        <h2 className="display text-3xl mb-8">Composites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-3">
            <div className="kicker">Effect bar</div>
            <EffectBar label="Cerebral" value={82} />
            <EffectBar label="Relajación" value={55} />
            <EffectBar label="Energía" value={28} />
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <div className="kicker">Star rating</div>
              <RatingStars rating={4.7} size="md" />
            </div>
            <div className="display text-3xl tnum">4.7</div>
          </Card>

          <Card className="col-span-full">
            <div className="kicker mb-3">Time curve</div>
            <TimeCurve data={SAMPLE_CURVE} />
          </Card>

          <Card>
            <div className="kicker mb-3">Terpene radar</div>
            <TerpeneRadar terpenes={SAMPLE_RADAR} />
          </Card>

          <Card>
            <MomentoBar manana={50} tarde={30} noche={20} />
          </Card>

          <Card>
            <div className="kicker mb-3">Strain thumb</div>
            <StrainThumb name="Muestra" colorHint="#6aa56a" ratio="wide" />
          </Card>
        </div>
      </section>

      {/* Spacing + Radii */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="kicker mb-3">Spacing</div>
          <h2 className="display text-3xl mb-8">Escala 4px</h2>
          <div className="space-y-2">
            {SPACING.map((s) => (
              <div key={s} className="flex items-center gap-4">
                <div className="mono text-xs tnum text-fg-dim w-10">{s}</div>
                <div
                  className="h-3 rounded"
                  style={{ width: s, background: "var(--accent-soft)" }}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="kicker mb-3">Radii</div>
          <h2 className="display text-3xl mb-8">Esquinas</h2>
          <div className="grid grid-cols-2 gap-4">
            {RADII.map((r) => (
              <Card key={r.name} className="text-center">
                <div
                  className="mx-auto bg-elev mb-3"
                  style={{ width: 72, height: 72, borderRadius: r.value }}
                />
                <div className="mono text-xs">{r.name}</div>
                <div className="text-xs text-fg-muted">{r.value}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SampleLine({
  name,
  style,
  fontSize,
  children,
}: {
  name: string;
  style: "display" | "body" | "kicker";
  fontSize: number;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-4">
      <div className="mono text-xs text-fg-dim">{name}</div>
      <div className={style} style={{ fontSize }}>
        {children}
      </div>
    </div>
  );
}
