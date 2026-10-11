"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado } from "@/lib/admin-utils";
import { clienteSchema, type DatosCliente } from "@/lib/clientes";
import { getDb } from "@/lib/db";

const idSchema = z.number().int().positive();
const fichaSchema = clienteSchema.extend({ nota: z.string().trim().max(500) });

/** Crea (sin id) o actualiza un cliente. */
export async function guardarCliente(id: number | null, datos: DatosCliente & { nota: string }): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = fichaSchema.safeParse(datos);
    if (!d.success) return errorDeValidacion(d.error);
    const db = await getDb();
    if (d.data.email) {
      const otro = await db.cliente.findUnique({ where: { email: d.data.email }, select: { id: true, nombre: true } });
      if (otro && otro.id !== id) {
        return { ok: false, mensaje: `Ese correo ya es de ${otro.nombre}.`, errores: { email: `Ese correo ya es de ${otro.nombre}.` } };
      }
    }
    if (id) {
      await db.cliente.update({ where: { id: idSchema.parse(id) }, data: d.data });
      return { ok: true, id, mensaje: "Cliente guardado." };
    }
    const creado = await db.cliente.create({ data: d.data, select: { id: true } });
    return { ok: true, id: creado.id, mensaje: "Cliente creado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

/** Elimina el cliente; sus ventas se conservan como "Cliente genérico". */
export async function eliminarCliente(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.cliente.delete({ where: { id: idSchema.parse(id) } });
    return { ok: true, mensaje: "Cliente eliminado. Sus ventas quedaron como cliente genérico." };
  } catch (e) {
    return errorInesperado(e);
  }
}
