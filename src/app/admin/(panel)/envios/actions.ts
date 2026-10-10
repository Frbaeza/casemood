"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado } from "@/lib/admin-utils";
import { getDb } from "@/lib/db";

const idSchema = z.number().int().positive();
const precio = z.number({ error: "Escribe un precio." }).int().min(0).max(1_000_000);

const zonaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre de la zona.").max(60),
  puntoXS: precio,
  puntoS: precio,
  puntoM: precio,
  puntoL: precio,
  domicilioXS: precio,
  domicilioS: precio,
  domicilioM: precio,
  domicilioL: precio,
});
export type DatosZona = z.infer<typeof zonaSchema>;

export async function guardarZona(id: number, datos: DatosZona): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = zonaSchema.safeParse(datos);
    if (!d.success) return errorDeValidacion(d.error);
    const db = await getDb();
    await db.zonaEnvio.update({ where: { id: idSchema.parse(id) }, data: d.data });
    return { ok: true, mensaje: `Tarifas de “${d.data.nombre}” guardadas.` };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function crearZona(nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = z.string().trim().min(2, "Escribe el nombre de la zona.").max(60).safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const ultimo = await db.zonaEnvio.aggregate({ _max: { orden: true } });
    await db.zonaEnvio.create({ data: { nombre: n.data, orden: (ultimo._max.orden ?? 0) + 1 } });
    return { ok: true, mensaje: `Zona “${n.data}” creada. Completa sus precios.` };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function eliminarZona(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const usadas = await db.regionEnvio.count({ where: { zonaId: idSchema.parse(id) } });
    if (usadas > 0) {
      return {
        ok: false,
        mensaje: `${usadas} ${usadas === 1 ? "región usa" : "regiones usan"} esta zona. Asígnales otra zona primero.`,
      };
    }
    await db.zonaEnvio.delete({ where: { id } });
    return { ok: true, mensaje: "Zona eliminada." };
  } catch (e) {
    return errorInesperado(e);
  }
}

/** Cambia la zona de una región (null = la región no aparece en el cotizador). */
export async function asignarZona(regionId: number, zonaId: number | null): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.regionEnvio.update({
      where: { id: idSchema.parse(regionId) },
      data: { zonaId: zonaId === null ? null : idSchema.parse(zonaId) },
    });
    return { ok: true, mensaje: "Zona de la región actualizada." };
  } catch (e) {
    return errorInesperado(e);
  }
}
