import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadToAwsProvider } from './upload-to-aws.provider';
import { ConfigService } from '@nestjs/config';
import { UploadFile } from '../interface/upload-file.interface';
import { fileType } from '../interface/file.types.enum';
import { Upload } from '../entity/upload.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    private readonly uploadToAwsProvider: UploadToAwsProvider,
    private readonly configService: ConfigService,
  ) {}

  public async uploadFile(
    file: Express.Multer.File,
    userId: number,
    isPrivate: boolean = false,
  ) {
    try {
      // ✅ اول چک کن که file وجود داره
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // ✅ بعد چک کن که mimetype وجود داره
      if (!file.mimetype) {
        throw new BadRequestException('File mimetype is missing');
      }

      const imageMimeTypes = [
        'image/gif',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      const audioMimeTypes = [
        'audio/webm',
        'audio/ogg',
        'audio/mpeg',
        'audio/mp4',
        'audio/wav',
      ]; // 👈 فرمت‌های ویس
      const allowedMimeTypes = [...imageMimeTypes, ...audioMimeTypes];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `MIME type not supported. Allowed types: ${allowedMimeTypes.join(', ')}`,
        );
      }

      // آپلود به Arvan Cloud
      const uploadResult = await this.uploadToAwsProvider.fileUpload(
        file,
        isPrivate,
      );
      const currentFileType = file.mimetype.startsWith('audio/')
        ? fileType.AUDIO
        : fileType.IMAGE;
      // ساخت object نهایی
      const uploadFile: UploadFile = {
        name: uploadResult.key,
        path: uploadResult.url,
        type: currentFileType,
        mime: file.mimetype,
        size: file.size,
        uploadedById: userId,
        isPrivate,
      };

      const upload = this.uploadRepository.create(uploadFile);

      return await this.uploadRepository.save(upload);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ConflictException(
        error instanceof Error ? error.message : 'Upload failed',
      );
    }
  }
}
