"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado, reordenar } from "@/lib/admin-utils";
import { getDb } from "@/lib/db";
import { slugUnico } from "@/lib/slug";

const nombreSchema = z.string().trim().min(2, "Escribe un nombre (mínimo 2 letras).").max(60, "El nombre es muy largo.");
const idSchema = z.number().int().positive();

// ---------------- Modelos ----------------

export async function crearModelo(nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = nombreSchema.safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const slug = await slugUnico(n.data, async (s) => !!(await db.modelo.findUnique({ where: { slug: s }, select: { id: true } })));
    // Los nuevos quedan primeros (suelen ser los iPhone más recientes).
    await db.$transaction([
      db.modelo.updateMany({ data: { orden: { increment: 1 } } }),
      db.modelo.create({ data: { nombre: n.data, slug, orden: 1 } }),
    ]);
    return { ok: true, mensaje: `Modelo “${n.data}” creado. Ahora agrégale sus variantes.` };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function renombrarModelo(id: number, nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = nombreSchema.safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const slug = await slugUnico(n.data, async (s) => {
      const otro = await db.modelo.findUnique({ where: { slug: s }, select: { id: true } });
      return !!otro && otro.id !== id;
    });
    await db.modelo.update({ where: { id: idSchema.parse(id) }, data: { nombre: n.data, slug } });
    return { ok: true, mensaje: "Nombre guardado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function cambiarActivoModelo(id: number, activo: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.modelo.update({ where: { id: idSchema.parse(id) }, data: { activo: z.boolean().parse(activo) } });
    return { ok: true, mensaje: activo ? "Modelo visible en la tienda." : "Modelo oculto de la tienda." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function moverModelo(id: number, direccion: "arriba" | "abajo"): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const todos = await db.modelo.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }], select: { id: true } });
    const nuevo = reordenar(todos.map((m) => m.id), id, direccion);
    if (!nuevo) return { ok: true };
    await db.$transaction(nuevo.map((mid, i) => db.modelo.update({ where: { id: mid }, data: { orden: i + 1 } })));
    return { ok: true };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function eliminarModelo(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const usados = await db.producto.count({ where: { variantes: { some: { variante: { modeloId: idSchema.parse(id) } } } } });
    if (usados > 0) {
      return {
        ok: false,
        conProductos: usados,
        mensaje: `Este modelo tiene ${usados} ${usados === 1 ? "producto asociado" : "productos asociados"}.`,
      };
    }
    await db.$transaction([
      db.variante.deleteMany({ where: { modeloId: id } }),
      db.modelo.delete({ where: { id } }),
    ]);
    return { ok: true, mensaje: "Modelo eliminado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

// ---------------- Variantes ----------------

export async function crearVariante(modeloId: number, nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = nombreSchema.safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const mid = idSchema.parse(modeloId);
    const slug = await slugUnico(n.data, async (s) =>
      !!(await db.variante.findUnique({ where: { modeloId_slug: { modeloId: mid, slug: s } }, select: { id: true } })),
    );
    const ultimo = await db.variante.aggregate({ where: { modeloId: mid }, _max: { orden: true } });
    await db.variante.create({ data: { nombre: n.data, slug, modeloId: mid, orden: (ultimo._max.orden ?? 0) + 1 } });
    return { ok: true, mensaje: `Variante “${n.data}” agregada.` };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function renombrarVariante(id: number, nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = nombreSchema.safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const v = await db.variante.findUnique({ where: { id: idSchema.parse(id) }, select: { modeloId: true } });
    if (!v) return { ok: false, mensaje: "Esta variante ya no existe." };
    const slug = await slugUnico(n.data, async (s) => {
      const otra = await db.variante.findUnique({ where: { modeloId_slug: { modeloId: v.modeloId, slug: s } }, select: { id: true } });
      return !!otra && otra.id !== id;
    });
    await db.variante.update({ where: { id }, data: { nombre: n.data, slug } });
    return { ok: true, mensaje: "Nombre guardado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function cambiarActivoVariante(id: number, activo: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.variante.update({ where: { id: idSchema.parse(id) }, data: { activo: z.boolean().parse(activo) } });
    return { ok: true, mensaje: activo ? "Variante visible en la tienda." : "Variante oculta de la tienda." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function moverVariante(id: number, direccion: "arriba" | "abajo"): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const v = await db.variante.findUnique({ where: { id: idSchema.parse(id) }, select: { modeloId: true } });
    if (!v) return { ok: false, mensaje: "Esta variante ya no existe." };
    const hermanas = await db.variante.findMany({
      where: { modeloId: v.modeloId },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const nuevo = reordenar(hermanas.map((x) => x.id), id, direccion);
    if (!nuevo) return { ok: true };
    await db.$transaction(nuevo.map((vid, i) => db.variante.update({ where: { id: vid }, data: { orden: i + 1 } })));
    return { ok: true };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function eliminarVariante(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const usados = await db.productoVariante.count({ where: { varianteId: idSchema.parse(id) } });
    if (usados > 0) {
      return {
        ok: false,
        conProductos: usados,
        mensaje: `Esta variante tiene ${usados} ${usados === 1 ? "producto asociado" : "productos asociados"}.`,
      };
    }
    await db.variante.delete({ where: { id } });
    return { ok: true, mensaje: "Variante eliminada." };
  } catch (e) {
    return errorInesperado(e);
  }
}
