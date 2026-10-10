import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRegionesEnvio } from "@/lib/catalog";
import { getEnv, getStoreName } from "@/lib/env";

// Layout del catálogo público (el admin tiene el suyo).
export default async function TiendaLayout({ children }: LayoutProps<"/">) {
  const [storeName, env, regionesEnvio] = await Promise.all([getStoreName(), getEnv(), getRegionesEnvio()]);
  return (
    <>
      <SiteHeader storeName={storeName} />
      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pb-10">{children}</main>
      <SiteFooter
        storeName={storeName}
        whatsapp={env.WHATSAPP_NUMBER}
        instagram={env.INSTAGRAM_USERNAME}
        regionesEnvio={regionesEnvio}
      />
    </>
  );
}
