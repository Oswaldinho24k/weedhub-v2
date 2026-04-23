import { StrainModel, type IStrain } from "~/models/strain.server";
import { levenshtein, normalizeStrainSlug } from "~/lib/strain-name";

export interface StrainMatch {
  strain: IStrain;
  matchedBy: "slug" | "alias" | "fuzzy";
  matchedAlias?: string;
  distance?: number;
}

/**
 * Resolve user input to an existing strain, checking main slug first, then
 * alias slugs. Returns exact match or null.
 */
export async function findStrainByNameOrAlias(
  input: string
): Promise<StrainMatch | null> {
  const slug = normalizeStrainSlug(input);
  if (!slug || slug.length < 2) return null;

  const exact = await StrainModel.findOne({
    isArchived: false,
    $or: [{ slug }, { aliasSlugs: slug }],
  }).lean<IStrain>();
  if (!exact) return null;

  if (exact.slug === slug) {
    return { strain: exact, matchedBy: "slug" };
  }
  const matchedAlias = (exact.aliases || []).find(
    (a) => normalizeStrainSlug(a) === slug
  );
  return { strain: exact, matchedBy: "alias", matchedAlias };
}

/**
 * Fuzzy suggestions for "did you mean?" — Levenshtein distance <= 2 against
 * all strain slugs and alias slugs. Bounded, fast for our catalog size
 * (low hundreds). If the catalog grows past ~5k we should index with a
 * proper search engine.
 */
export async function fuzzyStrainSuggestions(
  input: string,
  limit = 3
): Promise<Array<{ strain: Pick<IStrain, "name" | "slug" | "aliases">; distance: number }>> {
  const q = normalizeStrainSlug(input);
  if (q.length < 3) return [];

  const all = await StrainModel.find({ isArchived: false })
    .select("name slug aliases aliasSlugs")
    .lean<Pick<IStrain, "name" | "slug" | "aliases" | "aliasSlugs">[]>();

  const scored: Array<{
    strain: Pick<IStrain, "name" | "slug" | "aliases">;
    distance: number;
  }> = [];

  for (const s of all) {
    let best = Infinity;
    const candidates = [s.slug, ...(s.aliasSlugs || [])];
    for (const c of candidates) {
      const d = levenshtein(q, c);
      if (d < best) best = d;
    }
    if (best <= 2 && best > 0) {
      scored.push({
        strain: { name: s.name, slug: s.slug, aliases: s.aliases },
        distance: best,
      });
    }
  }

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, limit);
}
