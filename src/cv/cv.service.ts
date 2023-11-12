import { Injectable } from '@nestjs/common';
import { PdfService } from 'src/services/pdf.service';

@Injectable()
export class CVService {
  constructor(
    private pdfService: PdfService
  ){}
  async createPdf(member: string) {
    return this.pdfService.getCVPdf(member)
  }
}
