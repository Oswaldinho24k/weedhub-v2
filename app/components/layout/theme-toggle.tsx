import { useFetcher } from "react-router";
import { Icon } from "~/components/ui/icon";
import type { Theme } from "~/lib/theme.server";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const fetcher = useFetcher();
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <fetcher.Form method="post" action="/api/theme">
      <input type="hidden" name="theme" value={next} />
      <button
        type="submit"
        aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
        className="h-9 w-9 grid place-items-center rounded-[3px] border-2 border-current hover:bg-yellow hover:text-ink transition-colors"
        onClick={() => {
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
        }}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
      </button>
    </fetcher.Form>
  );
}
