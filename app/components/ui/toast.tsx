import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type ToastTone = "neutral" | "accent" | "warm";
type ToastItem = { id: number; message: string; tone: ToastTone };

interface ToastContextValue {
  push: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "neutral") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed left-1/2 bottom-8 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="toast-in pointer-events-auto rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-soft)]"
            style={{
              background:
                t.tone === "accent"
                  ? "var(--accent)"
                  : t.tone === "warm"
                    ? "var(--warm)"
                    : "var(--fg)",
              color:
                t.tone === "accent"
                  ? "var(--accent-ink)"
                  : t.tone === "warm"
                    ? "oklch(20% 0.04 55)"
                    : "var(--bg)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { push: () => {} };
  }
  return ctx;
}
