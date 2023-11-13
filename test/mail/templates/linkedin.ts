import puppeteer from 'puppeteer';
import { ScrapperService } from 'src/services/scrapper.service';

const getLinkedinMessages = async () => {
    const scrapperService = new ScrapperService(undefined)
    const browser = await scrapperService.initBrowser();
    let page = await browser.newPage();
    page = await scrapperService.initHeaders(page); 
    await page.goto('https://www.linkedin.com/')
    const user = process.env.LINKEDIN_USER
    const password = process.env.LINKEDIN_PASSWORD
    await page.waitForFunction(() => setTimeout(() => {
    }, 3000))
    const userInput = await page.waitForSelector('#session_key')
    await userInput.type(user)
    const passwordInput = await page.waitForSelector('#session_password')
    await passwordInput.type(password)
    const button = await page.waitForSelector('button[data-id="sign-in-form__submit-btn"]')
    button.click()
}

getLinkedinMessages()