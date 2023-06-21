import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISendMailInputDTO } from 'src/types/dtos';
import { MailService as SendgridService  } from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(from?: string): Promise<boolean> {
    try {
      const response = await this.mailerService.sendMail({
        to: this.configService.get('MAIL_TO'),
        from: this.configService.get('MAIL_TO'),
        subject: 'Contact from web',
        template: './confirmation',
        context: {
          name: 'Test',
          url: 'http://localhost:3000',
          from
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
      const email  = {
        from: this.configService.get('MAIL_USER'),
        subject: subject || 'Contact form without subject',
        personalizations:[
          {
             to:[
                {
                   email: this.configService.get('MAIL_TO')
                }
             ],
             dynamic_template_data:{
                subject: subject || 'Contact form without subject',
                name: name || 'No name specified',
                message: message || 'No message specified',
                from,
              }
          }
        ],
        template_id: this.configService.get('MAIL_SENDGRID_TEMPLATE1')
      }
      const sendgridService = new SendgridService();
      sendgridService.setApiKey(this.configService.get('MAIL_SENDGRID_API_KEY'));
      const response = await sendgridService.send(email as any);
      console.log('%j', {response: (response as any).body})
      if (response) {
        return true
      };
    } catch (error) {
      console.log({error})
      return false
    }
    return false
  }
}
