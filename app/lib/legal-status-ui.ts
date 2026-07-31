import type { LegalStatusType } from "~/models/legal-status.server";

export const STATUS_LABEL: Record<LegalStatusType, string> = {
  "legal-rec": "Recreativo Legal",
  "legal-med": "Medicinal Legal",
  decriminalized: "Descriminalizado",
  partial: "Varía por estado",
  illegal: "Ilegal",
};

// Maps to existing .pill modifier classes
export const STATUS_PILL: Record<LegalStatusType, string> = {
  "legal-rec": "pill accent",
  "legal-med": "pill accent",
  decriminalized: "pill warm",
  partial: "pill lilac",
  illegal: "pill",
};

// Inline style override for legal-med to visually distinguish from legal-rec
export const STATUS_PILL_STYLE: Record<LegalStatusType, React.CSSProperties | undefined> = {
  "legal-rec": undefined,
  "legal-med": { color: "var(--accent)", opacity: 0.75 },
  decriminalized: undefined,
  partial: undefined,
  illegal: { opacity: 0.6 },
};

// Small colored dot for use in legends and stat cards (token-based)
export const STATUS_DOT_STYLE: Record<LegalStatusType, React.CSSProperties> = {
  "legal-rec": { background: "var(--accent)" },
  "legal-med": { background: "var(--accent)", opacity: 0.6 },
  decriminalized: { background: "var(--warm)" },
  partial: { background: "var(--lilac)" },
  illegal: { background: "var(--fg-dim)" },
};
