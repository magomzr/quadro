import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { DEFAULT_SETTINGS } from 'src/shared/configs/default-settings';

@Injectable()
export class TenantsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createTenantDto: Prisma.TenantCreateInput) {
    try {
      return await this.databaseService.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: createTenantDto,
        });

        await tx.settings.create({
          data: {
            ...DEFAULT_SETTINGS,
            companyName: tenant.name,
            tenantId: tenant.id,
          },
        });

        return tenant;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Tenant slug already exists');
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.databaseService.tenant.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.databaseService.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.databaseService.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: Prisma.TenantUpdateInput) {
    try {
      return await this.databaseService.tenant.update({
        where: { id },
        data: updateTenantDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Tenant slug already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Soft delete - desactivar en lugar de eliminar
      return await this.databaseService.tenant.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
