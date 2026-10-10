import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sin caché incremental: las páginas son dinámicas (ver next.config.ts).
export default defineCloudflareConfig({});
