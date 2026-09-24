const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 1100, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
  });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Internal Task button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Internal Task'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Open Category dropdown
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const trigger = divs.find(d => d.textContent && d.textContent.includes('เลือกประเภทงาน'));
    if (trigger) trigger.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click the option that includes 'PM โครงการของ CC'
  const clicked = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    // Find leaf-ish elements with PM โครงการของ CC
    const opt = divs.find(d => d.className && d.className.includes('cursor-pointer') && d.textContent && d.textContent.includes('PM โครงการของ CC'));
    if (opt) {
      opt.click();
      return true;
    }
    return false;
  });
  console.log('PM option clicked:', clicked);
  await new Promise(r => setTimeout(r, 800));

  // Scroll modal
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div'));
    const modalBody = scrollables.find(d => d.className && d.className.includes('overflow-y-auto'));
    if (modalBody) modalBody.scrollTop = 480;
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(__dirname, 'public', 'manual_assets', 'shot_sector_type_balanced.png') });
  await browser.close();
  console.log('Saved shot_sector_type_balanced.png successfully!');
})();
