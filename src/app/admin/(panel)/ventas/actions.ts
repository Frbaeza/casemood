"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado } from "@/lib/admin-utils";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { CANALES, horaChile, MEDIOS_PAGO } from "@/lib/ventas";

const idSchema = z.number().int().positive();

/** Error con mensaje para el usuario (se muestra tal cual). */
class Aviso extends Error {}

// ---------- Búsquedas para el formulario de venta ----------

export type ClienteOpcion = { id: number; nombre: string; email: string | null; telefono: string | null };

/** Mínimo de letras para buscar clientes (sin texto solo se ofrece "Cliente genérico"). */
const MIN_BUSQUEDA_CLIENTE = 2;
const MAX_CLIENTES = 20;

/**
 * Clientes con cuenta en la tienda que coinciden con el texto (nombre, correo o teléfono), los más
 * exactos primero: 1) nombre o correo idéntico, 2) empieza igual (nombre, apellido o correo), 3) contiene.
 * Cada nivel es una consulta aparte, así una coincidencia exacta nunca queda fuera por el límite.
 */
export async function buscarClientes(texto: string): Promise<ClienteOpcion[]> {
  await assertAdmin();
  const t = texto.trim().slice(0, 60).toLocaleLowerCase("es-CL");
  if (t.length < MIN_BUSQUEDA_CLIENTE) return [];
  const digitos = t.replace(/\D/g, "");
  const db = await getDb();
  const select = { id: true, nombre: true, email: true, telefono: true } as const;

  const niveles = [
    { OR: [{ nombre: { equals: t, mode: "insensitive" as const } }, { email: t }] },
    {
      OR: [
        { nombre: { startsWith: t, mode: "insensitive" as const } },
        { nombre: { contains: ` ${t}`, mode: "insensitive" as const } }, // apellido
        { email: { startsWith: t } },
      ],
    },
    {
      OR: [
        { nombre: { contains: t, mode: "insensitive" as const } },
        { email: { contains: t } },
        ...(digitos.length >= 4 ? [{ telefono: { contains: digitos } }] : []),
      ],
    },
  ];

  const encontrados: ClienteOpcion[] = [];
  for (const where of niveles) {
    if (encontrados.length >= MAX_CLIENTES) break;
    const lista = await db.cliente.findMany({
      where: { ...where, id: { notIn: encontrados.map((c) => c.id) } },
      orderBy: { nombre: "asc" },
      take: MAX_CLIENTES - encontrados.length,
      select,
    });
    encontrados.push(...lista);
  }
  return encontrados;
}

export type ProductoOpcion = {
  id: number;
  nombre: string;
  precio: number;
  stock: number | null;
  activo: boolean;
  categoria: string;
  imagen: string | null;
  /** Versiones de iPhone compatibles (vacío = universal). */
  modelos: string[];
};

export type FiltroProductos = { texto: string; categoriaId: number | null; varianteId: number | null; pagina: number };
const POR_PAGINA_PRODUCTOS = 24;

/**
 * Productos para agregar a una venta, filtrados por categoría, versión de iPhone (compatibles,
 * más los universales) y texto. Con texto, los más exactos primero: nombre idéntico,
 * empieza igual y luego contiene todas las palabras.
 */
