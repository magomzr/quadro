import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DatabaseModule } from 'src/database/database.module';
import { DiscountsModule } from 'src/discounts/discounts.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [DatabaseModule, DiscountsModule, GuardsModule],
  controllers: [OrdersController],
  providers: [OrdersService, LoggerService],
})
export class OrdersModule {}
