import type { Schema } from "mongoose";

/**
 * Seed content (AI-generated placeholder reviews, users, forum, businesses) stays in the
 * database but never reaches the public site. Every find/count/aggregate on a schema with
 * this plugin excludes `source: "seed"` unless the query opts in with
 * `.setOptions({ includeSeed: true })` (aggregate: `.option({ includeSeed: true })`).
 * Mark/unmark data with `seed/hide-seed.mjs`.
 */
export function hideSeed(schema: Schema) {
  const hooks = ["find", "findOne", "countDocuments", "findOneAndUpdate", "updateMany", "updateOne", "distinct"] as const;
  for (const hook of hooks) {
    schema.pre(hook, function () {
      const opts = this.getOptions?.() ?? {};
      if (opts.includeSeed) return;
      const filter = this.getFilter?.() ?? {};
      if ("source" in filter) return;
      this.where({ source: { $ne: "seed" } });
    });
  }
  schema.pre("aggregate", function () {
    if ((this.options as { includeSeed?: boolean })?.includeSeed) return;
    this.pipeline().unshift({ $match: { source: { $ne: "seed" } } });
  });
}
