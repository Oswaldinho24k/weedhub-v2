const USERNAME_RE = /^[a-z0-9_]+$/;

const RESERVED = new Set([
  "admin", "weedhub", "weed", "hub", "support", "soporte",
  "moderator", "mod", "staff", "oficial", "official", "team",
  "api", "null", "undefined", "root", "sistema", "system",
  "help", "ayuda", "login", "logout", "auth", "register",
]);

export interface UsernameValidation {
  ok: boolean;
  value?: string;
  error?: string;
}

export function validateUsername(raw: string | undefined | null): UsernameValidation {
  if (!raw) return { ok: false, error: "El nombre de usuario es requerido" };
  const value = String(raw).trim().toLowerCase();
  if (value.length < 3) return { ok: false, error: "Mínimo 3 caracteres" };
  if (value.length > 20) return { ok: false, error: "Máximo 20 caracteres" };
  if (!USERNAME_RE.test(value)) {
    return { ok: false, error: "Solo letras minúsculas, números y guión bajo" };
  }
  if (value.startsWith("_")) {
    return { ok: false, error: "No puede comenzar con guión bajo" };
  }
  if (RESERVED.has(value)) {
    return { ok: false, error: "Ese nombre de usuario está reservado" };
  }
  return { ok: true, value };
}

export function slugifyToUsername(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}
