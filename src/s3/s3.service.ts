import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Client: S3Client,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      return false;
    }
  }
  async checkFileExists(
    bucketName: string,
    fileName: string,
  ): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: bucketName, Key: fileName }),
      );
      return true;
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw new Error('Failed to check file existence in S3');
    }
  }

  async uploadFiles(
    bucketName: string,
    files: Array<{ fileObject: Express.Multer.File; fileName: string }> = [],
  ): Promise<void> {
    try {
      await Promise.all(
        files.map(async (file) => {
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: file.fileName,
              Body: file.fileObject.buffer,
              ContentType: file.fileObject.mimetype,
            }),
          );
        }),
      );
    } catch (error) {
      throw new Error('Failed to upload file to S3');
    }
  }

  async getDownloadUrl(
    bucketName: string,
    fileName: string,
  ): Promise<string | null> {
    if (this.configService.get<string>('ENV') === 'dev') {
      return `https://picsum.photos/500/500?random=${Math.random()}`;
    }
    const cachedUrl = await this.cacheManager.get<string>(
      `url:${bucketName}:${fileName}`,
    );
    if (cachedUrl) {
      return cachedUrl;
    }
    try {
      const fileExists = await this.checkFileExists(bucketName, fileName);

      if (!fileExists) {
        return null;
      }

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      const ttlInSeconds = 3600;
      const ttlInMilliseconds = ttlInSeconds * 1000;
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: ttlInSeconds,
      });
      await this.cacheManager.set(
        `url:${bucketName}:${fileName}`,
        url,
        ttlInMilliseconds,
      );
      return url;
    } catch (error) {
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteFiles(bucketName: string, fileNames: string[]): Promise<boolean> {
    if (fileNames.length === 0) return null;
    try {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: fileNames?.map((file) => ({
              Key: decodeURIComponent(file),
            })),
          },
        }),
      );
      return true;
    } catch (error) {
      throw new Error('Failed to delete files from S3');
    }
  }
}
