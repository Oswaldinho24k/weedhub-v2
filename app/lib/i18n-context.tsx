import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localizeHref, type Locale } from "./i18n";
import type { Dictionary } from "~/content/locales/es";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
  /** Build a locale-aware href from a locale-agnostic path (always starts with `/`). */
  href: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dict,
      href: (path: string) => localizeHref(locale, path),
    }),
    [locale, dict]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useT / useLocale must be used inside a <LocaleProvider>");
  }
  return ctx;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export function useHref(): (path: string) => string {
  return useLocaleContext().href;
}

/**
 * Translation hook. Returns the full dictionary; consumers read `t.navbar.login` etc.
 * Keys are type-checked against the master es dictionary.
 */
export function useT(): Dictionary {
  return useLocaleContext().dict;
}
