import type { BadgeDefinition, EarnedBadge } from "~/types/user";

export interface BadgeWithPriority extends BadgeDefinition {
  displayPriority: number;
}

export const BADGES: BadgeWithPriority[] = [
  {
    id: "first-review",
    name: "Primera Reseña",
    description: "Escribiste tu primera reseña",
    icon: "edit_note",
    emoji: "✏️",
    requirement: 1,
    type: "reviews",
    displayPriority: 10,
  },
  {
    id: "reviewer-5",
    name: "Reseñador Activo",
    description: "Escribiste 5 reseñas",
    icon: "rate_review",
    emoji: "⭐",
    requirement: 5,
    type: "reviews",
    displayPriority: 50,
  },
  {
    id: "reviewer-25",
    name: "Crítico Experto",
    description: "Escribiste 25 reseñas",
    icon: "military_tech",
    emoji: "🏅",
    requirement: 25,
    type: "reviews",
    displayPriority: 80,
  },
  {
    id: "reviewer-100",
    name: "Leyenda Cannábica",
    description: "Escribiste 100 reseñas",
    icon: "emoji_events",
    emoji: "🏆",
    requirement: 100,
    type: "reviews",
    displayPriority: 100,
  },
  {
    id: "helpful-10",
    name: "Útil",
    description: "Recibiste 10 votos útiles",
    icon: "thumb_up",
    emoji: "👍",
    requirement: 10,
    type: "helpful",
    displayPriority: 40,
  },
  {
    id: "helpful-50",
    name: "Muy Útil",
    description: "Recibiste 50 votos útiles",
    icon: "volunteer_activism",
    emoji: "💎",
    requirement: 50,
    type: "helpful",
    displayPriority: 70,
  },
  {
    id: "explorer-10",
    name: "Explorador",
    description: "Reseñaste 10 cepas diferentes",
    icon: "explore",
    emoji: "🧭",
    requirement: 10,
    type: "strains",
    displayPriority: 45,
  },
  {
    id: "explorer-50",
    name: "Catador",
    description: "Reseñaste 50 cepas diferentes",
    icon: "local_florist",
    emoji: "🌿",
    requirement: 50,
    type: "strains",
    displayPriority: 75,
  },
];

const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export function getShowcaseBadge(
  earnedBadges: EarnedBadge[] | undefined | null
): BadgeWithPriority | null {
  if (!earnedBadges || earnedBadges.length === 0) return null;
  let best: BadgeWithPriority | null = null;
  for (const eb of earnedBadges) {
    const def = BADGE_BY_ID.get(eb.badgeId);
    if (!def) continue;
    if (!best || def.displayPriority > best.displayPriority) {
      best = def;
    }
  }
  return best;
}

export const POINTS = {
  REVIEW_CREATED: 10,
  REVIEW_WITH_COMMENT: 5,
  RECEIVED_HELPFUL_VOTE: 2,
  GAVE_HELPFUL_VOTE: 1,
  COMPLETED_ONBOARDING: 15,
  BADGE_EARNED: 20,
} as const;

export interface Level {
  name: string;
  icon: string;
  minPoints: number;
}

export const LEVELS: Level[] = [
  { name: "Semilla", icon: "eco", minPoints: 0 },
  { name: "Brote", icon: "grass", minPoints: 50 },
  { name: "Planta", icon: "potted_plant", minPoints: 150 },
  { name: "Árbol", icon: "park", minPoints: 400 },
  { name: "Bosque", icon: "forest", minPoints: 1000 },
];

export const LEVEL_EMOJI: Record<string, string> = {
  "Semilla": "🌱",
  "Brote": "🌿",
  "Planta": "🪴",
  "Árbol": "🌳",
  "Bosque": "🏕️",
};

export const LEVEL_COLOR: Record<string, string> = {
  "Semilla": "oklch(65% 0.15 145)",
  "Brote": "oklch(70% 0.18 145)",
  "Planta": "oklch(60% 0.20 155)",
  "Árbol": "oklch(55% 0.18 170)",
  "Bosque": "oklch(50% 0.22 160)",
};

export const LEVEL_COLOR_DARK: Record<string, string> = {
  "Semilla": "oklch(52% 0.14 145)",
  "Brote": "oklch(57% 0.16 145)",
  "Planta": "oklch(47% 0.18 155)",
  "Árbol": "oklch(42% 0.16 170)",
  "Bosque": "oklch(37% 0.20 160)",
};

export function getCurrentLevel(points: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      current = level;
    }
  }
  return current;
}

export function getNextLevel(points: number): Level | null {
  for (const level of LEVELS) {
    if (points < level.minPoints) {
      return level;
    }
  }
  return null;
}
