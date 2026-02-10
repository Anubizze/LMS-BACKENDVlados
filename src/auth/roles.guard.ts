import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) ??
      this.reflector.get<string[]>(ROLES_KEY, context.getClass());
    if (!requiredRoles?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user?.role)
      throw new ForbiddenException('Доступ запрещён: роль не определена');
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole)
      throw new ForbiddenException('Доступ запрещён: недостаточно прав');
    return true;
  }
}
