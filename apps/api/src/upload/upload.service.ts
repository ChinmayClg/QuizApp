// ===========================
// Upload Service - Cloudinary Image Uploads
// ===========================

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {
    const cloudinaryUrl = this.config.get('CLOUDINARY_URL');
    
    let cloudName, apiKey, apiSecret;

    if (cloudinaryUrl) {
      console.log('[CLOUDINARY] Configured via CLOUDINARY_URL');
      // Format: cloudinary://api_key:api_secret@cloud_name
      const url = cloudinaryUrl.replace('cloudinary://', '');
      const [credentials, cName] = url.split('@');
      const [key, secret] = credentials.split(':');
      cloudName = cName;
      apiKey = key;
      apiSecret = secret;
    } else {
      cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
      apiKey = this.config.get('CLOUDINARY_API_KEY');
      apiSecret = this.config.get('CLOUDINARY_API_SECRET');
    }

    console.log('[CLOUDINARY] Config:', {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret ? apiSecret.slice(0, 4) + '***' : 'MISSING',
    });

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be under 5MB');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'quizai/questions',
            resource_type: 'image',
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(new BadRequestException('Image upload failed: ' + error.message));
            } else {
              resolve(result!.secure_url);
            }
          },
        )
        .end(file.buffer);
    });
  }
}
