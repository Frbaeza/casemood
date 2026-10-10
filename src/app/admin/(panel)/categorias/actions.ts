"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado, reordenar } from "@/lib/admin-utils";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { slugUnico } from "@/lib/slug";

const nombreSchema = z.string().trim().min(2, "Escribe un nombre (mínimo 2 letras).").max(60, "El nombre es muy largo.");
const idSchema = z.number().int().positive();

export async function crearCategoria(nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = nombreSchema.safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const slug = await slugUnico(n.data, async (s) => !!(await db.categoria.findUnique({ where: { slug: s }, select: { id: true } })));
    const ultimo = await db.categoria.aggregate({ _max: { orden: true } });
    await db.categoria.create({ data: { nombre: n.data, slug, orden: (ultimo._max.orden ?? 0) + 1 } });
    return { ok: true, mensaje: `Categoría “${n.data}” creada.` };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function renombrarCategoria(id: number, nombre: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = nombreSchema.safeParse(nombre);
    if (!n.success) return errorDeValidacion(n.error);
    const db = await getDb();
    const slug = await slugUnico(n.data, async (s) => {
      const otra = await db.categoria.findUnique({ where: { slug: s }, select: { id: true } });
      return !!otra && otra.id !== id;
    });
    await db.categoria.update({ where: { id: idSchema.parse(id) }, data: { nombre: n.data, slug } });
    return { ok: true, mensaje: "Nombre guardado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function moverCategoria(id: number, direccion: "arriba" | "abajo"): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const todas = await db.categoria.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true } });
    const nuevo = reordenar(todas.map((c) => c.id), idSchema.parse(id), direccion);
    if (!nuevo) return { ok: true };
    await db.$transaction(nuevo.map((cid, i) => db.categoria.update({ where: { id: cid }, data: { orden: i + 1 } })));
    return { ok: true };
  } catch (e) {
    return errorInesperado(e);
  }
}

const KEY_IMAGEN = /^p\/[\w-]+\.(webp|jpg|png)$/;

/** Pone (key) o quita (null) la foto de portada de una categoría. Borra la anterior de R2. */
export async function cambiarImagenCategoria(id: number, key: string | null): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const env = await getEnv();
    const categoria = await db.categoria.findUnique({ where: { id: idSchema.parse(id) }, select: { imagenKey: true } });
    if (!categoria) return { ok: false, mensaje: "Esta categoría ya no existe." };

    if (key !== null) {
      if (!KEY_IMAGEN.test(key)) return { ok: false, mensaje: "Foto no válida." };
      // Debe ser una foto recién subida (no la de un producto).
      const [enR2, deProducto] = await Promise.all([
        env.R2_IMAGES.head(key),
        db.imagenProducto.findUnique({ where: { key }, select: { id: true } }),
      ]);
      if (!enR2 || deProducto) return { ok: false, mensaje: "La foto no terminó de subir. Inténtalo otra vez." };
    }

    await db.categoria.update({ where: { id }, data: { imagenKey: key } });
    if (categoria.imagenKey && categoria.imagenKey !== key) {
      await env.R2_IMAGES.delete(categoria.imagenKey).catch(console.error);
    }
    return { ok: true, mensaje: key ? "Foto de la categoría actualizada." : "Foto quitada; se usará la de un producto." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function eliminarCategoria(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const usados = await db.producto.count({ where: { categoriaId: idSchema.parse(id) } });
    if (usados > 0) {
      return {
        ok: false,
        mensaje: `Tiene ${usados} ${usados === 1 ? "producto" : "productos"}. Cámbialos a otra categoría o elimínalos primero.`,
      };
    }
    const borrada = await db.categoria.delete({ where: { id }, select: { imagenKey: true } });
    if (borrada.imagenKey) {
      const env = await getEnv();
      await env.R2_IMAGES.delete(borrada.imagenKey).catch(console.error);
    }
    return { ok: true, mensaje: "Categoría eliminada." };
  } catch (e) {
    return errorInesperado(e);
  }
}
