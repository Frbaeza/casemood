"use client";

import { useState } from "react";
import { CLIENTE_GENERICO } from "@/lib/ventas";
import { buscarClientes, type ClienteOpcion } from "./actions";
import { useBusqueda } from "./use-busqueda";

/**
 * Elegir cliente: sin texto solo se ofrece "Cliente genérico" (no se carga la lista completa);
 * al escribir 2 o más letras aparecen los clientes más parecidos (máximo 20).
 */
export function SelectorCliente({
  onElegir,
  deshabilitado = false,
  conGenerico = true,
}: {
  onElegir: (cliente: ClienteOpcion | null) => void;
  deshabilitado?: boolean;
  conGenerico?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const { lista, buscando } = useBusqueda(texto, buscarClientes, 2);
  const corto = texto.trim().length < 2;
  const opcion = "flex min-h-14 w-full flex-col justify-center px-3 py-2 text-left active:bg-surface disabled:opacity-50";

  return (
    <div className="space-y-2">
      <input
        type="search"
        aria-label="Filtrar clientes"
        placeholder="Buscar cliente por nombre o correo"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
        className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none"
      />
      <ul className="max-h-80 divide-y divide-line overflow-y-auto overscroll-contain rounded-2xl border-2 border-line bg-white" aria-busy={buscando}>
        {conGenerico && corto && (
          <li>
            <button type="button" disabled={deshabilitado} onClick={() => onElegir(null)} className={opcion}>
              <span className="text-base font-semibold">{CLIENTE_GENERICO}</span>
              <span className="text-sm text-ink-soft">Para quien no tiene cuenta en la tienda</span>
            </button>
          </li>
        )}
        {lista.map((c) => (
          <li key={c.id}>
            <button type="button" disabled={deshabilitado} onClick={() => onElegir(c)} className={opcion}>
              <span className="text-base font-semibold">{c.nombre}</span>
              <span className="text-sm break-all text-ink-soft">{c.email ?? c.telefono ?? "—"}</span>
            </button>
          </li>
        ))}
        {corto && <li className="px-3 py-3 text-base text-ink-soft">Escribe al menos 2 letras para buscar un cliente con cuenta.</li>}
        {buscando && lista.length === 0 && <li className="px-3 py-3 text-base text-ink-soft">Buscando…</li>}
        {!corto && !buscando && lista.length === 0 && (
          <li className="px-3 py-3 text-base text-ink-soft">Ningún cliente coincide con “{texto.trim()}”.</li>
        )}
      </ul>
    </div>
  );
}
