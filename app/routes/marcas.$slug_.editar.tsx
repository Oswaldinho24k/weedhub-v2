import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/marcas.$slug_.editar";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { BrandModel } from "~/models/brand.server";
import { LATIN_COUNTRIES } from "~/constants/locations";
import { Icon } from "~/components/ui/icon";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Editar ${data?.brand?.name || "marca"} — WeedHub` }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  await connectDB();

  const brand = await BrandModel.findOne({ slug: params.slug }).lean();
  if (!brand) throw new Response("Not Found", { status: 404 });

  const isOwner = brand.ownerId && brand.ownerId.equals(user._id);
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) throw new Response("Forbidden", { status: 403 });

  return {
    brand: {
      _id: String(brand._id),
      name: brand.name,
      slug: brand.slug,
      country: brand.country,
      city: brand.city || "",
      description: brand.description || brand.descriptions?.es || "",
      logo: brand.logo || "",
      coverImage: brand.coverImage || "",
      website: brand.website || "",
      instagram: brand.instagram || "",
      tiktok: brand.tiktok || "",
      email: brand.email || "",
    },
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const brand = await BrandModel.findOne({ slug: params.slug });
  if (!brand) throw new Response("Not Found", { status: 404 });

  const isOwner = brand.ownerId && brand.ownerId.equals(user._id);
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) throw new Response("Forbidden", { status: 403 });

  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const country = String(form.get("country") || "MX").toUpperCase();
  const city = String(form.get("city") || "").trim();
  const description = String(form.get("description") || "").trim();
  const logo = String(form.get("logo") || "").trim();
  const coverImage = String(form.get("coverImage") || "").trim();
  const website = String(form.get("website") || "").trim();
  const instagram = String(form.get("instagram") || "").trim();
  const tiktok = String(form.get("tiktok") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();

  if (!name) return { error: "El nombre es requerido" };

  await BrandModel.findByIdAndUpdate(brand._id, {
    name,
    country,
    city: city || undefined,
    description: description || undefined,
    logo: logo || undefined,
    coverImage: coverImage || undefined,
    website: website || undefined,
    instagram: instagram ? instagram.replace("@", "") : undefined,
    tiktok: tiktok || undefined,
    email: email || undefined,
  });

  return redirect(`/marcas/${params.slug}`);
}

export default function EditarMarcaPage({ loaderData }: Route.ComponentProps) {
  const { brand } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <div className="mb-8">
        <Link
          to={`/marcas/${brand.slug}`}
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <Icon name="arrowLeft" size={14} />
          Volver al perfil
        </Link>
        <div className="kicker mt-5 mb-1">Gestión de marca</div>
        <h1 className="display text-4xl">Editar {brand.name}</h1>
      </div>

      <Form method="post" className="space-y-6">
        <section className="card p-6 space-y-5">
          <h2 className="display text-xl">Información básica</h2>

          <div>
            <label className="kicker block mb-2" htmlFor="name">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              defaultValue={brand.name}
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
                defaultValue={brand.country}
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
                defaultValue={brand.city}
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
              rows={4}
              maxLength={600}
              defaultValue={brand.description}
              className="w-full rounded-md border border-line bg-raised px-3.5 py-3 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </section>

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
                defaultValue={brand.website}
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
                defaultValue={brand.instagram}
                placeholder="@tumarca"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="kicker block mb-2" htmlFor="tiktok">
                TikTok
              </label>
              <input
                id="tiktok"
                name="tiktok"
                defaultValue={brand.tiktok}
                placeholder="@tumarca"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="kicker block mb-2" htmlFor="email">
                Email de contacto
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={brand.email}
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </section>

        <section className="card p-6 space-y-5">
          <h2 className="display text-xl">Imágenes</h2>
          <p className="text-xs text-fg-dim -mt-2">URLs de imágenes alojadas externamente.</p>

          <div>
            <label className="kicker block mb-2" htmlFor="logo">
              Logo (URL)
            </label>
            <input
              id="logo"
              name="logo"
              type="url"
              defaultValue={brand.logo}
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
              defaultValue={brand.coverImage}
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
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link to={`/marcas/${brand.slug}`} className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  );
}
