import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [DatabaseModule, TenantsModule, CatalogModule, SettingsModule],
})
export class AppModule {}
