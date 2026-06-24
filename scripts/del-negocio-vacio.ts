import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const negocios = await prisma.negocio.findMany({ orderBy: { createdAt: 'asc' } });
  console.log('Negocios encontrados:');
  for (const n of negocios) {
    const usuarios = await prisma.usuario.count({ where: { negocioId: n.id } });
    const productos = await prisma.producto.count({ where: { negocioId: n.id } });
    console.log(`  [${n.id}] "${n.nombre}" — usuarios: ${usuarios}, productos: ${productos}`);
  }

  // Eliminar los que no tienen ni usuarios ni productos
  for (const n of negocios) {
    const usuarios = await prisma.usuario.count({ where: { negocioId: n.id } });
    const productos = await prisma.producto.count({ where: { negocioId: n.id } });
    if (usuarios === 0 && productos === 0) {
      await prisma.negocio.delete({ where: { id: n.id } });
      console.log(`\n✅ Negocio vacío eliminado: [${n.id}] "${n.nombre}"`);
    }
  }

  console.log('\nNegocios restantes:', await prisma.negocio.count());
}

main().catch(console.error).finally(() => prisma.$disconnect());
