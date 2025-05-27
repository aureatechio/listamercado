const puppeteer = require('puppeteer');

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

module.exports = { launchBrowser };
