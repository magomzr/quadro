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
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller({
  path: 'tenants/:tenantId/users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.findOne(tenantId, userId);
  }

  @Patch(':userId')
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
  ) {
    return this.usersService.updatePassword(tenantId, userId, body.password);
  }

  @Post('forgot-password')
  forgotPassword(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() body: { email: string },
  ) {
    return this.usersService.generatePasswordResetToken(tenantId, body.email);
  }

  @Post('reset-password')
  resetPassword(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() body: { token: string; password: string },
  ) {
    return this.usersService.resetPassword(tenantId, body.token, body.password);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.remove(tenantId, userId);
  }
}
