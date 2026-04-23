export interface Article {
  slug: string;
  title: string;
  kicker: string;
  readTime: string;
  dek: string;
  author?: string;
}

export const FEATURED_ARTICLES: Article[] = [
  {
    slug: "landraces-mexicanas",
    title: "Landraces mexicanas: el acervo genético que perdimos (y estamos recuperando)",
    kicker: "Historia",
    readTime: "8 min",
    dek:
      "De Acapulco Gold a la sierra michoacana, un recorrido por las variedades madre del cannabis latinoamericano.",
    author: "Mariana Ruelas",
  },
  {
    slug: "terpenos-101",
    title: "Terpenos 101: por qué dos cepas con el mismo THC se sienten distinto",
    kicker: "Ciencia",
    readTime: "6 min",
    dek:
      "Mirceno, limoneno, linalol — la química que define aroma, sabor y efecto. Una lectura rápida sin paja.",
    author: "Dr. Camilo Vega",
  },
  {
    slug: "cultura-cdmx",
    title: "De la clandestinidad al café: así cambió la conversación cannábica en CDMX",
    kicker: "Cultura",
    readTime: "10 min",
    dek:
      "Tres generaciones de cultivadores hablan sobre miedo, identidad y cómo la ciudad aprendió a nombrar la planta.",
    author: "Diego Sarmiento",
  },
  {
    slug: "dosificacion-microdosis",
    title: "Microdosis: cómo medir lo que funciona sin pasarte",
    kicker: "Educación",
    readTime: "5 min",
    dek:
      "Una guía honesta para novatos: por qué menos es más y cómo llevar tu propia bitácora.",
    author: "Ana Paula Tovar",
  },
  {
    slug: "cultivo-interior-clima-tropical",
    title: "Cultivo interior en clima tropical: humedad, hongos y cómo no perder la cosecha",
    kicker: "Cultivo",
    readTime: "12 min",
    dek:
      "De Medellín a Mérida, los errores más comunes y cómo evitarlos. Con tablas por fase.",
    author: "Hernán Ospina",
  },
  {
    slug: "cbd-ansiedad",
    title: "CBD y ansiedad: qué dice la evidencia (y qué venden como evidencia)",
    kicker: "Salud",
    readTime: "7 min",
    dek:
      "Revisamos siete estudios. Los resultados son prometedores — y también más complicados de lo que te venden.",
    author: "Dra. Paola Mendoza",
  },
];

export interface CommunityVoice {
  name: string;
  city: string;
  role: string;
  quote: string;
}

export const COMMUNITY_VOICES: CommunityVoice[] = [
  {
    name: "Laura",
    city: "CDMX",
    role: "Curiosa",
    quote:
      "Llegué a WeedHub buscando información clara y sin sermones. Encontré una comunidad que explica sin asumir.",
  },
  {
    name: "Mateo",
    city: "Medellín",
    role: "Cultivador",
    quote:
      "Las reseñas con contexto me ayudan a seleccionar genéticas. Saber si fue fumado o vaporizado cambia todo.",
  },
  {
    name: "Renata",
    city: "Guadalajara",
    role: "Uso terapéutico",
    quote:
      "Por fin un lugar donde el ‘momento del día’ es parte de la reseña. Mi cuerpo y la Indica tienen horarios.",
  },
];
