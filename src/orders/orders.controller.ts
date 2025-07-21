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
import { OrdersService } from './orders.service';

@Controller({
  path: 'tenants/:tenantId/orders',
  version: '1',
})
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body()
    createOrderDto: {
      customerName: string;
      customerEmail?: string;
      customerId?: string;
      discountCode?: string;
      shippingAddress?: string;
      notes?: string;
      items: Array<{
        productId: string;
        quantity: number;
      }>;
    },
  ) {
    return this.ordersService.create(tenantId, createOrderDto);
  }

  @Get()
  findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('status') status?: 'pending' | 'paid' | 'cancelled',
    @Query('customerId', new ParseUUIDPipe({ optional: true }))
    customerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters = {
      status,
      customerId,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    return this.ordersService.findAll(tenantId, page, limit, filters);
  }

  @Get(':orderId')
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.findOne(tenantId, orderId);
  }

  @Patch(':orderId')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() updateOrderDto: Prisma.OrderUpdateInput,
  ) {
    return this.ordersService.update(tenantId, orderId, updateOrderDto);
  }

  @Patch(':orderId/status')
  updateStatus(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: { status: 'pending' | 'paid' | 'cancelled' },
  ) {
    return this.ordersService.updateStatus(tenantId, orderId, body.status);
  }

  @Delete(':orderId')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.cancel(tenantId, orderId);
  }
}
