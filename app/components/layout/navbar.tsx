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

type NavSubItem = { to: string; label: string };
type NavGroup = { label: string; to?: string; items?: NavSubItem[] };

export function Navbar({ user, theme }: NavbarProps) {
  const t = useT();
  const href = useHref();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const NAV_GROUPS: NavGroup[] = [
    {
      label: t.nav.strains,
      to: href("/strains"),
      items: [
        { to: href("/strains"), label: t.nav.directory },
        { to: "/top-100", label: t.nav.top100 },
        { to: "/para", label: t.nav.conditions },
      ],
    },
    {
      label: t.nav.learn,
      items: [
        { to: href("/guias"), label: t.nav.guides },
        { to: href("/glosario"), label: t.nav.glossary },
        { to: href("/editorial"), label: t.nav.editorial },
        { to: "/mapa-verde", label: t.nav.greenMap },
      ],
    },
    {
      label: t.nav.community,
      to: href("/community"),
    },
  ];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    if (openGroup) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openGroup]);

  function toggleGroup(label: string) {
    setOpenGroup((prev) => (prev === label ? null : label));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklch,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <Logo size={20} />

          <nav ref={navRef} className="hidden md:flex items-center gap-0.5">
            {NAV_GROUPS.map((group) => {
              const isOpen = openGroup === group.label;

              if (!group.items) {
                return (
                  <Link
                    key={group.label}
                    to={group.to!}
                    className="text-sm text-fg-muted hover:text-fg transition-colors px-3 py-2 rounded-md hover:bg-elev/60"
                  >
                    {group.label}
                  </Link>
                );
              }

              return (
                <div key={group.label} className="relative flex items-center">
                  {group.to ? (
                    <Link
                      to={group.to}
                      className="text-sm text-fg-muted hover:text-fg transition-colors pl-3 pr-1 py-2"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        "text-sm transition-colors pl-3 pr-1 py-2 rounded-l-md",
                        isOpen ? "text-fg" : "text-fg-muted hover:text-fg"
                      )}
                    >
                      {group.label}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "p-2 transition-colors rounded-r-md",
                      isOpen ? "text-fg" : "text-fg-dim hover:text-fg"
                    )}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={`Expandir ${group.label}`}
                  >
                    <Icon
                      name="chevronDown"
                      size={11}
                      className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div
                      role="menu"
                      className="fade-up absolute left-0 top-full mt-1 w-48 p-1 z-50"
                      style={{
                        background: "var(--bg-elev)",
                        border: "1px solid var(--line)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px oklch(0% 0 0 / 0.12)",
                      }}
                    >
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          onClick={() => setOpenGroup(null)}
                          className="flex items-center rounded-lg px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-elev transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={16} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-bg fade-in">
          <div className="px-6 py-4 space-y-0.5">
            {NAV_GROUPS.map((group) => {
              const isOpen = openMobileGroup === group.label;

              if (!group.items) {
                return (
                  <Link
                    key={group.label}
                    to={group.to!}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-elev"
                  >
                    {group.label}
                  </Link>
                );
              }

              return (
                <div key={group.label}>
                  <button
                    type="button"
                    onClick={() => setOpenMobileGroup(isOpen ? null : group.label)}
                    className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-elev"
                  >
                    {group.label}
                    <Icon
                      name="chevronDown"
                      size={13}
                      className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-3 mt-0.5 mb-1 border-l border-line pl-3 space-y-0.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            setMobileOpen(false);
                            setOpenMobileGroup(null);
                          }}
                          className="block rounded-md px-2 py-2 text-sm text-fg-muted hover:text-fg hover:bg-elev"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
