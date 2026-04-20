import { StrainThumb } from "~/components/composite/strain-thumb";
import { RatingStars } from "~/components/composite/rating-stars";
import { EffectBar } from "~/components/composite/effect-bar";
import { TimeCurve } from "~/components/composite/time-curve";
import { TerpeneRadar } from "~/components/composite/terpene-radar";
import { MomentoBar } from "~/components/composite/momento-bar";

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
      { name: "--warm", use: "Indica, advertencia" },
      { name: "--lilac", use: "Trichomas, híbrida" },
      { name: "--gold", use: "Ratings, estrellas" },
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

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 space-y-24">
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
          · v0.1
        </h1>
        <p className="mt-6 text-fg-muted max-w-[56ch] leading-relaxed">
          Tokens, tipografía y componentes. Si un valor difiere entre una pantalla
          y este documento, este documento gana.
        </p>
      </header>

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
                    <div
                      className="h-20"
                      style={{ background: `var(${t.name})` }}
                    />
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

      <section>
        <div className="kicker mb-3">Componentes</div>
        <h2 className="display text-3xl mb-8">Primitivos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <div className="kicker">Botones</div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-warm">Warm</button>
              <a href="#" className="btn-link">Link</a>
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <div className="kicker">Pills & chips</div>
            <div className="flex gap-2 flex-wrap">
              <span className="pill">Neutral</span>
              <span className="pill accent">Accent</span>
              <span className="pill warm">Warm</span>
              <span className="pill lilac">Lilac</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="chip">Chip off</span>
              <span className="chip on">Chip on</span>
              <span className="chip on-accent">Accent on</span>
            </div>
          </div>
          <div className="card p-6 space-y-3">
            <div className="kicker">Effect bar</div>
            <EffectBar label="Cerebral" value={82} />
            <EffectBar label="Relajación" value={55} />
            <EffectBar label="Energía" value={28} />
          </div>
          <div className="card p-6 flex items-center justify-between">
            <div>
              <div className="kicker">Star rating</div>
              <RatingStars rating={4.7} size="md" />
            </div>
            <div className="display text-3xl tnum">4.7</div>
          </div>
          <div className="card p-6 col-span-full">
            <div className="kicker mb-3">Time curve</div>
            <TimeCurve data={SAMPLE_CURVE} />
          </div>
          <div className="card p-6">
            <div className="kicker mb-3">Terpene radar</div>
            <TerpeneRadar terpenes={SAMPLE_RADAR} />
          </div>
          <div className="card p-6">
            <MomentoBar manana={50} tarde={30} noche={20} />
          </div>
          <div className="card p-6">
            <div className="kicker mb-3">Strain thumb</div>
            <StrainThumb name="Muestra" colorHint="#6aa56a" ratio="wide" />
          </div>
        </div>
      </section>

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
              <div key={r.name} className="card p-5 text-center">
                <div
                  className="mx-auto bg-elev mb-3"
                  style={{ width: 72, height: 72, borderRadius: r.value }}
                />
                <div className="mono text-xs">{r.name}</div>
                <div className="text-xs text-fg-muted">{r.value}</div>
              </div>
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
