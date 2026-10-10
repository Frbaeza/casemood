"use client";

/** Botones Subir/Bajar (más fáciles que arrastrar en el teléfono). */
export function OrdenButtons({
  primero,
  ultimo,
  disabled,
  onMover,
}: {
  primero: boolean;
  ultimo: boolean;
  disabled?: boolean;
  onMover: (direccion: "arriba" | "abajo") => void;
}) {
  const clase = "min-h-11 rounded-lg border-2 border-line bg-white px-3 text-sm font-semibold disabled:opacity-35";
  return (
    <>
      <button type="button" className={clase} disabled={primero || disabled} onClick={() => onMover("arriba")}>
        ↑ Subir
      </button>
      <button type="button" className={clase} disabled={ultimo || disabled} onClick={() => onMover("abajo")}>
        ↓ Bajar
      </button>
    </>
  );
}
