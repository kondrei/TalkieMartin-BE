import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  constructor(private readonly configService: ConfigService) {}
  async checkBucketExists(bucketName: string): Promise<boolean> {
    const s3Client = new S3Client({});
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      console.error('Error checking if bucket exists in S3:', error);
      return false;
    }
  }
  async checkFileExists(
    bucketName: string,
    fileName: string,
  ): Promise<boolean> {
    const s3Client = new S3Client({});
    try {
      await s3Client.send(
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
      console.error('Error checking if file exists in S3:', error);
      throw error;
    }
  }

  async uploadFiles(
    bucketName: string,
    files: Array<{ fileObject: Express.Multer.File; fileName: string }> = [],
  ): Promise<void> {
    const s3Client = new S3Client({});

    try {
      await Promise.all(
        files.map(async (file) => {
          await s3Client.send(
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
    const s3Client = new S3Client({});
    try {
      const fileExists = await this.checkFileExists(bucketName, fileName);

      if (!fileExists) {
        console.error(`File not found in S3: ${fileName}`);
        return null;
      }

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

  async deleteFiles(bucketName: string, fileNames: string[]): Promise<boolean> {
    if (fileNames.length === 0) return null;
    const s3Client = new S3Client({});
    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: fileNames?.map((file) => ({ Key: file })) },
        }),
      );
      return true;
    } catch (error) {
      console.error('Error deleting files from S3:', error);
      return false;
    }
  }
}
