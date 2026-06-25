import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await this.jwtAuthGuard.canActivate(context);
    } catch {
      const request = context.switchToHttp().getRequest();
      request.user = null;
      return true;
    }
  }
}
