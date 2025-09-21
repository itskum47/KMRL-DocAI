import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private queueService: QueueService,
    private storageService: StorageService
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async createPresignedUrl(createDocumentDto: CreateDocumentDto, user: any) {
    try {
      const documentId = uuidv4();
      const s3Key = `documents/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${documentId}-${createDocumentDto.fileName}`;

      // Generate presigned URL for upload
      const presignedUrl = await this.storageService.generatePresignedUrl(
        s3Key,
        createDocumentDto.contentType
      );

      // Create document record in database
      const { data, error } = await this.supabase
        .from('documents')
        .insert({
          id: documentId,
          uploader_id: user.id,
          file_s3_key: s3Key,
          file_name: createDocumentDto.fileName,
          doc_type: createDocumentDto.docType,
          status: 'uploaded'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        documentId,
        presignedUrl,
        s3Key
      };
    } catch (error) {
      throw new Error(`Failed to create presigned URL: ${error.message}`);
    }
  }

  async finalizeUpload(documentId: string, user: any) {
    try {
      // Verify document belongs to user
      const { data: document, error: fetchError } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('uploader_id', user.id)
        .single();

      if (fetchError || !document) {
        throw new NotFoundException('Document not found');
      }

      // Update status to processing
      const { error: updateError } = await this.supabase
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Enqueue AI processing job
      await this.queueService.enqueueDocumentProcessing({
        document_id: document.id,
        s3_key: document.file_s3_key,
        file_name: document.file_name,
        doc_type: document.doc_type,
        language: document.language
      });

      return { message: 'Document upload finalized and queued for processing' };
    } catch (error) {
      throw new Error(`Failed to finalize upload: ${error.message}`);
    }
  }

  async getDocuments(query: DocumentQueryDto, user: any) {
    try {
      let supabaseQuery = this.supabase
        .from('documents')
        .select('*', { count: 'exact' });

      // Apply RLS - users can only see documents in their department or uploaded by them
      // This is handled by RLS policies, but we can add additional filters here

      // Apply filters
      if (query.status) {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }

      if (query.docType) {
        supabaseQuery = supabaseQuery.eq('doc_type', query.docType);
      }

      if (query.department) {
        supabaseQuery = supabaseQuery.eq('department_assigned', query.department);
      }

      if (query.search) {
        supabaseQuery = supabaseQuery.textSearch('fts', query.search);
      }

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      supabaseQuery = supabaseQuery
        .range(offset, offset + query.limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await supabaseQuery;

      if (error) throw error;

      return {
        documents: data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: count,
          totalPages: Math.ceil(count / query.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }

  async getDocument(documentId: string, user: any) {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !data) {
        throw new NotFoundException('Document not found');
      }

      // Generate signed URL for file download
      const downloadUrl = await this.storageService.generateDownloadUrl(data.file_s3_key);

      return {
        ...data,
        downloadUrl
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
  }

  async reprocessDocument(documentId: string, user: any) {
    try {
      // Check if user has admin role
      if (user.role !== 'admin') {
        throw new ForbiddenException('Only admins can reprocess documents');
      }

      const { data, error } = await this.supabase
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', documentId)
        .select()
        .single();

      if (error || !data) {
        throw new NotFoundException('Document not found');
      }

      // Enqueue AI processing job
      await this.queueService.enqueueDocumentProcessing({
        document_id: data.id,
        s3_key: data.file_s3_key,
        file_name: data.file_name,
        doc_type: data.doc_type,
        language: data.language
      });

      // Log audit event
      await this.supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: 'document_reprocessed',
          payload: { document_id: documentId }
        });

      return { message: 'Document queued for reprocessing' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to reprocess document: ${error.message}`);
    }
  }
}