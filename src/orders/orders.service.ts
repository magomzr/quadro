import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { DiscountsService } from 'src/discounts/discounts.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly discountsService: DiscountsService,
  ) {}

  async create(
    tenantId: string,
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
    try {
      return await this.databaseService.$transaction(async (tx) => {
        // 1. Validar que existan productos y calcular precios
        let subtotal = 0;
        const orderItemsData: any[] = [];

        for (const item of createOrderDto.items) {
          const product = await tx.product.findFirst({
            where: {
              id: item.productId,
              tenantId,
              isPublished: true,
            },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found or not published`,
            );
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
            );
          }

          const itemTotal = Number(product.price) * item.quantity;
          subtotal += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
            tenantId,
          });
        }

        // 2. Validar descuento si existe usando el servicio especializado
        let discount: any = null;
        let discountAmount = 0;

        if (createOrderDto.discountCode) {
          const discountValidation =
            await this.discountsService.validateDiscountCode(
              tenantId,
              createOrderDto.discountCode,
              subtotal,
            );

          if (!discountValidation.valid) {
            throw new BadRequestException(
              `Discount code "${createOrderDto.discountCode}" is invalid or not applicable.`,
            );
          }

          discount = discountValidation.discount;
          discountAmount = discountValidation.discountAmount;
        }

        const total = subtotal - discountAmount;

        // 3. Crear la orden
        const order = await tx.order.create({
          data: {
            customerName: createOrderDto.customerName,
            customerEmail: createOrderDto.customerEmail,
            customerId: createOrderDto.customerId,
            discountId: discount?.id,
            discountAmount: discountAmount > 0 ? discountAmount : null,
            shippingAddress: createOrderDto.shippingAddress,
            notes: createOrderDto.notes,
            subtotal,
            total,
            status: 'pending',
            tenantId,
          },
        });

        // 4. Crear los items de la orden
        await tx.orderItem.createMany({
          data: orderItemsData.map((item) => ({
            ...item,
            orderId: order.id,
          })),
        });

        // 5. Reducir stock de productos
        for (const item of createOrderDto.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // 6. Incrementar contador de uso del descuento
        if (discount) {
          await tx.discount.update({
            where: { id: discount.id },
            data: {
              usedCount: {
                increment: 1,
              },
            },
          });
        }

        // 7. Retornar orden con items
        return await tx.order.findUnique({
          where: { id: order.id },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            customer: true,
            discount: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Tenant or related entity not found');
        }
      }
      throw error;
    }
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: 'pending' | 'paid' | 'cancelled';
      customerId?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.fromDate || filters.toDate
        ? {
            createdAt: {
              ...(filters.fromDate && { gte: filters.fromDate }),
              ...(filters.toDate && { lte: filters.toDate }),
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.databaseService.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: true,
          discount: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      }),
      this.databaseService.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(tenantId: string, orderId: string) {
    const order = await this.databaseService.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        customer: true,
        discount: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async update(
    tenantId: string,
    orderId: string,
    updateOrderDto: Prisma.OrderUpdateInput,
  ) {
    try {
      return await this.databaseService.order.update({
        where: {
          id: orderId,
          tenantId,
        },
        data: updateOrderDto,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          customer: true,
          discount: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Order with ID ${orderId} not found`);
        }
      }
      throw error;
    }
  }

  async updateStatus(
    tenantId: string,
    orderId: string,
    status: 'pending' | 'paid' | 'cancelled',
  ) {
    try {
      return await this.databaseService.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            tenantId,
          },
          include: {
            orderItems: true,
          },
        });

        if (!order) {
          throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        // Si se cancela la orden, restaurar stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
          for (const item of order.orderItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }

          // Si había descuento, decrementar contador
          if (order.discountId) {
            await tx.discount.update({
              where: { id: order.discountId },
              data: {
                usedCount: {
                  decrement: 1,
                },
              },
            });
          }
        }

        return await tx.order.update({
          where: { id: orderId },
          data: { status },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            customer: true,
            discount: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Order with ID ${orderId} not found`);
        }
      }
      throw error;
    }
  }

  async cancel(tenantId: string, orderId: string) {
    return this.updateStatus(tenantId, orderId, 'cancelled');
  }
}
