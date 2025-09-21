import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QueueService {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get('REDIS_URL') || 'redis://localhost:6379');
  }

  async enqueueDocumentProcessing(documentData: any): Promise<string> {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'document_processing',
      data: documentData,
      createdAt: new Date().toISOString(),
      status: 'queued'
    };

    await this.redis.lpush('document_processing_jobs', JSON.stringify(job));
    await this.redis.setex(`job_status:${jobId}`, 3600, 'queued');

    return jobId;
  }

  async getJobStatus(jobId: string): Promise<string | null> {
    return await this.redis.get(`job_status:${jobId}`);
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    await this.redis.setex(`job_status:${jobId}`, 3600, status);
  }

  async getJobResult(jobId: string): Promise<any> {
    const result = await this.redis.get(`job_result:${jobId}`);
    return result ? JSON.parse(result) : null;
  }

  async setJobResult(jobId: string, result: any): Promise<void> {
    await this.redis.setex(`job_result:${jobId}`, 3600, JSON.stringify(result));
  }
}