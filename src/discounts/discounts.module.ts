import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [DatabaseModule, GuardsModule],
  controllers: [DiscountsController],
  providers: [DiscountsService, LoggerService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
