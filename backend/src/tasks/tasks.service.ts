import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateTaskDto, TaskQueryDto, AcknowledgeTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async createTask(createTaskDto: CreateTaskDto, user: any) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          title: createTaskDto.title,
          description: createTaskDto.description,
          document_id: createTaskDto.documentId,
          assigned_to: createTaskDto.assignedTo,
          assigned_department: createTaskDto.assignedDepartment,
          due_date: createTaskDto.dueDate,
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await this.supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: 'task_created',
          payload: { task_id: data.id, title: createTaskDto.title }
        });

      return data;
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async getTasks(query: TaskQueryDto, user: any) {
    try {
      let supabaseQuery = this.supabase
        .from('tasks')
        .select(`
          *,
          document:documents(id, file_name, doc_type),
          assigned_user:users!tasks_assigned_to_fkey(id, name, email)
        `, { count: 'exact' });

      // Apply filters based on user role and department
      if (user.role !== 'admin' && user.role !== 'director') {
        supabaseQuery = supabaseQuery.or(
          `assigned_to.eq.${user.id},assigned_department.eq.${user.department}`
        );
      }

      // Apply additional filters
      if (query.status) {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }

      if (query.department) {
        supabaseQuery = supabaseQuery.eq('assigned_department', query.department);
      }

      if (query.assignedTo) {
        supabaseQuery = supabaseQuery.eq('assigned_to', query.assignedTo);
      }

      if (query.documentId) {
        supabaseQuery = supabaseQuery.eq('document_id', query.documentId);
      }

      if (query.search) {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
        );
      }

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      supabaseQuery = supabaseQuery
        .range(offset, offset + query.limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await supabaseQuery;

      if (error) throw error;

      return {
        tasks: data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: count,
          totalPages: Math.ceil(count / query.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  }

  async getTask(taskId: string, user: any) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          document:documents(id, file_name, doc_type, summary_text),
          assigned_user:users!tasks_assigned_to_fkey(id, name, email),
          acknowledged_user:users!tasks_acknowledged_by_fkey(id, name, email)
        `)
        .eq('id', taskId)
        .single();

      if (error || !data) {
        throw new NotFoundException('Task not found');
      }

      // Check if user has access to this task
      if (user.role !== 'admin' && user.role !== 'director') {
        if (data.assigned_to !== user.id && data.assigned_department !== user.department) {
          throw new ForbiddenException('Access denied');
        }
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
  }

  async acknowledgeTask(taskId: string, acknowledgeTaskDto: AcknowledgeTaskDto, user: any) {
    try {
      // First check if user has access to this task
      const task = await this.getTask(taskId, user);

      if (task.status !== 'pending') {
        throw new Error('Task is not in pending status');
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          status: 'acknowledged',
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await this.supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: 'task_acknowledged',
          payload: { task_id: taskId, notes: acknowledgeTaskDto.notes }
        });

      return data;
    } catch (error) {
      throw new Error(`Failed to acknowledge task: ${error.message}`);
    }
  }

  async closeTask(taskId: string, user: any) {
    try {
      // First check if user has access to this task
      const task = await this.getTask(taskId, user);

      // Only admins, directors, or the assigned user can close tasks
      if (user.role !== 'admin' && user.role !== 'director' && task.assigned_to !== user.id) {
        throw new ForbiddenException('Only assigned users or admins can close tasks');
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .update({ status: 'closed' })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await this.supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: 'task_closed',
          payload: { task_id: taskId }
        });

      return data;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to close task: ${error.message}`);
    }
  }

  async getDepartmentTasks(department: string, user: any) {
    try {
      // Check if user has access to this department
      if (user.role !== 'admin' && user.role !== 'director' && user.department !== department) {
        throw new ForbiddenException('Access denied to department tasks');
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          document:documents(id, file_name, doc_type),
          assigned_user:users!tasks_assigned_to_fkey(id, name, email)
        `)
        .eq('assigned_department', department)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to fetch department tasks: ${error.message}`);
    }
  }

  async getTaskStats(user: any) {
    try {
      let query = this.supabase.from('tasks').select('status');

      // Apply role-based filtering
      if (user.role !== 'admin' && user.role !== 'director') {
        query = query.or(`assigned_to.eq.${user.id},assigned_department.eq.${user.department}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(t => t.status === 'pending').length,
        acknowledged: data.filter(t => t.status === 'acknowledged').length,
        closed: data.filter(t => t.status === 'closed').length,
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch task stats: ${error.message}`);
    }
  }
}