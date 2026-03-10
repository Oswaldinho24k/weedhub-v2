import type { BadgeDefinition } from "~/types/user";

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-review",
    name: "Primera Reseña",
    description: "Escribiste tu primera reseña",
    icon: "edit_note",
    requirement: 1,
    type: "reviews",
  },
  {
    id: "reviewer-5",
    name: "Reseñador Activo",
    description: "Escribiste 5 reseñas",
    icon: "rate_review",
    requirement: 5,
    type: "reviews",
  },
  {
    id: "reviewer-25",
    name: "Crítico Experto",
    description: "Escribiste 25 reseñas",
    icon: "military_tech",
    requirement: 25,
    type: "reviews",
  },
  {
    id: "reviewer-100",
    name: "Leyenda Cannábica",
    description: "Escribiste 100 reseñas",
    icon: "emoji_events",
    requirement: 100,
    type: "reviews",
  },
  {
    id: "helpful-10",
    name: "Útil",
    description: "Recibiste 10 votos útiles",
    icon: "thumb_up",
    requirement: 10,
    type: "helpful",
  },
  {
    id: "helpful-50",
    name: "Muy Útil",
    description: "Recibiste 50 votos útiles",
    icon: "volunteer_activism",
    requirement: 50,
    type: "helpful",
  },
  {
    id: "explorer-10",
    name: "Explorador",
    description: "Reseñaste 10 cepas diferentes",
    icon: "explore",
    requirement: 10,
    type: "strains",
  },
  {
    id: "explorer-50",
    name: "Catador",
    description: "Reseñaste 50 cepas diferentes",
    icon: "local_florist",
    requirement: 50,
    type: "strains",
  },
];

export const POINTS = {
  REVIEW_CREATED: 10,
  REVIEW_WITH_COMMENT: 5,
  RECEIVED_HELPFUL_VOTE: 2,
  GAVE_HELPFUL_VOTE: 1,
  COMPLETED_ONBOARDING: 15,
  BADGE_EARNED: 20,
} as const;
