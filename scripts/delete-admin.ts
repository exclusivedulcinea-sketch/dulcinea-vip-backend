import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.usuario.update({
    where:  { username: 'admin' },
    data:   { activo: false },
  });
  console.log('Usuario admin desactivado correctamente');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
