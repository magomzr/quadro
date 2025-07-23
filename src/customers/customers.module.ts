import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [DatabaseModule, GuardsModule],
  controllers: [CustomersController],
  providers: [CustomersService, LoggerService],
})
export class CustomersModule {}
