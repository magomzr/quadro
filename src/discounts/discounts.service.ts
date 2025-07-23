import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { LoggerService } from 'src/logger/logger.service';
import {
  DISCOUNT_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logService: LoggerService,
  ) {}

  async create(
    tenantId: string,
    createDiscountDto: Prisma.DiscountCreateInput,
    userId?: string,
  ) {
    try {
      const discount = await this.databaseService.discount.create({
        data: {
          ...createDiscountDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });

      // Log successful discount creation
      await this.logService.logSuccess(
        tenantId,
        DISCOUNT_ACTIONS.CREATE,
        RESOURCES.DISCOUNT,
        discount.id,
        userId,
        {
          discountCode: discount.code,
          discountType: discount.type,
          discountValue: discount.value,
          description: discount.description,
        },
      );

      return discount;
    } catch (error) {
      // Log failed discount creation
      await this.logService.logError(
        tenantId,
        DISCOUNT_ACTIONS.CREATE,
        RESOURCES.DISCOUNT,
        error,
        undefined,
        userId,
        {
          attemptedData: createDiscountDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Discount code already exists for this tenant',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Tenant not found');
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
      active?: boolean;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.DiscountWhereInput = {
      tenantId,
      ...(filters.active !== undefined && { active: filters.active }),
    };

    const [discounts, total] = await Promise.all([
      this.databaseService.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.databaseService.discount.count({ where }),
    ]);

    return {
      data: discounts,
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

  async findOne(tenantId: string, discountId: string) {
    const discount = await this.databaseService.discount.findFirst({
      where: {
        id: discountId,
        tenantId,
      },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    return discount;
  }

  async update(
    tenantId: string,
    discountId: string,
    updateDiscountDto: Prisma.DiscountUpdateInput,
    userId?: string,
  ) {
    try {
      // Get original discount data for logging
      const originalDiscount = await this.databaseService.discount.findFirst({
        where: { id: discountId, tenantId },
      });

      if (!originalDiscount) {
        throw new NotFoundException(`Discount with ID ${discountId} not found`);
      }

      const updatedDiscount = await this.databaseService.discount.update({
        where: {
          id: discountId,
          tenantId,
        },
        data: updateDiscountDto,
      });

      // Log successful discount update with before/after data
      await this.logService.logUpdate(
        tenantId,
        DISCOUNT_ACTIONS.UPDATE,
        RESOURCES.DISCOUNT,
        discountId,
        {
          code: originalDiscount.code,
          type: originalDiscount.type,
          value: originalDiscount.value,
          description: originalDiscount.description,
          active: originalDiscount.active,
        },
        {
          code: updatedDiscount.code,
          type: updatedDiscount.type,
          value: updatedDiscount.value,
          description: updatedDiscount.description,
          active: updatedDiscount.active,
        },
        userId,
      );

      return updatedDiscount;
    } catch (error) {
      // Log failed discount update
      await this.logService.logError(
        tenantId,
        DISCOUNT_ACTIONS.UPDATE,
        RESOURCES.DISCOUNT,
        error,
        discountId,
        userId,
        {
          attemptedData: updateDiscountDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Discount with ID ${discountId} not found`,
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Discount code already exists for this tenant',
          );
        }
      }
      throw error;
    }
  }

  async remove(tenantId: string, discountId: string, userId?: string) {
    try {
      // Verificar si el descuento tiene órdenes asociadas
      const ordersCount = await this.databaseService.order.count({
        where: {
          discountId,
          tenantId,
        },
      });

      if (ordersCount > 0) {
        throw new ConflictException(
          `Cannot delete discount with ${ordersCount} associated orders`,
        );
      }

      // Get discount data before deletion for logging
      const discountToDelete = await this.databaseService.discount.findFirst({
        where: { id: discountId, tenantId },
      });

      if (!discountToDelete) {
        throw new NotFoundException(`Discount with ID ${discountId} not found`);
      }

      const deletedDiscount = await this.databaseService.discount.delete({
        where: {
          id: discountId,
          tenantId,
        },
      });

      // Log successful discount deletion
      await this.logService.logDelete(
        tenantId,
        DISCOUNT_ACTIONS.DELETE,
        RESOURCES.DISCOUNT,
        discountId,
        {
          code: discountToDelete.code,
          type: discountToDelete.type,
          value: discountToDelete.value,
          description: discountToDelete.description,
          usedCount: discountToDelete.usedCount,
        },
        userId,
      );

      return deletedDiscount;
    } catch (error) {
      // Log failed discount deletion
      await this.logService.logError(
        tenantId,
        DISCOUNT_ACTIONS.DELETE,
        RESOURCES.DISCOUNT,
        error,
        discountId,
        userId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Discount with ID ${discountId} not found`,
          );
        }
      }
      throw error;
    }
  }

  async validateDiscountCode(
    tenantId: string,
    code: string,
    orderAmount: number,
    userId?: string,
  ) {
    try {
      const discount = await this.databaseService.discount.findFirst({
        where: {
          code: code.toUpperCase(),
          tenantId,
          active: true,
          OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
          AND: [
            {
              OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
            },
            {
              OR: [
                { usageLimit: null },
                {
                  usedCount: {
                    lt: this.databaseService.discount.fields.usageLimit,
                  },
                },
              ],
            },
            {
              OR: [
                { minimumOrderAmount: null },
                { minimumOrderAmount: { lte: orderAmount } },
              ],
            },
          ],
        },
      });

      if (!discount) {
        // Log failed discount validation
        await this.logService.logError(
          tenantId,
          DISCOUNT_ACTIONS.VALIDATE,
          RESOURCES.DISCOUNT,
          new Error('Invalid or expired discount code'),
          undefined,
          userId,
          {
            discountCode: code,
            orderAmount,
          },
        );
        throw new NotFoundException('Invalid or expired discount code');
      }

      // Calcular el monto del descuento
      let discountAmount = 0;
      if (discount.type === 'percentage') {
        discountAmount = (orderAmount * Number(discount.value)) / 100;
      } else {
        discountAmount = Math.min(Number(discount.value), orderAmount);
      }

      // Log successful discount validation
      await this.logService.logSuccess(
        tenantId,
        DISCOUNT_ACTIONS.VALIDATE,
        RESOURCES.DISCOUNT,
        discount.id,
        userId,
        {
          discountCode: code,
          discountType: discount.type,
          discountValue: discount.value,
          orderAmount,
          calculatedDiscount: discountAmount,
        },
      );

      return {
        valid: true,
        discount,
        discountAmount,
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        // Log unexpected errors
        await this.logService.logError(
          tenantId,
          DISCOUNT_ACTIONS.VALIDATE,
          RESOURCES.DISCOUNT,
          error,
          undefined,
          userId,
          {
            discountCode: code,
            orderAmount,
          },
        );
      }
      throw error;
    }
  }

  async findByCode(tenantId: string, code: string) {
    const discount = await this.databaseService.discount.findFirst({
      where: {
        code: code.toUpperCase(),
        tenantId,
      },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with code ${code} not found`);
    }

    return discount;
  }

  // Método para obtener estadísticas de uso de descuentos
  async getDiscountStats(tenantId: string, discountId: string) {
    const discount = await this.findOne(tenantId, discountId);

    const ordersWithDiscount = await this.databaseService.order.findMany({
      where: {
        discountId,
        tenantId,
      },
      select: {
        id: true,
        total: true,
        discountAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSaved = ordersWithDiscount.reduce(
      (sum, order) => sum + Number(order.discountAmount || 0),
      0,
    );

    const totalRevenue = ordersWithDiscount
      .filter((order) => order.status === 'paid')
      .reduce((sum, order) => sum + Number(order.total), 0);

    return {
      discount,
      usage: {
        totalUses: discount.usedCount,
        remainingUses: discount.usageLimit
          ? discount.usageLimit - discount.usedCount
          : null,
        totalSaved,
        totalRevenue,
        recentOrders: ordersWithDiscount.slice(0, 10),
      },
    };
  }
}
