import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'fs';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  constructor(
    private configService: ConfigService
  ){}
  getCVPdf = async (member) => {
    const browser = await puppeteer.launch({
      headless: 'new'
    });
    const page = await browser.newPage();
  
    const frontUrl = this.configService.get('FRONT_URL')
    const cvPage = this.configService.get('FRONT_CV_PAGE')
  
    await page.goto(`${frontUrl}/${cvPage}/${member}`);
  
    await page.setViewport({width: 1080, height: 1024});
  
    await page.waitForNetworkIdle({idleTime: 3000})
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true
    })
    await browser.close();
    return pdf
  
  }
}
