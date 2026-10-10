/**
 * Importa el catálogo exportado desde Glide (Items.csv) a la base de datos y a R2.
 *
 *   npx tsx prisma/importar-glide.ts            -> simula: muestra qué haría, sin cambiar nada
 *   npx tsx prisma/importar-glide.ts --aplicar  -> descarga fotos, las sube a R2 y crea los productos
 *
 * Los CSV van en .glide-import/ (Items.csv: Row ID, Name, Image, Precio, Category).
 * Es idempotente: cada foto tiene una key fija (p/glide-<rowid>.webp) y si ya existe un
 * producto con esa foto, la fila se salta. Se puede volver a correr sin duplicar.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma-node/client";
import { slugify } from "../src/lib/slug";

process.loadEnvFile(".dev.vars");
const APLICAR = process.argv.includes("--aplicar");
const DIR = ".glide-import";
const DIR_FOTOS = join(DIR, "fotos");
const BUCKET = "casemood-imagenes";

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

// ---------- CSV (RFC 4180: comillas, comas y saltos de línea dentro de campos) ----------
function parseCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  const cerrarFila = () => {
    fila.push(campo);
    filas.push(fila);
    fila = [];
    campo = "";
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      cerrarFila();
    } else campo += c;
  }
  if (campo || fila.length) cerrarFila();
  return filas.filter((f) => f.some((x) => x.trim()));
}

// ---------- Mapeo de "Category" de Glide ----------
const norm = (s: string) => s.toLowerCase().replace(/iphone/g, "").replace(/\s+/g, " ").trim();

type Destino = { categoria: string; variantes: string[] };
const CARCASAS = "Carcasas";
const MAPA: Record<string, Destino> = {
  "11": { categoria: CARCASAS, variantes: ["iphone-11"] },
  "12": { categoria: CARCASAS, variantes: ["iphone-12"] },
  "13": { categoria: CARCASAS, variantes: ["iphone-13"] },
  "13 pro": { categoria: CARCASAS, variantes: ["iphone-13-pro"] },
  "13 pro max": { categoria: CARCASAS, variantes: ["iphone-13-pro-max"] },
  "13/14": { categoria: CARCASAS, variantes: ["iphone-13", "iphone-14"] },
  "14 pro": { categoria: CARCASAS, variantes: ["iphone-14-pro"] },
  "14 pro max": { categoria: CARCASAS, variantes: ["iphone-14-pro-max"] },
  "15": { categoria: CARCASAS, variantes: ["iphone-15"] },
  "15 pro": { categoria: CARCASAS, variantes: ["iphone-15-pro"] },
  "15 pro max": { categoria: CARCASAS, variantes: ["iphone-15-pro-max"] },
  "16": { categoria: CARCASAS, variantes: ["iphone-16"] },
  "16 pro": { categoria: CARCASAS, variantes: ["iphone-16-pro"] },
  "16 pro max": { categoria: CARCASAS, variantes: ["iphone-16-pro-max"] },
  "16e y 17e": { categoria: CARCASAS, variantes: ["iphone-16e", "iphone-17e"] },
  "17/18": { categoria: CARCASAS, variantes: ["iphone-17"] },
  "17 pro / 18 pro": { categoria: CARCASAS, variantes: ["iphone-17-pro"] },
  "17 pro max / 18 pro max": { categoria: CARCASAS, variantes: ["iphone-17-pro-max"] },
  "+ accesorios": { categoria: "Accesorios", variantes: [] },
  "cubre cargadores": { categoria: "Cubre cargadores", variantes: [] },
  "tazas personalizadas": { categoria: "Tazas personalizadas", variantes: [] },
  cargadores: { categoria: "Cargadores", variantes: [] },
  // "3x $10.000" (promo) y filas sin categoría se omiten a propósito (decisión de la tienda).
};

const CATEGORIAS_NUEVAS = ["Accesorios", "Cubre cargadores", "Cargadores", "Tazas personalizadas"];
const IPHONE_17 = ["iPhone 17e", "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max"];

/** "Carcasa Hello Kitty " -> "Carcasa Hello Kitty"; "carcasa azul" -> "Carcasa azul" */
function limpiarNombre(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

type Fila = { rowId: string; nombre: string; imagen: string; precio: number; destino: Destino; key: string };

async function prepararDatosBase() {
  // Modelo iPhone 17 (primero en la lista) con sus variantes.
  let m17 = await prisma.modelo.findUnique({ where: { slug: "iphone-17" } });
  if (!m17) {
    await prisma.modelo.updateMany({ data: { orden: { increment: 1 } } });
    m17 = await prisma.modelo.create({ data: { nombre: "iPhone 17", slug: "iphone-17", orden: 1 } });
  }
  for (const [i, nombre] of IPHONE_17.entries()) {
    const slug = slugify(nombre);
    await prisma.variante.upsert({
      where: { modeloId_slug: { modeloId: m17.id, slug } },
      update: {},
      create: { nombre, slug, orden: i + 1, modeloId: m17.id },
    });
  }
  // Categorías nuevas, después de "Carcasas".
  for (const [i, nombre] of CATEGORIAS_NUEVAS.entries()) {
    await prisma.categoria.upsert({
      where: { slug: slugify(nombre) },
      update: {},
      create: { nombre, slug: slugify(nombre), orden: i + 2 },
    });
  }
}

async function main() {
  const filas = parseCsv(readFileSync(join(DIR, "Items.csv"), "utf8").replace(/^﻿/, ""));
  const cab = filas[0].map((h) => h.replace(/[^\w ]/g, "").trim().toLowerCase());
  const col = (n: string) => cab.indexOf(n);
  const [iId, iNombre, iImg, iPrecio, iCat] = ["row id", "name", "image", "precio", "category"].map(col);
  if ([iId, iNombre, iImg, iPrecio, iCat].some((i) => i < 0)) throw new Error(`Columnas inesperadas: ${cab.join(", ")}`);

  const validas: Fila[] = [];
  const problemas: string[] = [];
  const sinMapa = new Map<string, number>();

  for (const f of filas.slice(1)) {
    const rowId = f[iId]?.trim();
    const nombre = limpiarNombre(f[iNombre] ?? "");
    const imagen = (f[iImg] ?? "").trim();
    const precio = Number((f[iPrecio] ?? "").replace(/\D/g, ""));
    const cat = norm(f[iCat] ?? "");
    const destino = MAPA[cat];
    if (!rowId || !nombre) {
      problemas.push(`Fila sin nombre (${rowId || "sin id"})`);
      continue;
    }
    if (!destino) {
      sinMapa.set(f[iCat] ?? "(vacía)", (sinMapa.get(f[iCat] ?? "(vacía)") ?? 0) + 1);
      continue;
    }
    if (!precio) problemas.push(`"${nombre}" sin precio (queda en $0, inactivo)`);
    // Solo [A-Za-z0-9_-]: los Row ID de Glide traen puntos ("K.vbW7..SV6") y R2 rechaza ".." en las keys.
    const key = `p/glide-${rowId.replace(/[^\w-]/g, "_")}.webp`;
    validas.push({ rowId, nombre, imagen, precio, destino, key });
  }

  const porCategoria = new Map<string, number>();
  validas.forEach((v) => porCategoria.set(v.destino.categoria, (porCategoria.get(v.destino.categoria) ?? 0) + 1));
  console.log(`Filas en Items.csv: ${filas.length - 1}`);
  console.log(`A importar: ${validas.length}`, Object.fromEntries(porCategoria));
  console.log(`Sin foto: ${validas.filter((v) => !v.imagen).length}`);
  if (sinMapa.size) console.log("Category sin equivalencia (se omiten):", Object.fromEntries(sinMapa));
  if (problemas.length) console.log("Observaciones:\n  " + problemas.join("\n  "));

  if (!APLICAR) {
    console.log("\nSimulación terminada. Ejecuta con --aplicar para importar.");
    return;
  }

  await prepararDatosBase();

  // Saltar filas ya importadas (su foto ya existe en la base).
  const yaImportadas = new Set(
    (await prisma.imagenProducto.findMany({ where: { key: { startsWith: "p/glide-" } }, select: { key: true } })).map((i) => i.key),
  );
  const pendientes = validas.filter((v) => !yaImportadas.has(v.key));
  console.log(`\nPendientes: ${pendientes.length} (ya importadas: ${validas.length - pendientes.length})`);

  // 1) Descargar y convertir fotos (con caché en disco para poder reintentar).
  mkdirSync(DIR_FOTOS, { recursive: true });
  const manifiesto: { key: string; file: string }[] = [];
  const conFoto = new Set<string>();
  let hechas = 0;
  const cola = pendientes.filter((p) => p.imagen);
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (cola.length) {
        const p = cola.shift()!;
        const destino = join(DIR_FOTOS, p.key.slice(2));
        try {
          if (!existsSync(destino)) {
            const res = await fetch(p.imagen);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const original = Buffer.from(await res.arrayBuffer());
            const webp = await sharp(original)
              .rotate()
              .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
              .webp({ quality: 82 })
              .toBuffer();
            writeFileSync(destino, webp);
          }
          manifiesto.push({ key: p.key, file: destino });
          conFoto.add(p.key);
        } catch (e) {
          console.warn(`  ⚠ Foto de "${p.nombre}" no se pudo descargar: ${(e as Error).message}`);
        }
        if (++hechas % 50 === 0) console.log(`  fotos procesadas: ${hechas}/${pendientes.length}`);
      }
    }),
  );

  // 2) Subir a R2 (producción y local) en lote.
  if (manifiesto.length) {
    const archivo = join(DIR, "manifiesto-r2.json");
    writeFileSync(archivo, JSON.stringify(manifiesto));
    for (const destino of ["--remote", "--local"]) {
      console.log(`\nSubiendo ${manifiesto.length} fotos a R2 (${destino})…`);
      execFileSync(
        "npx",
        // Con shell en Windows, el valor con espacios va entre comillas.
        ["wrangler", "r2", "bulk", "put", BUCKET, destino, "--filename", archivo, "--ct", "image/webp", "--cc", '"public, max-age=31536000, immutable"', "--concurrency", "20"],
        { stdio: "inherit", shell: process.platform === "win32" },
      );
    }
  }

  // 3) Crear productos.
  const categorias = new Map((await prisma.categoria.findMany()).map((c) => [c.nombre, c.id]));
  const variantes = new Map((await prisma.variante.findMany({ select: { id: true, slug: true } })).map((v) => [v.slug, v.id]));
  const slugsUsados = new Set((await prisma.producto.findMany({ select: { slug: true } })).map((p) => p.slug));
  const slugLibre = (nombre: string) => {
    const base = slugify(nombre) || "producto";
    let s = base;
    for (let n = 2; slugsUsados.has(s); n++) s = `${base}-${n}`;
    slugsUsados.add(s);
    return s;
  };

  let creados = 0;
  for (const p of pendientes) {
    const tieneFoto = conFoto.has(p.key);
    if (p.imagen && !tieneFoto) continue; // la foto falló: se reintenta en la próxima corrida
    await prisma.producto.create({
      data: {
        nombre: p.nombre,
        slug: slugLibre(p.nombre),
        precio: p.precio,
        activo: p.precio > 0,
        categoriaId: categorias.get(p.destino.categoria)!,
        imagenes: tieneFoto ? { create: [{ key: p.key, orden: 0 }] } : undefined,
        variantes: { create: p.destino.variantes.map((slug) => ({ varianteId: variantes.get(slug)!, disponible: true })) },
      },
    });
    if (++creados % 50 === 0) console.log(`  productos creados: ${creados}`);
  }
  console.log(`\nListo: ${creados} productos creados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
