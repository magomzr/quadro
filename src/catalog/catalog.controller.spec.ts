import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { S3UploadService } from '../shared/s3-upload.service';
import { Readable } from 'stream';

describe('CatalogController', () => {
  let controller: CatalogController;
  let catalogService: jest.Mocked<CatalogService>;
  let s3UploadService: jest.Mocked<S3UploadService>;

  beforeEach(async () => {
    const mockCatalogService = {
      updateProduct: jest.fn(),
      createProduct: jest.fn(),
    };

    const mockS3UploadService = {
      uploadProductImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        { provide: CatalogService, useValue: mockCatalogService },
        { provide: S3UploadService, useValue: mockS3UploadService },
      ],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
    catalogService = module.get(CatalogService);
    s3UploadService = module.get(S3UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadProductImage', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000';
    const productId = '123e4567-e89b-12d3-a456-426614174001';

    it('should upload product image and update product', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(),
      };

      const mockImageUrl = 'https://bucket.s3.amazonaws.com/products/uuid.jpg';
      const mockUpdatedProduct = { id: productId, imageUrl: mockImageUrl };

      s3UploadService.uploadProductImage.mockResolvedValue(mockImageUrl);
      catalogService.updateProduct.mockResolvedValue(mockUpdatedProduct as any);

      const result = await controller.uploadProductImage(
        tenantId,
        productId,
        mockFile,
      );

      expect(s3UploadService.uploadProductImage).toHaveBeenCalledWith(mockFile);
      expect(catalogService.updateProduct).toHaveBeenCalledWith(
        tenantId,
        productId,
        {
          imageUrl: mockImageUrl,
        },
      );
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.uploadProductImage(tenantId, productId, null as any),
      ).rejects.toThrow(BadRequestException);

      expect(s3UploadService.uploadProductImage).not.toHaveBeenCalled();
      expect(catalogService.updateProduct).not.toHaveBeenCalled();
    });
  });

  describe('createProductWithImage', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000';

    it('should create product with uploaded image', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(),
      };

      const createProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        stock: 10,
      };

      const mockImageUrl = 'https://bucket.s3.amazonaws.com/products/uuid.jpg';
      const mockCreatedProduct = {
        id: '123',
        ...createProductDto,
        imageUrl: mockImageUrl,
      };

      s3UploadService.uploadProductImage.mockResolvedValue(mockImageUrl);
      catalogService.createProduct.mockResolvedValue(mockCreatedProduct as any);

      const result = await controller.createProductWithImage(
        tenantId,
        mockFile,
        createProductDto,
      );

      expect(s3UploadService.uploadProductImage).toHaveBeenCalledWith(mockFile);
      expect(catalogService.createProduct).toHaveBeenCalledWith(tenantId, {
        ...createProductDto,
        imageUrl: mockImageUrl,
      });
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should create product without image when no file provided', async () => {
      const createProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        stock: 10,
      };

      const mockCreatedProduct = { id: '123', ...createProductDto };

      catalogService.createProduct.mockResolvedValue(mockCreatedProduct as any);

      const result = await controller.createProductWithImage(
        tenantId,
        null as any,
        createProductDto,
      );

      expect(s3UploadService.uploadProductImage).not.toHaveBeenCalled();
      expect(catalogService.createProduct).toHaveBeenCalledWith(tenantId, {
        ...createProductDto,
        imageUrl: undefined,
      });
      expect(result).toEqual(mockCreatedProduct);
    });
  });
});
