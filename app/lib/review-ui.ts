/** Client-safe labels for the content review screen (the logic lives in services/content-review.server.ts). */
export const REVIEW_COLLECTIONS = [
  { key: "cepas", label: "Cepas" },
  { key: "glosario", label: "Glosario" },
  { key: "mapa-verde", label: "Mapa Verde" },
  { key: "articulos", label: "Magazine" },
] as const;
