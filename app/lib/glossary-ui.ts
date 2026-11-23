import type { GlossaryCategory } from "~/models/glossary-term.server";

export const GLOSSARY_CATEGORY: Record<"es" | "pt", Record<GlossaryCategory, string>> = {
  es: { cannabinoides: "Cannabinoides", terpenos: "Terpenos", extracciones: "Extracciones", cultivo: "Cultivo", consumo: "Consumo", legal: "Legal", ciencia: "Ciencia", cultura: "Cultura" },
  pt: { cannabinoides: "Canabinoides", terpenos: "Terpenos", extracciones: "Extrações", cultivo: "Cultivo", consumo: "Consumo", legal: "Legal", ciencia: "Ciência", cultura: "Cultura" },
};

export const GLOSSARY_ORDER: GlossaryCategory[] = ["cannabinoides", "terpenos", "ciencia", "extracciones", "cultivo", "consumo", "legal", "cultura"];

/** Pick the localized term fields, falling back to Spanish. */
export function localizedTerm<T extends { term: string; termPt?: string; definition?: string; definitionPt?: string; examples?: string[]; examplesPt?: string[] }>(t: T, locale: string) {
  const pt = locale === "pt";
  return {
    term: (pt && t.termPt) || t.term,
    definition: (pt && t.definitionPt) || t.definition || "",
    examples: (pt && t.examplesPt?.length ? t.examplesPt : t.examples) || [],
  };
}
