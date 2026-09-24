const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1400, height: 1000 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });
  await page.goto('http://localhost:3000/dashboard?view=dashboards', { waitUntil: 'networkidle2' });
  
  await page.waitForFunction(() => !document.body.innerText.includes('กำลังคำนวณสถิติ'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click tab 4
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tabBtn = btns.find(b => b.textContent && b.textContent.includes('รายงานรายบุคคล'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const memberData = await page.evaluate(async () => {
    const selects = Array.from(document.querySelectorAll('select'));
    const select = selects.find(s => Array.from(s.options).some(o => o.text.includes('(')));
    if (!select) return { error: 'select not found' };
    
    const results = [];
    for (let opt of Array.from(select.options)) {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 600));
      
      const saveCostEl = document.querySelector('.text-2xl.font-black.font-mono.text-emerald-700') ||
                         document.querySelector('[class*="text-emerald-700"]');
      const saveCostText = saveCostEl ? saveCostEl.textContent.trim() : 'N/A';
      
      const nameEl = document.querySelector('h2.text-2xl.font-black');
      const nameText = nameEl ? nameEl.textContent.trim() : opt.text;
      
      results.push({ id: opt.value, optText: opt.text, name: nameText, saveCost: saveCostText });
    }
    return results;
  });

  console.log(JSON.stringify(memberData, null, 2));
  await browser.close();
})();
