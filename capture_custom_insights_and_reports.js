const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'manual_assets');
const BASE_URL = 'http://localhost:3000';

async function capture() {
  console.log('Launching Edge to capture Back of House full height and all 5 Insights tabs...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 1050, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Inject session
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });

  // 1. Back of House (Full Height so all 8 circles are completely visible)
  console.log('Capturing Back of House full view...');
  await page.setViewport({ width: 1280, height: 1020, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'shot_dashboard_reports_full.png'), 
    type: 'png' 
  });
  console.log('Saved: shot_dashboard_reports_full.png');

  // Also replace shot_dashboard_reports.png with this full height one
  fs.copyFileSync(
    path.join(OUTPUT_DIR, 'shot_dashboard_reports_full.png'),
    path.join(OUTPUT_DIR, 'shot_dashboard_reports.png')
  );

  // Navigate to Dashboards / Insights
  console.log('Navigating to Insights view...');
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=dashboards`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Helper to click tab and screenshot
  async function snapInsightTab(tabText, filename) {
    console.log(`Switching to tab: ${tabText}...`);
    await page.evaluate((text) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tabBtn = btns.find(b => b.textContent && b.textContent.includes(text));
      if (tabBtn) tabBtn.click();
    }, tabText);
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename), type: 'png' });
    console.log(`Saved: ${filename}`);
  }

  // 1. Tab 1: workloads ("จำนวนงาน / มูลค่า")
  await snapInsightTab('จำนวนงาน / มูลค่า', 'shot_insight_tab1_workloads.png');

  // 2. Tab 2: goals ("KR/R , KPI/TIP")
  await snapInsightTab('KR/R', 'shot_insight_tab2_goals.png');

  // 3. Tab 3: time_efficiency ("เวลา / สถานะงาน")
  await snapInsightTab('เวลา / สถานะงาน', 'shot_insight_tab3_time.png');

  // 4. Tab 4: individual_360 ("รายงานรายบุคคล")
  await snapInsightTab('รายงานรายบุคคล', 'shot_insight_tab4_individual.png');

  // 5. Tab 5: executive_report ("รายงานรวมทีม")
  await snapInsightTab('รายงานรวมทีม', 'shot_insight_tab5_executive.png');

  await browser.close();
  console.log('All custom captures completed successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
