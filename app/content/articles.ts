import {
  FEATURED_ARTICLES,
  COMMUNITY_VOICES,
  type Article,
  type CommunityVoice,
} from "./articles.es";
import { FEATURED_ARTICLES_PT, COMMUNITY_VOICES_PT } from "./articles.pt";
import { FEATURED_ARTICLES_EN, COMMUNITY_VOICES_EN } from "./articles.en";
import type { Locale } from "~/lib/i18n";

export { FEATURED_ARTICLES, COMMUNITY_VOICES, type Article, type CommunityVoice };

export function getFeaturedArticles(locale: Locale): Article[] {
  if (locale === "pt") return FEATURED_ARTICLES_PT;
  if (locale === "en") return FEATURED_ARTICLES_EN;
  return FEATURED_ARTICLES;
}

export function getCommunityVoices(locale: Locale): CommunityVoice[] {
  if (locale === "pt") return COMMUNITY_VOICES_PT;
  if (locale === "en") return COMMUNITY_VOICES_EN;
  return COMMUNITY_VOICES;
}
