import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Icon } from "~/components/ui/icon";
import { useT, useHref } from "~/lib/i18n-context";
import type { Theme } from "~/lib/theme.server";
import { cn } from "~/lib/utils";

interface NavbarProps {
  user?: {
    _id: string;
    username?: string;
    displayName: string;
    avatar?: string;
    role?: string;
  } | null;
  theme: Theme;
}

export function Navbar({ user, theme }: NavbarProps) {
  const t = useT();
  const href = useHref();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navLinks = [
    { to: href("/strains"), label: t.nav.directory },
    { to: href("/community"), label: t.nav.community },
    { to: href("/editorial"), label: t.nav.editorial },
  ];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklch,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <Logo size={20} />

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-fg-muted hover:text-fg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(href("/strains?focus=search"))}
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-full border border-line text-fg-dim text-xs hover:border-line-strong transition-colors"
              aria-label={t.nav.search}
            >
              <Icon name="search" size={14} />
              <span className="hidden lg:inline">{t.nav.search}</span>
            </button>

            <LanguageSwitcher />
            <ThemeToggle theme={theme} />

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 h-9 px-1.5 pr-2 rounded-full border border-line hover:border-line-strong transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span
                    className="h-7 w-7 rounded-full bg-elev overflow-hidden flex items-center justify-center text-xs"
                    style={{ color: "var(--accent)" }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      user.displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <Icon name="chevronDown" size={14} className="text-fg-dim" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="fade-up absolute right-0 top-full mt-2 w-56 card-strong p-1 shadow-[var(--shadow-soft)] z-50"
                  >
                    {user.username && (
                      <div className="px-3 py-2 border-b border-line">
                        <div className="kicker">{t.nav.session}</div>
                        <div className="text-sm font-medium mt-0.5">@{user.username}</div>
                      </div>
                    )}
                    <MenuItem to="/profile" icon="user" onClick={() => setMenuOpen(false)}>
                      {t.nav.myProfile}
                    </MenuItem>
                    {user.username && (
                      <MenuItem
                        to={`/profile/${user.username}`}
                        icon="eye"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t.nav.publicProfile}
                      </MenuItem>
                    )}
                    <MenuItem to="/profile/saved" icon="bookmark" onClick={() => setMenuOpen(false)}>
                      {t.nav.savedStrains}
                    </MenuItem>
                    <MenuItem to="/profile/edit" icon="settings" onClick={() => setMenuOpen(false)}>
                      {t.nav.editProfile}
                    </MenuItem>
                    {user.role === "admin" && (
                      <MenuItem to="/admin" icon="crown" onClick={() => setMenuOpen(false)}>
                        {t.nav.admin}
                      </MenuItem>
                    )}
                    <hr className="hrule my-1" />
                    <form action="/logout" method="post">
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-warm hover:bg-elev transition-colors"
                      >
                        <Icon name="logout" size={14} />
                        {t.nav.logout}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="hidden sm:inline-flex btn btn-primary !py-2 !px-4 text-xs">
                {t.nav.start}
              </Link>
            )}

            <button
              type="button"
              className="md:hidden h-9 w-9 grid place-items-center rounded-full border border-line text-fg-muted"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={16} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-bg fade-in">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-elev"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <hr className="hrule my-2" />
                <Link
                  to="/auth"
                  className="block rounded-md px-3 py-2 text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {t.nav.start}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: "user" | "settings" | "crown" | "bookmark" | "eye";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-elev hover:text-fg transition-colors"
      )}
    >
      <Icon name={icon} size={14} />
      {children}
    </Link>
  );
}
