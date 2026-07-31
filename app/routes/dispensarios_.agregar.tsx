import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/dispensarios_.agregar";
import { connectDB } from "~/lib/db.server";
import { DispensaryModel } from "~/models/dispensary.server";
import { sendDispensarySubmissionEmail } from "~/lib/email.server";

const COUNTRIES = [
  { code: "MX", name: "México" },
  { code: "CO", name: "Colombia" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "US", name: "Estados Unidos" },
  { code: "CA", name: "Canadá" },
];

export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const form = await request.formData();

  const name = String(form.get("name") || "").trim();
  const address = String(form.get("address") || "").trim();
  const city = String(form.get("city") || "").trim();
  const state = String(form.get("state") || "").trim();
  const country = String(form.get("country") || "MX").toUpperCase();
  const phone = String(form.get("phone") || "").trim();
  const website = String(form.get("website") || "").trim();
  const description = String(form.get("description") || "").trim();
  const contactEmail = String(form.get("contactEmail") || "").trim();
  const instagram = String(form.get("instagram") || "").trim();

  if (!name || !address || !city) {
    return { error: "Nombre, dirección y ciudad son requeridos" };
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "Correo de contacto inválido" };
  }

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const existing = await DispensaryModel.findOne({ slug });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const dispensary = await DispensaryModel.create({
    name,
    slug: finalSlug,
    address,
    city,
    state: state || undefined,
    country,
    phone: phone || undefined,
    website: website || undefined,
    instagram: instagram || undefined,
    description: description || undefined,
    status: "pending",
    tier: "free",
  });

  sendDispensarySubmissionEmail({
    name,
    city,
    country,
    address,
    contactEmail,
    slug: finalSlug,
  });

  return { success: true, slug: finalSlug };
}

export default function AgregarDispensarioPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (actionData && "success" in actionData) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6"
          style={{ background: "var(--accent-soft)" }}
        >
          📍
        </div>
        <h1 className="display text-2xl mb-3">¡Solicitud enviada!</h1>
        <p className="text-fg-muted mb-8">
          Revisaremos tu dispensario en los próximos días hábiles. Una vez verificado, aparecerá en el directorio.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/dispensarios" className="btn btn-ghost">
            Ver directorio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12">
      <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>›</span>
        <Link to="/dispensarios" className="hover:text-fg transition-colors">Dispensarios</Link>
        <span>›</span>
        <span className="text-fg">Agregar</span>
      </div>

      <div className="kicker mb-2">Registro gratuito</div>
      <h1 className="display text-3xl mb-3">Agregar mi dispensario</h1>
      <p className="text-fg-muted mb-8">
        Registra tu punto de venta para que la comunidad te encuentre. Revisamos cada solicitud antes de publicar.
      </p>

      {actionData && "error" in actionData && (
        <div
          className="px-4 py-3 rounded-lg mb-6 text-sm"
          style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
        >
          {actionData.error}
        </div>
      )}

      <Form method="post" className="card p-6 space-y-5">
        <div>
          <label className="label">Nombre del dispensario *</label>
          <input name="name" required className="input w-full" placeholder="Ej. Green House CDMX" />
        </div>

        <div>
          <label className="label">Dirección *</label>
          <input
            name="address"
            required
            className="input w-full"
            placeholder="Calle, número, colonia"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ciudad *</label>
            <input name="city" required className="input w-full" placeholder="Ciudad de México" />
          </div>
          <div>
            <label className="label">Estado / Provincia</label>
            <input name="state" className="input w-full" placeholder="CDMX" />
          </div>
        </div>

        <div>
          <label className="label">País</label>
          <select name="country" defaultValue="MX" className="input w-full">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-line" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Teléfono</label>
            <input name="phone" type="tel" className="input w-full" placeholder="+52 55 1234 5678" />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input name="instagram" className="input w-full" placeholder="@mitienda" />
          </div>
        </div>

        <div>
          <label className="label">Sitio web</label>
          <input name="website" type="url" className="input w-full" placeholder="https://..." />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea
            name="description"
            rows={3}
            className="input w-full !h-auto py-3"
            placeholder="Cuéntale a la comunidad qué hace especial a tu dispensario..."
          />
        </div>

        <div>
          <label className="label">Tu correo de contacto</label>
          <input
            name="contactEmail"
            type="email"
            className="input w-full"
            placeholder="para que te avisemos cuando esté publicado"
          />
        </div>

        <div className="pt-2">
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
          <p className="text-xs text-fg-dim text-center mt-3">
            Tu dispensario quedará en estado pendiente hasta que lo verifiquemos.
          </p>
        </div>
      </Form>
    </div>
  );
}
