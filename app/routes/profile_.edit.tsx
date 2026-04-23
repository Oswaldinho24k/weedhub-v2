import { useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/profile_.edit";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { UploadError, uploadImage, validateImage } from "~/lib/cloudinary.server";
import { MAX_IMAGE_MB } from "~/lib/upload-config";
import { EFFECTS } from "~/constants/cannabis";
import {
  LATIN_COUNTRIES,
  isValidCountry,
  ACQUISITION_SOURCES,
  isValidAcquisitionSource,
} from "~/constants/locations";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";

export function meta() {
  return [{ title: "Editar perfil — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return {
    user: {
      username: user.username,
      anonymousHandle: user.anonymousHandle,
      publishAsAnonymous: user.publishAsAnonymous !== false,
      displayName: user.displayName || "",
      avatar: user.avatar || "",
      country: user.country || "MX",
      city: user.city || "",
      showCityPublicly: !!user.showCityPublicly,
      birthYear: user.birthYear,
      acquisitionSource: user.acquisitionSource,
      preferredEffects: user.cannabisProfile?.preferredEffects || [],
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
  const publishAsAnonymous = formData.get("publishAsAnonymous") === "on";

  const country = String(formData.get("country") || "MX").toUpperCase();
  if (!isValidCountry(country)) {
    return { error: "País inválido" };
  }

  const city = String(formData.get("city") || "").trim();
  const showCityPublicly = formData.get("showCityPublicly") === "on";

  const birthYearRaw = String(formData.get("birthYear") || "").trim();
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : undefined;
  const validBirthYear =
    birthYear && birthYear >= 1900 && birthYear <= new Date().getFullYear() - 18
      ? birthYear
      : undefined;

  const acquisitionRaw = String(formData.get("acquisitionSource") || "").trim();
  const acquisitionSource = isValidAcquisitionSource(acquisitionRaw)
    ? acquisitionRaw
    : undefined;

  const update: Record<string, unknown> = {
    displayName: displayName || user.username,
    "cannabisProfile.preferredEffects": preferredEffects,
    publishAsAnonymous,
    country,
    city: city || null,
    showCityPublicly,
    birthYear: validBirthYear ?? null,
    acquisitionSource: acquisitionSource ?? null,
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
  const t = useT();
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
          {t.profileEdit.backToProfile}
        </Link>
        <div className="kicker mt-4 mb-1">{t.profileEdit.editKicker}</div>
        <h1 className="display text-4xl">{t.profileEdit.editTitle}</h1>
      </div>

      <Form method="post" encType="multipart/form-data" className="space-y-8">
        {/* Privacidad */}
        <section className="card p-6">
          <h2 className="display text-xl mb-1">{t.profileEdit.privacyTitle}</h2>
          <p className="text-xs text-fg-dim mb-5">{t.profileEdit.privacyIntro}</p>

          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 mb-5 text-sm">
            <span className="kicker">{t.profileEdit.yourUsername}</span>
            <span className="font-medium">@{user.username}</span>
            <span className="kicker">{t.profileEdit.yourAnonHandle}</span>
            <span className="mono text-fg-muted">{user.anonymousHandle}</span>
          </div>

          <label className="inline-flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="publishAsAnonymous"
              defaultChecked={user.publishAsAnonymous}
              className="mt-1 accent-[color:var(--accent)]"
            />
            <span className="flex-1">
              <span className="block text-sm text-fg">{t.profileEdit.publishAnonToggle}</span>
              <span className="block text-xs text-fg-dim mt-1">{t.profileEdit.publishAnonHelp}</span>
            </span>
          </label>
        </section>

        {/* Avatar */}
        <section className="card p-6">
          <h2 className="display text-xl mb-5">{t.profileEdit.avatarTitle}</h2>
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
                {t.profileEdit.avatarUpload}
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
                {t.profileEdit.avatarRules.replace("{max}", String(MAX_IMAGE_MB))}
              </p>
              {currentUrl && (
                <label className="inline-flex items-center gap-2 mt-4 text-xs text-fg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    name="removeAvatar"
                    className="accent-[color:var(--warm)]"
                  />
                  {t.profileEdit.avatarRemove}
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Información básica */}
        <section className="card p-6">
          <h2 className="display text-xl mb-5">{t.profileEdit.basicTitle}</h2>
          <div>
            <label className="kicker block mb-2" htmlFor="displayName">
              {t.profileEdit.displayNameLabel}
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={user.displayName}
              placeholder={user.username}
              maxLength={40}
              className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-fg-dim mt-2">{t.profileEdit.displayNameHelp}</p>
          </div>
        </section>

        {/* Ubicación */}
        <section className="card p-6">
          <h2 className="display text-xl mb-5">{t.profileEdit.locationTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="kicker block mb-2" htmlFor="country">
                {t.profileEdit.countryLabel}
              </label>
              <select
                id="country"
                name="country"
                defaultValue={user.country}
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
                {t.profileEdit.cityLabel}
              </label>
              <input
                id="city"
                name="city"
                defaultValue={user.city}
                placeholder="CDMX"
                maxLength={60}
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <label className="inline-flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              name="showCityPublicly"
              defaultChecked={user.showCityPublicly}
              className="mt-1 accent-[color:var(--accent)]"
            />
            <span className="text-sm text-fg-muted">{t.profileEdit.showCityToggle}</span>
          </label>
        </section>

        {/* Datos opcionales privados */}
        <section className="card p-6">
          <h2 className="display text-xl mb-1">{t.profileEdit.optionalTitle}</h2>
          <p className="text-xs text-fg-dim mb-5">{t.profileEdit.optionalIntro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="kicker block mb-2" htmlFor="birthYear">
                {t.profileEdit.birthYearLabel}
              </label>
              <input
                id="birthYear"
                name="birthYear"
                type="number"
                min={1900}
                max={new Date().getFullYear() - 18}
                defaultValue={user.birthYear || ""}
                placeholder="1995"
                className="w-full h-11 rounded-md border border-line bg-raised px-3.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label
                className="kicker block mb-2"
                htmlFor="acquisitionSource"
              >
                {t.profileEdit.acquisitionLabel}
              </label>
              <select
                id="acquisitionSource"
                name="acquisitionSource"
                defaultValue={user.acquisitionSource || ""}
                className="w-full h-11 rounded-md border border-line bg-raised px-3 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">—</option>
                {ACQUISITION_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Efectos preferidos */}
        <section className="card p-6">
          <h2 className="display text-xl mb-5">{t.profileEdit.effectsTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {EFFECTS.map((effect) => {
              const checked = user.preferredEffects.includes(effect);
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
            {isSubmitting ? t.common.saving : t.common.save}
          </button>
          <Link to="/profile" className="btn btn-ghost">
            {t.common.cancel}
          </Link>
        </div>
      </Form>
    </div>
  );
}
