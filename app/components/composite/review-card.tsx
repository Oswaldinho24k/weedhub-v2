import { Link, useFetcher } from "react-router";
import { RatingStars } from "./rating-stars";
import { formatRelativeTime } from "~/lib/utils";
import { Icon } from "~/components/ui/icon";

interface ReviewCardProps {
  review: {
    _id: string;
    ratings: { overall: number };
    comment: string;
    effectsExperienced: string[];
    helpfulCount: number;
    helpfulVotes?: string[];
    createdAt: string;
    context?: { method?: string; timeOfDay?: string; setting?: string };
    user?: {
      _id: string;
      displayName: string;
      avatar?: string;
      cannabisProfile?: { experienceLevel: string };
    };
  };
  currentUserId?: string;
}

const BADGE_FROM_LEVEL: Record<string, string> = {
  principiante: "NOVATO",
  intermedio: "INTERMEDIO",
  experimentado: "EXPERTO",
  experto: "EXPERTO",
};

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
  const fetcher = useFetcher();
  const hasVoted = currentUserId && review.helpfulVotes?.includes(currentUserId);
  const optimisticCount =
    fetcher.state !== "idle"
      ? hasVoted
        ? review.helpfulCount - 1
        : review.helpfulCount + 1
      : review.helpfulCount;
  const badge = review.user?.cannabisProfile?.experienceLevel
    ? BADGE_FROM_LEVEL[review.user.cannabisProfile.experienceLevel]
    : null;

  return (
    <article className="card p-5 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {review.user && (
            <Link
              to={`/profile/${review.user._id}`}
              className="flex items-center gap-3 group"
            >
              <span
                className="h-10 w-10 rounded-full bg-elev border border-line flex items-center justify-center font-medium"
                style={{ color: "var(--accent)" }}
                aria-hidden
              >
                {review.user.displayName.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg group-hover:text-accent transition-colors">
                    {review.user.displayName}
                  </span>
                  {badge && <span className="pill accent !py-0.5 !text-[10px] tracking-wider">{badge}</span>}
                </div>
                <span className="text-xs text-fg-dim">
                  {formatRelativeTime(review.createdAt)}
                </span>
              </div>
            </Link>
          )}
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
