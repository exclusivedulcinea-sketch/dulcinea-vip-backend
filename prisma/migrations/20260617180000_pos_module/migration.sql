-- AlterEnum: agregar OWNER
ALTER TYPE "RolUsuario" ADD VALUE IF NOT EXISTS 'OWNER';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO','NEQUI','DAVIPLATA','TRANSFERENCIA','TARJETA','MIXTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoVenta" AS ENUM ('COMPLETADA','ANULADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoCaja" AS ENUM ('ABIERTA','CERRADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable caja_registros
CREATE TABLE IF NOT EXISTS "caja_registros" (
  "id"            TEXT        NOT NULL,
  "usuarioId"     TEXT        NOT NULL,
  "cajeroNombre"  TEXT        NOT NULL,
  "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "montoApertura" DECIMAL(12,2) NOT NULL,
  "fechaCierre"   TIMESTAMP(3),
  "montoCierre"   DECIMAL(12,2),
  "totalVentas"   DECIMAL(12,2),
  "estado"        "EstadoCaja" NOT NULL DEFAULT 'ABIERTA',
  "observacion"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "caja_registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable ventas
CREATE TABLE IF NOT EXISTS "ventas" (
  "id"              TEXT         NOT NULL,
  "numeroVenta"     TEXT         NOT NULL,
  "usuarioId"       TEXT         NOT NULL,
  "cajeroNombre"    TEXT         NOT NULL,
  "fecha"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subtotal"        DECIMAL(12,2) NOT NULL,
  "descuento"       DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total"           DECIMAL(12,2) NOT NULL,
  "metodoPago"      "MetodoPago"  NOT NULL,
  "estado"          "EstadoVenta" NOT NULL DEFAULT 'COMPLETADA',
  "observacion"     TEXT,
  "anuladaEn"       TIMESTAMP(3),
  "anuladaPorId"    TEXT,
  "motivoAnulacion" TEXT,
  "cajaId"          TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable detalle_ventas
CREATE TABLE IF NOT EXISTS "detalle_ventas" (
  "id"             TEXT          NOT NULL,
  "ventaId"        TEXT          NOT NULL,
  "productoId"     TEXT          NOT NULL,
  "productoNombre" TEXT          NOT NULL,
  "productoCodigo" TEXT          NOT NULL,
  "cantidad"       DECIMAL(10,3) NOT NULL,
  "precioUnitario" DECIMAL(12,2) NOT NULL,
  "subtotal"       DECIMAL(12,2) NOT NULL,
  CONSTRAINT "detalle_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ventas_numeroVenta_key" ON "ventas"("numeroVenta");

-- AddForeignKey (IF NOT EXISTS via DO block)
DO $$ BEGIN
  ALTER TABLE "caja_registros" ADD CONSTRAINT "caja_registros_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ventas" ADD CONSTRAINT "ventas_anuladaPorId_fkey"
    FOREIGN KEY ("anuladaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cajaId_fkey"
    FOREIGN KEY ("cajaId") REFERENCES "caja_registros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_ventaId_fkey"
    FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
