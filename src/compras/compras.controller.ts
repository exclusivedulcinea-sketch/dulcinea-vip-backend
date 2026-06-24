import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComprasService } from './compras.service';
import { CreateCompraDto, AnularCompraDto, QueryCompraDto } from './dto/compra.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Compras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs del módulo de compras' })
  dashboard(@CurrentUser('negocioId') negocioId: string) {
    return this.comprasService.dashboard(negocioId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva orden de compra (BORRADOR)' })
  crear(
    @Body() dto: CreateCompraDto,
    @CurrentUser('id') uid: string,
    @CurrentUser('nombre') nombre: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.comprasService.crear(dto, uid, nombre, negocioId);
  }

  @Patch(':id/aprobar')
  @ApiOperation({ summary: 'Aprobar orden de compra y actualizar inventario' })
  aprobar(
    @Param('id') id: string,
    @CurrentUser('id') uid: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.comprasService.aprobar(id, uid, negocioId);
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular compra (solo OWNER)' })
  anular(
    @Param('id') id: string,
    @Body() dto: AnularCompraDto,
    @CurrentUser('id') uid: string,
    @CurrentUser('rol') rol: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.comprasService.anular(id, dto, uid, rol, negocioId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar historial de compras' })
  listar(
    @Query() query: QueryCompraDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.comprasService.listar(query, negocioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de compra' })
  obtener(@Param('id') id: string) {
    return this.comprasService.obtener(id);
  }
}
