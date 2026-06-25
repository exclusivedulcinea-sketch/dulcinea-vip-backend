import { PrismaClient, Categoria, Unidad } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando negocio por defecto...');
  const negocio = await prisma.negocio.create({
    data: {
      nombre: 'Dulcinea Exclusive VIP',
    },
  });

  const negocioId = negocio.id;

  console.log('Creando usuario Super Administrador...');
  const hashedPinSuper = await bcrypt.hash('0000', 10);
  await prisma.usuario.create({
    data: {
      username: 'nexora',
      pin: hashedPinSuper,
      nombre: 'Nexora Soft',
      rol: 'SUPER_ADMIN',
      negocioId: null, // Super admin no pertenece a un solo negocio
    },
  });

  // Crear usuarios con PIN hasheado
  const usuarios = [
    { username: 'julio',  pin: '1083', nombre: 'Julio',  rol: 'OWNER' as const, nombreNegocio: 'Dulcinea Exclusive VIP' },
    { username: 'robin',  pin: '1996', nombre: 'Robin',  rol: 'OWNER' as const, nombreNegocio: 'Dulcinea Exclusive VIP' },
    { username: 'alban',  pin: '1919', nombre: 'Alban',  rol: 'OWNER' as const, nombreNegocio: 'Dulcinea Exclusive VIP' },
    { username: 'admin',  pin: '1234', nombre: 'Administrador', rol: 'ADMIN' as const, nombreNegocio: 'Dulcinea Exclusive VIP' },
  ];

  for (const u of usuarios) {
    const hashedPin = await bcrypt.hash(u.pin, 10);
    await prisma.usuario.create({
      data: {
        username: u.username,
        pin: hashedPin,
        nombre: u.nombre,
        rol: u.rol,
        nombreNegocio: u.nombreNegocio,
        negocioId: negocioId,
      },
    });
    console.log(`Usuario creado: ${u.username} / PIN: ${u.pin}`);
  }

  // Productos de ejemplo
  const productos = [
    {
      codigo: 'LIC-001',
      nombre: "Ron Bacardí Añejo",
      categoria: Categoria.LICOR,
      marca: 'Bacardí',
      unidad: Unidad.BOTELLA,
      precioCompra: 45000,
      precioVenta: 75000,
      stockActual: 24,
      stockMinimo: 6,
      negocioId: negocioId,
    },
    {
      codigo: 'LIC-002',
      nombre: "Whisky Jack Daniel's",
      categoria: Categoria.LICOR,
      marca: "Jack Daniel's",
      unidad: Unidad.BOTELLA,
      precioCompra: 120000,
      precioVenta: 180000,
      stockActual: 12,
      stockMinimo: 4,
      negocioId: negocioId,
    },
    {
      codigo: 'LIC-003',
      nombre: 'Vodka Absolut',
      categoria: Categoria.LICOR,
      marca: 'Absolut',
      unidad: Unidad.BOTELLA,
      precioCompra: 75000,
      precioVenta: 120000,
      stockActual: 3,
      stockMinimo: 5,
      negocioId: negocioId,
    },
    {
      codigo: 'CER-001',
      nombre: 'Cerveza Club Colombia',
      categoria: Categoria.CERVEZA,
      marca: 'Bavaria',
      unidad: Unidad.CAJA,
      precioCompra: 48000,
      precioVenta: 72000,
      stockActual: 20,
      stockMinimo: 10,
      negocioId: negocioId,
    },
    {
      codigo: 'CER-002',
      nombre: 'Cerveza Heineken',
      categoria: Categoria.CERVEZA,
      marca: 'Heineken',
      unidad: Unidad.CAJA,
      precioCompra: 72000,
      precioVenta: 108000,
      stockActual: 8,
      stockMinimo: 10,
      negocioId: negocioId,
    },
    {
      codigo: 'ENE-001',
      nombre: 'Red Bull Lata 250ml',
      categoria: Categoria.ENERGIZANTE,
      marca: 'Red Bull',
      unidad: Unidad.LATA,
      precioCompra: 5500,
      precioVenta: 9000,
      stockActual: 48,
      stockMinimo: 24,
      negocioId: negocioId,
    },
    {
      codigo: 'GAS-001',
      nombre: 'Coca-Cola 2L',
      categoria: Categoria.GASEOSA,
      marca: 'Coca-Cola',
      unidad: Unidad.UNIDAD,
      precioCompra: 4500,
      precioVenta: 7000,
      stockActual: 0,
      stockMinimo: 12,
      negocioId: negocioId,
    },
    {
      codigo: 'AGU-001',
      nombre: 'Agua Cristal 600ml',
      categoria: Categoria.AGUA,
      marca: 'Cristal',
      unidad: Unidad.UNIDAD,
      precioCompra: 1200,
      precioVenta: 2500,
      stockActual: 60,
      stockMinimo: 24,
      negocioId: negocioId,
    },
  ];

  for (const producto of productos) {
    await prisma.producto.create({
      data: producto,
    });
  }

  console.log(`\n${productos.length} productos de ejemplo creados en el negocio ${negocio.nombre}`);
  console.log('\n─── Credenciales de acceso ───────────────────');
  console.log('  nexora / 0000 (SUPER_ADMIN)');
  console.log('  julio  / 1083 (OWNER)');
  console.log('  robin  / 1996 (OWNER)');
  console.log('  alban  / 1919 (OWNER)');
  console.log('  admin  / 1234 (ADMIN)');
  console.log('──────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.log('Seed ignorado: Los datos ya existen o hubo un error.');
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
