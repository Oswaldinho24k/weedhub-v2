import { Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.users";
import { connectDB } from "~/lib/db.server";
import { requireAdmin } from "~/lib/auth.server";
import { UserModel } from "~/models/user.server";
import { countryFlag, countryLabel } from "~/constants/locations";
import { formatDate, cn } from "~/lib/utils";
import { Icon } from "~/components/ui/icon";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";

  const filter: Record<string, unknown> = {};
  if (search) filter.username = { $regex: search, $options: "i" };

  const [users, total, adminCount] = await Promise.all([
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .select("username anonymousHandle country role stats earnedBadges onboardingCompleted createdAt")
      .lean(),
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: "admin" }),
  ]);

  return {
    users: users.map((u) => ({
      _id: String(u._id),
      username: u.username,
      anonymousHandle: u.anonymousHandle,
      country: u.country,
      role: u.role,
      reviewCount: u.stats?.reviewCount ?? 0,
      joinedAt: u.stats?.joinedAt?.toISOString() ?? u.createdAt?.toISOString(),
      badges: u.earnedBadges?.length ?? 0,
      onboardingCompleted: u.onboardingCompleted,
    })),
    total,
    adminCount,
    search,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  await connectDB();

  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const userId = String(formData.get("userId"));

  if (intent === "set-role") {
    const role = String(formData.get("role")) as "user" | "admin";
    const user = await UserModel.findByIdAndUpdate(userId, { role }, { new: true }).select("username role");
    if (!user) return { error: "Usuario no encontrado" };
    return { success: true, message: `@${user.username} ahora es ${role === "admin" ? "administrador" : "usuario"}` };
  }

  if (intent === "reset-points") {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { points: 0, earnedBadges: [] },
      { new: true }
    ).select("username");
    if (!user) return { error: "Usuario no encontrado" };
    return { success: true, message: `Puntos y badges de @${user.username} reiniciados` };
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
          <button type="submit" className="btn btn-ghost">
            <Icon name="search" size={14} />
          </button>
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
        <button
          type="button"
          onClick={() => setShowActions((v) => !v)}
          className="btn btn-ghost text-xs"
        >
          <Icon name="settings" size={13} />
          {showActions ? "Cerrar" : "Acciones"}
        </button>

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
              <button
                type="submit"
                disabled={busy}
                className={cn("btn text-xs", isAdmin ? "btn-warm" : "btn-ghost")}
              >
                {isAdmin ? "Quitar admin" : "Hacer admin"}
              </button>
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
              <button type="submit" disabled={busy} className="btn btn-ghost text-xs text-fg-muted">
                Reset puntos
              </button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
