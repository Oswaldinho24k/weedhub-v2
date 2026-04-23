import { createCookie } from "react-router";
import {
  DEFAULT_LOCALE,
  detectFromAcceptLanguage,
  isLocale,
  parseLocalePath,
  type Locale,
} from "./i18n";

export const localeCookie = createCookie("wh:locale", {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
});

/**
 * Resolve locale for the request. Precedence:
 *   1. URL prefix (`/pt/...`, `/en/...`)
 *   2. Cookie `wh:locale`
 *   3. Accept-Language header
 *   4. DEFAULT_LOCALE (es)
 */
export async function resolveLocale(request: Request): Promise<Locale> {
  const url = new URL(request.url);
  const { locale: urlLocale, path } = parseLocalePath(url.pathname);
  // If URL has explicit locale prefix, it wins.
  if (path !== url.pathname) {
    return urlLocale;
  }

  const cookieValue = await localeCookie.parse(request.headers.get("Cookie"));
  if (isLocale(cookieValue)) return cookieValue;

  return detectFromAcceptLanguage(request.headers.get("Accept-Language"));
}

export async function serializeLocale(locale: Locale): Promise<string> {
  return localeCookie.serialize(locale);
}

export { DEFAULT_LOCALE };
