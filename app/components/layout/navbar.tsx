import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

interface NavbarProps {
  user?: {
    _id: string;
    displayName: string;
    avatar?: string;
    role?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              potted_plant
            </span>
            <span className="font-display text-xl font-bold text-white">
              Weed<span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/strains"
              className="text-sm font-medium text-text-muted hover:text-white transition-colors"
            >
              Cepas
            </Link>
            <span className="text-sm font-medium text-text-muted/40 cursor-not-allowed">
              Guías
            </span>
            <span className="text-sm font-medium text-text-muted/40 cursor-not-allowed">
              Comunidad
            </span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => navigate("/strains?focus=search")}
              className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-xl bg-forest-muted border border-forest-accent text-text-muted/60 text-sm hover:border-primary/30 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span className="hidden lg:inline">Buscar cepas...</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-white/5 transition-colors"
                >
                  <Avatar
                    src={user.avatar}
                    fallback={user.displayName.charAt(0).toUpperCase()}
                    size="sm"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-white">
                    {user.displayName}
                  </span>
                  <span className="material-symbols-outlined text-text-muted text-lg">
                    expand_more
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-forest-deep border border-white/10 p-1 shadow-xl z-50"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <span className="material-symbols-outlined text-lg">person</span>
                          Mi Perfil
                        </Link>
                        <Link
                          to="/profile/edit"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <span className="material-symbols-outlined text-lg">settings</span>
                          Editar Perfil
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                            Admin
                          </Link>
                        )}
                        <div className="my-1 h-px bg-white/10" />
                        <form action="/logout" method="post">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">logout</span>
                            Cerrar Sesión
                          </button>
                        </form>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-text-muted hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className="material-symbols-outlined">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden border-t border-white/5 bg-background-dark/95 backdrop-blur-xl z-50 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="px-6 py-4 space-y-2"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                to="/strains"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                Cepas
              </Link>
              <span className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted/40">
                Guías (próximamente)
              </span>
              <span className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted/40">
                Comunidad (próximamente)
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
