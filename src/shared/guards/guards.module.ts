import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantGuard } from './tenant.guard';
import { RolesGuard } from './roles.guard';
import { AuthTenantGuard } from './auth-tenant.guard';
import { AdminGuard } from './admin.guard';

@Module({
  providers: [
    JwtAuthGuard,
    TenantGuard,
    RolesGuard,
    AuthTenantGuard,
    AdminGuard,
  ],
  exports: [JwtAuthGuard, TenantGuard, RolesGuard, AuthTenantGuard, AdminGuard],
})
export class GuardsModule {}
