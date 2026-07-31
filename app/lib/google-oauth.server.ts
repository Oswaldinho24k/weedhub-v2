import { Google, generateState, generateCodeVerifier } from "arctic";
import { SITE_URL } from "~/lib/seo";

const DEV_REDIRECT = "http://localhost:5173";

let _google: Google | null = null;

export function getGoogle(): Google {
  if (_google) return _google;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const base = process.env.NODE_ENV === "production" ? SITE_URL : DEV_REDIRECT;
  const redirectUri = `${base}/auth/google/callback`;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }
  _google = new Google(clientId, clientSecret, redirectUri);
  return _google;
}

export { generateState, generateCodeVerifier };

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  return res.json();
}
