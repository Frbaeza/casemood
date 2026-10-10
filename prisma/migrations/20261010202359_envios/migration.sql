-- CreateTable
CREATE TABLE "ZonaEnvio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "plazo" TEXT NOT NULL DEFAULT '',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "puntoXS" INTEGER NOT NULL DEFAULT 0,
    "puntoS" INTEGER NOT NULL DEFAULT 0,
    "puntoM" INTEGER NOT NULL DEFAULT 0,
    "puntoL" INTEGER NOT NULL DEFAULT 0,
    "domicilioXS" INTEGER NOT NULL DEFAULT 0,
    "domicilioS" INTEGER NOT NULL DEFAULT 0,
    "domicilioM" INTEGER NOT NULL DEFAULT 0,
    "domicilioL" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ZonaEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionEnvio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "zonaId" INTEGER,

    CONSTRAINT "RegionEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionEnvio_nombre_key" ON "RegionEnvio"("nombre");

-- AddForeignKey
ALTER TABLE "RegionEnvio" ADD CONSTRAINT "RegionEnvio_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonaEnvio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
