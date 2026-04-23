import { Link } from "react-router";
import type { Route } from "./+types/profile_.saved";
import { requireUser } from "~/lib/auth.server";
import { connectDB } from "~/lib/db.server";
import { SavedStrainModel } from "~/models/saved-strain.server";
import { StrainCard } from "~/components/composite/strain-card";
import { Icon } from "~/components/ui/icon";
import { useT } from "~/lib/i18n-context";
import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta() {
  return buildMeta({
    title: "Cepas guardadas — WeedHub",
    description: "Tu biblioteca de cepas guardadas en WeedHub.",
    url: `${SITE_URL}/profile/saved`,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  await connectDB();

  const saved = await SavedStrainModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate("strainId")
    .lean();

  const strains = saved
    .map((s) => s.strainId as any)
    .filter((s) => s && !s.isArchived)
    .map((s) => ({
      ...s,
      _id: String(s._id),
      createdAt: s.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: s.updatedAt?.toISOString?.() || new Date().toISOString(),
    }));

  return { strains };
}

export default function SavedStrainsPage({ loaderData }: Route.ComponentProps) {
  const { strains } = loaderData;
  const t = useT();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-10">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <Icon name="arrowLeft" size={14} />
          {t.profileEdit.backToProfile}
        </Link>
        <div className="kicker mt-6 mb-1">{t.profile.libraryKicker}</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.02 }}
        >
          {t.profile.savedTitle}
        </h1>
        <p className="text-fg-muted mt-4">
          {strains.length}{" "}
          {strains.length === 1 ? t.profile.savedSingular : t.profile.savedPlural}.
        </p>
      </div>

      {strains.length === 0 ? (
        <div className="card p-14 text-center">
          <div
            className="h-14 w-14 mx-auto mb-5 rounded-full grid place-items-center"
            style={{ background: "var(--bg-elev)", color: "var(--fg-muted)" }}
          >
            <Icon name="bookmark" size={22} />
          </div>
          <h2 className="display text-2xl mb-2">{t.profile.savedEmptyTitle}</h2>
          <p className="text-fg-muted mb-6 max-w-[42ch] mx-auto">
            {t.profile.savedEmptyBody}
          </p>
          <Link to="/strains" className="btn btn-primary inline-flex">
            {t.profile.savedEmptyCta}
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strains.map((strain: any) => (
            <StrainCard key={strain._id} strain={strain} />
          ))}
        </div>
      )}
    </div>
  );
}
