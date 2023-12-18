import { JwtService } from 'src/services/jwt.service';
import { Module } from '@nestjs/common';
import { GoogleAuthController } from './google-auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [GoogleAuthController],
    providers: [JwtService, NestJwtService]
})
export class GoogleAuthModule {}