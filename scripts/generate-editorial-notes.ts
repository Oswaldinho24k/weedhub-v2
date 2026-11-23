/**
 * Draft "Nota de la redacción" for the editorial classics (or given slugs).
 * Notes are saved as "pendiente": approve them in /admin/revision before they go public.
 *   npx tsx --env-file .env scripts/generate-editorial-notes.ts [slug ...]
 */
import mongoose from "mongoose";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { generateEditorialNote } from "~/services/content-review.server";
import { CLASSIC_STRAINS } from "~/lib/classics";

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : [...CLASSIC_STRAINS];
await connectDB();
const strains = await StrainModel.find({ slug: { $in: slugs } }).select("_id slug editorialNote").lean();
let ok = 0;
for (const s of strains) {
  if ((s as any).editorialNote?.status === "aprobado") continue; // never overwrite approved notes
  const r = await generateEditorialNote(String(s._id));
  if (r.ok) ok++;
  console.log(r.ok ? `✓ ${s.slug}: ${r.text}` : `✗ ${s.slug}: ${r.error}`);
}
console.log(`\n${ok}/${strains.length} notes drafted (pendiente)`);
await mongoose.disconnect();
