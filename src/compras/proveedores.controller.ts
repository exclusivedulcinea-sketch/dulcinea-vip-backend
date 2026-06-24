import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @ApiOperation({ summary: 'Crear proveedor (solo ADMIN/OWNER)' })
  crear(
    @Body() dto: CreateProveedorDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.proveedoresService.crear(dto, negocioId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proveedores con filtros' })
  listar(
    @Query() filtros: any,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.proveedoresService.listar(filtros, negocioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  obtener(@Param('id') id: string) {
    return this.proveedoresService.obtenerPorId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.proveedoresService.actualizar(id, dto, negocioId);
  }

  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar proveedor' })
  desactivar(@Param('id') id: string) {
    return this.proveedoresService.desactivar(id);
  }
}
