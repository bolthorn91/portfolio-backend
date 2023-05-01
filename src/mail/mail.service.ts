import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(from?: string): Promise<boolean> {
    try {
      const response = await this.mailerService.sendMail({
        from: from || `"No Reply" <${this.configService.get('MAIL_TO')}>`,
        subject: 'Contact from web',
        template: './confirmation',
        context: {
          name: 'Test',
          url: 'http://localhost:3000',
        },
      });
      if (response) {
        return true
      };
    } catch (error) {
      console.log({error});
      return false
    }
    return false
  }
}
