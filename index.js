'use strict'

const uuid4 = require('uuid4')
const express = require('express')
const puppeteer = require('puppeteer')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const screenshot = async (browser, link, path, css) => {
  const page = await browser.newPage()
  try {
    await page.setViewport({width: 384, height: 150})
    await page.goto(link, {waitUntil: ['load', 'domcontentloaded', 'networkidle0']})
    
    // Remove website stylesheets and style
    await page.evaluate(() =>
      [...document.querySelectorAll('link'), ...document.querySelectorAll('style')]
        .filter(e => e.parentNode)
        .forEach(e => e.parentNode.removeChild(e))) 

    // Remove website javascript
    await page.evaluate(() =>
      [...document.querySelectorAll('script')]
        .filter(e => e.parentNode)
        .forEach(e => e.parentNode.removeChild(e)))
 
    // Inject my CSS stylesheet
    await page.evaluate(css_link => { 
      const l = document
        .querySelector('head')
        .appendChild(document.createElement('link'))
      l.rel='stylesheet'
      l.type='text/css'
      l.href=css_link
      l.onload = () => l.classList.add('css-loaded')
    }, css)

    // First, we wait for our CSS then we check that it has been applied
    await page.waitFor('.css-loaded')
    await page.waitForSelector('.footer', {hidden: true})

    await sleep(2000)

    await page.screenshot({path: path, fullPage: true})
  } catch (e) {
    console.error(e)
  } finally {
    await page.close()
  }
}

(async () => {
  const browser = await puppeteer.launch({headless: false, args: ['--no-sandbox']})

  const selected_path = uuid4() + '.png'
  const css = 'https://estherbouquet.com/ODIL/main-odil.css'
  await screenshot(browser, 'https://www.lessor42.fr/a-quadrini-president-du-ceser-les-corps-intermediaires-sont-indispensables-a-la-democratie-22762.html', selected_path, css)
  await browser.close()
})()
