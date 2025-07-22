import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LogService } from 'src/shared/services/log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DiscountsController],
  providers: [DiscountsService, LogService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
