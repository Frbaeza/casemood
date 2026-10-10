import { cache } from "react";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { imgUrl } from "@/lib/format";
import { LOGO_ORIGINAL, PALETA_POR_DEFECTO, PALETAS, type ClavePaleta, type Tienda } from "@/lib/tienda";

/** Fila de configuración tal como está en la base (null si aún no se guarda nada). */
export const getConfiguracionGuardada = cache(async () => {
  const db = await getDb();
  // Si falla la lectura, la tienda sigue funcionando con los valores por defecto.
  return db.configuracion.findUnique({ where: { id: 1 } }).catch((e: unknown) => {
    console.error("No se pudo leer la configuración", e);
    return null;
  });
});

/**
 * Configuración de la tienda para el request actual: lo guardado en admin → Tienda,
 * con valores por defecto y, para contacto, las variables de entorno como respaldo.
 */
export const getTienda = cache(async (): Promise<Tienda> => {
  const [c, env] = await Promise.all([getConfiguracionGuardada(), getEnv()]);
  const color = (c?.color && c.color in PALETAS ? c.color : PALETA_POR_DEFECTO) as ClavePaleta;
  return {
    nombre: c?.nombre.trim() || env.STORE_NAME?.trim() || "Casemood",
    frase: c?.frase.trim() || "Carcasas y accesorios",
    color,
    logo: c?.logoKey ? imgUrl(c.logoKey) : LOGO_ORIGINAL,
    logoKey: c?.logoKey ?? null,
    whatsapp: c?.whatsapp || env.WHATSAPP_NUMBER || "",
    instagram: c?.instagram ?? env.INSTAGRAM_USERNAME ?? "",
    aviso: c?.avisoActivo && c.avisoTexto.trim() ? c.avisoTexto.trim() : null,
    mostrarCotizador: c?.mostrarCotizador ?? true,
    mostrarDisenador: c?.mostrarDisenador ?? true,
    comunaOrigen: c?.comunaOrigen.trim() || "Maipú",
  };
});
