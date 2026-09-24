const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HTML_PATH = path.join(__dirname, 'public', 'manual.html');
const PDF_PATH = path.join(__dirname, 'public', 'manual.pdf');
const ARTIFACT_DIR = 'C:\\Users\\aaadc\\.gemini\\antigravity\\brain\\70a4b885-1b25-475d-9274-c0f5a3dfd5ef';

async function generate() {
  console.log('Generating updated PDF from manual.html...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  console.log('Loading:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm'
    }
  });
  console.log('Generated:', PDF_PATH);

  // Copy to Artifact directory
  fs.copyFileSync(HTML_PATH, path.join(ARTIFACT_DIR, 'manual.html'));
  fs.copyFileSync(PDF_PATH, path.join(ARTIFACT_DIR, 'manual.pdf'));
  console.log('Copied to brain artifacts directory successfully!');

  await browser.close();
}

generate().catch(err => {
  console.error('PDF generation error:', err);
  process.exit(1);
});
