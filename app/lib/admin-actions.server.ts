import Anthropic from "@anthropic-ai/sdk";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { EffectModel } from "~/models/effect.server";
import { UserModel } from "~/models/user.server";
import { ReviewModel } from "~/models/review.server";
import { GlossaryTermModel } from "~/models/glossary-term.server";

export type ActionResult = { success: boolean; data?: unknown; error?: string };

type AdminAction = {
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ActionResult>;
};

export const adminActions: Record<string, AdminAction> = {
  get_stats: {
    description:
      "Get WeedHub dashboard statistics: total counts of strains, reviews, users, and flagged reviews.",
    inputSchema: { type: "object", properties: {}, required: [] },
    execute: async () => {
      await connectDB();
      const [strainCount, reviewCount, userCount, flaggedCount] = await Promise.all([
        StrainModel.countDocuments({ isArchived: false }),
        ReviewModel.countDocuments(),
        UserModel.countDocuments(),
        ReviewModel.countDocuments({ status: "flagged" }),
      ]);
      return { success: true, data: { strainCount, reviewCount, userCount, flaggedCount } };
    },
  },

  search_strains: {
    description:
      "Search strains by name. Returns name, slug, type, reviewCount, and archive status.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term (name or partial name)" },
        limit: { type: "number", description: "Max results, default 10, max 50" },
        type: {
          type: "string",
          enum: ["sativa", "indica", "hybrid"],
          description: "Optional type filter",
        },
      },
      required: ["query"],
    },
    execute: async (args) => {
      await connectDB();
      const limit = Math.min(Number(args.limit ?? 10), 50);
      const filter: Record<string, unknown> = {
        name: { $regex: String(args.query), $options: "i" },
      };
      if (args.type) filter.type = args.type;
      const strains = await StrainModel.find(filter)
        .limit(limit)
        .select("name slug type reviewCount isArchived")
        .lean();
      return {
        success: true,
        data: strains.map((s) => ({ ...s, _id: String(s._id) })),
      };
    },
  },

  get_strain: {
    description:
      "Get full details of a strain by slug, including cannabinoid profile, terpenes, effects, flavors, and descriptions.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The strain slug (URL-friendly name)" },
      },
      required: ["slug"],
    },
    execute: async (args) => {
      await connectDB();
      const strain = await StrainModel.findOne({ slug: String(args.slug) }).lean();
      if (!strain) return { success: false, error: `Strain '${args.slug}' not found` };
      return { success: true, data: { ...strain, _id: String(strain._id) } };
    },
  },

  update_strain: {
    description:
      "Update specific fields on a strain identified by slug. Only include fields you want to change.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The strain slug to update" },
        name: { type: "string" },
        type: { type: "string", enum: ["sativa", "indica", "hybrid"] },
        description: { type: "string" },
        thcMin: { type: "number" },
        thcMax: { type: "number" },
        cbdMin: { type: "number" },
        cbdMax: { type: "number" },
        effects: {
          type: "array",
          items: { type: "string" },
          description: "Effect list in Spanish",
        },
        flavors: {
          type: "array",
          items: { type: "string" },
          description: "Flavor list in Spanish",
        },
        difficulty: { type: "string", enum: ["Baja", "Moderada", "Alta"] },
        colorHint: { type: "string", description: "CSS color for UI placeholder" },
        dominantTerpene: { type: "string" },
        lineage: { type: "string" },
      },
      required: ["slug"],
    },
    execute: async (args) => {
      await connectDB();
      const slug = String(args.slug);
      const strain = await StrainModel.findOne({ slug });
      if (!strain) return { success: false, error: `Strain '${slug}' not found` };

      const $set: Record<string, unknown> = {};
      if (args.name !== undefined) $set.name = args.name;
      if (args.type !== undefined) $set.type = args.type;
      if (args.description !== undefined) $set.description = args.description;
      if (args.effects !== undefined) $set.effects = args.effects;
      if (args.flavors !== undefined) $set.flavors = args.flavors;
      if (args.difficulty !== undefined) $set.difficulty = args.difficulty;
      if (args.colorHint !== undefined) $set.colorHint = args.colorHint;
      if (args.dominantTerpene !== undefined) $set.dominantTerpene = args.dominantTerpene;
      if (args.lineage !== undefined) $set.lineage = args.lineage;

      const cur = strain.cannabinoidProfile;
      if (args.thcMin !== undefined || args.thcMax !== undefined) {
        $set["cannabinoidProfile.thc"] = {
          min: args.thcMin ?? cur.thc.min,
          max: args.thcMax ?? cur.thc.max,
        };
      }
      if (args.cbdMin !== undefined || args.cbdMax !== undefined) {
        $set["cannabinoidProfile.cbd"] = {
          min: args.cbdMin ?? cur.cbd.min,
          max: args.cbdMax ?? cur.cbd.max,
        };
      }

      await StrainModel.findByIdAndUpdate(strain._id, { $set });
      return { success: true, data: { updated: slug, fields: Object.keys($set) } };
    },
  },

  archive_strain: {
    description:
      "Archive or unarchive a strain. Archived strains are hidden from the public directory.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        archive: {
          type: "boolean",
          description: "true to archive, false to restore/unarchive",
        },
      },
      required: ["slug", "archive"],
    },
    execute: async (args) => {
      await connectDB();
      const strain = await StrainModel.findOneAndUpdate(
        { slug: String(args.slug) },
        { isArchived: Boolean(args.archive) },
        { new: true }
      ).select("name isArchived");
      if (!strain) return { success: false, error: `Strain '${args.slug}' not found` };
      return { success: true, data: { name: strain.name, isArchived: strain.isArchived } };
    },
  },

  list_effects: {
    description: "List cannabis effects from the catalog, optionally filtered by category or status.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["positive", "negative"] },
        status: {
          type: "string",
          enum: ["approved", "pending", "rejected"],
          description: "Default: approved",
        },
        limit: { type: "number", description: "Default 50" },
      },
      required: [],
    },
    execute: async (args) => {
      await connectDB();
      const filter: Record<string, unknown> = { status: args.status ?? "approved" };
      if (args.category) filter.category = args.category;
      const effects = await EffectModel.find(filter)
        .limit(Number(args.limit ?? 50))
        .sort({ usageCount: -1 })
        .lean();
      return {
        success: true,
        data: effects.map((e) => ({ ...e, _id: String(e._id) })),
      };
    },
  },

  create_effect: {
    description:
      "Create a new cannabis effect in the catalog with labels in Spanish, English, and Portuguese.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Unique lowercase key, e.g. 'sociable', 'energized'" },
        labelEs: { type: "string", description: "Label in Spanish" },
        labelEn: { type: "string", description: "Label in English" },
        labelPt: { type: "string", description: "Label in Portuguese" },
        category: { type: "string", enum: ["positive", "negative"] },
      },
      required: ["key", "labelEs", "labelEn", "labelPt", "category"],
    },
    execute: async (args) => {
      await connectDB();
      const key = String(args.key).toLowerCase().trim();
      const existing = await EffectModel.findOne({ key });
      if (existing) return { success: false, error: `Effect key '${key}' already exists` };
      const effect = await EffectModel.create({
        key,
        labelEs: String(args.labelEs),
        labelEn: String(args.labelEn),
        labelPt: String(args.labelPt),
        category: String(args.category) as "positive" | "negative",
        status: "approved" as const,
        source: "system" as const,
      });
      return { success: true, data: { key: effect.key, labelEs: effect.labelEs } };
    },
  },

  list_users: {
    description:
      "List registered users with optional filters by country code, role, or username search.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "2-letter country code, e.g. MX, CO, AR" },
        role: { type: "string", enum: ["user", "admin"] },
        username: { type: "string", description: "Partial username search" },
        limit: { type: "number", description: "Default 20, max 100" },
      },
      required: [],
    },
    execute: async (args) => {
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (args.country) filter.country = String(args.country).toUpperCase();
      if (args.role) filter.role = args.role;
      if (args.username)
        filter.username = { $regex: String(args.username), $options: "i" };
      const users = await UserModel.find(filter)
        .limit(Math.min(Number(args.limit ?? 20), 100))
        .sort({ createdAt: -1 })
        .select("username country role stats earnedBadges")
        .lean();
      return {
        success: true,
        data: users.map((u) => ({
          _id: String(u._id),
          username: u.username,
          country: u.country,
          role: u.role,
          reviewCount: u.stats?.reviewCount ?? 0,
          joinedAt: u.stats?.joinedAt,
          badges: u.earnedBadges?.length ?? 0,
        })),
      };
    },
  },

  list_glossary_terms: {
    description: "List glossary terms, optionally filtered by category. Returns slug, term, category, and active status.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["cannabinoides", "terpenos", "extracciones", "cultivo", "consumo", "legal", "ciencia", "cultura"],
          description: "Optional category filter",
        },
        activeOnly: { type: "boolean", description: "Default true — only return active terms" },
      },
      required: [],
    },
    execute: async (args) => {
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (args.activeOnly !== false) filter.isActive = true;
      if (args.category) filter.category = String(args.category);
      const terms = await GlossaryTermModel.find(filter)
        .sort({ category: 1, term: 1 })
        .select("slug term category isActive relatedSlugs")
        .lean();
      return { success: true, data: terms.map((t) => ({ ...t, _id: String(t._id) })) };
    },
  },

  get_glossary_term: {
    description: "Get full details of a glossary term by slug, including definition, examples, and related terms.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The term slug, e.g. 'thc', 'live-resin'" },
      },
      required: ["slug"],
    },
    execute: async (args) => {
      await connectDB();
      const term = await GlossaryTermModel.findOne({ slug: String(args.slug) }).lean();
      if (!term) return { success: false, error: `Term '${args.slug}' not found` };
      return { success: true, data: { ...term, _id: String(term._id) } };
    },
  },

  create_glossary_term: {
    description: "Create a new glossary term with a Spanish definition. Slug must be unique and lowercase.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Unique slug, lowercase, hyphens only, e.g. 'live-resin'" },
        term: { type: "string", description: "Display name in Spanish" },
        termEn: { type: "string", description: "Display name in English (optional)" },
        category: {
          type: "string",
          enum: ["cannabinoides", "terpenos", "extracciones", "cultivo", "consumo", "legal", "ciencia", "cultura"],
        },
        definition: { type: "string", description: "Full definition in Spanish" },
        definitionEn: { type: "string", description: "Definition in English (optional)" },
        relatedSlugs: {
          type: "array",
          items: { type: "string" },
          description: "Slugs of related terms",
        },
        examples: {
          type: "array",
          items: { type: "string" },
          description: "Usage examples in Spanish",
        },
      },
      required: ["slug", "term", "category", "definition"],
    },
    execute: async (args) => {
      await connectDB();
      const slug = String(args.slug).toLowerCase().trim();
      const existing = await GlossaryTermModel.findOne({ slug });
      if (existing) return { success: false, error: `Slug '${slug}' already exists` };
      const created = await GlossaryTermModel.create({
        slug,
        term: String(args.term),
        termEn: args.termEn ? String(args.termEn) : undefined,
        category: String(args.category),
        definition: String(args.definition),
        definitionEn: args.definitionEn ? String(args.definitionEn) : undefined,
        relatedSlugs: Array.isArray(args.relatedSlugs) ? args.relatedSlugs : [],
        examples: Array.isArray(args.examples) ? args.examples : [],
        isActive: true,
      });
      return { success: true, data: { slug: created.slug, term: created.term } };
    },
  },

  update_glossary_term: {
    description: "Update the definition, related terms, or examples of a glossary term by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        definition: { type: "string", description: "Updated Spanish definition" },
        definitionEn: { type: "string", description: "Updated English definition" },
        relatedSlugs: { type: "array", items: { type: "string" } },
        examples: { type: "array", items: { type: "string" } },
        isActive: { type: "boolean", description: "Show or hide the term" },
      },
      required: ["slug"],
    },
    execute: async (args) => {
      await connectDB();
      const slug = String(args.slug);
      const $set: Record<string, unknown> = {};
      if (args.definition !== undefined) $set.definition = String(args.definition);
      if (args.definitionEn !== undefined) $set.definitionEn = String(args.definitionEn);
      if (args.relatedSlugs !== undefined) $set.relatedSlugs = args.relatedSlugs;
      if (args.examples !== undefined) $set.examples = args.examples;
      if (args.isActive !== undefined) $set.isActive = Boolean(args.isActive);
      const updated = await GlossaryTermModel.findOneAndUpdate({ slug }, { $set }, { new: true }).select("slug term isActive");
      if (!updated) return { success: false, error: `Term '${slug}' not found` };
      return { success: true, data: { slug: updated.slug, term: updated.term, isActive: updated.isActive } };
    },
  },

  get_strain_grow_info: {
    description: "Get the grow/cultivation data for a strain by slug (flowering weeks, yield, height, climate, etc).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The strain slug" },
      },
      required: ["slug"],
    },
    execute: async (args) => {
      await connectDB();
      const strain = await StrainModel.findOne({ slug: String(args.slug) })
        .select("name slug difficulty grow")
        .lean();
      if (!strain) return { success: false, error: `Strain '${args.slug}' not found` };
      return { success: true, data: { name: strain.name, slug: strain.slug, difficulty: strain.difficulty, grow: strain.grow } };
    },
  },

  update_strain_grow_info: {
    description: "Update cultivation/grow data for a strain. Pass only the fields you want to change.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The strain slug" },
        floweringWeeksMin: { type: "number", description: "Min weeks to flower (e.g. 8)" },
        floweringWeeksMax: { type: "number", description: "Max weeks to flower (e.g. 10)" },
        yieldIndoor: { type: "string", description: "Indoor yield, e.g. '400-500 g/m²'" },
        yieldOutdoor: { type: "string", description: "Outdoor yield, e.g. '600 g/planta'" },
        heightCmMin: { type: "number", description: "Min height in cm" },
        heightCmMax: { type: "number", description: "Max height in cm" },
        climate: { type: "string", enum: ["tropical", "mediterráneo", "continental", "frío"] },
        isAutoflowering: { type: "boolean" },
        isFeminized: { type: "boolean" },
        difficulty: { type: "string", enum: ["Baja", "Moderada", "Alta"] },
      },
      required: ["slug"],
    },
    execute: async (args) => {
      await connectDB();
      const slug = String(args.slug);
      const strain = await StrainModel.findOne({ slug });
      if (!strain) return { success: false, error: `Strain '${slug}' not found` };
      const $set: Record<string, unknown> = {};
      if (args.floweringWeeksMin !== undefined || args.floweringWeeksMax !== undefined)
        $set["grow.floweringWeeks"] = { min: args.floweringWeeksMin ?? 0, max: args.floweringWeeksMax ?? 0 };
      if (args.yieldIndoor !== undefined) $set["grow.yieldIndoor"] = args.yieldIndoor;
      if (args.yieldOutdoor !== undefined) $set["grow.yieldOutdoor"] = args.yieldOutdoor;
      if (args.heightCmMin !== undefined || args.heightCmMax !== undefined)
        $set["grow.heightCm"] = { min: args.heightCmMin ?? 0, max: args.heightCmMax ?? 0 };
      if (args.climate !== undefined) $set["grow.climate"] = args.climate;
      if (args.isAutoflowering !== undefined) $set["grow.isAutoflowering"] = Boolean(args.isAutoflowering);
      if (args.isFeminized !== undefined) $set["grow.isFeminized"] = Boolean(args.isFeminized);
      if (args.difficulty !== undefined) $set.difficulty = args.difficulty;
      await StrainModel.findByIdAndUpdate(strain._id, { $set });
      return { success: true, data: { slug, updated: Object.keys($set) } };
    },
  },

  set_user_role: {
    description: "Change a user's role. Use 'admin' to grant admin access, 'user' to revoke it.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string" },
        role: { type: "string", enum: ["user", "admin"] },
      },
      required: ["username", "role"],
    },
    execute: async (args) => {
      await connectDB();
      const user = await UserModel.findOneAndUpdate(
        { username: String(args.username) },
        { role: args.role },
        { new: true }
      ).select("username role");
      if (!user) return { success: false, error: `User '${args.username}' not found` };
      return { success: true, data: { username: user.username, role: user.role } };
    },
  },
};

export function actionsToClaudeTools(): Anthropic.Messages.Tool[] {
  return Object.entries(adminActions).map(([name, action]) => ({
    name,
    description: action.description,
    input_schema: action.inputSchema as Anthropic.Messages.Tool["input_schema"],
  }));
}
