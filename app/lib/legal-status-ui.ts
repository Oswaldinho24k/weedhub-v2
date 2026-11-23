import type { LegalStatusType } from "~/models/legal-status.server";

export const STATUS_LABEL: Record<LegalStatusType, string> = {
  "legal-rec": "Recreativo Legal",
  "legal-med": "Medicinal Legal",
  decriminalized: "Descriminalizado",
  partial: "Varía por estado",
  illegal: "Ilegal",
};

export const STATUS_LABEL_PT: Record<LegalStatusType, string> = {
  "legal-rec": "Recreativo legal",
  "legal-med": "Medicinal legal",
  decriminalized: "Descriminalizado",
  partial: "Varia por estado",
  illegal: "Ilegal",
};

export function statusLabel(s: LegalStatusType, locale?: string) {
  return locale === "pt" ? STATUS_LABEL_PT[s] : STATUS_LABEL[s];
}

// Painted tags per status (Rótulo y Cartulina)
export const STATUS_PILL: Record<LegalStatusType, string> = {
  "legal-rec": "pill lilac",
  "legal-med": "pill accent",
  decriminalized: "pill",
  partial: "pill",
  illegal: "pill active",
};

export const STATUS_PILL_STYLE: Record<LegalStatusType, React.CSSProperties | undefined> = {
  "legal-rec": undefined,
  "legal-med": undefined,
  decriminalized: { background: "var(--fluor-orange)", color: "var(--ink)" },
  partial: { borderStyle: "dashed" },
  illegal: undefined,
};

// Swatch per status, used in legends and the map
export const STATUS_DOT_STYLE: Record<LegalStatusType, React.CSSProperties> = {
  "legal-rec": { background: "var(--fluor-green)", border: "1.5px solid var(--ink)" },
  "legal-med": { background: "var(--fluor-yellow)", border: "1.5px solid var(--ink)" },
  decriminalized: { background: "var(--fluor-orange)", border: "1.5px solid var(--ink)" },
  partial: { background: "#ffffff", border: "1.5px dashed var(--ink)" },
  illegal: { background: "var(--ink)", border: "1.5px solid var(--ink)" },
};

/** Portuguese "in <country>" with the right contraction: no Brasil, na Colômbia, nos Estados Unidos, em Cuba. */
const PT_PREP: Record<string, string> = {
  BR: "no", MX: "no", UY: "no", CL: "no", PE: "no", EC: "no", PY: "no", PA: "no", CA: "no",
  CO: "na", AR: "na", BO: "na", VE: "na", CR: "na", GT: "na", NI: "na", DO: "na", ES: "na", DE: "na", PT: "em",
  US: "nos", HN: "em", SV: "em", CU: "em", PR: "em",
};
export function ptIn(code: string, name: string) {
  return `${PT_PREP[code.toUpperCase()] ?? "em"} ${name}`;
}
