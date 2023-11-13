import { headers } from './headers';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class ScrapperService {
  testUrl = 'https://www.scrapethissite.com/'
  constructor(
    private configService: ConfigService
  ){}
  async initBrowser() {
    const browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: [
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials'
      ]
    })
    return browser
  }

  async initHeaders(page: Page): Promise<Page> {
    await page.setViewport({width: 1280, height: 1024});
    await page.setExtraHTTPHeaders({
      ...headers[0]
    })
    // this.setRequestLimitations(page)
    return page;
  }

  async setRequestLimitations(page: Page) {
    await page.setRequestInterception(true); 
    page.on('request', async (request) => { 
      if (request.resourceType() == 'image') { 
        await request.abort(); 
      } else { 
        await request.continue(); 
      } 
    }); 
  }
}
