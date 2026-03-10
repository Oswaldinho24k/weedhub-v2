import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { getUserFromSession } from "~/lib/auth.server";
import { Navbar } from "~/components/layout/navbar";
import { Footer } from "~/components/layout/footer";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Noto+Sans:wght@300..700&display=swap",
    as: "style",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Noto+Sans:wght@300..700&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  return {
    user: user
      ? {
          _id: String(user._id),
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        }
      : null,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">
        <Outlet context={{ user }} />
      </main>
      <Footer />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  let message = "¡Ups!";
  let details = "Ocurrió un error inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = is404 ? "404 — Cepa no encontrada" : "Error";
    details = is404
      ? "Parece que esta página se fue en humo..."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
          {is404 ? "potted_plant" : "error"}
        </span>
        <h1 className="font-display text-4xl font-bold text-white mb-2">{message}</h1>
        <p className="text-text-muted mb-6">{details}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {is404 && (
            <a
              href="/strains"
              className="inline-flex items-center gap-2 bg-primary text-background-dark font-bold rounded-full px-6 py-3 hover:bg-primary/90 transition-colors"
            >
              Explorar Cepas
            </a>
          )}
          <a
            href="/"
            className={
              is404
                ? "inline-flex items-center gap-2 bg-white/10 text-white font-bold rounded-full px-6 py-3 hover:bg-white/20 transition-colors"
                : "inline-flex items-center gap-2 bg-primary text-background-dark font-bold rounded-full px-6 py-3 hover:bg-primary/90 transition-colors"
            }
          >
            Ir al inicio
          </a>
        </div>
        {stack && (
          <pre className="mt-6 w-full p-4 overflow-x-auto text-left text-xs bg-forest-deep rounded-xl text-text-muted">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
