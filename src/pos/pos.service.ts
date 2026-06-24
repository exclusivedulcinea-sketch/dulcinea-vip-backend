import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { AnularVentaDto } from './dto/anular-venta.dto';
import { QueryVentaDto } from './dto/query-venta.dto';
import { AbrirCajaDto, CerrarCajaDto } from './dto/abrir-caja.dto';
import { TipoMovimiento, Prisma, EstadoVenta } from '@prisma/client';

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Número de venta secuencial por día ────────────────────────────────────
  private async generarNumeroVenta(negocioId: string): Promise<string> {
    const hoy = new Date();
    const f = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.venta.count({
      where: {
        negocioId,
        fecha: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
          lt:  new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1),
        },
      },
    });
    return `V-${f}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── CREAR VENTA ───────────────────────────────────────────────────────────
  async crearVenta(dto: CrearVentaDto, usuarioId: string, cajeroNombre: string, negocioId: string) {
    const productoIds = [...new Set(dto.items.map((i) => i.productoId))];

    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds }, negocioId },
    });

    if (productos.length !== productoIds.length) {
      throw new NotFoundException('Uno o más productos no existen');
    }

    // Validar y construir líneas
    const lineas: {
      productoId: string;
      productoCodigo: string;
      productoNombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }[] = [];

    for (const item of dto.items) {
      const p = productos.find((x) => x.id === item.productoId)!;

      if (!p.activo) {
        throw new BadRequestException(`"${p.nombre}" está inactivo`);
      }
      if (Number(p.stockActual) < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para "${p.nombre}". Disponible: ${Number(p.stockActual)}, solicitado: ${item.cantidad}`,
        );
      }

      const precio = Number(p.precioVenta);
      lineas.push({
        productoId:     item.productoId,
        productoCodigo: p.codigo,
        productoNombre: p.nombre,
        cantidad:       item.cantidad,
        precioUnitario: precio,
        subtotal:       precio * item.cantidad,
      });
    }

    const subtotal  = lineas.reduce((s, l) => s + l.subtotal, 0);
    const descuento = dto.descuento ?? 0;
    const total     = subtotal - descuento;

    if (total < 0) throw new BadRequestException('El descuento supera el subtotal');

    const numeroVenta = await this.generarNumeroVenta(negocioId);

    const venta = await this.prisma.$transaction(async (tx) => {
      const nueva = await tx.venta.create({
        data: {
          numeroVenta,
          usuarioId,
          cajeroNombre,
          subtotal,
          descuento,
          total,
          metodoPago:  dto.metodoPago,
          estado:      'COMPLETADA',
          observacion: dto.observacion,
          cajaId:      dto.cajaId ?? null,
          negocioId,
          detalles: {
            create: lineas.map((l) => ({
              productoId:     l.productoId,
              productoNombre: l.productoNombre,
              productoCodigo: l.productoCodigo,
              cantidad:       l.cantidad,
              precioUnitario: l.precioUnitario,
              subtotal:       l.subtotal,
              negocioId,
            })),
          },
        },
        include: {
          detalles: true,
          usuario:  { select: { username: true, nombre: true } },
        },
      });

      for (const l of lineas) {
        const prod = productos.find((x) => x.id === l.productoId)!;
        await tx.producto.update({
          where: { id: l.productoId },
          data:  { stockActual: Number(prod.stockActual) - l.cantidad },
        });
        await tx.movimientoInventario.create({
          data: {
            productoId:     l.productoId,
            tipoMovimiento: TipoMovimiento.SALIDA,
            cantidad:       l.cantidad,
            observacion:    `Venta ${numeroVenta}`,
            usuarioId,
            usuarioNombre:  cajeroNombre,
            negocioId,
          },
        });
      }

      if (dto.cajaId) {
        const agg = await tx.venta.aggregate({
          where: { cajaId: dto.cajaId, estado: 'COMPLETADA' },
          _sum:  { total: true },
        });
        await tx.cajaRegistro.update({
          where: { id: dto.cajaId },
          data:  { totalVentas: Number(agg._sum.total ?? 0) },
        });
      }

      return nueva;
    });

    return venta;
  }

  // ── LISTAR VENTAS ─────────────────────────────────────────────────────────
  async listarVentas(query: QueryVentaDto, negocioId: string) {
    const { fechaDesde, fechaHasta, metodoPago, estado, usuarioId, page = 1, limit = 20 } = query;

    const where: Prisma.VentaWhereInput = { negocioId };
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as any).gte = new Date(fechaDesde);
      if (fechaHasta) {
        const h = new Date(fechaHasta); h.setHours(23, 59, 59, 999);
        (where.fecha as any).lte = h;
      }
    }
    if (metodoPago) where.metodoPago = metodoPago;
    if (estado)     where.estado     = estado;
    if (usuarioId)  where.usuarioId  = usuarioId;

    const [data, total] = await Promise.all([
      this.prisma.venta.findMany({
        where,
        include: {
          detalles:   true,
          usuario:    { select: { username: true, nombre: true } },
          anuladaPor: { select: { username: true, nombre: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.venta.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── OBTENER VENTA ─────────────────────────────────────────────────────────
  async obtenerVenta(id: string) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: {
          include: { producto: { select: { categoria: true, unidad: true } } },
        },
        usuario:    { select: { username: true, nombre: true } },
        anuladaPor: { select: { username: true, nombre: true } },
        caja:       true,
      },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return venta;
  }

  // ── ANULAR VENTA ──────────────────────────────────────────────────────────
  async anularVenta(id: string, dto: AnularVentaDto, usuarioId: string, rol: string, negocioId: string) {
    if (rol !== 'OWNER' && rol !== 'ADMIN') {
      throw new ForbiddenException('Solo el OWNER o ADMIN puede anular ventas');
    }

    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!venta)                               throw new NotFoundException('Venta no encontrada');
    if (venta.estado === EstadoVenta.ANULADA) throw new BadRequestException('La venta ya está anulada');

    const anulador = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true } });

    await this.prisma.$transaction(async (tx) => {
      await tx.venta.update({
        where: { id },
        data: {
          estado:          EstadoVenta.ANULADA,
          anuladaEn:       new Date(),
          anuladaPorId:    usuarioId,
          motivoAnulacion: dto.motivo,
        },
      });

      for (const d of venta.detalles) {
        const p = await tx.producto.findUnique({ where: { id: d.productoId } });
        if (p) {
          await tx.producto.update({
            where: { id: d.productoId },
            data:  { stockActual: Number(p.stockActual) + Number(d.cantidad) },
          });
          await tx.movimientoInventario.create({
            data: {
              productoId:     d.productoId,
              tipoMovimiento: TipoMovimiento.ENTRADA,
              cantidad:       d.cantidad,
              observacion:    `Anulación ${venta.numeroVenta}: ${dto.motivo}`,
              usuarioId,
              usuarioNombre:  anulador?.nombre ?? 'Sistema',
              negocioId,
            },
          });
        }
      }

      if (venta.cajaId) {
        const agg = await tx.venta.aggregate({
          where: { cajaId: venta.cajaId, estado: 'COMPLETADA', id: { not: id } },
          _sum:  { total: true },
        });
        await tx.cajaRegistro.update({
          where: { id: venta.cajaId },
          data:  { totalVentas: Number(agg._sum.total ?? 0) },
        });
      }
    });

    return { message: `Venta ${venta.numeroVenta} anulada correctamente` };
  }

  // ── DASHBOARD POS ─────────────────────────────────────────────────────────
  async getDashboard(negocioId: string) {
    const ahora       = new Date();
    const inicioDia   = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioSem   = new Date(ahora); inicioSem.setDate(ahora.getDate() - ahora.getDay()); inicioSem.setHours(0,0,0,0);
    const inicioMes   = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ok          = EstadoVenta.COMPLETADA;

    const [aggHoy, aggSem, aggMes, total, porMetodo, ultimas, topRaw] = await Promise.all([
      this.prisma.venta.aggregate({ where: { estado: ok, fecha: { gte: inicioDia }, negocioId }, _sum: { total: true }, _count: true }),
      this.prisma.venta.aggregate({ where: { estado: ok, fecha: { gte: inicioSem  }, negocioId }, _sum: { total: true }, _count: true }),
      this.prisma.venta.aggregate({ where: { estado: ok, fecha: { gte: inicioMes  }, negocioId }, _sum: { total: true }, _count: true }),
      this.prisma.venta.count({ where: { estado: ok, negocioId } }),
      this.prisma.venta.groupBy({
        by: ['metodoPago'],
        where: { estado: ok, fecha: { gte: inicioMes }, negocioId },
        _sum: { total: true }, _count: true,
      }),
      this.prisma.venta.findMany({
        where: { estado: ok, negocioId },
        include: { usuario: { select: { username: true, nombre: true } } },
        orderBy: { fecha: 'desc' },
        take: 10,
      }),
      this.prisma.detalleVenta.groupBy({
        by: ['productoId', 'productoNombre'],
        where: { venta: { estado: ok, fecha: { gte: inicioMes } }, negocioId },
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      ventasHoy:          Number(aggHoy._sum.total ?? 0),
      ventasSemana:       Number(aggSem._sum.total ?? 0),
      ventasMes:          Number(aggMes._sum.total ?? 0),
      transaccionesHoy:   aggHoy._count,
      totalTransacciones: total,
      ticketPromedio:     aggMes._count > 0 ? Math.round(Number(aggMes._sum.total ?? 0) / aggMes._count) : 0,
      topProductos: topRaw.map((p) => ({
        productoId:     p.productoId,
        productoNombre: p.productoNombre,
        totalVendido:   Number(p._sum.cantidad ?? 0),
        totalIngresos:  Number(p._sum.subtotal ?? 0),
      })),
      ventasPorMetodo: porMetodo.map((v) => ({
        metodoPago: v.metodoPago,
        total:      Number(v._sum.total ?? 0),
        cantidad:   v._count,
      })),
      ultimas10Ventas: ultimas,
    };
  }

  // ── CAJA ──────────────────────────────────────────────────────────────────
  async abrirCaja(dto: AbrirCajaDto, usuarioId: string, cajeroNombre: string, negocioId: string) {
    const abierta = await this.prisma.cajaRegistro.findFirst({ where: { usuarioId, estado: 'ABIERTA' } });
    if (abierta) throw new ConflictException('Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.');

    return this.prisma.cajaRegistro.create({
      data: { usuarioId, cajeroNombre, montoApertura: dto.montoApertura, observacion: dto.observacion, estado: 'ABIERTA', negocioId },
    });
  }

  async cerrarCaja(cajaId: string, dto: CerrarCajaDto, usuarioId: string) {
    const caja = await this.prisma.cajaRegistro.findUnique({ where: { id: cajaId } });
    if (!caja)                      throw new NotFoundException('Caja no encontrada');
    if (caja.usuarioId !== usuarioId) throw new ForbiddenException('No puedes cerrar una caja que no es tuya');
    if (caja.estado === 'CERRADA')  throw new BadRequestException('La caja ya está cerrada');

    const agg = await this.prisma.venta.aggregate({
      where: { cajaId, estado: 'COMPLETADA' },
      _sum:  { total: true },
    });

    return this.prisma.cajaRegistro.update({
      where: { id: cajaId },
      data: {
        estado:      'CERRADA',
        fechaCierre: new Date(),
        montoCierre: dto.montoCierre,
        totalVentas: Number(agg._sum.total ?? 0),
        observacion: dto.observacion ?? caja.observacion,
      },
    });
  }

  async cajaActiva(usuarioId: string) {
    return this.prisma.cajaRegistro.findFirst({
      where:   { usuarioId, estado: 'ABIERTA' },
      include: { _count: { select: { ventas: true } } },
    });
  }

  async historialCajas(usuarioId?: string) {
    return this.prisma.cajaRegistro.findMany({
      where:   usuarioId ? { usuarioId } : undefined,
      include: {
        usuario: { select: { username: true, nombre: true } },
        _count:  { select: { ventas: true } },
      },
      orderBy: { fechaApertura: 'desc' },
      take: 50,
    });
  }
}
