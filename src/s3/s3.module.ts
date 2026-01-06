import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { S3HealthService } from './s3-health.service';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  providers: [S3Service, S3HealthService, S3Client],
  exports: [S3Service, S3HealthService],
})
export class S3Module {}
