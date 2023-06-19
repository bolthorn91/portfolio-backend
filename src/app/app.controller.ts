import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from '../mail/mail.service';
import { ISendMailInputDTO } from 'src/types/dtos';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/contact')
  sendContactMail(
    @Body() mailDto: ISendMailInputDTO
  ): void {
    this.mailService.sendContactMail(mailDto)
  }
}
