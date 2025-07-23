import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantGuard } from './tenant.guard';

@Injectable()
export class AuthTenantGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly tenantGuard: TenantGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtValid = await this.jwtAuthGuard.canActivate(context);
    if (!jwtValid) {
      return false;
    }

    return this.tenantGuard.canActivate(context);
  }
}
