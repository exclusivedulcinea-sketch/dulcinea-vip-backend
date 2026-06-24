import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, pin } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { username },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario o PIN incorrecto');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo. Contacte al administrador.');
    }

    const pinValido = await bcrypt.compare(pin, usuario.pin);
    if (!pinValido) {
      throw new UnauthorizedException('Usuario o PIN incorrecto');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      nombreNegocio: usuario.nombreNegocio ?? undefined,
      negocioId: usuario.negocioId ?? undefined,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        nombreNegocio: usuario.nombreNegocio ?? null,
        negocioId: usuario.negocioId ?? null,
        rol: usuario.rol,
      },
    };
  }

  async perfil(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nombre: true,
        nombreNegocio: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    return usuario;
  }

  // ── Recuperación de PIN ────────────────────────────────────────────────
  async recuperarPin(username: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username },
      select: { id: true, username: true, nombre: true, activo: true, negocioId: true },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado en el sistema');
    }

    if (!usuario.activo) {
      throw new BadRequestException('Este usuario está inactivo');
    }

    // Guardar la solicitud en la BD para que Julio la vea
    await this.prisma.solicitudRecuperacionPin.create({
      data: {
        usuarioId:     usuario.id,
        usuarioNombre: usuario.nombre,
        username:      usuario.username,
        estado:        'PENDIENTE',
        negocioId:     usuario.negocioId,
      },
    });

    return {
      message: `Solicitud enviada. Julio revisará tu solicitud y te asignará un nuevo PIN a la brevedad.`,
    };
  }

  // ── Listar solicitudes pendientes (solo Julio/OWNER) ──────────────────
  async listarSolicitudes() {
    return this.prisma.solicitudRecuperacionPin.findMany({
      orderBy: { creadaEn: 'desc' },
      take: 50,
    });
  }

  // ── Resolver solicitud: asignar nuevo PIN ─────────────────────────────
  async resolverSolicitud(solicitudId: string, nuevoPin: string) {
    const solicitud = await this.prisma.solicitudRecuperacionPin.findUnique({
      where: { id: solicitudId },
    });
    if (!solicitud) throw new BadRequestException('Solicitud no encontrada');

    const hashedPin = await bcrypt.hash(nuevoPin, 10);

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: solicitud.usuarioId },
        data:  { pin: hashedPin },
      }),
      this.prisma.solicitudRecuperacionPin.update({
        where: { id: solicitudId },
        data:  { estado: 'RESUELTA', resueltaEn: new Date() },
      }),
    ]);

    return { message: `PIN actualizado para ${solicitud.usuarioNombre}` };
  }
}
