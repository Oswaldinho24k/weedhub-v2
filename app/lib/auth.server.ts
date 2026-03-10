import bcrypt from "bcryptjs";
import { redirect } from "react-router";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { getSession, commitSession, destroySession } from "~/sessions.server";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUserSession(userId: string, request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", userId);
  return commitSession(session);
}

export async function getUserFromSession(request: Request) {
  await connectDB();
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) return null;

  try {
    const user = await UserModel.findById(userId).select("-passwordHash").lean();
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect("/auth");
  }
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw redirect("/strains");
  }
  return user;
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
