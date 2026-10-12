"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { salirDeLaCuenta } from "@/app/(tienda)/cuenta/acciones";
import { IconUser } from "@/components/icons";

// Solo el ícono de persona (con nombre accesible para lectores de pantalla).
const boton =
  "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-orange/30 bg-white/70 text-ink active:bg-white";
const opcion = "flex min-h-14 w-full items-center px-4 text-left text-base font-semibold text-ink active:bg-surface";

/** "Mi cuenta": sin sesión lleva a entrar; con sesión despliega Mis datos, Historial de compras y Cerrar sesión. */
export function MenuCuenta({ nombre }: { nombre: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [rutaAbierta, setRutaAbierta] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Se cierra solo al cambiar de página.
  const visible = abierto && rutaAbierta === pathname;

  useEffect(() => {
    if (!visible) return;
    const fuera = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [visible]);

  if (nombre === null) {
    return (
      <Link href="/cuenta/entrar" aria-label="Mi cuenta: entrar o crear cuenta" className={boton}>
        <IconUser className="h-6 w-6 text-orange" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={visible}
        aria-controls="menu-cuenta"
        aria-label={`Mi cuenta (${nombre.split(" ")[0]})`}
        onClick={() => {
          setAbierto(!visible);
          setRutaAbierta(pathname);
        }}
        className={boton}
      >
        <IconUser className="h-6 w-6 text-orange" />
        {/* Punto que indica sesión iniciada */}
        <span aria-hidden className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-whatsapp ring-2 ring-cream" />
      </button>
      {visible && (
        <div
          id="menu-cuenta"
          className="absolute top-full right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border-2 border-line bg-white shadow-xl"
        >
          <p className="truncate border-b border-line bg-surface px-4 py-2 text-sm text-ink-soft">Hola, {nombre.split(" ")[0]}</p>
          <ul className="divide-y divide-line">
            <li>
              <Link href="/cuenta/datos" className={opcion}>
                Mis datos
              </Link>
            </li>
            <li>
              <Link href="/cuenta" className={opcion}>
                Historial de compras
              </Link>
            </li>
            <li>
              <form action={salirDeLaCuenta}>
                <button type="submit" className={`${opcion} text-danger`}>
                  Cerrar sesión
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
