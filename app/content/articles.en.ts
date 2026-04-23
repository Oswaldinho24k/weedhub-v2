/**
 * English editorial curation. AI-drafted.
 * TODO(editorial-en): Commission native English writers with LatAm context.
 * These stubs assume the target is English-speaking readers IN LatAm / who
 * follow LatAm cannabis culture — not US-centric.
 */
import type { Article, CommunityVoice } from "./articles.es";

export const FEATURED_ARTICLES_EN: Article[] = [
  {
    slug: "mexican-landraces",
    title: "Mexican landraces: the genetic library we lost (and are reclaiming)",
    kicker: "History",
    readTime: "8 min",
    dek:
      "From Acapulco Gold to Michoacán's mountains, a tour of the mother strains of Latin American cannabis.",
    author: "Mariana Ruelas",
  },
  {
    slug: "terpenes-101",
    title: "Terpenes 101: why two strains with the same THC feel different",
    kicker: "Science",
    readTime: "6 min",
    dek:
      "Myrcene, limonene, linalool — the chemistry behind aroma, flavor, and effect. A quick read, no filler.",
    author: "Dr. Camilo Vega",
  },
  {
    slug: "latam-cannabis-law",
    title: "Cannabis law across Latin America: a 2026 snapshot",
    kicker: "Policy",
    readTime: "11 min",
    dek:
      "From Uruguay's pioneer model to Mexico's slow rollout and Colombia's medical framework — what actually works for users.",
    author: "Diego Sarmiento",
  },
  {
    slug: "microdosing-guide",
    title: "Microdosing: how to measure what works without overdoing it",
    kicker: "Education",
    readTime: "5 min",
    dek:
      "An honest guide for beginners: why less is more and how to keep your own journal.",
    author: "Ana Paula Tovar",
  },
  {
    slug: "tropical-indoor-grow",
    title: "Indoor growing in tropical climates: humidity, mold, and saving the harvest",
    kicker: "Grow",
    readTime: "12 min",
    dek:
      "From Medellín to Mérida, the most common mistakes and how to avoid them. With phase-by-phase tables.",
    author: "Hernán Ospina",
  },
  {
    slug: "cbd-anxiety",
    title: "CBD and anxiety: what evidence says (and what's sold as evidence)",
    kicker: "Health",
    readTime: "7 min",
    dek:
      "We reviewed seven studies. Results are promising — and more complicated than the marketing.",
    author: "Dra. Paola Mendoza",
  },
];

export const COMMUNITY_VOICES_EN: CommunityVoice[] = [
  {
    name: "Laura",
    city: "Mexico City",
    role: "Curious",
    quote:
      "I came to WeedHub looking for clear information without lectures. I found a community that explains without assuming.",
  },
  {
    name: "Matteo",
    city: "Medellín",
    role: "Grower",
    quote:
      "Context-rich reviews help me pick genetics. Knowing if it was smoked or vaped changes everything.",
  },
  {
    name: "Renata",
    city: "Guadalajara",
    role: "Therapeutic",
    quote:
      "Finally a place where 'time of day' is part of the review. My body and Indica keep schedules.",
  },
];
