import { Link } from "react-router";

interface LogoProps {
  size?: number;
  to?: string;
}

export function Logo({ size = 22, to = "/" }: LogoProps) {
  return (
    <Link to={to} className="inline-flex items-center group" aria-label="WeedHub, inicio">
      <span className="rotulo inline-flex items-center" style={{ fontSize: size, lineHeight: 1 }}>
        <span className="text-yellow group-hover:text-pink transition-colors">Weed</span>
        <span
          className="ml-[.12em] px-[.18em] pt-[.08em] pb-[.04em] bg-pink text-ink"
          style={{ transform: "rotate(-3deg)", display: "inline-block" }}
        >
          hub
        </span>
      </span>
    </Link>
  );
}

export function LeafGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--accent)" }}
      aria-hidden
    >
      <path d="M12 22V12" />
      <path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7Z" />
      <path d="M12 12c0-4-3-7-7-7 0 4 3 7 7 7Z" />
      <path d="M12 12c1.5 0 3 1 3 3-1.5 0-3-1-3-3Z" />
      <path d="M12 12c-1.5 0-3 1-3 3 1.5 0 3-1 3-3Z" />
    </svg>
  );
}
