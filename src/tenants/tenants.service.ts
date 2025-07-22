import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { DEFAULT_SETTINGS } from 'src/shared/configs/default-settings';
import { LogService } from 'src/shared/services/log.service';
import {
  TENANT_ACTIONS,
  SETTINGS_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';

@Injectable()
export class TenantsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logService: LogService,
  ) {}

  async create(createTenantDto: Prisma.TenantCreateInput, userId?: string) {
    try {
      const result = await this.databaseService.$transaction(async (tx) => {
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

      // Log successful tenant creation
      await this.logService.logSuccess(
        result.id,
        TENANT_ACTIONS.CREATE,
        RESOURCES.TENANT,
        result.id,
        userId,
        {
          tenantName: result.name,
          tenantSlug: result.slug,
          isActive: result.isActive,
        },
      );

      // Log initial settings creation
      await this.logService.logSuccess(
        result.id,
        SETTINGS_ACTIONS.CREATE,
        RESOURCES.SETTINGS,
        undefined,
        userId,
        {
          companyName: result.name,
          defaultSettings: DEFAULT_SETTINGS,
        },
      );

      return result;
    } catch (error) {
      // Log failed tenant creation (we don't have tenantId yet, so we'll use a generic system log)
      await this.logService.logError(
        'system', // Use a system identifier when no tenant exists yet
        TENANT_ACTIONS.CREATE,
        RESOURCES.TENANT,
        error,
        undefined,
        userId,
        {
          attemptedData: createTenantDto,
        },
      );

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

  async update(id: string, updateTenantDto: Prisma.TenantUpdateInput, userId?: string) {
    try {
      // Get original tenant data for logging
      const originalTenant = await this.databaseService.tenant.findUnique({
        where: { id },
      });

      if (!originalTenant) {
        throw new NotFoundException(`Tenant with ID ${id} not found`);
      }

      const updatedTenant = await this.databaseService.tenant.update({
        where: { id },
        data: updateTenantDto,
      });

      // Log successful tenant update with before/after data
      await this.logService.logUpdate(
        id,
        TENANT_ACTIONS.UPDATE,
        RESOURCES.TENANT,
        id,
        {
          name: originalTenant.name,
          slug: originalTenant.slug,
          isActive: originalTenant.isActive,
        },
        {
          name: updatedTenant.name,
          slug: updatedTenant.slug,
          isActive: updatedTenant.isActive,
        },
        userId,
      );

      return updatedTenant;
    } catch (error) {
      // Log failed tenant update
      await this.logService.logError(
        id,
        TENANT_ACTIONS.UPDATE,
        RESOURCES.TENANT,
        error,
        id,
        userId,
        {
          attemptedData: updateTenantDto,
        },
      );

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

  async remove(id: string, userId?: string) {
    try {
      // Get tenant data before deactivation for logging
      const tenantToDeactivate = await this.databaseService.tenant.findUnique({
        where: { id },
      });

      if (!tenantToDeactivate) {
        throw new NotFoundException(`Tenant with ID ${id} not found`);
      }

      // Soft delete - desactivar en lugar de eliminar
      const deactivatedTenant = await this.databaseService.tenant.update({
        where: { id },
        data: { isActive: false },
      });

      // Log tenant deactivation
      await this.logService.logUpdate(
        id,
        TENANT_ACTIONS.DEACTIVATE,
        RESOURCES.TENANT,
        id,
        {
          isActive: tenantToDeactivate.isActive,
          name: tenantToDeactivate.name,
        },
        {
          isActive: deactivatedTenant.isActive,
          name: deactivatedTenant.name,
        },
        userId,
      );

      return deactivatedTenant;
    } catch (error) {
      // Log failed tenant deactivation
      await this.logService.logError(
        id,
        TENANT_ACTIONS.DEACTIVATE,
        RESOURCES.TENANT,
        error,
        id,
        userId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
