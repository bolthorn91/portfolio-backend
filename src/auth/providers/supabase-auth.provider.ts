import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IAuthProvider, JwtPayload, AuthUserData } from '../../common/interfaces/auth-provider.interface';

@Injectable()
export class SupabaseAuthProvider implements IAuthProvider {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) return null;
      return {
        sub: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'CLIENT',
      };
    } catch {
      return null;
    }
  }

  async getUser(userId: string): Promise<AuthUserData | null> {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);
      if (error || !data.user) return null;
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email,
        role: data.user.user_metadata?.role || 'CLIENT',
      };
    } catch {
      return null;
    }
  }

  async createUser(data: { email: string; name?: string; authProviderId?: string }): Promise<AuthUserData> {
    const { data: userData, error } = await this.supabase.auth.admin.createUser({
      email: data.email,
      user_metadata: { full_name: data.name },
    });
    if (error || !userData.user) throw new Error(`Failed to create user: ${error?.message}`);
    return {
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.user_metadata?.full_name,
      role: 'CLIENT',
    };
  }

  async getUsers(): Promise<AuthUserData[]> {
    const { data, error } = await this.supabase.auth.admin.listUsers();
    if (error) return [];
    return data.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name,
      role: u.user_metadata?.role || 'CLIENT',
    }));
  }
}
