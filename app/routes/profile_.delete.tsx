import { redirect } from "react-router";
import type { Route } from "./+types/profile_.delete";
import { requireUser } from "~/lib/auth.server";
import { getSession, destroySession } from "~/sessions.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { SavedStrainModel } from "~/models/saved-strain.server";

export function meta() {
  return [{ title: "Eliminar cuenta — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const confirm = String(formData.get("confirm") || "");

  if (confirm !== "ELIMINAR") {
    return { error: "Escribe ELIMINAR para confirmar." };
  }

  await connectDB();

  await Promise.all([
    ReviewModel.updateMany(
      { userId: user._id },
      { $set: { status: "deleted", comment: "[cuenta eliminada]", userId: null } }
    ),
    SavedStrainModel.deleteMany({ userId: user._id }),
    UserModel.findByIdAndDelete(user._id),
  ]);

  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export default function DeleteAccountPage({ actionData }: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-[480px] px-6 py-16">
      <div className="kicker mb-2" style={{ color: "var(--warm)" }}>Zona peligrosa</div>
      <h1 className="display text-3xl mb-4">Eliminar mi cuenta</h1>
      <p className="text-fg-muted mb-8 leading-relaxed">
        Esta acción es irreversible. Tu cuenta, historial de sesión y preferencias serán eliminados.
        Tus reseñas quedarán anonimizadas (no se borran, forman parte del historial comunitario).
      </p>

      <div className="card p-6 border" style={{ borderColor: "var(--warm)" }}>
        <form method="post" className="flex flex-col gap-4">
          <div>
            <label className="kicker block mb-2 text-xs" htmlFor="confirm">
              Escribe <strong>ELIMINAR</strong> para confirmar
            </label>
            <input
              id="confirm"
              name="confirm"
              type="text"
              placeholder="ELIMINAR"
              autoComplete="off"
              required
              className="w-full h-10 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none"
              style={{ borderColor: "var(--warm)" }}
            />
          </div>

          {actionData?.error && (
            <p className="text-sm" style={{ color: "var(--warm)" }}>
              {actionData.error}
            </p>
          )}

          <button
            type="submit"
            className="btn w-full"
            style={{
              background: "var(--warm)",
              color: "oklch(20% 0.04 55)",
              border: "none",
            }}
          >
            Eliminar mi cuenta definitivamente
          </button>
        </form>
      </div>

      <p className="mt-6 text-center">
        <a href="/profile/edit" className="text-sm text-fg-muted hover:text-fg">
          Cancelar, volver a mi perfil
        </a>
      </p>
    </div>
  );
}
