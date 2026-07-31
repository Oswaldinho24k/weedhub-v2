export type ConditionCategory = "mental" | "dolor" | "sueno" | "digestivo" | "neurologico" | "otro";

export interface Condition {
  slug: string;
  labelEs: string;
  labelEn: string;
  labelPt: string;
  category: ConditionCategory;
  emoji: string;
}

export const CONDITIONS: Condition[] = [
  // Mental / emocional
  { slug: "ansiedad", labelEs: "Ansiedad", labelEn: "Anxiety", labelPt: "Ansiedade", category: "mental", emoji: "😰" },
  { slug: "estres", labelEs: "Estrés", labelEn: "Stress", labelPt: "Estresse", category: "mental", emoji: "😤" },
  { slug: "depresion", labelEs: "Depresión", labelEn: "Depression", labelPt: "Depressão", category: "mental", emoji: "😔" },
  { slug: "trastorno-panico", labelEs: "Trastorno de pánico", labelEn: "Panic disorder", labelPt: "Transtorno do pânico", category: "mental", emoji: "😱" },
  { slug: "ptsd", labelEs: "PTSD", labelEn: "PTSD", labelPt: "PTSD", category: "mental", emoji: "🧠" },
  { slug: "tda-tdah", labelEs: "TDA / TDAH", labelEn: "ADD / ADHD", labelPt: "TDAH", category: "mental", emoji: "⚡" },

  // Dolor
  { slug: "dolor-cronico", labelEs: "Dolor crónico", labelEn: "Chronic pain", labelPt: "Dor crônica", category: "dolor", emoji: "🔥" },
  { slug: "migraña", labelEs: "Migraña", labelEn: "Migraine", labelPt: "Enxaqueca", category: "dolor", emoji: "🤯" },
  { slug: "dolor-muscular", labelEs: "Dolor muscular", labelEn: "Muscle pain", labelPt: "Dor muscular", category: "dolor", emoji: "💪" },
  { slug: "artritis", labelEs: "Artritis", labelEn: "Arthritis", labelPt: "Artrite", category: "dolor", emoji: "🦴" },
  { slug: "inflamacion", labelEs: "Inflamación", labelEn: "Inflammation", labelPt: "Inflamação", category: "dolor", emoji: "🌡️" },

  // Sueño
  { slug: "insomnio", labelEs: "Insomnio", labelEn: "Insomnia", labelPt: "Insônia", category: "sueno", emoji: "😴" },
  { slug: "sueño-interrumpido", labelEs: "Sueño interrumpido", labelEn: "Interrupted sleep", labelPt: "Sono interrompido", category: "sueno", emoji: "🌙" },

  // Digestivo
  { slug: "nauseas", labelEs: "Náuseas", labelEn: "Nausea", labelPt: "Náuseas", category: "digestivo", emoji: "🤢" },
  { slug: "falta-de-apetito", labelEs: "Falta de apetito", labelEn: "Lack of appetite", labelPt: "Falta de apetite", category: "digestivo", emoji: "🍽️" },

  // Neurológico
  { slug: "epilepsia", labelEs: "Epilepsia", labelEn: "Epilepsy", labelPt: "Epilepsia", category: "neurologico", emoji: "⚡" },
  { slug: "espasmos-musculares", labelEs: "Espasmos musculares", labelEn: "Muscle spasms", labelPt: "Espasmos musculares", category: "neurologico", emoji: "🫀" },
  { slug: "esclerosis-multiple", labelEs: "Esclerosis múltiple", labelEn: "Multiple sclerosis", labelPt: "Esclerose múltipla", category: "neurologico", emoji: "🧬" },

  // Otro
  { slug: "fatiga", labelEs: "Fatiga", labelEn: "Fatigue", labelPt: "Fadiga", category: "otro", emoji: "😪" },
  { slug: "creatividad-foco", labelEs: "Foco / Creatividad", labelEn: "Focus / Creativity", labelPt: "Foco / Criatividade", category: "otro", emoji: "🎯" },
];

export const CONDITIONS_BY_SLUG = Object.fromEntries(CONDITIONS.map((c) => [c.slug, c]));

export const CONDITION_CATEGORY_LABELS: Record<ConditionCategory, string> = {
  mental: "Salud mental",
  dolor: "Dolor",
  sueno: "Sueño",
  digestivo: "Digestivo",
  neurologico: "Neurológico",
  otro: "Otros",
};
