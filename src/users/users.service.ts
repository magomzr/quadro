import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { LoggerService } from 'src/logger/logger.service';
import {
  USER_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logService: LoggerService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async create(
    tenantId: string,
    createUserDto: {
      email: string;
      password: string;
      name: string;
      role: 'admin' | 'staff';
    },
    createdByUserId?: string,
  ) {
    try {
      // Hash password before storing
      const passwordHash = await this.hashPassword(createUserDto.password);

      const user = await this.databaseService.user.create({
        data: {
          email: createUserDto.email.toLowerCase(),
          passwordHash,
          name: createUserDto.name,
          role: createUserDto.role,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          isActive: true,
          lastLoginAt: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log successful user creation
      await this.logService.logSuccess(
        tenantId,
        USER_ACTIONS.CREATE,
        RESOURCES.USER,
        user.id,
        createdByUserId,
        {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      );

      return user;
    } catch (error) {
      // Log failed user creation
      await this.logService.logError(
        tenantId,
        USER_ACTIONS.CREATE,
        RESOURCES.USER,
        error,
        undefined,
        createdByUserId,
        {
          attemptedData: {
            email: createUserDto.email,
            name: createUserDto.name,
            role: createUserDto.role,
          },
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'User email already exists for this tenant',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Tenant not found');
        }
      }
      throw error;
    }
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      role?: 'admin' | 'staff';
      isActive?: boolean;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      tenantId,
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const [users, total] = await Promise.all([
      this.databaseService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          isActive: true,
          lastLoginAt: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.databaseService.user.count({ where }),
    ]);

    return {
      data: users,
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

  async findOne(tenantId: string, userId: string) {
    const user = await this.databaseService.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        isActive: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async findByEmail(tenantId: string, email: string) {
    return this.databaseService.user.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId,
      },
    });
  }

  async update(
    tenantId: string,
    userId: string,
    updateUserDto: {
      email?: string;
      name?: string;
      role?: 'admin' | 'staff';
      isActive?: boolean;
    },
    updatedByUserId?: string,
  ) {
    try {
      // Get original user data for logging
      const originalUser = await this.databaseService.user.findFirst({
        where: { id: userId, tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!originalUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const updatedUser = await this.databaseService.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          ...(updateUserDto.email && {
            email: updateUserDto.email.toLowerCase(),
          }),
          ...(updateUserDto.name && { name: updateUserDto.name }),
          ...(updateUserDto.role && { role: updateUserDto.role }),
          ...(updateUserDto.isActive !== undefined && {
            isActive: updateUserDto.isActive,
          }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          isActive: true,
          lastLoginAt: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log successful user update
      await this.logService.logUpdate(
        tenantId,
        USER_ACTIONS.UPDATE,
        RESOURCES.USER,
        userId,
        {
          email: originalUser.email,
          name: originalUser.name,
          role: originalUser.role,
          isActive: originalUser.isActive,
        },
        {
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
        updatedByUserId,
      );

      return updatedUser;
    } catch (error) {
      // Log failed user update
      await this.logService.logError(
        tenantId,
        USER_ACTIONS.UPDATE,
        RESOURCES.USER,
        error,
        userId,
        updatedByUserId,
        {
          attemptedData: updateUserDto,
        },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'User email already exists for this tenant',
          );
        }
      }
      throw error;
    }
  }

  async updatePassword(
    tenantId: string,
    userId: string,
    newPassword: string,
    updatedByUserId?: string,
  ) {
    try {
      const passwordHash = await this.hashPassword(newPassword);

      await this.databaseService.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      });

      // Log successful password update
      await this.logService.logSuccess(
        tenantId,
        USER_ACTIONS.PASSWORD_RESET,
        RESOURCES.USER,
        userId,
        updatedByUserId,
        {
          action: 'password_updated',
        },
      );

      return { message: 'Password updated successfully' };
    } catch (error) {
      // Log failed password update
      await this.logService.logError(
        tenantId,
        USER_ACTIONS.PASSWORD_RESET,
        RESOURCES.USER,
        error,
        userId,
        updatedByUserId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
      }
      throw error;
    }
  }

  async generatePasswordResetToken(tenantId: string, email: string) {
    const user = await this.findByEmail(tenantId, email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('User account is inactive');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.databaseService.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    // Log password reset request
    await this.logService.logSuccess(
      tenantId,
      USER_ACTIONS.PASSWORD_RESET,
      RESOURCES.USER,
      user.id,
      undefined,
      {
        action: 'reset_token_generated',
        email: user.email,
      },
    );

    return { resetToken, expiresAt };
  }

  async resetPassword(tenantId: string, token: string, newPassword: string) {
    const user = await this.databaseService.user.findFirst({
      where: {
        tenantId,
        resetPasswordToken: token,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.updatePassword(tenantId, user.id, newPassword);

    return { message: 'Password reset successfully' };
  }

  async remove(tenantId: string, userId: string, deletedByUserId?: string) {
    try {
      // Get user data for logging before deletion
      const user = await this.databaseService.user.findFirst({
        where: { id: userId, tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Instead of hard delete, deactivate the user
      const deactivatedUser = await this.databaseService.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      // Log successful user deactivation
      await this.logService.logUpdate(
        tenantId,
        USER_ACTIONS.DELETE,
        RESOURCES.USER,
        userId,
        { isActive: true },
        { isActive: false },
        deletedByUserId,
      );

      return deactivatedUser;
    } catch (error) {
      // Log failed user deletion
      await this.logService.logError(
        tenantId,
        USER_ACTIONS.DELETE,
        RESOURCES.USER,
        error,
        userId,
        deletedByUserId,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
      }
      throw error;
    }
  }

  async updateLastLoginAt(userId: string, tenantId: string) {
    await this.databaseService.user.update({
      where: { id: userId, tenantId },
      data: { lastLoginAt: new Date() },
    });
  }

  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
