import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthTenantGuard } from 'src/shared/guards/auth-tenant.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Request } from 'express';

@Controller({
  path: 'tenants/:tenantId/users',
  version: '1',
})
@UseGuards(AuthTenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body()
    createUserDto: {
      email: string;
      password: string;
      name: string;
      role: 'admin' | 'staff';
    },
  ) {
    return this.usersService.create(tenantId, createUserDto);
  }

  @Get()
  @Roles('admin')
  findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('role') role?: 'admin' | 'staff',
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    return this.usersService.findAll(tenantId, page, limit, filters);
  }

  @Get(':userId')
  @Roles('admin')
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.findOne(tenantId, userId);
  }

  @Patch(':userId')
  @Roles('admin')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body()
    updateUserDto: {
      email?: string;
      name?: string;
      role?: 'admin' | 'staff';
      isActive?: boolean;
    },
  ) {
    return this.usersService.update(tenantId, userId, updateUserDto);
  }

  @Patch(':userId/password')
  updatePassword(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { password: string },
    @Req() req: Request & { user: any },
  ) {
    const { user } = req;
    if (user.role === 'staff' && user.id !== userId) {
      throw new ForbiddenException(
        'Staff users can only change their own password',
      );
    }
    return this.usersService.updatePassword(tenantId, userId, body.password);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.remove(tenantId, userId);
  }
}
