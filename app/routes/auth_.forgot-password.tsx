import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/auth_.forgot-password";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { sendPasswordResetEmail } from "~/lib/email.server";
import { SITE_URL, buildMeta } from "~/lib/seo";
import { randomBytes } from "crypto";

export function meta() {
  return buildMeta({
    title: "Recuperar contraseña — WeedHub",
    description: "Restablece tu contraseña de WeedHub.",
    url: `${SITE_URL}/auth/forgot-password`,
  });
}

export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Correo electrónico inválido" };
  }

  const user = await UserModel.findOne({ email });

  // Always return success to avoid email enumeration
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.updateOne(
      { _id: user._id },
      { passwordResetToken: token, passwordResetExpires: expires }
    );

    const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`;
    void sendPasswordResetEmail(email, resetUrl);
  }

  return { success: true };
}

export default function ForgotPasswordPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="kicker mb-6">
          <Link to="/auth" className="hover:text-fg">← Volver a iniciar sesión</Link>
        </div>

        <h1 className="display text-3xl mb-3">Recuperar contraseña</h1>
        <p className="text-fg-muted mb-8">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {actionData && "success" in actionData ? (
          <div
            className="rounded-md px-4 py-5 text-sm leading-relaxed"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <p className="font-medium mb-1">Correo enviado</p>
            <p className="text-fg-muted">
              Si existe una cuenta con ese correo, recibirás un enlace en los próximos minutos. Revisa tu bandeja de spam.
            </p>
          </div>
        ) : (
          <Form method="post" className="space-y-5">
            <div>
              <div className="kicker mb-2">Correo electrónico</div>
              <input
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
                autoFocus
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
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
              {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}
