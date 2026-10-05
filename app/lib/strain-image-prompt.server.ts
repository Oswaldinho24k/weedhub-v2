// Ported from scripts/gen-midjourney-prompts.ts — adapted for direct AI generation (no Midjourney flags)

const NAME_COLOR_MAP: [RegExp, string][] = [
  [/purple|grape|lavender|violet/i, "deep royal purple and violet hues with dark green undertones, purple-tinted trichomes"],
  [/blue|blueberry|azure/i, "icy blue-purple tones with silvery trichome frost, cool blue undertones"],
  [/white|snow|frost|ice|silver|platinum|diamond/i, "pale silver-green blanketed in thick white crystalline trichomes, frosty appearance"],
  [/red|cherry|strawberry|crimson/i, "deep burgundy and red-tinged calyxes with fiery orange pistils"],
  [/orange|tangie|citrus|clementine|mandarin/i, "vibrant orange pistils with bright lime-green calyxes, citrus-colored trichomes"],
  [/lemon|lime|sour|acid/i, "electric lime green with yellow-gold trichome dusting, bright acidic green tones"],
  [/gold|mango|banana|yellow|sunset/i, "golden amber hues with warm yellow-green tones, honey-colored trichomes"],
  [/pink|rose|flamingo/i, "soft pink and magenta-tinted calyxes with pale green sugar leaves"],
  [/chocolate|coffee|mocha|brownie/i, "dark olive green with warm brown and amber undertones, earthy coloring"],
  [/gelato|cake|cookie|candy|zkittlez|runtz|cream|vanilla|sugar/i, "pastel green and purple swirled coloring with dense sugary trichome coating"],
  [/fire|flame|blaze|inferno/i, "fiery orange and red pistils blazing through dark green calyxes"],
  [/kush/i, "classic deep forest green with abundant amber-orange pistils and thick resin coating"],
  [/haze/i, "bright sage green with wispy golden-orange hairs and airy structure"],
  [/diesel|chem|gas|fuel/i, "dark olive green with minimal color variation, industrial dense appearance"],
  [/black|dark|midnight|shadow/i, "extremely dark purple-black calyxes with bright orange pistil contrast"],
  [/rainbow|skittles|spectrum/i, "multicolored calyxes showing green, purple, orange and pink in patches"],
  [/mint|herb|sage|basil|eucalyptus/i, "cool mint green with fresh herbal tones and light trichome dusting"],
];

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

const BUD_STRUCTURE: Record<string, string> = {
  indica: "dense compact chunky bud structure, tight thick calyxes, heavy trichome coverage",
  sativa: "elongated airy bud structure with stretched calyxes, wispy pistils throughout",
  hybrid: "medium-dense well-rounded bud structure, balanced between compact and airy",
};

const LIGHTING_ACCENT: Record<string, string> = {
  indica: "warm amber side lighting with subtle purple rim light",
  sativa: "cool crisp white lighting with subtle green rim light",
  hybrid: "balanced warm-cool lighting with subtle orange rim light",
};

function getColorDescription(strain: {
  name: string;
  type: string;
  dominantTerpene?: string;
  terpenes?: Array<{ name: string }>;
}): string {
  for (const [pattern, color] of NAME_COLOR_MAP) {
    if (pattern.test(strain.name)) return color;
  }

  const dominant = strain.dominantTerpene || strain.terpenes?.[0]?.name;
  if (dominant && TERPENE_COLOR_MAP[dominant]) {
    return TERPENE_COLOR_MAP[dominant];
  }

  const typeColors: Record<string, string> = {
    indica: "deep purple and dark green hues with frosty amber trichomes",
    sativa: "bright vivid green with golden-orange pistils and light frost",
    hybrid: "rich green and purple blend with orange pistils and crystal coating",
  };
  return typeColors[strain.type] || typeColors.hybrid;
}

export function buildStrainImagePrompt(strain: {
  name: string;
  type: string;
  dominantTerpene?: string;
  terpenes?: Array<{ name: string; percentage?: number }>;
  effects?: string[];
  flavors?: string[];
}): string {
  const type = strain.type || "hybrid";
  const colorDesc = getColorDescription(strain);
  const structure = BUD_STRUCTURE[type] || BUD_STRUCTURE.hybrid;
  const lighting = LIGHTING_ACCENT[type] || LIGHTING_ACCENT.hybrid;

  return [
    `extreme macro photography of a ${strain.name} cannabis flower bud,`,
    `single vertical upright bud centered in frame,`,
    `${structure},`,
    `${colorDesc},`,
    `stunning trichome crystal detail, glistening resinous surface,`,
    `bright orange pistils curling through the calyxes,`,
    `${lighting},`,
    `completely pure black background,`,
    `ultra shallow depth of field, professional studio product photography,`,
    `shot on Canon EOS R5 with 100mm macro lens, 8k resolution.`,
    `Avoid: text, watermarks, hands, cartoon, illustration, 3d render, blurry`,
  ].join(" ");
}
