import { comprimirImagen } from "@/lib/comprimir-imagen";

/** Comprime una foto en el navegador (WebP ≤1200 px) y la sube a R2. Devuelve su key. */
export async function subirImagen(archivo: File): Promise<string> {
  const blob = await comprimirImagen(archivo);
  const form = new FormData();
  form.append("archivo", new File([blob], "foto", { type: blob.type }));
  const res = await fetch("/api/admin/imagenes", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { key?: string; error?: string };
  if (!res.ok || !data.key) throw new Error(data.error ?? "No se pudo subir la foto.");
  return data.key;
}
