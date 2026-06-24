import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'SUPER_ADMIN')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll(
    @CurrentUser('rol') rol: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    const isGlobalAdmin = rol === 'SUPER_ADMIN' || rol === 'OWNER';
    const filterNegocioId = isGlobalAdmin ? undefined : negocioId;
    return this.usuariosService.findAll(filterNegocioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('rol') rol: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    const isGlobalAdmin = rol === 'SUPER_ADMIN' || rol === 'OWNER';
    const filterNegocioId = isGlobalAdmin ? undefined : negocioId;
    return this.usuariosService.findOne(id, filterNegocioId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  create(
    @Body()
    body: {
      username: string;
      pin: string;
      nombre: string;
      nombreNegocio?: string;
      rol?: string;
      negocioId?: string;
    },
    @CurrentUser() user: any,
  ) {
    const rol = user.rol;
    const negocioId = user.negocioId;
    const isGlobalAdmin = rol === 'SUPER_ADMIN' || rol === 'OWNER';
    let assignedNegocioId = negocioId;

    if (isGlobalAdmin && body.negocioId) {
      assignedNegocioId = body.negocioId;
    }

    return this.usuariosService.create(
      {
        ...body,
        negocioId: assignedNegocioId,
      },
      user, // Pass the whole user to the service so it can make decisions
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      nombreNegocio?: string;
      rol?: string;
      pin?: string;
      activo?: boolean;
    },
    @CurrentUser('rol') rol: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    const isGlobalAdmin = rol === 'SUPER_ADMIN' || rol === 'OWNER';
    const filterNegocioId = isGlobalAdmin ? undefined : negocioId;
    return this.usuariosService.update(id, body, filterNegocioId);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({ summary: 'Activar/Desactivar usuario' })
  toggleActivo(
    @Param('id') id: string,
    @CurrentUser('rol') rol: string,
    @CurrentUser('negocioId') negocioId: string,
  ) {
    const isGlobalAdmin = rol === 'SUPER_ADMIN' || rol === 'OWNER';
    const filterNegocioId = isGlobalAdmin ? undefined : negocioId;
    return this.usuariosService.toggleActivo(id, filterNegocioId);
  }
}
