const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'manual_assets');
const BASE_URL = 'http://localhost:3000';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting comprehensive screenshot capture for CC TEAM Manual...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 820, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Helper to save screenshot
  async function saveScreenshot(filename, clipOrFull = false) {
    const dest = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: dest, type: 'png', fullPage: clipOrFull });
    console.log(`[OK] Saved ${filename}`);
  }

  // 1. Home Desktop
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_home_desktop.png');

  // 2. About Team Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aboutBtn = btns.find(b => b.textContent && b.textContent.includes('เกี่ยวกับทีม') || b.textContent.includes('About'));
    if (aboutBtn) aboutBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_about_team.png');

  // 3. Home Mobile (iPhone 15 viewport)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_home_mobile.png');

  // Switch back to desktop viewport
  await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });

  // 4. Creative Form - Overview
  await page.goto(`${BASE_URL}/request?unit=creative`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_request_step1.png');

  // 5. Creative Form - Fill with sample data
  await page.evaluate(() => {
    const nameInput = document.querySelector('input[name="requester_name"]');
    if (nameInput) nameInput.value = 'ดร.สมชาย นวัตกรรม';
    const phoneInput = document.querySelector('input[name="requester_phone"]');
    if (phoneInput) phoneInput.value = '081-234-5678';
    const emailInput = document.querySelector('input[name="requester_email"]');
    if (emailInput) emailInput.value = 'somchai@step.cmu.ac.th';
    const titleInput = document.querySelector('input[name="project_title"]');
    if (titleInput) titleInput.value = 'ออกแบบโปสเตอร์และสูจิบัตรงานเปิดตัวนวัตกรรมอาหารแห่งอนาคต (FoodFab 2026)';
    const driveInput = document.querySelector('input[name="gdrive_link"]');
    if (driveInput) driveInput.value = 'https://drive.google.com/drive/folders/1ABCxyz-demo-foodfab-assets';
  });
  await new Promise(r => setTimeout(r, 400));
  await saveScreenshot('shot_request_step2.png');

  // 6. Content Form
  await page.goto(`${BASE_URL}/request?unit=content`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_content_form.png');

  // 7. PR Form
  await page.goto(`${BASE_URL}/request?unit=pr`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_pr_form.png');

  // 8. Track Status Page (Empty search)
  await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_track_search.png');

  // 9. Track Mobile
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_track_mobile.png');

  // Back to Desktop
  await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });

  // 10. IDC Form
  await page.goto(`${BASE_URL}/idc-form`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_idc_details.png');

  // 11. RSP Press Form
  await page.goto(`${BASE_URL}/rsp-press-form`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_rsp_details.png');

  // 12. Survey Form
  await page.goto(`${BASE_URL}/survey`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_survey_rating.png');

  // 13. Login Page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('shot_login_screen.png');

  // Set Auth Session for Dashboard
  await page.evaluate(() => {
    localStorage.setItem('cc_user_email', 'adchanapong@step.cmu.ac.th');
    localStorage.setItem('cc_user_role', 'admin');
    localStorage.setItem('cc_user_name', 'จ๊อบ AA');
    localStorage.setItem('cc_user_fullname', 'นายอัจชนะพงษ์ อัจชนะวราทา');
  });

  // 14. Control Center Dashboard Home
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot('shot_control_center.png');

  // 15. Tasks View
  await page.goto(`${BASE_URL}/dashboard?view=assignments`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('shot_tasks_board.png');

  // 16. Internal Task Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const itBtn = btns.find(b => b.textContent && b.textContent.includes('Internal Task'));
    if (itBtn) itBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot('shot_internal_task.png');

  // 17. Insights View
  await page.goto(`${BASE_URL}/dashboard?view=dashboards`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await saveScreenshot('shot_insights_graphs.png');

  // 18. Data Reports Hub
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('shot_reports_hub.png');

  // 19. ISO Report Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const isoBtn = btns.find(b => b.textContent && b.textContent.includes('ISO') || b.textContent.includes('คุณภาพ'));
    if (isoBtn) isoBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('shot_iso_report.png');

  // 20. Weekly Meeting Report Modal
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const meetBtn = btns.find(b => b.textContent && b.textContent.includes('Meeting') || b.textContent.includes('ประชุม'));
    if (meetBtn) meetBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('shot_meeting_report.png');

  // 21. KM Report Modal
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const kmBtn = btns.find(b => b.textContent && b.textContent.includes('KM') || b.textContent.includes('จัดการความรู้'));
    if (kmBtn) kmBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('shot_km_report.png');

  // 22. Team Action Plan Modal
  await page.goto(`${BASE_URL}/dashboard?view=data-reports`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tapBtn = btns.find(b => b.textContent && b.textContent.includes('Action Plan') || b.textContent.includes('แผนปฏิบัติ'));
    if (tapBtn) tapBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('shot_tap_report.png');

  // 23. Admin Setup Modal - Tab 1: Manage Team
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cog = btns.find(b => b.title && b.title.includes('Setup'));
    if (cog) cog.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('shot_setup_team.png');

  // 24. Admin Setup Modal - Tab 2: Pricing
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const pricingTab = tabs.find(t => t.textContent && t.textContent.includes('Pricing') || t.textContent.includes('ราคา'));
    if (pricingTab) pricingTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot('shot_setup_pricing.png');

  // 25. Admin Setup Modal - Tab 3: OKR
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const okrTab = tabs.find(t => t.textContent && t.textContent.includes('OKR') || t.textContent.includes('เป้าหมาย'));
    if (okrTab) okrTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot('shot_setup_okr.png');

  // 26. Admin Setup Modal - Tab 4: Storage
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const storageTab = tabs.find(t => t.textContent && t.textContent.includes('Storage') || t.textContent.includes('พื้นที่'));
    if (storageTab) storageTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot('shot_setup_storage.png');

  await browser.close();
  console.log('Finished capturing all comprehensive screenshots successfully!');
}

run().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
