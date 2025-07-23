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
import { DiscountsService } from './discounts.service';
import { AuthTenantGuard } from 'src/shared/guards/auth-tenant.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Controller({
  path: 'tenants/:tenantId/discounts',
  version: '1',
})
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthTenantGuard, RolesGuard)
  @Roles('admin')
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createDiscountDto: Prisma.DiscountCreateInput,
  ) {
    return this.discountsService.create(tenantId, createDiscountDto);
  }

  @Get()
  @UseGuards(AuthTenantGuard)
  findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('active') active?: string,
  ) {
    const filters = {
      ...(active !== undefined && { active: active === 'true' }),
    };

    return this.discountsService.findAll(tenantId, page, limit, filters);
  }

  @Get(':discountId')
  @UseGuards(AuthTenantGuard)
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('discountId', ParseUUIDPipe) discountId: string,
  ) {
    return this.discountsService.findOne(tenantId, discountId);
  }

  @Patch(':discountId')
  @UseGuards(AuthTenantGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('discountId', ParseUUIDPipe) discountId: string,
    @Body() updateDiscountDto: Prisma.DiscountUpdateInput,
  ) {
    return this.discountsService.update(
      tenantId,
      discountId,
      updateDiscountDto,
    );
  }

  @Delete(':discountId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthTenantGuard, RolesGuard)
  @Roles('admin')
  remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('discountId', ParseUUIDPipe) discountId: string,
  ) {
    return this.discountsService.remove(tenantId, discountId);
  }

  @Post('validate')
  validateCode(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body()
    body: {
      code: string;
      orderAmount: number;
    },
  ) {
    return this.discountsService.validateDiscountCode(
      tenantId,
      body.code,
      body.orderAmount,
    );
  }

  @Get(':discountId/stats')
  @UseGuards(AuthTenantGuard)
  getStats(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('discountId', ParseUUIDPipe) discountId: string,
  ) {
    return this.discountsService.getDiscountStats(tenantId, discountId);
  }
}
