/**
 * Seed: estatus legal del cannabis por país — foco en LATAM.
 * Fuentes: leyes nacionales, reportes de IDPC, Transform Drug Policy Foundation.
 * Actualizar cuando cambie la ley en algún país.
 *
 * Run: npx tsx seed/legal-status.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { LegalStatusModel } from "../app/models/legal-status.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";

const data = [
  // ─── MÉXICO ────────────────────────────────────────────────────────────────
  {
    countryCode: "MX",
    countryName: "Mexico",
    countryNameEs: "México",
    countryNamePt: "México",
    flag: "🇲🇽",
    region: "mexico",
    nationalStatus: "partial",
    summary:
      "México tiene un estatus legal complejo: el uso medicinal es legal desde 2017 y la SCJN declaró inconstitucional prohibir el uso recreativo personal, pero la regulación completa sigue pendiente de reglamentación federal. Varios estados han avanzado más que el gobierno federal.",
    whatYouCan: [
      "Poseer cannabis para uso personal (amparos de la SCJN protegen este derecho)",
      "Usar cannabis con fines médicos con receta de médico autorizado",
      "Acceder a medicamentos derivados del cannabis (CBD/THC) en farmacias",
      "Cultivar hasta 6 plantas con amparo legal en algunos estados",
    ],
    whatYouCant: [
      "Comprar o vender cannabis recreativo (mercado negro o gris)",
      "Consumir en espacios públicos",
      "Importar o exportar cannabis recreativo",
      "Operar un dispensario recreativo sin concesión federal (aún no regulado)",
    ],
    keyDate: "Desde 2017 (medicinal) / 2021 (SCJN)",
    keyLaw: "Ley General de Salud + resoluciones SCJN",
    states: [
      { name: "Mexico City (CDMX)", nameEs: "Ciudad de México", status: "decriminalized", note: "La más permisiva del país. Consumo personal ampliamente tolerado." },
      { name: "Jalisco", nameEs: "Jalisco", status: "decriminalized", note: "Cultivo personal permitido con amparo." },
      { name: "Nuevo León", nameEs: "Nuevo León", status: "decriminalized", note: "Uso personal tolerado con amparo." },
      { name: "Puebla", nameEs: "Puebla", status: "partial", note: "Avances en regulación médica." },
    ],
    sources: [
      { label: "Ley General de Salud", url: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGS.pdf" },
      { label: "SCJN — Acción de Inconstitucionalidad 148/2017" },
    ],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 1,
  },

  // ─── CENTROAMÉRICA ─────────────────────────────────────────────────────────
  {
    countryCode: "CR",
    countryName: "Costa Rica",
    countryNameEs: "Costa Rica",
    countryNamePt: "Costa Rica",
    flag: "🇨🇷",
    region: "latam-central",
    nationalStatus: "legal-med",
    summary:
      "Costa Rica legalizó el cannabis medicinal y el cáñamo industrial en 2022. El uso recreativo sigue siendo ilegal, pero el país ha adoptado una postura de salud pública más que punitiva.",
    whatYouCan: [
      "Usar cannabis medicinal con receta médica",
      "Cultivar cáñamo industrial con licencia del SENASA",
      "Acceder a productos de CBD legalmente",
    ],
    whatYouCant: [
      "Poseer, usar o vender cannabis recreativo",
      "Cultivar plantas recreativas sin autorización",
    ],
    keyDate: "Desde 2022",
    keyLaw: "Ley N.° 9459 — Cannabis Medicinal y Cáñamo Industrial",
    sources: [{ label: "Asamblea Legislativa de Costa Rica" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 10,
  },
  {
    countryCode: "PA",
    countryName: "Panama",
    countryNameEs: "Panamá",
    countryNamePt: "Panamá",
    flag: "🇵🇦",
    region: "latam-central",
    nationalStatus: "legal-med",
    summary:
      "Panamá aprobó el uso medicinal del cannabis en 2021, convirtiéndose en uno de los primeros países de Centroamérica en hacerlo. El uso recreativo sigue siendo ilegal.",
    whatYouCan: [
      "Usar cannabis medicinal con receta de médico autorizado",
      "Acceder a medicamentos de cannabis en farmacias habilitadas",
    ],
    whatYouCant: [
      "Poseer o usar cannabis recreativo",
      "Cultivar sin licencia del Ministerio de Salud",
    ],
    keyDate: "Desde 2021",
    keyLaw: "Ley N.° 242 — Uso Medicinal del Cannabis",
    sources: [{ label: "Ministerio de Salud de Panamá" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 11,
  },
  {
    countryCode: "GT",
    countryName: "Guatemala",
    countryNameEs: "Guatemala",
    flag: "🇬🇹",
    region: "latam-central",
    nationalStatus: "illegal",
    summary: "El cannabis es ilegal en Guatemala tanto para uso recreativo como medicinal. La posesión puede resultar en cargos criminales.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis en cualquier forma"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 12,
  },
  {
    countryCode: "HN",
    countryName: "Honduras",
    countryNameEs: "Honduras",
    flag: "🇭🇳",
    region: "latam-central",
    nationalStatus: "illegal",
    summary: "El cannabis es completamente ilegal en Honduras. Hay penas severas por posesión, tráfico y cultivo.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis en cualquier forma"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 13,
  },
  {
    countryCode: "SV",
    countryName: "El Salvador",
    countryNameEs: "El Salvador",
    flag: "🇸🇻",
    region: "latam-central",
    nationalStatus: "illegal",
    summary: "El cannabis es ilegal en El Salvador. Existe tolerancia de facto en algunos casos de posesión mínima, pero no hay protección legal.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 14,
  },
  {
    countryCode: "NI",
    countryName: "Nicaragua",
    countryNameEs: "Nicaragua",
    flag: "🇳🇮",
    region: "latam-central",
    nationalStatus: "illegal",
    summary: "El cannabis es ilegal en Nicaragua. La aplicación de la ley es variable pero el marco legal no ofrece protecciones.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 15,
  },

  // ─── SUDAMÉRICA ────────────────────────────────────────────────────────────
  {
    countryCode: "UY",
    countryName: "Uruguay",
    countryNameEs: "Uruguay",
    countryNamePt: "Uruguai",
    flag: "🇺🇾",
    region: "latam-south",
    nationalStatus: "legal-rec",
    summary:
      "Uruguay fue el primer país del mundo en legalizar el cannabis recreativo en 2013. Ciudadanos y residentes pueden comprar en farmacias, cultivar hasta 6 plantas o unirse a un club cannábico.",
    whatYouCan: [
      "Comprar hasta 40g/mes en farmacias registradas (solo ciudadanos/residentes)",
      "Cultivar hasta 6 plantas en casa",
      "Pertenecer a un club cannábico (hasta 99 plantas entre 15-45 socios)",
      "Usar cannabis en espacios privados",
    ],
    whatYouCant: [
      "Turistas no pueden comprar en farmacias (solo ciudadanos/residentes registrados)",
      "Consumir en espacios públicos",
      "Exportar cannabis",
    ],
    keyDate: "Desde diciembre 2013",
    keyLaw: "Ley N.° 19.172 — Control y Regulación del Cannabis",
    sources: [{ label: "IRCCA — Instituto de Regulación y Control del Cannabis", url: "https://www.ircca.gub.uy" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 20,
  },
  {
    countryCode: "CO",
    countryName: "Colombia",
    countryNameEs: "Colombia",
    countryNamePt: "Colômbia",
    flag: "🇨🇴",
    region: "latam-south",
    nationalStatus: "decriminalized",
    summary:
      "Colombia fue pionera en descriminalizar el cannabis en América Latina. La dosis personal (hasta 20g) no es delito. El cannabis medicinal y de exportación es uno de los sectores agrícolas de mayor crecimiento del país.",
    whatYouCan: [
      "Poseer hasta 20g para consumo personal sin consecuencias penales (dosis personal)",
      "Usar cannabis medicinal con autorización del Ministerio de Salud",
      "El cultivo para exportación medicinal está regulado y en crecimiento",
    ],
    whatYouCant: [
      "Vender o comercializar cannabis recreativo",
      "Superar la dosis personal sin riesgo de sanciones",
      "Consumir en presencia de menores o en espacios públicos abiertos",
    ],
    keyDate: "Desde 1994 (C-221) / 2016 (medicinal)",
    keyLaw: "Sentencia C-221/1994 + Decreto 613/2017",
    sources: [
      { label: "Ministerio de Justicia de Colombia" },
      { label: "Corte Constitucional — Sentencia C-221" },
    ],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 21,
  },
  {
    countryCode: "AR",
    countryName: "Argentina",
    countryNameEs: "Argentina",
    countryNamePt: "Argentina",
    flag: "🇦🇷",
    region: "latam-south",
    nationalStatus: "decriminalized",
    summary:
      "Argentina descriminalizó la tenencia para consumo personal en 2009 (fallo \"Arriola\" de la Corte Suprema). El cannabis medicinal es legal desde 2017. Existe un debate activo sobre la legalización recreativa.",
    whatYouCan: [
      "Tener cannabis para consumo personal en espacios privados (fallo Arriola)",
      "Usar cannabis medicinal con receta de médico matriculado",
      "Acceder al Reprocann: programa de cultivo personal medicinal regulado por el Estado",
      "Cultivar con autorización del Reprocann (hasta 9 plantas por paciente/cuidador)",
    ],
    whatYouCant: [
      "Vender o comercializar cannabis en ninguna forma recreativa",
      "Consumir en espacios públicos",
      "Cultivar sin autorización del Reprocann",
    ],
    keyDate: "Desde 2009 (descriminalización) / 2017 (medicinal)",
    keyLaw: "Fallo Arriola (CSJN 2009) + Ley 27.350",
    sources: [
      { label: "Corte Suprema — Fallo Arriola 2009" },
      { label: "ANMAT — Reprocann", url: "https://www.argentina.gob.ar/anmat/reprocann" },
    ],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 22,
  },
  {
    countryCode: "BR",
    countryName: "Brazil",
    countryNameEs: "Brasil",
    countryNamePt: "Brasil",
    flag: "🇧🇷",
    region: "latam-south",
    nationalStatus: "legal-med",
    summary:
      "Brasil tiene cannabis medicinal legal vía ANVISA desde 2019 (importación y producción local de CBD/THC). En 2024, el STF decidió que criminalizar la posesión para uso personal es inconstitucional, generando un cambio histórico en la política de drogas.",
    whatYouCan: [
      "Usar cannabis medicinal (CBD y THC) con prescripción médica autorizada por ANVISA",
      "Importar productos de cannabis medicinal autorizados",
      "Adquirir productos de cannabis en farmacias habilitadas por ANVISA",
      "La posesión para uso personal no puede resultar en prisión (STF 2024)",
    ],
    whatYouCant: [
      "Vender o distribuir cannabis recreativo",
      "Cultivar sin autorización de ANVISA",
      "Usar cannabis en espacios públicos sin consecuencias administrativas",
    ],
    keyDate: "Desde 2019 (ANVISA) / 2024 (STF)",
    keyLaw: "RDC 327/2019 ANVISA + Decisão STF (2024)",
    sources: [
      { label: "ANVISA — Cannabis", url: "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cannabis" },
      { label: "STF — Plenário 2024" },
    ],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 23,
  },
  {
    countryCode: "CL",
    countryName: "Chile",
    countryNameEs: "Chile",
    countryNamePt: "Chile",
    flag: "🇨🇱",
    region: "latam-south",
    nationalStatus: "legal-med",
    summary:
      "Chile tiene cannabis medicinal legal desde 2015 y permite el autocultivo personal. Es el país con mayor consumo per cápita de cannabis en América Latina y ha tenido debates serios sobre la legalización recreativa.",
    whatYouCan: [
      "Cultivar hasta 6 plantas en espacios privados para consumo personal",
      "Usar cannabis medicinal con receta de médico autorizado",
      "Acceder a productos farmacéuticos de cannabis (CBD/THC) en farmacias",
    ],
    whatYouCant: [
      "Vender cannabis recreativo",
      "Consumir en espacios públicos",
      "Superar el límite de 6 plantas personales",
    ],
    keyDate: "Desde 2015",
    keyLaw: "Ley 20.000 (modificada) + Decreto 867",
    sources: [{ label: "Ministerio de Salud de Chile" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 24,
  },
  {
    countryCode: "PE",
    countryName: "Peru",
    countryNameEs: "Perú",
    countryNamePt: "Peru",
    flag: "🇵🇪",
    region: "latam-south",
    nationalStatus: "legal-med",
    summary:
      "Perú legalizó el cannabis medicinal en 2019, permitiendo el uso, importación y producción de aceites de CBD/THC. El uso recreativo permanece ilegal, aunque la posesión de pequeñas cantidades para consumo personal es generalmente tolerada.",
    whatYouCan: [
      "Usar cannabis medicinal (aceites CBD/THC) con prescripción médica",
      "Acceder a productos de cannabis en establecimientos de salud autorizados",
    ],
    whatYouCant: [
      "Usar cannabis recreativamente (aunque pequeñas cantidades son toleradas de facto)",
      "Cultivar sin autorización del MINSA",
      "Comercializar cannabis recreativo",
    ],
    keyDate: "Desde 2019",
    keyLaw: "Ley N.° 30681",
    sources: [{ label: "MINSA — Ley de Cannabis Medicinal" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 25,
  },
  {
    countryCode: "EC",
    countryName: "Ecuador",
    countryNameEs: "Ecuador",
    countryNamePt: "Equador",
    flag: "🇪🇨",
    region: "latam-south",
    nationalStatus: "decriminalized",
    summary:
      "Ecuador descriminalizó la posesión para consumo personal en 2013 (hasta 10g). El cannabis medicinal fue aprobado en 2019. El país ha avanzado hacia políticas de drogas más centradas en salud pública.",
    whatYouCan: [
      "Poseer hasta 10g para consumo personal sin consecuencias penales",
      "Usar cannabis medicinal bajo supervisión médica autorizada",
    ],
    whatYouCant: [
      "Vender o distribuir cannabis en ninguna forma recreativa",
      "Cultivar sin autorización",
      "Superar los límites de dosis personal",
    ],
    keyDate: "Desde 2013 (descriminalización) / 2019 (medicinal)",
    keyLaw: "Decreto Ejecutivo 23/2013 + reforma CONSEP",
    sources: [{ label: "SETED — Secretaría Técnica de Drogas" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 26,
  },
  {
    countryCode: "PY",
    countryName: "Paraguay",
    countryNameEs: "Paraguay",
    countryNamePt: "Paraguai",
    flag: "🇵🇾",
    region: "latam-south",
    nationalStatus: "partial",
    summary:
      "Paraguay es paradójico: es uno de los mayores productores de cannabis ilícito de Sudamérica, pero legalizó la producción y exportación de cannabis medicinal en 2017. El consumo recreativo sigue siendo ilegal.",
    whatYouCan: [
      "Producir y exportar cannabis medicinal con licencia del INTN",
      "Usar cannabis medicinal con prescripción de médico autorizado",
    ],
    whatYouCant: [
      "Poseer, usar o vender cannabis recreativo",
      "Cultivar sin licencia de exportación medicinal",
    ],
    keyDate: "Desde 2017 (medicinal/exportación)",
    keyLaw: "Ley N.° 6007/2017",
    sources: [{ label: "INTN — Instituto Nacional de Tecnología" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 27,
  },
  {
    countryCode: "BO",
    countryName: "Bolivia",
    countryNameEs: "Bolivia",
    countryNamePt: "Bolívia",
    flag: "🇧🇴",
    region: "latam-south",
    nationalStatus: "illegal",
    summary:
      "El cannabis es ilegal en Bolivia. La hoja de coca tiene estatus legal especial por razones culturales e históricas, pero el cannabis no tiene ninguna protección legal.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis en cualquier forma"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 28,
  },
  {
    countryCode: "VE",
    countryName: "Venezuela",
    countryNameEs: "Venezuela",
    countryNamePt: "Venezuela",
    flag: "🇻🇪",
    region: "latam-south",
    nationalStatus: "illegal",
    summary:
      "El cannabis es completamente ilegal en Venezuela. Las penas por posesión, cultivo y tráfico son severas.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis en cualquier forma"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 29,
  },

  // ─── CARIBE ────────────────────────────────────────────────────────────────
  {
    countryCode: "DO",
    countryName: "Dominican Republic",
    countryNameEs: "República Dominicana",
    countryNamePt: "República Dominicana",
    flag: "🇩🇴",
    region: "latam-caribe",
    nationalStatus: "illegal",
    summary:
      "El cannabis es ilegal en la República Dominicana. Existe debate parlamentario sobre cannabis medicinal, pero no hay legislación aprobada.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 30,
  },
  {
    countryCode: "CU",
    countryName: "Cuba",
    countryNameEs: "Cuba",
    flag: "🇨🇺",
    region: "latam-caribe",
    nationalStatus: "illegal",
    summary: "El cannabis es completamente ilegal en Cuba. No hay movimiento legislativo conocido hacia la regulación.",
    whatYouCan: [],
    whatYouCant: ["Poseer, usar, cultivar o comercializar cannabis"],
    sources: [],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 31,
  },
  {
    countryCode: "PR",
    countryName: "Puerto Rico",
    countryNameEs: "Puerto Rico",
    flag: "🇵🇷",
    region: "latam-caribe",
    nationalStatus: "legal-med",
    summary:
      "Puerto Rico (territorio de EE.UU.) tiene cannabis medicinal legal desde 2015 y cuenta con un programa robusto de dispensarios. El cannabis recreativo es legal para residentes por regulación local.",
    whatYouCan: [
      "Usar cannabis medicinal con tarjeta de paciente médico",
      "Comprar en dispensarios licenciados de cannabis medicinal",
      "El uso recreativo adulto fue aprobado localmente",
    ],
    whatYouCant: [
      "Consumir en espacios públicos",
      "Llevar cannabis fuera del territorio (vuelos federales)",
    ],
    keyDate: "Desde 2015",
    keyLaw: "Reglamento 157 — Departamento de Salud",
    sources: [{ label: "Departamento de Salud de Puerto Rico" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 32,
  },

  // ─── EUROPA ────────────────────────────────────────────────────────────────
  {
    countryCode: "ES",
    countryName: "Spain",
    countryNameEs: "España",
    countryNamePt: "Espanha",
    flag: "🇪🇸",
    region: "europe",
    nationalStatus: "decriminalized",
    summary:
      "España tiene una posición única: el consumo y cultivo en espacios privados es legal, y los clubs cannábicos operan en una zona gris legal (especialmente en el País Vasco y Cataluña). No existe un mercado recreativo regulado, pero la realidad práctica es más permisiva que muchos países.",
    whatYouCan: [
      "Consumir y cultivar cannabis en espacios privados (hogar, club cannábico)",
      "Pertenecer a un club cannábico (asociaciones privadas sin fines de lucro)",
      "Uso medicinal de Sativex con receta médica",
    ],
    whatYouCant: [
      "Comprar o vender cannabis en espacios públicos (tráfico de drogas)",
      "Consumir o poseer en vía pública (infracción administrativa con multa)",
      "Publicitar cannabis o clubs cannábicos",
    ],
    keyDate: "Status actual desde jurisprudencia del TC (años 90s)",
    keyLaw: "Ley Orgánica 1/1992 (seguridad ciudadana)",
    states: [
      { name: "País Vasco", nameEs: "País Vasco", status: "decriminalized", note: "La región con regulación más avanzada de clubs cannábicos." },
      { name: "Cataluña", nameEs: "Cataluña", status: "decriminalized", note: "Mayor densidad de clubs cannábicos fuera del País Vasco." },
    ],
    sources: [{ label: "Tribunal Constitucional de España" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 40,
  },
  {
    countryCode: "DE",
    countryName: "Germany",
    countryNameEs: "Alemania",
    countryNamePt: "Alemanha",
    flag: "🇩🇪",
    region: "europe",
    nationalStatus: "legal-rec",
    summary:
      "Alemania legalizó el cannabis recreativo en abril de 2024, siendo el país más grande de Europa en hacerlo. Los adultos pueden poseer hasta 25g en público y cultivar hasta 3 plantas. Los clubs cannábicos (CSC) comenzaron a operar en julio 2024.",
    whatYouCan: [
      "Poseer hasta 25g en espacios públicos",
      "Cultivar hasta 3 plantas en casa",
      "Pertenecer a un club cannábico (CSC) para obtener cannabis cultivado colectivamente",
      "Los adultos +18 pueden consumir en zonas no restringidas",
    ],
    whatYouCant: [
      "Vender cannabis en tiendas minoristas (no hay dispensarios regulados aún)",
      "Consumir cerca de escuelas, parques infantiles o zonas deportivas",
      "Menores de 18 acceder al cannabis",
    ],
    keyDate: "Desde abril 2024",
    keyLaw: "Konsumcannabisgesetz (KCanG) + Clubgesetz",
    sources: [{ label: "Bundesministerium für Gesundheit", url: "https://www.bundesgesundheitsministerium.de" }],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 41,
  },

  // ─── NORTEAMÉRICA ──────────────────────────────────────────────────────────
  {
    countryCode: "US",
    countryName: "United States",
    countryNameEs: "Estados Unidos",
    countryNamePt: "Estados Unidos",
    flag: "🇺🇸",
    region: "north-america",
    nationalStatus: "partial",
    summary:
      "EUA no tiene legalización federal: el cannabis sigue siendo ilegal a nivel federal (Schedule I). Sin embargo, 24 estados y D.C. han legalizado el uso recreativo, y 38 estados el medicinal. Es el mercado cannábico legal más grande del mundo, pero con un mosaico legal muy fragmentado.",
    whatYouCan: [
      "En estados con uso recreativo legal: comprar, poseer y consumir como adulto (+21)",
      "En estados con uso medicinal: acceder con tarjeta de paciente",
      "Cultivar en casa en muchos estados con recreativo legal (normalmente hasta 6 plantas)",
    ],
    whatYouCant: [
      "Cruzar fronteras estatales con cannabis (delito federal)",
      "Consumir en propiedades federales (parques nacionales, aeropuertos, edificios federales)",
      "Trabajar en industria cannábica con acceso a sistema bancario federal (en proceso de cambio)",
      "En estados sin legalización: cualquier uso recreativo es ilegal",
    ],
    keyDate: "Colorado y Washington: primeros en legalizar recreativo (2012)",
    keyLaw: "Sin ley federal — regulación 100% estatal",
    states: [
      { name: "California", nameEs: "California", status: "legal-rec", note: "Mercado recreativo desde 2016. El más grande del mundo." },
      { name: "Colorado", nameEs: "Colorado", status: "legal-rec", note: "Primer estado en legalizar recreativo (2012)." },
      { name: "New York", nameEs: "Nueva York", status: "legal-rec", note: "Legal desde 2021, dispensarios abiertos desde 2023." },
      { name: "Texas", nameEs: "Texas", status: "legal-med", note: "Solo uso medicinal muy restringido (bajo en THC)." },
      { name: "Florida", nameEs: "Florida", status: "legal-med", note: "Medicinal robusto, recreativo en votación pendiente." },
      { name: "Idaho", nameEs: "Idaho", status: "illegal", note: "Uno de los pocos estados sin ninguna forma de legalización." },
    ],
    sources: [
      { label: "NORML — State Laws", url: "https://norml.org/laws" },
      { label: "MJBizDaily — State-by-State Guide" },
    ],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 50,
  },
  {
    countryCode: "CA",
    countryName: "Canada",
    countryNameEs: "Canadá",
    countryNamePt: "Canadá",
    flag: "🇨🇦",
    region: "north-america",
    nationalStatus: "legal-rec",
    summary:
      "Canadá fue el segundo país del mundo (y el primero del G7) en legalizar el cannabis recreativo a nivel federal, en octubre de 2018. El sistema es regulado federalmente con implementación provincial. Los adultos pueden poseer hasta 30g en público y los precios han bajado significativamente desde la legalización.",
    whatYouCan: [
      "Poseer hasta 30g de cannabis seco en espacios públicos",
      "Comprar en tiendas licenciadas por la provincia o por correo (tiendas federales online)",
      "Cultivar hasta 4 plantas por hogar para uso personal",
      "Consumir productos de cannabis: flor, comestibles, concentrados, tópicos",
    ],
    whatYouCant: [
      "Vender sin licencia federal (delito grave)",
      "Dar cannabis a menores de 18 (o 19 según la provincia)",
      "Cruzar la frontera con cannabis (incluso hacia EUA donde sea legal estadalmente)",
      "Consumir en vehículos o en lugares donde se prohíbe fumar",
    ],
    keyDate: "Desde octubre 2018",
    keyLaw: "Cannabis Act (Bill C-45)",
    sources: [
      { label: "Health Canada — Cannabis", url: "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis.html" },
    ],
    lastReviewedAt: new Date("2026-07-01"),
    sortOrder: 51,
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let created = 0;
  let updated = 0;

  for (const item of data) {
    const result = await LegalStatusModel.findOneAndUpdate(
      { countryCode: item.countryCode },
      { $set: item },
      { upsert: true, new: true }
    );
    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`✓ Seeded ${data.length} countries (${created} created, ${updated} updated)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
