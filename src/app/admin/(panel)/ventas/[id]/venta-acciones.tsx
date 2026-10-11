"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAccion } from "@/components/admin/use-accion";
import { CLIENTE_GENERICO } from "@/lib/ventas";
import { anularVenta, asignarCliente, buscarClientes } from "../actions";
import { useBusqueda } from "../use-busqueda";

const campo =
  "min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none";

/** Cambiar el cliente de la venta (p. ej. de "Cliente genérico" a quien después creó su cuenta). */
export function ReasignarCliente({ ventaId, tieneCliente }: { ventaId: number; tieneCliente: boolean }) {
  const { ejecutar, pendiente } = useAccion();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const clientes = useBusqueda(texto, buscarClientes);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 font-semibold">
        {tieneCliente ? "Cambiar cliente" : "Asignar a un cliente"}
      </button>
    );
  }

  const elegir = (clienteId: number | null) =>
    ejecutar(() => asignarCliente(ventaId, clienteId), {
      alTerminar: (r) => {
        if (r.ok) {
          setAbierto(false);
          setTexto("");
        }
      },
    });

  return (
    <div className="space-y-2 rounded-2xl bg-surface p-3">
      <input
        type="search"
        autoFocus
        aria-label="Buscar cliente"
        placeholder="Buscar por nombre, correo o teléfono"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className={campo}
      />
      {clientes.buscando && <p className="text-sm text-ink-soft">Buscando…</p>}
      {clientes.lista.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border-2 border-line bg-white">
          {clientes.lista.map((c) => (
            <li key={c.id}>
              <button type="button" disabled={pendiente} onClick={() => elegir(c.id)} className="flex min-h-14 w-full flex-col justify-center px-3 py-2 text-left active:bg-surface disabled:opacity-50">
                <span className="text-base font-semibold">{c.nombre}</span>
                <span className="text-sm text-ink-soft">{c.email ?? c.telefono ?? "—"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-ink-soft">¿No está? Créalo en Clientes y vuelve aquí.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="min-h-12 rounded-xl border-2 border-line bg-white px-4 font-semibold">
          Cancelar
        </button>
        {tieneCliente && (
          <button type="button" disabled={pendiente} onClick={() => elegir(null)} className="min-h-12 flex-1 rounded-xl border-2 border-line bg-white px-3 font-semibold disabled:opacity-50">
            Dejar como {CLIENTE_GENERICO.toLowerCase()}
          </button>
        )}
      </div>
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
