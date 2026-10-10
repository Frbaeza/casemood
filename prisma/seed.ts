/**
 * Datos iniciales: categoría "Carcasas" y modelos iPhone 11 a 16 con sus variantes.
 * Es idempotente: se puede ejecutar varias veces sin duplicar nada.
 *   npx prisma db seed
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma-node/client";
import { slugify } from "../src/lib/slug";

process.loadEnvFile(".dev.vars");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

// Del más nuevo al más antiguo (orden 1 = primero en pantalla).
const MODELOS: { nombre: string; variantes: string[] }[] = [
  { nombre: "iPhone 16", variantes: ["iPhone 16e", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"] },
  { nombre: "iPhone 15", variantes: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"] },
  { nombre: "iPhone 14", variantes: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"] },
  { nombre: "iPhone 13", variantes: ["iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max"] },
  { nombre: "iPhone 12", variantes: ["iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max"] },
  { nombre: "iPhone 11", variantes: ["iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"] },
];

async function main() {
  await prisma.categoria.upsert({
    where: { slug: "carcasas" },
    update: {},
    create: { nombre: "Carcasas", slug: "carcasas", orden: 1 },
  });

  for (const [i, m] of MODELOS.entries()) {
    const modelo = await prisma.modelo.upsert({
      where: { slug: slugify(m.nombre) },
      update: {},
      create: { nombre: m.nombre, slug: slugify(m.nombre), orden: i + 1 },
    });

    for (const [j, nombre] of m.variantes.entries()) {
      const slug = slugify(nombre);
      await prisma.variante.upsert({
        where: { modeloId_slug: { modeloId: modelo.id, slug } },
        update: {},
        create: { nombre, slug, orden: j + 1, modeloId: modelo.id },
      });
    }
  }

  const [modelos, variantes] = await Promise.all([prisma.modelo.count(), prisma.variante.count()]);
  console.log(`Seed listo: ${modelos} modelos, ${variantes} variantes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
