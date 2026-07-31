import type { Route } from "./+types/users.$userId.follow";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { UserModel } from "~/models/user.server";

export async function action({ request, params }: Route.ActionArgs) {
  const sessionUser = await requireUser(request);
  await connectDB();

  const targetId = params.userId;
  if (String(sessionUser._id) === targetId) {
    throw new Response("No puedes seguirte a ti mismo", { status: 400 });
  }

  const [target, me] = await Promise.all([
    UserModel.findById(targetId).select("_id"),
    UserModel.findById(sessionUser._id).select("following"),
  ]);

  if (!target || !me) throw new Response("Not Found", { status: 404 });

  const isFollowing = me.following.some((id) => id.equals(targetId));

  if (isFollowing) {
    me.following = me.following.filter(
      (id) => !id.equals(targetId)
    ) as typeof me.following;
  } else {
    me.following.push(target._id as any);
  }

  await me.save();
  return { following: !isFollowing };
}
