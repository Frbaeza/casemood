import { assertAdmin } from "@/lib/admin-auth";
import { getEnv } from "@/lib/env";

const TIPOS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
const MAX_BYTES = 3 * 1024 * 1024; // ya vienen comprimidas desde el navegador (~100–400 KB)

/**
 * Sube una imagen de producto a R2 y devuelve su key.
 * La key se asocia al producto recién al guardar el formulario.
 */
export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Tu sesión expiró. Vuelve a entrar." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const archivo = form?.get("archivo");
  if (!(archivo instanceof File)) {
    return Response.json({ error: "No llegó ninguna imagen." }, { status: 400 });
  }
  const ext = TIPOS[archivo.type];
  if (!ext) return Response.json({ error: "Formato no permitido. Usa una foto JPG, PNG o WebP." }, { status: 400 });
  if (archivo.size > MAX_BYTES) return Response.json({ error: "La imagen es demasiado grande." }, { status: 400 });

  const key = `p/${crypto.randomUUID()}.${ext}`;
  const env = await getEnv();
  await env.R2_IMAGES.put(key, await archivo.arrayBuffer(), {
    httpMetadata: { contentType: archivo.type, cacheControl: "public, max-age=31536000, immutable" },
  });

  return Response.json({ key });
}
