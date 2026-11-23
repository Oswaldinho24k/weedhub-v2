export interface TerpenePoint {
  name: string;
  value: number; // 0..1
}

interface TerpeneRadarProps {
  terpenes: TerpenePoint[];
  size?: number;
}

export function TerpeneRadar({ terpenes, size = 180 }: TerpeneRadarProps) {
  if (!terpenes?.length) return null;
  const n = terpenes.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 22;
  const angle = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;

  const point = (v: number, i: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  };

  const polyPoints = terpenes
    .map((t, i) => point(Math.max(0, Math.min(1, t.value)), i).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`-44 0 ${size + 88} ${size}`}
      style={{ overflow: "visible" }}
      width="100%"
      height={size}
      role="img"
      aria-label="Radar de terpenos"
      className="block"
    >
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={terpenes.map((_, i) => point(ring, i).join(",")).join(" ")}
          fill="none"
          stroke="var(--fg)"
          opacity={ring === 1 ? 1 : 0.5}
        />
      ))}
      {terpenes.map((_, i) => {
        const [x, y] = point(1, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--fg)"
            opacity={0.3}
          />
        );
      })}
      <polygon
        points={polyPoints}
        fill="var(--fluor-pink)"
        fillOpacity={0.9}
        stroke="var(--ink)"
        strokeWidth={2}
      />
      {terpenes.map((t, i) => {
        const [x, y] = point(Math.max(0, Math.min(1, t.value)), i);
        const [lx, ly] = point(1.15, i);
        return (
          <g key={t.name}>
            <rect x={x - 3} y={y - 3} width={6} height={6} fill="var(--ink)" />
            <text
              x={lx}
              y={ly}
              fontSize="10"
              fontFamily="var(--font-body)"
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--fg)"
            >
              {t.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
