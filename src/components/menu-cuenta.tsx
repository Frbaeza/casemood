"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { salirDeLaCuenta } from "@/app/(tienda)/cuenta/acciones";
import { IconUser } from "@/components/icons";

const boton =
  "flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl border-2 border-orange/30 bg-white/70 px-3 text-base font-semibold text-ink active:bg-white";
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
      <Link href="/cuenta/entrar" className={`ml-2 ${boton}`}>
        <IconUser className="h-5 w-5 text-orange" />
        Mi cuenta
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative ml-2">
      <button
        type="button"
        aria-expanded={visible}
        aria-controls="menu-cuenta"
        onClick={() => {
          setAbierto(!visible);
          setRutaAbierta(pathname);
        }}
        className={boton}
      >
        <IconUser className="h-5 w-5 text-orange" />
        Mi cuenta
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${visible ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
