-- CreateEnum EstadoCompra
DO $$ BEGIN
  CREATE TYPE "EstadoCompra" AS ENUM ('BORRADOR', 'APROBADA', 'ANULADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable proveedores
CREATE TABLE IF NOT EXISTS "proveedores" (
  "id"        TEXT         NOT NULL,
  "nombre"    TEXT         NOT NULL,
  "nit"       TEXT         NOT NULL,
  "telefono"  TEXT         NOT NULL,
  "correo"    TEXT,
  "direccion" TEXT,
  "contacto"  TEXT,
  "activo"    BOOLEAN      NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "proveedores_nit_key" ON "proveedores"("nit");

-- CreateTable compras
CREATE TABLE IF NOT EXISTS "compras" (
  "id"              TEXT          NOT NULL,
  "numeroCompra"    TEXT          NOT NULL,
  "proveedorId"     TEXT          NOT NULL,
  "usuarioId"       TEXT          NOT NULL,
  "usuarioNombre"   TEXT          NOT NULL,
  "fechaCompra"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subtotal"        DECIMAL(12,2) NOT NULL,
  "total"           DECIMAL(12,2) NOT NULL,
  "observacion"     TEXT,
  "estado"          "EstadoCompra" NOT NULL DEFAULT 'BORRADOR',
  "aprobadaEn"      TIMESTAMP(3),
  "aprobadaPorId"   TEXT,
  "anuladaEn"       TIMESTAMP(3),
  "anuladaPorId"    TEXT,
  "motivoAnulacion" TEXT,
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "compras_numeroCompra_key" ON "compras"("numeroCompra");

-- CreateTable detalle_compras
CREATE TABLE IF NOT EXISTS "detalle_compras" (
  "id"             TEXT          NOT NULL,
  "compraId"       TEXT          NOT NULL,
  "productoId"     TEXT          NOT NULL,
  "productoNombre" TEXT          NOT NULL,
  "productoCodigo" TEXT          NOT NULL,
  "cantidad"       DECIMAL(10,3) NOT NULL,
  "costoUnitario"  DECIMAL(12,2) NOT NULL,
  "subtotal"       DECIMAL(12,2) NOT NULL,
  CONSTRAINT "detalle_compras_pkey" PRIMARY KEY ("id")
);

-- FK compras -> proveedores
DO $$ BEGIN
  ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey"
    FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK compras -> usuarios (realizó)
DO $$ BEGIN
  ALTER TABLE "compras" ADD CONSTRAINT "compras_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK compras -> usuarios (aprobó)
DO $$ BEGIN
  ALTER TABLE "compras" ADD CONSTRAINT "compras_aprobadaPorId_fkey"
    FOREIGN KEY ("aprobadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK compras -> usuarios (anuló)
DO $$ BEGIN
  ALTER TABLE "compras" ADD CONSTRAINT "compras_anuladaPorId_fkey"
    FOREIGN KEY ("anuladaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK detalle_compras -> compras
DO $$ BEGIN
  ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_compraId_fkey"
    FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK detalle_compras -> productos
DO $$ BEGIN
  ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
