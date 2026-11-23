/**
 * Users service + admin dashboard stats: pure data logic.
 * Used by routes/admin.users.tsx, routes/admin._index.tsx and ai/actions/users.server.ts.
 *
 * Never selects passwordHash. Email is never part of these results (the admin UI shows email
 * only on the reviews screen, through services/moderation.server.ts with `withEmail`).
 */
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { StrainModel } from "~/models/strain.server";
import { ReviewModel } from "~/models/review.server";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const PUBLIC_FIELDS = "username anonymousHandle country role stats earnedBadges points onboardingCompleted createdAt";
const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toUserRow(u: any) {
  return {
    _id: String(u._id),
    username: u.username as string,
    anonymousHandle: u.anonymousHandle as string,
    country: u.country as string,
    role: u.role as UserRole,
    reviewCount: (u.stats?.reviewCount as number) ?? 0,
    points: (u.points as number) ?? 0,
    badges: (u.earnedBadges?.length as number) ?? 0,
    joinedAt: ((u.stats?.joinedAt ?? u.createdAt) as Date | undefined)?.toISOString(),
    onboardingCompleted: Boolean(u.onboardingCompleted),
  };
}

export async function listUsers(opts: { q?: string; country?: string; role?: string; limit?: number } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (opts.q) filter.username = { $regex: escapeRegex(opts.q), $options: "i" };
  if (opts.country) filter.country = String(opts.country).toUpperCase();
  if (opts.role && USER_ROLES.includes(opts.role as UserRole)) filter.role = opts.role;
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 100);

  const [users, total, adminCount, matched] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).limit(limit).select(PUBLIC_FIELDS).lean(),
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: "admin" }),
    UserModel.countDocuments(filter),
  ]);
  return { users: users.map(toUserRow), total, adminCount, matched };
}

/** Finds a user by id or username. */
async function findUserFilter(idOrUsername: string) {
  const v = String(idOrUsername ?? "").trim().replace(/^@/, "");
  if (!v) return null;
  return isObjectId(v) ? { _id: v } : { username: v.toLowerCase() };
}

export async function getUser(idOrUsername: string) {
  await connectDB();
  const filter = await findUserFilter(idOrUsername);
  if (!filter) return null;
  const u = await UserModel.findOne(filter).select(PUBLIC_FIELDS).lean();
  return u ? toUserRow(u) : null;
}

export async function setUserRole(idOrUsername: string, role: string) {
  await connectDB();
  if (!USER_ROLES.includes(role as UserRole)) return { ok: false as const, error: `Rol inválido: ${role}` };
  const filter = await findUserFilter(idOrUsername);
  if (!filter) return { ok: false as const, error: "Usuario no encontrado" };
  const current = await UserModel.findOne(filter).select("username role").lean();
  if (!current) return { ok: false as const, error: "Usuario no encontrado" };
  if (current.role === "admin" && role !== "admin" && (await UserModel.countDocuments({ role: "admin" })) <= 1) {
    return { ok: false as const, error: "No puedes quitar al último administrador" };
  }
  await UserModel.updateOne({ _id: current._id }, { role });
  return { ok: true as const, id: String(current._id), username: current.username, role: role as UserRole, previous: current.role };
}

/** Sets points to 0 and clears earned badges. Review stats are untouched. */
export async function resetUserPoints(idOrUsername: string) {
  await connectDB();
  const filter = await findUserFilter(idOrUsername);
  if (!filter) return { ok: false as const, error: "Usuario no encontrado" };
  const user = await UserModel.findOneAndUpdate(filter, { points: 0, earnedBadges: [] }, { new: true }).select("username");
  if (!user) return { ok: false as const, error: "Usuario no encontrado" };
  return { ok: true as const, id: String(user._id), username: user.username };
}

/** Numbers for /admin: totals, flagged reviews, top countries and acquisition sources. */
export async function dashboardStats() {
  await connectDB();
  const [strainCount, archivedStrainCount, reviewCount, userCount, flaggedCount, countryAgg, sourceAgg] = await Promise.all([
    StrainModel.countDocuments(),
    StrainModel.countDocuments({ isArchived: true }),
    ReviewModel.countDocuments(),
    UserModel.countDocuments(),
    ReviewModel.countDocuments({ status: "flagged" }),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { country: { $exists: true, $ne: null } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { acquisitionSource: { $exists: true, $ne: null } } },
      { $group: { _id: "$acquisitionSource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);
  return {
    strainCount,
    archivedStrainCount,
    reviewCount,
    userCount,
    flaggedCount,
    topCountries: countryAgg.map((c) => ({ code: c._id, count: c.count })),
    topSources: sourceAgg.map((s) => ({ value: s._id, count: s.count })),
  };
}
