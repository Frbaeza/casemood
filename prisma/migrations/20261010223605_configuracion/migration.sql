-- CreateTable
CREATE TABLE "Configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL DEFAULT 'Casemood',
    "frase" TEXT NOT NULL DEFAULT 'Carcasas y accesorios',
    "color" TEXT NOT NULL DEFAULT 'naranjo',
    "logoKey" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "avisoActivo" BOOLEAN NOT NULL DEFAULT false,
    "avisoTexto" TEXT NOT NULL DEFAULT '',
    "mostrarCotizador" BOOLEAN NOT NULL DEFAULT true,
    "mostrarDisenador" BOOLEAN NOT NULL DEFAULT true,
    "comunaOrigen" TEXT NOT NULL DEFAULT 'Maipú',
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);
