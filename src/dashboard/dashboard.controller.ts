import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getResumenCompleto(
    @Query() query: QueryDashboardDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.dashboardService.getResumenCompleto(query, negocioId);
  }

  @Get('kpis')
  getKpis(
    @Query() query: QueryDashboardDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.dashboardService.getKpis(query, negocioId);
  }

  @Get('ventas/grafico')
  getGraficoVentas(
    @Query() query: QueryDashboardDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.dashboardService.getGraficoVentas(query, negocioId);
  }

  @Get('productos/top')
  getTopProductos(
    @Query() query: QueryDashboardDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.dashboardService.getTopProductos(query, negocioId);
  }

  @Get('inventario')
  getInventario(@CurrentUser('negocioId') negocioId: string) {
    return this.dashboardService.getInventario(negocioId);
  }

  @Get('compras')
  getCompras(
    @Query() query: QueryDashboardDto,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.dashboardService.getCompras(query, negocioId);
  }

  @Get('actividad')
  getActividadReciente(@CurrentUser('negocioId') negocioId: string) {
    return this.dashboardService.getActividadReciente(negocioId);
  }

  @Get('alertas')
  getAlertas(@CurrentUser('negocioId') negocioId: string) {
    return this.dashboardService.getAlertas(negocioId);
  }
}
