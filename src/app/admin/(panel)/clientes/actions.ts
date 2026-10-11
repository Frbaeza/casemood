"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado } from "@/lib/admin-utils";
import { getDb } from "@/lib/db";

const idSchema = z.number().int().positive();

// El correo no se edita: es el de la cuenta con que el cliente entra a la tienda.
const fichaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del cliente.").max(80),
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, "") || null)
    .pipe(z.string().regex(/^\d{8,15}$/, "Escribe el teléfono con código de país, ej. 56912345678.").nullable()),
  nota: z.string().trim().max(500),
});
export type DatosFicha = z.input<typeof fichaSchema>;

export async function guardarCliente(id: number, datos: DatosFicha): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = fichaSchema.safeParse(datos);
    if (!d.success) return errorDeValidacion(d.error);
    const db = await getDb();
    await db.cliente.update({ where: { id: idSchema.parse(id) }, data: d.data });
    return { ok: true, id, mensaje: "Cliente guardado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

/** Elimina la cuenta del cliente; sus ventas se conservan como "Cliente genérico". */
export async function eliminarCliente(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.cliente.delete({ where: { id: idSchema.parse(id) } }); // sus formas de entrar se borran en cascada
    return { ok: true, mensaje: "Cliente eliminado. Sus ventas quedaron como cliente genérico." };
  } catch (e) {
    return errorInesperado(e);
  }
}
