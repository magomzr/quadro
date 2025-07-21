import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Initialize S3 client with configuration from environment variables
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-access-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret-key',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'quadro-uploads';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    // Generate unique filename to avoid conflicts
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const,
    };

    try {
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Return the public URL of the uploaded file
      return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${(error as Error).message}`);
    }
  }

  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'products');
  }

  async uploadCompanyLogo(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'logos');
  }
}
