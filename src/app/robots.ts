import type { MetadataRoute } from "next";
import { absoluta } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, cuentas y páginas personales no deben salir en Google.
      disallow: ["/admin", "/api", "/cuenta", "/pedido", "/buscar"],
    },
    sitemap: absoluta("/sitemap.xml"),
  };
}
