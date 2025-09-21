import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async syncUserFromClerk(clerkUser: any) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .upsert({
          clerk_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          role: clerkUser.publicMetadata?.role || 'staff',
          department: clerkUser.publicMetadata?.department,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to sync user: ${error.message}`);
    }
  }

  async getUserByClerkId(clerkId: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }
}