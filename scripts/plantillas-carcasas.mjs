/**
 * Convierte las plantillas de sublimación (SVG) en contornos livianos para el "Diseña tu carcasa".
 *   node scripts/plantillas-carcasas.mjs "D:/Sublimacion/Carcasas"
 * Escribe public/carcasas/<slug-de-variante>.json con { x, y, w, h, alto, d }:
 * d es el contorno imprimible (en puntos, como la plantilla) y x/y/w/h su caja.
 * Cada plantilla trae 3 copias del contorno: se usa la más grande (la de más a la izquierda si empatan).
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// Carpeta de la plantilla → variantes de la tienda que la usan.
const VARIANTES = {
  "iPhone 11": ["iphone-11"],
  "iPhone 11 Pro": ["iphone-11-pro"],
  "iPhone 11 Pro Max": ["iphone-11-pro-max"],
  "iPhone 12 Mini": ["iphone-12-mini"],
  "iPhone 12 - 12 Pro": ["iphone-12", "iphone-12-pro"],
  "iPhone 12 Pro Max": ["iphone-12-pro-max"],
  "iPhone 13 Mini": ["iphone-13-mini"],
  "iPhone 13": ["iphone-13"],
  "iPhone 13 Pro": ["iphone-13-pro"],
  "iPhone 13 Pro Max": ["iphone-13-pro-max"],
  "iPhone 14": ["iphone-14"],
  "iPhone 14 Plus": ["iphone-14-plus"],
  "iPhone 14 Pro": ["iphone-14-pro"],
  "iPhone 14 Pro Max": ["iphone-14-pro-max"],
  "iPhone 15": ["iphone-15"],
  "iPhone 15 Plus": ["iphone-15-plus"],
  "iPhone 15 Pro": ["iphone-15-pro"],
  "iPhone 15 Pro Max": ["iphone-15-pro-max"],
  "iPhone 16": ["iphone-16"],
  "iPhone 16 Plus": ["iphone-16-plus"],
  "iPhone 16 Pro": ["iphone-16-pro"],
  "iPhone 16 Pro Max": ["iphone-16-pro-max"],
  "iPhone 17": ["iphone-17"],
  "iPhone 17 Air": ["iphone-17-air"],
  "iPhone 17 Pro": ["iphone-17-pro"],
  "iPhone 17 Pro Max": ["iphone-17-pro-max"],
};

// En estos la zona imprimible queda bajo la meseta de cámaras: el cuerpo del teléfono es más alto.
// Proporción alto/ancho del teléfono real (Apple: 17 Pro 150 × 71,9 mm; Pro Max 163,4 × 78 mm; Air 156,2 × 74,7 mm).
const PROPORCION_CUERPO = { "iPhone 17 Pro": 150 / 71.9, "iPhone 17 Pro Max": 163.4 / 78, "iPhone 17 Air": 156.2 / 74.7 };

/** Puntos (extremos y de control) de un path SVG, en coordenadas absolutas. Basta para la caja. */
function puntosDePath(d) {
  const t = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e-?\d+)?/g) ?? [];
  const pts = [];
  let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0;
  const n = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const par = () => { let a = n(), b = n(); if (rel) { a += x; b += y; } pts.push([a, b]); return [a, b]; };
    if (C === "Z") { x = sx; y = sy; }
    else if (C === "M" || C === "L" || C === "T") { [x, y] = par(); if (C === "M") { sx = x; sy = y; cmd = rel ? "l" : "L"; } }
    else if (C === "H") { const a = n(); x = rel ? x + a : a; pts.push([x, y]); }
    else if (C === "V") { const b = n(); y = rel ? y + b : b; pts.push([x, y]); }
    else if (C === "C") { par(); par(); [x, y] = par(); }
    else if (C === "S" || C === "Q") { par(); [x, y] = par(); }
    else if (C === "A") { n(); n(); n(); n(); n(); [x, y] = par(); }
    else throw new Error(`Comando de path no soportado: ${cmd}`);
  }
  return pts;
}

function formas(svg) {
  return [...svg.matchAll(/<(path|polygon)\b([^>]*?)\/?>/gs)].flatMap((m) => {
    const attr = (k) => m[2].match(new RegExp(`[ \\t\\r\\n]${k}="([^"]*)"`))?.[1];
    const crudo = m[1] === "path" ? attr("d") : attr("points") && `M${attr("points").trim()}Z`;
    if (!crudo) return [];
    const d = crudo.replace(/\s+/g, " ").trim();
    const pts = puntosDePath(d);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return [{ d, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }];
  });
}

const raiz = process.argv[2];
if (!raiz) throw new Error('Uso: node scripts/plantillas-carcasas.mjs "D:/Sublimacion/Carcasas"');
const archivos = [];
(function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (n === "SVG.svg") archivos.push(p);
  }
})(raiz);

const salida = join(import.meta.dirname, "..", "public", "carcasas");
mkdirSync(salida, { recursive: true });
let escritos = 0;
for (const archivo of archivos) {
  const nombre = basename(dirname(archivo));
  const slugs = VARIANTES[nombre];
  if (!slugs) continue;
  // Contorno: la forma vertical más grande (el marco de la hoja es horizontal y queda fuera).
  const [f] = formas(readFileSync(archivo, "utf8"))
    .filter((f) => f.h > f.w * 1.3)
    .sort((a, b) => Math.round(b.w * b.h - a.w * a.h) || a.x - b.x);
  if (!f) throw new Error(`Sin contorno en ${archivo}`);
  const r = (v) => Math.round(v * 100) / 100;
  const alto = r(Math.max(f.h, f.w * (PROPORCION_CUERPO[nombre] ?? 0)));
  const json = JSON.stringify({ x: r(f.x), y: r(f.y), w: r(f.w), h: r(f.h), alto, d: f.d });
  for (const slug of slugs) writeFileSync(join(salida, `${slug}.json`), json);
  console.log(`${nombre.padEnd(20)} ${f.w.toFixed(0)}×${f.h.toFixed(0)} (cuerpo ${alto.toFixed(0)}) → ${slugs.join(", ")}`);
  escritos += slugs.length;
}
console.log(`${escritos} contornos en public/carcasas/`);

// Lista para la app: qué variantes se pueden personalizar.
const disponibles = readdirSync(salida).filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)).sort();
writeFileSync(
  join(import.meta.dirname, "..", "src", "lib", "carcasas-disponibles.ts"),
  `// Generado por scripts/plantillas-carcasas.mjs: variantes con contorno en public/carcasas/.\n` +
    `export const CARCASAS_DISPONIBLES: readonly string[] = ${JSON.stringify(disponibles, null, 2)};\n`,
);
