"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActionResult } from "@/lib/admin-utils";
import { toast } from "./toaster";

/**
 * Ejecuta una Server Action, muestra el aviso (toast) y refresca los datos de la página.
 * Devuelve el resultado para casos especiales (p. ej. "tiene productos asociados").
 */
export function useAccion() {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function ejecutar(
    accion: () => Promise<ActionResult>,
    opciones: { silenciosa?: boolean; alTerminar?: (r: ActionResult) => void } = {},
  ) {
    startTransition(async () => {
      const r = await accion();
      if (r.ok) {
        if (r.mensaje && !opciones.silenciosa) toast(r.mensaje);
        router.refresh();
      } else if (!r.conProductos) {
        const detalle = r.errores ? Object.values(r.errores)[0] : undefined;
        toast(detalle ?? r.mensaje ?? "No se pudo completar.", "error");
      }
      opciones.alTerminar?.(r);
    });
  }

  return { ejecutar, pendiente };
}
