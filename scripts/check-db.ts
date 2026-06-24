import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, username: true, nombre: true, rol: true, negocioId: true, nombreNegocio: true, activo: true }
  });
  console.log('=== USUARIOS ===');
  console.log(JSON.stringify(usuarios, null, 2));

  const negocios = await prisma.negocio.findMany();
  console.log('\n=== NEGOCIOS ===');
  console.log(JSON.stringify(negocios, null, 2));

  const totalProductos = await prisma.producto.count();
  const productosPorNegocio = await prisma.producto.groupBy({ by: ['negocioId'], _count: true });
  console.log(`\n=== PRODUCTOS (total: ${totalProductos}) ===`);
  console.log(JSON.stringify(productosPorNegocio, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
