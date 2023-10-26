import { Controller, Get, Res, } from '@nestjs/common';
import { Response } from 'express';
import { CVService } from './cv.service';

@Controller('cv')
export class CVController {
  constructor(
    private readonly cvService: CVService
  ) {}

  @Get('')
  async sendCVPdf(
    @Res() res: Response
  ): Promise<void> {
    const pdf = await this.cvService.createPdf()
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
    res.send(pdf)
  }
}
