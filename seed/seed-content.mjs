/**
 * Seed content for the sections that were empty in production:
 * brands, products, dispensaries (+ their reviews), magazine articles,
 * forum threads + comments, extra seed users (BR/CO/AR/CL/UY),
 * condition votes on seeded strain reviews, quick ratings, saved strains.
 *
 * Every inserted document carries { isSeed: true, seedBatch }.
 * Every modified existing document carries a seed marker so it can be reverted.
 *
 *   node --env-file .env seed/seed-content.mjs           # insert (idempotent: skips if batch exists)
 *   node --env-file .env seed/seed-content.mjs --delete  # remove everything this script added
 *
 * Product categories come from `npm run seed:categories` (run it first).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BATCH = "2026-11-23";
const SEED = { isSeed: true, seedBatch: BATCH };
const dir = path.dirname(fileURLToPath(import.meta.url));
const readJson = (f) => {
  const p = path.join(dir, "data", f);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const C = (n) => db.collection(n);

// ---------- delete mode ----------
if (process.argv.includes("--delete")) {
  for (const n of ["articles", "posts", "comments", "brands", "products", "dispensaries", "quickratings", "savedstrains"]) {
    const r = await C(n).deleteMany({ seedBatch: BATCH });
    console.log(`${n}: -${r.deletedCount}`);
  }
  const rr = await C("reviews").deleteMany({ seedBatch: BATCH });
  console.log(`reviews (entity): -${rr.deletedCount}`);
  const ru = await C("reviews").updateMany({ seedConditions: BATCH }, { $set: { conditionsHelped: [] }, $unset: { seedConditions: "" } });
  console.log(`reviews conditions reverted: ${ru.modifiedCount}`);
  const rs = await C("strains").updateMany({ seedConditions: BATCH }, { $set: { conditionVotes: {}, helpsWithConditions: [] }, $unset: { seedConditions: "" } });
  console.log(`strains conditions reverted: ${rs.modifiedCount}`);
  const us = await C("users").deleteMany({ seedBatch: BATCH });
  console.log(`users: -${us.deletedCount}`);
  await mongoose.disconnect();
  process.exit(0);
}

if (await C("brands").findOne({ seedBatch: BATCH })) {
  console.log(`Batch ${BATCH} already seeded. Run with --delete first to reseed.`);
  await mongoose.disconnect();
  process.exit(0);
}

// ---------- helpers ----------
let rng = 42;
const rand = () => ((rng = (rng * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (a) => a[Math.floor(rand() * a.length)];
const sample = (a, n) => [...a].sort(() => rand() - 0.5).slice(0, n);
const daysAgo = (d, h = 0) => new Date(Date.now() - d * 864e5 + h * 36e5);
const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const ADJ = ["Tranquilo", "Serena", "Curioso", "Calma", "Viva", "Noble", "Lúcida", "Sobria", "Fluida", "Sutil", "Risueña", "Firme"];
const CRE = ["Jaguar", "Ceiba", "Quetzal", "Nopal", "Puma", "Tucán", "Colibrí", "Ajolote", "Cóndor", "Capivara", "Sabiá", "Ipê"];

const commerce = readJson("seed-commerce.json");
const articles = readJson("seed-articles.json") ?? [];
const forum = readJson("seed-forum.json") ?? { threads: [] };

// ---------- users ----------
const unusableHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
const newUsers = commerce.users.map((u, i) => ({
  ...u,
  email: `seed+${u.username.replace(/[^a-z0-9]/gi, "")}@weedhub.info`,
  passwordHash: unusableHash,
  role: "user",
  anonymousHandle: `${pick(ADJ)}-${pick(CRE)}-${7000 + i}`,
  publishAsAnonymous: rand() < 0.4,
  createdAt: daysAgo(100 + Math.floor(rand() * 60)),
  updatedAt: new Date(),
  ...SEED,
}));
await C("users").insertMany(newUsers);
const allUsers = await C("users").find({ isQaAccount: { $ne: true } }).project({ _id: 1, country: 1 }).toArray();
const byCountry = (cc) => {
  const pool = allUsers.filter((u) => u.country === cc);
  return pool.length ? pool : allUsers;
};
console.log(`users: +${newUsers.length}`);

// ---------- brands / products / dispensaries ----------
const brandDocs = commerce.brands.map((b) => ({
  name: b.name,
  slug: b.slug,
  description: b.description,
  descriptions: { es: b.description, pt: b.descriptionPt || undefined },
  country: b.country,
  city: b.city,
  status: "active",
  tier: "free",
  isVerified: false,
  productCount: 0,
  averageRating: 0,
  reviewCount: 0,
  createdAt: daysAgo(60 + Math.floor(rand() * 60)),
  updatedAt: new Date(),
  ...SEED,
}));
await C("brands").insertMany(brandDocs);
const brandId = Object.fromEntries((await C("brands").find({ seedBatch: BATCH }).toArray()).map((b) => [b.slug, b._id]));

const productDocs = commerce.products.map((p) => ({
  brandId: brandId[p.brand],
  categoryKey: p.categoryKey,
  name: p.name,
  slug: p.slug,
  description: p.description,
  descriptions: { es: p.description },
  images: [],
  cannabinoidProfile: { thc: { min: 0, max: p.thc ?? 0 }, cbd: { min: 0, max: p.cbd ?? 0 } },
  price: p.price,
  priceCurrency: p.currency,
  status: "active",
  isPromoted: false,
  averageRating: 0,
  reviewCount: 0,
  reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  createdAt: daysAgo(30 + Math.floor(rand() * 60)),
  updatedAt: new Date(),
  ...SEED,
}));
await C("products").insertMany(productDocs);
for (const [slug, id] of Object.entries(brandId)) {
  await C("brands").updateOne({ _id: id }, { $set: { productCount: await C("products").countDocuments({ brandId: id }) } });
}

const dispDocs = commerce.dispensaries.map((d) => ({
  name: d.name,
  slug: d.slug,
  description: d.description,
  address: d.address,
  city: d.city,
  state: d.state,
  country: d.country,
  brandId: d.brand ? brandId[d.brand] : undefined,
  status: "active",
  isVerified: false,
  tier: "free",
  averageRating: 0,
  reviewCount: 0,
  createdAt: daysAgo(40 + Math.floor(rand() * 60)),
  updatedAt: new Date(),
  ...SEED,
}));
await C("dispensaries").insertMany(dispDocs);
console.log(`brands: +${brandDocs.length}, products: +${productDocs.length}, dispensaries: +${dispDocs.length}`);

// ---------- entity reviews ----------
const coll = { brand: "brands", dispensary: "dispensaries", product: "products" };
const used = new Set();
for (const r of commerce.entityReviews) {
  const target = await C(coll[r.type]).findOne({ slug: r.slug, seedBatch: BATCH });
  if (!target) continue;
  let u;
  for (let i = 0; i < 20; i++) {
    u = pick(byCountry(r.country));
    if (!used.has(`${u._id}:${target._id}`)) break;
  }
  used.add(`${u._id}:${target._id}`);
  await C("reviews").insertOne({
    userId: u._id,
    entityType: r.type,
    entityId: target._id,
    reviewType: "community",
    isSponsored: false,
    ratings: { overall: r.rating },
    comment: r.comment,
    context: { method: "", timeOfDay: "", setting: "" },
    effectsExperienced: [],
    conditionsHelped: [],
    helpfulVotes: [],
    helpfulCount: Math.floor(rand() * 6),
    status: "published",
    publishedAs: rand() < 0.3 ? "anonymous" : "username",
    createdAt: daysAgo(2 + Math.floor(rand() * 50)),
    updatedAt: new Date(),
    ...SEED,
  });
}
for (const [type, name] of Object.entries(coll)) {
  const agg = await C("reviews").aggregate([
    { $match: { seedBatch: BATCH, entityType: type } },
    { $group: { _id: "$entityId", avg: { $avg: "$ratings.overall" }, n: { $sum: 1 }, r: { $push: "$ratings.overall" } } },
  ]).toArray();
  for (const a of agg) {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    a.r.forEach((x) => dist[x]++);
    await C(name).updateOne({ _id: a._id }, { $set: { averageRating: Math.round(a.avg * 10) / 10, reviewCount: a.n, ...(type === "product" ? { reviewDistribution: dist } : {}) } });
  }
}
console.log(`entity reviews: +${commerce.entityReviews.length}`);

// ---------- magazine ----------
if (articles.length) {
  const strainIds = Object.fromEntries((await C("strains").find({ slug: { $in: articles.flatMap((a) => a.relatedStrainSlugs || []) } }).project({ slug: 1 }).toArray()).map((s) => [s.slug, s._id]));
  await C("articles").insertMany(
    articles.map((a) => ({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      body: a.body,
      author: { name: "Redacción WeedHub", role: "Redacción" },
      category: a.category,
      tags: a.tags || [],
      locale: a.locale,
      relatedStrains: (a.relatedStrainSlugs || []).map((s) => strainIds[s]).filter(Boolean),
      relatedProducts: [],
      relatedBrands: [],
      status: "published",
      publishedAt: daysAgo(a.daysAgo ?? 10),
      viewCount: 20 + Math.floor(rand() * 400),
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      createdAt: daysAgo(a.daysAgo ?? 10),
      updatedAt: daysAgo(Math.max(0, (a.daysAgo ?? 10) - 2)),
      ...SEED,
    }))
  );
  console.log(`articles: +${articles.length}`);
} else console.log("articles: seed-articles.json not found, skipped");

// ---------- forum ----------
let postN = 0, commentN = 0;
for (const t of forum.threads) {
  const author = pick(byCountry(t.country));
  const created = daysAgo(t.daysAgo ?? 7);
  const voters = sample(allUsers, Math.min(t.upvotes ?? 0, allUsers.length)).map((u) => u._id);
  const strain = t.strainSlug ? await C("strains").findOne({ slug: t.strainSlug }, { projection: { _id: 1 } }) : null;
  const postRes = await C("posts").insertOne({
    userId: author._id,
    title: t.title,
    body: t.body,
    slug: `${slugify(t.title)}-${crypto.randomBytes(2).toString("hex")}`,
    category: t.category,
    tags: t.locale === "pt" ? ["pt"] : [],
    ...(strain ? { strainId: strain._id } : {}),
    upvotes: voters,
    upvoteCount: voters.length,
    commentCount: t.comments?.length ?? 0,
    status: "published",
    publishedAs: t.anonymous ? "anonymous" : "username",
    createdAt: created,
    updatedAt: created,
    ...SEED,
  });
  postN++;
  for (const cm of t.comments ?? []) {
    let cu = pick(byCountry(cm.country || t.country));
    if (String(cu._id) === String(author._id)) cu = pick(allUsers);
    const cv = sample(allUsers, Math.min(cm.upvotes ?? 0, allUsers.length)).map((u) => u._id);
    const at = new Date(created.getTime() + (cm.hoursAfter ?? 3) * 36e5);
    await C("comments").insertOne({
      postId: postRes.insertedId,
      userId: cu._id,
      body: cm.body,
      upvotes: cv,
      upvoteCount: cv.length,
      status: "published",
      publishedAs: cm.anonymous ? "anonymous" : "username",
      createdAt: at > new Date() ? new Date() : at,
      updatedAt: at > new Date() ? new Date() : at,
      ...SEED,
    });
    commentN++;
  }
}
console.log(`posts: +${postN}, comments: +${commentN}`);

// ---------- condition votes on existing seeded strain reviews ----------
const EFFECT_TO_COND = {
  Sleepy: ["insomnio", "sueño-interrumpido"],
  Relaxed: ["estres", "ansiedad"],
  Calm: ["ansiedad", "estres"],
  "Pain Relief": ["dolor-cronico", "dolor-muscular", "migraña"],
  Hungry: ["falta-de-apetito", "nauseas"],
  Focused: ["creatividad-foco"],
  Creative: ["creatividad-foco"],
  Energetic: ["fatiga"],
  Uplifted: ["fatiga", "estres"],
};
const strains = await C("strains").find({ reviewCount: { $gt: 0 } }).project({ _id: 1, effects: 1 }).toArray();
const effectsById = new Map(strains.map((s) => [String(s._id), s.effects || []]));
const seedReviews = await C("reviews").find({ strainId: { $exists: true }, seedBatch: { $exists: false } }).project({ _id: 1, strainId: 1 }).toArray();
const votes = new Map();
let tagged = 0;
for (const r of seedReviews) {
  if (rand() > 0.45) continue;
  const options = [...new Set((effectsById.get(String(r.strainId)) || []).flatMap((e) => EFFECT_TO_COND[e] || []))];
  if (!options.length) continue;
  const conds = sample(options, rand() < 0.7 ? 1 : 2);
  await C("reviews").updateOne({ _id: r._id }, { $set: { conditionsHelped: conds, seedConditions: BATCH } });
  tagged++;
  const v = votes.get(String(r.strainId)) || {};
  conds.forEach((c) => (v[c] = (v[c] || 0) + 1));
  votes.set(String(r.strainId), v);
}
for (const [id, v] of votes) {
  const helps = Object.entries(v).filter(([, n]) => n >= 2).map(([c]) => c);
  await C("strains").updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { conditionVotes: v, helpsWithConditions: helps, seedConditions: BATCH } });
}
console.log(`condition votes: ${tagged} reviews tagged, ${votes.size} strains updated`);

// ---------- quick ratings + saved strains ----------
const popular = await C("strains").find({ reviewCount: { $gt: 2 } }).project({ _id: 1, averageRatings: 1 }).limit(300).toArray();
const qr = [], saved = [], seen = new Set();
for (let i = 0; i < 420; i++) {
  const u = pick(allUsers), s = pick(popular), k = `${u._id}:${s._id}`;
  if (seen.has(k)) continue;
  seen.add(k);
  const base = Math.round(s.averageRatings?.overall || 4);
  const rating = Math.max(1, Math.min(5, base + (rand() < 0.2 ? -1 : rand() < 0.15 ? 1 : 0)));
  const at = daysAgo(Math.floor(rand() * 90));
  qr.push({ userId: u._id, strainId: s._id, rating, createdAt: at, updatedAt: at, ...SEED });
  if (rand() < 0.45) saved.push({ userId: u._id, strainId: s._id, createdAt: at, updatedAt: at, ...SEED });
}
await C("quickratings").insertMany(qr);
await C("savedstrains").insertMany(saved);
console.log(`quick ratings: +${qr.length}, saved strains: +${saved.length}`);

await mongoose.disconnect();
