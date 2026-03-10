export interface Strain {
  name: string;
  slug: string;
  type: 'sativa' | 'indica' | 'hybrid';
  description: string;
  genetics: {
    parent1?: string;
    parent2?: string;
    breeder?: string;
  };
  cannabinoidProfile: {
    thcMin: number;
    thcMax: number;
    cbdMin: number;
    cbdMax: number;
  };
  terpenes: Array<{
    name: string;
    percentage: number;
  }>;
  effects: string[];
  flavors: string[];
  averageRatings: {
    overall: number;
    potency: number;
    flavor: number;
    appearance: number;
  };
  reviewCount: number;
  reviewDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  isArchived: boolean;
}

export const strains: Strain[] = [
  {
    name: "Blue Dream",
    slug: "blue-dream",
    type: "hybrid",
    description: "Una variedad híbrida dominante sativa originaria de California. Combina la relajación corporal de Blueberry con la euforia cerebral de Haze. Perfecta para uso diurno con efectos equilibrados y duraderos.",
    genetics: {
      parent1: "Blueberry",
      parent2: "Haze",
      breeder: "DJ Short"
    },
    cannabinoidProfile: {
      thcMin: 17,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 0.8 },
      { name: "Pineno", percentage: 0.6 },
      { name: "Cariofileno", percentage: 0.4 }
    ],
    effects: ["Euforia", "Relajación", "Creatividad", "Felicidad", "Energía"],
    flavors: ["Berry", "Dulce", "Frutal", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "OG Kush",
    slug: "og-kush",
    type: "hybrid",
    description: "Una cepa legendaria de California con genética desconocida pero efectos inconfundibles. Ofrece una potente euforia combinada con relajación física profunda. Su aroma distintivo a combustible y tierra la hace inconfundible.",
    genetics: {
      parent1: "Chemdawg",
      parent2: "Hindu Kush",
      breeder: "Unknown"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 26,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.2 },
      { name: "Limoneno", percentage: 0.7 },
      { name: "Cariofileno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Relajación", "Felicidad", "Alivio del dolor", "Calma"],
    flavors: ["Diesel", "Terroso", "Pino", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Sour Diesel",
    slug: "sour-diesel",
    type: "sativa",
    description: "Una sativa energizante con un aroma penetrante a diesel y limón. Proporciona efectos cerebrales inmediatos que estimulan la creatividad y la conversación. Ideal para combatir la fatiga y el estrés durante el día.",
    genetics: {
      parent1: "Chemdawg 91",
      parent2: "Super Skunk",
      breeder: "Unknown (East Coast)"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.0 },
      { name: "Cariofileno", percentage: 0.6 },
      { name: "Mirceno", percentage: 0.4 }
    ],
    effects: ["Energía", "Euforia", "Creatividad", "Concentración", "Sociabilidad"],
    flavors: ["Diesel", "Cítrico", "Skunk", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Girl Scout Cookies",
    slug: "girl-scout-cookies",
    type: "hybrid",
    description: "Un híbrido potente de California con genética OG Kush y Durban Poison. Ofrece una euforia completa del cuerpo y la mente con sabor dulce a menta y galleta. Perfecta para alivio del dolor y relajación profunda.",
    genetics: {
      parent1: "OG Kush",
      parent2: "Durban Poison",
      breeder: "Cookie Fam"
    },
    cannabinoidProfile: {
      thcMin: 25,
      thcMax: 28,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.1 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Humuleno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Relajación", "Felicidad", "Alivio del dolor", "Apetito"],
    flavors: ["Dulce", "Menta", "Terroso", "Chocolate"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Granddaddy Purple",
    slug: "granddaddy-purple",
    type: "indica",
    description: "Una indica clásica de California conocida por sus hermosos cogollos púrpuras. Cruza Big Bud con Purple Urkle para producir efectos sedantes profundos. Excelente para insomnio, dolor y relajación nocturna.",
    genetics: {
      parent1: "Big Bud",
      parent2: "Purple Urkle",
      breeder: "Ken Estes"
    },
    cannabinoidProfile: {
      thcMin: 17,
      thcMax: 23,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.3 },
      { name: "Pineno", percentage: 0.5 },
      { name: "Cariofileno", percentage: 0.4 }
    ],
    effects: ["Relajación", "Sueño", "Alivio del dolor", "Calma", "Apetito"],
    flavors: ["Uva", "Berry", "Dulce", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Jack Herer",
    slug: "jack-herer",
    type: "sativa",
    description: "Nombrada en honor al activista cannábico, esta sativa combina Haze con genética Skunk y Northern Lights. Proporciona una claridad mental excepcional con creatividad elevada. Ganadora de múltiples copas cannábicas.",
    genetics: {
      parent1: "Haze",
      parent2: "Northern Lights #5 x Shiva Skunk",
      breeder: "Sensi Seeds"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 1.0 },
      { name: "Pineno", percentage: 0.7 },
      { name: "Cariofileno", percentage: 0.5 }
    ],
    effects: ["Creatividad", "Energía", "Euforia", "Concentración", "Bienestar"],
    flavors: ["Pino", "Especiado", "Terroso", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Northern Lights",
    slug: "northern-lights",
    type: "indica",
    description: "Una de las indicas más famosas del mundo, originaria del noroeste del Pacífico. Conocida por su resina cristalina y efectos relajantes profundos. Perfecta para relajación nocturna y alivio del insomnio.",
    genetics: {
      parent1: "Afghani",
      parent2: "Thai",
      breeder: "Sensi Seeds"
    },
    cannabinoidProfile: {
      thcMin: 16,
      thcMax: 21,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.5 },
      { name: "Cariofileno", percentage: 0.6 },
      { name: "Limoneno", percentage: 0.3 }
    ],
    effects: ["Relajación", "Sueño", "Calma", "Alivio del dolor", "Felicidad"],
    flavors: ["Dulce", "Terroso", "Pino", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "White Widow",
    slug: "white-widow",
    type: "hybrid",
    description: "Un híbrido holandés legendario con una capa de tricomas blancos brillantes. Cruza una sativa brasileña con una indica del sur de India. Proporciona un subidón energético equilibrado con relajación corporal.",
    genetics: {
      parent1: "Brazilian Sativa",
      parent2: "South Indian Indica",
      breeder: "Green House Seeds"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Mirceno", percentage: 0.9 },
      { name: "Pineno", percentage: 0.6 },
      { name: "Cariofileno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Energía", "Creatividad", "Sociabilidad", "Felicidad"],
    flavors: ["Terroso", "Pino", "Especiado", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Green Crack",
    slug: "green-crack",
    type: "sativa",
    description: "Una sativa intensamente energizante renombrada por Snoop Dogg por su potencia. Proporciona un enfoque mental agudo con energía duradera sin ansiedad. Ideal para uso diurno y actividades creativas.",
    genetics: {
      parent1: "Skunk #1",
      parent2: "Unknown Indica",
      breeder: "Ingemar"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Mirceno", percentage: 0.8 },
      { name: "Cariofileno", percentage: 0.6 },
      { name: "Limoneno", percentage: 0.5 }
    ],
    effects: ["Energía", "Concentración", "Euforia", "Creatividad", "Motivación"],
    flavors: ["Frutal", "Cítrico", "Dulce", "Tropical"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Pineapple Express",
    slug: "pineapple-express",
    type: "hybrid",
    description: "Un híbrido sativa-dominante popularizado por la película del mismo nombre. Combina Trainwreck con Hawaiian para sabores tropicales intensos. Proporciona energía eufórica con relajación corporal suave.",
    genetics: {
      parent1: "Trainwreck",
      parent2: "Hawaiian",
      breeder: "G13 Labs"
    },
    cannabinoidProfile: {
      thcMin: 19,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.1 },
      { name: "Cariofileno", percentage: 0.7 },
      { name: "Pineno", percentage: 0.4 }
    ],
    effects: ["Euforia", "Energía", "Felicidad", "Creatividad", "Sociabilidad"],
    flavors: ["Tropical", "Frutal", "Dulce", "Cítrico"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "AK-47",
    slug: "ak-47",
    type: "hybrid",
    description: "Un híbrido sativa-dominante que combina genéticas de cuatro continentes diferentes. A pesar de su nombre intimidante, proporciona una relajación mental suave y alegre. Ganadora de múltiples premios cannábicos.",
    genetics: {
      parent1: "Colombian x Mexican x Thai",
      parent2: "Afghani",
      breeder: "Serious Seeds"
    },
    cannabinoidProfile: {
      thcMin: 13,
      thcMax: 20,
      cbdMin: 0.5,
      cbdMax: 1.5
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 0.9 },
      { name: "Pineno", percentage: 0.6 },
      { name: "Cariofileno", percentage: 0.4 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Creatividad", "Calma"],
    flavors: ["Terroso", "Dulce", "Pino", "Floral"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Gorilla Glue #4",
    slug: "gorilla-glue-4",
    type: "hybrid",
    description: "Un híbrido extremadamente potente y resinoso que literalmente pega las tijeras durante el trimming. Cruza Chem's Sister con Sour Dubb y Chocolate Diesel. Efectos potentes que clavan al sofá con euforia intensa.",
    genetics: {
      parent1: "Chem's Sister x Sour Dubb",
      parent2: "Chocolate Diesel",
      breeder: "GG Strains"
    },
    cannabinoidProfile: {
      thcMin: 25,
      thcMax: 30,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.3 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Mirceno", percentage: 0.6 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Alivio del dolor", "Calma"],
    flavors: ["Diesel", "Chocolate", "Terroso", "Pino"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Gelato",
    slug: "gelato",
    type: "hybrid",
    description: "Un híbrido indica-dominante de la Cookie Fam con sabores dulces de postre. Cruza Sunset Sherbet con Thin Mint GSC para crear una experiencia balanceada. Efectos relajantes con claridad mental y euforia creativa.",
    genetics: {
      parent1: "Sunset Sherbet",
      parent2: "Thin Mint GSC",
      breeder: "Cookie Fam"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.7 },
      { name: "Humuleno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Euforia", "Creatividad", "Felicidad", "Calma"],
    flavors: ["Dulce", "Berry", "Cítrico", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Wedding Cake",
    slug: "wedding-cake",
    type: "hybrid",
    description: "También conocida como Pink Cookies, es un híbrido indica-dominante con sabor dulce a vainilla. Cruza Cherry Pie con Girl Scout Cookies para efectos potentes. Excelente para relajación profunda y alivio del estrés.",
    genetics: {
      parent1: "Cherry Pie",
      parent2: "Girl Scout Cookies",
      breeder: "Seed Junky Genetics"
    },
    cannabinoidProfile: {
      thcMin: 21,
      thcMax: 27,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.2 },
      { name: "Cariofileno", percentage: 0.8 },
      { name: "Humuleno", percentage: 0.4 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Calma", "Alivio del dolor"],
    flavors: ["Dulce", "Vainilla", "Terroso", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Purple Haze",
    slug: "purple-haze",
    type: "sativa",
    description: "Una sativa legendaria popularizada por Jimi Hendrix en los años 60. Combina Purple Thai con Haze para tonos púrpuras vibrantes. Proporciona energía cerebral eufórica con creatividad expansiva y enfoque.",
    genetics: {
      parent1: "Purple Thai",
      parent2: "Haze",
      breeder: "Unknown"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 20,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 1.0 },
      { name: "Cariofileno", percentage: 0.6 },
      { name: "Pineno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Creatividad", "Energía", "Felicidad", "Sociabilidad"],
    flavors: ["Berry", "Terroso", "Dulce", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Amnesia Haze",
    slug: "amnesia-haze",
    type: "sativa",
    description: "Una sativa ganadora de la Cannabis Cup con genética compleja de cepas Haze. Proporciona un subidón cerebral intenso y duradero con euforia psicodélica. Popular en Amsterdam por su potencia y sabor cítrico.",
    genetics: {
      parent1: "Jamaican x Laos x Hawaiian",
      parent2: "Afghani x Hawaiian",
      breeder: "Soma Seeds"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 1.1 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Cariofileno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Creatividad", "Energía", "Felicidad", "Concentración"],
    flavors: ["Cítrico", "Terroso", "Especiado", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Chemdawg",
    slug: "chemdawg",
    type: "hybrid",
    description: "Una cepa misteriosa y legendaria que dio origen a Sour Diesel y OG Kush. Conocida por su aroma diesel penetrante y efectos cerebrales potentes. Un clásico que ha influenciado innumerables genéticas modernas.",
    genetics: {
      parent1: "Unknown",
      parent2: "Unknown",
      breeder: "Chemdog"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.7 },
      { name: "Cariofileno", percentage: 0.6 }
    ],
    effects: ["Euforia", "Relajación", "Creatividad", "Felicidad", "Concentración"],
    flavors: ["Diesel", "Terroso", "Pino", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Bubba Kush",
    slug: "bubba-kush",
    type: "indica",
    description: "Una indica pesada originaria de California con genética Kush afgana. Famosa por su capacidad sedante profunda y sabor terroso dulce. Perfecta para relajación nocturna, insomnio y alivio del dolor crónico.",
    genetics: {
      parent1: "OG Kush",
      parent2: "Unknown Indica",
      breeder: "Bubba"
    },
    cannabinoidProfile: {
      thcMin: 14,
      thcMax: 22,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.4 },
      { name: "Cariofileno", percentage: 0.7 },
      { name: "Limoneno", percentage: 0.3 }
    ],
    effects: ["Relajación", "Sueño", "Calma", "Alivio del dolor", "Apetito"],
    flavors: ["Terroso", "Dulce", "Chocolate", "Café"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Trainwreck",
    slug: "trainwreck",
    type: "hybrid",
    description: "Un híbrido sativa-dominante de la costa oeste con efectos que golpean como un tren. Combina genéticas tailandesas, mexicanas y afganas. Proporciona euforia cerebral intensa con relajación corporal suave.",
    genetics: {
      parent1: "Mexican x Thai",
      parent2: "Afghani",
      breeder: "Unknown (Humboldt County)"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 1.2 },
      { name: "Mirceno", percentage: 0.8 },
      { name: "Pineno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Felicidad", "Creatividad", "Energía", "Relajación"],
    flavors: ["Cítrico", "Pino", "Especiado", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Strawberry Cough",
    slug: "strawberry-cough",
    type: "sativa",
    description: "Una sativa dulce con aroma intenso a fresas frescas que provoca tos expansiva. Cruza Haze con Strawberry Fields para sabor frutal único. Proporciona efectos edificantes sociales con claridad mental excepcional.",
    genetics: {
      parent1: "Haze",
      parent2: "Strawberry Fields",
      breeder: "Kyle Kushman"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 20,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 0.9 },
      { name: "Pineno", percentage: 0.6 },
      { name: "Cariofileno", percentage: 0.4 }
    ],
    effects: ["Euforia", "Felicidad", "Energía", "Sociabilidad", "Creatividad"],
    flavors: ["Berry", "Dulce", "Frutal", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Lemon Haze",
    slug: "lemon-haze",
    type: "sativa",
    description: "Una sativa cítrica ganadora de la Cannabis Cup con aroma intenso a limón fresco. Cruza Lemon Skunk con Silver Haze para energía duradera. Perfecta para uso diurno con efectos edificantes y motivadores.",
    genetics: {
      parent1: "Lemon Skunk",
      parent2: "Silver Haze",
      breeder: "Green House Seeds"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 22,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.5 },
      { name: "Cariofileno", percentage: 0.6 },
      { name: "Pineno", percentage: 0.4 }
    ],
    effects: ["Energía", "Euforia", "Creatividad", "Felicidad", "Concentración"],
    flavors: ["Cítrico", "Dulce", "Herbal", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Bruce Banner",
    slug: "bruce-banner",
    type: "hybrid",
    description: "Nombrada por el alter ego de Hulk, es una de las cepas más potentes disponibles. Cruza OG Kush con Strawberry Diesel para THC extremadamente alto. Efectos intensos que combinan euforia cerebral con relajación corporal.",
    genetics: {
      parent1: "OG Kush",
      parent2: "Strawberry Diesel",
      breeder: "Dark Horse Genetics"
    },
    cannabinoidProfile: {
      thcMin: 24,
      thcMax: 30,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.1 },
      { name: "Limoneno", percentage: 0.9 },
      { name: "Mirceno", percentage: 0.6 }
    ],
    effects: ["Euforia", "Relajación", "Felicidad", "Creatividad", "Energía"],
    flavors: ["Diesel", "Dulce", "Frutal", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Zkittlez",
    slug: "zkittlez",
    type: "indica",
    description: "Una indica ganadora de premios con sabor a caramelo de frutas que recuerda al dulce. Cruza Grape Ape con Grapefruit para perfil de terpenos único. Efectos relajantes profundos con felicidad tranquila y creativa.",
    genetics: {
      parent1: "Grape Ape",
      parent2: "Grapefruit",
      breeder: "3rd Gen Family & Terp Hogz"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 23,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Humuleno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Felicidad", "Calma", "Euforia", "Creatividad"],
    flavors: ["Frutal", "Dulce", "Berry", "Tropical"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Runtz",
    slug: "runtz",
    type: "hybrid",
    description: "Un híbrido balanceado extremadamente popular por su sabor dulce a caramelo. Cruza Zkittlez con Gelato para efectos equilibrados potentes. Euforia cerebral combinada con relajación corporal profunda y duradera.",
    genetics: {
      parent1: "Zkittlez",
      parent2: "Gelato",
      breeder: "Cookies Fam & Runtz Crew"
    },
    cannabinoidProfile: {
      thcMin: 19,
      thcMax: 29,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.2 },
      { name: "Limoneno", percentage: 0.9 },
      { name: "Linalol", percentage: 0.5 }
    ],
    effects: ["Euforia", "Relajación", "Felicidad", "Calma", "Creatividad"],
    flavors: ["Frutal", "Dulce", "Tropical", "Berry"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Durban Poison",
    slug: "durban-poison",
    type: "sativa",
    description: "Una sativa pura originaria de Sudáfrica con genética landrace antigua. Conocida por su energía limpia sin ansiedad y sabor dulce especiado. Perfecta para actividades diurnas, creatividad y enfoque mental claro.",
    genetics: {
      parent1: "South African Landrace",
      parent2: "Unknown",
      breeder: "Ed Rosenthal"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 1.3 },
      { name: "Mirceno", percentage: 0.6 },
      { name: "Ocimeno", percentage: 0.5 }
    ],
    effects: ["Energía", "Euforia", "Creatividad", "Concentración", "Motivación"],
    flavors: ["Dulce", "Terroso", "Pino", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Acapulco Gold",
    slug: "acapulco-gold",
    type: "sativa",
    description: "Una sativa legendaria de México con cogollos dorados y efectos energizantes. Famosa desde los años 60 por su potencia y sabor único. Proporciona euforia motivadora con claridad mental y creatividad expansiva.",
    genetics: {
      parent1: "Mexican Landrace",
      parent2: "Unknown",
      breeder: "Unknown (Mexico)"
    },
    cannabinoidProfile: {
      thcMin: 15,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 0.9 },
      { name: "Mirceno", percentage: 0.7 },
      { name: "Limoneno", percentage: 0.5 }
    ],
    effects: ["Euforia", "Energía", "Creatividad", "Felicidad", "Sociabilidad"],
    flavors: ["Terroso", "Dulce", "Especiado", "Café"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Maui Wowie",
    slug: "maui-wowie",
    type: "sativa",
    description: "Una sativa tropical de Hawái con sabor a piña y mango. Combina genética landrace hawaiana con efectos edificantes suaves. Perfecta para actividades al aire libre con energía positiva y creativa.",
    genetics: {
      parent1: "Hawaiian Landrace",
      parent2: "Unknown",
      breeder: "Unknown (Hawaii)"
    },
    cannabinoidProfile: {
      thcMin: 13,
      thcMax: 19,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 0.8 },
      { name: "Limoneno", percentage: 0.7 },
      { name: "Pineno", percentage: 0.4 }
    ],
    effects: ["Energía", "Euforia", "Felicidad", "Creatividad", "Sociabilidad"],
    flavors: ["Tropical", "Dulce", "Frutal", "Cítrico"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Super Silver Haze",
    slug: "super-silver-haze",
    type: "sativa",
    description: "Una sativa ganadora de tres Cannabis Cups consecutivas en Amsterdam. Combina Skunk, Northern Lights y Haze para energía duradera. Efectos cerebrales potentes con euforia creativa y motivación sostenida.",
    genetics: {
      parent1: "Skunk #1",
      parent2: "Northern Lights x Haze",
      breeder: "Green House Seeds"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 23,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Terpinoleno", percentage: 1.1 },
      { name: "Cariofileno", percentage: 0.7 },
      { name: "Mirceno", percentage: 0.5 }
    ],
    effects: ["Energía", "Euforia", "Creatividad", "Felicidad", "Concentración"],
    flavors: ["Cítrico", "Especiado", "Terroso", "Skunk"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Blueberry",
    slug: "blueberry",
    type: "indica",
    description: "Una indica clásica creada por DJ Short con sabor auténtico a arándanos frescos. Ganadora de la High Times Cannabis Cup como mejor indica. Proporciona relajación corporal profunda con euforia suave y duradera.",
    genetics: {
      parent1: "Purple Thai",
      parent2: "Thai x Afghani",
      breeder: "DJ Short"
    },
    cannabinoidProfile: {
      thcMin: 16,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.4 },
      { name: "Pineno", percentage: 0.6 },
      { name: "Cariofileno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Felicidad", "Euforia", "Calma", "Sueño"],
    flavors: ["Berry", "Dulce", "Frutal", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Skywalker OG",
    slug: "skywalker-og",
    type: "hybrid",
    description: "Un híbrido indica-dominante que combina Skywalker con OG Kush. Ofrece potentes efectos relajantes que te envían al espacio exterior. Excelente para relajación nocturna profunda y alivio del dolor crónico.",
    genetics: {
      parent1: "Skywalker",
      parent2: "OG Kush",
      breeder: "Reserva Privada"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 26,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.1 },
      { name: "Cariofileno", percentage: 0.8 },
      { name: "Limoneno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Sueño", "Alivio del dolor"],
    flavors: ["Diesel", "Terroso", "Pino", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Banana OG",
    slug: "banana-og",
    type: "hybrid",
    description: "Un híbrido indica-dominante con aroma distintivo a plátano maduro y combustible. Cruza OG Kush con Banana para sabor tropical único. Efectos relajantes potentes con euforia cerebral suave y duradera.",
    genetics: {
      parent1: "OG Kush",
      parent2: "Banana",
      breeder: "Cali Kush"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Cariofileno", percentage: 0.6 }
    ],
    effects: ["Relajación", "Felicidad", "Euforia", "Calma", "Creatividad"],
    flavors: ["Frutal", "Tropical", "Dulce", "Diesel"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Cereal Milk",
    slug: "cereal-milk",
    type: "hybrid",
    description: "Un híbrido moderno con sabor dulce cremoso que recuerda a la leche de cereales. Cruza Snowman con Y-Life para efectos balanceados únicos. Euforia edificante combinada con relajación corporal suave.",
    genetics: {
      parent1: "Snowman",
      parent2: "Y-Life",
      breeder: "Cookies Fam"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 23,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.0 },
      { name: "Cariofileno", percentage: 0.7 },
      { name: "Linalol", percentage: 0.4 }
    ],
    effects: ["Felicidad", "Relajación", "Euforia", "Creatividad", "Calma"],
    flavors: ["Dulce", "Vainilla", "Frutal", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Ice Cream Cake",
    slug: "ice-cream-cake",
    type: "indica",
    description: "Una indica potente con sabor dulce cremoso a postre helado. Cruza Wedding Cake con Gelato #33 para efectos sedantes profundos. Excelente para relajación nocturna, insomnio y alivio del dolor intenso.",
    genetics: {
      parent1: "Wedding Cake",
      parent2: "Gelato #33",
      breeder: "Seed Junky Genetics"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.3 },
      { name: "Limoneno", percentage: 0.9 },
      { name: "Humuleno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Sueño", "Calma", "Euforia", "Alivio del dolor"],
    flavors: ["Dulce", "Vainilla", "Terroso", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "MAC",
    slug: "mac",
    type: "hybrid",
    description: "Miracle Alien Cookies es un híbrido balanceado extremadamente potente y aromático. Cruza Alien Cookies con Starfighter y Colombian. Efectos cerebrales intensos con relajación corporal profunda y euforia creativa.",
    genetics: {
      parent1: "Alien Cookies",
      parent2: "Starfighter x Colombian",
      breeder: "Capulator"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 23,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.1 },
      { name: "Cariofileno", percentage: 0.8 },
      { name: "Linalol", percentage: 0.6 }
    ],
    effects: ["Euforia", "Creatividad", "Felicidad", "Relajación", "Concentración"],
    flavors: ["Cítrico", "Floral", "Dulce", "Diesel"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Gary Payton",
    slug: "gary-payton",
    type: "hybrid",
    description: "Nombrada por el jugador de baloncesto, es un híbrido premium de Cookies Fam. Cruza The Y con Snowman para potencia y sabor excepcionales. Efectos equilibrados potentes con euforia creativa y relajación.",
    genetics: {
      parent1: "The Y",
      parent2: "Snowman",
      breeder: "Cookies x Powerzzz Genetics"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.9 },
      { name: "Linalol", percentage: 0.5 }
    ],
    effects: ["Euforia", "Felicidad", "Relajación", "Creatividad", "Concentración"],
    flavors: ["Dulce", "Diesel", "Terroso", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Mimosa",
    slug: "mimosa",
    type: "sativa",
    description: "Una sativa dominante con sabor cítrico tropical que recuerda al cóctel. Cruza Clementine con Purple Punch para energía edificante suave. Perfecta para uso diurno con efectos motivadores y creativos sin ansiedad.",
    genetics: {
      parent1: "Clementine",
      parent2: "Purple Punch",
      breeder: "Symbiotic Genetics"
    },
    cannabinoidProfile: {
      thcMin: 19,
      thcMax: 27,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.4 },
      { name: "Cariofileno", percentage: 0.7 },
      { name: "Pineno", percentage: 0.5 }
    ],
    effects: ["Energía", "Euforia", "Felicidad", "Creatividad", "Concentración"],
    flavors: ["Cítrico", "Tropical", "Dulce", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Do-Si-Dos",
    slug: "do-si-dos",
    type: "indica",
    description: "Una indica potente de la familia Cookies con sabor dulce terroso floral. Cruza Face Off OG con Girl Scout Cookies para efectos sedantes. Excelente para relajación profunda, alivio del estrés y sueño reparador.",
    genetics: {
      parent1: "Face Off OG",
      parent2: "Girl Scout Cookies",
      breeder: "Archive Seed Bank"
    },
    cannabinoidProfile: {
      thcMin: 19,
      thcMax: 30,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.2 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Linalol", percentage: 0.6 }
    ],
    effects: ["Relajación", "Euforia", "Sueño", "Calma", "Felicidad"],
    flavors: ["Dulce", "Terroso", "Floral", "Pino"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Purple Punch",
    slug: "purple-punch",
    type: "indica",
    description: "Una indica dulce como un postre con sabor a uvas y bayas. Cruza Larry OG con Granddaddy Purple para efectos sedantes potentes. Perfecta para relajación nocturna profunda y alivio del insomnio crónico.",
    genetics: {
      parent1: "Larry OG",
      parent2: "Granddaddy Purple",
      breeder: "Supernova Gardens"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.1 },
      { name: "Limoneno", percentage: 0.7 },
      { name: "Pineno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Sueño", "Felicidad", "Calma", "Euforia"],
    flavors: ["Uva", "Berry", "Dulce", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Tangie",
    slug: "tangie",
    type: "sativa",
    description: "Una sativa cítrica con aroma intenso a mandarinas frescas recién peladas. Recrea la genética de Tangerine Dream para sabor nostálgico. Proporciona energía edificante con euforia creativa y motivación sostenida.",
    genetics: {
      parent1: "California Orange",
      parent2: "Skunk #1",
      breeder: "DNA Genetics"
    },
    cannabinoidProfile: {
      thcMin: 19,
      thcMax: 22,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.6 },
      { name: "Mirceno", percentage: 0.7 },
      { name: "Pineno", percentage: 0.4 }
    ],
    effects: ["Energía", "Euforia", "Creatividad", "Felicidad", "Concentración"],
    flavors: ["Cítrico", "Tropical", "Dulce", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Tropicana Cookies",
    slug: "tropicana-cookies",
    type: "hybrid",
    description: "Un híbrido sativa-dominante con sabor explosivo a naranja y frutas tropicales. Cruza Girl Scout Cookies con Tangie para potencia y sabor. Efectos edificantes energéticos con claridad mental y creatividad expansiva.",
    genetics: {
      parent1: "Girl Scout Cookies",
      parent2: "Tangie",
      breeder: "Oni Seed Co"
    },
    cannabinoidProfile: {
      thcMin: 22,
      thcMax: 28,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.5 },
      { name: "Cariofileno", percentage: 0.8 },
      { name: "Mirceno", percentage: 0.5 }
    ],
    effects: ["Energía", "Euforia", "Creatividad", "Felicidad", "Concentración"],
    flavors: ["Cítrico", "Tropical", "Dulce", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Jet Fuel",
    slug: "jet-fuel",
    type: "hybrid",
    description: "Un híbrido sativa-dominante con aroma penetrante a combustible de aviación. Cruza Aspen OG con High Country Diesel para potencia extrema. Efectos cerebrales intensos con energía duradera y enfoque mental agudo.",
    genetics: {
      parent1: "Aspen OG",
      parent2: "High Country Diesel",
      breeder: "303 Seeds"
    },
    cannabinoidProfile: {
      thcMin: 16,
      thcMax: 20,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Mirceno", percentage: 0.6 }
    ],
    effects: ["Energía", "Euforia", "Concentración", "Creatividad", "Motivación"],
    flavors: ["Diesel", "Pino", "Skunk", "Terroso"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Kosher Kush",
    slug: "kosher-kush",
    type: "indica",
    description: "Una indica premium ganadora de la Cannabis Cup y la única variedad bendecida por un rabino. Conocida por su potencia sedante extrema y sabor terroso. Excelente para insomnio severo y alivio del dolor crónico.",
    genetics: {
      parent1: "Unknown",
      parent2: "Unknown",
      breeder: "DNA Genetics"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.3 },
      { name: "Cariofileno", percentage: 0.9 },
      { name: "Limoneno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Sueño", "Alivio del dolor", "Calma", "Euforia"],
    flavors: ["Terroso", "Pino", "Especiado", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "LA Confidential",
    slug: "la-confidential",
    type: "indica",
    description: "Una indica galardonada de Los Ángeles con efectos profundamente relajantes. Cruza OG LA Affie con Afghani para sedación potente. Perfecta para relajación nocturna, alivio del estrés y sueño profundo reparador.",
    genetics: {
      parent1: "OG LA Affie",
      parent2: "Afghani",
      breeder: "DNA Genetics"
    },
    cannabinoidProfile: {
      thcMin: 16,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.2 },
      { name: "Pineno", percentage: 0.7 },
      { name: "Cariofileno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Sueño", "Calma", "Alivio del dolor", "Felicidad"],
    flavors: ["Pino", "Terroso", "Skunk", "Dulce"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "King's Breath",
    slug: "kings-breath",
    type: "indica",
    description: "Una indica potente con linaje OG Kush que proporciona relajación regia profunda. Conocida por sus cogollos densos cubiertos de tricomas brillantes. Efectos sedantes intensos perfectos para relajación nocturna completa.",
    genetics: {
      parent1: "OG Kush",
      parent2: "SFVOG",
      breeder: "Unknown"
    },
    cannabinoidProfile: {
      thcMin: 18,
      thcMax: 27,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.1 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Cariofileno", percentage: 0.6 }
    ],
    effects: ["Relajación", "Sueño", "Euforia", "Calma", "Alivio del dolor"],
    flavors: ["Diesel", "Pino", "Terroso", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Cherry Pie",
    slug: "cherry-pie",
    type: "hybrid",
    description: "Un híbrido indica-dominante con sabor dulce a cerezas y masa de pastel. Cruza Granddaddy Purple con Durban Poison para efectos balanceados. Relajación corporal profunda combinada con claridad mental creativa.",
    genetics: {
      parent1: "Granddaddy Purple",
      parent2: "Durban Poison",
      breeder: "Unknown (Bay Area)"
    },
    cannabinoidProfile: {
      thcMin: 16,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.7 },
      { name: "Pineno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Creatividad", "Calma"],
    flavors: ["Berry", "Dulce", "Terroso", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Forbidden Fruit",
    slug: "forbidden-fruit",
    type: "indica",
    description: "Una indica exótica con sabor profundo a frutas tropicales y bayas. Cruza Cherry Pie con Tangie para perfil de terpenos único. Relajación profunda con euforia suave perfecta para relajación vespertina.",
    genetics: {
      parent1: "Cherry Pie",
      parent2: "Tangie",
      breeder: "Chameleon Extracts"
    },
    cannabinoidProfile: {
      thcMin: 17,
      thcMax: 26,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Limoneno", percentage: 1.2 },
      { name: "Mirceno", percentage: 0.8 },
      { name: "Cariofileno", percentage: 0.6 }
    ],
    effects: ["Relajación", "Felicidad", "Euforia", "Calma", "Sueño"],
    flavors: ["Tropical", "Berry", "Cítrico", "Dulce"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Sundae Driver",
    slug: "sundae-driver",
    type: "hybrid",
    description: "Un híbrido balanceado con sabor cremoso dulce a helado de chocolate. Cruza Fruity Pebbles OG con Grape Pie para efectos equilibrados. Relajación suave combinada con euforia creativa y felicidad duradera.",
    genetics: {
      parent1: "Fruity Pebbles OG",
      parent2: "Grape Pie",
      breeder: "Cannarado Genetics"
    },
    cannabinoidProfile: {
      thcMin: 14,
      thcMax: 22,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.0 },
      { name: "Limoneno", percentage: 0.8 },
      { name: "Humuleno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Felicidad", "Euforia", "Creatividad", "Calma"],
    flavors: ["Dulce", "Chocolate", "Frutal", "Vainilla"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Animal Mints",
    slug: "animal-mints",
    type: "hybrid",
    description: "Un híbrido potente con sabor refrescante a menta y galleta dulce. Cruza Animal Cookies con SinMint Cookies para genética premium. Efectos potentes que combinan euforia cerebral con relajación corporal profunda.",
    genetics: {
      parent1: "Animal Cookies",
      parent2: "SinMint Cookies",
      breeder: "Seed Junky Genetics"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 25,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.1 },
      { name: "Limoneno", percentage: 0.9 },
      { name: "Linalol", percentage: 0.6 }
    ],
    effects: ["Euforia", "Relajación", "Felicidad", "Calma", "Creatividad"],
    flavors: ["Menta", "Dulce", "Terroso", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "Platinum OG",
    slug: "platinum-og",
    type: "indica",
    description: "Una indica premium con genética OG Kush y cogollos plateados brillantes. Conocida por su potencia excepcional y sabor diesel terroso. Relajación profunda con euforia suave perfecta para alivio del estrés.",
    genetics: {
      parent1: "OG Kush",
      parent2: "Master Kush x Afghani",
      breeder: "Apothecary Genetics"
    },
    cannabinoidProfile: {
      thcMin: 17,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.3
    },
    terpenes: [
      { name: "Mirceno", percentage: 1.2 },
      { name: "Cariofileno", percentage: 0.8 },
      { name: "Pineno", percentage: 0.5 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Sueño", "Calma"],
    flavors: ["Diesel", "Terroso", "Pino", "Especiado"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "GMO Cookies",
    slug: "gmo-cookies",
    type: "indica",
    description: "También conocida como Garlic Cookies, es una indica con aroma intenso a ajo y diesel. Cruza Chemdawg con Girl Scout Cookies para potencia extrema. Efectos sedantes profundos perfectos para relajación nocturna completa.",
    genetics: {
      parent1: "Chemdawg",
      parent2: "Girl Scout Cookies",
      breeder: "Mamiko Seeds"
    },
    cannabinoidProfile: {
      thcMin: 24,
      thcMax: 30,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.4 },
      { name: "Limoneno", percentage: 0.9 },
      { name: "Mirceno", percentage: 0.7 }
    ],
    effects: ["Relajación", "Euforia", "Sueño", "Calma", "Alivio del dolor"],
    flavors: ["Diesel", "Terroso", "Especiado", "Herbal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  },
  {
    name: "London Pound Cake",
    slug: "london-pound-cake",
    type: "hybrid",
    description: "Un híbrido indica-dominante con sabor dulce a pastel de limón glaseado. Cruza Sunset Sherbet con una genética desconocida para perfil único. Relajación profunda con euforia creativa y felicidad duradera prolongada.",
    genetics: {
      parent1: "Sunset Sherbet",
      parent2: "Unknown",
      breeder: "Cookies Fam"
    },
    cannabinoidProfile: {
      thcMin: 20,
      thcMax: 29,
      cbdMin: 0.1,
      cbdMax: 0.2
    },
    terpenes: [
      { name: "Cariofileno", percentage: 1.2 },
      { name: "Limoneno", percentage: 1.0 },
      { name: "Humuleno", percentage: 0.6 }
    ],
    effects: ["Relajación", "Euforia", "Felicidad", "Calma", "Creatividad"],
    flavors: ["Dulce", "Cítrico", "Vainilla", "Frutal"],
    averageRatings: { overall: 0, potency: 0, flavor: 0, appearance: 0 },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false
  }
];
