import type { Route } from "./+types/users.$userId.follow";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { UserModel } from "~/models/user.server";
import { sendNewFollowerEmail } from "~/lib/email.server";
import { SITE_URL } from "~/lib/seo";

export async function action({ request, params }: Route.ActionArgs) {
  const sessionUser = await requireUser(request);
  await connectDB();

  const targetId = params.userId;
  if (String(sessionUser._id) === targetId) {
    throw new Response("No puedes seguirte a ti mismo", { status: 400 });
  }

  const [target, me] = await Promise.all([
    UserModel.findById(targetId).select("_id email username displayName"),
    UserModel.findById(sessionUser._id).select("following username"),
  ]);

  if (!target || !me) throw new Response("Not Found", { status: 404 });

  const isFollowing = me.following.some((id) => id.equals(targetId));

  if (isFollowing) {
    me.following = me.following.filter(
      (id) => !id.equals(targetId)
    ) as typeof me.following;
  } else {
    me.following.push(target._id as any);

    // Notify new follower (fire-and-forget)
    if (target.email) {
      sendNewFollowerEmail({
        toEmail: target.email,
        toName: (target as any).displayName || (target as any).username || "",
        followerUsername: me.username,
        followerProfileUrl: `${SITE_URL}/profile/${me.username}`,
      }).catch(() => {});
    }
  }

  await me.save();
  return { following: !isFollowing };
}
