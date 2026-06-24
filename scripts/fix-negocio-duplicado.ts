/**
 * Elimina el negocio duplicado y su usuario "admin/Administrador".
 * Deja solo el negocio de julio con todos los productos.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const negocios = await prisma.negocio.findMany({ orderBy: { createdAt: 'asc' } });

  if (negocios.length <= 1) {
    console.log('Solo hay un negocio, nada que limpiar.');
    return;
  }

  // El primero es el de julio (creado primero), los demás son duplicados
  const negocioBueno = negocios[0];
  const negociosDuplicados = negocios.slice(1);

  console.log(`Negocio válido: ${negocioBueno.nombre} (${negocioBueno.id})`);
  console.log(`Negocios a eliminar: ${negociosDuplicados.map(n => n.id).join(', ')}`);

  for (const neg of negociosDuplicados) {
    // Borrar todo lo relacionado al negocio duplicado (en orden por FK)
    await prisma.solicitudRecuperacionPin.deleteMany({ where: { negocioId: neg.id } });
    await prisma.detalleCompra.deleteMany({ where: { negocioId: neg.id } });
    await prisma.compra.deleteMany({ where: { negocioId: neg.id } });
    await prisma.proveedor.deleteMany({ where: { negocioId: neg.id } });
    await prisma.detalleVenta.deleteMany({ where: { negocioId: neg.id } });
    await prisma.venta.deleteMany({ where: { negocioId: neg.id } });
    await prisma.cajaRegistro.deleteMany({ where: { negocioId: neg.id } });
    await prisma.movimientoInventario.deleteMany({ where: { negocioId: neg.id } });
    await prisma.producto.deleteMany({ where: { negocioId: neg.id } });
    await prisma.usuario.deleteMany({ where: { negocioId: neg.id } });
    await prisma.negocio.delete({ where: { id: neg.id } });
    console.log(`✅ Negocio duplicado ${neg.id} eliminado.`);
  }

  // Verificar estado final
  const usuariosFinales = await prisma.usuario.findMany({
    select: { username: true, nombre: true, rol: true, negocioId: true }
  });
  const totalProductos = await prisma.producto.count();

  console.log('\n=== Estado final ===');
  console.log(`Negocio: ${negocioBueno.nombre} (${negocioBueno.id})`);
  console.log(`Usuarios: ${JSON.stringify(usuariosFinales)}`);
  console.log(`Productos: ${totalProductos}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
