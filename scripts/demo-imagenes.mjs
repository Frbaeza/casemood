// Sube las imágenes SVG de demostración al R2 local (el que usan `npm run dev` y `npm run preview`).
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(".wrangler", "demo-img");
const archivos = readdirSync(DIR).filter((f) => f.endsWith(".svg"));

for (const f of archivos) {
  execFileSync(
    "npx",
    [
      "wrangler", "r2", "object", "put", `casemood-imagenes/demo/${f}`,
      "--local", "--file", join(DIR, f), "--content-type", "image/svg+xml",
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
}
console.log(`${archivos.length} imágenes subidas al R2 local.`);
