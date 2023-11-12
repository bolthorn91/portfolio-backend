import { Controller, Get, Param, Res, } from '@nestjs/common';
import { Response } from 'express';
import { CVService } from './cv.service';

@Controller('cv')
export class CVController {
  constructor(
    private readonly cvService: CVService
  ) {}

  @Get(':id')
  async sendCVPdf(
    @Res() res: Response,
    @Param('id') id: string
  ): Promise<void> {
    const pdf = await this.cvService.createPdf(id)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
    res.send(pdf)
  }
}
