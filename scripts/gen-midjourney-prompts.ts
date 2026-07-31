#!/usr/bin/env npx tsx
/**
 * Generate Midjourney prompts for all strains in strains.json
 *
 * Usage:
 *   npx tsx scripts/gen-midjourney-prompts.ts
 *
 * Options:
 *   --limit=N        Only generate first N prompts
 *   --type=indica    Filter by strain type (indica/sativa/hybrid)
 *   --batch=N        Split output into files of N prompts each (default: 50)
 *   --single         Output all prompts in a single file
 *   --skip-existing  Skip strains that already have an imageUrl
 *
 * Output:
 *   prompts/midjourney-batch-001.txt  (or single file with --single)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, "..");
const STRAINS_JSON = path.resolve(PROJECT_DIR, "seed", "data", "strains.json");
const OUTPUT_DIR = path.resolve(PROJECT_DIR, "prompts");

// ── Parse args ──
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;
const typeArg = args.find((a) => a.startsWith("--type="));
const TYPE_FILTER = typeArg ? typeArg.split("=")[1] : null;
const batchArg = args.find((a) => a.startsWith("--batch="));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1]) : 50;
const SINGLE_FILE = args.includes("--single");
const SKIP_EXISTING = args.includes("--skip-existing");

// ── Color mapping by strain name keywords ──
const NAME_COLOR_MAP: [RegExp, string][] = [
  // Purple family
  [/purple|grape|lavender|violet/i, "deep royal purple and violet hues with dark green undertones, purple-tinted trichomes"],
  // Blue family
  [/blue|blueberry|azure/i, "icy blue-purple tones with silvery trichome frost, cool blue undertones"],
  // White/Frost family
  [/white|snow|frost|ice|silver|platinum|diamond/i, "pale silver-green blanketed in thick white crystalline trichomes, frosty appearance"],
  // Red/Cherry family
  [/red|cherry|strawberry|crimson/i, "deep burgundy and red-tinged calyxes with fiery orange pistils"],
  // Orange/Citrus family
  [/orange|tangie|citrus|clementine|mandarin/i, "vibrant orange pistils with bright lime-green calyxes, citrus-colored trichomes"],
  // Lemon/Lime family
  [/lemon|lime|sour|acid/i, "electric lime green with yellow-gold trichome dusting, bright acidic green tones"],
  // Gold/Mango family
  [/gold|mango|banana|yellow|sunset/i, "golden amber hues with warm yellow-green tones, honey-colored trichomes"],
  // Pink family
  [/pink|rose|flamingo/i, "soft pink and magenta-tinted calyxes with pale green sugar leaves"],
  // Chocolate/Coffee family
  [/chocolate|coffee|mocha|brownie/i, "dark olive green with warm brown and amber undertones, earthy coloring"],
  // Candy/Sweet family
  [/gelato|cake|cookie|candy|zkittlez|runtz|cream|vanilla|sugar/i, "pastel green and purple swirled coloring with dense sugary trichome coating"],
  // Fire family
  [/fire|flame|blaze|inferno/i, "fiery orange and red pistils blazing through dark green calyxes"],
  // Kush (generic)
  [/kush/i, "classic deep forest green with abundant amber-orange pistils and thick resin coating"],
  // Haze (generic)
  [/haze/i, "bright sage green with wispy golden-orange hairs and airy structure"],
  // Diesel/Chem family
  [/diesel|chem|gas|fuel/i, "dark olive green with minimal color variation, industrial dense appearance"],
  // Black/Dark family
  [/black|dark|midnight|shadow/i, "extremely dark purple-black calyxes with bright orange pistil contrast"],
  // Rainbow/Mix family
  [/rainbow|skittles|spectrum/i, "multicolored calyxes showing green, purple, orange and pink in patches"],
  // Mint/Herb family
  [/mint|herb|sage|basil|eucalyptus/i, "cool mint green with fresh herbal tones and light trichome dusting"],
];

// ── Color mapping by dominant terpene ──
const TERPENE_COLOR_MAP: Record<string, string> = {
  Mirceno: "warm earthy green with amber undertones",
  Limoneno: "bright yellow-green with golden highlights",
  Pineno: "deep forest green with pine-like freshness",
  Cariofileno: "dark spicy green with warm brown-red accents",
  Linalol: "soft lavender-purple tinted green",
  Terpinoleno: "light floral green with pink-purple hints",
  Humuleno: "earthy gold-green with hoppy warm tones",
  Ocimeno: "bright fresh herbal green with sweet overtones",
};

// ── Bud structure by type ──
const BUD_STRUCTURE: Record<string, string> = {
  indica: "dense compact chunky bud structure, tight thick calyxes, heavy trichome coverage",
  sativa: "elongated airy bud structure with stretched calyxes, wispy pistils throughout",
  hybrid: "medium-dense well-rounded bud structure, balanced between compact and airy",
};

// ── Lighting accent by type ──
const LIGHTING_ACCENT: Record<string, string> = {
  indica: "warm amber side lighting with subtle purple rim light",
  sativa: "cool crisp white lighting with subtle green rim light",
  hybrid: "balanced warm-cool lighting with subtle orange rim light",
};

// ── Get color description for a strain ──
function getColorDescription(strain: any): string {
  const name = strain.name || "";

  // 1. Try name-based color mapping (most specific)
  for (const [pattern, color] of NAME_COLOR_MAP) {
    if (pattern.test(name)) {
      return color;
    }
  }

  // 2. Try terpene-based
  const terpenes = strain.terpenes || [];
  if (terpenes.length > 0) {
    const dominant = terpenes[0].name;
    if (TERPENE_COLOR_MAP[dominant]) {
      return TERPENE_COLOR_MAP[dominant];
    }
  }

  // 3. Fallback by type
  const typeColors: Record<string, string> = {
    indica: "deep purple and dark green hues with frosty amber trichomes",
    sativa: "bright vivid green with golden-orange pistils and light frost",
    hybrid: "rich green and purple blend with orange pistils and crystal coating",
  };
  return typeColors[strain.type] || typeColors.hybrid;
}

// ── Build prompt for a single strain ──
function buildPrompt(strain: any): string {
  const name = strain.name;
  const type = strain.type || "hybrid";
  const colorDesc = getColorDescription(strain);
  const structure = BUD_STRUCTURE[type] || BUD_STRUCTURE.hybrid;
  const lighting = LIGHTING_ACCENT[type] || LIGHTING_ACCENT.hybrid;

  return [
    `extreme macro photography of a ${name} cannabis flower bud,`,
    `single vertical upright bud centered in frame,`,
    `${structure},`,
    `${colorDesc},`,
    `stunning trichome crystal detail, glistening resinous surface,`,
    `bright orange pistils curling through the calyxes,`,
    `${lighting},`,
    `completely pure black background,`,
    `ultra shallow depth of field, professional studio product photography,`,
    `shot on Canon EOS R5 with 100mm macro lens, 8k resolution`,
    `--ar 1:1 --s 750 --q 2 --v 6.1`,
    `--no text letters words numbers watermark logo label human hands cartoon illustration drawing painting anime 3d render blurry`,
  ].join(" ");
}

// ── Main ──
function main() {
  console.log("🌿 WeedHub Midjourney Prompt Generator\n");

  const strains: any[] = JSON.parse(fs.readFileSync(STRAINS_JSON, "utf-8"));
  console.log(`📋 ${strains.length} strains loaded`);

  // Filter
  let filtered = strains;
  if (TYPE_FILTER) {
    filtered = filtered.filter((s) => s.type === TYPE_FILTER);
    console.log(`🔍 Filtered to ${filtered.length} ${TYPE_FILTER} strains`);
  }
  if (SKIP_EXISTING) {
    const before = filtered.length;
    filtered = filtered.filter((s) => !s.imageUrl);
    console.log(`⏭  Skipped ${before - filtered.length} with existing images`);
  }
  if (LIMIT < Infinity) {
    filtered = filtered.slice(0, LIMIT);
    console.log(`📏 Limited to ${filtered.length} strains`);
  }

  // Generate prompts
  const prompts = filtered.map((strain) => ({
    slug: strain.slug,
    name: strain.name,
    type: strain.type,
    prompt: buildPrompt(strain),
  }));

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (SINGLE_FILE) {
    // Single file with all prompts
    const lines = prompts.map((p) => `// ${p.slug} (${p.type})\n${p.prompt}\n`);
    const outPath = path.join(OUTPUT_DIR, "midjourney-all-prompts.txt");
    fs.writeFileSync(outPath, lines.join("\n"));
    console.log(`\n📁 Saved ${prompts.length} prompts to ${outPath}`);
  } else {
    // Batch files
    const batches = Math.ceil(prompts.length / BATCH_SIZE);
    for (let i = 0; i < batches; i++) {
      const batch = prompts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const batchNum = String(i + 1).padStart(3, "0");
      const lines = batch.map(
        (p, idx) =>
          `// ${i * BATCH_SIZE + idx + 1}. ${p.slug} (${p.type})\n${p.prompt}\n`
      );
      const outPath = path.join(
        OUTPUT_DIR,
        `midjourney-batch-${batchNum}.txt`
      );
      fs.writeFileSync(outPath, lines.join("\n"));
    }
    console.log(`\n📁 Saved ${batches} batch files (${BATCH_SIZE} prompts each) to ${OUTPUT_DIR}/`);
  }

  // Also generate a CSV mapping for tracking progress
  const csvLines = [
    "slug,name,type,status",
    ...prompts.map((p) => `${p.slug},"${p.name}",${p.type},pending`),
  ];
  const csvPath = path.join(OUTPUT_DIR, "strain-image-tracker.csv");
  fs.writeFileSync(csvPath, csvLines.join("\n"));
  console.log(`📊 Tracker CSV saved to ${csvPath}`);

  // Summary
  const byType = { indica: 0, sativa: 0, hybrid: 0 };
  for (const p of prompts) byType[p.type as keyof typeof byType]++;
  console.log(`\n✅ Done! Generated ${prompts.length} prompts:`);
  console.log(`   🟣 Indica:  ${byType.indica}`);
  console.log(`   🟢 Sativa:  ${byType.sativa}`);
  console.log(`   🟠 Hybrid:  ${byType.hybrid}`);
  console.log(`\n💡 Workflow:`);
  console.log(`   1. Open batch files in prompts/ folder`);
  console.log(`   2. Copy each prompt into Midjourney`);
  console.log(`   3. Pick best image from each grid of 4, upscale it`);
  console.log(`   4. Download and rename to {slug}.png`);
  console.log(`   5. Place in strain-cards/ folder`);
  console.log(`   6. Run: npx tsx scripts/upload-strain-cards.ts`);
}

main();
