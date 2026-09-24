const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'manual_assets');
const BASE_URL = 'http://localhost:3000';

async function verify() {
  console.log('Launching Edge to verify all 4 user fixes...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Home page check
  console.log('1. Checking Home page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_home_verified.png') });

  // Inject session
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });

  // 2. Control Center check (with back button)
  console.log('2. Checking Control Center page...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_control_verified.png') });

  // 3. Open Internal Task modal & test Sector Type buttons
  console.log('3. Opening Internal Task modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const internalBtn = btns.find(b => b.textContent && b.textContent.includes('Internal Task'));
    if (internalBtn) internalBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Select "PM โครงการของ CC" in category dropdown to reveal financial & sector type box
  await page.evaluate(() => {
    // Look for ModernSelect or category triggers
    const selectTrigger = document.querySelector('button[aria-haspopup="listbox"]');
    // or set category directly if select component exists
    const btns = Array.from(document.querySelectorAll('button'));
    const pmOption = btns.find(b => b.textContent && b.textContent.includes('PM โครงการของ CC'));
    if (pmOption) {
      pmOption.click();
    }
  });

  // Take screenshot of Internal Task modal
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_internal_modal_verified.png') });

  console.log('Screenshots saved successfully!');
  await browser.close();
}

verify().catch(console.error);
