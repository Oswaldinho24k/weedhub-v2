export const RATING_CATEGORIES = [
  { key: "overall", label: "General", icon: "star" },
  { key: "potency", label: "Potencia", icon: "bolt" },
  { key: "flavor", label: "Sabor", icon: "restaurant" },
  { key: "aroma", label: "Aroma", icon: "spa" },
  { key: "appearance", label: "Apariencia", icon: "visibility" },
  { key: "effects", label: "Efectos", icon: "psychology" },
] as const;

export const CONTEXT_SETTINGS = [
  "Solo/a", "Con amigos", "En pareja", "En fiesta", "Al aire libre",
  "En casa", "En la naturaleza", "En concierto",
] as const;

export const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Mañana", icon: "wb_sunny" },
  { value: "afternoon", label: "Tarde", icon: "wb_twilight" },
  { value: "evening", label: "Noche", icon: "nights_stay" },
  { value: "latenight", label: "Madrugada", icon: "dark_mode" },
] as const;
