import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body()
    loginDto: {
      email: string;
      password: string;
      tenantId: string;
    },
    @Req() req: Request,
  ) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.tenantId,
      req.ip,
      req.get('User-Agent'),
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body()
    refreshDto: {
      refreshToken: string;
    },
  ) {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id, req.user.tenantId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body()
    forgotPasswordDto: {
      email: string;
      tenantId: string;
    },
    @Req() req: Request,
  ) {
    return this.authService.forgotPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.tenantId,
      req.ip,
      req.get('User-Agent'),
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body()
    resetPasswordDto: {
      token: string;
      newPassword: string;
      tenantId: string;
    },
    @Req() req: Request,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      resetPasswordDto.tenantId,
      req.ip,
      req.get('User-Agent'),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }
}
