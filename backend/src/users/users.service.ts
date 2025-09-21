import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpdateUserDto, UserQueryDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async getCurrentUser(user: any) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        throw new NotFoundException('User not found');
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch current user: ${error.message}`);
    }
  }

  async getUsers(query: UserQueryDto, user: any) {
    try {
      // Only admins can view all users
      if (user.role !== 'admin') {
        throw new ForbiddenException('Only admins can view all users');
      }

      let supabaseQuery = this.supabase
        .from('users')
        .select('id, clerk_id, email, name, role, department, created_at, updated_at', { count: 'exact' });

      // Apply filters
      if (query.role) {
        supabaseQuery = supabaseQuery.eq('role', query.role);
      }

      if (query.department) {
        supabaseQuery = supabaseQuery.eq('department', query.department);
      }

      if (query.search) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${query.search}%,email.ilike.%${query.search}%`
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
        users: data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: count,
          totalPages: Math.ceil(count / query.limit)
        }
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async getUser(userId: string, user: any) {
    try {
      // Users can only view their own profile unless they're admin
      if (user.role !== 'admin' && user.id !== userId) {
        throw new ForbiddenException('Access denied');
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('id, clerk_id, email, name, role, department, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new NotFoundException('User not found');
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto, user: any) {
    try {
      // Only admins can update users
      if (user.role !== 'admin') {
        throw new ForbiddenException('Only admins can update users');
      }

      const { data, error } = await this.supabase
        .from('users')
        .update({
          name: updateUserDto.name,
          role: updateUserDto.role,
          department: updateUserDto.department,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new NotFoundException('User not found');
      }

      // Log audit event
      await this.supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: 'user_updated',
          payload: { 
            user_id: userId, 
            changes: updateUserDto 
          }
        });

      return data;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async getUsersByDepartment(department: string, user: any) {
    try {
      // Users can only view users in their own department unless they're admin/director
      if (user.role !== 'admin' && user.role !== 'director' && user.department !== department) {
        throw new ForbiddenException('Access denied to department users');
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('id, name, email, role, department')
        .eq('department', department)
        .order('name');

      if (error) throw error;

      return data;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to fetch department users: ${error.message}`);
    }
  }

  async syncFromClerk(clerkData: any) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .upsert({
          clerk_id: clerkData.id,
          email: clerkData.email_addresses?.[0]?.email_address,
          name: `${clerkData.first_name || ''} ${clerkData.last_name || ''}`.trim(),
          role: clerkData.public_metadata?.role || 'staff',
          department: clerkData.public_metadata?.department,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Failed to sync user from Clerk: ${error.message}`);
    }
  }

  async getUserStats() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('role, department');

      if (error) throw error;

      const stats = {
        total: data.length,
        byRole: data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        byDepartment: data.reduce((acc, user) => {
          if (user.department) {
            acc[user.department] = (acc[user.department] || 0) + 1;
          }
          return acc;
        }, {}),
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }
  }
}