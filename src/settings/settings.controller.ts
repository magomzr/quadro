import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from 'generated/prisma';
import { SettingsService } from './settings.service';
import { S3UploadService } from '../shared/s3-upload.service';

@Controller({
  path: 'tenants/:tenantId/settings',
  version: '1',
})
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  @Get()
  findSettings(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.settingsService.findSettings(tenantId);
  }

  @Patch()
  updateSettings(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() updateSettingsDto: Prisma.SettingsUpdateInput,
  ) {
    return this.settingsService.updateSettings(tenantId, updateSettingsDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteSettings(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.settingsService.deleteSettings(tenantId);
  }

  // New endpoint: Upload company logo via file upload
  @Post('logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit for logos
      },
    }),
  )
  async uploadCompanyLogo(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No logo file provided');
    }

    // Upload to S3 and get URL
    const companyLogoUrl = await this.s3UploadService.uploadCompanyLogo(file);

    // Update settings with new logo URL
    return this.settingsService.updateSettings(tenantId, {
      companyLogoUrl,
    });
  }
}
