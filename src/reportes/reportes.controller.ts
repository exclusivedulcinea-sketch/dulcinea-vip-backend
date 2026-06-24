import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ventas')
  @Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
  async getReporteVentas(
    @Query('fechaInicio') fechaInicio?: string, 
    @Query('fechaFin') fechaFin?: string,
    @CurrentUser('negocioId') negocioId?: string,
  ) {
    return this.reportesService.getReporteVentas(fechaInicio, fechaFin, negocioId);
  }

  @Get('inventario')
  @Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
  async getReporteInventario(@CurrentUser('negocioId') negocioId?: string) {
    return this.reportesService.getReporteInventario(negocioId);
  }

  @Get('compras')
  @Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
  async getReporteCompras(
    @Query('fechaInicio') fechaInicio?: string, 
    @Query('fechaFin') fechaFin?: string,
    @CurrentUser('negocioId') negocioId?: string,
  ) {
    return this.reportesService.getReporteCompras(fechaInicio, fechaFin, negocioId);
  }

  @Get('financiero')
  @Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
  async getReporteFinanciero(
    @Query('fechaInicio') fechaInicio?: string, 
    @Query('fechaFin') fechaFin?: string,
    @CurrentUser('negocioId') negocioId?: string,
  ) {
    return this.reportesService.getReporteFinanciero(fechaInicio, fechaFin, negocioId);
  }
}
