"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAccion } from "@/components/admin/use-accion";
import { anularVenta, asignarCliente } from "../actions";
import { SelectorCliente } from "../selector-cliente";

/** Cambiar el cliente de la venta (p. ej. de "Cliente genérico" a quien después creó su cuenta). */
export function ReasignarCliente({ ventaId, tieneCliente }: { ventaId: number; tieneCliente: boolean }) {
  const { ejecutar, pendiente } = useAccion();
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 font-semibold">
        {tieneCliente ? "Cambiar cliente" : "Asignar a un cliente"}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl bg-surface p-3">
      <SelectorCliente
        conGenerico={tieneCliente}
        deshabilitado={pendiente}
        onElegir={(c) => ejecutar(() => asignarCliente(ventaId, c?.id ?? null), { alTerminar: (r) => r.ok && setAbierto(false) })}
      />
      <button type="button" onClick={() => setAbierto(false)} className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 font-semibold">
        Cancelar
      </button>
    </div>
  );
}

export function AnularVenta({ ventaId }: { ventaId: number }) {
  const { ejecutar, pendiente } = useAccion();
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="min-h-12 w-full rounded-xl border-2 border-danger/30 px-3 font-semibold text-danger">
        Anular venta
      </button>
      <ConfirmDialog
        abierto={abierto}
        titulo="¿Anular esta venta?"
        confirmar="Sí, anular"
        peligro
        ocupado={pendiente}
        onConfirmar={() => ejecutar(() => anularVenta(ventaId), { alTerminar: () => setAbierto(false) })}
        onCerrar={() => setAbierto(false)}
      >
        No se borra: queda en el historial marcada como anulada y no cuenta en los totales. Las unidades vuelven al
        stock.
      </ConfirmDialog>
    </>
  );
}
