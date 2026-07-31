import { Resend } from "resend";
import { SITE_URL } from "~/lib/seo";

let client: Resend | null = null;

function getClient() {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

const FROM = "WeedHub <hola@weedhub.info>";

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const firstReviewUrl = `${SITE_URL}/strains`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bienvenido a WeedHub</title>
</head>
<body style="margin:0;padding:0;background:#0f1a14;font-family:'Instrument Sans',Arial,sans-serif;color:#e8f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1a14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#141f18;border-radius:16px;border:1px solid #253028;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #253028;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;color:#6b9e7a;text-transform:uppercase;font-weight:600;">WeedHub</p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;line-height:1.2;color:#e8f0eb;">
                Bienvenido, @${username}.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 40px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a8c4b0;">
                Ya eres parte de la primera enciclopedia de cannabis construida por y para la comunidad hispana. Aquí, cada reseña cuenta con contexto real: método, momento, setting.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a8c4b0;">
                Así funciona WeedHub:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:24px;height:24px;background:#2a5c3a;border-radius:6px;text-align:center;line-height:24px;font-size:12px;color:#6dbf85;">1</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e8f0eb;">Explora el directorio</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#a8c4b0;line-height:1.5;">870+ cepas con perfiles completos: terpenos, efectos, calificaciones de la comunidad.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:24px;height:24px;background:#2a5c3a;border-radius:6px;text-align:center;line-height:24px;font-size:12px;color:#6dbf85;">2</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e8f0eb;">Escribe tu primera reseña</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#a8c4b0;line-height:1.5;">Comparte tu experiencia con método, momento y efectos. Tu perspectiva ayuda a toda la comunidad.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 8px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:24px;height:24px;background:#2a5c3a;border-radius:6px;text-align:center;line-height:24px;font-size:12px;color:#6dbf85;">3</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e8f0eb;">Gana puntos y badges</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#a8c4b0;line-height:1.5;">Cada reseña te da puntos. Sube de nivel y desbloquea tu historial cannábico.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px;">
              <a
                href="${firstReviewUrl}"
                style="display:inline-block;background:#4a9e64;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:10px;letter-spacing:0.01em;"
              >
                Explorar cepas →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #253028;">
              <p style="margin:0;font-size:12px;color:#4a6654;line-height:1.5;">
                Recibes este correo porque creaste una cuenta en
                <a href="${SITE_URL}" style="color:#6b9e7a;text-decoration:none;">weedhub.info</a>.
                Solo para mayores de 18 años. Uso responsable.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Bienvenido a WeedHub, @${username}`,
      html,
    });
  } catch {
    // Non-fatal — registration proceeds even if email fails
  }
}
