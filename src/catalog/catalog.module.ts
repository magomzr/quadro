import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [DatabaseModule, GuardsModule],
  controllers: [CatalogController],
  providers: [CatalogService, LoggerService],
  exports: [CatalogService],
})
export class CatalogModule {}
