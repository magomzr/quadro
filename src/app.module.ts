import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
