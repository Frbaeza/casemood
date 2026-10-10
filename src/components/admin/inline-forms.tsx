"use client";

import { useState } from "react";

const campo = "min-h-12 min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none";
const botonPrimario = "min-h-12 shrink-0 rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-50";

/** Input + botón "Guardar" que solo se habilita si el nombre cambió. Usar con key={valor}. */
export function NombreEditable({
  valor,
  onGuardar,
  disabled,
  etiqueta,
}: {
  valor: string;
  onGuardar: (n: string) => void;
  disabled?: boolean;
  etiqueta: string;
}) {
  const [texto, setTexto] = useState(valor);
  const cambiado = texto.trim() !== valor && texto.trim().length > 0;
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (cambiado) onGuardar(texto.trim());
      }}
    >
      <input aria-label={etiqueta} value={texto} onChange={(e) => setTexto(e.target.value)} className={campo} />
      <button type="submit" disabled={!cambiado || disabled} className={botonPrimario}>
        Guardar
      </button>
    </form>
  );
}

/** Input + botón para crear un elemento nuevo. */
export function AgregarForm({
  placeholder,
  boton,
  onAgregar,
  disabled,
}: {
  placeholder: string;
  boton: string;
  onAgregar: (n: string) => void;
  disabled?: boolean;
}) {
  const [texto, setTexto] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!texto.trim()) return;
        onAgregar(texto.trim());
        setTexto("");
      }}
    >
      <input
        aria-label={placeholder}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        className={campo}
      />
      <button type="submit" disabled={!texto.trim() || disabled} className={botonPrimario}>
        {boton}
      </button>
    </form>
  );
}
