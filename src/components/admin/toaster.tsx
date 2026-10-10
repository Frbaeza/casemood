"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; mensaje: string; tipo: "ok" | "error" };
type Listener = (t: Toast) => void;

const listeners = new Set<Listener>();
let siguiente = 1;

/** Muestra un aviso abajo de la pantalla. Se puede llamar desde cualquier componente cliente. */
export function toast(mensaje: string, tipo: Toast["tipo"] = "ok") {
  const t = { id: siguiente++, mensaje, tipo };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const l: Listener = (t) => {
      setToasts((prev) => [...prev.slice(-2), t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), t.tipo === "error" ? 7000 : 3500);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      // Sobre la navegación inferior y la barra de "Guardar" del formulario.
      className="pointer-events-none fixed inset-x-0 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[480px] flex-col gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tipo === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-base font-semibold text-white shadow-lg ${
            t.tipo === "error" ? "bg-danger" : "bg-ink"
          }`}
        >
          <span aria-hidden className="text-xl leading-6">
            {t.tipo === "error" ? "⚠" : "✓"}
          </span>
          <span className="flex-1">{t.mensaje}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="-my-1 min-h-8 rounded-lg px-2 text-sm underline"
          >
            Cerrar
          </button>
        </div>
      ))}
    </div>
  );
}
