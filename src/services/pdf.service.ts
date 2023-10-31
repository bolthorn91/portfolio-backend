import { writeFileSync } from 'fs';
import puppeteer from 'puppeteer';

export const getCVPdf = async (member) => {
  const browser = await puppeteer.launch({
    headless: 'new'
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:3000/cv-generator/${member}`);

  await page.setViewport({width: 1080, height: 1024});

  await page.waitForNetworkIdle({idleTime: 3000})
  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true
  })
  await browser.close();
  return pdf

}
