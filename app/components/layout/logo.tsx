import { Link } from "react-router";

interface LogoProps {
  size?: number;
  to?: string;
}

export function Logo({ size = 22, to = "/" }: LogoProps) {
  return (
    <Link to={to} className="inline-flex items-center group">
      <span className="display" style={{ fontSize: size, letterSpacing: "-0.02em" }}>
        weed
        <span
          className="display-wonk"
          style={{ color: "var(--accent)", fontStyle: "italic" }}
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
