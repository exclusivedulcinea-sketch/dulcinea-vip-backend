import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IaPredictivaService } from './ia-predictiva.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ia-predictiva')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IaPredictivaController {
  constructor(private readonly iaPredictivaService: IaPredictivaService) {}

  @Get('dashboard')
  @Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
  async getDashboard(@CurrentUser('negocioId') negocioId: string) {
    return this.iaPredictivaService.getDashboardData(negocioId);
  }

  @Post('chat')
  @Roles('OWNER', 'ADMIN', 'SUPERVISOR', 'BARTENDER')
  async chat(
    @Body() body: { message: string },
    @CurrentUser('negocioId') negocioId: string,
  ) {
    return this.iaPredictivaService.chat(body.message, negocioId);
  }
}
