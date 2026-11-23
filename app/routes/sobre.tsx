import { Link } from "react-router";
import type { Route } from "./+types/sobre";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";
import { useHref } from "~/lib/i18n-context";

const COPY = {
  es: {
    title: "Sobre WeedHub: quiénes somos y cómo hacemos el contenido",
    metaDescription: "Qué es WeedHub, de dónde salen los datos de las cepas, cómo revisamos la información legal y médica, y cómo contactarnos.",
    h1: "Sobre WeedHub",
    lede: "WeedHub es una enciclopedia del cannabis hecha en México para quienes hablan español. Queremos que cualquier persona adulta pueda entender una cepa, una ley o un término sin hype y sin letra chiquita.",
    sections: [
      { h: "Qué hacemos", p: ["Documentamos más de 3,000 cepas con su tipo, genética, THC, CBD, terpenos, efectos y el momento del día en que suelen elegirse. También mantenemos guías, un glosario y el Mapa Verde con el estatus legal del cannabis en cada país."] },
      { h: "De dónde salen los datos de las cepas", p: ["La ficha de cada cepa parte de bases públicas de genética, cannabinoides y terpenos, y se complementa con lo que reporta la comunidad en sus reseñas. Cuando un dato no existe, lo decimos: preferimos mostrar «sin datos» a inventar un número.", "El resumen al inicio de cada ficha se arma automáticamente con esos datos, así que nunca afirma algo que no esté registrado."] },
      { h: "Cómo usamos la inteligencia artificial", p: ["Usamos IA para preparar borradores de fichas, notas de la redacción, artículos y traducciones. Ningún texto se da por bueno sin que una persona del equipo lo revise y lo apruebe en nuestro panel editorial, y cada ficha guarda quién la revisó y cuándo.", "Las reseñas son otra cosa: solo publicamos experiencias de personas reales. La IA no escribe reseñas."] },
      { h: "Cómo revisamos la información legal", p: ["Cada país del Mapa Verde enlaza sus fuentes oficiales y muestra la fecha de la última revisión. Las leyes cambian rápido: usa el Mapa Verde como punto de partida y confirma con la autoridad o con un abogado de tu país."] },
      { h: "Salud: lo que no hacemos", p: ["WeedHub no da consejo médico ni promete que el cannabis cure o trate nada. Las páginas por condición muestran lo que reportan las reseñas, siempre con aviso. Si tienes una condición de salud o tomas medicamentos, habla con un profesional antes de consumir."] },
      { h: "Comunidad y anonimato", p: ["Puedes publicar reseñas y en el foro con tu usuario o de forma anónima: en América Latina todavía hay estigma y nadie debería exponerse para compartir su experiencia. Moderamos spam, ventas y contenido que ponga en riesgo a alguien."] },
      { h: "Solo para personas adultas", p: ["El contenido es para mayores de 18 años (o la mayoría de edad de tu país) y no promueve el consumo. No vendemos ni intermediamos la venta de cannabis."] },
      { h: "Marcas y negocios", p: ["Todavía no tenemos directorio de negocios ni publicidad. Si tienes una marca, una tienda o un proyecto y te interesa aparecer en WeedHub, escríbenos a contacto@weedhub.info. Cualquier colaboración pagada se marcará como tal y nunca comprará calificaciones ni cambiará reseñas."] },
      { h: "Contacto", p: ["Correcciones, dudas o propuestas: contacto@weedhub.info. Si encuentras un dato equivocado en una ficha o en el Mapa Verde, escríbenos y lo revisamos."] },
    ],
    links: { strains: "Ver el directorio de cepas", map: "Abrir el Mapa Verde", terms: "Términos de uso", privacy: "Privacidad" },
  },
  pt: {
    title: "Sobre o WeedHub: quem somos e como fazemos o conteúdo",
    metaDescription: "O que é o WeedHub, de onde vêm os dados das cepas, como revisamos a informação legal e de saúde, e como falar com a gente.",
    h1: "Sobre o WeedHub",
    lede: "O WeedHub é uma enciclopédia da cannabis feita no México para quem fala espanhol e português. Queremos que qualquer pessoa adulta consiga entender uma cepa, uma lei ou um termo, sem exagero e sem letra miúda.",
    sections: [
      { h: "O que fazemos", p: ["Documentamos mais de 3.000 cepas com tipo, genética, THC, CBD, terpenos, efeitos e o momento do dia em que a comunidade as recomenda. Também mantemos guias, um glossário e o Mapa Verde com o status legal da cannabis em cada país."] },
      { h: "De onde vêm os dados das cepas", p: ["A ficha de cada cepa combina bases públicas de genética e canabinoides com o que a comunidade relata nas avaliações. Quando um dado não existe, dizemos isso: preferimos mostrar «sem dados» a inventar um número.", "O resumo no início de cada ficha é montado automaticamente com esses dados, então nunca afirma algo que não esteja registrado."] },
      { h: "Como revisamos a informação legal", p: ["Cada país do Mapa Verde traz as fontes oficiais e a data da última revisão. As leis mudam rápido: use o Mapa Verde como ponto de partida e confirme com a autoridade ou com um advogado do seu país."] },
      { h: "Saúde: o que não fazemos", p: ["O WeedHub não dá aconselhamento médico nem promete que a cannabis cure ou trate qualquer coisa. As páginas por condição mostram o que as avaliações relatam, sempre com aviso. Se você tem uma condição de saúde ou toma medicamentos, converse com um profissional antes de consumir."] },
      { h: "Comunidade e anonimato", p: ["Você pode publicar avaliações e no fórum com seu usuário ou de forma anônima: na América Latina ainda existe estigma e ninguém deveria se expor para compartilhar a própria experiência. Moderamos spam, vendas e conteúdo que coloque alguém em risco."] },
      { h: "Apenas para adultos", p: ["O conteúdo é para maiores de 18 anos e não promove o consumo. Não vendemos nem intermediamos a venda de cannabis."] },
      { h: "Marcas e negócios", p: ["Marcas e dispensários podem criar um perfil grátis. Os planos pagos dão mais visibilidade, mas nunca compram notas nem mudam avaliações. Um negócio só recebe o selo de verificado quando confirmamos seus dados."] },
      { h: "Contato", p: ["Correções, dúvidas ou propostas: contacto@weedhub.info. Se encontrar um dado errado em uma ficha ou no Mapa Verde, escreva pra gente que a gente revisa."] },
    ],
    links: { strains: "Ver o diretório de cepas", map: "Abrir o Mapa Verde", terms: "Termos de uso", privacy: "Privacidade" },
  },
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const locale = await resolveLocale(request);
  return { locale: locale === "pt" ? "pt" : "es" } as const;
}

