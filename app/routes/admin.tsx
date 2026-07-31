import { Link, Outlet, useLocation } from "react-router";
import { useState, useRef } from "react";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth.server";
import { Icon, type IconName } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Admin — WeedHub" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return null;
}

const NAV_ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: "settings", end: true },
  { to: "/admin/strains", label: "Cepas", icon: "leaf" },
  { to: "/admin/reviews", label: "Reseñas", icon: "edit" },
  { to: "/admin/submissions", label: "Sugerencias", icon: "plus" },
  { to: "/admin/effects", label: "Efectos", icon: "sparkle" },
  { to: "/admin/users", label: "Usuarios", icon: "users" },
  { to: "/admin/product-categories", label: "Categorías", icon: "grid" },
  { to: "/admin/brands", label: "Marcas", icon: "diamond" },
  { to: "/admin/products", label: "Productos", icon: "bolt" },
  { to: "/admin/dispensaries", label: "Dispensarios", icon: "map" },
  { to: "/admin/legal-status", label: "Mapa Verde", icon: "globe" },
  { to: "/admin/glossary", label: "Glosario", icon: "book" },
  { to: "/admin/articles", label: "Artículos", icon: "book" },
];

export default function AdminLayout() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="kicker mb-1">Panel de administración</div>
          <h1 className="display text-4xl flex items-center gap-3">
            <Icon name="crown" size={28} className="text-accent" />
            Administración
          </h1>
        </div>
        <button
          onClick={() => setChatOpen((v) => !v)}
          className={cn(
            "btn text-sm flex items-center gap-2 mt-2",
            chatOpen ? "btn-primary" : "btn-ghost"
          )}
          title="Asistente AI"
        >
          <Icon name="sparkle" size={15} />
          AI
        </button>
      </div>

      <nav className="flex gap-2 mb-10 border-b border-line overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== "/admin";
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 text-sm relative transition-colors whitespace-nowrap",
                isActive ? "text-fg" : "text-fg-muted hover:text-fg"
              )}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("flex gap-6", chatOpen ? "items-start" : "")}>
        <div className={cn("min-w-0", chatOpen ? "flex-1" : "w-full")}>
          <Outlet />
        </div>
        {chatOpen && <AdminChat onClose={() => setChatOpen(false)} />}
      </div>
    </div>
  );
}

type ChatMsg = { role: "user" | "assistant"; text: string; tools?: string[] };

function AdminChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: ChatMsg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.text })) }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text || data.error || "Sin respuesta",
          tools: data.executedTools?.map((t: { name: string }) => t.name),
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error de conexión." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div
      className="shrink-0 w-80 card flex flex-col"
      style={{ height: "calc(100vh - 220px)", position: "sticky", top: "6rem" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon name="sparkle" size={14} className="text-accent" />
          Asistente AI
        </div>
        <button onClick={onClose} className="btn btn-ghost !p-1">
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-fg-dim space-y-2">
            <p>Ejemplos de lo que puedes preguntar:</p>
            {[
              "¿Cuántas cepas hay en total?",
              "Busca la cepa Blue Dream",
              "Lista los efectos positivos",
              "¿Cuántos usuarios hay de México?",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="block w-full text-left px-2 py-1.5 rounded text-xs hover:bg-bg-elev transition-colors"
                style={{ color: "var(--accent)" }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("text-sm", msg.role === "user" ? "text-right" : "")}>
            <div
              className={cn(
                "inline-block px-3 py-2 rounded-lg max-w-[95%] text-left whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-bg-elev text-fg"
              )}
            >
              {msg.text}
            </div>
            {msg.tools && msg.tools.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {msg.tools.map((t) => (
                  <span key={t} className="mono text-xs text-fg-dim px-1.5 py-0.5 bg-bg-elev rounded">
                    ✓ {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-fg-dim animate-pulse">Pensando…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Pregunta algo…"
          disabled={loading}
          className="flex-1 text-sm px-3 py-2 rounded-md border border-line bg-bg-raised focus:outline-none focus:border-accent"
          style={{ color: "var(--fg)" }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn btn-primary !py-2 !px-3 text-xs"
        >
          <Icon name="arrowRight" size={14} />
        </button>
      </div>
    </div>
  );
}
