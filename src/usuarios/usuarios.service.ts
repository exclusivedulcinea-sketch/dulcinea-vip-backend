import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listar todos los usuarios del negocio (sin el PIN hasheado) */
  async findAll(negocioId?: string) {
    const where = negocioId ? { negocioId } : {};
    return this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        username: true,
        nombre: true,
        nombreNegocio: true,
        rol: true,
        activo: true,
        negocioId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Obtener un usuario por ID */
  async findOne(id: string, negocioId?: string) {
    const where: any = { id };
    if (negocioId) {
      where.negocioId = negocioId;
    }
    const usuario = await this.prisma.usuario.findUnique({
      where,
      select: {
        id: true,
        username: true,
        nombre: true,
        nombreNegocio: true,
        rol: true,
        activo: true,
        negocioId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!usuario) throw new BadRequestException('Usuario no encontrado');
    return usuario;
  }

  /** Crear un nuevo usuario */
  async create(data: {
    username: string;
    pin: string;
    nombre: string;
    nombreNegocio?: string;
    rol?: string;
    negocioId?: string;
  }, creator?: any) {
    // Verificar que no exista a nivel global el username
    const existe = await this.prisma.usuario.findUnique({
      where: { username: data.username },
    });
    if (existe) {
      throw new ConflictException(`El usuario "${data.username}" ya existe`);
    }

    const hashedPin = await bcrypt.hash(data.pin, 10);

    // Resolver negocioId y nombreNegocio: NUNCA crear un negocio nuevo desde aquí.
    // Si viene negocioId explícito, usarlo y leer el nombre real del negocio de la BD.
    // Si no viene negocioId, heredar el del creador.
    let finalNegocioId = data.negocioId || creator?.negocioId || null;
    let finalNombreNegocio: string | null = null;

    if (finalNegocioId) {
      const negocio = await this.prisma.negocio.findUnique({
        where: { id: finalNegocioId },
        select: { nombre: true },
      });
      finalNombreNegocio = negocio?.nombre ?? null;
    }

    return this.prisma.usuario.create({
      data: {
        username: data.username,
        pin: hashedPin,
        nombre: data.nombre,
        nombreNegocio: finalNombreNegocio,
        rol: (data.rol as any) || 'ADMIN',
        negocioId: finalNegocioId,
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        nombreNegocio: true,
        rol: true,
        activo: true,
        negocioId: true,
        createdAt: true,
      },
    });
  }

  /** Actualizar un usuario */
  async update(
    id: string,
    data: {
      nombre?: string;
      nombreNegocio?: string;
      rol?: string;
      pin?: string;
      activo?: boolean;
    },
    negocioId?: string,
  ) {
    await this.findOne(id, negocioId); // Validar existencia y permisos

    const updateData: any = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.nombreNegocio !== undefined) updateData.nombreNegocio = data.nombreNegocio;
    if (data.rol !== undefined) updateData.rol = data.rol;
    if (data.activo !== undefined) updateData.activo = data.activo;
    if (data.pin) {
      updateData.pin = await bcrypt.hash(data.pin, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        nombre: true,
        nombreNegocio: true,
        rol: true,
        activo: true,
        negocioId: true,
        updatedAt: true,
      },
    });
  }

  /** Desactivar un usuario (soft delete) */
  async toggleActivo(id: string, negocioId?: string) {
    const usuario = await this.findOne(id, negocioId); // Validar permisos

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !usuario.activo },
      select: {
        id: true,
        username: true,
        nombre: true,
        activo: true,
      },
    });
  }
}
