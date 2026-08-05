import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadToAwsProvider {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(UploadToAwsProvider.name);

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>(
      'appConfig.arvanRegion',
    );
    const endpoint = this.configService.getOrThrow<string>(
      'appConfig.arvanEndpoint',
    );
    const accessKeyId = this.configService.getOrThrow<string>(
      'appConfig.arvanAccessKey',
    );

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey: this.configService.getOrThrow<string>(
          'appConfig.arvanSecretKey',
        ),
      },
      forcePathStyle: true,
    });

    this.logger.log('S3Client initialized successfully');
  }

  private generateFileName(originalName: string): string {
    const lastDotIndex = originalName.lastIndexOf('.');
    const name =
      lastDotIndex !== -1
        ? originalName.substring(0, lastDotIndex)
        : originalName;
    const extension =
      lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';

    return `${name}-${Date.now()}-${randomUUID()}${extension}`;
  }

  public async fileUpload(file: Express.Multer.File) {
    this.logger.log('Starting file upload');

    const fileName = this.generateFileName(file.originalname);

    const bucket = this.configService.getOrThrow<string>(
      'appConfig.arvanBucketName',
    );

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    try {
      const result = await this.s3Client.send(command);

      const endpoint = this.configService.getOrThrow<string>(
        'appConfig.arvanEndpoint',
      );
      const fileUrl = `${endpoint}/${bucket}/${fileName}`;

      this.logger.log('File uploaded successfully');

      return {
        url: fileUrl,
        key: fileName,
        result,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to S3');
      this.logger.error(`Error: ${error}`);

      throw new Error(`Failed to upload file: ${error || 'Unknown error'}`);
    }
  }
}
