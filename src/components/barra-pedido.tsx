"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@/components/icons";
import { subtotalDe, unidadesDe, usePedido } from "@/lib/carrito";
import { formatCLP } from "@/lib/format";

/** Barra fija "Tu pedido" en la tienda (no en el producto, que tiene la suya, ni en el pedido mismo). */
export function BarraPedido() {
  const pedido = usePedido();
  const pathname = usePathname();
  if (pedido.length === 0 || pathname.startsWith("/producto/") || pathname === "/pedido") return null;
  const unidades = unidadesDe(pedido);

  return (
    <div data-fixed-cta className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-[480px] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/pedido"
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-brand px-4 text-white shadow-md active:bg-brand-dark"
        >
          <span className="text-left leading-tight">
            <span className="block text-sm text-white/90">
              Tu pedido · {unidades} {unidades === 1 ? "producto" : "productos"}
            </span>
            <span className="block text-lg font-bold">{formatCLP(subtotalDe(pedido))}</span>
          </span>
          <span className="flex items-center gap-1 text-lg font-bold">
            Ver pedido
            <IconChevronRight className="h-5 w-5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
