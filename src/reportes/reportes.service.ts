import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  private getDates(fechaInicio?: string, fechaFin?: string) {
    const today = new Date();
    const start = fechaInicio ? new Date(fechaInicio) : new Date(today.setHours(0,0,0,0));
    const end = fechaFin ? new Date(fechaFin) : new Date(today.setHours(23,59,59,999));
    if (!fechaInicio && !fechaFin) {
       start.setDate(start.getDate() - 30);
    }
    return { start, end };
  }

  async getReporteVentas(fechaInicio?: string, fechaFin?: string, negocioId?: string) {
    const { start, end } = this.getDates(fechaInicio, fechaFin);
    const where: any = { fecha: { gte: start, lte: end }, estado: 'COMPLETADA' };
    if (negocioId) where.negocioId = negocioId;

    const ventas = await this.prisma.venta.findMany({
      where,
      include: { detalles: true }
    });

    const totalVendido = ventas.reduce((acc, v) => acc + Number(v.total), 0);
    const numeroVentas = ventas.length;

    // Productos más vendidos
    const productosMap = new Map<string, { cantidad: number; ingresos: number; nombre: string }>();
    ventas.forEach(v => {
      v.detalles.forEach(d => {
        const current = productosMap.get(d.productoId) || { cantidad: 0, ingresos: 0, nombre: d.productoNombre };
        productosMap.set(d.productoId, {
          cantidad: current.cantidad + Number(d.cantidad),
          ingresos: current.ingresos + Number(d.subtotal),
          nombre: d.productoNombre
        });
      });
    });

    const productosArr = Array.from(productosMap.values()).sort((a, b) => b.cantidad - a.cantidad);
    const top10 = productosArr.slice(0, 10);
    const bottom10 = [...productosArr].reverse().slice(0, 10);

    // Ventas por día para gráfica
    const ventasPorDiaMap = new Map<string, number>();
    ventas.forEach(v => {
      const dateKey = v.fecha.toISOString().split('T')[0];
      ventasPorDiaMap.set(dateKey, (ventasPorDiaMap.get(dateKey) || 0) + Number(v.total));
    });
    
    const ventasPorDia = Array.from(ventasPorDiaMap.entries()).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Ventas por método de pago
    const metodoPagoMap = new Map<string, number>();
    ventas.forEach(v => {
      metodoPagoMap.set(v.metodoPago, (metodoPagoMap.get(v.metodoPago) || 0) + Number(v.total));
    });
    const ventasPorMetodo = Array.from(metodoPagoMap.entries()).map(([metodo, total]) => ({ metodo, total }));

    return {
      resumen: { totalVendido, numeroVentas },
      top10,
      bottom10,
      ventasPorDia,
      ventasPorMetodo
    };
  }

  async getReporteInventario(negocioId?: string) {
    const where: any = { activo: true };
    if (negocioId) where.negocioId = negocioId;

    const stockActual = await this.prisma.producto.findMany({
      where,
      select: { id: true, nombre: true, categoria: true, stockActual: true, stockMinimo: true }
    });

    const criticos = stockActual.filter(p => Number(p.stockActual) <= Number(p.stockMinimo));

    const totalValorizado = stockActual.reduce((acc, p) => acc + (Number(p.stockActual) * 1000), 0);

    const fecha30 = new Date();
    fecha30.setDate(fecha30.getDate() - 30);
    const whereMov: any = { fecha: { gte: fecha30 } };
    if (negocioId) whereMov.negocioId = negocioId;

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: whereMov,
      include: { producto: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' }
    });

    return {
      stockActual,
      criticos,
      movimientos
    };
  }

  async getReporteCompras(fechaInicio?: string, fechaFin?: string, negocioId?: string) {
    const { start, end } = this.getDates(fechaInicio, fechaFin);
    const where: any = { fechaCompra: { gte: start, lte: end }, estado: 'APROBADA' };
    if (negocioId) where.negocioId = negocioId;

    const compras = await this.prisma.compra.findMany({
      where,
      include: { proveedor: true }
    });

    const totalInvertido = compras.reduce((acc, c) => acc + Number(c.total), 0);
    const numeroCompras = compras.length;

    const provMap = new Map<string, { cantidad: number; total: number; nombre: string }>();
    compras.forEach(c => {
      const current = provMap.get(c.proveedorId) || { cantidad: 0, total: 0, nombre: c.proveedor.nombre };
      provMap.set(c.proveedorId, {
        cantidad: current.cantidad + 1,
        total: current.total + Number(c.total),
        nombre: c.proveedor.nombre
      });
    });
    const proveedoresTop = Array.from(provMap.values()).sort((a, b) => b.total - a.total);

    const comprasPorDiaMap = new Map<string, number>();
    compras.forEach(c => {
      const dateKey = c.fechaCompra.toISOString().split('T')[0];
      comprasPorDiaMap.set(dateKey, (comprasPorDiaMap.get(dateKey) || 0) + Number(c.total));
    });
    const comprasPorDia = Array.from(comprasPorDiaMap.entries()).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      resumen: { totalInvertido, numeroCompras },
      proveedoresTop,
      comprasPorDia,
      historial: compras.map(c => ({
        numero: c.numeroCompra,
        fecha: c.fechaCompra,
        proveedor: c.proveedor.nombre,
        total: c.total
      }))
    };
  }

  async getReporteFinanciero(fechaInicio?: string, fechaFin?: string, negocioId?: string) {
    const ventas = await this.getReporteVentas(fechaInicio, fechaFin, negocioId);
    const compras = await this.getReporteCompras(fechaInicio, fechaFin, negocioId);

    const ingresos = ventas.resumen.totalVendido;
    const egresos = compras.resumen.totalInvertido;
    const utilidadBruta = ingresos - egresos;

    const fechas = new Set([...ventas.ventasPorDia.map(v => v.fecha), ...compras.comprasPorDia.map(c => c.fecha)]);
    const tendencias = Array.from(fechas).sort().map(fecha => {
      const ingreso = ventas.ventasPorDia.find(v => v.fecha === fecha)?.total || 0;
      const egreso = compras.comprasPorDia.find(c => c.fecha === fecha)?.total || 0;
      return { fecha, ingreso, egreso, utilidad: ingreso - egreso };
    });

    return {
      ingresos,
      egresos,
      utilidadBruta,
      tendencias
    };
  }
}
