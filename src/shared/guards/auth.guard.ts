import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}
  async canActivate(
    context: ExecutionContext,
  ) {
    const req = context.switchToHttp().getRequest();
    const bearerToken = req.headers['authorization'] as string;
    if (bearerToken) {
      const token = bearerToken.replace('Bearer ',''); 
      const origin = req.headers.origin;
      const whitelist = ['http://localhost:3000', this.configService.get('NGROK_FRONT_URI')]
      const isWhiteListed = whitelist.includes(origin)
        try {
          const isValid = await this.jwtService.verifyAsync(token, { 
            secret: this.configService.get('NESTJS_JWT_SECRET') 
          })
          return isValid && isWhiteListed
        } catch (error) {
          console.log({error})
          return false
        }
    }
    return false
  }
}