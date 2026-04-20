import type { Route } from "./+types/theme";
import { serializeTheme, type Theme } from "~/lib/theme.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const raw = form.get("theme");
  const theme: Theme = raw === "light" ? "light" : "dark";
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": await serializeTheme(theme) },
  });
}

export function loader() {
  return new Response(null, { status: 405 });
}
