const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'manual_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Edge for high-res screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Helper function to capture
  async function snap(url, filename, setupFn = null, waitMs = 1500) {
    console.log(`Navigating to ${url} -> ${filename}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    if (setupFn) {
      await page.evaluate(setupFn);
      await new Promise(r => setTimeout(r, 800));
    }
    await new Promise(r => setTimeout(r, waitMs));
    const dest = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: dest, type: 'png' });
    console.log(`Saved: ${dest}`);
  }

  // 1. Home
  await snap('https://ccteam.vercel.app/', 'shot_home.png');

  // 2. Creative Request Form
  await snap('https://ccteam.vercel.app/request?unit=creative', 'shot_request_creative.png');

  // 3. Content Request Form
  await snap('https://ccteam.vercel.app/request?unit=content', 'shot_request_content.png');

  // 4. PR Request Form
  await snap('https://ccteam.vercel.app/request?unit=pr', 'shot_request_pr.png');

  // 5. Track Status
  await snap('https://ccteam.vercel.app/track', 'shot_track.png');

  // 6. IDC Form
  await snap('https://ccteam.vercel.app/idc-form', 'shot_idc.png');

  // 7. RSP Press Form
  await snap('https://ccteam.vercel.app/rsp-press-form', 'shot_rsp.png');

  // 8. Survey
  await snap('https://ccteam.vercel.app/survey', 'shot_survey.png');

  // 9. Login
  await snap('https://ccteam.vercel.app/login', 'shot_login.png');

  // 10. Dashboard (Inject Admin session into localStorage)
  await page.goto('https://ccteam.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });

  // 11. Dashboard Home (Control Center)
  await snap('https://ccteam.vercel.app/dashboard', 'shot_dashboard_home.png');

  // 12. Dashboard Tasks View
  await snap('https://ccteam.vercel.app/dashboard?view=assignments', 'shot_dashboard_tasks.png', null, 2500);

  // 13. Dashboard Insights View
  await snap('https://ccteam.vercel.app/dashboard?view=dashboards', 'shot_dashboard_insights.png', null, 2500);

  // 14. Dashboard Data Reports View
  await snap('https://ccteam.vercel.app/dashboard?view=data-reports', 'shot_dashboard_reports.png', null, 2500);

  // 15. Dashboard Setup Modal
  await page.goto('https://ccteam.vercel.app/dashboard', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    // Click settings button if present
    const btns = Array.from(document.querySelectorAll('button'));
    const cog = btns.find(b => b.title && b.title.includes('Setup'));
    if (cog) cog.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_dashboard_setup.png'), type: 'png' });
  console.log('Saved: shot_dashboard_setup.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
