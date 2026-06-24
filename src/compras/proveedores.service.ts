import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreateProveedorDto, negocioId: string) {
    const existe = await this.prisma.proveedor.findFirst({
      where: { nit: dto.nit, negocioId },
    });
    if (existe) throw new ConflictException('Ya existe un proveedor con este NIT en el negocio');

    return this.prisma.proveedor.create({
      data: {
        ...dto,
        negocioId,
      },
    });
  }

  async listar(filtros: any, negocioId: string) {
    const where: any = { negocioId };
    if (filtros.nombre) where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
    if (filtros.nit) where.nit = { contains: filtros.nit };
    if (filtros.estado) where.activo = filtros.estado === 'true';

    return this.prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerPorId(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    return proveedor;
  }

  async actualizar(id: string, dto: UpdateProveedorDto, negocioId: string) {
    await this.obtenerPorId(id); // validar que exista

    if (dto.nit) {
      const existe = await this.prisma.proveedor.findFirst({
        where: { nit: dto.nit, negocioId },
      });
      if (existe && existe.id !== id) throw new ConflictException('El NIT ya está en uso por otro proveedor');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }

  async desactivar(id: string) {
    await this.obtenerPorId(id);
    return this.prisma.proveedor.update({ where: { id }, data: { activo: false } });
  }
}
