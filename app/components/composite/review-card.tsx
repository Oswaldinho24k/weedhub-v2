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
}

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
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

      {review.context && (review.context.method || review.context.timeOfDay || review.context.setting) && (
        <div className="flex flex-wrap gap-1.5">
          {review.context.method && <span className="pill">{review.context.method}</span>}
          {review.context.timeOfDay && <span className="pill">{review.context.timeOfDay}</span>}
          {review.context.setting && <span className="pill">{review.context.setting}</span>}
        </div>
      )}

      {review.comment && (
        <p className="text-sm text-fg-muted leading-relaxed">{review.comment}</p>
      )}

      {review.effectsExperienced?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.effectsExperienced.map((effect) => (
            <span key={effect} className="pill accent">
              {effect}
            </span>
          ))}
        </div>
      )}

      <footer className="flex items-center gap-4 pt-2 border-t border-line">
        {currentUserId ? (
          <fetcher.Form method="post" action={`/api/reviews/${review._id}/vote`}>
            <button
              type="submit"
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                hasVoted ? "text-accent" : "text-fg-muted hover:text-accent"
              }`}
            >
              <Icon name="thumbUp" size={14} />
              Útil ({optimisticCount})
            </button>
          </fetcher.Form>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-fg-muted">
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
      className="h-10 w-10 rounded-full object-cover border border-line"
    />
  ) : (
    <span
      aria-hidden
      className="h-10 w-10 rounded-full bg-elev border border-line flex items-center justify-center"
      style={{ color: display.isAnonymous ? "var(--fg-dim)" : "var(--accent)" }}
    >
      {display.isAnonymous ? (
        <Icon name="user" size={16} />
      ) : (
        <span className="font-medium">{display.initial}</span>
      )}
    </span>
  );

  const body = (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-sm font-medium ${display.isAnonymous ? "mono text-fg" : "text-fg"}`}
        >
          {display.handle}
        </span>
        {display.topBadge && (
          <span className="pill accent !py-0.5 !text-[10px] tracking-wider uppercase">
            {display.topBadge.name}
          </span>
        )}
      </div>
      <div className="text-xs text-fg-dim flex items-center gap-1.5">
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
        className="flex items-center gap-3 group hover:text-accent transition-colors"
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
