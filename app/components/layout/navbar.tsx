import { featureOn } from "~/lib/features";
import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Icon } from "~/components/ui/icon";
import { useT, useHref } from "~/lib/i18n-context";
import type { Theme } from "~/lib/theme.server";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";

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
        ...(featureOn("top100") ? [{ to: href("/top-100"), label: t.nav.top100 }] : []),
        ...(featureOn("porCondicion") ? [{ to: href("/para"), label: t.nav.conditions }] : []),
        ...(featureOn("recomendador") ? [{ to: "/recomendar", label: t.nav.findMyStrain }] : []),
      ],
    },
    {
      label: t.nav.learn,
      items: [
        ...(featureOn("magazine") ? [{ to: "/magazine", label: t.nav.magazine }] : []),
        { to: href("/guias"), label: t.nav.guides },
        { to: href("/glosario"), label: t.nav.glossary },
        { to: href("/mapa-verde"), label: t.nav.greenMap },
      ],
    },
    ...(featureOn("foro") ? [{ label: t.nav.community, to: "/comunidad" }] : []),
    { label: "Mapa Verde", to: href("/mapa-verde") },
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
    <header className="sticky top-0 z-40 wall--ink">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          <Logo size={20} />

          <nav ref={navRef} className="hidden md:flex items-center gap-0.5">
            {NAV_GROUPS.map((group) => {
              const isOpen = openGroup === group.label;

              if (!group.items) {
                return (
                  <Link
                    key={group.label}
                    to={group.to!}
                    className="nav-link px-3 py-2"
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
                      className="nav-link pl-3 pr-1 py-2"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        "nav-link pl-3 pr-1 py-2",
                        isOpen && "!text-yellow"
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
                      isOpen ? "text-yellow" : "text-enamel/70 hover:text-yellow"
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
                        background: "var(--fluor-yellow)",
                        border: "2px solid var(--ink)",
                        borderRadius: "2px",
                        color: "var(--ink)",
                      }}
                    >
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          onClick={() => setOpenGroup(null)}
                          className="flex items-center px-3 py-2 text-[15px] font-bold [font-stretch:85%] hover:bg-ink hover:text-yellow transition-colors"
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => navigate(href("/strains?focus=search"))}
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-[3px] border-2 border-enamel/60 text-enamel text-[13px] font-bold uppercase [font-stretch:80%] hover:bg-yellow hover:text-ink hover:border-yellow transition-colors"
              aria-label={t.nav.search}
            >
              <Icon name="search" size={14} />
              <span className="hidden lg:inline">{t.nav.search}</span>
            </button>

            <LanguageSwitcher />
            <div className="hidden sm:block"><ThemeToggle theme={theme} /></div>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 h-9 px-1 pr-2 rounded-[3px] border-2 border-enamel/60 text-enamel hover:border-yellow transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span
                    className="h-6 w-6 rounded-[2px] bg-elev overflow-hidden flex items-center justify-center text-xs"
                    style={{ color: "var(--accent)" }}
                  >
                    <img
                      src={user.avatar || "/fallback/avatar-default.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <Icon name="chevronDown" size={14} />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="fade-up absolute right-0 top-full mt-2 w-56 card-strong p-1 text-fg z-50"
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
              <Link to="/auth" className={cn(buttonVariants({ variant: "primary" }), "hidden sm:inline-flex !py-1.5 !px-3 !text-[13px] !bg-yellow !text-ink !border-yellow !shadow-none")}>
                {t.nav.start}
              </Link>
            )}

            <button
              type="button"
              className="md:hidden h-9 w-9 grid place-items-center rounded-[3px] border-2 border-enamel/60 text-enamel"
              aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={16} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t-2 border-yellow bg-ink">
          <div className="px-6 py-4 space-y-0.5">
            {NAV_GROUPS.map((group) => {
              const isOpen = openMobileGroup === group.label;

              if (!group.items) {
                return (
                  <Link
                    key={group.label}
                    to={group.to!}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3 text-lg font-extrabold uppercase [font-stretch:78%] text-enamel hover:text-yellow"
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
                    className="w-full flex items-center justify-between px-3 py-3 text-lg font-extrabold uppercase [font-stretch:78%] text-enamel hover:text-yellow"
                  >
                    {group.label}
                    <Icon
                      name="chevronDown"
                      size={13}
                      className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-3 mb-2 border-l-2 border-yellow pl-3 space-y-0.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            setMobileOpen(false);
                            setOpenMobileGroup(null);
                          }}
                          className="block px-2 py-2 text-base font-semibold text-enamel/85 hover:text-yellow"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="px-3 py-3 flex items-center gap-3 text-enamel font-bold"><ThemeToggle theme={theme} /></div>
            {!user && (
              <>
                <hr className="my-2 border-enamel/20" />
                <Link
                  to="/auth"
                  className="block px-3 py-3 text-lg font-extrabold uppercase [font-stretch:78%] text-yellow"
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
