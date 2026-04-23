import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import { getUserFromSession } from "~/lib/auth.server";
import { getTheme, type Theme } from "~/lib/theme.server";
import { resolveLocale } from "~/lib/locale.server";
import { LOCALE_META, type Locale } from "~/lib/i18n";
import { getDictionary } from "~/content/locales";
import { LocaleProvider } from "~/lib/i18n-context";
import { Navbar } from "~/components/layout/navbar";
import { Footer } from "~/components/layout/footer";
import { MinimalNav } from "~/components/layout/minimal-nav";
import { ToastProvider } from "~/components/ui/toast";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,30..100,0..1;1,9..144,300..900,30..100,0..1&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/brand.svg" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
  { rel: "apple-touch-icon", href: "/brand.svg" },
  { rel: "mask-icon", href: "/brand.svg", color: "oklch(76% 0.17 145)" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [user, theme, locale] = await Promise.all([
    getUserFromSession(request),
    getTheme(request),
    resolveLocale(request),
  ]);
  return {
    user: user
      ? {
          _id: String(user._id),
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar,
          role: user.role,
        }
      : null,
    theme,
    locale,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  let theme: Theme = "dark";
  let locale: Locale = "es";
  try {
    const data = useLoaderData<typeof loader>();
    if (data?.theme) theme = data.theme;
    if (data?.locale) locale = data.locale;
  } catch {
    // Loader not available (error boundary at root).
  }
  const htmlLang = LOCALE_META[locale].htmlLang;

  return (
    <html lang={htmlLang} className={theme === "light" ? "light" : ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          content={theme === "light" ? "oklch(96% 0.012 95)" : "oklch(16% 0.025 150)"}
        />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const MINIMAL_NAV_PREFIXES = ["/auth", "/onboarding"];
const MINIMAL_NAV_SUFFIXES = ["/review"];

function useNavKind(pathname: string): "top" | "minimal" | "none" {
  if (pathname === "/logout") return "none";
  if (MINIMAL_NAV_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "minimal";
  }
  if (MINIMAL_NAV_SUFFIXES.some((s) => pathname.endsWith(s))) return "minimal";
  return "top";
}

export default function App() {
  const { user, theme, locale } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const kind = useNavKind(pathname);
  const showFooter = kind === "top" && !pathname.startsWith("/admin");
  const dict = getDictionary(locale);

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <ToastProvider>
        {kind === "top" && <Navbar user={user} theme={theme} />}
        {kind === "minimal" && <MinimalNav theme={theme} />}
        <main className="flex-1">
          <Outlet context={{ user, theme, locale }} />
        </main>
        {showFooter && <Footer />}
      </ToastProvider>
    </LocaleProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  // Best-effort locale detection from URL — loader may not have run.
  let errLocale: Locale = "es";
  try {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(pt|en)(\/|$)/);
      if (match) errLocale = match[1] as Locale;
    }
  } catch {}
  const dict = getDictionary(errLocale);

  let message = dict.errors.genericTitle;
  let details = dict.errors.genericBody;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = is404 ? dict.errors.notFoundTitle : "Error";
    details = is404 ? dict.errors.notFoundBody : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="display text-5xl mb-3" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
          {message}
        </h1>
        <p className="text-fg-muted mb-8">{details}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {is404 && (
            <a href={errLocale === "es" ? "/strains" : `/${errLocale}/strains`} className="btn btn-primary">
              {dict.errors.goToStrains}
            </a>
          )}
          <a
            href={errLocale === "es" ? "/" : `/${errLocale}`}
            className={is404 ? "btn btn-ghost" : "btn btn-primary"}
          >
            {dict.errors.goHome}
          </a>
        </div>
        {stack && (
          <pre className="mt-6 w-full p-4 overflow-x-auto text-left text-xs card text-fg-muted">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
