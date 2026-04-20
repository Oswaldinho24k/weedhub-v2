interface MomentoBarProps {
  manana: number;
  tarde: number;
  noche: number;
}

const SEGMENTS = [
  { key: "manana", label: "Mañana", color: "var(--gold)" },
  { key: "tarde", label: "Tarde", color: "var(--accent)" },
  { key: "noche", label: "Noche", color: "var(--lilac)" },
] as const;

export function MomentoBar({ manana, tarde, noche }: MomentoBarProps) {
  const values = { manana, tarde, noche };
  const total = manana + tarde + noche || 1;

  return (
    <div>
      <div className="kicker mb-2">Mejor momento</div>
      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        {SEGMENTS.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${(values[s.key] / total) * 100}%`,
              background: s.color,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </div>
            <div className="mono text-sm text-fg tnum">
              {Math.round((values[s.key] / total) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
