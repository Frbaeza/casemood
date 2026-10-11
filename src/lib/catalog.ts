import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { CARCASAS_DISPONIBLES } from "@/lib/carcasas-disponibles";
import type { Orden } from "@/lib/catalog-orden";
import type { RegionCotizable } from "@/lib/envios";

/** Productos que se muestran en el catálogo (los inactivos están ocultos o sin stock). */
const EN_TIENDA = { activo: true } satisfies Prisma.ProductoWhereInput;

/** Datos mínimos para mostrar una tarjeta de producto. */
const tarjetaSelect = {
  id: true,
  nombre: true,
  slug: true,
  precio: true,
  creadoEn: true,
  imagenes: { select: { key: true }, orderBy: { orden: "asc" }, take: 1 },
} satisfies Prisma.ProductoSelect;

export type ProductoTarjeta = Prisma.ProductoGetPayload<{ select: typeof tarjetaSelect }>;

function orderByDe(orden: Orden): Prisma.ProductoOrderByWithRelationInput[] {
  switch (orden) {
    case "precio-asc":
      return [{ precio: "asc" }, { creadoEn: "desc" }];
    case "precio-desc":
      return [{ precio: "desc" }, { creadoEn: "desc" }];
    case "nuevos":
      return [{ creadoEn: "desc" }];
    default:
      return [{ destacado: "desc" }, { creadoEn: "desc" }];
  }
}

/**
 * Productos que cuentan como "disponibles" para una versión: activos, marcados disponibles para esa versión y,
 * si hay categoría, de esa categoría (ej. solo carcasas).
 */
function productosDisponibles(categoriaSlug?: string): Prisma.ProductoVarianteWhereInput {
  return { disponible: true, producto: { ...EN_TIENDA, ...(categoriaSlug ? { categoria: { slug: categoriaSlug } } : {}) } };
}

const selectVersion = (categoriaSlug?: string) =>
  ({
    id: true,
    nombre: true,
    slug: true,
    _count: { select: { productos: { where: productosDisponibles(categoriaSlug) } } },
  }) satisfies Prisma.VarianteSelect;

/**
 * Todos los modelos visibles con sus versiones visibles. Cada versión indica si tiene productos
 * disponibles (de la categoría, si se indica); las que no, se muestran como "Sin stock".
 */
export const getModelos = cache(async (categoriaSlug?: string) => {
  const db = await getDb();
  const modelos = await db.modelo.findMany({
    where: { activo: true, variantes: { some: { activo: true } } },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      slug: true,
      variantes: { where: { activo: true }, select: selectVersion(categoriaSlug) },
    },
  });
  return modelos.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    slug: m.slug,
    versiones: m.variantes.length,
    conProductos: m.variantes.filter((v) => v._count.productos > 0).length,
  }));
});

/** Modelo con todas sus versiones visibles, marcando cuáles tienen productos disponibles. */
export const getModelo = cache(async (slug: string, categoriaSlug?: string) => {
  const db = await getDb();
  const modelo = await db.modelo.findFirst({
    where: { slug, activo: true },
    select: {
      id: true,
      nombre: true,
      slug: true,
      variantes: {
        where: { activo: true },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        select: selectVersion(categoriaSlug),
      },
    },
  });
  if (!modelo) return null;
  return {
    ...modelo,
    // Sin categoría siempre hay algo (productos universales), así que ninguna versión queda "Sin stock".
    variantes: modelo.variantes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      slug: v.slug,
      disponible: !categoriaSlug || v._count.productos > 0,
    })),
  };
});

export const getVariante = cache(async (modeloSlug: string, varianteSlug: string) => {
  const db = await getDb();
  return db.variante.findFirst({
    where: { slug: varianteSlug, activo: true, modelo: { slug: modeloSlug, activo: true } },
    select: { id: true, nombre: true, slug: true, modelo: { select: { nombre: true, slug: true } } },
  });
});

/** Productos activos compatibles y disponibles para la variante, más los universales (sin variantes). */
function whereParaVariante(varianteId: number): Prisma.ProductoWhereInput {
  return {
    ...EN_TIENDA,
    OR: [{ variantes: { some: { varianteId, disponible: true } } }, { variantes: { none: {} } }],
  };
}

export async function getProductosParaVariante(varianteId: number, categoriaSlug?: string, ordenElegido: Orden = "recomendados") {
  const db = await getDb();
  const base = whereParaVariante(varianteId);
  // Primero lo hecho para esta variante y después lo universal (cargadores, tazas…).
  const buscar = async (slug?: string) => {
    const porCategoria = slug ? { categoria: { slug } } : {};
    const orden = orderByDe(ordenElegido);
    const [especificos, universales] = await Promise.all([
      db.producto.findMany({
        where: { ...EN_TIENDA, variantes: { some: { varianteId, disponible: true } }, ...porCategoria },
        orderBy: orden,
        select: tarjetaSelect,
      }),
      db.producto.findMany({
        where: { ...EN_TIENDA, variantes: { none: {} }, ...porCategoria },
        orderBy: orden,
        select: tarjetaSelect,
      }),
    ]);
    if (ordenElegido === "recomendados") return [...especificos, ...universales];
    // Precio o fecha: una sola lista ordenada.
    const todos = [...especificos, ...universales];
    return todos.sort((a, b) =>
      ordenElegido === "precio-asc"
        ? a.precio - b.precio
        : ordenElegido === "precio-desc"
          ? b.precio - a.precio
          : b.creadoEn.getTime() - a.creadoEn.getTime(),
    );
  };

  const [filtrados, categorias] = await Promise.all([
    buscar(categoriaSlug),
    // Solo las categorías que tienen algo para esta variante (para los chips).
    db.categoria.findMany({
      where: { productos: { some: base } },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, slug: true },
    }),
  ]);

  // Filtro que no aplica a esta variante (link viejo o de otro modelo): se muestra todo.
  const categoriaActiva = categorias.find((c) => c.slug === categoriaSlug);
  const productos = categoriaSlug && !categoriaActiva ? await buscar() : filtrados;
  return { productos, categorias, categoriaActiva };
}

