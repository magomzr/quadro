import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from 'src/shared/strategies/jwt.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/users/users.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    GuardsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoggerService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
