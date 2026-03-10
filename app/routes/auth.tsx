import { useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/auth";
import { connectDB } from "~/lib/db.server";
import { hashPassword, verifyPassword, createUserSession, getUserFromSession } from "~/lib/auth.server";
import { UserModel } from "~/models/user.server";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";

import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Entrar — WeedHub",
    description: "Inicia sesión o crea tu cuenta en WeedHub para descubrir cepas, escribir reseñas y ganar insignias.",
    url: `${SITE_URL}/auth`,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  if (user) throw redirect("/strains");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const intent = String(formData.get("intent") || "login");
  const displayName = String(formData.get("displayName") || "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Correo electrónico inválido" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const existingUser = await UserModel.findOne({ email });

  if (intent === "login") {
    if (!existingUser) {
      return { error: "No existe una cuenta con este correo", needsRegister: true, email };
    }
    const valid = await verifyPassword(password, existingUser.passwordHash);
    if (!valid) {
      return { error: "Contraseña incorrecta" };
    }
    const cookie = await createUserSession(String(existingUser._id), request);
    return redirect(existingUser.onboardingCompleted ? "/strains" : "/onboarding", {
      headers: { "Set-Cookie": cookie },
    });
  }

  if (intent === "register") {
    if (existingUser) {
      return { error: "Ya existe una cuenta con este correo" };
    }
    if (!displayName || displayName.length < 2) {
      return { error: "El nombre debe tener al menos 2 caracteres" };
    }
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      email,
      passwordHash,
      displayName,
    });
    const cookie = await createUserSession(String(user._id), request);
    return redirect("/onboarding", {
      headers: { "Set-Cookie": cookie },
    });
  }

  return { error: "Acción no válida" };
}

export default function AuthPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [mode, setMode] = useState<"login" | "register">(
    actionData?.needsRegister ? "register" : "login"
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-white/10">
        <CardHeader>
          <div className="text-center mb-2">
            <span className="material-symbols-outlined text-primary text-4xl mb-2 block">
              potted_plant
            </span>
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === "login" ? "Bienvenido de vuelta" : "Crear cuenta"}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {mode === "login"
                ? "Inicia sesión para continuar"
                : "Únete a la comunidad cannábica"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value={mode} />

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                defaultValue={actionData?.email || ""}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre de usuario</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Tu nombre"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            )}

            {actionData?.error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {actionData.error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
              ) : mode === "login" ? (
                "Iniciar Sesión"
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </Form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-text-muted hover:text-primary transition-colors"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