export function meta({ data }: Route.MetaArgs) {
  const loc = (data?.locale ?? "es") as keyof typeof COPY;
  const c = COPY[loc];
  const prefix = loc === "pt" ? "/pt" : "";
  return [
    ...buildMeta({ title: `${c.title} | WeedHub`, description: c.metaDescription, url: `${SITE_URL}${prefix}/sobre`, canonicalPath: "/sobre", locale: loc }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        url: `${SITE_URL}${prefix}/sobre`,
        inLanguage: loc === "pt" ? "pt-BR" : "es",
        about: {
          "@type": "Organization",
          name: "WeedHub",
          url: SITE_URL,
          logo: `${SITE_URL}/brand.svg`,
          email: "contacto@weedhub.info",
          foundingDate: "2026",
          foundingLocation: { "@type": "Country", name: "México" },
          areaServed: ["MX", "BR", "CO", "AR", "CL", "PE", "UY", "ES", "PT"],
        },
      },
    },
  ];
}

export default function SobrePage({ loaderData }: Route.ComponentProps) {
  const c = COPY[loaderData.locale];
  const href = useHref();
  return (
    <div>
      <section className="wall border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <h1 className="rotulo rotulo-shade text-yellow" style={{ fontSize: "clamp(52px, 9vw, 120px)" }}>
            {c.h1}
          </h1>
          <p className="mt-6 max-w-[58ch] text-xl md:text-2xl font-semibold leading-snug">{c.lede}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-14 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="max-w-[68ch]">
          {c.sections.map((s) => (
            <section key={s.h} className="py-6 border-b-2 border-ink first:pt-0">
              <h2 className="display text-[clamp(28px,3.4vw,40px)] mb-3">{s.h}</h2>
              {s.p.map((p) => (
                <p key={p.slice(0, 20)} className="text-[17px] leading-relaxed mt-3 first:mt-0">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
        <aside className="flex flex-col gap-3 self-start lg:sticky lg:top-24">
          <Link to={href("/strains")} className="btn btn-primary justify-start">{c.links.strains}</Link>
          <Link to="/mapa-verde" className="btn btn-ghost justify-start">{c.links.map}</Link>
          <div className="flex gap-4 mt-2 text-sm font-bold">
            <Link to={href("/terminos")} className="underline decoration-2 underline-offset-4">{c.links.terms}</Link>
            <Link to={href("/privacidad")} className="underline decoration-2 underline-offset-4">{c.links.privacy}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
