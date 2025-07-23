import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { DatabaseModule } from '../database/database.module';
import { TenantsController } from './tenants.controller';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantsController],
  providers: [TenantsService, LoggerService],
  exports: [TenantsService],
})
export class TenantsModule {}
