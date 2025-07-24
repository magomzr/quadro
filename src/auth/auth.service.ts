import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoggerService } from 'src/logger/logger.service';
import {
  AUTH_ACTIONS,
  RESOURCES,
} from 'src/shared/constants/log-actions.constants';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: 'admin' | 'staff';
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logService: LoggerService,
  ) {}

  async login(
    email: string,
    password: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      // Buscar usuario por email y tenant
      const user = await this.usersService.findByEmail(tenantId, email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Verificar contraseña
      const isPasswordValid = await this.usersService.verifyPassword(
        password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        // Log failed login attempt
        await this.logService.logError(
          tenantId,
          AUTH_ACTIONS.LOGIN,
          RESOURCES.USER,
          new Error('Invalid password'),
          user.id,
          undefined,
          {
            email,
            ipAddress,
            userAgent,
            reason: 'invalid_password',
          },
        );

        throw new UnauthorizedException('Invalid credentials');
      }

      // Generar tokens
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      // Actualizar lastLoginAt
      await this.usersService.updateLastLoginAt(user.id, tenantId);

      // Log successful login
      await this.logService.logSuccess(
        tenantId,
        AUTH_ACTIONS.LOGIN,
        RESOURCES.USER,
        user.id,
        user.id,
        {
          email: user.email,
          ipAddress,
          userAgent,
        },
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          isActive: user.isActive,
          lastLoginAt: new Date(),
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log unexpected login error
      await this.logService.logError(
        tenantId,
        AUTH_ACTIONS.LOGIN,
        RESOURCES.USER,
        error,
        undefined,
        undefined,
        {
          email,
          ipAddress,
          userAgent,
        },
      );

      throw new UnauthorizedException('Authentication failed');
    }
  }

  async refreshToken(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);

    // Verificar que el usuario aún existe y está activo
    const user = await this.usersService.findOne(payload.tenantId, payload.sub);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generar nuevo access token
    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: '15m',
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: '7d',
    });

    // Log token refresh
    await this.logService.logSuccess(
      user.tenantId,
      AUTH_ACTIONS.REFRESH_TOKEN,
      RESOURCES.USER,
      user.id,
      user.id,
      {
        email: user.email,
      },
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, tenantId: string) {
    try {
      // En una implementación más completa, aquí agregarías el token a una blacklist
      // Por ahora, solo registramos el logout

      await this.logService.logSuccess(
        tenantId,
        AUTH_ACTIONS.LOGOUT,
        RESOURCES.USER,
        userId,
        userId,
        {},
      );

      return { message: 'Logged out successfully' };
    } catch (error) {
      await this.logService.logError(
        tenantId,
        AUTH_ACTIONS.LOGOUT,
        RESOURCES.USER,
        error,
        userId,
        userId,
      );

      throw error;
    }
  }

  async forgotPassword(
    email: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const result = await this.usersService.generatePasswordResetToken(
        tenantId,
        email,
      );

      // Log password reset request
      await this.logService.logSuccess(
        tenantId,
        AUTH_ACTIONS.FORGOT_PASSWORD,
        RESOURCES.USER,
        undefined,
        undefined,
        {
          email,
          ipAddress,
          userAgent,
          resetTokenGenerated: true,
        },
      );

      // En producción, aquí enviarías un email con el token
      // Por ahora, devolvemos el token para pruebas (NO HACER EN PRODUCCIÓN)
      return {
        message: 'Password reset token generated',
        // TODO: Remover en producción - solo para desarrollo
        resetToken: result.resetToken,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      await this.logService.logError(
        tenantId,
        AUTH_ACTIONS.FORGOT_PASSWORD,
        RESOURCES.USER,
        error,
        undefined,
        undefined,
        {
          email,
          ipAddress,
          userAgent,
        },
      );

      if (error instanceof NotFoundException) {
        // Por seguridad, no revelar si el email existe o no
        return {
          message: 'If the email exists, a reset token has been sent',
        };
      }

      throw error;
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const result = await this.usersService.resetPassword(
        tenantId,
        token,
        newPassword,
      );

      // Log successful password reset
      await this.logService.logSuccess(
        tenantId,
        AUTH_ACTIONS.RESET_PASSWORD,
        RESOURCES.USER,
        undefined,
        undefined,
        {
          ipAddress,
          userAgent,
          passwordResetCompleted: true,
        },
      );

      return result;
    } catch (error) {
      await this.logService.logError(
        tenantId,
        AUTH_ACTIONS.RESET_PASSWORD,
        RESOURCES.USER,
        error,
        undefined,
        undefined,
        {
          token: token.substring(0, 8) + '...', // Solo primeros 8 chars por seguridad
          ipAddress,
          userAgent,
        },
      );

      throw error;
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.tenantId, payload.sub);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }
}
