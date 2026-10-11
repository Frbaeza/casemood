-- DropIndex
DROP INDEX "Producto_activo_categoriaId_idx";

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "agotado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock" INTEGER;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "nota" TEXT NOT NULL DEFAULT '',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER,
    "subtotal" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "medioPago" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "boleta" TEXT,
    "nota" TEXT NOT NULL DEFAULT '',
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "anuladaEn" TIMESTAMP(3),
    "creadaPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaItem" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "modelo" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "VentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Venta_anulada_fecha_idx" ON "Venta"("anulada", "fecha");

-- CreateIndex
CREATE INDEX "Venta_clienteId_fecha_idx" ON "Venta"("clienteId", "fecha");

-- CreateIndex
CREATE INDEX "VentaItem_ventaId_idx" ON "VentaItem"("ventaId");

-- CreateIndex
CREATE INDEX "VentaItem_productoId_idx" ON "VentaItem"("productoId");

-- CreateIndex
CREATE INDEX "Producto_activo_agotado_categoriaId_idx" ON "Producto"("activo", "agotado", "categoriaId");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaItem" ADD CONSTRAINT "VentaItem_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaItem" ADD CONSTRAINT "VentaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
