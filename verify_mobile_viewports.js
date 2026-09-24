const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'manual_assets', 'mobile_tests');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const TEST_DEVICES = [
  { name: 'iPhone_SE', width: 375, height: 667, isMobile: true },
  { name: 'iPhone_15_Pro', width: 393, height: 852, isMobile: true },
  { name: 'Samsung_S24_Xiaomi', width: 360, height: 800, isMobile: true },
  { name: 'Oppo_Nothing_Redmi', width: 412, height: 915, isMobile: true },
  { name: 'Mobile_Landscape', width: 852, height: 393, isMobile: true }
];

async function runTests() {
  console.log('Launching Edge for mobile multi-device verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Test 1: Live production deployment
  const TARGET_URL = 'https://ccteam.vercel.app';
  console.log(`Testing Target URL: ${TARGET_URL}`);

  for (const dev of TEST_DEVICES) {
    await page.setViewport({
      width: dev.width,
      height: dev.height,
      isMobile: dev.isMobile,
      hasTouch: true,
      deviceScaleFactor: 2
    });

    console.log(`Capturing Home on ${dev.name} (${dev.width}x${dev.height})...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log(e.message));
    await new Promise(r => setTimeout(r, 1500));

    // Check if horizontal scrollbar / overflow exists
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log(`-> ${dev.name} Horizontal Overflow: ${hasHorizontalOverflow ? 'YES (OVERFLOW!)' : 'NO (PERFECT FIT)'}`);

    const shotPath = path.join(OUTPUT_DIR, `${dev.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  // Test 2: Test Manual on Mobile (iPhone 15 Pro viewport)
  await page.setViewport({ width: 393, height: 852, isMobile: true, deviceScaleFactor: 2 });
  const manualFile = 'file:///' + path.join(__dirname, 'public', 'manual.html').replace(/\\/g, '/');
  console.log('Testing manual.html on Mobile...');
  await page.goto(manualFile, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const manualOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`-> manual.html Mobile Overflow: ${manualOverflow ? 'YES (OVERFLOW!)' : 'NO (PERFECT FIT)'}`);

  const manualShot = path.join(OUTPUT_DIR, 'manual_mobile_view.png');
  await page.screenshot({ path: manualShot, fullPage: false });

  // Scroll to section 9 in manual
  await page.evaluate(() => {
    const el = document.getElementById('sec-linebot');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 800));
  const sec9Shot = path.join(OUTPUT_DIR, 'manual_mobile_sec9.png');
  await page.screenshot({ path: sec9Shot, fullPage: false });
  console.log(`Saved section 9 screenshot: ${sec9Shot}`);

  await browser.close();
  console.log('Mobile multi-device verification finished successfully!');
}

runTests().catch(err => {
  console.error('Error during mobile tests:', err);
});
