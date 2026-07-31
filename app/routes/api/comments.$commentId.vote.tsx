import type { Route } from "./+types/comments.$commentId.vote";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { CommentModel } from "~/models/comment.server";

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const comment = await CommentModel.findById(params.commentId);
  if (!comment) throw new Response("Not Found", { status: 404 });

  const userId = user._id;
  const hasVoted = comment.upvotes.some((id) => id.equals(userId));

  if (hasVoted) {
    comment.upvotes = comment.upvotes.filter((id) => !id.equals(userId)) as typeof comment.upvotes;
    comment.upvoteCount = Math.max(0, comment.upvoteCount - 1);
  } else {
    comment.upvotes.push(userId);
    comment.upvoteCount += 1;
  }

  await comment.save();
  return { upvoteCount: comment.upvoteCount, hasVoted: !hasVoted };
}
