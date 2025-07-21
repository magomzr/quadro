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
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { SettingsService } from './settings.service';

@Controller({
  path: 'tenants/:tenantId/settings',
  version: '1',
})
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
