const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'manual_assets');
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('=== CC TEAM MANUAL SCREENSHOT MASTER CAPTURE ===');
  console.log(`Target Output: ${OUTPUT_DIR}`);
  console.log(`Base URL: ${BASE_URL}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Helper to save screenshot with logging
  async function snap(filename, options = {}) {
    const dest = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: dest, type: 'png', ...options });
    const size = fs.statSync(dest).size;
    console.log(`[SAVED] ${filename} - ${(size / 1024).toFixed(1)} KB`);
    if (size < 25000 && filename !== 'shot_track_mobile.png') {
      console.warn(`[WARNING] ${filename} size is suspiciously low: ${size} bytes!`);
    }
  }

  // ----------------------------------------------------
  // 1. PUBLIC PAGES (NO AUTH)
  // ----------------------------------------------------

  // 1.1 Home Desktop
  console.log('Capturing Home Desktop...');
  await page.setViewport({ width: 1360, height: 860, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await snap('shot_home_desktop.png');

  // 1.2 About Team Modal
  console.log('Capturing About Team Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aboutBtn = btns.find(b => b.textContent && (b.textContent.includes('About Team') || b.textContent.includes('เกี่ยวกับทีม')));
    if (aboutBtn) aboutBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_about_team.png');

  // 1.3 Home Mobile (iPhone 15 Viewport)
  console.log('Capturing Home Mobile...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await snap('shot_home_mobile.png');

  // Reset to Desktop
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });

  // 1.4 Creative Brief Form - Blank
  console.log('Capturing Creative Brief Form (Blank)...');
  await page.goto(`${BASE_URL}/request?unit=creative`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_request_step1.png');

  // 1.5 Creative Brief Form - Filled with realistic demo data
  console.log('Capturing Creative Brief Form (Filled)...');
  await page.evaluate(() => {
    // Fill sample demo data
    const inputs = document.querySelectorAll('input');
    inputs.forEach(inp => {
      const placeholder = inp.getAttribute('placeholder') || '';
      const name = inp.getAttribute('name') || '';
      if (placeholder.includes('สมมุติ') || placeholder.includes('ชื่อ') || name.includes('name')) {
        inp.value = 'ดร.ชาญวิทย์ วิจัยรุ่งเรือง';
      }
      if (placeholder.includes('08') || name.includes('phone')) {
        inp.value = '089-456-7890';
      }
      if (placeholder.includes('@') || name.includes('email')) {
        inp.value = 'chanwit@step.cmu.ac.th';
      }
      if (placeholder.includes('ชื่องาน') || name.includes('title')) {
        inp.value = 'ออกแบบแบรนด์และบรรจุภัณฑ์สเปรย์สมุนไพรลดภูมิแพ้ (HerbaPure 2026)';
      }
      if (placeholder.includes('drive') || name.includes('link')) {
        inp.value = 'https://drive.google.com/drive/folders/1HerbaPure-Assets-2026';
      }
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await new Promise(r => setTimeout(r, 800));
  await snap('shot_request_step2.png');

  // 1.6 Content Creator Brief Form
  console.log('Capturing Content Brief Form...');
  await page.goto(`${BASE_URL}/request?unit=content`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_request_content.png');

  // 1.7 PR Brief Form
  console.log('Capturing PR Brief Form...');
  await page.goto(`${BASE_URL}/request?unit=pr`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_request_pr.png');

  // 1.8 IDC Form (Innovation Design Center Form)
  console.log('Capturing IDC Form...');
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/idc-form`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_idc_details.png');

  // 1.9 RSP Press Form
  console.log('Capturing RSP Press Form...');
  await page.goto(`${BASE_URL}/rsp-press-form`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_rsp_details.png');

  // 1.10 Track Status Desktop
  console.log('Capturing Track Status Desktop...');
  await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_track_search.png');

  // 1.11 Track Status Mobile
  console.log('Capturing Track Status Mobile...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_track_mobile.png');

  // Reset to Desktop
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });

  // 1.12 Satisfaction Survey
  console.log('Capturing Satisfaction Survey...');
  await page.goto(`${BASE_URL}/survey`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_survey_rating.png');

  // 1.13 Login Page (Strict Whitelist UI)
  console.log('Capturing Login Page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_login_screen.png');

  // ----------------------------------------------------
  // 2. AUTHENTICATED DASHBOARD (ADMIN SESSION INJECTED)
  // ----------------------------------------------------
  console.log('Injecting permanent Admin session into new document...');
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });

  // 2.1 Control Center Dashboard Home
  console.log('Capturing Control Center Dashboard Home...');
  await page.setViewport({ width: 1360, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('shot_control_center.png');

  // 2.2 Tasks Board
  console.log('Capturing Tasks Board...');
  await page.setViewport({ width: 1360, height: 950, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=assignments`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await snap('shot_tasks_board.png');

  // 2.3 Internal Task Modal
  console.log('Capturing Internal Task Modal...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const itBtn = btns.find(b => b.textContent && b.textContent.includes('Internal Task'));
    if (itBtn) itBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_internal_task.png');

  // 2.4 Back of House Reports Full Overview (8 Modules Grid)
  console.log('Capturing Back of House Full Overview (8 Modules)...');
  await page.setViewport({ width: 1360, height: 1020, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('shot_dashboard_reports_full.png');

  // Helper for sub-reports
  async function captureSubReport(repId, filename, height = 980) {
    console.log(`Capturing Sub-report: ${repId} -> ${filename}...`);
    await page.setViewport({ width: 1360, height: height, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/dashboard?view=data-reports&report=${repId}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2200));
    await snap(filename);
  }

  // 2.5 BOH Sub-Reports
  await captureSubReport('meeting', 'shot_boh_meeting.png');
  await captureSubReport('design-center', 'shot_boh_idc.png');
  await captureSubReport('rsp-press', 'shot_boh_rsp.png');
  await captureSubReport('iso', 'shot_boh_iso.png');
  await captureSubReport('km', 'shot_boh_km.png');
  await captureSubReport('action-plan', 'shot_boh_tap.png');
  await captureSubReport('work-links', 'shot_boh_links.png');
  await captureSubReport('activity', 'shot_boh_activity.png');

  // 2.6 Insights View (All 5 Tabs)
  console.log('Capturing Insights Tabs...');
  await page.setViewport({ width: 1360, height: 1050, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard?view=dashboards`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  async function clickInsightTab(tabText, filename) {
    console.log(`Switching Insights Tab: ${tabText}...`);
    await page.evaluate((text) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent && btn.textContent.includes(text));
      if (b) b.click();
    }, tabText);
    await new Promise(r => setTimeout(r, 2200));
    await snap(filename);
  }

  // Tab 1: จำนวนงาน / มูลค่า
  await clickInsightTab('จำนวนงาน / มูลค่า', 'shot_insight_tab1_workloads.png');

  // Tab 2: KR/R และ KPI/TIP
  await clickInsightTab('KR/R', 'shot_insight_tab2_goals.png');

  // Tab 3: เวลา / ประสิทธิภาพ
  await clickInsightTab('เวลา / สถานะงาน', 'shot_insight_tab3_time.png');

  // Tab 4: รายงานสรุปผลงานรายบุคคล 360
  await clickInsightTab('รายงานรายบุคคล', 'shot_insight_tab4_individual.png');

  // Tab 5: รายงานภาพรวมทีมและผู้บริหาร
  await clickInsightTab('รายงานรวมทีม', 'shot_insight_tab5_executive.png');

  // 2.7 Admin Setup Modals
  console.log('Capturing Admin Setup Modals...');
  await page.setViewport({ width: 1360, height: 950, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Open Settings Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cog = btns.find(b => b.title && b.title.includes('Setup'));
    if (cog) cog.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await snap('shot_setup_team.png');

  // Setup Tab 2: Pricing
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const tab = tabs.find(t => t.textContent && (t.textContent.includes('Pricing') || t.textContent.includes('ราคา')));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await snap('shot_setup_pricing.png');

  // Setup Tab 3: OKR
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const tab = tabs.find(t => t.textContent && (t.textContent.includes('OKR') || t.textContent.includes('เป้าหมาย')));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await snap('shot_setup_okr.png');

  // Setup Tab 4: Storage
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const tab = tabs.find(t => t.textContent && (t.textContent.includes('Storage') || t.textContent.includes('พื้นที่')));
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await snap('shot_setup_storage.png');

  await browser.close();
  console.log('=== ALL 34 MANUAL SCREENSHOTS CAPTURED & SAVED SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
