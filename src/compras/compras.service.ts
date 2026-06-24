import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompraDto, AnularCompraDto, QueryCompraDto } from './dto/compra.dto';
import { EstadoCompra, TipoMovimiento } from '@prisma/client';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  private async generarNumeroCompra(negocioId: string): Promise<string> {
    const hoy = new Date();
    const f = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.compra.count({
      where: {
        negocioId,
        createdAt: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
        },
      },
    });
    return `OC-${f}-${String(count + 1).padStart(3, '0')}`;
  }

  async crear(dto: CreateCompraDto, usuarioId: string, usuarioNombre: string, negocioId: string) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id: dto.proveedorId } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    const productos = await this.prisma.producto.findMany({
      where: { id: { in: dto.items.map(i => i.productoId) }, negocioId }
    });

    if (productos.length !== dto.items.length) {
      throw new BadRequestException('Uno o más productos no existen en el inventario');
    }

    let subtotalGeneral = 0;
    const detalles = dto.items.map(item => {
      const prod = productos.find(p => p.id === item.productoId)!;
      const sub = item.cantidad * item.costoUnitario;
      subtotalGeneral += sub;
      return {
        productoId: item.productoId,
        productoNombre: prod.nombre,
        productoCodigo: prod.codigo,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
        subtotal: sub,
        negocioId,
      };
    });

    const numeroCompra = await this.generarNumeroCompra(negocioId);

    return this.prisma.compra.create({
      data: {
        numeroCompra,
        proveedorId: dto.proveedorId,
        usuarioId,
        usuarioNombre,
        subtotal: subtotalGeneral,
        total: subtotalGeneral,
        observacion: dto.observacion,
        estado: EstadoCompra.BORRADOR,
        negocioId,
        detalles: {
          create: detalles
        }
      },
      include: {
        detalles: true,
        proveedor: true
      }
    });
  }

  async aprobar(id: string, usuarioId: string, negocioId: string) {
    const compra = await this.prisma.compra.findUnique({ where: { id }, include: { detalles: true } });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    if (compra.estado !== EstadoCompra.BORRADOR) throw new BadRequestException('Solo se pueden aprobar compras en estado BORRADOR');

    const aprobador = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });

    await this.prisma.$transaction(async (tx) => {
      await tx.compra.update({
        where: { id },
        data: {
          estado: EstadoCompra.APROBADA,
          aprobadaEn: new Date(),
          aprobadaPorId: usuarioId,
        }
      });

      for (const d of compra.detalles) {
        const prod = await tx.producto.findUnique({ where: { id: d.productoId } });
        if (prod) {
          await tx.producto.update({
            where: { id: prod.id },
            data: {
              stockActual: Number(prod.stockActual) + Number(d.cantidad),
              precioCompra: d.costoUnitario
            }
          });
          
          await tx.movimientoInventario.create({
            data: {
              productoId: prod.id,
              tipoMovimiento: TipoMovimiento.ENTRADA,
              cantidad: d.cantidad,
              observacion: `Recepción de compra ${compra.numeroCompra}`,
              usuarioId,
              usuarioNombre: aprobador?.nombre || 'Sistema',
              negocioId,
            }
          });
        }
      }
    });

    return { message: 'Compra aprobada y stock actualizado correctamente' };
  }

  async anular(id: string, dto: AnularCompraDto, usuarioId: string, rol: string, negocioId: string) {
    if (rol !== 'OWNER') throw new ForbiddenException('Solo el OWNER puede anular compras');

    const compra = await this.prisma.compra.findUnique({ where: { id }, include: { detalles: true } });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    if (compra.estado === EstadoCompra.ANULADA) throw new BadRequestException('La compra ya se encuentra anulada');

    const anulador = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });

    await this.prisma.$transaction(async (tx) => {
      await tx.compra.update({
        where: { id },
        data: {
          estado: EstadoCompra.ANULADA,
          anuladaEn: new Date(),
          anuladaPorId: usuarioId,
          motivoAnulacion: dto.motivo,
        }
      });

      if (compra.estado === EstadoCompra.APROBADA) {
        for (const d of compra.detalles) {
          const prod = await tx.producto.findUnique({ where: { id: d.productoId } });
          if (prod) {
            await tx.producto.update({
              where: { id: prod.id },
              data: {
                stockActual: Number(prod.stockActual) - Number(d.cantidad)
              }
            });
            await tx.movimientoInventario.create({
              data: {
                productoId: prod.id,
                tipoMovimiento: TipoMovimiento.SALIDA,
                cantidad: d.cantidad,
                observacion: `Reversión por anulación de compra ${compra.numeroCompra}: ${dto.motivo}`,
                usuarioId,
                usuarioNombre: anulador?.nombre || 'Sistema',
                negocioId,
              }
            });
          }
        }
      }
    });

    return { message: 'Compra anulada correctamente' };
  }

  async listar(query: QueryCompraDto, negocioId: string) {
    const { page = 1, limit = 20, fechaDesde, fechaHasta, proveedorId, estado } = query;
    const where: any = { negocioId };

    if (fechaDesde || fechaHasta) {
      where.fechaCompra = {};
      if (fechaDesde) where.fechaCompra.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const h = new Date(fechaHasta); h.setHours(23,59,59,999);
        where.fechaCompra.lte = h;
      }
    }
    if (proveedorId) where.proveedorId = proveedorId;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      this.prisma.compra.findMany({
        where,
        include: { proveedor: true, detalles: true },
        orderBy: { fechaCompra: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.compra.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async obtener(id: string) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detalles: {
          include: { producto: { select: { categoria: true, unidad: true } } }
        },
        usuario: { select: { username: true, nombre: true } },
        aprobadaPor: { select: { username: true, nombre: true } },
        anuladaPor: { select: { username: true, nombre: true } }
      }
    });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    return compra;
  }

  async dashboard(negocioId: string) {
    const ahora = new Date();
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const ok = EstadoCompra.APROBADA;

    const [aggDia, aggMes, totalProveedores, ultimas, topProductos] = await Promise.all([
      this.prisma.compra.aggregate({ where: { estado: ok, fechaCompra: { gte: inicioDia }, negocioId }, _sum: { total: true }, _count: true }),
      this.prisma.compra.aggregate({ where: { estado: ok, fechaCompra: { gte: inicioMes }, negocioId }, _sum: { total: true }, _count: true }),
      this.prisma.proveedor.count({ where: { activo: true, negocioId } }),
      this.prisma.compra.findMany({
        where: { estado: ok, negocioId },
        include: { proveedor: { select: { nombre: true } } },
        orderBy: { fechaCompra: 'desc' },
        take: 10
      }),
      this.prisma.detalleCompra.groupBy({
        by: ['productoNombre'],
        where: { compra: { estado: ok, fechaCompra: { gte: inicioMes } }, negocioId },
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 5
      })
    ]);

    const provsAgrupados = await this.prisma.compra.groupBy({
      by: ['proveedorId'],
      where: { estado: ok, fechaCompra: { gte: inicioMes }, negocioId },
      _count: true,
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    const proveedoresTop = await Promise.all(
      provsAgrupados.map(async (p) => {
        const prov = await this.prisma.proveedor.findUnique({ where: { id: p.proveedorId }, select: { nombre: true } });
        return {
          nombre: prov?.nombre,
          compras: p._count,
          total: Number(p._sum.total ?? 0)
        };
      })
    );

    return {
      comprasDiaCount: aggDia._count,
      comprasDiaTotal: Number(aggDia._sum.total ?? 0),
      comprasMesCount: aggMes._count,
      comprasMesTotal: Number(aggMes._sum.total ?? 0),
      proveedoresActivos: totalProveedores,
      ultimasCompras: ultimas,
      topProductos: topProductos.map(p => ({
        nombre: p.productoNombre,
        cantidad: Number(p._sum.cantidad ?? 0),
        total: Number(p._sum.subtotal ?? 0)
      })),
      topProveedores: proveedoresTop
    };
  }
}
