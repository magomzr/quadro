import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LoggerService } from './logger.service';
import { AuthTenantGuard } from 'src/shared/guards/auth-tenant.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';

@Controller({
  path: 'tenants/:tenantId/logs',
  version: '1',
})
@UseGuards(AuthTenantGuard, AdminGuard)
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get()
  async getAllLogs(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters = {
      action,
      resource,
      userId,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    return this.loggerService.findAllByTenant(tenantId, filters);
  }

  @Get('paginated')
  async getPaginatedLogs(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters = {
      action,
      resource,
      userId,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    return this.loggerService.findPaginatedByTenant(
      tenantId,
      page,
      limit,
      filters,
    );
  }
}
