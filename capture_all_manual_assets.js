const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'manual_assets');
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Starting comprehensive screenshot capture for Manual...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1360, height: 960, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Setup Admin Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });

  // ==========================================
  // 1. INSIGHTS (ALL 5 TABS - FULL VIEW)
  // ==========================================
  console.log('Navigating to Insights view...');
  await page.setViewport({ width: 1360, height: 1050, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=dashboards`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => !document.body.innerText.includes('กำลังคำนวณสถิติ'), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // Helper to click tab
  async function clickTab(text) {
    await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent && btn.textContent.includes(t));
      if (b) b.click();
    }, text);
    await new Promise(r => setTimeout(r, 2000));
  }

  // Tab 1: จำนวนงาน / มูลค่า
  console.log('Capturing Insights Tab 1: Workloads...');
  await clickTab('จำนวนงาน / มูลค่า');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_insight_tab1_workloads.png'), type: 'png' });

  // Tab 2: KR/R , KPI/TIP
  console.log('Capturing Insights Tab 2: Goals & OKRs...');
  await clickTab('KR/R');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_insight_tab2_goals.png'), type: 'png' });

  // Tab 3: เวลา / สถานะงาน
  console.log('Capturing Insights Tab 3: Time & Efficiency...');
  await clickTab('เวลา / สถานะงาน');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_insight_tab3_time.png'), type: 'png' });

  // Tab 4: รายงานรายบุคคล 360 (Select จ๊อบ AA with Save Cost ฿881,500)
  console.log('Capturing Insights Tab 4: Individual 360 (จ๊อบ AA - Top Save Cost)...');
  await clickTab('รายงานรายบุคคล');
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const memberSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('(')));
    if (memberSelect) {
      // Select จ๊อบ AA (highest save cost ฿881,500)
      const jobOpt = Array.from(memberSelect.options).find(o => o.text.includes('จ๊อบ'));
      if (jobOpt) {
        memberSelect.value = jobOpt.value;
        memberSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_insight_tab4_individual.png'), type: 'png' });

  // Tab 5: รายงานรวมทีม
  console.log('Capturing Insights Tab 5: Executive Synthesis...');
  await clickTab('รายงานรวมทีม');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_insight_tab5_executive.png'), type: 'png' });

  // ==========================================
  // 2. BACK OF HOUSE (OVERVIEW + ALL 8 REPORTS)
  // ==========================================
  console.log('Capturing Back of House Overview...');
  await page.setViewport({ width: 1360, height: 1020, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shot_dashboard_reports_full.png'), type: 'png' });

  // Helper for sub-reports
  async function captureSubReport(repId, filename, waitMs = 2500, height = 980) {
    console.log(`Capturing Back of House sub-report: ${repId} -> ${filename}...`);
    await page.setViewport({ width: 1360, height: height, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/dashboard?view=data-reports&report=${repId}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, waitMs));
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename), type: 'png' });
    console.log(`Saved: ${filename}`);
  }

  // 1. Meeting Report
  await captureSubReport('meeting', 'shot_boh_meeting.png');

  // 2. Innovation Design Center (IDC) Report
  await captureSubReport('design-center', 'shot_boh_idc.png');

  // 3. RSP Press Report
  await captureSubReport('rsp-press', 'shot_boh_rsp.png');

  // 4. ISO Report
  await captureSubReport('iso', 'shot_boh_iso.png');

  // 5. KM คลังความรู้
  await captureSubReport('km', 'shot_boh_km.png');

  // 6. แผนดำเนินงานของทีม (Team Action Plan)
  await captureSubReport('action-plan', 'shot_boh_tap.png');

  // 7. ลิ้งค์อื่นๆ ที่เกี่ยวข้อง (Work Links)
  await captureSubReport('work-links', 'shot_boh_links.png');

  // 8. Activity Log
  await captureSubReport('activity', 'shot_boh_activity.png');

  await browser.close();
  console.log('All manual screenshots captured successfully!');
}

run().catch(err => {
  console.error('Capture script error:', err);
  process.exit(1);
});
