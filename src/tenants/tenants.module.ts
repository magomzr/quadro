import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { DatabaseModule } from '../database/database.module';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
