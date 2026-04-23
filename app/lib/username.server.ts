import { UserModel } from "~/models/user.server";
import { slugifyToUsername } from "~/lib/username";

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const exists = await UserModel.exists({ username });
  return !exists;
}

export async function ensureUniqueUsername(base: string): Promise<string> {
  const seed = slugifyToUsername(base) || "usuario";
  let candidate = seed.length < 3 ? `${seed}_${Date.now().toString(36).slice(-4)}` : seed;
  let n = 0;
  while (!(await isUsernameAvailable(candidate))) {
    n++;
    const suffix = String(n);
    candidate = `${seed.slice(0, 20 - suffix.length - 1)}_${suffix}`;
    if (n > 50) {
      candidate = `${seed.slice(0, 14)}_${Date.now().toString(36).slice(-4)}`;
      break;
    }
  }
  return candidate;
}
