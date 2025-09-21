import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class WebhooksService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async handleClerkWebhook(
    payload: any,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ) {
    try {
      // TODO: Verify webhook signature with Clerk
      // For now, we'll process the payload directly

      const { type, data } = payload;

      switch (type) {
        case 'user.created':
        case 'user.updated':
          await this.syncUserFromClerk(data);
          break;
        case 'user.deleted':
          await this.deleteUser(data.id);
          break;
        default:
          console.log(`Unhandled webhook type: ${type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  async handleAIServiceWebhook(payload: any) {
    try {
      const { job_id, document_id, status, result, error } = payload;

      if (status === 'completed' && result) {
        // Update document with AI processing results
        await this.updateDocumentWithResults(document_id, result);
        
        // Create tasks if any were extracted
        if (result.tasks && result.tasks.length > 0) {
          await this.createTasksFromResults(document_id, result.tasks);
        }
      } else if (status === 'failed') {
        // Mark document as failed
        await this.supabase
          .from('documents')
          .update({ 
            status: 'failed',
            processing_metadata: { error: error }
          })
          .eq('id', document_id);
      }

      return { success: true };
    } catch (error) {
      console.error('AI service webhook error:', error);
      throw new BadRequestException('AI service webhook processing failed');
    }
  }

  private async syncUserFromClerk(clerkUser: any) {
    try {
      await this.supabase
        .from('users')
        .upsert({
          clerk_id: clerkUser.id,
          email: clerkUser.email_addresses?.[0]?.email_address,
          name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim(),
          role: clerkUser.public_metadata?.role || 'staff',
          department: clerkUser.public_metadata?.department,
        });
    } catch (error) {
      console.error('Error syncing user from Clerk:', error);
      throw error;
    }
  }

  private async deleteUser(clerkId: string) {
    try {
      await this.supabase
        .from('users')
        .delete()
        .eq('clerk_id', clerkId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  private async updateDocumentWithResults(documentId: string, result: any) {
    try {
      await this.supabase
        .from('documents')
        .update({
          status: 'processed',
          ocr_text: result.ocr_text,
          summary_text: result.summary_text,
          summary_bilingual: result.summary_bilingual,
          metadata: result.metadata,
          department_suggested: result.department_suggested,
          processing_metadata: result.processing_metadata,
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('Error updating document with results:', error);
      throw error;
    }
  }

  private async createTasksFromResults(documentId: string, tasks: any[]) {
    try {
      const tasksToInsert = tasks.map(task => ({
        document_id: documentId,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        assigned_department: task.assigned_department || null,
      }));

      await this.supabase
        .from('tasks')
        .insert(tasksToInsert);
    } catch (error) {
      console.error('Error creating tasks from results:', error);
      throw error;
    }
  }
}