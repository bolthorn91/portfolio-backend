import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return ({
          transport: {
            host: config.get('MAIL_SENDGRID_HOST'),
            port: parseInt(config.get('MAIL_NOSSL_PORT2')),
            secure: false,
            auth: {
              user: config.get('MAIL_SENDGRID_USER'),
              pass: config.get('MAIL_SENDGRID_API_KEY'),
            },
          },
          defaults: {
            to: config.get('MAIL_TO'),
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(undefined, {
              inlineCssEnabled: true,
              inlineCssOptions: {
                url: ' ',
                preserveMediaQueries: true,
              },
            }),
            options: {
              strict: true,
            },
          },
        })
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, ConfigService],
  exports: [MailService], //
})
export class MailModule {}
