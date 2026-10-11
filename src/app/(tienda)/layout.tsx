import { RegistroNavegacion } from "@/components/registro-navegacion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRegionesEnvio } from "@/lib/catalog";
import { getTienda } from "@/lib/configuracion";
import { getClienteSesion } from "@/lib/cuenta";

// Layout del catálogo público (el admin tiene el suyo).
export default async function TiendaLayout({ children }: LayoutProps<"/">) {
  const [tienda, cliente] = await Promise.all([getTienda(), getClienteSesion()]);
  const regionesEnvio = tienda.mostrarCotizador ? await getRegionesEnvio() : [];
  return (
    <>
      <RegistroNavegacion />
      <SiteHeader tienda={tienda} cliente={cliente?.nombre ?? null} />
      {tienda.aviso && (
        <p role="status" className="bg-brand px-4 py-2.5 text-center text-base font-semibold text-white">
          {tienda.aviso}
        </p>
      )}
      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pb-10">{children}</main>
      <SiteFooter tienda={tienda} regionesEnvio={regionesEnvio} />
    </>
  );
}
