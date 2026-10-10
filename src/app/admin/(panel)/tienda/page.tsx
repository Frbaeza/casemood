import { getConfiguracionGuardada, getTienda } from "@/lib/configuracion";
import { TiendaEditor } from "./tienda-editor";

export default async function TiendaAdminPage() {
  const [t, guardada] = await Promise.all([getTienda(), getConfiguracionGuardada()]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Tienda</h1>
      <p className="text-base text-ink-soft">Apariencia, contacto y secciones de la tienda. Los cambios se ven al guardar.</p>
      <TiendaEditor
        // key: al guardar, el formulario toma los valores nuevos.
        key={JSON.stringify([t, guardada?.avisoActivo, guardada?.avisoTexto])}
        inicial={{
          nombre: t.nombre,
          frase: t.frase,
          color: t.color,
          logoKey: t.logoKey,
          whatsapp: t.whatsapp,
          instagram: t.instagram,
          // El texto se conserva aunque el aviso esté apagado.
          avisoActivo: guardada?.avisoActivo ?? false,
          avisoTexto: guardada?.avisoTexto ?? "",
          mostrarCotizador: t.mostrarCotizador,
          mostrarDisenador: t.mostrarDisenador,
          comunaOrigen: t.comunaOrigen,
        }}
      />
    </div>
  );
}
