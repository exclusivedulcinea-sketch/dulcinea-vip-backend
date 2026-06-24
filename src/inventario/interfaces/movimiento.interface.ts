import { TipoMovimiento } from '@prisma/client';

export interface IMovimientoInventario {
  id: string;
  productoId: string;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  observacion?: string | null;
  usuarioId?: string | null;
  usuarioNombre: string;
  fecha: Date;
  createdAt: Date;
  producto?: {
    codigo: string;
    nombre: string;
    categoria: string;
  };
}

export interface IMovimientoFiltros {
  productoId?: string;
  tipoMovimiento?: TipoMovimiento;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
}

export interface IDashboardStats {
  totalProductos: number;
  productosActivos: number;
  productosAgotados: number;
  productosStockBajo: number;
  productosCriticos: IProductoCritico[];
  ultimosMovimientos: IMovimientoInventario[];
}

export interface IProductoCritico {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  estado: 'AGOTADO' | 'CRITICO' | 'BAJO';
}
