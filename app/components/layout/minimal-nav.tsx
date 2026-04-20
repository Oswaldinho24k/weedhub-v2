import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import type { Theme } from "~/lib/theme.server";

interface MinimalNavProps {
  theme: Theme;
  right?: React.ReactNode;
}

export function MinimalNav({ theme, right }: MinimalNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklch,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-6 h-14 flex items-center justify-between">
        <Logo size={18} />
        <div className="flex items-center gap-3">
          {right}
          <ThemeToggle theme={theme} />
        </div>
      </div>
    </header>
  );
}
