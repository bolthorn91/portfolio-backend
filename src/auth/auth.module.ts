import { JwtService as NestJwtService} from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtService } from 'src/services/jwt.service';

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [AuthController],
    providers: [JwtService, NestJwtService, ConfigService],
    exports: [JwtService]
})
export class AuthModule {}