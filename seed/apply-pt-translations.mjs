/**
 * Writes pt-BR fields onto glossary terms and legal statuses from seed/data/pt-translations.json.
 * Only sets *Pt fields; Spanish content is untouched. Revert: --revert (unsets the pt fields).
 *   node --env-file .env seed/apply-pt-translations.mjs [--revert]
 */
import fs from "node:fs";
import mongoose from "mongoose";

const t = JSON.parse(fs.readFileSync(new URL("./data/pt-translations.json", import.meta.url), "utf8"));
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const revert = process.argv.includes("--revert");

let g = 0, l = 0;
for (const [slug, v] of Object.entries(t.glossary)) {
  const r = await db.collection("glossaryterms").updateOne(
    { slug },
    revert ? { $unset: { definitionPt: "", examplesPt: "" } } : { $set: { termPt: v.termPt, definitionPt: v.definitionPt, examplesPt: v.examplesPt } }
  );
  g += r.modifiedCount;
}
for (const [code, v] of Object.entries(t.legal)) {
  const doc = await db.collection("legalstatuses").findOne({ countryCode: code });
  if (!doc) continue;
  if (revert) {
    await db.collection("legalstatuses").updateOne({ _id: doc._id }, { $unset: { summaryPt: "", whatYouCanPt: "", whatYouCantPt: "", keyDatePt: "" } });
    l++;
    continue;
  }
  const states = (doc.states || []).map((s) => ({ ...s, namePt: v.statesPt?.[s.name]?.namePt ?? s.name, notePt: v.statesPt?.[s.name]?.notePt ?? s.note }));
  await db.collection("legalstatuses").updateOne(
    { _id: doc._id },
    { $set: { countryNamePt: v.countryNamePt, summaryPt: v.summaryPt, whatYouCanPt: v.whatYouCanPt, whatYouCantPt: v.whatYouCantPt, keyDatePt: v.keyDatePt || undefined, states } }
  );
  l++;
}
console.log(`glossary updated: ${g}, legal updated: ${l}${revert ? " (reverted)" : ""}`);
await mongoose.disconnect();
