"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ACTUAL = "casemood:pagina-actual";
const ANTERIOR = "casemood:pagina-anterior";

/** Anota la página anterior dentro de la tienda (para que "Volver" regrese ahí). No muestra nada. */
export function RegistroNavegacion() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const actual = sessionStorage.getItem(ACTUAL);
      if (actual === pathname) return; // recarga de la misma página
      if (actual) sessionStorage.setItem(ANTERIOR, actual);
      sessionStorage.setItem(ACTUAL, pathname);
    } catch {
      // Almacenamiento bloqueado: "Volver" usa su link de respaldo.
    }
  }, [pathname]);
  return null;
}

/** true si se llegó a esta página navegando dentro de la tienda (se puede volver con el historial). */
export function vieneDeLaTienda(): boolean {
  try {
    return window.history.length > 1 && !!sessionStorage.getItem(ANTERIOR);
  } catch {
    return false;
  }
}
