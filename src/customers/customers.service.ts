import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CustomersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    tenantId: string,
    createCustomerDto: Prisma.CustomerCreateInput,
  ) {
    try {
      return await this.databaseService.customer.create({
        data: {
          ...createCustomerDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });
    } catch (error) {
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
  ) {
    try {
      return await this.databaseService.customer.update({
        where: {
          id: customerId,
          tenantId,
        },
        data: updateCustomerDto,
      });
    } catch (error) {
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

  async remove(tenantId: string, customerId: string) {
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

      return await this.databaseService.customer.delete({
        where: {
          id: customerId,
          tenantId,
        },
      });
    } catch (error) {
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
