import { getDb } from "@/lib/db";
import type { ModeloOpcion } from "./product-form";

/** Categorías y modelos (con todas sus variantes) para el formulario de producto. */
export async function getOpcionesFormulario() {
  const db = await getDb();
  const [categorias, modelos] = await Promise.all([
    db.categoria.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true, nombre: true } }),
    db.modelo.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: {
        id: true,
        nombre: true,
        activo: true,
        variantes: { orderBy: [{ orden: "asc" }, { id: "asc" }], select: { id: true, nombre: true, activo: true } },
      },
    }),
  ]);
  return { categorias, modelos: modelos satisfies ModeloOpcion[] };
}
