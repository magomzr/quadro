import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [DatabaseModule, TenantsModule, CatalogModule],
})
export class AppModule {}
