import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { CustomersService } from './customers.service';
import { AuthTenantGuard } from 'src/shared/guards/auth-tenant.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Controller({
  path: 'tenants/:tenantId/customers',
  version: '1',
})
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createCustomerDto: Prisma.CustomerCreateInput,
  ) {
    return this.customersService.create(tenantId, createCustomerDto);
  }

  @Get()
  @UseGuards(AuthTenantGuard)
  findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(tenantId, page, limit, search);
  }

  @Get(':customerId')
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.findOne(tenantId, customerId);
  }

  @Patch(':customerId')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() updateCustomerDto: Prisma.CustomerUpdateInput,
  ) {
    return this.customersService.update(
      tenantId,
      customerId,
      updateCustomerDto,
    );
  }

  @Delete(':customerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthTenantGuard, RolesGuard)
  @Roles('admin')
  remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.remove(tenantId, customerId);
  }
}
