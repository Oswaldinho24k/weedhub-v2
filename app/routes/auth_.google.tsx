import { redirect } from "react-router";
import type { Route } from "./+types/auth_.google";
import { getSession, commitSession } from "~/sessions.server";
import { getGoogle, generateState, generateCodeVerifier } from "~/lib/google-oauth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const google = getGoogle();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  const session = await getSession(request.headers.get("Cookie"));
  session.set("googleOAuthState", state);
  session.set("googleOAuthCodeVerifier", codeVerifier);

  return redirect(url.toString(), {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
