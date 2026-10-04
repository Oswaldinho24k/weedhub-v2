import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "~/lib/utils";

type SubmissionStatus = "pending" | "approved" | "merged_as_alias" | "rejected" | "rejected_auto" | "duplicate";
type ReviewStatus = "published" | "pending" | "hidden" | "rejected";
type BrandTier = "free" | "premium" | "enterprise";
type VerifiedStatus = "verified" | "unverified";

type StatusValue = SubmissionStatus | ReviewStatus | BrandTier | VerifiedStatus | string;

const STATUS_MAP: Record<string, { label: string; style: React.CSSProperties }> = {
  // Submissions
  pending:         { label: "En revisión",         style: { background: "var(--bg-elev)", borderColor: "var(--line)", color: "var(--fg-muted)" } },
  approved:        { label: "Aprobada",             style: { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" } },
  merged_as_alias: { label: "Agregada como alias",  style: { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" } },
  rejected:        { label: "Rechazada",            style: { background: "var(--warm-soft)", borderColor: "var(--warm)", color: "var(--warm)" } },
  rejected_auto:   { label: "Bloqueada",            style: { background: "var(--warm-soft)", borderColor: "var(--warm)", color: "var(--warm)" } },
  duplicate:       { label: "Duplicada",            style: { background: "var(--warm-soft)", borderColor: "var(--warm)", color: "var(--warm)" } },
  // Reviews
  published:       { label: "Publicada",            style: { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" } },
  hidden:          { label: "Oculta",               style: { background: "var(--bg-elev)", borderColor: "var(--line)", color: "var(--fg-dim)" } },
  // Brand tiers
  free:            { label: "Plan Gratuito",        style: { background: "var(--bg-elev)", borderColor: "var(--line)", color: "var(--fg-muted)" } },
  premium:         { label: "Presencia Verificada", style: { background: "color-mix(in oklch, var(--gold) 15%, transparent)", borderColor: "var(--gold)", color: "var(--gold)" } },
  enterprise:      { label: "Destacado",            style: { background: "var(--lilac-soft)", borderColor: "var(--lilac)", color: "var(--lilac)" } },
  // Verification
  verified:        { label: "Verificado ✓",         style: { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" } },
  unverified:      { label: "No verificado",        style: { background: "var(--bg-elev)", borderColor: "var(--line)", color: "var(--fg-dim)" } },
};

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusValue;
  labelOverride?: string;
}

const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, status, labelOverride, ...props }, ref) => {
    const config = STATUS_MAP[status] ?? {
      label: status,
      style: { background: "var(--bg-elev)", borderColor: "var(--line)", color: "var(--fg-muted)" },
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
          className
        )}
        style={config.style}
        {...props}
      >
        {labelOverride ?? config.label}
      </span>
    );
  }
);
StatusPill.displayName = "StatusPill";

export { StatusPill };
export type { StatusValue };
