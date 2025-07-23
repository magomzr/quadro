import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerService } from 'src/logger/logger.service';
import { GuardsModule } from 'src/shared/guards/guards.module';

@Module({
  imports: [DatabaseModule, GuardsModule],
  controllers: [SettingsController],
  providers: [SettingsService, LoggerService],
})
export class SettingsModule {}
