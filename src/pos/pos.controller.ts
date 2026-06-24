import {
  Controller, Get, Post, Patch, Body,
  Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { AnularVentaDto } from './dto/anular-venta.dto';
import { QueryVentaDto } from './dto/query-venta.dto';
import { AbrirCajaDto, CerrarCajaDto } from './dto/abrir-caja.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from './guards/owner.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs del dashboard POS' })
  getDashboard(@CurrentUser('negocioId') negocioId: string) {
    return this.posService.getDashboard(negocioId);
  }

  // ── Ventas ─────────────────────────────────────────────────────────────────
  @Post('ventas')
  @ApiOperation({ summary: 'Crear venta y descontar inventario' })
  crearVenta(
    @Body() dto: CrearVentaDto,
    @CurrentUser('id') uid: string,
    @CurrentUser('nombre') nombre: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.posService.crearVenta(dto, uid, nombre, negocioId);
  }

  @Get('ventas')
  @ApiOperation({ summary: 'Historial de ventas' })
  listarVentas(
    @Query() query: QueryVentaDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.posService.listarVentas(query, negocioId);
  }

  @Get('ventas/:id')
  @ApiOperation({ summary: 'Detalle de una venta' })
  obtenerVenta(@Param('id') id: string) {
    return this.posService.obtenerVenta(id);
  }

  @Patch('ventas/:id/anular')
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Anular venta — solo OWNER/ADMIN' })
  anularVenta(
    @Param('id') id: string,
    @Body() dto: AnularVentaDto,
    @CurrentUser('id') uid: string,
    @CurrentUser('rol') rol: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.posService.anularVenta(id, dto, uid, rol, negocioId);
  }

  // ── Caja ───────────────────────────────────────────────────────────────────
  @Post('caja/abrir')
  @ApiOperation({ summary: 'Abrir caja' })
  abrirCaja(
    @Body() dto: AbrirCajaDto,
    @CurrentUser('id') uid: string,
    @CurrentUser('nombre') nombre: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.posService.abrirCaja(dto, uid, nombre, negocioId);
  }

  @Patch('caja/:cajaId/cerrar')
  @ApiOperation({ summary: 'Cerrar caja' })
  cerrarCaja(
    @Param('cajaId') cajaId: string,
    @Body() dto: CerrarCajaDto,
    @CurrentUser('id') uid: string,
  ) {
    return this.posService.cerrarCaja(cajaId, dto, uid);
  }

  @Get('caja/activa')
  @ApiOperation({ summary: 'Caja activa del usuario' })
  cajaActiva(@CurrentUser('id') uid: string) {
    return this.posService.cajaActiva(uid);
  }

  @Get('caja/historial')
  @ApiOperation({ summary: 'Historial de cajas' })
  historialCajas(@CurrentUser('id') uid: string) {
    return this.posService.historialCajas(uid);
  }
}
