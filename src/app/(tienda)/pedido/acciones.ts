"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";

export type ProductoVigente = { productoId: number; slug: string; nombre: string; precio: number; imagen: string | null };

/** Precio, nombre y foto actuales de los productos del pedido (solo los activos). */
export async function revisarPedido(ids: number[]): Promise<ProductoVigente[]> {
  const lista = z.array(z.number().int().positive()).max(100).safeParse(ids);
  if (!lista.success || lista.data.length === 0) return [];
  const db = await getDb();
  const productos = await db.producto.findMany({
    where: { id: { in: lista.data }, activo: true },
    select: {
      id: true,
      slug: true,
      nombre: true,
      precio: true,
      imagenes: { orderBy: { orden: "asc" }, take: 1, select: { key: true } },
    },
  });
  return productos.map((p) => ({ productoId: p.id, slug: p.slug, nombre: p.nombre, precio: p.precio, imagen: p.imagenes[0]?.key ?? null }));
}
