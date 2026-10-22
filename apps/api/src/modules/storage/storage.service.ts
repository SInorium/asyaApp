import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      endpoint: config.get('S3_ENDPOINT'),
      region: config.get('S3_REGION', 'us-east-1'),
      // MinIO не поддерживает virtual-hosted style адреса бакетов
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow('S3_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow('S3_SECRET_KEY'),
      },
    });
    this.bucket = config.getOrThrow('S3_BUCKET');
    this.publicUrl = config.getOrThrow<string>('S3_PUBLIC_URL').replace(/\/$/, '');
  }

  /** Только для разработки: в проде бакет и его политики настраиваются инфраструктурой. */
  async onModuleInit() {
    if (this.config.get('S3_AUTO_CREATE_BUCKET') !== 'true') return;
    const Bucket = this.bucket;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket }));
      this.logger.log(`Создан бакет ${Bucket}`);
    }
    try {
      // картины публичны: сайт отдаёт их прямыми ссылками
      await this.s3.send(
        new PutBucketPolicyCommand({
          Bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${Bucket}/*`],
              },
            ],
          }),
        }),
      );
      // браузер админки делает PUT по presigned URL на другой origin
      await this.s3.send(
        new PutBucketCorsCommand({
          Bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedMethods: ['PUT', 'GET'],
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch (err) {
      this.logger.warn(`Не удалось настроить бакет ${Bucket}: ${String(err)}`);
    }
  }

  /** Браузер загружает файл напрямую в S3 по этой ссылке, минуя API. */
  async presignUpload(userId: string, contentType: string) {
    const key = `uploads/${userId}/${randomUUID()}.${EXT[contentType] ?? 'bin'}`;
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
    return { uploadUrl, key };
  }

  /** Ключ должен лежать в папке пользователя — чужие файлы привязать нельзя. */
  isOwnedKey(userId: string, key: string) {
    return key.startsWith(`uploads/${userId}/`);
  }

  url(key: string) {
    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string) {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Не удалось удалить ${key}: ${String(err)}`);
    }
  }
}
