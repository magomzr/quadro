import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { LoggerService } from 'src/logger/logger.service';
import {
  SETTINGS_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';

@Injectable()
export class SettingsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logService: LoggerService,
  ) {}

  async createSettings(
    tenantId: string,
    createSettingsDto: Prisma.SettingsCreateInput,
    userId?: string,
  ) {
    try {
      const settings = await this.databaseService.settings.create({
        data: {
          ...createSettingsDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });

      // Log successful settings creation
      await this.logService.logSuccess(
        tenantId,
        SETTINGS_ACTIONS.CREATE,
        RESOURCES.SETTINGS,
        settings.id,
        userId,
        {
          companyName: settings.companyName,
          currency: settings.currency,
          locale: settings.locale,
          timezone: settings.timezone,
        },
      );

      return settings;
    } catch (error) {
      // Log failed settings creation
      await this.logService.logError(
        tenantId,
        SETTINGS_ACTIONS.CREATE,
        RESOURCES.SETTINGS,
        error,
        undefined,
        userId,
        {
          attemptedData: createSettingsDto,
        },
      );

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
    userId?: string,
  ) {
    try {
      // Get original settings data for logging
      const originalSettings = await this.databaseService.settings.findUnique({
        where: { tenantId },
      });

      if (!originalSettings) {
        throw new NotFoundException('Settings not found for this tenant');
      }

      const updatedSettings = await this.databaseService.settings.update({
        where: { tenantId },
        data: updateSettingsDto,
      });

      // Log successful settings update with before/after data
      await this.logService.logUpdate(
        tenantId,
        SETTINGS_ACTIONS.UPDATE,
        RESOURCES.SETTINGS,
        originalSettings.id,
        {
          companyName: originalSettings.companyName,
          currency: originalSettings.currency,
          locale: originalSettings.locale,
          timezone: originalSettings.timezone,
          invoicePrefix: originalSettings.invoicePrefix,
        },
        {
          companyName: updatedSettings.companyName,
          currency: updatedSettings.currency,
          locale: updatedSettings.locale,
          timezone: updatedSettings.timezone,
          invoicePrefix: updatedSettings.invoicePrefix,
        },
        userId,
      );

      return updatedSettings;
    } catch (error) {
      // Log failed settings update
      await this.logService.logError(
        tenantId,
        SETTINGS_ACTIONS.UPDATE,
        RESOURCES.SETTINGS,
        error,
        undefined,
        userId,
        {
          attemptedData: updateSettingsDto,
        },
      );

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

  async deleteSettings(tenantId: string, userId?: string) {
    try {
      // Get settings data before deletion for logging
      const settingsToDelete = await this.databaseService.settings.findUnique({
        where: { tenantId },
      });

      if (!settingsToDelete) {
        throw new NotFoundException('Settings not found for this tenant');
      }

      const deletedSettings = await this.databaseService.settings.delete({
        where: { tenantId },
      });

      // Log successful settings deletion
      await this.logService.logDelete(
        tenantId,
        SETTINGS_ACTIONS.DELETE,
        RESOURCES.SETTINGS,
        settingsToDelete.id,
        {
          companyName: settingsToDelete.companyName,
          currency: settingsToDelete.currency,
          locale: settingsToDelete.locale,
          timezone: settingsToDelete.timezone,
          invoicePrefix: settingsToDelete.invoicePrefix,
        },
        userId,
      );

      return deletedSettings;
    } catch (error) {
      // Log failed settings deletion
      await this.logService.logError(
        tenantId,
        SETTINGS_ACTIONS.DELETE,
        RESOURCES.SETTINGS,
        error,
        undefined,
        userId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Settings not found for this tenant');
        }
      }
      throw error;
    }
  }
}
