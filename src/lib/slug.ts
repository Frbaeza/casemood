/** "iPhone 11 Pro Max" -> "iphone-11-pro-max" (sin tildes ni símbolos). */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Devuelve un slug único agregando -2, -3… si ya existe.
 * `existe` consulta la base de datos (o el alcance que corresponda).
 */
export async function slugUnico(
  texto: string,
  existe: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(texto) || "item";
  let slug = base;
  for (let n = 2; await existe(slug); n++) slug = `${base}-${n}`;
  return slug;
}
