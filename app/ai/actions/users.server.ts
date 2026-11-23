import { defineAction } from "~/ai/registry.server";
import { listUsers, getUser, setUserRole, resetUserPoints, dashboardStats, USER_ROLES } from "~/services/users.server";

// Outputs never include email or passwordHash (the service never selects them).
const M = "usuarios";

defineAction({
  name: "dashboard_stats",
  module: "dashboard",
  risk: "read",
  description: `Números generales del admin: cepas (y archivadas), reseñas, usuarios, reseñas reportadas, top 5 países y fuentes de adquisición.
Úsala para "cómo vamos" en comunidad y usuarios. No incluye la revisión editorial: para eso usa review_stats.`,
  inputSchema: { type: "object", properties: {} },
  async execute() {
    return { success: true, data: await dashboardStats() };
  },
});

defineAction({
  name: "users_list",
  module: M,
  risk: "read",
  description: `Lista o busca usuarios (más recientes primero) por username parcial, país (MX, CO…) o rol. Devuelve rol, reseñas, puntos y badges.
Úsala antes de users_set_role o users_reset_points para confirmar el usuario. No devuelve correos.`,
  inputSchema: {
    type: "object",
    properties: {
      q: { type: "string", description: "Parte del username" },
      country: { type: "string", description: "Código de país de 2 letras" },
      role: { type: "string", enum: [...USER_ROLES] },
      limit: { type: "number", description: "Por defecto 20, máx 100" },
    },
  },
  async execute(i) {
    const r = await listUsers({ q: i.q as string, country: i.country as string, role: i.role as string, limit: Number(i.limit) || 20 });
    return { success: true, data: { users: r.users, matched: r.matched, total: r.total, adminCount: r.adminCount } };
  },
});

defineAction({
  name: "users_get",
  module: M,
  risk: "read",
  description: "Trae un usuario por id o username (rol, país, reseñas, puntos, badges, onboarding). No devuelve correo ni datos de acceso.",
  inputSchema: { type: "object", properties: { user: { type: "string", description: "Id o username" } }, required: ["user"] },
  async execute(i) {
    const u = await getUser(String(i.user));
    return u ? { success: true, data: u } : { success: false, error: "Usuario no encontrado" };
  },
});

defineAction({
  name: "users_set_role",
  module: M,
  risk: "destructive",
  description: `Cambia el rol de un usuario: "admin" da acceso al panel, "user" lo quita. No permite quitar al último admin.
Confirma antes el usuario con users_list o users_get.`,
  confirmLabel: (i) => `${i.role === "admin" ? "Hacer admin a" : "Quitar admin a"} ${i.user}`,
  inputSchema: {
    type: "object",
    properties: { user: { type: "string", description: "Id o username" }, role: { type: "string", enum: [...USER_ROLES] } },
    required: ["user", "role"],
  },
  async execute(i) {
    const r = await setUserRole(String(i.user), String(i.role));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});

defineAction({
  name: "users_reset_points",
  module: M,
  risk: "destructive",
  description: "Reinicia a 0 los puntos de un usuario y borra sus badges ganados. No toca sus reseñas ni su rol. No se puede deshacer.",
  confirmLabel: (i) => `Reiniciar puntos y badges de ${i.user}`,
  inputSchema: { type: "object", properties: { user: { type: "string", description: "Id o username" } }, required: ["user"] },
  async execute(i) {
    const r = await resetUserPoints(String(i.user));
    return r.ok ? { success: true, data: r } : { success: false, error: r.error };
  },
});
