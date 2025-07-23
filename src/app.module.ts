import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { DiscountsModule } from './discounts/discounts.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GuardsModule } from './shared/guards/guards.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    TenantsModule,
    CatalogModule,
    SettingsModule,
    CustomersModule,
    OrdersModule,
    DiscountsModule,
    UsersModule,
    AuthModule,
    GuardsModule,
    LoggerModule,
  ],
})
export class AppModule {}
