import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LogService } from 'src/shared/services/log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CatalogController],
  providers: [CatalogService, LogService],
  exports: [CatalogService],
})
export class CatalogModule {}
