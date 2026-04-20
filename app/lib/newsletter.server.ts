import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const resend = getClient();

  if (!resend || !audienceId) {
    return {
      ok: false,
      error: "El boletín aún no está configurado. Intenta más tarde.",
    };
  }

  try {
    const { error } = await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });

    if (error) {
      // Resend returns a validation_error when the contact already exists.
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        return { ok: true, alreadySubscribed: true };
      }
      return { ok: false, error: error.message || "Error al suscribir" };
    }

    return { ok: true, alreadySubscribed: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error inesperado",
    };
  }
}
