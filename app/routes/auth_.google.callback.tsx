import { redirect } from "react-router";
import type { Route } from "./+types/auth_.google.callback";
import { getSession, commitSession } from "~/sessions.server";
import { getGoogle, getGoogleUserInfo } from "~/lib/google-oauth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { generateAnonymousHandle } from "~/lib/anon-handle.server";
import { sendWelcomeEmail } from "~/lib/email.server";
import { randomBytes } from "crypto";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const session = await getSession(request.headers.get("Cookie"));
  const savedState = session.get("googleOAuthState");
  const codeVerifier = session.get("googleOAuthCodeVerifier");

  // Clear OAuth state from session
  session.unset("googleOAuthState");
  session.unset("googleOAuthCodeVerifier");

  if (!code || !state || !savedState || state !== savedState || !codeVerifier) {
    return redirect("/auth?error=oauth_failed", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  let googleUser;
  try {
    const google = getGoogle();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();
    googleUser = await getGoogleUserInfo(accessToken);
  } catch {
    return redirect("/auth?error=oauth_failed", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  if (!googleUser.email_verified || !googleUser.email) {
    return redirect("/auth?error=email_not_verified", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  await connectDB();

  // Find by googleId first, then by email
  let user = await UserModel.findOne({
    $or: [{ googleId: googleUser.sub }, { email: googleUser.email }],
  });

  if (user) {
    // Link Google account if not already linked
    if (!user.googleId) {
      await UserModel.updateOne({ _id: user._id }, { googleId: googleUser.sub });
    }
  } else {
    // Create new user from Google data
    const anonymousHandle = await generateAnonymousHandle();
    const baseUsername = googleUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "user";
    let username = baseUsername;
    let attempt = 0;
    while (await UserModel.exists({ username })) {
      attempt++;
      username = `${baseUsername}${attempt}`;
    }

    user = await UserModel.create({
      email: googleUser.email,
      googleId: googleUser.sub,
      passwordHash: randomBytes(32).toString("hex"), // unusable hash, login is via Google
      username,
      anonymousHandle,
      publishAsAnonymous: true,
      country: "MX",
      displayName: googleUser.name || username,
      avatar: googleUser.picture || undefined,
    });

    void sendWelcomeEmail(googleUser.email, username);
  }

  // Set userId on the same session (OAuth keys already unset above) and commit once
  session.set("userId", String(user._id));
  return redirect(user.onboardingCompleted ? "/strains" : "/onboarding", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
