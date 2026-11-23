import { effectLabels } from "~/lib/effect-labels";
import { Link, useFetcher } from "react-router";
import { RatingStars } from "./rating-stars";
import { formatRelativeTime } from "~/lib/utils";
import { Icon } from "~/components/ui/icon";
import { reviewDisplay, type ReviewAuthor } from "~/lib/review-display";

interface ReviewCardProps {
  review: {
    _id: string;
    ratings: { overall: number };
    comment: string;
    effectsExperienced: string[];
    helpfulCount: number;
    helpfulVotes?: string[];
    createdAt: string;
    publishedAs?: "username" | "anonymous";
    context?: { method?: string; timeOfDay?: string; setting?: string };
    user?: ReviewAuthor;
  };
  currentUserId?: string;
  variant?: "strain" | "entity";
}

export function ReviewCard({ review, currentUserId, variant = "strain" }: ReviewCardProps) {
  const fetcher = useFetcher();
  const hasVoted = currentUserId && review.helpfulVotes?.includes(currentUserId);
  const optimisticCount =
    fetcher.state !== "idle"
      ? hasVoted
        ? review.helpfulCount - 1
        : review.helpfulCount + 1
      : review.helpfulCount;

  const display = reviewDisplay(review, review.user);

  return (
    <article className="card p-5 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <AuthorHeader display={display} createdAt={review.createdAt} />
        </div>
        <RatingStars rating={review.ratings.overall} size="sm" />
      </header>

      {variant === "strain" && review.context && (review.context.method || review.context.timeOfDay || review.context.setting) && (
        <div className="flex flex-wrap gap-1.5">
          {review.context.method && <span className="pill">{review.context.method}</span>}
          {review.context.timeOfDay && <span className="pill">{review.context.timeOfDay}</span>}
          {review.context.setting && <span className="pill">{review.context.setting}</span>}
        </div>
      )}

      {review.comment && (
        <p className="text-[16px] text-fg leading-relaxed">{review.comment}</p>
      )}

      {variant === "strain" && review.effectsExperienced?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {effectLabels(review.effectsExperienced).map((effect) => (
            <span key={effect} className="pill accent">
              {effect}
            </span>
          ))}
        </div>
      )}

      <footer className="flex items-center gap-4 pt-2 border-t-2 border-ink">
        {currentUserId ? (
          <fetcher.Form method="post" action={`/api/reviews/${review._id}/vote`}>
            <button
              type="submit"
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                hasVoted ? "text-fg font-extrabold bg-yellow px-1.5" : "text-fg font-bold hover:bg-yellow px-1.5"
              }`}
            >
              <Icon name="thumbUp" size={14} />
              Útil ({optimisticCount})
            </button>
          </fetcher.Form>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-fg-muted">
            <Icon name="thumbUp" size={14} />
            Útil ({review.helpfulCount})
          </span>
        )}
      </footer>
    </article>
  );
}

function AuthorHeader({
  display,
  createdAt,
}: {
  display: ReturnType<typeof reviewDisplay>;
  createdAt: string;
}) {
  const avatarNode = display.avatar ? (
    <img
      src={display.avatar}
      alt=""
      className="h-10 w-10 object-cover border-2 border-ink"
    />
  ) : (
    <span
      aria-hidden
      className={`h-10 w-10 border-2 border-ink flex items-center justify-center text-ink ${display.isAnonymous ? "bg-white" : "bg-yellow"}`}
    >
      {display.isAnonymous ? (
        <Icon name="user" size={16} />
      ) : (
        <span className="rotulo text-lg">{display.initial}</span>
      )}
    </span>
  );

  const body = (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[15px] font-extrabold [font-stretch:85%] text-fg"
        >
          {display.handle}
        </span>
        {display.topBadge && (
          <span className="pill accent !py-0.5 !text-[10px] tracking-wider uppercase">
            {display.topBadge.name}
          </span>
        )}
      </div>
      <div className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
        <span>{formatRelativeTime(createdAt)}</span>
        {display.locationLine && (
          <>
            <span>·</span>
            <span>{display.locationLine}</span>
          </>
        )}
      </div>
    </div>
  );

  if (display.profileHref) {
    return (
      <Link
        to={display.profileHref}
        className="flex items-center gap-3 group hover:underline decoration-2 underline-offset-4"
      >
        {avatarNode}
        {body}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {avatarNode}
      {body}
    </div>
  );
}
