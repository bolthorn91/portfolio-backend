import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtService {
  constructor(
    private configService: ConfigService,
    private nestJwtService: NestJwtService
  ){}
    async validateRequestToken(req: Request): Promise<boolean> {
        const bearerToken: string = req.headers['authorization'] as string;
        if (bearerToken) {
            const token = bearerToken.replace('Bearer ','');
            try {
                const isValid = await this.nestJwtService.verifyAsync(token, {
                    secret: this.configService.get('NESTJS_JWT_SECRET') 
                })
                return isValid
            } catch (error) {
                console.log({error})
                return false
            }
        }
        return false
    }

    decodeRequestToken(req: Request): any {
        const bearerToken: string = req.headers['authorization'] as string;
        if (bearerToken) {
          const token = bearerToken.replace('Bearer ',''); 
          const { user, accessToken } = this.nestJwtService.decode(token);
          if (user && accessToken) {
            return {user, googleToken: accessToken}
          }
        }
    }
}
