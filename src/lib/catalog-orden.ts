/** Cómo ordenar listas de productos (parámetro ?orden= de la URL). Seguro para usar en el navegador. */
export const ORDENES = {
  recomendados: "Recomendados",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
  nuevos: "Más nuevos",
} as const;

export type Orden = keyof typeof ORDENES;

export function leerOrden(valor: unknown): Orden {
  return typeof valor === "string" && valor in ORDENES ? (valor as Orden) : "recomendados";
}
