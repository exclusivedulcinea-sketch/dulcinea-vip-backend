import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoVenta, EstadoCompra } from '@prisma/client';
import { QueryDashboardDto, RangoPeriodo } from './dto/query-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Resolver rango de fechas ─────────────────────────────────────────────
  private resolverRango(dto: QueryDashboardDto): { desde: Date; hasta: Date } {
    const ahora = new Date();
    const hoy   = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    if (dto.rango === RangoPeriodo.PERSONALIZADO && dto.fechaDesde && dto.fechaHasta) {
      const hasta = new Date(dto.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      return { desde: new Date(dto.fechaDesde), hasta };
    }

    switch (dto.rango) {
      case RangoPeriodo.HOY:
        return { desde: hoy, hasta: new Date(hoy.getTime() + 86399999) };
      case RangoPeriodo.SEMANA: {
        const lunes = new Date(hoy);
        const dia   = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
        lunes.setDate(hoy.getDate() - dia);
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        domingo.setHours(23, 59, 59, 999);
        return { desde: lunes, hasta: domingo };
      }
      case RangoPeriodo.ANIO: {
        const inicioAnio = new Date(ahora.getFullYear(), 0, 1);
        const finAnio    = new Date(ahora.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { desde: inicioAnio, hasta: finAnio };
      }
      case RangoPeriodo.MES:
      default: {
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
        return { desde: inicioMes, hasta: finMes };
      }
    }
  }

  // ─── Período anterior (para comparación de variación) ────────────────────
  private periodoAnterior(desde: Date, hasta: Date): { desdeAnterior: Date; hastaAnterior: Date } {
    const diff = hasta.getTime() - desde.getTime();
    return {
      desdeAnterior: new Date(desde.getTime() - diff - 1),
      hastaAnterior: new Date(desde.getTime() - 1),
    };
  }

  // ─── KPIs principales ─────────────────────────────────────────────────────
  async getKpis(dto: QueryDashboardDto, negocioId: string) {
    const { desde, hasta }                         = this.resolverRango(dto);
    const { desdeAnterior, hastaAnterior }         = this.periodoAnterior(desde, hasta);
    const ahora                                    = new Date();
    const inicioDia                                = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioMesActual                          = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior                        = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior                           = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999);

    const ok  = EstadoVenta.COMPLETADA;
    const okC = EstadoCompra.APROBADA;

    const [
      ventasHoy,
      ventasAyer,
      ventasMes,
      ventasMesAnterior,
      comprasMes,
      productosActivos,
      productosAgotados,
    ] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { estado: ok, fecha: { gte: inicioDia }, negocioId },
        _sum: { total: true }, _count: true,
      }),
      this.prisma.venta.aggregate({
        where: {
          estado: ok,
          fecha: {
            gte: new Date(inicioDia.getTime() - 86400000),
            lt:  inicioDia,
          },
          negocioId,
        },
        _sum: { total: true }, _count: true,
      }),
      this.prisma.venta.aggregate({
        where: { estado: ok, fecha: { gte: inicioMesActual }, negocioId },
        _sum: { total: true }, _count: true,
      }),
      this.prisma.venta.aggregate({
        where: { estado: ok, fecha: { gte: inicioMesAnterior, lte: finMesAnterior }, negocioId },
        _sum: { total: true },
      }),
      this.prisma.compra.aggregate({
        where: { estado: okC, fechaCompra: { gte: inicioMesActual }, negocioId },
        _sum: { total: true },
      }),
      this.prisma.producto.count({ where: { activo: true, negocioId } }),
      this.prisma.producto.count({ where: { activo: true, stockActual: { lte: 0 }, negocioId } }),
    ]);

    const stockBajoRaw = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM productos
      WHERE activo = true AND "stockActual" > 0 AND "stockActual" <= "stockMinimo" AND "negocioId" = ${negocioId}
    `;
    const productosStockBajoFinal = Number(stockBajoRaw[0]?.count ?? 0);

    const ventasHoyTotal   = Number(ventasHoy._sum.total ?? 0);
    const ventasAyerTotal  = Number(ventasAyer._sum.total ?? 0);
    const ventasMesTotal   = Number(ventasMes._sum.total ?? 0);
    const ventasMesAntTotal= Number(ventasMesAnterior._sum.total ?? 0);
    const comprasMesTotal  = Number(comprasMes._sum.total ?? 0);
    const utilidadEstimada = ventasMesTotal - comprasMesTotal;

    const variacionHoy  = ventasAyerTotal > 0
      ? Math.round(((ventasHoyTotal - ventasAyerTotal) / ventasAyerTotal) * 100)
      : ventasHoyTotal > 0 ? 100 : 0;

    const variacionMes  = ventasMesAntTotal > 0
      ? Math.round(((ventasMesTotal - ventasMesAntTotal) / ventasMesAntTotal) * 100)
      : ventasMesTotal > 0 ? 100 : 0;

    return {
      ventasHoy:       ventasHoyTotal,
      ventasHoyCount:  ventasHoy._count,
      variacionHoy,
      ventasMes:       ventasMesTotal,
      ventasMesCount:  ventasMes._count,
      variacionMes,
      comprasMes:      comprasMesTotal,
      utilidadEstimada,
      productosActivos,
      productosStockBajo: productosStockBajoFinal,
      productosAgotados,
    };
  }

  // ─── Gráfico de ventas por período ───────────────────────────────────────
  async getGraficoVentas(dto: QueryDashboardDto, negocioId: string) {
    const { desde, hasta } = this.resolverRango(dto);
    const ok = EstadoVenta.COMPLETADA;

    const ventas = await this.prisma.venta.findMany({
      where: { estado: ok, fecha: { gte: desde, lte: hasta }, negocioId },
      select: { fecha: true, total: true },
      orderBy: { fecha: 'asc' },
    });

    const porDia = new Map<string, number>();
    for (const v of ventas) {
      const key = v.fecha.toISOString().split('T')[0];
      porDia.set(key, (porDia.get(key) ?? 0) + Number(v.total));
    }

    const porSemana = new Map<string, number>();
    for (const v of ventas) {
      const f    = v.fecha;
      const sem  = this.getSemana(f);
      const key  = `S${sem} (${f.getFullYear()})`;
      porSemana.set(key, (porSemana.get(key) ?? 0) + Number(v.total));
    }

    const porMes = new Map<string, number>();
    const meses  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    for (const v of ventas) {
      const key = `${meses[v.fecha.getMonth()]} ${v.fecha.getFullYear()}`;
      porMes.set(key, (porMes.get(key) ?? 0) + Number(v.total));
    }

    return {
      porDia: {
        categorias: [...porDia.keys()],
        valores:    [...porDia.values()].map(v => Math.round(v)),
      },
      porSemana: {
        categorias: [...porSemana.keys()],
        valores:    [...porSemana.values()].map(v => Math.round(v)),
      },
      porMes: {
        categorias: [...porMes.keys()],
        valores:    [...porMes.values()].map(v => Math.round(v)),
      },
    };
  }

  // ─── Top productos vendidos / menos vendidos ──────────────────────────────
  async getTopProductos(dto: QueryDashboardDto, negocioId: string) {
    const { desde, hasta } = this.resolverRango(dto);
    const ok = EstadoVenta.COMPLETADA;

    const topMas = await this.prisma.detalleVenta.groupBy({
      by: ['productoId', 'productoNombre'],
      where: { venta: { estado: ok, fecha: { gte: desde, lte: hasta } }, negocioId },
      _sum:  { cantidad: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    });

    const topMenos = await this.prisma.detalleVenta.groupBy({
      by: ['productoId', 'productoNombre'],
      where: { venta: { estado: ok, fecha: { gte: desde, lte: hasta } }, negocioId },
      _sum:  { cantidad: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'asc' } },
      take: 10,
    });

    return {
      masSvendidos: topMas.map(p => ({
        productoId:    p.productoId,
        nombre:        p.productoNombre,
        cantidad:      Number(p._sum.cantidad ?? 0),
        totalIngresos: Number(p._sum.subtotal ?? 0),
      })),
      menosVendidos: topMenos.map(p => ({
        productoId:    p.productoId,
        nombre:        p.productoNombre,
        cantidad:      Number(p._sum.cantidad ?? 0),
        totalIngresos: Number(p._sum.subtotal ?? 0),
      })),
    };
  }

  // ─── Estado del inventario ────────────────────────────────────────────────
  async getInventario(negocioId: string) {
    const productosRaw = await this.prisma.producto.findMany({
      where: { activo: true, negocioId },
      orderBy: { stockActual: 'asc' },
      take: 50,
    });

    const agotados  = productosRaw.filter(p => Number(p.stockActual) <= 0);
    const criticos  = productosRaw.filter(p => Number(p.stockActual) > 0 && Number(p.stockActual) <= Number(p.stockMinimo) * 0.5 && Number(p.stockMinimo) > 0);
    const stockBajo = productosRaw.filter(p => Number(p.stockActual) > 0 && Number(p.stockActual) <= Number(p.stockMinimo) && Number(p.stockActual) > Number(p.stockMinimo) * 0.5);

    const mapear = (p: any) => ({
      id:          p.id,
      codigo:      p.codigo,
      nombre:      p.nombre,
      categoria:   p.categoria,
      stockActual: Number(p.stockActual),
      stockMinimo: Number(p.stockMinimo),
      unidad:      p.unidad,
    });

    return {
      agotados:  agotados.map(mapear),
      criticos:  criticos.map(mapear),
      stockBajo: stockBajo.map(mapear),
      totales: {
        agotados:  agotados.length,
        criticos:  criticos.length,
        stockBajo: stockBajo.length,
      },
    };
  }

  // ─── Sección Compras ──────────────────────────────────────────────────────
  async getCompras(dto: QueryDashboardDto, negocioId: string) {
    const { desde, hasta } = this.resolverRango(dto);
    const okC              = EstadoCompra.APROBADA;

    const [ultimasCompras, inversionMensual, proveedoresTop] = await Promise.all([
      this.prisma.compra.findMany({
        where: { estado: okC, fechaCompra: { gte: desde, lte: hasta }, negocioId },
        include: { proveedor: { select: { nombre: true } } },
        orderBy: { fechaCompra: 'desc' },
        take: 8,
      }),
      this.getInversionMensual(negocioId),
      this.prisma.compra.groupBy({
        by: ['proveedorId'],
        where: { estado: okC, fechaCompra: { gte: desde, lte: hasta }, negocioId },
        _count: true,
        _sum:   { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ]);

    const proveedoresConNombre = await Promise.all(
      proveedoresTop.map(async (p) => {
        const prov = await this.prisma.proveedor.findUnique({
          where:  { id: p.proveedorId },
          select: { nombre: true },
        });
        return {
          proveedorId: p.proveedorId,
          nombre:      prov?.nombre ?? 'Desconocido',
          compras:     p._count,
          total:       Number(p._sum.total ?? 0),
        };
      }),
    );

    return {
      ultimasCompras,
      inversionMensual,
      proveedoresTop: proveedoresConNombre,
    };
  }

  // ─── Actividad reciente (ventas + compras + movimientos) ─────────────────
  async getActividadReciente(negocioId: string) {
    const [ultVentas, ultCompras, ultMovimientos] = await Promise.all([
      this.prisma.venta.findMany({
        where:   { estado: EstadoVenta.COMPLETADA, negocioId },
        include: { usuario: { select: { nombre: true } } },
        orderBy: { fecha: 'desc' },
        take: 8,
      }),
      this.prisma.compra.findMany({
        where:   { estado: EstadoCompra.APROBADA, negocioId },
        include: { proveedor: { select: { nombre: true } } },
        orderBy: { fechaCompra: 'desc' },
        take: 8,
      }),
      this.prisma.movimientoInventario.findMany({
        where: { negocioId },
        include: { producto: { select: { nombre: true, categoria: true } } },
        orderBy: { fecha: 'desc' },
        take: 8,
      }),
    ]);

    const actividad = [
      ...ultVentas.map(v => ({
        tipo:    'VENTA' as const,
        fecha:   v.fecha,
        titulo:  v.numeroVenta,
        detalle: `${v.cajeroNombre} · ${v.metodoPago}`,
        monto:   Number(v.total),
        icono:   'venta',
      })),
      ...ultCompras.map(c => ({
        tipo:    'COMPRA' as const,
        fecha:   c.fechaCompra,
        titulo:  c.numeroCompra,
        detalle: c.proveedor?.nombre ?? 'Proveedor',
        monto:   Number(c.total),
        icono:   'compra',
      })),
      ...ultMovimientos.map(m => ({
        tipo:    'MOVIMIENTO' as const,
        fecha:   m.fecha,
        titulo:  m.tipoMovimiento,
        detalle: `${m.producto?.nombre ?? 'Producto'} · ${m.usuarioNombre}`,
        monto:   Number(m.cantidad),
        icono:   'movimiento',
      })),
    ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime()).slice(0, 20);

    return actividad;
  }

  // ─── Alertas ─────────────────────────────────────────────────────────────
  async getAlertas(negocioId: string) {
    const ahora           = new Date();
    const inicioDia       = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioAyer      = new Date(inicioDia.getTime() - 86400000);
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ok              = EstadoVenta.COMPLETADA;
    const okC             = EstadoCompra.APROBADA;

    const [agotadosRaw, criticosRaw, ventasHoy, ventasAyer, comprasMes, comprasMesAnterior] =
      await Promise.all([
        this.prisma.producto.findMany({
          where: { activo: true, stockActual: { lte: 0 }, negocioId },
          select: { id: true, nombre: true, codigo: true },
        }),
        this.prisma.$queryRaw<any[]>`
          SELECT id, nombre, codigo, "stockActual", "stockMinimo"
          FROM productos
          WHERE activo = true AND "stockActual" > 0 AND "stockActual" <= "stockMinimo" AND "negocioId" = ${negocioId}
          ORDER BY "stockActual" ASC
          LIMIT 10
        `,
        this.prisma.venta.aggregate({
          where: { estado: ok, fecha: { gte: inicioDia }, negocioId },
          _sum: { total: true },
        }),
        this.prisma.venta.aggregate({
          where: { estado: ok, fecha: { gte: inicioAyer, lt: inicioDia }, negocioId },
          _sum: { total: true },
        }),
        this.prisma.compra.aggregate({
          where: { estado: okC, fechaCompra: { gte: inicioMesActual }, negocioId },
          _sum: { total: true },
        }),
        this.prisma.compra.aggregate({
          where: {
            estado:     okC,
            negocioId,
            fechaCompra: {
              gte: new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1),
              lte: new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999),
            },
          },
          _sum: { total: true },
        }),
      ]);

    const alertas: {
      tipo: 'AGOTADO' | 'CRITICO' | 'CAIDA_VENTAS' | 'COMPRAS_ELEVADAS';
      nivel: 'danger' | 'warning' | 'info';
      titulo: string;
      mensaje: string;
    }[] = [];

    if (agotadosRaw.length > 0) {
      alertas.push({
        tipo:    'AGOTADO',
        nivel:   'danger',
        titulo:  `${agotadosRaw.length} producto${agotadosRaw.length > 1 ? 's' : ''} agotado${agotadosRaw.length > 1 ? 's' : ''}`,
        mensaje: agotadosRaw.slice(0, 3).map((p: any) => p.nombre).join(', ') + (agotadosRaw.length > 3 ? ` y ${agotadosRaw.length - 3} más` : ''),
      });
    }

    if (criticosRaw.length > 0) {
      alertas.push({
        tipo:    'CRITICO',
        nivel:   'warning',
        titulo:  `${criticosRaw.length} producto${criticosRaw.length > 1 ? 's' : ''} en stock crítico`,
        mensaje: criticosRaw.slice(0, 3).map((p: any) => p.nombre).join(', ') + (criticosRaw.length > 3 ? ` y ${criticosRaw.length - 3} más` : ''),
      });
    }

    const vHoy   = Number(ventasHoy._sum.total ?? 0);
    const vAyer  = Number(ventasAyer._sum.total ?? 0);
    if (vAyer > 0 && vHoy < vAyer * 0.5 && ahora.getHours() >= 20) {
      alertas.push({
        tipo:    'CAIDA_VENTAS',
        nivel:   'warning',
        titulo:  'Caída en ventas de hoy',
        mensaje: `Las ventas de hoy ($${vHoy.toLocaleString('es-CO')}) son significativamente menores que ayer ($${vAyer.toLocaleString('es-CO')})`,
      });
    }

    const cMes     = Number(comprasMes._sum.total ?? 0);
    const cMesAnt  = Number(comprasMesAnterior._sum.total ?? 0);
    if (cMesAnt > 0 && cMes > cMesAnt * 1.5) {
      alertas.push({
        tipo:    'COMPRAS_ELEVADAS',
        nivel:   'info',
        titulo:  'Compras elevadas este mes',
        mensaje: `Las compras de este mes ($${cMes.toLocaleString('es-CO')}) superan en 50% el mes anterior ($${cMesAnt.toLocaleString('es-CO')})`,
      });
    }

    return alertas;
  }

  // ─── Resumen completo del dashboard ──────────────────────────────────────
  async getResumenCompleto(dto: QueryDashboardDto, negocioId: string) {
    const [kpis, graficoVentas, topProductos, inventario, compras, actividadReciente, alertas] =
      await Promise.all([
        this.getKpis(dto, negocioId),
        this.getGraficoVentas(dto, negocioId),
        this.getTopProductos(dto, negocioId),
        this.getInventario(negocioId),
        this.getCompras(dto, negocioId),
        this.getActividadReciente(negocioId),
        this.getAlertas(negocioId),
      ]);

    return {
      kpis,
      graficoVentas,
      topProductos,
      inventario,
      compras,
      actividadReciente,
      alertas,
      generadoEn: new Date(),
      rango:      dto.rango,
    };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────
  private getSemana(fecha: Date): number {
    const inicio = new Date(fecha.getFullYear(), 0, 1);
    const diff   = fecha.getTime() - inicio.getTime();
    return Math.ceil((diff / 86400000 + inicio.getDay() + 1) / 7);
  }

  private async getInversionMensual(negocioId: string) {
    const ahora  = new Date();
    const meses  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const fecha  = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const fin    = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);

      const agg = await this.prisma.compra.aggregate({
        where: { estado: EstadoCompra.APROBADA, fechaCompra: { gte: inicio, lte: fin }, negocioId },
        _sum:  { total: true },
      });

      result.push({
        mes:   `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`,
        total: Number(agg._sum.total ?? 0),
      });
    }

    return result;
  }
}
