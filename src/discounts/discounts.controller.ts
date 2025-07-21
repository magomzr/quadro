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
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DiscountsService } from './discounts.service';

@Controller({
  path: 'tenants/:tenantId/discounts',
  version: '1',
})
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createDiscountDto: Prisma.DiscountCreateInput,
  ) {
    return this.discountsService.create(tenantId, createDiscountDto);
  }

  @Get()
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
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('discountId', ParseUUIDPipe) discountId: string,
  ) {
    return this.discountsService.findOne(tenantId, discountId);
  }

  @Patch(':discountId')
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
  getStats(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('discountId', ParseUUIDPipe) discountId: string,
  ) {
    return this.discountsService.getDiscountStats(tenantId, discountId);
  }
}
