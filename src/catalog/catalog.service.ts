import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CatalogService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createCategory(
    tenantId: string,
    createCategoryDto: Prisma.CategoryCreateInput,
  ) {
    try {
      return await this.databaseService.category.create({
        data: {
          ...createCategoryDto,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      });
    } catch (error) {
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
  ) {
    try {
      return await this.databaseService.category.update({
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
    } catch (error) {
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

  async removeCategory(tenantId: string, categoryId: string) {
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

      return await this.databaseService.category.delete({
        where: {
          id: categoryId,
        },
      });
    } catch (error) {
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
  ) {
    try {
      return await this.databaseService.product.create({
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
    } catch (error) {
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
  ) {
    try {
      return await this.databaseService.product.update({
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
    } catch (error) {
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

  async updateProductStock(tenantId: string, productId: string, stock: number) {
    try {
      return await this.databaseService.product.update({
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
    } catch (error) {
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
  ) {
    try {
      return await this.databaseService.product.update({
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${productId} not found`);
        }
      }
      throw error;
    }
  }

  async removeProduct(tenantId: string, productId: string) {
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

      return await this.databaseService.product.delete({
        where: {
          id: productId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${productId} not found`);
        }
      }
      throw error;
    }
  }
}
