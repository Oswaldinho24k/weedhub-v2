import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { BADGES, POINTS } from "~/constants/gamification";

export async function awardPoints(userId: string, points: number) {
  await connectDB();
  await UserModel.findByIdAndUpdate(userId, { $inc: { points } });
}

export async function checkAndAwardBadges(userId: string) {
  await connectDB();
  const user = await UserModel.findById(userId).lean();
  if (!user) return [];

  const earnedBadgeIds = user.earnedBadges.map((b) => b.badgeId);
  const newBadges: string[] = [];

  for (const badge of BADGES) {
    if (earnedBadgeIds.includes(badge.id)) continue;

    let earned = false;
    switch (badge.type) {
      case "reviews":
        earned = user.stats.reviewCount >= badge.requirement;
        break;
      case "helpful":
        earned = user.stats.helpfulVotesReceived >= badge.requirement;
        break;
      case "strains":
        earned = user.stats.strainsReviewed >= badge.requirement;
        break;
    }

    if (earned) {
      newBadges.push(badge.id);
    }
  }

  if (newBadges.length > 0) {
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        earnedBadges: {
          $each: newBadges.map((id) => ({ badgeId: id, earnedAt: new Date() })),
        },
      },
      $inc: { points: newBadges.length * POINTS.BADGE_EARNED },
    });
  }

  return newBadges;
}
