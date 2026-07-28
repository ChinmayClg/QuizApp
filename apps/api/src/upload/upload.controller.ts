// ===========================
// Upload Controller - Image Upload Endpoint
// ===========================

import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@quizai/database';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Upload an image for a quiz question' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log('[UPLOAD] file received:', file ? { name: file.originalname, mime: file.mimetype, size: file.size, hasBuffer: !!file.buffer } : 'NO FILE');
    try {
      const url = await this.uploadService.uploadImage(file);
      return { success: true, url };
    } catch (err) {
      console.error('[UPLOAD] error:', err);
      throw err;
    }
  }
}
