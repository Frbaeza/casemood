import { getDb } from "@/lib/db";
import { EnviosEditor } from "./envios-editor";

export default async function EnviosAdminPage() {
  const db = await getDb();
  const [zonas, regiones] = await Promise.all([
    db.zonaEnvio.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }], include: { _count: { select: { regiones: true } } } }),
    db.regionEnvio.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true, nombre: true, zonaId: true } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Envíos</h1>
      <p className="text-base text-ink-soft">
        Tarifas que ve el cliente en “¿Cuánto cuesta el envío?” (al final de la tienda). Revisa los valores en
        app.bluex.cl → Cotizar, con origen Maipú.
      </p>
      <EnviosEditor
        zonas={zonas.map(({ _count, ...z }) => ({ ...z, regiones: _count.regiones }))}
        regiones={regiones}
      />
    </div>
  );
}
