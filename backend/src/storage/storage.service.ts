import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
      ...(this.configService.get('AWS_ENDPOINT_URL') && {
        endpoint: this.configService.get('AWS_ENDPOINT_URL'),
        s3ForcePathStyle: true,
      }),
    });
    this.bucketName = this.configService.get('S3_BUCKET_NAME');
  }

  async generatePresignedUrl(key: string, contentType: string, expires = 3600): Promise<string> {
    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Expires: expires,
    });
  }

  async generateDownloadUrl(key: string, expires = 3600): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: expires,
    });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: key,
    }).promise();
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    await this.s3.copyObject({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    }).promise();
  }
}