/**
 * Comprime una foto en el navegador: máximo 1200 px por lado, WebP (o JPEG si el
 * navegador no sabe generar WebP, p. ej. Safari antiguo). Respeta la orientación EXIF.
 */
export async function comprimirImagen(archivo: File, maxLado = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador no puede procesar imágenes.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const aBlob = (tipo: string, calidad: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, calidad));

  const webp = await aBlob("image/webp", 0.82);
  if (webp && webp.type === "image/webp") return webp;

  const jpeg = await aBlob("image/jpeg", 0.85);
  if (!jpeg) throw new Error("No se pudo comprimir la imagen.");
  return jpeg;
}
