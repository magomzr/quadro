import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { DatabaseModule } from '../database/database.module';
import { TenantsController } from './tenants.controller';
import { LogService } from 'src/shared/services/log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantsController],
  providers: [TenantsService, LogService],
  exports: [TenantsService],
})
export class TenantsModule {}
