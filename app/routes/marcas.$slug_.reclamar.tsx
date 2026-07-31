import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/marcas.$slug_.reclamar";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { sendClaimNotificationEmail } from "~/lib/email.server";

export async function loader({ params }: Route.LoaderArgs) {
  await connectDB();
  const brand = await BrandModel.findOne({ slug: params.slug, status: "active" })
    .lean()
    .select("name slug isVerified");
  if (!brand) throw new Response("Not Found", { status: 404 });

  return {
    brand: {
      name: brand.name,
      slug: brand.slug,
      isVerified: brand.isVerified,
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await connectDB();
  const brand = await BrandModel.findOne({ slug: params.slug }).lean().select("name slug email");
  if (!brand) throw new Response("Not Found", { status: 404 });

  const form = await request.formData();
  const contactName = String(form.get("contactName") || "").trim();
  const contactEmail = String(form.get("contactEmail") || "").trim();
  const cargo = String(form.get("cargo") || "").trim();
  const mensaje = String(form.get("mensaje") || "").trim();

  if (!contactName || !contactEmail || !mensaje) {
    return { error: "Nombre, correo y mensaje son requeridos" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "Correo inválido" };
  }

  await sendClaimNotificationEmail({
    brandName: brand.name,
    brandSlug: brand.slug,
    contactName,
    contactEmail,
    cargo,
    mensaje,
  });

  return { success: true };
}

export default function ReclamarPage() {
  const { brand } = useLoaderData<typeof loader>();
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
          ✓
        </div>
        <h1 className="display text-2xl mb-3">Solicitud enviada</h1>
        <p className="text-fg-muted mb-8">
          Recibimos tu solicitud para reclamar <strong>{brand.name}</strong>. Nos pondremos en contacto contigo en los próximos días hábiles.
        </p>
        <Link to={`/marcas/${brand.slug}`} className="btn btn-ghost">
          ← Volver al perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] px-6 py-12">
      <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>›</span>
        <Link to="/marcas" className="hover:text-fg transition-colors">Marcas</Link>
        <span>›</span>
        <Link to={`/marcas/${brand.slug}`} className="hover:text-fg transition-colors">
          {brand.name}
        </Link>
        <span>›</span>
        <span className="text-fg">Reclamar</span>
      </div>

      <div className="kicker mb-2">Reclamación de perfil</div>
      <h1 className="display text-3xl mb-3">Reclamar {brand.name}</h1>
      <p className="text-fg-muted mb-8">
        Cuéntanos quién eres y por qué tienes derecho a administrar este perfil. Revisamos cada solicitud manualmente.
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tu nombre *</label>
            <input name="contactName" required className="input w-full" placeholder="Nombre completo" />
          </div>
          <div>
            <label className="label">Cargo</label>
            <input name="cargo" className="input w-full" placeholder="Fundador, Director, etc." />
          </div>
        </div>

        <div>
          <label className="label">Correo de contacto *</label>
          <input
            name="contactEmail"
            type="email"
            required
            className="input w-full"
            placeholder="tu@empresa.com"
          />
        </div>

        <div>
          <label className="label">Mensaje *</label>
          <textarea
            name="mensaje"
            required
            rows={5}
            className="input w-full !h-auto py-3"
            placeholder="Explica brevemente tu relación con la marca y cómo podemos verificar tu identidad..."
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
          <Link
            to={`/marcas/${brand.slug}`}
            className="block text-center text-sm text-fg-dim hover:text-fg mt-3 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  );
}
