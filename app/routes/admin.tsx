import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth.server";
import { Icon, type IconName } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Admin — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return null;
}

const NAV_ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: "settings", end: true },
  { to: "/admin/strains", label: "Cepas", icon: "leaf" },
  { to: "/admin/reviews", label: "Reseñas", icon: "edit" },
  { to: "/admin/submissions", label: "Sugerencias", icon: "plus" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-8">
        <div className="kicker mb-1">Panel de administración</div>
        <h1 className="display text-4xl flex items-center gap-3">
          <Icon name="crown" size={28} className="text-accent" />
          Administración
        </h1>
      </div>

      <nav className="flex gap-2 mb-10 border-b border-line">
        {NAV_ITEMS.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== "/admin";
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 text-sm relative transition-colors",
                isActive ? "text-fg" : "text-fg-muted hover:text-fg"
              )}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
