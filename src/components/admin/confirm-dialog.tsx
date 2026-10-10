"use client";

import { useEffect, useRef } from "react";

/** Diálogo modal de confirmación con botones grandes. */
export function ConfirmDialog({
  abierto,
  titulo,
  children,
  confirmar,
  cancelar = "Cancelar",
  peligro = false,
  ocupado = false,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  children?: React.ReactNode;
  confirmar: string;
  /** null = sin botón de cancelar (avisos informativos). */
  cancelar?: string | null;
  peligro?: boolean;
  ocupado?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 className="font-display text-2xl leading-tight font-bold">{titulo}</h2>
        {children && <div className="mt-3 text-lg text-ink-soft">{children}</div>}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className={`min-h-14 rounded-2xl px-4 text-lg font-bold text-white disabled:opacity-60 ${
              peligro ? "bg-danger" : "bg-brand"
            }`}
          >
            {ocupado ? "Un momento…" : confirmar}
          </button>
          {cancelar !== null && (
            <button
              type="button"
              onClick={onCerrar}
              className="min-h-14 rounded-2xl border-2 border-line px-4 text-lg font-semibold"
            >
              {cancelar}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
