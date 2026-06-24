import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  perfil(@CurrentUser('id') userId: string) {
    return this.authService.perfil(userId);
  }

  /** Endpoint público — cualquiera puede pedir recuperación de PIN */
  @Public()
  @Post('recuperar-pin')
  @ApiOperation({ summary: 'Solicitar recuperación de PIN' })
  recuperarPin(@Body('username') username: string) {
    return this.authService.recuperarPin(username);
  }

  /** Solo OWNER (Julio) ve las solicitudes pendientes */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Get('solicitudes-pin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar solicitudes de recuperación de PIN' })
  listarSolicitudes() {
    return this.authService.listarSolicitudes();
  }

  /** Julio resuelve la solicitud asignando un nuevo PIN */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Post('solicitudes-pin/:id/resolver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver solicitud de PIN' })
  resolverSolicitud(
    @Param('id') id: string,
    @Body('nuevoPin') nuevoPin: string,
  ) {
    return this.authService.resolverSolicitud(id, nuevoPin);
  }
}
