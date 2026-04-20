import { FEATURED_ARTICLES } from "~/content/articles";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Magazine — WeedHub",
    description:
      "Ciencia, cultura y crónica cannábica hispanohablante. Artículos editoriales sobre terpenos, landraces, microdosis y más.",
    url: `${SITE_URL}/editorial`,
  });
}

export default function EditorialPage() {
  const [lead, ...rest] = FEATURED_ARTICLES;

  return (
    <div>
      <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-10">
        <div className="kicker mb-4">Magazine</div>
        <h1
          className="display max-w-[22ch]"
          style={{ fontSize: "clamp(44px, 7vw, 96px)", lineHeight: 0.98 }}
        >
          Ciencia, cultura y{" "}
          <span className="display-wonk" style={{ color: "var(--accent)" }}>
            crónica
          </span>{" "}
          cannábica.
        </h1>
        <p className="mt-6 text-lg text-fg-muted max-w-[52ch] leading-relaxed">
          Textos largos para leer con café. Sin hype, sin clickbait — solo buen
          material cannábico en español.
        </p>
      </section>

      {/* Lead article */}
      <section className="mx-auto max-w-[1200px] px-6 pb-14">
        <article className="card grid grid-cols-1 md:grid-cols-[1.3fr_1fr]">
          <div
            className="ph"
            style={{ minHeight: 360, borderRadius: "14px 14px 0 0" }}
          >
            {lead.kicker}
          </div>
          <div className="p-8 flex flex-col gap-4 justify-center">
            <div className="flex items-center gap-3">
              <span className="pill lilac">{lead.kicker}</span>
              <span className="kicker">{lead.readTime}</span>
            </div>
            <h2
              className="display"
              style={{ fontSize: 48, lineHeight: 1.05 }}
            >
              {lead.title}
            </h2>
            <p className="text-fg-muted leading-relaxed">{lead.dek}</p>
            {lead.author && (
              <div className="kicker mt-2">Por {lead.author}</div>
            )}
          </div>
        </article>
      </section>

      {/* Rest */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((a) => (
            <article key={a.slug} className="card overflow-hidden flex flex-col">
              <div className="ph" style={{ aspectRatio: "16/10" }}>
                {a.kicker}
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="pill lilac">{a.kicker}</span>
                  <span className="kicker">{a.readTime}</span>
                </div>
                <h3
                  className="display"
                  style={{ fontSize: 28, lineHeight: 1.1 }}
                >
                  {a.title}
                </h3>
                <p className="text-sm text-fg-muted line-clamp-3">{a.dek}</p>
                {a.author && (
                  <div className="kicker mt-auto pt-3">Por {a.author}</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
