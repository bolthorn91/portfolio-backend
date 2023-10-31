import { Injectable } from '@nestjs/common';
import { getCVPdf } from 'src/services/pdf.service';

@Injectable()
export class CVService {
  async createPdf() {
    return getCVPdf('juan')
  }
}
