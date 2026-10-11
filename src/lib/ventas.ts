/** Opciones y utilidades de ventas. Seguro para el navegador. */

export const MEDIOS_PAGO = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  otro: "Otro",
} as const;
export type MedioPago = keyof typeof MEDIOS_PAGO;

export const CANALES = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  presencial: "En persona",
  otro: "Otro",
} as const;
export type Canal = keyof typeof CANALES;

/** Nombre que se muestra cuando la venta no tiene cliente asociado. */
export const CLIENTE_GENERICO = "Cliente genérico";

export const ZONA_HORARIA = "America/Santiago";

/** Diferencia (ms) entre la hora de Chile y UTC en ese instante (negativa: Chile va atrás). */
function desfaseChile(instante: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_HORARIA,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instante)
      .map((x) => [x.type, x.value]),
  );
  const comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return comoUtc - Math.floor(instante.getTime() / 1000) * 1000;
}

/** Instante UTC de una fecha y hora "de reloj" en Chile. */
export function horaChile(anio: number, mes: number, dia: number, hora = 0, minuto = 0): Date {
  const comoUtc = Date.UTC(anio, mes - 1, dia, hora, minuto);
  // Dos pasadas por si el cambio de horario cae justo en medio.
  const primera = comoUtc - desfaseChile(new Date(comoUtc));
  return new Date(comoUtc - desfaseChile(new Date(primera)));
}

/** "2026-10-11" (día en Chile) de un instante. */
export function diaChile(instante: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(instante);
}

/** Instante de las 00:00 en Chile del día "AAAA-MM-DD" (+ días). */
export function inicioDiaChile(dia: string, sumarDias = 0): Date {
  const [a, m, d] = dia.split("-").map(Number);
  const base = new Date(Date.UTC(a, m - 1, d + sumarDias));
  return horaChile(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

/** Fecha corta para mostrar: "11 oct 2026". */
export function fechaCorta(instante: Date): string {
  return new Intl.DateTimeFormat("es-CL", { timeZone: ZONA_HORARIA, day: "numeric", month: "short", year: "numeric" })
    .format(instante)
    .replace(".", "");
}
