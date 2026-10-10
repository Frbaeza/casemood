/**
 * Productos de demostración para probar el catálogo (slugs "demo-…").
 *   npx tsx prisma/demo.ts            -> crea productos y escribe sus imágenes SVG en .wrangler/demo-img
 *   npx tsx prisma/demo.ts --borrar   -> elimina todo lo de demo
 * Las imágenes se suben al R2 local con `npm run demo:imagenes` (ver package.json).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma-node/client";

process.loadEnvFile(".dev.vars");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
const DIR = join(".wrangler", "demo-img");

type Demo = {
  nombre: string;
  precio: number;
  categoria: "carcasas" | "micas" | "cargadores";
  destacado?: boolean;
  descripcion: string;
  colores: string[]; // una imagen por color
  variantes: string[]; // slugs de variante; vacío = universal
  agotadas?: string[];
};

const DEMOS: Demo[] = [
  {
    nombre: "Carcasa transparente MagSafe",
    precio: 11990,
    categoria: "carcasas",
    destacado: true,
    descripcion: "Carcasa transparente que no se pone amarilla.\nCompatible con cargadores MagSafe.\nBordes reforzados para proteger la cámara.",
    colores: ["#d7e9f7", "#c9f0e4", "#f7dce8"],
    variantes: ["iphone-13", "iphone-13-pro", "iphone-14", "iphone-14-pro", "iphone-15", "iphone-15-pro", "iphone-15-pro-max"],
    agotadas: ["iphone-15-pro-max"],
  },
  {
    nombre: "Carcasa de silicona suave",
    precio: 7990,
    categoria: "carcasas",
    descripcion: "Silicona suave al tacto con interior de microfibra.",
    colores: ["#f4b183"],
    variantes: ["iphone-11", "iphone-12", "iphone-12-pro", "iphone-13", "iphone-13-pro"],
  },
  {
    nombre: "Carcasa antigolpes reforzada",
    precio: 12990,
    categoria: "carcasas",
    destacado: true,
    descripcion: "Esquinas con amortiguación para caídas de hasta 2 metros.",
    colores: [],
    variantes: ["iphone-16", "iphone-16-pro", "iphone-16-pro-max"],
  },
  {
    nombre: "Mica de vidrio templado",
    precio: 4990,
    categoria: "micas",
    descripcion: "Vidrio templado 9H. Incluye paño y guía de instalación.",
    colores: ["#e6e6e6", "#d0d0d0"],
    variantes: ["iphone-13", "iphone-13-pro", "iphone-14"],
  },
  {
    nombre: "Cargador rápido 20W USB-C",
    precio: 9990,
    categoria: "cargadores",
    destacado: true,
    descripcion: "Carga rápida para cualquier iPhone con cable USB-C a Lightning o USB-C.",
    colores: ["#ffffff"],
    variantes: [],
  },
];

const CATEGORIAS = { carcasas: "Carcasas", micas: "Micas", cargadores: "Cargadores" } as const;

const slugDemo = (nombre: string) =>
  "demo-" + nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

function svg(color: string, texto: string, n: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<rect width="1200" height="1200" fill="${color}"/>
<rect x="400" y="200" width="400" height="800" rx="80" fill="#2b2d30" opacity=".85"/>
<rect x="430" y="230" width="340" height="740" rx="60" fill="${color}"/>
<circle cx="500" cy="300" r="40" fill="#2b2d30"/>
<text x="600" y="1110" font-family="sans-serif" font-size="56" text-anchor="middle" fill="#2b2d30">${texto} · ${n}</text>
</svg>`;
}

async function borrar() {
  const productos = await prisma.producto.findMany({ where: { slug: { startsWith: "demo-" } }, select: { id: true } });
  await prisma.producto.deleteMany({ where: { id: { in: productos.map((p) => p.id) } } });
  // Categorías de demo solo si quedaron vacías
  await prisma.categoria.deleteMany({ where: { slug: { in: ["micas", "cargadores"] }, productos: { none: {} } } });
  rmSync(DIR, { recursive: true, force: true });
  console.log(`Demo eliminada: ${productos.length} productos.`);
}

async function crear() {
  await borrar();
  mkdirSync(DIR, { recursive: true });

  for (const [i, [slug, nombre]] of Object.entries(CATEGORIAS).entries()) {
    await prisma.categoria.upsert({ where: { slug }, update: {}, create: { slug, nombre, orden: i + 1 } });
  }

  for (const d of DEMOS) {
    const slug = slugDemo(d.nombre);
    const categoria = await prisma.categoria.findUniqueOrThrow({ where: { slug: d.categoria } });
    const variantes = await prisma.variante.findMany({ where: { slug: { in: d.variantes } }, select: { id: true, slug: true } });

    const keys = d.colores.map((_, n) => `demo/${slug}-${n + 1}.svg`);
    d.colores.forEach((color, n) => writeFileSync(join(DIR, `${slug}-${n + 1}.svg`), svg(color, d.nombre.split(" ")[0], n + 1)));

    await prisma.producto.create({
      data: {
        nombre: d.nombre,
        slug,
        precio: d.precio,
        descripcion: d.descripcion,
        destacado: d.destacado ?? false,
        categoriaId: categoria.id,
        imagenes: { create: keys.map((key, orden) => ({ key, orden })) },
        variantes: {
          create: variantes.map((v) => ({ varianteId: v.id, disponible: !d.agotadas?.includes(v.slug) })),
        },
      },
    });
  }
  console.log(`Demo creada: ${DEMOS.length} productos. Imágenes en ${DIR}`);
}

(process.argv.includes("--borrar") ? borrar() : crear())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
