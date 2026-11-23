interface MomentoBarProps {
  manana: number;
  tarde: number;
  noche: number;
  locale?: string;
}

const LABELS: Record<string, { title: string; manana: string; tarde: string; noche: string }> = {
  es: { title: "Mejor momento", manana: "Mañana", tarde: "Tarde", noche: "Noche" },
  pt: { title: "Melhor momento", manana: "Manhã", tarde: "Tarde", noche: "Noite" },
  en: { title: "Best time of day", manana: "Morning", tarde: "Afternoon", noche: "Night" },
};

const BOARD = {
  manana: "bg-white text-ink",
  tarde: "bg-orange text-ink",
  noche: "bg-cobalt text-white",
} as const;

/** Three painted boards, sized by share: the same boards as the home "momento" wall. */
export function MomentoBar({ manana, tarde, noche, locale = "es" }: MomentoBarProps) {
  const L = LABELS[locale] ?? LABELS.es;
  const values = { manana, tarde, noche };
  const total = manana + tarde + noche || 1;
  const top = (Object.keys(values) as (keyof typeof values)[]).sort((a, b) => values[b] - values[a])[0];

  return (
    <div>
      <h3 className="text-xl font-extrabold [font-stretch:85%] mb-3">{L.title}</h3>
      <div className="flex gap-1.5 items-stretch">
        {(["manana", "tarde", "noche"] as const).map((k) => {
          const pct = Math.round((values[k] / total) * 100);
          return (
            <div
              key={k}
              className={`border-2 border-ink px-2.5 py-2 flex flex-col justify-between min-h-[86px] ${BOARD[k]}`}
              style={{ flexGrow: Math.max(pct, 12), flexBasis: 0 }}
            >
              <span className="text-[13px] font-extrabold uppercase [font-stretch:78%]">{L[k]}</span>
              <span className={`rotulo tnum ${k === top ? "text-[34px]" : "text-[22px]"}`}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
