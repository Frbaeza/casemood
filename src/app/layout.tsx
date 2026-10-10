import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { headers } from "next/headers";
import { getStoreName } from "@/lib/env";
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
  const storeName = await getStoreName();
  // URL base del request para que Open Graph use URLs absolutas (las imágenes en /img/...).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: { default: `${storeName} · Carcasas y accesorios para iPhone`, template: `%s | ${storeName}` },
    description: `Carcasas y accesorios para iPhone en ${storeName}. Elige tu modelo y consúltanos por WhatsApp.`,
    openGraph: { siteName: storeName, locale: "es_CL", images: ["/logo-v2.png"] },
    // Desde public/ (no como icon.png en app/, que Next incrustaría en el Worker).
    icons: { icon: "/favicon-v2-48.png", apple: "/apple-touch-icon-v2.png" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d85722",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className={`${fredoka.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
