"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { type ActionResult, errorDeValidacion, errorInesperado } from "@/lib/admin-utils";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { PALETAS } from "@/lib/tienda";

const configSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre de la tienda.").max(40, "Máximo 40 caracteres."),
  frase: z.string().trim().min(2, "Escribe una frase corta.").max(60, "Máximo 60 caracteres."),
  color: z.enum(Object.keys(PALETAS) as [keyof typeof PALETAS, ...(keyof typeof PALETAS)[]], {
    error: "Elige un color.",
  }),
  logoKey: z.string().regex(/^p\/[\w-]+\.(webp|jpe?g|png)$/).nullable(),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{8,15}$/, "Escribe el número con código de país, ej. 56912345678.")),
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, ""))
    .pipe(z.string().regex(/^[\w.]{0,30}$/, "Escribe solo el usuario, ej. casemood_.cl.")),
  avisoActivo: z.boolean(),
  avisoTexto: z.string().trim().max(140, "Máximo 140 caracteres."),
  mostrarCotizador: z.boolean(),
  mostrarDisenador: z.boolean(),
  comunaOrigen: z.string().trim().min(2, "Escribe la comuna desde donde envían.").max(40),
});
export type DatosTienda = z.input<typeof configSchema>;

export async function guardarTienda(datos: DatosTienda): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = configSchema.safeParse(datos);
    if (!d.success) return errorDeValidacion(d.error);
    if (d.data.avisoActivo && !d.data.avisoTexto) {
      return { ok: false, mensaje: "Escribe el texto del aviso o desactívalo.", errores: { avisoTexto: "Escribe el texto del aviso." } };
    }

    const db = await getDb();
    const anterior = await db.configuracion.findUnique({ where: { id: 1 }, select: { logoKey: true } });
    await db.configuracion.upsert({
      where: { id: 1 },
      create: { id: 1, ...d.data },
      update: d.data,
    });
    // Si se cambió o quitó el logo propio, se borra el archivo anterior de R2.
    if (anterior?.logoKey && anterior.logoKey !== d.data.logoKey) {
      const env = await getEnv();
      await env.R2_IMAGES.delete(anterior.logoKey).catch(console.error);
    }
    return { ok: true, mensaje: "Cambios guardados. Ya se ven en la tienda." };
  } catch (e) {
    return errorInesperado(e);
  }
}
