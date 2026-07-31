import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

import { GlossaryTermModel } from "../app/models/glossary-term.server.js";

const terms = [
  // ─── CANNABINOIDES ────────────────────────────────────────────────────────
  {
    slug: "thc",
    term: "THC",
    termEn: "THC",
    termPt: "THC",
    category: "cannabinoides",
    definition: "Tetrahidrocannabinol. El principal cannabinoide psicoactivo del cannabis. Es responsable de los efectos eufóricos, la alteración sensorial y la mayoría de los efectos que se asocian al 'high'. Se une a los receptores CB1 del sistema endocannabinoide, principalmente en el cerebro.",
    definitionEn: "Tetrahydrocannabinol. The primary psychoactive cannabinoid in cannabis, responsible for the euphoric effects and most of what is associated with being 'high'.",
    relatedSlugs: ["cbd", "sistema-endocannabinoide", "cannabinoides", "perfil-cannabinoide"],
    examples: ["Una cepa con 25% de THC es de alta potencia", "El THC se activa con calor (decarboxilación)"],
  },
  {
    slug: "cbd",
    term: "CBD",
    termEn: "CBD",
    termPt: "CBD",
    category: "cannabinoides",
    definition: "Cannabidiol. El segundo cannabinoide más abundante en el cannabis. No es psicoactivo — no produce 'high'. Tiene propiedades ansiolíticas, antiinflamatorias y anticonvulsivas documentadas. En altas concentraciones puede moderar los efectos del THC.",
    definitionEn: "Cannabidiol. The second most abundant cannabinoid. Non-psychoactive, with documented anxiolytic, anti-inflammatory, and anticonvulsant properties.",
    relatedSlugs: ["thc", "cannabinoides", "efecto-entourage", "cannabis-medicinal"],
    examples: ["Las cepas 1:1 tienen igual proporción THC:CBD", "El CBD es el componente activo del medicamento Epidiolex"],
  },
  {
    slug: "cbn",
    term: "CBN",
    termEn: "CBN",
    termPt: "CBN",
    category: "cannabinoides",
    definition: "Cannabinol. Cannabinoide que se forma cuando el THC se oxida con el tiempo o el calor. Es levemente psicoactivo y se asocia a efectos sedantes. Una flor vieja o mal almacenada tiende a tener más CBN.",
    relatedSlugs: ["thc", "cannabinoides", "degradacion"],
  },
  {
    slug: "cbg",
    term: "CBG",
    termEn: "CBG",
    termPt: "CBG",
    category: "cannabinoides",
    definition: "Cannabigerol. Conocido como el 'cannabinoide madre' porque el CBGA es el precursor ácido del que derivan THC, CBD y CBC. No es psicoactivo. Tiene propiedades antiinflamatorias y neuroprotectoras en investigación.",
    relatedSlugs: ["thc", "cbd", "cannabinoides", "efecto-entourage"],
  },
  {
    slug: "cannabinoides",
    term: "Cannabinoides",
    termEn: "Cannabinoids",
    termPt: "Canabinoides",
    category: "cannabinoides",
    definition: "Compuestos químicos que interactúan con el sistema endocannabinoide del cuerpo. Los cannabinoides del cannabis (fitocannabinoides) incluyen THC, CBD, CBG, CBN, CBC y más de 100 compuestos identificados. También existen endocannabinoides (producidos por el cuerpo) y cannabinoides sintéticos.",
    relatedSlugs: ["thc", "cbd", "cbg", "cbn", "sistema-endocannabinoide", "efecto-entourage"],
  },
  {
    slug: "sistema-endocannabinoide",
    term: "Sistema Endocannabinoide",
    termEn: "Endocannabinoid System",
    termPt: "Sistema Endocanabinoide",
    category: "ciencia",
    definition: "Red de receptores, enzimas y moléculas señalizadoras presentes en el cuerpo humano (y en casi todos los vertebrados) que regula funciones como el dolor, el sueño, el estado de ánimo, el apetito y la memoria. Los receptores CB1 (principalmente en el cerebro) y CB2 (en el sistema inmune) son los principales. El cannabis interactúa directamente con este sistema.",
    relatedSlugs: ["thc", "cbd", "cannabinoides", "efecto-entourage"],
  },
  {
    slug: "perfil-cannabinoide",
    term: "Perfil Cannabinoide",
    termEn: "Cannabinoid Profile",
    category: "cannabinoides",
    definition: "El conjunto de cannabinoides presentes en una cepa y sus concentraciones relativas. Va más allá del simple porcentaje de THC — incluye CBD, CBG, CBN y otros. Dos cepas con el mismo porcentaje de THC pueden producir efectos muy distintos dependiendo de su perfil completo.",
    relatedSlugs: ["thc", "cbd", "cannabinoides", "efecto-entourage"],
  },

  // ─── TERPENOS ────────────────────────────────────────────────────────────
  {
    slug: "terpenos",
    term: "Terpenos",
    termEn: "Terpenes",
    termPt: "Terpenos",
    category: "terpenos",
    definition: "Compuestos aromáticos que dan a cada cepa su aroma y sabor característicos. No son exclusivos del cannabis — también están en frutas, flores y especias. En el cannabis, los terpenos modulan y modifican los efectos de los cannabinoides a través del efecto entourage. Hay más de 200 terpenos identificados en el cannabis.",
    relatedSlugs: ["mirceno", "limoneno", "pineno", "linalool", "cariofileno", "efecto-entourage"],
  },
  {
    slug: "mirceno",
    term: "Mirceno",
    termEn: "Myrcene",
    termPt: "Mirceno",
    category: "terpenos",
    definition: "El terpeno más común en el cannabis. Aroma terroso, herbal, con notas de mango. Se asocia a efectos relajantes y sedantes. Una teoría popular (aunque no completamente comprobada) sugiere que el mirceno facilita el paso de cannabinoides a través de la barrera hematoencefálica, potenciando el 'high'.",
    relatedSlugs: ["terpenos", "efecto-entourage", "indica"],
    examples: ["El mango contiene mirceno, de ahí el mito de comer mango antes de fumar"],
  },
  {
    slug: "limoneno",
    term: "Limoneno",
    termEn: "Limonene",
    termPt: "Limoneno",
    category: "terpenos",
    definition: "Terpeno con aroma cítrico intenso, presente en limones y naranjas. Se asocia a efectos energizantes y de mejora del estado de ánimo. Tiene propiedades antifúngicas y antibacterianas. Común en cepas sativa-dominantes de perfil elevado.",
    relatedSlugs: ["terpenos", "efecto-entourage", "sativa"],
  },
  {
    slug: "pineno",
    term: "Pineno",
    termEn: "Pinene",
    termPt: "Pineno",
    category: "terpenos",
    definition: "Terpeno con aroma de pino fresco. Es el terpeno más abundante en la naturaleza. Existen dos formas: alfa-pineno y beta-pineno. Se asocia a efectos alertadores y puede contrarrestar parcialmente los efectos de memoria a corto plazo del THC. Tiene propiedades broncodilatadoras.",
    relatedSlugs: ["terpenos", "efecto-entourage"],
  },
  {
    slug: "linalool",
    term: "Linalool",
    termEn: "Linalool",
    termPt: "Linalool",
    category: "terpenos",
    definition: "Terpeno floral con aroma a lavanda. Se asocia a efectos ansiolíticos y sedantes. Es el principal componente de la lavanda y se usa en aromaterapia. En cannabis, contribuye a efectos calmantes y puede ayudar con el insomnio y la ansiedad.",
    relatedSlugs: ["terpenos", "efecto-entourage", "mirceno"],
  },
  {
    slug: "cariofileno",
    term: "Cariofileno",
    termEn: "Caryophyllene",
    termPt: "Cariofileno",
    category: "terpenos",
    definition: "Terpeno con aroma picante, a pimienta negra y especias. Es único porque también actúa como cannabinoide: se une directamente a los receptores CB2 del sistema inmune sin producir efectos psicoactivos. Tiene propiedades antiinflamatorias documentadas. Presente en la pimienta negra, clavo y canela.",
    relatedSlugs: ["terpenos", "cannabinoides", "sistema-endocannabinoide", "efecto-entourage"],
  },
  {
    slug: "terpinoleno",
    term: "Terpinoleno",
    termEn: "Terpinolene",
    category: "terpenos",
    definition: "Terpeno con aroma floral, herbal y ligeramente cítrico. Menos común que otros terpenos principales. Se asocia a efectos sedantes en algunos estudios. Presente en cepas como Jack Herer y Ghost Train Haze.",
    relatedSlugs: ["terpenos", "efecto-entourage"],
  },

  // ─── EFECTO ENTOURAGE ────────────────────────────────────────────────────
  {
    slug: "efecto-entourage",
    term: "Efecto Entourage",
    termEn: "Entourage Effect",
    termPt: "Efeito Entourage",
    category: "ciencia",
    definition: "Teoría que sostiene que los cannabinoides, terpenos y otros compuestos del cannabis actúan de forma sinérgica, produciendo efectos distintos (y generalmente más complejos y beneficiosos) que los de cualquier compuesto aislado. Es la razón principal por la que el cannabis de flor completa puede producir efectos diferentes a los del THC aislado.",
    relatedSlugs: ["terpenos", "cannabinoides", "thc", "cbd", "fullspectrum"],
  },
  {
    slug: "fullspectrum",
    term: "Full Spectrum",
    termEn: "Full Spectrum",
    category: "extracciones",
    definition: "Extracto o producto que conserva todos los cannabinoides, terpenos y otros compuestos de la planta, incluyendo trazas de THC. A diferencia del aislado (isolate) o del broad spectrum, busca aprovechar el efecto entourage. Común en aceites CBD y tinturas.",
    relatedSlugs: ["efecto-entourage", "cbd", "extracciones", "broad-spectrum"],
  },
  {
    slug: "broad-spectrum",
    term: "Broad Spectrum",
    termEn: "Broad Spectrum",
    category: "extracciones",
    definition: "Extracto que contiene múltiples cannabinoides y terpenos pero con el THC eliminado o reducido a niveles indetectables. Es una opción intermedia entre el full spectrum y el aislado: busca algo del efecto entourage sin THC.",
    relatedSlugs: ["fullspectrum", "efecto-entourage", "cbd"],
  },

  // ─── TIPOS DE CEPA ────────────────────────────────────────────────────────
  {
    slug: "indica",
    term: "Indica",
    termEn: "Indica",
    termPt: "Índica",
    category: "cultura",
    definition: "Clasificación tradicional de cannabis originaria de regiones montañosas (Afganistán, Pakistán, India). Morfológicamente: plantas bajas, anchas, de hojas anchas y ciclo de floración corto. Culturalmente se asocia a efectos relajantes, sedantes y corporales — aunque la evidencia científica actual sugiere que la distinción indica/sativa no es tan determinante como los terpenos y el perfil cannabinoide.",
    relatedSlugs: ["sativa", "hibrida", "terpenos", "mirceno"],
  },
  {
    slug: "sativa",
    term: "Sativa",
    termEn: "Sativa",
    termPt: "Sativa",
    category: "cultura",
    definition: "Clasificación tradicional de cannabis originaria de regiones ecuatoriales (Tailandia, Colombia, África). Morfológicamente: plantas altas, delgadas, de hojas estrechas y ciclo de floración largo. Culturalmente se asocia a efectos cerebrales, energizantes y creativos. Como con indica, la ciencia moderna señala que terpenos y cannabinoides son mejores predictores del efecto que la clasificación sativa/indica.",
    relatedSlugs: ["indica", "hibrida", "terpenos", "limoneno"],
  },
  {
    slug: "hibrida",
    term: "Híbrida",
    termEn: "Hybrid",
    termPt: "Híbrida",
    category: "cultura",
    definition: "Cepa que resulta de cruzar genética indica y sativa. La mayoría de las cepas modernas son híbridas. Pueden ser 'sativa-dominante', 'indica-dominante' o balanceadas. El cruce permite combinar características de ambas: yields altos, ciclos de floración controlados, y perfiles de efectos específicos.",
    relatedSlugs: ["indica", "sativa", "genetica", "cruce"],
  },

  // ─── EXTRACCIONES ────────────────────────────────────────────────────────
  {
    slug: "extracciones",
    term: "Extracciones",
    termEn: "Extracts / Concentrates",
    termPt: "Extrações",
    category: "extracciones",
    definition: "Productos que concentran los compuestos activos del cannabis (cannabinoides y terpenos) eliminando el material vegetal. Son significativamente más potentes que la flor. Incluyen: cera (wax), shatter, resina viva (live resin), rosin, aceites, tintura, hash y más.",
    relatedSlugs: ["live-resin", "rosin", "shatter", "wax", "hash", "bho"],
  },
  {
    slug: "live-resin",
    term: "Live Resin",
    termEn: "Live Resin",
    termPt: "Live Resin",
    category: "extracciones",
    definition: "Extracto premium elaborado con plantas congeladas inmediatamente después de la cosecha (en lugar de secadas y curadas). El proceso de congelado preserva la mayor cantidad posible de terpenos, resultando en un producto con aroma y sabor considerablemente más intensos y complejos que los extracciones de planta seca.",
    relatedSlugs: ["extracciones", "terpenos", "efecto-entourage", "rosin"],
  },
  {
    slug: "rosin",
    term: "Rosin",
    termEn: "Rosin",
    termPt: "Rosin",
    category: "extracciones",
    definition: "Extracción sin solventes que usa solo calor y presión para extraer resina de la flor, kief o hash. Al no usar químicos, es considerada más pura. Se puede hacer en casa con una plancha de pelo y papel para hornear (aunque versiones profesionales usan prensas especializadas).",
    relatedSlugs: ["extracciones", "live-resin", "hash", "terpenos"],
    examples: ["Flower rosin, hash rosin, kief rosin — distintos puntos de partida, distintas calidades"],
  },
  {
    slug: "shatter",
    term: "Shatter",
    termEn: "Shatter",
    category: "extracciones",
    definition: "Concentrado de cannabis traslúcido con textura similar al vidrio que se 'quiebra' (de ahí el nombre). Se elabora con solventes (normalmente butano — BHO). Alta potencia en THC (70-90%). Su textura característica se debe a que las moléculas están alineadas sin agitación durante el proceso.",
    relatedSlugs: ["extracciones", "bho", "wax", "dab"],
  },
  {
    slug: "wax",
    term: "Wax",
    termEn: "Wax",
    category: "extracciones",
    definition: "Concentrado opaco con textura cerosa o cremosa. Es BHO que ha sido agitado durante el proceso de purga, lo que rompe la estructura molecular del shatter creando esta textura. Potencia similar al shatter (70-90% THC). Más fácil de manipular que el shatter.",
    relatedSlugs: ["extracciones", "bho", "shatter", "dab"],
  },
  {
    slug: "bho",
    term: "BHO",
    termEn: "BHO",
    category: "extracciones",
    definition: "Butane Hash Oil. Extracción que usa butano como solvente para disolver los compuestos activos del cannabis. Produce concentrados de alta potencia (shatter, wax, budder). Requiere equipos profesionales y purga adecuada para eliminar residuos de solvente. Peligroso si se intenta sin equipo adecuado.",
    relatedSlugs: ["extracciones", "shatter", "wax", "dab"],
  },
  {
    slug: "hash",
    term: "Hash / Hachís",
    termEn: "Hash / Hashish",
    termPt: "Haxixe",
    category: "extracciones",
    definition: "Una de las formas de concentrado más antiguas del mundo. Se elabora separando y comprimiendo los tricomas del cannabis. Existen múltiples tipos: hachís prensado marroquí, charas (hachís fresco de la India), bubble hash (separado con agua helada) y más. Potencia variable: 20-60% de THC.",
    relatedSlugs: ["extracciones", "kief", "tricomas", "rosin"],
  },
  {
    slug: "kief",
    term: "Kief",
    termEn: "Kief",
    termPt: "Kief",
    category: "extracciones",
    definition: "Tricomas separados de la flor. Es la forma más básica de concentrado — el polvo dorado que se acumula en el compartimento inferior de los grinders de 3 cámaras. Más potente que la flor pero menos que extracciones con solvente. Se puede consumir solo, añadir al joint, o usar para hacer rosin o hash.",
    relatedSlugs: ["extracciones", "tricomas", "hash", "rosin"],
  },

  // ─── CULTIVO ────────────────────────────────────────────────────────────
  {
    slug: "tricomas",
    term: "Tricomas",
    termEn: "Trichomes",
    termPt: "Tricomas",
    category: "cultivo",
    definition: "Glándulas microscópicas en forma de hongo que cubren las flores y hojas del cannabis. Son la 'fábrica' donde se producen cannabinoides, terpenos y flavonoides. Su apariencia bajo microscopio indica la madurez de la planta: blancos/opacos = pico de THC, ámbar = THC degradándose a CBN (efecto más sedante).",
    relatedSlugs: ["kief", "hash", "thc", "terpenos", "cosecha"],
  },
  {
    slug: "decarboxilacion",
    term: "Decarboxilación",
    termEn: "Decarboxylation",
    termPt: "Descarboxilação",
    category: "ciencia",
    definition: "Proceso químico que activa los cannabinoides del cannabis al aplicar calor. El THCA (no psicoactivo) se convierte en THC (psicoactivo). El CBDA se convierte en CBD. Ocurre automáticamente al fumar o vaporizar. Para comestibles, es necesario 'descarboxilar' el cannabis primero (normalmente al horno a ~115°C por 45 min).",
    relatedSlugs: ["thca", "thc", "cbd", "comestibles"],
  },
  {
    slug: "thca",
    term: "THCA",
    termEn: "THCA",
    category: "cannabinoides",
    definition: "Ácido tetrahidrocannabinólico. La forma ácida e inactiva del THC presente en la planta fresca. No es psicoactivo en su forma cruda. Se convierte en THC mediante calor (decarboxilación). Por eso fumar cannabis produce efectos pero comer flor cruda no. Los porcentajes de THC en las etiquetas suelen incluir el THCA potencial.",
    relatedSlugs: ["thc", "decarboxilacion", "cannabinoides"],
  },
  {
    slug: "genetica",
    term: "Genética",
    termEn: "Genetics",
    termPt: "Genética",
    category: "cultivo",
    definition: "El material genético de una planta de cannabis que determina sus características: morfología, potencia, perfil de terpenos, tiempo de floración y resistencia a plagas. Las genéticas se preservan como semillas (stabiles), clones o pólen. Las casas de semillas desarrollan y patentan genéticas.",
    relatedSlugs: ["cruce", "indica", "sativa", "fenotipo"],
  },
  {
    slug: "cruce",
    term: "Cruce",
    termEn: "Cross / Crossbreeding",
    termPt: "Cruzamento",
    category: "cultivo",
    definition: "La combinación de dos o más genéticas para crear una nueva variedad con características deseadas. Padre × madre = nueva cepa híbrida. El proceso de estabilización (hacer que la descendencia sea consistente) puede tomar varias generaciones de cruce selectivo. Ejemplo: OG Kush × Sour Diesel = Headband.",
    relatedSlugs: ["genetica", "hibrida", "fenotipo"],
  },
  {
    slug: "fenotipo",
    term: "Fenotipo",
    termEn: "Phenotype",
    termPt: "Fenótipo",
    category: "cultivo",
    definition: "La expresión física de los genes de una planta según su entorno. Dos semillas con la misma genética pueden producir fenotipos distintos dependiendo de luz, temperatura, humedad y nutrientes. Los cultivadores seleccionan el 'feno' con las mejores características para clonar y preservar.",
    relatedSlugs: ["genetica", "cruce", "clon"],
  },
  {
    slug: "clon",
    term: "Clon",
    termEn: "Clone / Cutting",
    termPt: "Clone",
    category: "cultivo",
    definition: "Corte (esqueje) de una planta madre que se enraíza para crear una planta genéticamente idéntica. Los clones preservan el fenotipo exacto de la madre, garantizando consistencia. Ventaja: sabes exactamente lo que obtendrás. Desventaja: pueden transmitir plagas o enfermedades de la madre.",
    relatedSlugs: ["genetica", "fenotipo", "cultivo"],
  },
  {
    slug: "cosecha",
    term: "Cosecha",
    termEn: "Harvest",
    termPt: "Colheita",
    category: "cultivo",
    definition: "La etapa final del ciclo de cultivo donde se cortan y procesan las flores. El momento óptimo se determina observando los tricomas bajo microscopio (blancos lechosos = más THC, ámbar = más CBN/sedación). Después de la cosecha viene el secado, el curado y opcionalmente el trim.",
    relatedSlugs: ["tricomas", "curado", "secado", "cultivo"],
  },
  {
    slug: "curado",
    term: "Curado",
    termEn: "Curing",
    termPt: "Cura",
    category: "cultivo",
    definition: "Proceso post-cosecha de almacenamiento controlado de la flor seca en frascos herméticos para mejorar el sabor, aroma y suavidad. Durante el curado, la clorofila se descompone, los azúcares se metabolizan y los terpenos se desarrollan. Un curado adecuado de 4-8 semanas marca una diferencia enorme en la calidad final.",
    relatedSlugs: ["cosecha", "secado", "terpenos", "almacenamiento"],
  },

  // ─── CONSUMO ─────────────────────────────────────────────────────────────
  {
    slug: "dab",
    term: "Dab / Dabbing",
    termEn: "Dab / Dabbing",
    termPt: "Dab / Dabbing",
    category: "consumo",
    definition: "Método de consumo de concentrados que consiste en vaporizar una pequeña cantidad de extracto en una superficie caliente (el 'nail' o 'banger') y inhalar el vapor. Los efectos son inmediatos y muy intensos debido a la alta concentración de THC. No recomendado para principiantes.",
    relatedSlugs: ["extracciones", "concentrados", "live-resin", "rosin", "shatter"],
  },
  {
    slug: "vaporizar",
    term: "Vaporizar",
    termEn: "Vaporize",
    termPt: "Vaporizar",
    category: "consumo",
    definition: "Método de consumo que calienta el cannabis (flor o concentrado) a una temperatura que activa los cannabinoides y terpenos pero sin llegar a la combustión. Produce vapor en lugar de humo, lo que reduce los subproductos dañinos de quemar material vegetal. Los efectos son comparables a fumar pero con mejor sabor y potencialmente menor daño pulmonar.",
    relatedSlugs: ["comestibles", "thc", "terpenos"],
  },
  {
    slug: "comestibles",
    term: "Comestibles",
    termEn: "Edibles",
    termPt: "Comestíveis",
    category: "consumo",
    definition: "Alimentos o bebidas infusionados con cannabis. El THC se metaboliza en el hígado convirtiéndose en 11-hidroxi-THC, un metabolito más potente y de efectos más prolongados. El inicio es tardío (30 min - 2 horas) y los efectos duran 4-8 horas. Error común: asumir que no funcionó y consumir más dosis antes de tiempo.",
    relatedSlugs: ["decarboxilacion", "thc", "vaporizar"],
    examples: ["Regla de oro: espera 2 horas antes de tomar más dosis"],
  },
  {
    slug: "almacenamiento",
    term: "Almacenamiento",
    termEn: "Storage",
    termPt: "Armazenamento",
    category: "consumo",
    definition: "Las condiciones correctas para preservar la calidad del cannabis: temperatura fresca (15-21°C), oscuridad, humedad relativa 58-62%, y recipiente hermético (frasco de vidrio). La luz UV, el calor y la humedad excesiva degradan THC, terpenos y favorecen el moho.",
    relatedSlugs: ["curado", "terpenos", "thc", "cbn"],
  },

  // ─── LEGAL ───────────────────────────────────────────────────────────────
  {
    slug: "cannabis-medicinal",
    term: "Cannabis Medicinal",
    termEn: "Medical Cannabis",
    termPt: "Cannabis Medicinal",
    category: "legal",
    definition: "Uso del cannabis o sus derivados para tratar condiciones médicas, bajo supervisión o prescripción médica. La mayoría de los países que han avanzado en legalización empezaron por el uso medicinal. Las condiciones más documentadas incluyen epilepsia, dolor crónico, náuseas por quimioterapia y espasticidad en esclerosis múltiple.",
    relatedSlugs: ["cbd", "thc", "descriminalizacion", "legalización"],
  },
  {
    slug: "descriminalizacion",
    term: "Descriminalización",
    termEn: "Decriminalization",
    termPt: "Descriminalização",
    category: "legal",
    definition: "Política que elimina o reduce las sanciones penales para el consumo o posesión de pequeñas cantidades de cannabis, sin llegar a la legalización completa. La persona no va a la cárcel por poseer para uso personal, pero el cannabis sigue siendo ilegal (sin mercado regulado, sin venta legal). Es la posición de muchos países latinoamericanos.",
    relatedSlugs: ["legalizacion", "cannabis-medicinal"],
  },
  {
    slug: "legalizacion",
    term: "Legalización",
    termEn: "Legalization",
    termPt: "Legalização",
    category: "legal",
    definition: "El proceso de hacer el cannabis legal bajo un marco regulatorio. Implica no solo eliminar sanciones al consumidor sino también crear un mercado legal regulado: licencias para cultivadores, procesadores y vendedores; impuestos; control de calidad; restricciones de edad. Uruguay (2013) y Canadá (2018) son los modelos de referencia.",
    relatedSlugs: ["descriminalizacion", "cannabis-medicinal"],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI no está definido");

  await mongoose.connect(uri);
  console.log("✅ Conectado a MongoDB");

  let created = 0;
  let skipped = 0;

  for (const term of terms) {
    const existing = await GlossaryTermModel.findOne({ slug: term.slug });
    if (existing) {
      skipped++;
      continue;
    }
    await GlossaryTermModel.create({ ...term, isActive: true, sortOrder: 0 });
    created++;
    console.log(`  ✓ ${term.term}`);
  }

  console.log(`\n✅ Glosario: ${created} términos creados, ${skipped} ya existían`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
