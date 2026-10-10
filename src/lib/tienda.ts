/**
 * Apariencia configurable de la tienda (admin → Tienda). Seguro para el navegador.
 * Cada paleta reemplaza los colores de marca de globals.css; todas mantienen texto blanco
 * legible sobre "brand" (contraste ≥ 4,5:1, igual o mejor que el naranjo original).
 */
export const PALETAS = {
  naranjo: { nombre: "Naranjo (original)", orange: "#d85722", brand: "#b8461b", brandDark: "#963815", brandSoft: "#fdeee6", blush: "#f4c9c4" },
  rosado: { nombre: "Rosado", orange: "#d23f7a", brand: "#b02a62", brandDark: "#8d214e", brandSoft: "#fdebf2", blush: "#f7c6d9" },
  morado: { nombre: "Morado", orange: "#8250c8", brand: "#6b3fae", brandDark: "#56318d", brandSoft: "#f3edfb", blush: "#dccbf2" },
  azul: { nombre: "Azul", orange: "#2f6fc4", brand: "#1f5ca8", brandDark: "#194a87", brandSoft: "#e9f1fc", blush: "#c6dbf5" },
  turquesa: { nombre: "Turquesa", orange: "#14868a", brand: "#0f6e71", brandDark: "#0b5658", brandSoft: "#e2f3f3", blush: "#bfe5e3" },
  grafito: { nombre: "Grafito", orange: "#45403b", brand: "#2f2b28", brandDark: "#1c1a18", brandSoft: "#efedea", blush: "#d9d4cd" },
} as const;

export type ClavePaleta = keyof typeof PALETAS;
export const PALETA_POR_DEFECTO: ClavePaleta = "naranjo";

export function paleta(clave: string) {
  return PALETAS[(clave in PALETAS ? clave : PALETA_POR_DEFECTO) as ClavePaleta];
}

/** CSS que aplica la paleta (se inyecta en el <head>; :root:root gana a los valores de @theme). */
export function cssPaleta(clave: string): string {
  const p = paleta(clave);
  return `:root:root{--color-orange:${p.orange};--color-brand:${p.brand};--color-brand-dark:${p.brandDark};--color-brand-soft:${p.brandSoft};--color-blush:${p.blush}}`;
}

/** Logo original (en public/). */
export const LOGO_ORIGINAL = "/logo-v2-160.png";

/** Configuración ya resuelta (con valores por defecto y variables de entorno aplicadas). */
export type Tienda = {
  nombre: string;
  frase: string;
  color: ClavePaleta;
  /** URL del logo (propio en R2 o el original). */
  logo: string;
  logoKey: string | null;
  whatsapp: string;
  instagram: string;
  aviso: string | null;
  mostrarCotizador: boolean;
  mostrarDisenador: boolean;
  comunaOrigen: string;
};
