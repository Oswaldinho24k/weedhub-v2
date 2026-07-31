import { useEffect, useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/auth";
import { connectDB } from "~/lib/db.server";
import { hashPassword, verifyPassword, createUserSession, getUserFromSession } from "~/lib/auth.server";
import { UserModel } from "~/models/user.server";
import { validateUsername } from "~/lib/username";
import { isUsernameAvailable } from "~/lib/username.server";
import { generateAnonymousHandle } from "~/lib/anon-handle.server";
import { LATIN_COUNTRIES, isValidCountry } from "~/constants/locations";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { cn } from "~/lib/utils";
import { buildMeta, SITE_URL } from "~/lib/seo";
import { sendWelcomeEmail } from "~/lib/email.server";

export function meta() {
  return buildMeta({
    title: "Entrar o registrarse — WeedHub",
    description:
      "Inicia sesión o crea tu cuenta en WeedHub. Publica reseñas con contexto, con handle real o anónimo.",
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

    const usernameCheck = validateUsername(String(formData.get("username") || ""));
    if (!usernameCheck.ok) {
      return { error: usernameCheck.error || "Username inválido" };
    }
    const available = await isUsernameAvailable(usernameCheck.value!);
    if (!available) {
      return { error: "Ese username ya está tomado" };
    }

    const country = String(formData.get("country") || "MX").toUpperCase();
    if (!isValidCountry(country)) {
      return { error: "País inválido" };
    }

    const anonymousHandle = await generateAnonymousHandle();
    const locale = parseLocale(request.headers.get("Accept-Language"));

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      email,
      passwordHash,
      username: usernameCheck.value!,
      anonymousHandle,
      publishAsAnonymous: true,
      country,
      locale,
      displayName: usernameCheck.value!,
    });
    const cookie = await createUserSession(String(user._id), request);
    // Fire-and-forget — don't block registration if email fails
    void sendWelcomeEmail(email, usernameCheck.value!);
    return redirect("/onboarding", {
      headers: { "Set-Cookie": cookie },
    });
  }

  return { error: "Acción no válida" };
}

function parseLocale(header: string | null): string {
  if (!header) return "es-MX";
  const first = header.split(",")[0].trim().split(";")[0].trim();
  return first || "es-MX";
}

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

