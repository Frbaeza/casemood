-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "aceptoPrivacidadEn" TIMESTAMP(3),
ADD COLUMN     "emailVerificado" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AccesoCliente" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "idEnProveedor" TEXT NOT NULL,

    CONSTRAINT "AccesoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenAcceso" (
    "identificador" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "vence" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "AccesoCliente_clienteId_idx" ON "AccesoCliente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "AccesoCliente_proveedor_idEnProveedor_key" ON "AccesoCliente"("proveedor", "idEnProveedor");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAcceso_token_key" ON "TokenAcceso"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAcceso_identificador_token_key" ON "TokenAcceso"("identificador", "token");

-- AddForeignKey
ALTER TABLE "AccesoCliente" ADD CONSTRAINT "AccesoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