export async function buscarProductosVenta(f: FiltroProductos): Promise<{ productos: ProductoOpcion[]; hayMas: boolean }> {
  await assertAdmin();
  const texto = f.texto.trim().slice(0, 80);
  const palabras = texto.split(/\s+/).filter(Boolean).slice(0, 5);
  if (!f.categoriaId && !f.varianteId && texto.length < 2) return { productos: [], hayMas: false };

  const base: Prisma.ProductoWhereInput = {
    ...(f.categoriaId ? { categoriaId: f.categoriaId } : {}),
    ...(f.varianteId
      ? { OR: [{ variantes: { some: { varianteId: f.varianteId } } }, { variantes: { none: {} } }] }
      : {}),
  };
  const select = {
    id: true,
    nombre: true,
    precio: true,
    stock: true,
    activo: true,
    categoria: { select: { nombre: true } },
    imagenes: { orderBy: { orden: "asc" }, take: 1, select: { key: true } },
    variantes: {
      orderBy: [{ variante: { modelo: { orden: "asc" } } }, { variante: { orden: "asc" } }],
      select: { variante: { select: { nombre: true } } },
    },
  } satisfies Prisma.ProductoSelect;

  const db = await getDb();
  const tope = f.pagina * POR_PAGINA_PRODUCTOS + 1; // +1 para saber si hay más
  type Fila = Prisma.ProductoGetPayload<{ select: typeof select }>;
  let filas: Fila[];

  if (palabras.length === 0) {
    filas = await db.producto.findMany({
      where: base,
      orderBy: [{ activo: "desc" }, { destacado: "desc" }, { creadoEn: "desc" }],
      take: tope,
      select,
    });
  } else {
    const niveles: Prisma.ProductoWhereInput[] = [
      { nombre: { equals: texto, mode: "insensitive" } },
      { nombre: { startsWith: texto, mode: "insensitive" } },
      { AND: palabras.map((p) => ({ nombre: { contains: p, mode: "insensitive" as const } })) },
    ];
    filas = [];
    for (const nivel of niveles) {
      if (filas.length >= tope) break;
      const lista = await db.producto.findMany({
        where: { AND: [base, nivel, { id: { notIn: filas.map((p) => p.id) } }] },
        orderBy: [{ activo: "desc" }, { nombre: "asc" }],
        take: tope - filas.length,
        select,
      });
      filas.push(...lista);
    }
  }

  const hayMas = filas.length > f.pagina * POR_PAGINA_PRODUCTOS;
  return {
    hayMas,
    productos: filas.slice(0, f.pagina * POR_PAGINA_PRODUCTOS).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      activo: p.activo,
      categoria: p.categoria.nombre,
      imagen: p.imagenes[0]?.key ?? null,
      modelos: p.variantes.map((v) => v.variante.nombre),
    })),
  };
}

// ---------- Ventas ----------

const ventaSchema = z.object({
  clienteId: idSchema.nullable(),
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha."),
  items: z
    .array(
      z.object({
        productoId: idSchema,
        modelo: z.string().trim().max(60).nullable(),
        cantidad: z.number().int().min(1, "La cantidad mínima es 1.").max(999),
        precioUnitario: z.number().int().min(0).max(10_000_000),
      }),
    )
    .min(1, "Agrega al menos un producto.")
    .max(50),
  descuento: z.number().int().min(0).max(10_000_000),
  medioPago: z.enum(Object.keys(MEDIOS_PAGO) as [keyof typeof MEDIOS_PAGO], { error: "Elige el medio de pago." }),
  canal: z.enum(Object.keys(CANALES) as [keyof typeof CANALES], { error: "Elige por dónde fue la venta." }),
  boleta: z.string().trim().max(30).transform((v) => v || null),
  nota: z.string().trim().max(500),
});
export type DatosVenta = z.input<typeof ventaSchema>;

