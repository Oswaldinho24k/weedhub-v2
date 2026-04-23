import { getShowcaseBadge, type BadgeWithPriority } from "~/constants/gamification";
import { countryLabel } from "~/constants/locations";
import type { EarnedBadge } from "~/types/user";

export interface ReviewAuthor {
  username?: string;
  anonymousHandle?: string;
  avatar?: string;
  earnedBadges?: EarnedBadge[];
  publishAsAnonymous?: boolean;
  country?: string;
  city?: string;
  showCityPublicly?: boolean;
}

export interface ReviewLike {
  publishedAs?: "username" | "anonymous";
  createdAt?: string;
}

export interface ReviewDisplay {
  handle: string;
  isAnonymous: boolean;
  profileHref: string | null;
  initial: string;
  avatar: string | null;
  topBadge: BadgeWithPriority | null;
  locationLine: string;
}

/**
 * Pure function. Client-safe. Computes everything a UI needs to render a
 * review author honoring the anonymity + privacy rules.
 */
export function reviewDisplay(
  review: ReviewLike,
  author: ReviewAuthor | null | undefined
): ReviewDisplay {
  const anonymous = review.publishedAs === "anonymous" || !author?.username;
  const country = author?.country;
  const countryLbl = country ? countryLabel(country) : "";

  if (anonymous) {
    const handle = author?.anonymousHandle || "Anónimo";
    return {
      handle,
      isAnonymous: true,
      profileHref: null,
      initial: "?",
      avatar: null,
      topBadge: null,
      locationLine: countryLbl,
    };
  }

  const username = author!.username!;
  const showCity = !!author?.showCityPublicly && !!author?.city;
  const locationLine = showCity
    ? `${author!.city}, ${countryLbl}`
    : countryLbl;

  return {
    handle: `@${username}`,
    isAnonymous: false,
    profileHref: `/profile/${username}`,
    initial: username.charAt(0).toUpperCase(),
    avatar: author?.avatar || null,
    topBadge: getShowcaseBadge(author?.earnedBadges),
    locationLine,
  };
}
