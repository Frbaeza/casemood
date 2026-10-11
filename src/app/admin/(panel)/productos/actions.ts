"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado } from "@/lib/admin-utils";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { slugUnico } from "@/lib/slug";

const MAX_IMAGENES = 6;
const KEY_IMAGEN = /^(p|demo)\/[\w.-]+\.(webp|jpg|png|svg)$/;

const json = <T extends z.ZodType>(schema: T) =>
  z.string().transform((s, ctx) => {
    try {
      return JSON.parse(s) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Datos inválidos" });
      return z.NEVER;
    }
  }).pipe(schema);

const productoSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: z.string().trim().min(2, "Escribe el nombre (mínimo 2 letras).").max(120, "El nombre es muy largo."),
  // Acepta "12990", "12.990" o "$12.990"
  precio: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length > 0, "Escribe el precio.")
    .transform(Number)
    .pipe(z.number().int().min(0).max(10_000_000, "El precio es muy alto.")),
  categoriaId: z.coerce.number({ error: "Elige una categoría." }).int().positive("Elige una categoría."),
  descripcion: z.string().trim().max(3000, "La descripción es muy larga.").default(""),
  activo: z.boolean(),
  destacado: z.boolean(),
  imagenes: json(z.array(z.string().regex(KEY_IMAGEN)).max(MAX_IMAGENES, `Máximo ${MAX_IMAGENES} fotos.`)),
  variantes: json(
    z.array(z.object({ varianteId: z.number().int().positive(), disponible: z.boolean() })).max(500),
  ),
});

export async function guardarProducto(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await assertAdmin();

    const parsed = productoSchema.safeParse({
      id: formData.get("id") || undefined,
      nombre: formData.get("nombre") ?? "",
      precio: formData.get("precio") ?? "",
      categoriaId: formData.get("categoriaId") || undefined,
      descripcion: formData.get("descripcion") ?? "",
      activo: formData.get("activo") === "on",
      destacado: formData.get("destacado") === "on",
      imagenes: formData.get("imagenes") ?? "[]",
      variantes: formData.get("variantes") ?? "[]",
    });
    if (!parsed.success) return errorDeValidacion(parsed.error);
    const d = parsed.data;

    const db = await getDb();
    const env = await getEnv();

    // Integridad: categoría y variantes existentes, sin duplicados.
    const categoria = await db.categoria.findUnique({ where: { id: d.categoriaId }, select: { id: true } });
    if (!categoria) return { ok: false, mensaje: "Revisa los campos marcados.", errores: { categoriaId: "Elige una categoría." } };

    const variantesIds = [...new Set(d.variantes.map((v) => v.varianteId))];
    const existentes = await db.variante.findMany({ where: { id: { in: variantesIds } }, select: { id: true } });
    const validas = new Set(existentes.map((v) => v.id));
    const variantes = d.variantes.filter((v, i, arr) => validas.has(v.varianteId) && arr.findIndex((x) => x.varianteId === v.varianteId) === i);

    // Imágenes: solo keys propias de este producto o recién subidas (sin dueño) que existan en R2.
    const imagenes = [...new Set(d.imagenes)];
    const conDueno = await db.imagenProducto.findMany({ where: { key: { in: imagenes } }, select: { key: true, productoId: true } });
    if (conDueno.some((img) => img.productoId !== d.id)) {
      return { ok: false, mensaje: "Una de las fotos pertenece a otro producto." };
    }
    const nuevas = imagenes.filter((k) => !conDueno.some((img) => img.key === k));
    const enR2 = await Promise.all(nuevas.map((k) => env.R2_IMAGES.head(k)));
    if (enR2.some((obj) => !obj)) {
      return { ok: false, mensaje: "Una foto no terminó de subir. Quítala y vuelve a agregarla." };
    }

    const datos = {
      nombre: d.nombre,
      precio: d.precio,
      categoriaId: d.categoriaId,
      descripcion: d.descripcion,
      activo: d.activo,
      destacado: d.destacado,
    };

    let id = d.id;
    let keysEliminadas: string[] = [];

    if (id) {
      const actual = await db.producto.findUnique({ where: { id }, select: { imagenes: { select: { key: true } } } });
      if (!actual) return { ok: false, mensaje: "Este producto ya no existe." };
      keysEliminadas = actual.imagenes.map((i) => i.key).filter((k) => !imagenes.includes(k));

      await db.$transaction([
        db.producto.update({ where: { id }, data: datos }),
        db.productoVariante.deleteMany({ where: { productoId: id } }),
        db.productoVariante.createMany({ data: variantes.map((v) => ({ ...v, productoId: id! })) }),
        db.imagenProducto.deleteMany({ where: { productoId: id, key: { notIn: imagenes } } }),
        ...imagenes.map((key, orden) =>
          db.imagenProducto.upsert({
            where: { key },
            update: { orden },
            create: { key, orden, productoId: id! },
          }),
        ),
      ]);
    } else {
      // El slug se genera una sola vez: así los links compartidos por WhatsApp no se rompen al renombrar.
      const slug = await slugUnico(d.nombre, async (s) => !!(await db.producto.findUnique({ where: { slug: s }, select: { id: true } })));
      const creado = await db.producto.create({
        data: {
          ...datos,
          slug,
          imagenes: { create: imagenes.map((key, orden) => ({ key, orden })) },
          variantes: { create: variantes },
        },
        select: { id: true },
      });
      id = creado.id;
    }

    if (keysEliminadas.length) await env.R2_IMAGES.delete(keysEliminadas).catch(console.error);

    return { ok: true, id, mensaje: d.id ? "Cambios guardados." : "Producto creado." };
  } catch (e) {
    return errorInesperado(e);
  }
}

export async function eliminarProducto(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const producto = await db.producto.findUnique({ where: { id }, select: { imagenes: { select: { key: true } } } });
    if (!producto) return { ok: true, mensaje: "El producto ya estaba eliminado." };

    await db.producto.delete({ where: { id } }); // imágenes y compatibilidad se borran en cascada
    const keys = producto.imagenes.map((i) => i.key).filter((k) => k.startsWith("p/"));
    if (keys.length) {
      const env = await getEnv();
      await env.R2_IMAGES.delete(keys).catch(console.error);
    }
    return { ok: true, mensaje: "Producto eliminado." };
  } catch (e) {
    return errorInesperado(e);
  }
}
