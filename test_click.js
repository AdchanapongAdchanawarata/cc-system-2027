const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 1100, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
  });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Internal Task
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Internal Task'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Find placeholder span and click
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const target = spans.find(s => s.textContent && s.textContent.trim() === 'เลือกประเภทงาน...');
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Type PM in search
  await page.type('input[placeholder*="ค้นหาประเภทงาน"]', 'PM');
  await new Promise(r => setTimeout(r, 600));

  // Click the option
  await page.click('div[class*="px-4 py-3 cursor-pointer"]');
  await new Promise(r => setTimeout(r, 1000));

  // Scroll down modal
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div'));
    const modalBody = scrollables.find(d => d.className && d.className.includes('overflow-y-auto'));
    if (modalBody) modalBody.scrollTop = 500;
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'public/manual_assets/shot_sector_type_balanced.png' });
  console.log('Saved shot_sector_type_balanced.png');
  await browser.close();
})();
