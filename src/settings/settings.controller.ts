import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { SettingsService } from './settings.service';
import { AuthTenantGuard } from 'src/shared/guards/auth-tenant.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';

@Controller({
  path: 'tenants/:tenantId/settings',
  version: '1',
})
@UseGuards(AuthTenantGuard, AdminGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findSettings(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.settingsService.findSettings(tenantId);
  }

  @Patch()
  updateSettings(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() updateSettingsDto: Prisma.SettingsUpdateInput,
  ) {
    return this.settingsService.updateSettings(tenantId, updateSettingsDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteSettings(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.settingsService.deleteSettings(tenantId);
  }
}
