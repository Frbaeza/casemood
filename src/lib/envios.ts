/**
 * Tallas de paquete de Blue Express que ofrecemos (la primera es la de por defecto). Seguro para el navegador.
 * Pesos máximos según el calculador de talla de app.bluex.cl (2026-10-10).
 */
export const TALLAS = [
  { clave: "XS", ayuda: "hasta 0,5 kg" },
  { clave: "S", ayuda: "hasta 3 kg" },
] as const;

export type Talla = (typeof TALLAS)[number]["clave"];

/** Datos que el cotizador del footer necesita por región. */
export type RegionCotizable = {
  id: number;
  nombre: string;
  zona: string;
  punto: Record<Talla, number>;
  domicilio: Record<Talla, number>;
};
