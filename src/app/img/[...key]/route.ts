import { getEnv } from "@/lib/env";

/**
 * Sirve imágenes de productos desde R2: /img/p/12/abc.webp
 * Las keys nunca se sobrescriben (cada subida genera una nueva), así que la caché puede ser inmutable.
 */
export async function GET(request: Request, { params }: RouteContext<"/img/[...key]">) {
  const { key } = await params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (!objectKey || objectKey.includes("..")) {
    return new Response("No encontrada", { status: 404 });
  }

  const env = await getEnv();
  const object = await env.R2_IMAGES.get(objectKey);
  if (!object) {
    return new Response("No encontrada", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (request.headers.get("If-None-Match") === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body as unknown as BodyInit, { headers });
}
