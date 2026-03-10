import type { Route } from "./+types/reviews.$reviewId.vote";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { updateUserStats } from "~/services/review.service.server";
import { awardPoints, checkAndAwardBadges } from "~/services/gamification.service.server";
import { POINTS } from "~/constants/gamification";

export async function action({ params, request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const review = await ReviewModel.findById(params.reviewId);
  if (!review) {
    return new Response("Review not found", { status: 404 });
  }

  const userId = user._id;
  const hasVoted = review.helpfulVotes.some(
    (id) => id.toString() === userId.toString()
  );

  if (hasVoted) {
    review.helpfulVotes = review.helpfulVotes.filter(
      (id) => id.toString() !== userId.toString()
    );
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulVotes.push(userId);
    review.helpfulCount += 1;

    // Award points to voter
    await awardPoints(String(userId), POINTS.GAVE_HELPFUL_VOTE);
    // Award points to review author
    await awardPoints(String(review.userId), POINTS.RECEIVED_HELPFUL_VOTE);
  }

  await review.save();

  // Update author stats and check for badges
  await updateUserStats(String(review.userId));
  await checkAndAwardBadges(String(review.userId));

  return { success: true, helpfulCount: review.helpfulCount, hasVoted: !hasVoted };
}
