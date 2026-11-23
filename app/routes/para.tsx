import { Link } from "react-router";
import type { Route } from "./+types/para";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { resolveLocale } from "~/lib/locale.server";
import { Icon } from "~/components/ui/icon";
import { CONDITIONS, type ConditionCategory } from "~/constants/conditions";

const UI = {
  es: {
    title: "Cepas por condición: lo que reporta la comunidad | WeedHub",
    description: "Qué cepas asocian los usuarios de WeedHub con ansiedad, dolor, insomnio y más, con número de reseñas. Información de referencia, no consejo médico.",
    h1: "Por condición",
    lede: "Qué cepas asocia la comunidad con cada condición, según sus reseñas. Sirve para orientarte, no para tratarte.",
    warning: "Esto no es consejo médico. El cannabis no cura ninguna de estas condiciones y puede interactuar con medicamentos. Si tienes una condición de salud, habla con un profesional antes de consumir.",
    cats: { mental: "Salud mental", dolor: "Dolor", sueno: "Sueño", digestivo: "Digestivo", neurologico: "Neurológico", otro: "Otros" } as Record<ConditionCategory, string>,
  },
  pt: {
    title: "Variedades por condição: o que a comunidade relata | WeedHub",
    description: "Quais variedades os usuários do WeedHub associam a ansiedade, dor, insônia e mais, com número de avaliações. Informação de referência, não é aconselhamento médico.",
    h1: "Por condição",
    lede: "Quais variedades a comunidade associa a cada condição, segundo as avaliações. Serve para se orientar, não para se tratar.",
    warning: "Isto não é aconselhamento médico. A cannabis não cura nenhuma destas condições e pode interagir com medicamentos. Se você tem uma condição de saúde, converse com um profissional antes de consumir.",
    cats: { mental: "Saúde mental", dolor: "Dor", sueno: "Sono", digestivo: "Digestivo", neurologico: "Neurológico", otro: "Outros" } as Record<ConditionCategory, string>,
  },
} as const;

const CATEGORY_ORDER: ConditionCategory[] = ["mental", "dolor", "sueno", "digestivo", "neurologico", "otro"];

export async function loader({ request }: Route.LoaderArgs) {
  return { locale: (await resolveLocale(request)) === "pt" ? "pt" : "es" } as const;
}

export function meta({ data }: Route.MetaArgs) {
  const loc = data?.locale ?? "es";
  const U = UI[loc];
  return buildMeta({ title: U.title, description: U.description, url: `${SITE_URL}${loc === "pt" ? "/pt" : ""}/para`, canonicalPath: "/para", locale: loc });
}

export default function ParaHubPage({ loaderData }: Route.ComponentProps) {
  const loc = loaderData.locale;
  const U = UI[loc];
  const prefix = loc === "pt" ? "/pt" : "";
  return (
    <div>
      <section className="wall--pink border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <h1 className="rotulo" style={{ fontSize: "clamp(52px, 9vw, 120px)" }}>{U.h1}</h1>
          <p className="mt-5 max-w-[56ch] text-xl font-semibold leading-snug">{U.lede}</p>
          <p className="mt-6 max-w-[70ch] bg-white text-ink border-2 border-ink px-4 py-3 text-[15px] font-semibold flex gap-3">
            <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
            {U.warning}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 space-y-12">
        {CATEGORY_ORDER.map((cat) => {
          const items = CONDITIONS.filter((c) => c.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat}>
              <h2 className="display text-[clamp(30px,3.6vw,44px)] mb-5">{U.cats[cat]}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((c) => (
                  <Link
                    key={c.slug}
                    to={`${prefix}/para/${c.slug}`}
                    className="card px-4 py-5 text-lg font-extrabold [font-stretch:85%] hover:bg-yellow hover:text-ink transition-colors flex items-center justify-between gap-2"
                  >
                    {loc === "pt" ? c.labelPt : c.labelEs}
                    <Icon name="arrowRight" size={16} />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
