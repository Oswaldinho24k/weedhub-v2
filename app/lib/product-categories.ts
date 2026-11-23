/** Product category labels (mirror of seed/product-categories.ts). */
export const PRODUCT_CATEGORY_LABEL: Record<string, { es: string; pt: string }> = {
  "flower": { es: "Flor / Cogollos", pt: "Flor / Buds" },
  "preroll": { es: "Pre-rolls", pt: "Pre-rolls" },
  "vape": { es: "Vapes y Cartuchos", pt: "Vapes e Cartuchos" },
  "concentrate": { es: "Concentrados", pt: "Concentrados" },
  "edible": { es: "Comestibles", pt: "Comestíveis" },
  "drink": { es: "Bebidas", pt: "Bebidas" },
  "tincture": { es: "Tinturas y Aceites", pt: "Tinturas e Óleos" },
  "topical": { es: "Tópicos", pt: "Tópicos" },
  "capsule": { es: "Cápsulas", pt: "Cápsulas" },
  "accessory": { es: "Accesorios", pt: "Acessórios" },
  "semilla": { es: "Semillas", pt: "Sementes" },
  "clon": { es: "Clones / Esquejes", pt: "Clones / Estacas" },
  "nutriente": { es: "Nutrientes y Fertilizantes", pt: "Nutrientes e Fertilizantes" },
  "sustrato": { es: "Sustratos", pt: "Substratos" },
  "iluminacion": { es: "Iluminación", pt: "Iluminação" },
  "equipo-cultivo": { es: "Equipo de Cultivo", pt: "Equipamento de Cultivo" },
};

export function categoryLabel(key: string, locale = "es"): string {
  const c = PRODUCT_CATEGORY_LABEL[key];
  if (!c) return key;
  return locale === "pt" ? c.pt : c.es;
}
