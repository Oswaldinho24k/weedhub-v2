import type { Route } from "./+types/posts.$postId.vote";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { PostModel } from "~/models/post.server";

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const post = await PostModel.findById(params.postId);
  if (!post) throw new Response("Not Found", { status: 404 });

  const userId = user._id;
  const hasVoted = post.upvotes.some((id) => id.equals(userId));

  if (hasVoted) {
    post.upvotes = post.upvotes.filter((id) => !id.equals(userId)) as typeof post.upvotes;
    post.upvoteCount = Math.max(0, post.upvoteCount - 1);
  } else {
    post.upvotes.push(userId);
    post.upvoteCount += 1;
  }

  await post.save();
  return { upvoteCount: post.upvoteCount, hasVoted: !hasVoted };
}
