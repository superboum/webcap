'use strict'

const uuid4 = require('uuid4')
const express = require('express')
const puppeteer = require('puppeteer')
const fs = require('fs')
const app = express()

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const screenshot = async (browser, link, path, css) => {
  let page = null 
  try {
    page = await browser.newPage()
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

    console.log(`Code has been injected to ${link}`)
    // First, we wait for our CSS then we check that it has been applied
    await page.waitFor('.css-loaded')
    await page.waitForSelector('.footer', {hidden: true})

    await sleep(2000)

    console.log(`Page has been captured for ${link}`)
    await page.screenshot({path: path, fullPage: true})
  } catch (e) {
    console.error(e)
  } finally {
    if (page) await page.close()
  }
}



(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']})

  app.get(/^\/capture\/(.*)/, async (req, res) => {
    const link = req.params[0]
    console.log(`Will capture ${link}`)
    try {
      const selected_path = uuid4() + '.png'
      const css = 'https://estherbouquet.com/ODIL/main-odil.css'
      await screenshot(browser, link, selected_path, css)
      res.sendFile(selected_path, {root: process.cwd()})
      setTimeout(() =>
        fs.unlink(selected_path,
          err =>
            err ?
            console.error({err: err, link: link, path: selected_path}) :
            console.log(`Cleared ${selected_path} for ${link}`)), 120000)
    } catch(e) {
      console.error(e)
      if (!res.headersSent) res.status(500).send({error: e, link: link})
    }
  })

  app.listen(3000)
  //await browser.close()
})()

