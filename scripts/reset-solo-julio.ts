/**
 * Script: reset-solo-julio.ts
 * Borra TODOS los datos de la base de datos y recrea únicamente:
 *   - El negocio "Dulcinea Exclusive VIP"
 *   - El usuario julio (OWNER, PIN: 1083)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Borrando TODA la base de datos...');

  // Borrar en orden respetando FK (hijos primero)
  await prisma.solicitudRecuperacionPin.deleteMany();
  await prisma.detalleCompra.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.cajaRegistro.deleteMany();
  await prisma.movimientoInventario.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.negocio.deleteMany();

  console.log('✅  Base de datos limpia.');

  // Recrear negocio
  console.log('Creando negocio...');
  const negocio = await prisma.negocio.create({
    data: { nombre: 'Dulcinea Exclusive VIP' },
  });

  // Recrear solo julio
  console.log('Creando usuario julio...');
  const hashedPin = await bcrypt.hash('1083', 10);
  await prisma.usuario.create({
    data: {
      username: 'julio',
      pin: hashedPin,
      nombre: 'Julio',
      rol: 'OWNER',
      nombreNegocio: 'Dulcinea Exclusive VIP',
      negocioId: negocio.id,
    },
  });

  console.log('\n✅  Listo. Solo queda:');
  console.log('   julio / 1083 (OWNER) → Dulcinea Exclusive VIP');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
