import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  ParseBoolPipe,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from 'generated/prisma';
import { CatalogService } from './catalog.service';
import { S3UploadService } from '../shared/s3-upload.service';

@Controller({
  path: 'tenants/:tenantId/catalog',
  version: '1',
})
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createCategoryDto: Prisma.CategoryCreateInput,
  ) {
    return this.catalogService.createCategory(tenantId, createCategoryDto);
  }

  @Get('categories')
  findAllCategories(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.catalogService.findAllCategories(tenantId, page, limit);
  }

  @Get('categories/:categoryId')
  findOneCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.catalogService.findOneCategory(tenantId, categoryId);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() updateCategoryDto: Prisma.CategoryUpdateInput,
  ) {
    return this.catalogService.updateCategory(
      tenantId,
      categoryId,
      updateCategoryDto,
    );
  }

  @Delete('categories/:categoryId')
  @HttpCode(HttpStatus.OK)
  removeCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.catalogService.removeCategory(tenantId, categoryId);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createProductDto: Prisma.ProductCreateInput,
  ) {
    return this.catalogService.createProduct(tenantId, createProductDto);
  }

  @Get('products')
  findAllProducts(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('categoryId', new ParseUUIDPipe({ optional: true }))
    categoryId?: string,
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished?: boolean,
    @Query('lowStock', new ParseBoolPipe({ optional: true }))
    lowStock?: boolean,
    @Query('search') search?: string,
  ) {
    const filters = {
      categoryId,
      isPublished,
      lowStock,
      search,
    };

    return this.catalogService.findAllProducts(tenantId, page, limit, filters);
  }

  @Get('products/:productId')
  findOneProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.catalogService.findOneProduct(tenantId, productId);
  }

  @Patch('products/:productId')
  updateProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() updateProductDto: Prisma.ProductUpdateInput,
  ) {
    return this.catalogService.updateProduct(
      tenantId,
      productId,
      updateProductDto,
    );
  }

  @Patch('products/:productId/stock')
  updateProductStock(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('stock', ParseIntPipe) stock: number,
  ) {
    return this.catalogService.updateProductStock(tenantId, productId, stock);
  }

  @Patch('products/:productId/publish')
  updateProductPublishStatus(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('isPublished', ParseBoolPipe) isPublished: boolean,
  ) {
    return this.catalogService.updateProductPublishStatus(
      tenantId,
      productId,
      isPublished,
    );
  }

  @Delete('products/:productId')
  @HttpCode(HttpStatus.OK)
  removeProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.catalogService.removeProduct(tenantId, productId);
  }

  // New endpoint: Upload product image via file upload
  @Post('products/:productId/image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProductImage(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Upload to S3 and get URL
    const imageUrl = await this.s3UploadService.uploadProductImage(file);

    // Update product with new image URL
    return this.catalogService.updateProduct(tenantId, productId, {
      imageUrl,
    });
  }

  // New endpoint: Create product with image upload
  @Post('products/with-image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async createProductWithImage(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() createProductDto: Omit<Prisma.ProductCreateInput, 'imageUrl'>,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      // Upload to S3 and get URL
      imageUrl = await this.s3UploadService.uploadProductImage(file);
    }

    // Create product with uploaded image URL
    return this.catalogService.createProduct(tenantId, {
      ...createProductDto,
      imageUrl,
    });
  }
}
