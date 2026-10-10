/**
 * Tarifas iniciales de envío (Blue Express, origen Maipú, "tarifa fija", cotizadas el 2026-10-10)
 * y regiones con su zona. Solo crea lo que falta: no pisa lo que se edite en el admin.
 *   npx tsx prisma/seed-envios.ts
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma-node/client";

process.loadEnvFile(".dev.vars");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

type Tarifa = [number, number, number, number];
const ZONAS: { nombre: string; punto: Tarifa; domicilio: Tarifa }[] = [
  { nombre: "Zona Santiago", punto: [2600, 3700, 4300, 4900], domicilio: [3100, 4200, 4800, 5400] },
  { nombre: "Zona Centro", punto: [3800, 5100, 6800, 8700], domicilio: [4300, 5600, 7300, 9200] },
  { nombre: "Zona Norte", punto: [3800, 5100, 6800, 8700], domicilio: [4300, 5600, 7300, 9200] },
  { nombre: "Zona Sur", punto: [3800, 5100, 6800, 8700], domicilio: [4300, 5600, 7300, 9200] },
  { nombre: "Zona Extremo Norte", punto: [4700, 9000, 14000, 16500], domicilio: [5200, 9500, 14500, 17000] },
  { nombre: "Zona Extremo Sur", punto: [4700, 9000, 14000, 16500], domicilio: [5200, 9500, 14500, 17000] },
];

// De norte a sur. Las 16 regiones confirmadas cotizando en app.bluex.cl el 2026-10-10 (origen Maipú).
const REGIONES: [string, string][] = [
  ["Arica y Parinacota", "Zona Extremo Norte"],
  ["Tarapacá", "Zona Extremo Norte"],
  ["Antofagasta", "Zona Extremo Norte"],
  ["Atacama", "Zona Norte"],
  ["Coquimbo", "Zona Norte"],
  ["Valparaíso", "Zona Centro"],
  ["Metropolitana de Santiago", "Zona Santiago"],
  ["Libertador General Bernardo O'Higgins", "Zona Centro"],
  ["Maule", "Zona Centro"],
  ["Ñuble", "Zona Sur"],
  ["Biobío", "Zona Sur"],
  ["La Araucanía", "Zona Sur"],
  ["Los Ríos", "Zona Sur"],
  ["Los Lagos", "Zona Sur"],
  ["Aysén del General Carlos Ibáñez del Campo", "Zona Extremo Sur"],
  ["Magallanes y de la Antártica Chilena", "Zona Extremo Sur"],
];

async function main() {
  const ids = new Map<string, number>();
  for (const [i, z] of ZONAS.entries()) {
    const existente = await prisma.zonaEnvio.findFirst({ where: { nombre: z.nombre } });
    const zona =
      existente ??
      (await prisma.zonaEnvio.create({
        data: {
          nombre: z.nombre,
          orden: i + 1,
          puntoXS: z.punto[0], puntoS: z.punto[1], puntoM: z.punto[2], puntoL: z.punto[3],
          domicilioXS: z.domicilio[0], domicilioS: z.domicilio[1], domicilioM: z.domicilio[2], domicilioL: z.domicilio[3],
        },
      }));
    ids.set(z.nombre, zona.id);
  }
  for (const [i, [nombre, zona]] of REGIONES.entries()) {
    await prisma.regionEnvio.upsert({
      where: { nombre },
      update: {},
      create: { nombre, orden: i + 1, zonaId: ids.get(zona) },
    });
  }
  console.log(`Envíos: ${await prisma.zonaEnvio.count()} zonas, ${await prisma.regionEnvio.count()} regiones.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
