import type { ZodError } from "zod";

/** Resultado de una Server Action del admin (lo que ve el cliente). */
export type ActionResult = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  id?: number;
  /** El elemento tiene productos asociados y no se puede eliminar. */
  conProductos?: number;
};

export function errorDeValidacion(error: ZodError): ActionResult {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "general");
    errores[campo] ??= issue.message;
  }
  return { ok: false, mensaje: "Revisa los campos marcados.", errores };
}

export function errorInesperado(e: unknown): ActionResult {
  console.error(e);
  const mensaje = e instanceof Error && e.message === "No autorizado" ? "Tu sesión expiró. Vuelve a entrar." : null;
  return { ok: false, mensaje: mensaje ?? "Algo salió mal. Inténtalo otra vez." };
}

/**
 * Mueve un elemento una posición arriba/abajo dentro de una lista ordenada
 * y devuelve el nuevo orden (1..n) de todos los ids.
 */
export function reordenar(ids: number[], id: number, direccion: "arriba" | "abajo"): number[] | null {
  const i = ids.indexOf(id);
  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const copia = [...ids];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}
