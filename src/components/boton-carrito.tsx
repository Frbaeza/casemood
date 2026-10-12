"use client";

import Link from "next/link";
import { IconCarrito } from "@/components/icons";
import { unidadesDe, usePedido } from "@/lib/carrito";

/** Carrito del encabezado: ícono con la cantidad de productos del pedido. */
export function BotonCarrito() {
  const unidades = unidadesDe(usePedido());
  return (
    <Link
      href="/pedido"
      aria-label={unidades ? `Ver pedido, ${unidades} ${unidades === 1 ? "producto" : "productos"}` : "Ver pedido (vacío)"}
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-orange/30 bg-white/70 text-ink active:bg-white"
    >
      <IconCarrito className="h-6 w-6 text-orange" />
      {unidades > 0 && (
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white ring-2 ring-cream"
        >
          {unidades > 99 ? "99+" : unidades}
        </span>
      )}
    </Link>
  );
}
