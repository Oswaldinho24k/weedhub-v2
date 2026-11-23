import { Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.users";
import { requireAdmin } from "~/lib/auth.server";
import { listUsers, setUserRole, resetUserPoints } from "~/services/users.server";
import { countryFlag, countryLabel } from "~/constants/locations";
import { formatDate, cn } from "~/lib/utils";
import { Icon } from "~/components/ui/icon";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const search = new URL(request.url).searchParams.get("q") || "";
  const { users, total, adminCount } = await listUsers({ q: search, limit: 100 });
  return { users, total, adminCount, search };
}

// HTTP adapter only: all logic lives in services/users.server.ts (same functions the AI agent uses).
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const userId = String(formData.get("userId"));

  if (intent === "set-role") {
    const role = String(formData.get("role"));
    const r = await setUserRole(userId, role);
    if (!r.ok) return { error: r.error };
    return { success: true, message: `@${r.username} ahora es ${r.role === "admin" ? "administrador" : "usuario"}` };
  }

  if (intent === "reset-points") {
    const r = await resetUserPoints(userId);
    if (!r.ok) return { error: r.error };
    return { success: true, message: `Puntos y badges de @${r.username} reiniciados` };
  }

  return { error: "Acción no válida" };
}

export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  const { users, total, adminCount, search } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [query, setQuery] = useState(search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="display text-2xl">Usuarios ({total.toLocaleString("es-MX")})</h2>
          <p className="text-sm text-fg-dim mt-1">{adminCount} admins</p>
        </div>
        <form method="get" className="flex gap-2">
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por username…"
            className="admin-input !w-56"
          />
          <Button type="submit" variant="ghost">
            <Icon name="search" size={14} />
          </Button>
        </form>
      </div>

      {actionData && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{
            background: "error" in actionData ? "var(--warm-soft)" : "var(--accent-soft)",
            color: "error" in actionData ? "var(--warm)" : "var(--fg)",
          }}
        >
          {"error" in actionData ? actionData.error : actionData.message}
        </div>
      )}

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <p className="p-5 text-sm text-fg-dim">Sin resultados.</p>
        ) : (
          users.map((user, i) => (
            <UserRow
              key={user._id}
              user={user}
              busy={busy}
              border={i < users.length - 1}
            />
          ))
        )}
      </div>

      <style>{`
        .admin-input {
          display: block;
          width: 100%;
          height: 2.75rem;
          background: var(--bg-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 0 0.875rem;
          font-size: 0.875rem;
          color: var(--fg);
        }
        .admin-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 20%, transparent);
        }
      `}</style>
    </div>
  );
}

function UserRow({
  user,
  busy,
  border,
}: {
  user: {
    _id: string;
    username: string;
    anonymousHandle: string;
    country: string;
    role: string;
    reviewCount: number;
    joinedAt?: string;
    badges: number;
    onboardingCompleted: boolean;
  };
  busy: boolean;
  border: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const isAdmin = user.role === "admin";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-4 flex-wrap",
        border ? "border-b border-line" : ""
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="h-9 w-9 rounded-full grid place-items-center text-sm font-medium shrink-0"
          style={{ background: "var(--bg-elev)", color: "var(--accent)" }}
        >
          {user.username[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">@{user.username}</span>
            {isAdmin && <span className="pill accent">Admin</span>}
            {!user.onboardingCompleted && (
              <span className="pill warm text-xs">Sin onboarding</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-fg-dim flex-wrap">
            <span>
              {countryFlag(user.country)} {countryLabel(user.country)}
            </span>
            <span>{user.reviewCount} reseñas</span>
            {user.badges > 0 && <span>{user.badges} badges</span>}
            {user.joinedAt && <span>desde {formatDate(new Date(user.joinedAt))}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          onClick={() => setShowActions((v) => !v)}
          variant="ghost"
          size="sm"
        >
          <Icon name="settings" size={13} />
          {showActions ? "Cerrar" : "Acciones"}
        </Button>

        {showActions && (
          <div className="flex gap-2 flex-wrap">
            <Form method="post">
              <input type="hidden" name="userId" value={user._id} />
              <input type="hidden" name="intent" value="set-role" />
              <input
                type="hidden"
                name="role"
                value={isAdmin ? "user" : "admin"}
              />
              <Button
                type="submit"
                disabled={busy}
                variant={isAdmin ? "warm" : "ghost"}
                size="sm"
              >
                {isAdmin ? "Quitar admin" : "Hacer admin"}
              </Button>
            </Form>

            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm(`¿Reiniciar puntos y badges de @${user.username}?`))
                  e.preventDefault();
              }}
            >
              <input type="hidden" name="userId" value={user._id} />
              <input type="hidden" name="intent" value="reset-points" />
              <Button type="submit" disabled={busy} variant="ghost" size="sm" className="text-fg-muted">
                Reset puntos
              </Button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
