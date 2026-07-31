import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/comunidad_.nuevo";
import { connectDB } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { PostModel, type PostCategory } from "~/models/post.server";
import { StrainModel } from "~/models/strain.server";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "experiencias", label: "Experiencias" },
  { value: "cepas", label: "Cepas" },
  { value: "cultivo", label: "Cultivo" },
  { value: "legal", label: "Legal" },
  { value: "comunidad", label: "Comunidad" },
];

function toSlug(title: string, suffix: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) +
    "-" +
    suffix
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  await connectDB();
  const strains = await StrainModel.find({})
    .sort({ name: 1 })
    .limit(300)
    .lean()
    .select("name slug");
  return {
    user: { _id: String(user._id), username: user.username, anonymousHandle: user.anonymousHandle },
    strains: strains.map((s) => ({ slug: s.slug, name: s.name })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();

  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const body = String(form.get("body") || "").trim();
  const category = String(form.get("category") || "") as PostCategory;
  const strainSlug = String(form.get("strainSlug") || "").trim();
  const publishedAs = String(form.get("publishedAs") || "username") as "username" | "anonymous";

  if (!title || !body || !category) {
    return { error: "Título, cuerpo y categoría son requeridos" };
  }
  if (title.length > 200) {
    return { error: "El título no puede superar 200 caracteres" };
  }

  const suffix = Date.now().toString(36);
  const slug = toSlug(title, suffix);

  let strainId: string | undefined;
  if (strainSlug) {
    const strain = await StrainModel.findOne({ slug: strainSlug }).lean().select("_id");
    if (strain) strainId = String(strain._id);
  }

  const post = await PostModel.create({
    userId: user._id,
    title,
    body,
    slug,
    category,
    strainId,
    publishedAs,
  });

  return redirect(`/comunidad/${post.slug}`);
}

export default function NuevoPostPage() {
  const { user, strains } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <div className="flex items-center gap-2 text-sm text-fg-dim mb-8">
        <Link to="/" className="hover:text-fg transition-colors">Inicio</Link>
        <span>›</span>
        <Link to="/comunidad" className="hover:text-fg transition-colors">Comunidad</Link>
        <span>›</span>
        <span className="text-fg">Nuevo post</span>
      </div>

      <div className="kicker mb-2">Comunidad</div>
      <h1 className="display text-3xl mb-8">Crear post</h1>

      {actionData && "error" in actionData && (
        <div
          className="px-4 py-3 rounded-lg mb-6 text-sm"
          style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
        >
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6">
        <div>
          <label className="label">Título *</label>
          <input
            name="title"
            required
            maxLength={200}
            className="input w-full"
            placeholder="¿Qué quieres compartir con la comunidad?"
          />
        </div>

        <div>
          <label className="label">Cuerpo *</label>
          <textarea
            name="body"
            required
            rows={10}
            className="input w-full !h-auto py-3"
            placeholder="Cuéntalo con detalle. La comunidad agradece el contexto."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Categoría *</label>
            <select name="category" required className="input w-full">
              <option value="">Elige una categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cepa relacionada (opcional)</label>
            <select name="strainSlug" className="input w-full">
              <option value="">Sin cepa</option>
              {strains.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Identidad */}
        <div className="card p-5">
          <div className="kicker mb-3">¿Cómo quieres publicar?</div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="publishedAs"
                value="username"
                defaultChecked
                className="accent-[color:var(--accent)]"
              />
              <div>
                <div className="text-sm font-medium">@{user.username}</div>
                <div className="text-xs text-fg-dim">Tu perfil público</div>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="publishedAs"
                value="anonymous"
                className="accent-[color:var(--accent)]"
              />
              <div>
                <div className="text-sm font-medium">{user.anonymousHandle}</div>
                <div className="text-xs text-fg-dim">Seudónimo anónimo</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Publicando..." : "Publicar post"}
          </button>
          <Link to="/comunidad" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  );
}
