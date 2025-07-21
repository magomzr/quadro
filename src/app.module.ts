import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    DatabaseModule,
    TenantsModule,
    CatalogModule,
    SettingsModule,
    CustomersModule,
    OrdersModule,
  ],
})
export class AppModule {}
