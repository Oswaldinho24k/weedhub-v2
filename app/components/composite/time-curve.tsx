export interface TimeCurvePoint {
  t: string;
  label: string;
  energy: number;
  calm: number;
  cerebral: number;
}

interface TimeCurveProps {
  data: TimeCurvePoint[];
  width?: number;
  height?: number;
}

export function TimeCurve({ data, width = 480, height = 180 }: TimeCurveProps) {
  if (!data?.length) return null;
  const pad = 22;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const maxY = 100;
  const n = data.length;

  const xAt = (i: number) => pad + (innerW * i) / (n - 1);
  const yAt = (v: number) => pad + innerH - (v / maxY) * innerH;

  const path = (key: "energy" | "calm" | "cerebral") =>
    data.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p[key])}`).join(" ");

  const areaPath = `${path("cerebral")} L ${xAt(n - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Curva de efectos en el tiempo"
      className="block"
    >
      {[0, 25, 50, 75, 100].map((v) => (
        <line
          key={v}
          x1={pad}
          x2={width - pad}
          y1={yAt(v)}
          y2={yAt(v)}
          stroke="var(--line)"
          strokeWidth={1}
          strokeDasharray={v === 0 ? undefined : "2 4"}
          opacity={0.6}
        />
      ))}

      <path d={areaPath} fill="var(--accent)" opacity={0.1} />
      <path
        d={path("cerebral")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path("calm")}
        fill="none"
        stroke="var(--warm)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path("energy")}
        fill="none"
        stroke="var(--lilac)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />

      {data.map((p, i) => (
        <text
          key={p.t}
          x={xAt(i)}
          y={height - 4}
          fontSize="10"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          fill="var(--fg-dim)"
        >
          {p.label}
        </text>
      ))}

      <g transform={`translate(${width - pad - 140}, ${pad})`}>
        <Legend dot="var(--accent)" label="Cerebral" y={0} />
        <Legend dot="var(--warm)" label="Relajación" y={14} />
        <Legend dot="var(--lilac)" label="Energía" y={28} dashed />
      </g>
    </svg>
  );
}

function Legend({
  dot,
  label,
  y,
  dashed,
}: {
  dot: string;
  label: string;
  y: number;
  dashed?: boolean;
}) {
  return (
    <g transform={`translate(0, ${y})`}>
      {dashed ? (
        <line x1={0} x2={14} y1={4} y2={4} stroke={dot} strokeWidth={2} strokeDasharray="3 2" />
      ) : (
        <circle cx={7} cy={4} r={3.5} fill={dot} />
      )}
      <text
        x={20}
        y={8}
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill="var(--fg-muted)"
      >
        {label}
      </text>
    </g>
  );
}
