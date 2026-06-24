import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.rol === 'OWNER' || user?.rol === 'ADMIN') return true;
    throw new ForbiddenException('Solo el OWNER o ADMIN puede realizar esta acción');
  }
}
