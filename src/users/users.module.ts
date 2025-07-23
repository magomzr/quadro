import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [DatabaseModule, GuardsModule],
  controllers: [UsersController],
  providers: [UsersService, LoggerService],
  exports: [UsersService],
})
export class UsersModule {}
