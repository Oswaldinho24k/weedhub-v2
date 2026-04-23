import type { Route } from "./+types/strain-search";
import { connectDB } from "~/lib/db.server";
import {
  findStrainByNameOrAlias,
  fuzzyStrainSuggestions,
} from "~/lib/strain-search.server";
import { StrainSubmissionModel } from "~/models/strain-submission.server";
import { normalizeStrainSlug } from "~/lib/strain-name";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return Response.json({ exact: null, fuzzy: [], pendingSubmission: null });
  }

  await connectDB();
  const [exact, fuzzy] = await Promise.all([
    findStrainByNameOrAlias(q),
    fuzzyStrainSuggestions(q),
  ]);

  // Pending submission match (same normalized name, not yet resolved).
  let pendingSubmission: { name: string; status: string } | null = null;
  if (!exact) {
    const pending = await StrainSubmissionModel.findOne({
      normalizedName: normalizeStrainSlug(q),
      status: { $in: ["pending", "approved"] },
    })
      .select("name status")
      .lean();
    if (pending) {
      pendingSubmission = { name: pending.name, status: pending.status };
    }
  }

  return Response.json({
    exact: exact
      ? {
          name: exact.strain.name,
          slug: exact.strain.slug,
          aliases: exact.strain.aliases || [],
          matchedBy: exact.matchedBy,
          matchedAlias: exact.matchedAlias || null,
        }
      : null,
    fuzzy: fuzzy.map((f) => ({
      name: f.strain.name,
      slug: f.strain.slug,
      distance: f.distance,
    })),
    pendingSubmission,
  });
}

export function action() {
  return new Response(null, { status: 405 });
}
