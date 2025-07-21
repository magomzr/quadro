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
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { CatalogService } from './catalog.service';

@Controller({
  path: 'tenants/:tenantId/catalog',
  version: '1',
})
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

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
}
