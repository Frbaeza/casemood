/** Fecha de nacimiento de clientes. Seguro para el navegador. */

/** Edad mínima sin autorización de madre, padre o tutor. */
export const EDAD_SIN_TUTOR = 14;

/** Hoy en Chile como "AAAA-MM-DD". */
function hoyChile(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

/** Edad cumplida hoy (en Chile) para una fecha "AAAA-MM-DD". */
export function edad(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  const [ha, hm, hd] = hoyChile().split("-").map(Number);
  return ha - a - (hm < m || (hm === m && hd < d) ? 1 : 0);
}

/** Mensaje de error, o null si la fecha "AAAA-MM-DD" es válida. */
export function errorFechaNacimiento(fecha: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "Escribe tu fecha de nacimiento.";
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return "Esa fecha no existe.";
  if (fecha > hoyChile()) return "La fecha no puede ser futura.";
  const anios = edad(fecha);
  if (anios > 110) return "Revisa el año de nacimiento.";
  if (anios < 5) return "Revisa el año de nacimiento.";
  return null;
}

/** Date guardada (columna DATE) → "AAAA-MM-DD". */
export function aTexto(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** "AAAA-MM-DD" → Date para guardar (medianoche UTC; la columna es solo fecha). */
export function aFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

/** "15 de marzo de 1995". */
export function fechaLarga(fecha: Date): string {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(fecha);
}
