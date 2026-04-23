import { StrainSubmissionModel } from "~/models/strain-submission.server";

/** Limits a user to N strain submissions per window (default 3 / 7 days). */
export async function canUserSubmitStrain(
  userId: string,
  opts: { maxPerWindow?: number; windowDays?: number } = {}
): Promise<{ ok: true } | { ok: false; retryAfter: Date; used: number }> {
  const max = opts.maxPerWindow ?? 3;
  const days = opts.windowDays ?? 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recent = await StrainSubmissionModel.find({
    submittedBy: userId,
    createdAt: { $gte: since },
  })
    .sort({ createdAt: 1 })
    .select("createdAt")
    .lean();

  if (recent.length < max) return { ok: true };

  const oldest = recent[0];
  const retryAfter = new Date(
    new Date(oldest.createdAt).getTime() + days * 24 * 60 * 60 * 1000
  );
  return { ok: false, retryAfter, used: recent.length };
}