export async function registrarVenta(datos: DatosVenta): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    const parsed = ventaSchema.safeParse(datos);
    if (!parsed.success) return errorDeValidacion(parsed.error);
    const d = parsed.data;

    const subtotal = d.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
    if (d.descuento > subtotal) return { ok: false, mensaje: "El descuento no puede ser mayor que el total." };
    const [a, m, dd] = d.dia.split("-").map(Number);
    // Mediodía en Chile: la venta cae en el día elegido aunque no se indique la hora.
    const fecha = horaChile(a, m, dd, 12);
    if (fecha.getTime() > Date.now() + 36 * 3600_000) return { ok: false, mensaje: "La fecha no puede ser futura." };

    const db = await getDb();
    const venta = await db.$transaction(async (tx) => {
      if (d.clienteId) {
        const existe = await tx.cliente.findUnique({ where: { id: d.clienteId }, select: { id: true } });
        if (!existe) throw new Aviso("Ese cliente ya no existe. Elige otro.");
      }

      const ids = [...new Set(d.items.map((i) => i.productoId))];
      const productos = await tx.producto.findMany({
        where: { id: { in: ids } },
        select: { id: true, nombre: true, stock: true, categoria: { select: { nombre: true } } },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      // Stock: se valida y descuenta por producto (una carcasa para varios iPhone es la misma unidad).
      const porProducto = new Map<number, number>();
      for (const i of d.items) porProducto.set(i.productoId, (porProducto.get(i.productoId) ?? 0) + i.cantidad);
      for (const [productoId, cantidad] of porProducto) {
        const p = porId.get(productoId);
        if (!p) throw new Aviso("Uno de los productos ya no existe. Quítalo de la venta.");
        if (p.stock === null) continue;
        // Descuento atómico: solo si alcanza (evita vender de más con dos ventas al mismo tiempo).
        const r = await tx.producto.updateMany({
          where: { id: productoId, stock: { gte: cantidad } },
          data: { stock: { decrement: cantidad } },
        });
        if (r.count === 0) {
          throw new Aviso(
            `De “${p.nombre}” quedan ${p.stock} ${p.stock === 1 ? "unidad" : "unidades"}. Corrige la cantidad o el stock del producto.`,
          );
        }
        await tx.producto.updateMany({ where: { id: productoId, stock: { lte: 0 } }, data: { agotado: true } });
      }

      return tx.venta.create({
        data: {
          fecha,
          clienteId: d.clienteId,
          subtotal,
          descuento: d.descuento,
          total: subtotal - d.descuento,
          medioPago: d.medioPago,
          canal: d.canal,
          boleta: d.boleta,
          nota: d.nota,
          creadaPor: admin,
          items: {
            create: d.items.map((i) => {
              const p = porId.get(i.productoId)!;
              return {
                productoId: i.productoId,
                nombre: p.nombre,
                categoria: p.categoria.nombre,
                modelo: i.modelo || null,
                cantidad: i.cantidad,
                precioUnitario: i.precioUnitario,
                subtotal: i.cantidad * i.precioUnitario,
              };
            }),
          },
        },
        select: { id: true },
      });
    });

    return { ok: true, id: venta.id, mensaje: "Venta registrada." };
  } catch (e) {
    if (e instanceof Aviso) return { ok: false, mensaje: e.message };
    return errorInesperado(e);
  }
}

/** Anula la venta (no se borra) y devuelve las unidades al stock. */
export async function anularVenta(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id: idSchema.parse(id) },
        select: { anulada: true, items: { select: { productoId: true, cantidad: true } } },
      });
      if (!venta) throw new Aviso("Esta venta ya no existe.");
      if (venta.anulada) throw new Aviso("Esta venta ya estaba anulada.");
      await tx.venta.update({ where: { id }, data: { anulada: true, anuladaEn: new Date() } });
      for (const item of venta.items) {
        if (!item.productoId) continue;
        // Solo productos que llevan stock (stock no nulo).
        await tx.producto.updateMany({
          where: { id: item.productoId, stock: { not: null } },
          data: { stock: { increment: item.cantidad } },
        });
        await tx.producto.updateMany({ where: { id: item.productoId, stock: { gt: 0 } }, data: { agotado: false } });
      }
    });
    return { ok: true, mensaje: "Venta anulada. Las unidades volvieron al stock." };
  } catch (e) {
    if (e instanceof Aviso) return { ok: false, mensaje: e.message };
    return errorInesperado(e);
  }
}

/** Cambia el cliente de una venta (null = cliente genérico). */
export async function asignarCliente(ventaId: number, clienteId: number | null): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    if (clienteId !== null) {
      const existe = await db.cliente.findUnique({ where: { id: idSchema.parse(clienteId) }, select: { nombre: true } });
      if (!existe) return { ok: false, mensaje: "Ese cliente ya no existe." };
    }
    await db.venta.update({ where: { id: idSchema.parse(ventaId) }, data: { clienteId } });
    return { ok: true, mensaje: clienteId ? "Venta asignada al cliente." : "La venta quedó como cliente genérico." };
  } catch (e) {
    return errorInesperado(e);
  }
}
