import { getDb } from "@/lib/db";
import { CategoriasEditor } from "./categorias-editor";

export default async function CategoriasAdminPage() {
  const db = await getDb();
  const categorias = await db.categoria.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      imagenKey: true,
      _count: { select: { productos: true } },
      // Respaldo si no hay foto propia: la del producto destacado o más nuevo.
      productos: {
        where: { activo: true, imagenes: { some: {} } },
        orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
        take: 1,
        select: { imagenes: { orderBy: { orden: "asc" }, take: 1, select: { key: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Categorías</h1>
      <p className="text-base text-ink-soft">Se muestran como cuadrados en el inicio de la tienda, en este orden.</p>
      <CategoriasEditor categorias={categorias.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          productos: c._count.productos,
          imagenKey: c.imagenKey,
          respaldoKey: c.productos[0]?.imagenes[0]?.key ?? null,
        }))} />
    </div>
  );
}
