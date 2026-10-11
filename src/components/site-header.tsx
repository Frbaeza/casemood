import Link from "next/link";
import { MenuCuenta } from "@/components/menu-cuenta";
import type { Tienda } from "@/lib/tienda";

// WhatsApp e Instagram están en el footer y en el botón fijo de cada producto.
/** `cliente`: nombre del cliente con sesión (null si no entró). */
export function SiteHeader({ tienda, cliente }: { tienda: Tienda; cliente: string | null }) {
  return (
    <header className="sticky top-0 z-30 h-(--header-h) border-b-4 border-orange bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[480px] items-center px-4">
        <Link href="/" className="flex min-h-12 min-w-0 flex-1 items-center gap-3" aria-label={`${tienda.nombre}, ir al inicio`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tienda.logo}
            alt=""
            width={52}
            height={52}
            className="h-13 w-13 shrink-0 rounded-2xl border-2 border-orange/30 bg-cream object-cover"
          />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-[1.65rem] font-bold tracking-tight text-orange">
              {tienda.nombre}
            </span>
            <span className="mt-0.5 block truncate text-sm text-ink-soft">{tienda.frase}</span>
          </span>
        </Link>
        <MenuCuenta nombre={cliente} />
      </div>
    </header>
  );
}
