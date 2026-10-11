import { BackLink } from "@/components/back-link";
import { getDb } from "@/lib/db";
import { diaChile } from "@/lib/ventas";
import { getOpcionesFormulario } from "../../productos/datos-form";
import { VentaForm } from "../venta-form";

export default async function NuevaVentaPage() {
  const db = await getDb();
  const [{ categorias, modelos }, conModelo] = await Promise.all([
    getOpcionesFormulario(),
    // Categorías cuyos productos dependen del iPhone (ej. Carcasas): ahí se pregunta el modelo.
    db.categoria.findMany({ where: { productos: { some: { variantes: { some: {} } } } }, select: { id: true } }),
  ]);
  const porModelo = new Set(conModelo.map((c) => c.id));

  return (
    <div>
      <BackLink href="/admin/ventas">Volver a ventas</BackLink>
      <h1 className="font-display text-3xl font-bold">Nueva venta</h1>
      <VentaForm
        hoy={diaChile()}
        categorias={categorias.map((c) => ({ ...c, porModelo: porModelo.has(c.id) }))}
        modelos={modelos
          .filter((m) => m.activo)
          .map((m) => ({ id: m.id, nombre: m.nombre, variantes: m.variantes.filter((v) => v.activo).map(({ id, nombre }) => ({ id, nombre })) }))
          .filter((m) => m.variantes.length > 0)}
      />
    </div>
  );
}
