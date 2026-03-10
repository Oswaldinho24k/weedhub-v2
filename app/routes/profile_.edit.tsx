import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/profile_.edit";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { UserModel } from "~/models/user.server";
import { EFFECTS, CONSUMPTION_METHODS } from "~/constants/cannabis";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Editar Perfil — WeedHub" }];
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
  const avatar = String(formData.get("avatar") || "").trim();

  if (!displayName || displayName.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres" };
  }

  const preferredEffects = formData.getAll("preferredEffects").map(String);
  const preferredMethods = formData.getAll("preferredMethods").map(String);

  await UserModel.findByIdAndUpdate(user._id, {
    displayName,
    avatar: avatar || undefined,
    "cannabisProfile.preferredEffects": preferredEffects,
    "cannabisProfile.preferredMethods": preferredMethods,
  });

  return redirect("/profile");
}

export default function EditProfilePage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white mb-6">Editar Perfil</h1>

      <Form method="post">
        <div className="space-y-6">
          <Card className="border-white/10">
            <CardHeader>
              <h3 className="font-display font-bold text-white">Información básica</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={user.displayName}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">URL del avatar</Label>
                <Input
                  id="avatar"
                  name="avatar"
                  type="url"
                  defaultValue={user.avatar}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <h3 className="font-display font-bold text-white">Efectos preferidos</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {EFFECTS.map((effect) => {
                  const checked = user.cannabisProfile?.preferredEffects?.includes(effect);
                  return (
                    <label
                      key={effect}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all",
                        "has-[:checked]:bg-primary has-[:checked]:text-background-dark",
                        "bg-white/5 text-white hover:bg-white/10"
                      )}
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
            </CardContent>
          </Card>

          {actionData?.error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {actionData.error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="ghost" type="button" onClick={() => window.history.back()}>
              Cancelar
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
