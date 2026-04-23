import { useEffect } from "react";
import { useFetcher } from "react-router";
import { Icon } from "~/components/ui/icon";
import { useToast } from "~/components/ui/toast";
import { useT } from "~/lib/i18n-context";

type State = {
  ok?: boolean;
  alreadySubscribed?: boolean;
  error?: string;
};

export function NewsletterSignup() {
  const t = useT();
  const fetcher = useFetcher<State>();
  const { push } = useToast();
  const state: State | undefined = fetcher.data;
  const submitting = fetcher.state !== "idle";

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      push(
        state.alreadySubscribed
          ? t.footer.newsletter.alreadyIn
          : t.footer.newsletter.success,
        "accent"
      );
    } else if (state.error) {
      push(state.error || t.footer.newsletter.error, "warm");
    }
  }, [state, push, t]);

  return (
    <div>
      <div className="kicker mb-3">{t.footer.newsletter.kicker}</div>
      <p className="text-sm text-fg-muted leading-relaxed mb-4 max-w-[32ch]">
        {t.footer.newsletter.description}
      </p>
      <fetcher.Form
        method="post"
        action="/api/newsletter"
        className="flex items-center gap-2 max-w-[360px]"
        onSubmit={(e) => {
          if (state?.ok) {
            const form = e.currentTarget;
            setTimeout(() => form.reset(), 0);
          }
        }}
      >
        <label htmlFor="nl-email" className="sr-only">
          {t.auth.emailLabel}
        </label>
        <input
          id="nl-email"
          name="email"
          type="email"
          placeholder={t.footer.newsletter.placeholder}
          required
          className="flex-1 h-10 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="btn btn-primary !py-2 !px-3 text-xs"
          disabled={submitting}
          aria-label={t.footer.newsletter.submit}
        >
          {submitting ? (
            "…"
          ) : (
            <>
              <Icon name="send" size={14} />
              <span className="hidden sm:inline">{t.footer.newsletter.submit}</span>
            </>
          )}
        </button>
      </fetcher.Form>
    </div>
  );
}
