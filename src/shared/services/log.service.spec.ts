import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from './log.service';
import { DatabaseService } from 'src/database/database.service';
import { PRODUCT_ACTIONS, RESOURCES } from '../constants/log-actions.constants';

describe('LogService', () => {
  let service: LogService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    log: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<LogService>(LogService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logSuccess', () => {
    it('should create a successful log entry', async () => {
      const mockLog = {
        id: 'log-id',
        tenantId: 'tenant-id',
        userId: 'user-id',
        action: PRODUCT_ACTIONS.CREATE,
        resource: RESOURCES.PRODUCT,
        resourceId: 'product-id',
        metadata: { productName: 'Test Product' },
        createdAt: new Date(),
      };

      mockDatabaseService.log.create.mockResolvedValue(mockLog);

      await service.logSuccess(
        'tenant-id',
        PRODUCT_ACTIONS.CREATE,
        RESOURCES.PRODUCT,
        'product-id',
        'user-id',
        { productName: 'Test Product' },
      );

      expect(mockDatabaseService.log.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-id',
          userId: 'user-id',
          action: PRODUCT_ACTIONS.CREATE,
          resource: RESOURCES.PRODUCT,
          resourceId: 'product-id',
          metadata: { productName: 'Test Product' },
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should handle undefined metadata correctly', async () => {
      const mockLog = {
        id: 'log-id',
        tenantId: 'tenant-id',
        action: PRODUCT_ACTIONS.CREATE,
        resource: RESOURCES.PRODUCT,
        createdAt: new Date(),
      };

      mockDatabaseService.log.create.mockResolvedValue(mockLog);

      await service.logSuccess(
        'tenant-id',
        PRODUCT_ACTIONS.CREATE,
        RESOURCES.PRODUCT,
      );

      expect(mockDatabaseService.log.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-id',
          userId: null,
          action: PRODUCT_ACTIONS.CREATE,
          resource: RESOURCES.PRODUCT,
          resourceId: null,
          metadata: undefined,
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe('logError', () => {
    it('should create an error log entry', async () => {
      const error = new Error('Test error');
      const mockLog = {
        id: 'log-id',
        tenantId: 'tenant-id',
        action: `${PRODUCT_ACTIONS.CREATE}_FAILED`,
        resource: RESOURCES.PRODUCT,
        metadata: {
          error: {
            message: 'Test error',
          },
        },
        createdAt: new Date(),
      };

      mockDatabaseService.log.create.mockResolvedValue(mockLog);

      await service.logError(
        'tenant-id',
        PRODUCT_ACTIONS.CREATE,
        RESOURCES.PRODUCT,
        error,
      );

      expect(mockDatabaseService.log.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-id',
          userId: null,
          action: `${PRODUCT_ACTIONS.CREATE}_FAILED`,
          resource: RESOURCES.PRODUCT,
          resourceId: null,
          metadata: {
            error: {
              message: 'Test error',
            },
          },
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe('logUpdate', () => {
    it('should create an update log entry with before/after data', async () => {
      const beforeData = { name: 'Old Product' };
      const afterData = { name: 'New Product' };

      const mockLog = {
        id: 'log-id',
        tenantId: 'tenant-id',
        action: PRODUCT_ACTIONS.UPDATE,
        resource: RESOURCES.PRODUCT,
        resourceId: 'product-id',
        metadata: {
          before: beforeData,
          after: afterData,
        },
        createdAt: new Date(),
      };

      mockDatabaseService.log.create.mockResolvedValue(mockLog);

      await service.logUpdate(
        'tenant-id',
        PRODUCT_ACTIONS.UPDATE,
        RESOURCES.PRODUCT,
        'product-id',
        beforeData,
        afterData,
        'user-id',
      );

      expect(mockDatabaseService.log.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-id',
          userId: 'user-id',
          action: PRODUCT_ACTIONS.UPDATE,
          resource: RESOURCES.PRODUCT,
          resourceId: 'product-id',
          metadata: {
            before: beforeData,
            after: afterData,
          },
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe('logDelete', () => {
    it('should create a delete log entry with deleted data', async () => {
      const deletedData = { name: 'Deleted Product', sku: 'SKU123' };

      const mockLog = {
        id: 'log-id',
        tenantId: 'tenant-id',
        action: PRODUCT_ACTIONS.DELETE,
        resource: RESOURCES.PRODUCT,
        resourceId: 'product-id',
        metadata: {
          deletedData,
        },
        createdAt: new Date(),
      };

      mockDatabaseService.log.create.mockResolvedValue(mockLog);

      await service.logDelete(
        'tenant-id',
        PRODUCT_ACTIONS.DELETE,
        RESOURCES.PRODUCT,
        'product-id',
        deletedData,
        'user-id',
      );

      expect(mockDatabaseService.log.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-id',
          userId: 'user-id',
          action: PRODUCT_ACTIONS.DELETE,
          resource: RESOURCES.PRODUCT,
          resourceId: 'product-id',
          metadata: {
            deletedData,
          },
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe('error handling', () => {
    it('should not throw when database log creation fails', async () => {
      mockDatabaseService.log.create.mockRejectedValue(new Error('DB Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.logSuccess(
          'tenant-id',
          PRODUCT_ACTIONS.CREATE,
          RESOURCES.PRODUCT,
        ),
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create audit log:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});