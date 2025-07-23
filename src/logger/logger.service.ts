import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Log } from '../shared/interfaces/log.interface';
import { Prisma } from 'generated/prisma';

@Injectable()
export class LoggerService {
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
   * Find all logs by tenant with optional filters
   */
  async findAllByTenant(
    tenantId: string,
    filters: {
      action?: string;
      resource?: string;
      userId?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {},
  ) {
    const where: Prisma.LogWhereInput = {
      tenantId,
      ...(filters.action && {
        action: { contains: filters.action, mode: 'insensitive' },
      }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
    };

    return this.databaseService.log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find paginated logs by tenant with optional filters
   */
  async findPaginatedByTenant(
    tenantId: string,
    page = 1,
    limit = 20,
    filters: {
      action?: string;
      resource?: string;
      userId?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.LogWhereInput = {
      tenantId,
      ...(filters.action && {
        action: { contains: filters.action, mode: 'insensitive' },
      }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
    };

    const [logs, total] = await Promise.all([
      this.databaseService.log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.databaseService.log.count({ where }),
    ]);

    return {
      data: logs,
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
