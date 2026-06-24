import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.rol === 'OWNER' || user?.rol === 'ADMIN') return true;
    throw new ForbiddenException('Se requiere rol OWNER o ADMIN para esta acción');
  }
}
