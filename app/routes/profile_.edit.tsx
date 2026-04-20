import { useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/profile_.edit";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { UploadError, uploadImage, validateImage } from "~/lib/cloudinary.server";
import { MAX_IMAGE_MB } from "~/lib/upload-config";
import { EFFECTS } from "~/constants/cannabis";
import { Icon } from "~/components/ui/icon";

export function meta() {
  return [{ title: "Editar perfil — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return {
    user: {
      displayName: user.displayName,
      avatar: user.avatar || "",
      cannabisProfile: user.cannabisProfile,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  await connectDB();
  const formData = await request.formData();

  const displayName = String(formData.get("displayName") || "").trim();
  const preferredEffects = formData.getAll("preferredEffects").map(String);
  const removeAvatar = formData.get("removeAvatar") === "on";

  if (!displayName || displayName.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres" };
  }

  const update: Record<string, unknown> = {
    displayName,
    "cannabisProfile.preferredEffects": preferredEffects,
  };

  const avatarFile = formData.get("avatarFile");
  try {
    if (avatarFile instanceof File && validateImage(avatarFile)) {
      const url = await uploadImage(avatarFile, {
        folder: "weedhub/avatars",
        transformation: "c_fill,w_400,h_400,q_auto,g_auto",
      });
      update.avatar = url;
    } else if (removeAvatar) {
      update.avatar = null;
    }
  } catch (err) {
    if (err instanceof UploadError) {
      return { error: err.message };
    }
    throw err;
  }

  await UserModel.findByIdAndUpdate(user._id, update);
  return redirect("/profile");
}

export default function EditProfilePage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const currentUrl = user.avatar || null;
  const shownUrl = previewUrl || currentUrl;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <div className="mb-8">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <Icon name="arrowLeft" size={14} />
          Volver al perfil
        </Link>
        <div className="kicker mt-4 mb-1">Edición</div>
        <h1 className="display text-4xl">Editar perfil</h1>
      </div>

      <Form method="post" encType="multipart/form-data" className="space-y-8">
        <section className="card p-6">
          <h2 className="display text-xl mb-5">Avatar</h2>
          <div className="flex items-center gap-6">
            <div
              className="h-20 w-20 rounded-full bg-elev border border-line overflow-hidden grid place-items-center"
              aria-hidden
            >
              {shownUrl ? (
                <img
                  src={shownUrl}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon name="user" size={22} className="text-fg-dim" />
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor="avatarFile"
                className="btn btn-ghost !py-2 !px-3 text-xs inline-flex cursor-pointer"
              >
                <Icon name="camera" size={14} />
                Subir imagen
              </label>
              <input
                id="avatarFile"
                name="avatarFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onFile}
              />
              <p className="kicker mt-3">
                JPG, PNG, WEBP o GIF · máx {MAX_IMAGE_MB} MB
              </p>
              {currentUrl && (
                <label className="inline-flex items-center gap-2 mt-4 text-xs text-fg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    name="removeAvatar"
                    className="accent-[color:var(--warm)]"
                  />
                  Eliminar avatar actual
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="display text-xl mb-5">Información básica</h2>
          <div>
            <label className="kicker block mb-2" htmlFor="displayName">
              Nombre
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={user.displayName}
              required
              minLength={2}
              className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="display text-xl mb-5">Efectos preferidos</h2>
          <div className="flex flex-wrap gap-2">
            {EFFECTS.map((effect) => {
              const checked =
                user.cannabisProfile?.preferredEffects?.includes(effect);
              return (
                <label
                  key={effect}
                  className="chip cursor-pointer has-[:checked]:bg-accent has-[:checked]:text-accent-ink has-[:checked]:border-accent"
                >
                  <input
                    type="checkbox"
                    name="preferredEffects"
                    value={effect}
                    defaultChecked={checked}
                    className="sr-only"
                  />
                  {effect}
                </label>
              );
            })}
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
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link to="/profile" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  );
}
