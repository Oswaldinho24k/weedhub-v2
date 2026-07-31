import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/auth_.reset-password";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { hashPassword, createUserSession } from "~/lib/auth.server";
import { SITE_URL, buildMeta } from "~/lib/seo";
import { useState } from "react";
import { Icon } from "~/components/ui/icon";

export function meta() {
  return buildMeta({
    title: "Nueva contraseña — WeedHub",
    description: "Establece una nueva contraseña para tu cuenta de WeedHub.",
    url: `${SITE_URL}/auth/reset-password`,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { valid: false as const, token: "" };
  }

  await connectDB();
  const user = await UserModel.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select("_id");

  return { valid: !!user, token };
}

export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const formData = await request.formData();
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden" };
  }

  const user = await UserModel.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return { error: "El enlace expiró o no es válido. Solicita uno nuevo." };
  }

  const passwordHash = await hashPassword(password);
  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash },
      $unset: { passwordResetToken: "", passwordResetExpires: "" },
    }
  );

  const cookie = await createUserSession(String(user._id), request);
  return redirect("/strains", { headers: { "Set-Cookie": cookie } });
}

export default function ResetPasswordPage({ loaderData }: Route.ComponentProps) {
  const { valid, token } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPw, setShowPw] = useState(false);

  if (!valid) {
    return (
      <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-16">
        <div className="w-full max-w-[400px] text-center">
          <div
            className="h-12 w-12 mx-auto rounded-full grid place-items-center mb-4"
            style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
          >
            <Icon name="alert" size={22} />
          </div>
          <h1 className="display text-2xl mb-3">Enlace no válido</h1>
          <p className="text-fg-muted mb-6">
            Este enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.
          </p>
          <Link to="/auth/forgot-password" className="btn btn-primary">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="kicker mb-6">
          <Link to="/auth" className="hover:text-fg">← Volver a iniciar sesión</Link>
        </div>

        <h1 className="display text-3xl mb-3">Nueva contraseña</h1>
        <p className="text-fg-muted mb-8">Elige una contraseña segura para tu cuenta.</p>

        <Form method="post" className="space-y-5">
          <input type="hidden" name="token" value={token} />

          <div>
            <div className="kicker mb-2">Nueva contraseña</div>
            <div className="flex items-center gap-3 rounded-md border border-line bg-raised px-3.5 h-11 focus-within:border-accent transition-[border-color]">
              <Icon name="lock" size={16} className="text-fg-dim" />
              <input
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
                autoComplete="new-password"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-fg-dim hover:text-fg"
              >
                <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          </div>

          <div>
            <div className="kicker mb-2">Confirmar contraseña</div>
            <div className="flex items-center gap-3 rounded-md border border-line bg-raised px-3.5 h-11 focus-within:border-accent transition-[border-color]">
              <Icon name="lock" size={16} className="text-fg-dim" />
              <input
                name="confirm"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {actionData?.error && (
            <div
              className="rounded-md px-4 py-3 text-sm"
              style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
            >
              {actionData.error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </Form>
      </div>
    </div>
  );
}
