import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.usuario.deleteMany({ where: { username: 'admin' } });
  console.log(`Usuarios eliminados: ${deleted.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
