import { writeFileSync } from 'fs';
import puppeteer from 'puppeteer';

export const getCVPdf = async () => {
  const browser = await puppeteer.launch({
    headless: 'new'
  });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/cv-generator');

  await page.setViewport({width: 1080, height: 1024});

  await page.waitForNetworkIdle({idleTime: 10000})
  const pdf = await page.pdf()
  await browser.close();
  return pdf

}
