import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISendMailInputDTO } from 'src/types/dtos';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(from?: string): Promise<boolean> {
    try {
      const response = await this.mailerService.sendMail({
        from: from ? `<${from}>` : `<${this.configService.get('MAIL_TO')}>`,
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

  async sendContactMail({name, from, subject, message}: ISendMailInputDTO): Promise<boolean> {
    try {
      const response = await this.mailerService.sendMail({
        from: from ? `<${from}>` : `<${this.configService.get('MAIL_TO')}>`,
        subject: subject || 'Contact form without subject',
        template: './contact',
        context: {
          name: name || 'No name specified',
          message: message || 'No message specified'
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
