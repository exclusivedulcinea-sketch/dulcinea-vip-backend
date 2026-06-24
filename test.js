const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    select: { username: true, negocioId: true, nombreNegocio: true }
  });
  console.log('Usuarios:', users);
  
  const prods = await prisma.producto.findMany({
    select: { nombre: true, negocioId: true }
  });
  console.log('Productos:', prods.length);
  if (prods.length > 0) console.log('Sample prod:', prods[0]);
}

main().finally(() => prisma.$disconnect());
