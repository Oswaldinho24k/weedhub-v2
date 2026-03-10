import { Link, useFetcher } from "react-router";
import { Avatar } from "~/components/ui/avatar";
import { RatingStars } from "./rating-stars";
import { formatRelativeTime } from "~/lib/utils";

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

const EXPERIENCE_ICONS: Record<string, string> = {
  principiante: "eco",
  intermedio: "potted_plant",
  experimentado: "local_florist",
  experto: "psychology",
};

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
  const fetcher = useFetcher();
  const hasVoted = currentUserId && review.helpfulVotes?.includes(currentUserId);
  const optimisticCount = fetcher.state !== "idle"
    ? (hasVoted ? review.helpfulCount - 1 : review.helpfulCount + 1)
    : review.helpfulCount;

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:border-white/15 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {review.user && (
            <Link to={`/profile/${review.user._id}`} className="flex items-center gap-3 group">
              <Avatar
                src={review.user.avatar}
                fallback={review.user.displayName.charAt(0).toUpperCase()}
                size="sm"
              />
              <div>
                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {review.user.displayName}
                </p>
                {review.user.cannabisProfile?.experienceLevel && (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <span className="material-symbols-outlined text-xs text-primary">
                      {EXPERIENCE_ICONS[review.user.cannabisProfile.experienceLevel] || "person"}
                    </span>
                    {review.user.cannabisProfile.experienceLevel}
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RatingStars rating={review.ratings.overall} size="sm" />
          <span className="text-xs text-text-muted/60">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-text-muted leading-relaxed">{review.comment}</p>
      )}

      {/* Effects */}
      {review.effectsExperienced?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.effectsExperienced.map((effect) => (
            <span
              key={effect}
              className="px-3 py-1 border border-primary/20 rounded-full bg-primary/10 text-xs text-primary"
            >
              {effect}
            </span>
          ))}
        </div>
      )}

      {/* Context */}
      {review.context && (review.context.method || review.context.setting) && (
        <div className="flex gap-3 text-xs text-text-muted/60">
          {review.context.method && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">local_fire_department</span>
              {review.context.method}
            </span>
          )}
          {review.context.setting && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">location_on</span>
              {review.context.setting}
            </span>
          )}
        </div>
      )}

      {/* Helpful */}
      <div className="flex items-center gap-4 pt-1">
        {currentUserId ? (
          <fetcher.Form method="post" action={`/api/reviews/${review._id}/vote`}>
            <button
              type="submit"
              className={`flex items-center gap-1 text-xs transition-colors ${
                hasVoted ? "text-primary" : "text-text-muted hover:text-primary"
              }`}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={hasVoted ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                thumb_up
              </span>
              Útil ({optimisticCount})
            </button>
          </fetcher.Form>
        ) : (
          <span className="text-xs text-text-muted">
            <span className="material-symbols-outlined text-sm align-middle mr-1">thumb_up</span>
            Útil ({review.helpfulCount})
          </span>
        )}
      </div>
    </div>
  );
}