export default function AuthPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    actionData?.needsRegister || searchParams.get("mode") === "register" ? "register" : "login"
  );
  const oauthError = searchParams.get("error");
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const t = useT();

  useEffect(() => {
    if (actionData?.needsRegister) setMode("register");
  }, [actionData]);

  const pwScore = passwordStrength(password);
  const usernameValidation = username ? validateUsername(username) : null;

  return (
    <div className="min-h-[calc(100vh-56px)] grid grid-cols-1 md:grid-cols-2">
      <aside className="bg-sunken border-b md:border-b-0 md:border-r border-line px-8 py-12 md:px-14 md:py-16 flex flex-col">
        <div className="kicker mb-6">Manifiesto #003</div>
        <h1
          className="display max-w-[16ch]"
          style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 0.95 }}
        >
          La planta / merece mejor /{" "}
          <span className="display-wonk" style={{ color: "var(--accent)" }}>
            contexto
          </span>
          .
        </h1>
        <p className="mt-8 text-fg-muted leading-relaxed max-w-[42ch]">
          {t.auth.createAccountBody}
        </p>

        <ul className="mt-10 space-y-4 text-sm">
          <Promise>Elige tu username · publica anónimo por default.</Promise>
          <Promise>Datos reales sobre la experiencia, no barras de colores.</Promise>
          <Promise>Voces en español, desde CDMX hasta Madrid.</Promise>
        </ul>

        <div className="mt-auto pt-16 grid grid-cols-3 gap-6 max-w-[420px]">
          <div>
            <div className="display text-3xl tnum">847</div>
            <div className="kicker mt-1">{t.nav.directory}</div>
          </div>
          <div>
            <div className="display text-3xl tnum">12K</div>
            <div className="kicker mt-1">{t.common.reviewsWord}</div>
          </div>
          <div>
            <div className="display text-3xl tnum">23</div>
            <div className="kicker mt-1">{t.auth.countryLabel}</div>
          </div>
        </div>
      </aside>

      <div className="px-8 py-12 md:px-14 md:py-16 flex flex-col justify-center">
        <div className="max-w-[420px] w-full mx-auto">
          <div className="flex gap-6 border-b border-line mb-8">
            <TabButton active={mode === "login"} onClick={() => setMode("login")}>
              {t.auth.loginTab}
            </TabButton>
            <TabButton active={mode === "register"} onClick={() => setMode("register")}>
              {t.auth.registerTab}
            </TabButton>
          </div>

          <h2 className="display text-3xl mb-2">
            {mode === "login" ? t.auth.welcomeBack : t.auth.createAccount}
          </h2>
          <p className="text-fg-muted mb-8">
            {mode === "login" ? t.auth.welcomeBackBody : t.auth.createAccountBody}
          </p>

          <Form method="post" className="space-y-5">
            <input type="hidden" name="intent" value={mode} />

            {mode === "register" && (
              <div>
                <Field label={t.auth.usernameLabel} icon="user">
                  <input
                    name="username"
                    type="text"
                    placeholder={t.auth.usernamePlaceholder}
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    autoComplete="username"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>
                <p className="mt-2 text-xs" style={{
                  color: usernameValidation?.ok === false
                    ? "var(--warm)"
                    : "var(--fg-dim)",
                }}>
                  {usernameValidation?.ok === false
                    ? usernameValidation.error
                    : t.auth.usernameHint}
                </p>
              </div>
            )}

            <Field label={t.auth.emailLabel} icon="mail">
              <input
                name="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                required
                defaultValue={actionData?.email || ""}
                autoComplete="email"
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>

            <div>
              <Field
                label={t.auth.passwordLabel}
                icon="lock"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-fg-dim hover:text-fg"
                    aria-label={showPw ? t.auth.hidePassword : t.auth.showPassword}
                  >
                    <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
                  </button>
                }
              >
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </Field>
              {mode === "register" && password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        background:
                          i < pwScore
                            ? pwScore >= 3
                              ? "var(--accent)"
                              : "var(--warm)"
                            : "var(--line)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {mode === "register" && (
              <div>
                <div className="kicker mb-2">{t.auth.countryLabel}</div>
                <select
                  name="country"
                  defaultValue="MX"
                  className="w-full h-11 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
                  required
                >
                  {LATIN_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    className="accent-[color:var(--accent)]"
                  />
                  {t.auth.rememberMe}
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-fg-muted hover:text-fg"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-3 pt-1">
                <label className="inline-flex items-start gap-2 text-sm text-fg-muted cursor-pointer">
                  <input type="checkbox" required className="mt-1 accent-[color:var(--accent)]" />
                  <span>{t.auth.eighteenPlus}</span>
                </label>
                <label className="inline-flex items-start gap-2 text-sm text-fg-muted cursor-pointer">
                  <input type="checkbox" required className="mt-1 accent-[color:var(--accent)]" />
                  <span>
                    {t.auth.acceptTermsTemplate
                      .split(/\{terms\}|\{privacy\}/)
                      .map((part: string, i: number) => (
                        <span key={i}>
                          {part}
                          {i === 0 && (
                            <Link to="/terminos" className="text-accent underline">
                              {t.auth.termsLink}
                            </Link>
                          )}
                          {i === 1 && (
                            <Link to="/privacidad" className="text-accent underline">
                              {t.auth.privacyLink}
                            </Link>
                          )}
                        </span>
                      ))}
                  </span>
                </label>
              </div>
            )}

            {actionData?.error && (
              <div className="rounded-md px-4 py-3 text-sm" style={{ background: "var(--warm-soft)", color: "var(--warm)" }}>
                {actionData.error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting
                ? t.auth.submitting
                : mode === "login"
                  ? t.auth.submitLogin
                  : t.auth.submitRegister}
              <Icon name="arrowRight" size={14} />
            </button>
          </Form>

          {oauthError && (
            <div
              className="rounded-md px-4 py-3 text-sm mb-4"
              style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
            >
              {oauthError === "email_not_verified"
                ? "Tu cuenta de Google no tiene el correo verificado."
                : "Ocurrió un error con el inicio de sesión social. Inténtalo de nuevo."}
            </div>
          )}

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-line" />
            <span className="kicker">{t.auth.oauthDivider}</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href="/auth/google" className="btn btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </a>
            <button
              type="button"
              className="btn btn-ghost opacity-50 cursor-not-allowed"
              title="Próximamente"
              disabled
            >
              Apple
            </button>
          </div>

          <p className="text-xs text-fg-dim text-center mt-8">
            <Link to="/" className="hover:text-fg underline underline-offset-2">
              ← {t.common.backToHome}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative pb-3 text-sm",
        active ? "text-fg" : "text-fg-muted hover:text-fg"
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent"
        />
      )}
    </button>
  );
}

function Field({
  label,
  icon,
  trailing,
  children,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="kicker mb-2">{label}</div>
      <div className="flex items-center gap-3 rounded-md border border-line bg-raised px-3.5 h-11 focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_20%,transparent)] transition-[border-color,box-shadow]">
        {icon && <Icon name={icon} size={16} className="text-fg-dim" />}
        <div className="flex-1">{children}</div>
        {trailing}
      </div>
    </div>
  );
}

function Promise({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-fg-muted">
      <span
        className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Icon name="check" size={14} />
      </span>
      <span>{children}</span>
    </li>
  );
}
