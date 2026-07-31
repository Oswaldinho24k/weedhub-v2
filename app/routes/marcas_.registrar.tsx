import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/marcas_.registrar";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { LATIN_COUNTRIES } from "~/constants/locations";
import { Icon } from "~/components/ui/icon";

export function meta() {
  return [{ title: "Registra tu marca — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const country = String(form.get("country") || "MX").toUpperCase();
  const city = String(form.get("city") || "").trim();
  const description = String(form.get("description") || "").trim();
  const logo = String(form.get("logo") || "").trim();
  const coverImage = String(form.get("coverImage") || "").trim();
  const website = String(form.get("website") || "").trim();
  const instagram = String(form.get("instagram") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();

  if (!name) return { error: "El nombre de la marca es requerido" };
  if (name.length < 2) return { error: "El nombre debe tener al menos 2 caracteres" };

  let slug = toSlug(name);
  if (!slug) return { error: "Nombre de marca inválido" };

  // Check uniqueness, append counter if needed
  const existing = await BrandModel.findOne({ slug }).lean();
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  await BrandModel.create({
    name,
    slug,
    country,
    city: city || undefined,
    description: description || undefined,
    logo: logo || undefined,
    coverImage: coverImage || undefined,
    website: website || undefined,
    instagram: instagram ? instagram.replace("@", "") : undefined,
    email: email || undefined,
    status: "active",
    tier: "free",
    isVerified: false,
    ownerId: user._id,
  });

  return redirect(`/marcas/${slug}?registrada=1`);
}

export default function MarcasRegistrarPage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <div className="mb-8">
        <Link
          to="/marcas"
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <Icon name="arrowLeft" size={14} />
          Volver al directorio
        </Link>
        <div className="kicker mt-5 mb-1">Directorio de Marcas</div>
        <h1 className="display text-4xl mb-2">Registra tu marca</h1>
        <p className="text-fg-muted">
          Crea tu perfil en el directorio cannábico más completo en español. Gratis para empezar,
          activa tu verificación cuando estés listo.
        </p>
      </div>

      <Form method="post" className="space-y-6">
        {/* Info básica */}
        <section className="card p-6 space-y-5">
          <h2 className="display text-xl">Información básica</h2>

          <div>
            <label className="kicker block mb-2" htmlFor="name">
              Nombre de la marca *
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              placeholder="Ej. Verde Premium"
              className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="kicker block mb-2" htmlFor="country">
                País
              </label>
              <select
                id="country"
                name="country"
                defaultValue="MX"
                className="w-full h-11 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
              >
                {LATIN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="kicker block mb-2" htmlFor="city">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                maxLength={60}
                placeholder="CDMX"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="kicker block mb-2" htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={600}
              placeholder="Cuéntale a la comunidad qué hace especial a tu marca..."
              className="w-full rounded-md border border-line bg-raised px-3.5 py-3 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </section>

        {/* Links */}
        <section className="card p-6 space-y-5">
          <h2 className="display text-xl">Contacto y redes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="kicker block mb-2" htmlFor="website">
                Sitio web
              </label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://tumarca.com"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="kicker block mb-2" htmlFor="instagram">
                Instagram
              </label>
              <input
                id="instagram"
                name="instagram"
                placeholder="@tumarca"
                maxLength={60}
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="kicker block mb-2" htmlFor="email">
              Email de contacto
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="hola@tumarca.com"
              className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-fg-dim mt-1">
              Usado para notificaciones de tu cuenta. No se muestra públicamente.
            </p>
          </div>
        </section>

        {/* Imágenes */}
        <section className="card p-6 space-y-5">
          <h2 className="display text-xl">Imágenes</h2>
          <p className="text-xs text-fg-dim -mt-2">
            Sube tus imágenes a Cloudinary, Imgur u otro host y pega la URL aquí.
          </p>

          <div>
            <label className="kicker block mb-2" htmlFor="logo">
              Logo (URL)
            </label>
            <input
              id="logo"
              name="logo"
              type="url"
              placeholder="https://..."
              className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="kicker block mb-2" htmlFor="coverImage">
              Imagen de portada (URL)
            </label>
            <input
              id="coverImage"
              name="coverImage"
              type="url"
              placeholder="https://..."
              className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </section>

        {actionData?.error && (
          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
          >
            {actionData.error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creando perfil..." : "Crear mi perfil de marca →"}
          </button>
          <Link to="/marcas" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>

        <p className="text-xs text-fg-dim">
          Al crear tu perfil aceptas que tu marca aparezca en el directorio público de WeedHub.
          Puedes activar tu verificación desde el perfil una vez creado.
        </p>
      </Form>
    </div>
  );
}
