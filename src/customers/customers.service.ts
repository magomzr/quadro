import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { LogService } from 'src/shared/services/log.service';
import {
  CUSTOMER_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';

@Injectable()
export class CustomersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logService: LogService,
  ) {}

  async create(
    tenantId: string,
    createCustomerDto: Prisma.CustomerCreateInput,
    userId?: string,
  ) {
    try {
      const customer = await this.databaseService.customer.create({
        data: {
          ...createCustomerDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });

      // Log successful customer creation
      await this.logService.logSuccess(
        tenantId,
        CUSTOMER_ACTIONS.CREATE,
        RESOURCES.CUSTOMER,
        customer.id,
        userId,
        {
          customerName: customer.name,
          customerEmail: customer.email,
          phone: customer.phone,
        },
      );

      return customer;
    } catch (error) {
      // Log failed customer creation
      await this.logService.logError(
        tenantId,
        CUSTOMER_ACTIONS.CREATE,
        RESOURCES.CUSTOMER,
        error,
        undefined,
        userId,
        {
          attemptedData: createCustomerDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Customer email already exists for this tenant',
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
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      this.databaseService.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.databaseService.customer.count({ where }),
    ]);

    return {
      data: customers,
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

  async findOne(tenantId: string, customerId: string) {
    const customer = await this.databaseService.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return customer;
  }

  async update(
    tenantId: string,
    customerId: string,
    updateCustomerDto: Prisma.CustomerUpdateInput,
    userId?: string,
  ) {
    try {
      // Get original customer data for logging
      const originalCustomer = await this.databaseService.customer.findFirst({
        where: { id: customerId, tenantId },
      });

      if (!originalCustomer) {
        throw new NotFoundException(
          `Customer with ID ${customerId} not found`,
        );
      }

      const updatedCustomer = await this.databaseService.customer.update({
        where: {
          id: customerId,
          tenantId,
        },
        data: updateCustomerDto,
      });

      // Log successful customer update with before/after data
      await this.logService.logUpdate(
        tenantId,
        CUSTOMER_ACTIONS.UPDATE,
        RESOURCES.CUSTOMER,
        customerId,
        {
          name: originalCustomer.name,
          email: originalCustomer.email,
          phone: originalCustomer.phone,
          address: originalCustomer.address,
        },
        {
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
          address: updatedCustomer.address,
        },
        userId,
      );

      return updatedCustomer;
    } catch (error) {
      // Log failed customer update
      await this.logService.logError(
        tenantId,
        CUSTOMER_ACTIONS.UPDATE,
        RESOURCES.CUSTOMER,
        error,
        customerId,
        userId,
        {
          attemptedData: updateCustomerDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Customer with ID ${customerId} not found`,
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Customer email already exists for this tenant',
          );
        }
      }
      throw error;
    }
  }

  async remove(tenantId: string, customerId: string, userId?: string) {
    try {
      // Verificar si el cliente tiene órdenes asociadas
      const ordersCount = await this.databaseService.order.count({
        where: {
          customerId,
          tenantId,
        },
      });

      if (ordersCount > 0) {
        throw new ConflictException(
          `Cannot delete customer with ${ordersCount} associated orders`,
        );
      }

      // Get customer data before deletion for logging
      const customerToDelete = await this.databaseService.customer.findFirst({
        where: { id: customerId, tenantId },
      });

      if (!customerToDelete) {
        throw new NotFoundException(
          `Customer with ID ${customerId} not found`,
        );
      }

      const deletedCustomer = await this.databaseService.customer.delete({
        where: {
          id: customerId,
          tenantId,
        },
      });

      // Log successful customer deletion
      await this.logService.logDelete(
        tenantId,
        CUSTOMER_ACTIONS.DELETE,
        RESOURCES.CUSTOMER,
        customerId,
        {
          name: customerToDelete.name,
          email: customerToDelete.email,
          phone: customerToDelete.phone,
          address: customerToDelete.address,
        },
        userId,
      );

      return deletedCustomer;
    } catch (error) {
      // Log failed customer deletion
      await this.logService.logError(
        tenantId,
        CUSTOMER_ACTIONS.DELETE,
        RESOURCES.CUSTOMER,
        error,
        customerId,
        userId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Customer with ID ${customerId} not found`,
          );
        }
      }
      throw error;
    }
  }
}
