import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.negocio.findFirst().then(n => { console.log(JSON.stringify(n)); }).finally(() => prisma.$disconnect());
