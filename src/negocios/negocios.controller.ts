import { Controller, Get, Post, Body, UseGuards, ConflictException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Negocios')
@ApiBearerAuth()
@Controller('negocios')
@UseGuards(JwtAuthGuard)
export class NegociosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los negocios activos' })
  async findAll() {
    return this.prisma.negocio.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo negocio (solo OWNER / SUPER_ADMIN)' })
  async create(@Body() body: { nombre: string }) {
    const nombre = (body.nombre || '').trim();
    if (!nombre) {
      throw new ConflictException('El nombre del negocio es requerido');
    }

    const existe = await this.prisma.negocio.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    if (existe) {
      throw new ConflictException(`Ya existe un negocio con el nombre "${nombre}"`);
    }

    return this.prisma.negocio.create({
      data: { nombre },
      select: { id: true, nombre: true },
    });
  }
}
