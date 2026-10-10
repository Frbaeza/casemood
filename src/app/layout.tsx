import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { headers } from "next/headers";
import { getTienda } from "@/lib/configuracion";
import { cssPaleta, paleta } from "@/lib/tienda";
import "./globals.css";

// Todo el sitio se lee de la base de datos en cada request.
export const dynamic = "force-dynamic";

// Redondeada y amable, como el "case" del logo.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const tienda = await getTienda();
  const storeName = tienda.nombre;
  // URL base del request para que Open Graph use URLs absolutas (las imágenes en /img/...).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: { default: `${storeName} · ${tienda.frase}`, template: `%s | ${storeName}` },
    description: `${tienda.frase} para iPhone en ${storeName}. Elige tu modelo y consúltanos por WhatsApp.`,
    openGraph: { siteName: storeName, locale: "es_CL", images: [tienda.logoKey ? tienda.logo : "/logo-v2.png"] },
    // Desde public/ (no como icon.png en app/, que Next incrustaría en el Worker), o el logo subido en el admin.
    icons: tienda.logoKey
      ? { icon: tienda.logo, apple: tienda.logo }
      : { icon: "/favicon-v2-48.png", apple: "/apple-touch-icon-v2.png" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { color } = await getTienda();
  return { width: "device-width", initialScale: 1, themeColor: paleta(color).orange };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { color } = await getTienda();
  return (
    <html lang="es-CL" className={`${fredoka.variable} h-full antialiased`}>
      <head>
        {/* Color elegido en admin → Tienda */}
        <style>{cssPaleta(color)}</style>
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
