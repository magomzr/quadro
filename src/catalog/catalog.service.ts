import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { LogService } from 'src/shared/services/log.service';
import {
  CATEGORY_ACTIONS,
  PRODUCT_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';

@Injectable()
export class CatalogService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logService: LogService,
  ) {}

  async createCategory(
    tenantId: string,
    createCategoryDto: Prisma.CategoryCreateInput,
    userId?: string,
  ) {
    try {
      const category = await this.databaseService.category.create({
        data: {
          ...createCategoryDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });

      // Log successful category creation
      await this.logService.logSuccess(
        tenantId,
        CATEGORY_ACTIONS.CREATE,
        RESOURCES.CATEGORY,
        category.id,
        userId,
        {
          categoryName: category.name,
          description: category.description,
        },
      );

      return category;
    } catch (error) {
      // Log failed category creation
      await this.logService.logError(
        tenantId,
        CATEGORY_ACTIONS.CREATE,
        RESOURCES.CATEGORY,
        error,
        undefined,
        userId,
        {
          attemptedData: createCategoryDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Category name already exists for this tenant',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
        }
      }
      throw error;
    }
  }

  async findAllCategories(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.databaseService.category.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.category.count({
        where: { tenantId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneCategory(tenantId: string, categoryId: string) {
    const category = await this.databaseService.category.findFirst({
      where: {
        id: categoryId,
        tenantId,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return category;
  }

  async updateCategory(
    tenantId: string,
    categoryId: string,
    updateCategoryDto: Prisma.CategoryUpdateInput,
    userId?: string,
  ) {
    try {
      // Get original category data for logging
      const originalCategory = await this.databaseService.category.findFirst({
        where: { id: categoryId, tenantId },
      });

      if (!originalCategory) {
        throw new NotFoundException(
          `Category with ID ${categoryId} not found`,
        );
      }

      const updatedCategory = await this.databaseService.category.update({
        where: {
          id: categoryId,
        },
        data: {
          ...updateCategoryDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });

      // Log successful category update with before/after data
      await this.logService.logUpdate(
        tenantId,
        CATEGORY_ACTIONS.UPDATE,
        RESOURCES.CATEGORY,
        categoryId,
        {
          name: originalCategory.name,
          description: originalCategory.description,
        },
        {
          name: updatedCategory.name,
          description: updatedCategory.description,
        },
        userId,
      );

      return updatedCategory;
    } catch (error) {
      // Log failed category update
      await this.logService.logError(
        tenantId,
        CATEGORY_ACTIONS.UPDATE,
        RESOURCES.CATEGORY,
        error,
        categoryId,
        userId,
        {
          attemptedData: updateCategoryDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Category with ID ${categoryId} not found`,
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Category name already exists for this tenant',
          );
        }
      }
      throw error;
    }
  }

  async removeCategory(tenantId: string, categoryId: string, userId?: string) {
    try {
      const productsCount = await this.databaseService.product.count({
        where: {
          categoryId,
          tenantId,
        },
      });

      if (productsCount > 0) {
        throw new ConflictException(
          `Cannot delete category with ${productsCount} associated products. Move or delete products first.`,
        );
      }

      // Get category data before deletion for logging
      const categoryToDelete = await this.databaseService.category.findFirst({
        where: { id: categoryId, tenantId },
      });

      if (!categoryToDelete) {
        throw new NotFoundException(
          `Category with ID ${categoryId} not found`,
        );
      }

      const deletedCategory = await this.databaseService.category.delete({
        where: {
          id: categoryId,
        },
      });

      // Log successful category deletion
      await this.logService.logDelete(
        tenantId,
        CATEGORY_ACTIONS.DELETE,
        RESOURCES.CATEGORY,
        categoryId,
        {
          name: categoryToDelete.name,
          description: categoryToDelete.description,
        },
        userId,
      );

      return deletedCategory;
    } catch (error) {
      // Log failed category deletion
      await this.logService.logError(
        tenantId,
        CATEGORY_ACTIONS.DELETE,
        RESOURCES.CATEGORY,
        error,
        categoryId,
        userId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Category with ID ${categoryId} not found`,
          );
        }
      }
      throw error;
    }
  }

  async createProduct(
    tenantId: string,
    createProductDto: Prisma.ProductCreateInput,
    userId?: string,
  ) {
    try {
      const product = await this.databaseService.product.create({
        data: {
          ...createProductDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
          // Si viene categoryId, conectar la categoría
          ...(createProductDto.category && {
            category: createProductDto.category,
          }),
        },
        include: {
          category: true,
        },
      });

      // Log successful product creation
      await this.logService.logSuccess(
        tenantId,
        PRODUCT_ACTIONS.CREATE,
        RESOURCES.PRODUCT,
        product.id,
        userId,
        {
          productName: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          categoryName: product.category?.name,
        },
      );

      return product;
    } catch (error) {
      // Log failed product creation
      await this.logService.logError(
        tenantId,
        PRODUCT_ACTIONS.CREATE,
        RESOURCES.PRODUCT,
        error,
        undefined,
        userId,
        {
          attemptedData: createProductDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Product SKU already exists for this tenant',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Tenant or category not found');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Category not found');
        }
      }
      throw error;
    }
  }

  async findAllProducts(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      categoryId?: string;
      isPublished?: boolean;
      lowStock?: boolean;
      search?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { tenantId };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters.lowStock) {
      where.minStock = { not: null };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const allProducts = await this.databaseService.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const filteredProducts = filters.lowStock
      ? allProducts.filter((p) => p.stock <= (p.minStock ?? Infinity))
      : allProducts;

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = filteredProducts.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneProduct(tenantId: string, productId: string) {
    const product = await this.databaseService.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return product;
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    updateProductDto: Prisma.ProductUpdateInput,
    userId?: string,
  ) {
    try {
      // Get original product data for logging
      const originalProduct = await this.databaseService.product.findFirst({
        where: { id: productId, tenantId },
        include: { category: true },
      });

      if (!originalProduct) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const updatedProduct = await this.databaseService.product.update({
        where: {
          id: productId,
        },
        data: {
          ...updateProductDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
          // Si viene category en el DTO, usarla
          ...(updateProductDto.category && {
            category: updateProductDto.category,
          }),
        },
        include: {
          category: true,
        },
      });

      // Log successful product update with before/after data
      await this.logService.logUpdate(
        tenantId,
        PRODUCT_ACTIONS.UPDATE,
        RESOURCES.PRODUCT,
        productId,
        {
          name: originalProduct.name,
          description: originalProduct.description,
          price: originalProduct.price,
          stock: originalProduct.stock,
          sku: originalProduct.sku,
          categoryName: originalProduct.category?.name,
          isPublished: originalProduct.isPublished,
        },
        {
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          sku: updatedProduct.sku,
          categoryName: updatedProduct.category?.name,
          isPublished: updatedProduct.isPublished,
        },
        userId,
      );

      return updatedProduct;
    } catch (error) {
      // Log failed product update
      await this.logService.logError(
        tenantId,
        PRODUCT_ACTIONS.UPDATE,
        RESOURCES.PRODUCT,
        error,
        productId,
        userId,
        {
          attemptedData: updateProductDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${productId} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Product SKU already exists for this tenant',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Category not found');
        }
      }
      throw error;
    }
  }

  async updateProductStock(tenantId: string, productId: string, stock: number, userId?: string) {
    try {
      // Get original stock for logging
      const originalProduct = await this.databaseService.product.findFirst({
        where: { id: productId, tenantId },
      });

      if (!originalProduct) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const updatedProduct = await this.databaseService.product.update({
        where: {
          id: productId,
        },
        data: {
          stock,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
        include: {
          category: true,
        },
      });

      // Log stock update
      await this.logService.logUpdate(
        tenantId,
        PRODUCT_ACTIONS.STOCK_UPDATE,
        RESOURCES.PRODUCT,
        productId,
        { stock: originalProduct.stock },
        { stock: updatedProduct.stock },
        userId,
      );

      return updatedProduct;
    } catch (error) {
      // Log failed stock update
      await this.logService.logError(
        tenantId,
        PRODUCT_ACTIONS.STOCK_UPDATE,
        RESOURCES.PRODUCT,
        error,
        productId,
        userId,
        { attemptedStock: stock },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${productId} not found`);
        }
      }
      throw error;
    }
  }

  async updateProductPublishStatus(
    tenantId: string,
    productId: string,
    isPublished: boolean,
    userId?: string,
  ) {
    try {
      // Get original product for logging
      const originalProduct = await this.databaseService.product.findFirst({
        where: { id: productId, tenantId },
      });

      if (!originalProduct) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const updatedProduct = await this.databaseService.product.update({
        where: {
          id: productId,
        },
        data: {
          isPublished,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
        include: {
          category: true,
        },
      });

      // Log publish/unpublish action
      const action = isPublished ? PRODUCT_ACTIONS.PUBLISH : PRODUCT_ACTIONS.UNPUBLISH;
      await this.logService.logUpdate(
        tenantId,
        action,
        RESOURCES.PRODUCT,
        productId,
        { 
          productName: originalProduct.name,
          isPublished: originalProduct.isPublished 
        },
        { 
          productName: updatedProduct.name,
          isPublished: updatedProduct.isPublished 
        },
        userId,
      );

      return updatedProduct;
    } catch (error) {
      // Log failed publish status update
      const action = isPublished ? PRODUCT_ACTIONS.PUBLISH : PRODUCT_ACTIONS.UNPUBLISH;
      await this.logService.logError(
        tenantId,
        action,
        RESOURCES.PRODUCT,
        error,
        productId,
        userId,
        { attemptedStatus: isPublished },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${productId} not found`);
        }
      }
      throw error;
    }
  }

  async removeProduct(tenantId: string, productId: string, userId?: string) {
    try {
      // Verificar si el producto tiene órdenes asociadas
      const orderItemsCount = await this.databaseService.orderItem.count({
        where: {
          productId,
          tenantId,
        },
      });

      if (orderItemsCount > 0) {
        throw new ConflictException(
          'Cannot delete product with associated orders. Consider unpublishing instead.',
        );
      }

      // Get product data before deletion for logging
      const productToDelete = await this.databaseService.product.findFirst({
        where: { id: productId, tenantId },
        include: { category: true },
      });

      if (!productToDelete) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const deletedProduct = await this.databaseService.product.delete({
        where: {
          id: productId,
        },
      });

      // Log successful product deletion
      await this.logService.logDelete(
        tenantId,
        PRODUCT_ACTIONS.DELETE,
        RESOURCES.PRODUCT,
        productId,
        {
          name: productToDelete.name,
          sku: productToDelete.sku,
          price: productToDelete.price,
          stock: productToDelete.stock,
          categoryName: productToDelete.category?.name,
          isPublished: productToDelete.isPublished,
        },
        userId,
      );

      return deletedProduct;
    } catch (error) {
      // Log failed product deletion
      await this.logService.logError(
        tenantId,
        PRODUCT_ACTIONS.DELETE,
        RESOURCES.PRODUCT,
        error,
        productId,
        userId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${productId} not found`);
        }
      }
      throw error;
    }
  }
}
