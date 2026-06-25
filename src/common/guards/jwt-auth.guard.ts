import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('No token provided');

    const token = authHeader.replace('Bearer ', '');
    const payload = await this.authService.validateToken(token);
    if (!payload) throw new UnauthorizedException('Invalid token');

    const user = await this.authService.getOrCreateUser({
      sub: payload.sub,
      email: payload.email,
    });
    request.user = user;
    return true;
  }
}
