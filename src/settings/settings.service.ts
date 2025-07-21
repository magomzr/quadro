import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class SettingsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createSettings(
    tenantId: string,
    createSettingsDto: Prisma.SettingsCreateInput,
  ) {
    try {
      return await this.databaseService.settings.create({
        data: {
          ...createSettingsDto,
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
          throw new ConflictException('Settings already exist for this tenant');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Tenant not found');
        }
      }
      throw error;
    }
  }

  async findSettings(tenantId: string) {
    const settings = await this.databaseService.settings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException('Settings not found for this tenant');
    }

    return settings;
  }

  async updateSettings(
    tenantId: string,
    updateSettingsDto: Prisma.SettingsUpdateInput,
  ) {
    try {
      return await this.databaseService.settings.update({
        where: { tenantId },
        data: updateSettingsDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Settings not found for this tenant');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Tenant not found');
        }
      }
      throw error;
    }
  }

  async deleteSettings(tenantId: string) {
    try {
      return await this.databaseService.settings.delete({
        where: { tenantId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Settings not found for this tenant');
        }
      }
      throw error;
    }
  }
}
