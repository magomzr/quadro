import { Test, TestingModule } from '@nestjs/testing';
import { S3UploadService } from './s3-upload.service';
import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Mock the S3Client
jest.mock('@aws-sdk/client-s3');

describe('S3UploadService', () => {
  let service: S3UploadService;
  let s3ClientMock: jest.Mocked<S3Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3UploadService],
    }).compile();

    service = module.get<S3UploadService>(S3UploadService);
    s3ClientMock = jest.mocked(S3Client.prototype);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file to S3 and return URL', async () => {
      // Mock successful S3 upload
      s3ClientMock.send = jest.fn().mockResolvedValue({});

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

      const result = await service.uploadFile(mockFile, 'test-folder');

      expect(result).toMatch(
        /^https:\/\/.*\.s3\.amazonaws\.com\/test-folder\/.*\.jpg$/,
      );
      expect(s3ClientMock.send).toHaveBeenCalledTimes(1);
    });

    it('should handle S3 upload errors', async () => {
      // Mock S3 upload failure
      s3ClientMock.send = jest.fn().mockRejectedValue(new Error('S3 Error'));

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

      await expect(service.uploadFile(mockFile, 'test-folder')).rejects.toThrow(
        'Failed to upload file to S3: S3 Error',
      );
    });
  });

  describe('uploadProductImage', () => {
    it('should upload product image to correct folder', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'product.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(),
      };

      s3ClientMock.send = jest.fn().mockResolvedValue({});
      const uploadFileSpy = jest.spyOn(service, 'uploadFile');

      await service.uploadProductImage(mockFile);

      expect(uploadFileSpy).toHaveBeenCalledWith(mockFile, 'products');
    });
  });

  describe('uploadCompanyLogo', () => {
    it('should upload company logo to correct folder', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'logo',
        originalname: 'logo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(),
      };

      s3ClientMock.send = jest.fn().mockResolvedValue({});
      const uploadFileSpy = jest.spyOn(service, 'uploadFile');

      await service.uploadCompanyLogo(mockFile);

      expect(uploadFileSpy).toHaveBeenCalledWith(mockFile, 'logos');
    });
  });
});
