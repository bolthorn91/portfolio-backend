import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthProvider } from './providers/supabase-auth.provider';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private provider: SupabaseAuthProvider;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.provider = new SupabaseAuthProvider(configService);
  }

  async validateToken(token: string) {
    const payload = await this.provider.validateToken(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    return payload;
  }

  async getOrCreateUser(authPayload: { sub: string; email: string; name?: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: authPayload.email } });
    if (!user) {
      let tenant = await this.prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await this.prisma.tenant.create({
          data: { name: 'Default', slug: 'default' },
        });
      }
      user = await this.prisma.user.create({
        data: {
          email: authPayload.email,
          name: authPayload.name || authPayload.email,
          authProviderId: authPayload.sub,
          tenantId: tenant.id,
        },
      });
    }
    return user;
  }

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
