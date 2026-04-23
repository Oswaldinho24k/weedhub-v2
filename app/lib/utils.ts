import { type ClassValue, clsx } from "clsx";
import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LocaleKey = "es" | "pt" | "en";

const INTL_LOCALE: Record<LocaleKey, string> = {
  es: "es-MX",
  pt: "pt-BR",
  en: "en-US",
};

function resolveIntlTag(locale?: string | null): string {
  if (!locale) return INTL_LOCALE.es;
  const base = locale.slice(0, 2).toLowerCase() as LocaleKey;
  return INTL_LOCALE[base] || INTL_LOCALE.es;
}

export function formatDate(date: Date | string, locale?: string | null): string {
  return new Intl.DateTimeFormat(resolveIntlTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

const REL_TEMPLATES: Record<
  LocaleKey,
  {
    now: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
    weeks: (n: number) => string;
  }
> = {
  es: {
    now: "justo ahora",
    minutes: (n) => `hace ${n} min`,
    hours: (n) => `hace ${n} h`,
    days: (n) => `hace ${n} d`,
    weeks: (n) => `hace ${n} sem`,
  },
  pt: {
    now: "agora mesmo",
    minutes: (n) => `há ${n} min`,
    hours: (n) => `há ${n} h`,
    days: (n) => `há ${n} d`,
    weeks: (n) => `há ${n} sem`,
  },
  en: {
    now: "just now",
    minutes: (n) => `${n}m ago`,
    hours: (n) => `${n}h ago`,
    days: (n) => `${n}d ago`,
    weeks: (n) => `${n}w ago`,
  },
};

export function formatRelativeTime(
  date: Date | string,
  locale?: string | null
): string {
  const base = ((locale || "es").slice(0, 2).toLowerCase() as LocaleKey) || "es";
  const tpl = REL_TEMPLATES[base] || REL_TEMPLATES.es;

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return tpl.now;
  if (diffMinutes < 60) return tpl.minutes(diffMinutes);
  if (diffHours < 24) return tpl.hours(diffHours);
  if (diffDays < 7) return tpl.days(diffDays);
  if (diffDays < 30) return tpl.weeks(Math.floor(diffDays / 7));
  return formatDate(date, locale);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
