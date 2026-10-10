import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Bindings y variables del Worker (R2, DATABASE_URL, etc.) para el request actual. */
export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
