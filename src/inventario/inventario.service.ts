import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { QueryProductoDto } from './dto/query-producto.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { QueryMovimientoDto } from './dto/query-movimiento.dto';
import { TipoMovimiento, Prisma } from '@prisma/client';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PRODUCTOS ────────────────────────────────────────────────────────────

  async crearProducto(dto: CreateProductoDto, usuarioNombre: string, negocioId: string) {
    const existe = await this.prisma.producto.findFirst({
      where: { codigo: dto.codigo, negocioId },
    });

    if (existe) {
      throw new ConflictException(`Ya existe un producto con el código "${dto.codigo}"`);
    }

    const producto = await this.prisma.producto.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        categoria: dto.categoria,
        marca: dto.marca,
        unidad: dto.unidad,
        precioCompra: dto.precioCompra,
        precioVenta: dto.precioVenta,
        stockActual: dto.stockActual ?? 0,
        stockMinimo: dto.stockMinimo ?? 0,
        negocioId,
      },
    });

    // Si se creó con stock inicial, registrar como entrada
    if (dto.stockActual && Number(dto.stockActual) > 0) {
      await this.prisma.movimientoInventario.create({
        data: {
          productoId: producto.id,
          tipoMovimiento: TipoMovimiento.ENTRADA,
          cantidad: dto.stockActual,
          observacion: 'Stock inicial al crear producto',
          usuarioNombre,
          negocioId,
        },
      });
    }

    return producto;
  }

  async listarProductos(query: QueryProductoDto, negocioId: string) {
    const { busqueda, categoria, activo, stockBajo, page = 1, limit = 20, orderBy = 'nombre', orderDir = 'asc' } = query;

    const where: Prisma.ProductoWhereInput = { negocioId };

    if (busqueda) {
      where.OR = [
        { codigo: { contains: busqueda, mode: 'insensitive' } },
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { marca: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (categoria) where.categoria = categoria;
    if (activo !== undefined) where.activo = activo;

    if (stockBajo) {
      where.AND = [
        { activo: true },
        {
          OR: [
            { stockActual: { lte: 0 } },
            { stockActual: { lte: this.prisma.producto.fields.stockMinimo as any } },
          ],
        },
      ];
    }

    const validOrderFields: Record<string, boolean> = {
      codigo: true, nombre: true, categoria: true, stockActual: true,
      stockMinimo: true, precioCompra: true, precioVenta: true, createdAt: true,
    };

    const orderField = validOrderFields[orderBy] ? orderBy : 'nombre';

    const [data, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async obtenerProducto(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  async actualizarProducto(id: string, dto: UpdateProductoDto) {
    await this.obtenerProducto(id);

    return this.prisma.producto.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async desactivarProducto(id: string, usuarioNombre: string) {
    const producto = await this.obtenerProducto(id);

    if (!producto.activo) {
      throw new BadRequestException('El producto ya está inactivo');
    }

    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  }

  async activarProducto(id: string) {
    await this.obtenerProducto(id);

    return this.prisma.producto.update({
      where: { id },
      data: { activo: true },
    });
  }

  // ─── MOVIMIENTOS ──────────────────────────────────────────────────────────

  async registrarMovimiento(dto: CreateMovimientoDto, usuarioId: string | undefined, usuarioNombre: string, negocioId: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: dto.productoId },
    });

    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (!producto.activo) throw new BadRequestException('No se pueden registrar movimientos en productos inactivos');

    const stockActual = Number(producto.stockActual);
    const cantidad = Number(dto.cantidad);

    // Validar salida/ajuste negativo
    if (dto.tipoMovimiento === TipoMovimiento.SALIDA) {
      if (stockActual < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Stock actual: ${stockActual}, solicitado: ${cantidad}`,
        );
      }
    }

    // Para AJUSTE, la observación es obligatoria
    if (dto.tipoMovimiento === TipoMovimiento.AJUSTE && !dto.observacion?.trim()) {
      throw new BadRequestException('El motivo del ajuste es obligatorio');
    }

    // Calcular nuevo stock
    let nuevoStock: number;
    if (dto.tipoMovimiento === TipoMovimiento.ENTRADA) {
      nuevoStock = stockActual + cantidad;
    } else if (dto.tipoMovimiento === TipoMovimiento.SALIDA) {
      nuevoStock = stockActual - cantidad;
    } else {
      nuevoStock = cantidad;
    }

    if (nuevoStock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoInventario.create({
        data: {
          productoId: dto.productoId,
          tipoMovimiento: dto.tipoMovimiento,
          cantidad: dto.cantidad,
          observacion: dto.observacion,
          usuarioId,
          usuarioNombre,
          negocioId,
        },
        include: {
          producto: {
            select: { codigo: true, nombre: true, categoria: true },
          },
        },
      }),
      this.prisma.producto.update({
        where: { id: dto.productoId },
        data: { stockActual: nuevoStock },
      }),
    ]);

    return movimiento;
  }

  async listarMovimientos(query: QueryMovimientoDto, negocioId: string) {
    const { productoId, tipoMovimiento, fechaDesde, fechaHasta, page = 1, limit = 20 } = query;

    const where: Prisma.MovimientoInventarioWhereInput = { negocioId };

    if (productoId) where.productoId = productoId;
    if (tipoMovimiento) where.tipoMovimiento = tipoMovimiento;

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as any).gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        (where.fecha as any).lte = hasta;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        include: {
          producto: {
            select: { codigo: true, nombre: true, categoria: true },
          },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────────

  async getDashboard(negocioId: string) {
    const [
      totalProductos,
      productosActivos,
      productosAgotados,
      productosStockBajo,
      productosCriticosRaw,
      ultimosMovimientos,
    ] = await Promise.all([
      this.prisma.producto.count({ where: { negocioId } }),
      this.prisma.producto.count({ where: { activo: true, negocioId } }),
      this.prisma.producto.count({
        where: { activo: true, stockActual: { lte: 0 }, negocioId },
      }),
      this.prisma.producto.count({
        where: {
          activo: true,
          stockActual: { gt: 0 },
          negocioId,
        },
      }),
      this.prisma.producto.findMany({
        where: {
          activo: true,
          negocioId,
        },
        orderBy: { stockActual: 'asc' },
        take: 20,
      }),
      this.prisma.movimientoInventario.findMany({
        where: { negocioId },
        include: {
          producto: {
            select: { codigo: true, nombre: true, categoria: true },
          },
        },
        orderBy: { fecha: 'desc' },
        take: 10,
      }),
    ]);

    // Filtrar productos críticos (stock <= stockMinimo)
    const productosCriticos = productosCriticosRaw
      .filter((p) => Number(p.stockActual) <= Number(p.stockMinimo))
      .map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        stockActual: Number(p.stockActual),
        stockMinimo: Number(p.stockMinimo),
        estado:
          Number(p.stockActual) <= 0
            ? 'AGOTADO'
            : Number(p.stockActual) <= Number(p.stockMinimo) * 0.5
            ? 'CRITICO'
            : 'BAJO',
      }));

    return {
      totalProductos,
      productosActivos,
      productosAgotados,
      productosStockBajo: productosCriticos.filter((p) => p.estado !== 'AGOTADO').length,
      productosCriticos,
      ultimosMovimientos,
    };
  }

  // ─── ALERTAS ──────────────────────────────────────────────────────────────

  async getAlertas(negocioId: string) {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true, negocioId },
      orderBy: { stockActual: 'asc' },
    });

    const alertas = productos
      .filter((p) => Number(p.stockActual) <= Number(p.stockMinimo))
      .map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        stockActual: Number(p.stockActual),
        stockMinimo: Number(p.stockMinimo),
        estado:
          Number(p.stockActual) <= 0
            ? 'AGOTADO'
            : 'BAJO',
      }));

    return {
      total: alertas.length,
      agotados: alertas.filter((a) => a.estado === 'AGOTADO').length,
      bajos: alertas.filter((a) => a.estado === 'BAJO').length,
      productos: alertas,
    };
  }
}
