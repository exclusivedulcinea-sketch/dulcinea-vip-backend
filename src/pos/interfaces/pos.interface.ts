import { MetodoPago, EstadoVenta, EstadoCaja } from '@prisma/client';

export interface IDashboardPOS {
  ventasHoy: number;
  ventasSemana: number;
  ventasMes: number;
  transaccionesHoy: number;
  totalTransacciones: number;
  ticketPromedio: number;
  topProductos: ITopProducto[];
  ventasPorMetodo: IVentasPorMetodo[];
  ultimas10Ventas: any[];
}

export interface ITopProducto {
  productoId: string;
  productoNombre: string;
  totalVendido: number;
  totalIngresos: number;
}

export interface IVentasPorMetodo {
  metodoPago: MetodoPago;
  total: number;
  cantidad: number;
}
