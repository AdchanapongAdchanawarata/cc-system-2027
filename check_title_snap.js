const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HTML_PATH = path.join(__dirname, 'public', 'manual.html');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + HTML_PATH.split(path.sep).join('/');
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(__dirname, 'public', 'manual_assets', 'shot_title_check.png') });
  await browser.close();
  console.log('Title screenshot captured: shot_title_check.png');
})();
