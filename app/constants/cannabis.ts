export const STRAIN_TYPES = [
  { value: "sativa", label: "Sativa", color: "text-orange-400" },
  { value: "indica", label: "Indica", color: "text-purple-400" },
  { value: "hybrid", label: "Híbrida", color: "text-primary" },
] as const;

export const EFFECTS = [
  "Relajación", "Euforia", "Felicidad", "Creatividad", "Energía",
  "Concentración", "Alivio del dolor", "Anti-ansiedad", "Apetito",
  "Sueño", "Sociabilidad", "Calma", "Meditativo", "Motivación",
  "Risas", "Bienestar", "Alivio muscular", "Anti-náusea",
] as const;

export const TERPENES = [
  { name: "Mirceno", aroma: "Terroso, herbal", color: "#4ade80" },
  { name: "Limoneno", aroma: "Cítrico", color: "#fbbf24" },
  { name: "Cariofileno", aroma: "Pimienta, especiado", color: "#f97316" },
  { name: "Linalol", aroma: "Floral, lavanda", color: "#c084fc" },
  { name: "Pineno", aroma: "Pino, fresco", color: "#34d399" },
  { name: "Humuleno", aroma: "Lúpulo, terroso", color: "#a3e635" },
  { name: "Terpinoleno", aroma: "Frutal, herbal", color: "#fb923c" },
  { name: "Ocimeno", aroma: "Dulce, herbal", color: "#f472b6" },
] as const;

export const FLAVORS = [
  "Terroso", "Cítrico", "Dulce", "Pino", "Frutal", "Diesel",
  "Floral", "Especiado", "Skunk", "Berry", "Tropical", "Uva",
  "Menta", "Queso", "Chocolate", "Café", "Vainilla", "Herbal",
] as const;

export const CONSUMPTION_METHODS = [
  { value: "joint", label: "Porro/Joint", icon: "smoking_rooms" },
  { value: "pipe", label: "Pipa", icon: "smoking_rooms" },
  { value: "bong", label: "Bong", icon: "smoking_rooms" },
  { value: "vaporizer", label: "Vaporizador", icon: "vaping_rooms" },
  { value: "edible", label: "Comestible", icon: "restaurant" },
  { value: "tincture", label: "Tintura", icon: "local_pharmacy" },
  { value: "topical", label: "Tópico", icon: "spa" },
  { value: "dab", label: "Dab/Concentrado", icon: "whatshot" },
] as const;
