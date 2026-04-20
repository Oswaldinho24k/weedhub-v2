import type { LegalSection } from "~/content/legal";

interface LegalPageProps {
  kicker: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalPage({ kicker, title, lastUpdated, sections }: LegalPageProps) {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-16">
      <header className="mb-12">
        <div className="kicker mb-4">{kicker}</div>
        <h1
          className="display mb-4"
          style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1.02 }}
        >
          {title}
        </h1>
        <div className="kicker">Última actualización · {lastUpdated}</div>
      </header>

      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="display text-2xl mb-3">{s.heading}</h2>
            <p className="text-fg-muted leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
