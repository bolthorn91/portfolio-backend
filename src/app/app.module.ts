import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from '../mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { CVModule } from '../cv/cv.module';

@Module({
  imports: [
    MailModule,
    CVModule,
    ConfigModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