export async function getDestacados(limite = 6) {
  const db = await getDb();
  return db.producto.findMany({
    where: { ...EN_TIENDA, destacado: true },
    orderBy: { creadoEn: "desc" },
    take: limite,
    select: tarjetaSelect,
  });
}

/**
 * Categorías con productos activos: cantidad, una foto de portada (el destacado o el más nuevo)
 * y si sus productos dependen del modelo de iPhone (`porModelo`, ej. Carcasas).
 */
export const getCategoriasConProductos = cache(async () => {
  const db = await getDb();
  const categorias = await db.categoria.findMany({
    where: { productos: { some: EN_TIENDA } },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      slug: true,
      imagenKey: true,
      _count: { select: { productos: { where: EN_TIENDA } } },
      productos: {
        where: { ...EN_TIENDA, imagenes: { some: {} } },
        orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
        take: 1,
        select: { imagenes: { orderBy: { orden: "asc" }, take: 1, select: { key: true } } },
      },
    },
  });
  const conModelo = await Promise.all(
    categorias.map((c) =>
      db.producto.count({ where: { ...EN_TIENDA, categoriaId: c.id, variantes: { some: {} } }, take: 1 }),
    ),
  );
  return categorias.map((c, i) => ({
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    cantidad: c._count.productos,
    // Foto elegida en el admin; si no hay, la del producto destacado o más nuevo.
    imagen: c.imagenKey ?? c.productos[0]?.imagenes[0]?.key,
    porModelo: conModelo[i] > 0,
  }));
});

/** Versiones de iPhone que tienen plantilla para "Diseña tu carcasa", agrupadas por modelo. */
export const getVariantesPersonalizables = cache(async () => {
  const db = await getDb();
  const modelos = await db.modelo.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: {
      nombre: true,
      slug: true,
      variantes: {
        where: { activo: true, slug: { in: [...CARCASAS_DISPONIBLES] } },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        select: { id: true, nombre: true, slug: true },
      },
    },
  });
  return modelos.filter((m) => m.variantes.length > 0);
});

export const POR_PAGINA = 48;

/** Productos activos de una categoría (de cualquier modelo), o de todas si no se indica, paginados. */
export async function getProductosDeCategoria(slug: string | undefined, pagina = 1, orden: Orden = "recomendados") {
  const db = await getDb();
  const where = slug ? { ...EN_TIENDA, categoria: { slug } } : EN_TIENDA;
  const [productos, total] = await Promise.all([
    db.producto.findMany({
      where,
      orderBy: orderByDe(orden),
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: tarjetaSelect,
    }),
    db.producto.count({ where }),
  ]);
  return { productos, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) };
}

/** Búsqueda por nombre (todas las palabras). Incluye la categoría para filtrar con chips. */
export async function buscarProductos(texto: string, orden: Orden = "recomendados") {
  const db = await getDb();
  const palabras = texto.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (palabras.length === 0) return [];
  return db.producto.findMany({
    where: {
      ...EN_TIENDA,
      AND: palabras.map((p) => ({ nombre: { contains: p, mode: "insensitive" as const } })),
    },
    orderBy: orderByDe(orden),
    take: 60,
    select: { ...tarjetaSelect, categoria: { select: { slug: true } } },
  });
}

export const getProducto = cache(async (slug: string) => {
  const db = await getDb();
  return db.producto.findFirst({
    where: { slug, activo: true },
    select: {
      id: true,
      nombre: true,
      slug: true,
      descripcion: true,
      precio: true,
      categoria: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: "asc" }, select: { key: true } },
      variantes: {
        where: { variante: { activo: true, modelo: { activo: true } } },
        orderBy: [{ variante: { modelo: { orden: "asc" } } }, { variante: { orden: "asc" } }],
        select: {
          disponible: true,
          variante: { select: { id: true, nombre: true, modelo: { select: { id: true, nombre: true } } } },
        },
      },
    },
  });
});

/** Regiones con su tarifa de envío (para el cotizador del footer). Solo las que tienen zona asignada. */
export const getRegionesEnvio = cache(async (): Promise<RegionCotizable[]> => {
  const db = await getDb();
  const regiones = await db.regionEnvio.findMany({
    where: { zonaId: { not: null } },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, zona: true },
  });
  return regiones.flatMap((r) =>
    r.zona
      ? [
          {
            id: r.id,
            nombre: r.nombre,
            zona: r.zona.nombre,
            punto: { XS: r.zona.puntoXS, S: r.zona.puntoS },
            domicilio: { XS: r.zona.domicilioXS, S: r.zona.domicilioS },
          },
        ]
      : [],
  );
});
