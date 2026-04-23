import { useFetcher, useLocation, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Icon } from "~/components/ui/icon";
import { useLocale } from "~/lib/i18n-context";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  SUPPORTED_LOCALES,
  parseLocalePath,
  type Locale,
} from "~/lib/i18n";

export function LanguageSwitcher() {
  const current = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function switchTo(locale: Locale) {
    if (locale === current) {
      setOpen(false);
      return;
    }
    // Persist preference in cookie.
    const form = new FormData();
    form.set("locale", locale);
    fetcher.submit(form, { method: "post", action: "/api/locale" });

    // Rewrite current URL with the new prefix.
    const { path } = parseLocalePath(location.pathname);
    const target =
      locale === DEFAULT_LOCALE
        ? `${path}${location.search}${location.hash}`
        : `/${locale}${path === "/" ? "" : path}${location.search}${location.hash}`;
    navigate(target);
    setOpen(false);
  }

  const meta = LOCALE_META[current];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Cambiar idioma"
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-9 px-2.5 grid grid-flow-col items-center gap-1 rounded-full border border-line text-fg-muted hover:text-fg hover:bg-elev transition-colors text-xs mono uppercase tracking-wider"
      >
        {current}
        <Icon name="chevronDown" size={12} />
      </button>
      {open && (
        <div
          role="menu"
          className="fade-up absolute right-0 top-full mt-2 w-44 card-strong p-1 shadow-[var(--shadow-soft)] z-50"
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const m = LOCALE_META[locale];
            const active = locale === current;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => switchTo(locale)}
                className="w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-elev hover:text-fg transition-colors"
                style={active ? { color: "var(--accent)" } : undefined}
              >
                <span>{m.nativeLabel}</span>
                <span className="mono text-xs text-fg-dim">{locale}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
