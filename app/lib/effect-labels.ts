/**
 * Strain effects are stored inconsistently (English names like "Relaxed",
 * a few Spanish ones like "Inspiración"/"Risa", and junk like "None").
 * This is the one place that normalizes them to a key and localized labels.
 */
type Labels = { es: string; pt: string; en: string };

export const EFFECTS: Record<string, Labels & { stored: string[] }> = {
  happy: { es: "Felicidad", pt: "Feliz", en: "Happy", stored: ["Happy"] },
  relaxed: { es: "Relajación", pt: "Relaxado", en: "Relaxed", stored: ["Relaxed", "Relajación"] },
  euphoric: { es: "Euforia", pt: "Eufórico", en: "Euphoric", stored: ["Euphoric", "Euforia"] },
  uplifted: { es: "Ánimo", pt: "Animado", en: "Uplifted", stored: ["Uplifted"] },
  creative: { es: "Creatividad", pt: "Criativo", en: "Creative", stored: ["Creative", "Creatividad", "Inspiración"] },
  sleepy: { es: "Sueño", pt: "Sono", en: "Sleepy", stored: ["Sleepy"] },
  energetic: { es: "Energía", pt: "Energético", en: "Energetic", stored: ["Energetic"] },
  focused: { es: "Concentración", pt: "Focado", en: "Focused", stored: ["Focused"] },
  hungry: { es: "Apetito", pt: "Apetite", en: "Hungry", stored: ["Hungry"] },
  talkative: { es: "Sociabilidad", pt: "Sociável", en: "Talkative", stored: ["Talkative"] },
  tingly: { es: "Hormigueo", pt: "Formigamento", en: "Tingly", stored: ["Tingly"] },
  wellbeing: { es: "Bienestar", pt: "Bem-estar", en: "Wellbeing", stored: ["Wellbeing"] },
  calm: { es: "Calma", pt: "Calmo", en: "Calm", stored: ["Calm"] },
  giggly: { es: "Risas", pt: "Risadas", en: "Giggly", stored: ["Giggly", "Risa"] },
  meditative: { es: "Meditativo", pt: "Meditativo", en: "Meditative", stored: ["Meditative"] },
  "pain-relief": { es: "Alivio del dolor", pt: "Alívio da dor", en: "Pain relief", stored: ["Pain Relief"] },
  aroused: { es: "Excitación", pt: "Excitado", en: "Aroused", stored: ["Aroused"] },
};

const IGNORED = new Set(["None", "Mouth", "Dry"]);
const BY_STORED: Record<string, string> = {};
for (const [key, e] of Object.entries(EFFECTS)) for (const s of e.stored) BY_STORED[s] = key;

export function effectKey(stored: string): string | null {
  if (IGNORED.has(stored)) return null;
  return BY_STORED[stored] ?? null;
}

/** Localized label for a stored effect value; unknown values pass through. */
export function effectLabel(stored: string, locale = "es"): string | null {
  if (IGNORED.has(stored)) return null;
  const key = BY_STORED[stored];
  if (!key) return stored;
  const l = (locale === "pt" || locale === "en" ? locale : "es") as keyof Labels;
  return EFFECTS[key][l];
}

/** Localized, de-duplicated effect labels for a strain. */
export function effectLabels(stored: string[] = [], locale = "es"): string[] {
  const out: string[] = [];
  for (const s of stored) {
    const label = effectLabel(s, locale);
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

/** Stored values that match an effect key (or label), for Mongo $in filters. */
export function storedValuesFor(keyOrLabel: string): string[] {
  const k = EFFECTS[keyOrLabel] ? keyOrLabel : Object.keys(EFFECTS).find((x) => Object.values(EFFECTS[x]).includes(keyOrLabel as any));
  return k ? EFFECTS[k].stored : [keyOrLabel];
}
