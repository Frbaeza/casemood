import { getDb } from "@/lib/db";
import { ModelosEditor } from "./modelos-editor";

export default async function ModelosAdminPage() {
  const db = await getDb();
  const modelos = await db.modelo.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      activo: true,
      variantes: {
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        select: { id: true, nombre: true, activo: true, _count: { select: { productos: true } } },
      },
    },
  });

  // Productos distintos por modelo (un producto con varias variantes del mismo modelo cuenta una vez).
  const productosPorModelo = await Promise.all(
    modelos.map((m) => db.producto.count({ where: { variantes: { some: { variante: { modeloId: m.id } } } } })),
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Modelos</h1>
      <p className="text-base text-ink-soft">Los modelos de iPhone y sus variantes, en el orden en que se ven en la tienda.</p>
      <ModelosEditor
        modelos={modelos.map((m, i) => ({
          id: m.id,
          nombre: m.nombre,
          activo: m.activo,
          productos: productosPorModelo[i],
          variantes: m.variantes.map((v) => ({ id: v.id, nombre: v.nombre, activo: v.activo, productos: v._count.productos })),
        }))}
      />
    </div>
  );
}
