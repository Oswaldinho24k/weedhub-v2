import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth.server";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Admin — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return null;
}

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/strains", label: "Cepas", icon: "potted_plant" },
  { to: "/admin/reviews", label: "Reseñas", icon: "rate_review" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
        Administración
      </h1>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-background-dark"
                  : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
