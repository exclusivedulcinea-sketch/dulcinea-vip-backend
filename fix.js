const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const nuevoNegocio = await prisma.negocio.create({
    data: {
      nombre: 'prueba'
    }
  });
  console.log('Negocio creado:', nuevoNegocio.id);
  
  await prisma.usuario.update({
    where: { username: 'prueba' },
    data: { negocioId: nuevoNegocio.id }
  });
  console.log('Usuario prueba actualizado');
}

main().finally(() => prisma.$disconnect());
