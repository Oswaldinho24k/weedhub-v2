import type { Route } from "./+types/ai.find-strain";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  const { effects = [], experienceLevel = "regular", method = "any", condition } = body;

  await connectDB();

  // Pre-filter: find strains matching selected effects or condition
  const filter: any = { isArchived: false };
  if (effects.length > 0) filter.effects = { $in: effects };
  if (condition) filter.helpsWithConditions = condition;

  // For beginners, prefer lower THC strains
  const sort: any = { "averageRatings.overall": -1, reviewCount: -1 };

  const candidates = await StrainModel.find(filter)
    .sort(sort)
    .limit(40)
    .select("name slug type effects flavors cannabinoidProfile averageRatings reviewCount description descriptionEs")
    .lean();

  // Fallback: if no matches, use top-rated strains
  const pool =
    candidates.length >= 5
      ? candidates
      : await StrainModel.find({ isArchived: false })
          .sort(sort)
          .limit(40)
          .select("name slug type effects flavors cannabinoidProfile averageRatings reviewCount description descriptionEs")
          .lean();

  const c = getClient();
  if (!c) {
    // No API key — return top 3 by rating as fallback
    const fallback = pool.slice(0, 3);
    return Response.json({
      recommendations: fallback.map((s) => ({
        strain: serializeStrain(s),
        reason: s.descriptionEs || s.description || "",
      })),
    });
  }

  const candidateList = pool.map((s) => ({
    slug: s.slug,
    name: s.name,
    type: s.type,
    thc: s.cannabinoidProfile?.thc?.max ?? 0,
    effects: (s.effects || []).slice(0, 4),
    flavors: (s.flavors || []).slice(0, 3),
    rating: s.averageRatings?.overall ?? 0,
    reviews: s.reviewCount ?? 0,
  }));

  const userProfile = {
    efectosBuscados: effects,
    experiencia: experienceLevel,
    metodoConsumo: method,
    ...(condition ? { condicion: condition } : {}),
  };

  const prompt = [
    "Eres un sommelier cannábico experto.",
    "Dado el perfil del usuario y la lista de cepas candidatas, recomienda las 3 MEJORES cepas.",
    "Responde SOLO con JSON válido, sin texto extra.",
    "",
    "Perfil del usuario:",
    JSON.stringify(userProfile),
    "",
    "Cepas candidatas (elige 3):",
    JSON.stringify(candidateList),
    "",
    'Responde con: {"recommendations": [{"slug": "...", "reason": "Explicación de 1-2 oraciones en español de por qué esta cepa le conviene a este usuario."}, ...]}',
    "",
    "Notas:",
    "- Para principiantes: prefiere THC ≤ 18% y efectos suaves",
    "- Para condiciones médicas: prioriza cepas que ayudan con esa condición",
    "- Varía los tipos (sativa/indica/hybrid) para dar opciones",
    "- El 'reason' debe mencionar algo específico del perfil del usuario",
  ].join("\n");

  try {
    const resp = await c.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = resp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");

    const parsed = JSON.parse(match[0]);
    const recs: { slug: string; reason: string }[] = parsed.recommendations || [];

    // Fetch full strain data for recommended slugs
    const slugs = recs.map((r) => r.slug);
    const strains = await StrainModel.find({ slug: { $in: slugs }, isArchived: false }).lean();
    const strainBySlug = Object.fromEntries(strains.map((s) => [s.slug, s]));

    const results = recs
      .map((rec) => {
        const strain = strainBySlug[rec.slug];
        if (!strain) return null;
        return { strain: serializeStrain(strain), reason: rec.reason };
      })
      .filter(Boolean);

    return Response.json({ recommendations: results });
  } catch (err) {
    console.error("[find-strain] AI error:", err);
    const fallback = pool.slice(0, 3);
    return Response.json({
      recommendations: fallback.map((s) => ({
        strain: serializeStrain(s),
        reason: s.descriptionEs || s.description || "",
      })),
    });
  }
}

function serializeStrain(s: any) {
  return {
    _id: String(s._id),
    name: s.name,
    slug: s.slug,
    type: s.type,
    typeBlend: s.typeBlend,
    lineage: s.lineage,
    description: s.description,
    descriptionEs: s.descriptionEs,
    cannabinoidProfile: s.cannabinoidProfile,
    effects: s.effects,
    flavors: s.flavors,
    dominantTerpene: s.dominantTerpene,
    averageRatings: s.averageRatings,
    reviewCount: s.reviewCount,
    imageUrl: s.imageUrl,
    colorHint: s.colorHint,
    createdAt: s.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: s.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}
