import { z } from "zod";
import type { Route } from "./+types/newsletter";
import { subscribeEmail } from "~/lib/newsletter.server";

const schema = z.object({
  email: z.string().email("Correo no válido"),
});

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const parsed = schema.safeParse({ email: String(form.get("email") || "") });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || "Correo no válido",
    };
  }

  const result = await subscribeEmail(parsed.data.email.toLowerCase());
  if (!result.ok) return result;

  return {
    ok: true as const,
    alreadySubscribed: result.alreadySubscribed,
  };
}

export function loader() {
  return new Response(null, { status: 405 });
}
