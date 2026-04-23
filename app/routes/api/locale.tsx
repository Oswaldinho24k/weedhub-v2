import type { Route } from "./+types/locale";
import { isLocale } from "~/lib/i18n";
import { serializeLocale } from "~/lib/locale.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const raw = form.get("locale");
  if (!isLocale(raw)) {
    return new Response("Invalid locale", { status: 400 });
  }
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": await serializeLocale(raw) },
  });
}

export function loader() {
  return new Response(null, { status: 405 });
}
