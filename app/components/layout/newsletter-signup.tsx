import { useEffect } from "react";
import { useFetcher } from "react-router";
import { Icon } from "~/components/ui/icon";
import { useToast } from "~/components/ui/toast";

type State = {
  ok?: boolean;
  alreadySubscribed?: boolean;
  error?: string;
};

export function NewsletterSignup() {
  const fetcher = useFetcher<State>();
  const { push } = useToast();
  const state: State | undefined = fetcher.data;
  const submitting = fetcher.state !== "idle";

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      push(
        state.alreadySubscribed
          ? "Ya estabas suscrita a la lista."
          : "¡Listo! Revisa tu bandeja.",
        "accent"
      );
    } else if (state.error) {
      push(state.error, "warm");
    }
  }, [state, push]);

  return (
    <div>
      <div className="kicker mb-3">Boletín</div>
      <p className="text-sm text-fg-muted leading-relaxed mb-4 max-w-[32ch]">
        Un correo al mes con lo mejor del magazine. Sin spam, cancelas cuando quieras.
      </p>
      <fetcher.Form
        method="post"
        action="/api/newsletter"
        className="flex items-center gap-2 max-w-[360px]"
        onSubmit={(e) => {
          if (state?.ok) {
            // Prevent double submits after success
            const form = e.currentTarget;
            setTimeout(() => form.reset(), 0);
          }
        }}
      >
        <label htmlFor="nl-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="nl-email"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          required
          className="flex-1 h-10 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="btn btn-primary !py-2 !px-3 text-xs"
          disabled={submitting}
          aria-label="Suscribirme"
        >
          {submitting ? (
            "…"
          ) : (
            <>
              <Icon name="send" size={14} />
              <span className="hidden sm:inline">Suscribirme</span>
            </>
          )}
        </button>
      </fetcher.Form>
    </div>
  );
}
