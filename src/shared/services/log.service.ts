import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Log } from '../interfaces/log.interface';

@Injectable()
export class LogService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Creates a new log entry for audit purposes
   * @param logData - The log data containing all necessary information
   */
  async createLog(logData: Omit<Log, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.databaseService.log.create({
        data: {
          tenantId: logData.tenantId,
          userId: logData.userId || null,
          action: logData.action,
          resource: logData.resource,
          resourceId: logData.resourceId || null,
          metadata: logData.metadata,
          ipAddress: logData.ipAddress || null,
          userAgent: logData.userAgent || null,
        },
      });
    } catch (error) {
      // Log the error but don't throw to avoid disrupting business operations
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Creates a log for successful operations
   */
  async logSuccess(
    tenantId: string,
    action: string,
    resource: string,
    resourceId?: string,
    userId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.createLog({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Creates a log for error/failure operations
   */
  async logError(
    tenantId: string,
    action: string,
    resource: string,
    error: any,
    resourceId?: string,
    userId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const errorMetadata = {
      ...metadata,
      error: {
        message: error.message || 'Unknown error',
        ...(error.code && { code: error.code }),
      },
    };

    await this.createLog({
      tenantId,
      userId,
      action: `${action}_FAILED`,
      resource,
      resourceId,
      metadata: errorMetadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Creates a log for update operations with before/after data
   */
  async logUpdate(
    tenantId: string,
    action: string,
    resource: string,
    resourceId: string,
    beforeData: any,
    afterData: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.createLog({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      metadata: {
        before: beforeData,
        after: afterData,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Creates a log for delete operations with the deleted data
   */
  async logDelete(
    tenantId: string,
    action: string,
    resource: string,
    resourceId: string,
    deletedData: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.createLog({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      metadata: {
        deletedData,
      },
      ipAddress,
      userAgent,
    });
  }
}
