import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { QueryProductoDto } from './dto/query-producto.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { QueryMovimientoDto } from './dto/query-movimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  // ─── DASHBOARD ────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs y resumen del dashboard de inventario' })
  getDashboard(@CurrentUser('negocioId') negocioId: string) {
    return this.inventarioService.getDashboard(negocioId);
  }

  @Get('alertas')
  @ApiOperation({ summary: 'Productos con stock bajo o agotado' })
  getAlertas(@CurrentUser('negocioId') negocioId: string) {
    return this.inventarioService.getAlertas(negocioId);
  }

  // ─── PRODUCTOS ────────────────────────────────────────────────────────────

  @Post('productos')
  @ApiOperation({ summary: 'Crear nuevo producto' })
  crearProducto(
    @Body() dto: CreateProductoDto,
    @CurrentUser('nombre') nombre: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.inventarioService.crearProducto(dto, nombre, negocioId);
  }

  @Get('productos')
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  listarProductos(
    @Query() query: QueryProductoDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.inventarioService.listarProductos(query, negocioId);
  }

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  obtenerProducto(@Param('id') id: string) {
    return this.inventarioService.obtenerProducto(id);
  }

  @Put('productos/:id')
  @ApiOperation({ summary: 'Actualizar producto' })
  actualizarProducto(
    @Param('id') id: string,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.inventarioService.actualizarProducto(id, dto);
  }

  @Patch('productos/:id/desactivar')
  @ApiOperation({ summary: 'Desactivar producto (activo = false)' })
  desactivarProducto(
    @Param('id') id: string,
    @CurrentUser('nombre') nombre: string,
  ) {
    return this.inventarioService.desactivarProducto(id, nombre);
  }

  @Patch('productos/:id/activar')
  @ApiOperation({ summary: 'Reactivar producto' })
  activarProducto(@Param('id') id: string) {
    return this.inventarioService.activarProducto(id);
  }

  // ─── MOVIMIENTOS ──────────────────────────────────────────────────────────

  @Post('movimientos')
  @ApiOperation({ summary: 'Registrar movimiento de inventario (entrada, salida o ajuste)' })
  registrarMovimiento(
    @Body() dto: CreateMovimientoDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('nombre') nombre: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.inventarioService.registrarMovimiento(dto, userId, nombre, negocioId);
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Historial de movimientos con filtros y paginación' })
  listarMovimientos(
    @Query() query: QueryMovimientoDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.inventarioService.listarMovimientos(query, negocioId);
  }
}
