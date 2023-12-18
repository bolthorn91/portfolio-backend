import { JwtService as NestJwtService } from '@nestjs/jwt';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from '../mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CVModule } from '../cv/cv.module';
import { GoogleAuthModule } from 'src/auth/google-auth.module';
import * as session from 'express-session';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from 'src/services/jwt.service';

@Module({
  imports: [
    MailModule,
    CVModule,
    GoogleAuthModule,
    AuthModule,
    ConfigModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService, JwtService, NestJwtService],
})
export class AppModule {
  constructor(
    private configService: ConfigService
  ) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(session({
        secret: this.configService.get('SESSION_KEY'),
        resave: false,
        saveUninitialized: false,
        cookie:  {
          httpOnly: true,
          maxAge: 8600000
       },
      }))
      .forRoutes('*');
  }
}
