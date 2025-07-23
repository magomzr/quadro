import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Viene del JwtAuthGuard
    const tenantIdFromUrl = request.params.tenantId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!tenantIdFromUrl) {
      throw new ForbiddenException('Tenant ID not provided in URL');
    }

    // Validar que el usuario pertenece al tenant de la URL
    if (user.tenantId !== tenantIdFromUrl) {
      throw new ForbiddenException(
        'Access denied: User does not belong to this tenant',
      );
    }

    return true;
  }
}
