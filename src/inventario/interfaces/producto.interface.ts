import { Categoria, Unidad } from '@prisma/client';

export interface IProducto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: Categoria;
  marca?: string | null;
  unidad: Unidad;
  precioCompra: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductoFiltros {
  busqueda?: string;
  categoria?: Categoria;
  activo?: boolean;
  stockBajo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface IPaginacion<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
