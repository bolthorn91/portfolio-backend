import { Body, Controller, Get, HttpStatus, Post, Res, } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from '../mail/mail.service';
import { ISendMailInputDTO } from 'src/types/dtos';
import { Response } from 'express';

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
    @Body() mailDto: ISendMailInputDTO,
    @Res() res: Response
  ): void {
    this.mailService.sendContactMail(mailDto)
    res.status(HttpStatus.CREATED).send('email sent correctly');
  }
}
