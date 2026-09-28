import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { 
  calculateAllRRows, 
  calculateAllKRRows, 
  TEAM_MEMBERS, 
  R_DEFINITIONS, 
  KR_DEFINITIONS,
  getMonthCode, 
  getWeekCode, 
  getFiscalYear,
  SheetDataRRow,
  SheetDataKRRow
} from '@/utils/googleSheetsSync';

// Initialize Supabase admin/anon client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Nodemailer Transporter Helper
function getEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  if (smtpHost && smtpUser && smtpPass) {
    return {
      transporter: nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      }),
      fromEmail: smtpUser
    };
  }
  return null;
}

// ----------------------------------------------------------------------
// Email Dispatch Helper for R & KR Sync
// ----------------------------------------------------------------------

async function sendSyncEmails(type: 'R' | 'KR', data: { rRows?: SheetDataRRow[]; krRows?: SheetDataKRRow[]; asOfDate: Date; week?: string; month: string; fy: number }) {
  const emailSender = getEmailTransporter();
  const allRecipientEmails = TEAM_MEMBERS.map(m => m.email).filter(Boolean);
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1fjfd7oPCqmfARPjf3XDy1QhcwSbQddMA2C1r0GzxjL0/edit";

  let subject = "";
  let htmlContent = "";
  let textContent = "";

  if (type === 'R' && data.rRows) {
    subject = `[CC TEAM] รายงานการนำส่งค่า R ประจำสัปดาห์ (${data.week} ${data.month} FY${data.fy}) สู่ระบบองค์กรเรียบร้อยแล้ว`;
    
    // Group rows by member
    const memberSummaryRows = TEAM_MEMBERS.map(member => {
      const memberRows = data.rRows!.filter(r => r.memberId === member.memberId);
      const rMap: Record<string, number> = {};
      memberRows.forEach(r => { rMap[r.rId] = r.value; });
      return { member, rMap };
    });

    htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181B; line-height: 1.5; background: #F4F4F5; padding: 20px; }
        .container { max-width: 780px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E4E4E7; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .header { border-bottom: 2px solid #F4F4F5; padding-bottom: 20px; margin-bottom: 24px; }
        .badge { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px; }
        h1 { margin: 0; font-size: 22px; font-weight: 800; color: #09090B; letter-spacing: -0.5px; }
        .meta { color: #71717A; font-size: 13px; margin-top: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
        th { background: #18181B; color: #FFFFFF; text-align: left; padding: 10px 8px; font-weight: 600; border-radius: 4px; }
        td { padding: 9px 8px; border-bottom: 1px solid #F4F4F5; }
        tr:nth-child(even) { background: #FAFAFA; }
        .num { text-align: right; font-family: monospace; font-weight: 600; }
        .btn { display: inline-block; background: #18181B; color: #FFFFFF !important; text-decoration: none; padding: 10px 22px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-top: 20px; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E4E4E7; font-size: 11px; color: #A1A1AA; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">ระบบนำส่งข้อมูลอัตโนมัติ • Team T18</span>
          <h1>รายงานการนำส่งค่า R ประจำสัปดาห์สู่ระบบองค์กร (STeP)</h1>
          <p class="meta">
            รอบสัปดาห์: <strong>${data.week} เดือน ${data.month} (ปีงบประมาณ ${data.fy})</strong><br>
            วันเวลานำส่ง: <strong>วันศุกร์ เวลา 17.00 น. (${data.asOfDate.toLocaleDateString('th-TH', { dateStyle: 'full' })})</strong><br>
            จำนวนข้อมูลที่นำส่ง: <strong>${data.rRows.length} รายการ (12 บุคลากร × 9 ค่า R)</strong>
          </p>
        </div>

        <p style="font-size: 13px; color: #3F3F46;">
          เรียน สมาชิกทีมสร้างสรรค์และการสื่อสาร (CC TEAM) ทุกท่าน,<br><br>
          ระบบได้ประมวลผลผลงานสะสมปัจจุบันของบุคลากรรายบุคคลทั้ง 9 ตัวแปร (T18R1 – T18R9) และนำส่งเข้าสู่ตาราง <strong>Data_R</strong> ใน Google Sheet <code>ALL_KR2026_PROD</code> ขององค์กรเรียบร้อยแล้ว โดยมีสรุปค่า R สะสมของแต่ละท่านดังนี้:
        </p>

        <table>
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อบุคลากร</th>
              <th style="text-align:right">R1 (งานใน)</th>
              <th style="text-align:right">R2 (CSATใน)</th>
              <th style="text-align:right">R3 (งานนอก)</th>
              <th style="text-align:right">R4 (CSATนอก)</th>
              <th style="text-align:right">R5 (Reach)</th>
              <th style="text-align:right">R6 (Engage)</th>
              <th style="text-align:right">R7 (กำไรรัฐ)</th>
              <th style="text-align:right">R8 (กำไรเอกชน)</th>
              <th style="text-align:right">R9 (CSATรายได้)</th>
            </tr>
          </thead>
          <tbody>
            ${memberSummaryRows.map(({ member, rMap }) => `
              <tr>
                <td><strong>${member.memberId}</strong></td>
                <td>${member.displayName}</td>
                <td class="num">${rMap['T18R1'] || 0}</td>
                <td class="num">${rMap['T18R2'] || 0}%</td>
                <td class="num">${rMap['T18R3'] || 0}</td>
                <td class="num">${rMap['T18R4'] || 0}%</td>
                <td class="num">${(rMap['T18R5'] || 0).toLocaleString()}</td>
                <td class="num">${(rMap['T18R6'] || 0).toLocaleString()}</td>
                <td class="num">฿${(rMap['T18R7'] || 0).toLocaleString()}</td>
                <td class="num">฿${(rMap['T18R8'] || 0).toLocaleString()}</td>
                <td class="num">${rMap['T18R9'] || 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${sheetUrl}" class="btn" target="_blank">เปิดดูตาราง Google Sheet (Data_R)</a>
        </div>

        <div class="footer">
          อีเมลนี้ถูกส่งโดยระบบอัตโนมัติ CC Management System • ทีมสร้างสรรค์และการสื่อสาร อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)
        </div>
      </div>
    </body>
    </html>
    `;

    textContent = `[CC TEAM] รายงานการนำส่งค่า R ประจำสัปดาห์ (${data.week} ${data.month} FY${data.fy})\n\nเรียน ทีม CC ทุกท่าน\nระบบได้นำส่งค่า R ทั้ง 9 ค่าของ 12 บุคลากร (รวม ${data.rRows.length} รายการ) เข้าสู่ Google Sheet Data_R เรียบร้อยแล้ว ณ วันศุกร์ เวลา 17.00 น.\n\nดูข้อมูลได้ที่: ${sheetUrl}`;
  } 
  
  else if (type === 'KR' && data.krRows) {
    subject = `[CC TEAM] รายงานการนำส่งค่า KR ประจำเดือน (${data.month} FY${data.fy}) สู่ระบบองค์กรเรียบร้อยแล้ว`;

    htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181B; line-height: 1.5; background: #F4F4F5; padding: 20px; }
        .container { max-width: 680px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E4E4E7; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .header { border-bottom: 2px solid #F4F4F5; padding-bottom: 20px; margin-bottom: 24px; }
        .badge { display: inline-block; background: #DCFCE7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px; }
        h1 { margin: 0; font-size: 22px; font-weight: 800; color: #09090B; letter-spacing: -0.5px; }
        .meta { color: #71717A; font-size: 13px; margin-top: 6px; }
        .card { background: #FAFAFA; border: 1px solid #E4E4E7; border-radius: 12px; padding: 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-weight: 700; font-size: 14px; color: #18181B; }
        .card-desc { font-size: 12px; color: #71717A; margin-top: 2px; }
        .card-val { font-size: 20px; font-weight: 900; font-family: monospace; color: #047857; }
        .btn { display: inline-block; background: #18181B; color: #FFFFFF !important; text-decoration: none; padding: 10px 22px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-top: 20px; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E4E4E7; font-size: 11px; color: #A1A1AA; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">ระบบนำส่งข้อมูลอัตโนมัติ • Team T18</span>
          <h1>รายงานการนำส่งค่า KR ประจำเดือนสู่ระบบองค์กร (STeP)</h1>
          <p class="meta">
            รอบเดือน: <strong>ประจำเดือน ${data.month} (ปีงบประมาณ ${data.fy})</strong><br>
            วันเวลานำส่ง: <strong>วันสุดท้ายของเดือน เวลา 17.00 น. (${data.asOfDate.toLocaleDateString('th-TH', { dateStyle: 'full' })})</strong><br>
            สถานะ: <strong>นำส่งในฐานะทีม CC TEAM ครบทั้ง 4 ตัวแปร</strong>
          </p>
        </div>

        <p style="font-size: 13px; color: #3F3F46;">
          เรียน สมาชิกทีมสร้างสรรค์และการสื่อสาร (CC TEAM) ทุกท่าน,<br><br>
          ระบบได้สรุปผลสัมฤทธิ์ตัวชี้วัดความสำเร็จของทีม (KR_ID) ทั้ง 4 ค่าสะสมปัจจุบัน และนำส่งเข้าสู่ตาราง <strong>Data_KR</strong> ใน Google Sheet <code>ALL_KR2026_PROD</code> ขององค์กรเรียบร้อยแล้ว รายละเอียดดังนี้:
        </p>

        <div style="margin: 24px 0;">
          ${data.krRows.map(r => {
            const def = KR_DEFINITIONS.find(k => k.krId === r.krId);
            const isMoney = def?.unit === "บาท";
            const valDisplay = isMoney ? `฿${r.value.toLocaleString()}` : `${r.value.toLocaleString()} ${def?.unit || ''}`;
            return `
              <div class="card">
                <div>
                  <div class="card-title">${r.krId}: ${def?.name || ''}</div>
                  <div class="card-desc">เป้าหมายประจำปี: ${def?.target.toLocaleString()} ${def?.unit} • ${r.reference}</div>
                </div>
                <div class="card-val">${valDisplay}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${sheetUrl}" class="btn" target="_blank">เปิดดูตาราง Google Sheet (Data_KR)</a>
        </div>

        <div class="footer">
          อีเมลนี้ถูกส่งโดยระบบอัตโนมัติ CC Management System • ทีมสร้างสรรค์และการสื่อสาร อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)
        </div>
      </div>
    </body>
    </html>
    `;

    textContent = `[CC TEAM] รายงานการนำส่งค่า KR ประจำเดือน (${data.month} FY${data.fy})\n\nเรียน ทีม CC ทุกท่าน\nระบบได้นำส่งค่า KR ทั้ง 4 ค่าของทีมเข้าสู่ Google Sheet Data_KR เรียบร้อยแล้ว ณ วันสุดท้ายของเดือน เวลา 17.00 น.\n\nดูข้อมูลได้ที่: ${sheetUrl}`;
  }

  // Live Send if SMTP is active
  let emailResult: { sent: boolean; recipients: string[]; messageId?: string; error?: string } = {
    sent: false,
    recipients: allRecipientEmails
  };

  if (emailSender && allRecipientEmails.length > 0) {
    try {
      const info = await emailSender.transporter.sendMail({
        from: `"CC Quality & Reporting System" <${emailSender.fromEmail}>`,
        to: allRecipientEmails.join(', '),
        subject,
        text: textContent,
        html: htmlContent
      });
      emailResult.sent = true;
      emailResult.messageId = info.messageId;
      console.log(`[GOOGLE SHEETS SYNC EMAIL DISPATCHED] Type: ${type}, MessageId: ${info.messageId} to ${allRecipientEmails.length} recipients`);
    } catch (err: any) {
      console.error(`[GOOGLE SHEETS SYNC EMAIL ERROR]`, err);
      emailResult.error = err.message;
    }
  } else {
    console.log(`[GOOGLE SHEETS SYNC EMAIL SIMULATED] (${type}) Recipient list:`, allRecipientEmails);
  }

  return emailResult;
}

// ----------------------------------------------------------------------
// Push to Google Apps Script Webhook
// ----------------------------------------------------------------------

const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwgKuPmRorTPJH25vw8pmTCyJudJW3O7kq_5kp3Sa9tjYqHtK2pBDa-K4Fnj8OQZWrt5Q/exec";

async function pushToGoogleSheetWebhook(payload: { type: 'Data_R' | 'Data_KR'; rows: any[] }) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  if (!webhookUrl) {
    return { pushed: false, message: "No GOOGLE_SHEETS_WEBHOOK_URL configured" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch { json = { text }; }
    return { pushed: true, response: json };
  } catch (err: any) {
    console.error(`[GOOGLE SHEETS WEBHOOK POST ERROR]`, err);
    return { pushed: false, error: err.message };
  }
}

// ----------------------------------------------------------------------
// Main Handler: GET (Preview & Health) / POST (Execute Sync)
// ----------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAutoSync = searchParams.get('action') === 'auto_sync';

  const supabase = getSupabase();
  let tasks: any[] = [];
  let assignees: any[] = [];

  if (supabase) {
    const [tasksRes, assigneesRes] = await Promise.all([
      supabase.from('briefs').select('*').limit(2000),
      supabase.from('assignees').select('*').limit(100)
    ]);
    if (tasksRes.data) tasks = tasksRes.data;
    if (assigneesRes.data) assignees = assigneesRes.data;
  }

  const now = new Date();
  const rRows = calculateAllRRows(tasks, assignees, now);
  const krRows = calculateAllKRRows(tasks, now);

  // If called as auto_sync cron trigger
  if (isAutoSync) {
    const dayOfWeek = now.getDay(); // 5 = Friday
    const hour = now.getHours();    // 17 = 17:00

    // Check if tomorrow is next month (last day of month)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isLastDayOfMonth = tomorrow.getMonth() !== now.getMonth();

    const results: any = { executed: [] };

    // Trigger R Sync on Friday >= 17:00
    if (dayOfWeek === 5 && hour >= 17) {
      const webhookRes = await pushToGoogleSheetWebhook({ type: 'Data_R', rows: rRows });
      const emailRes = await sendSyncEmails('R', {
        rRows,
        asOfDate: now,
        week: getWeekCode(now),
        month: getMonthCode(now),
        fy: getFiscalYear(now)
      });
      results.executed.push({ type: 'Data_R', rowsCount: rRows.length, webhookRes, emailRes });
    }

    // Trigger KR Sync on Last Day of Month >= 17:00
    if (isLastDayOfMonth && hour >= 17) {
      const webhookRes = await pushToGoogleSheetWebhook({ type: 'Data_KR', rows: krRows });
      const emailRes = await sendSyncEmails('KR', {
        krRows,
        asOfDate: now,
        month: getMonthCode(now),
        fy: getFiscalYear(now)
      });
      results.executed.push({ type: 'Data_KR', rowsCount: krRows.length, webhookRes, emailRes });
    }

    return NextResponse.json({
      status: 'auto_sync_evaluated',
      currentTime: now.toISOString(),
      dayOfWeek,
      hour,
      isLastDayOfMonth,
      results
    });
  }

  return NextResponse.json({
    status: 'ok',
    asOf: now.toISOString(),
    month: getMonthCode(now),
    week: getWeekCode(now),
    fy: getFiscalYear(now),
    webhookConfigured: Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK_URL),
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/1fjfd7oPCqmfARPjf3XDy1QhcwSbQddMA2C1r0GzxjL0/edit",
    rRowsCount: rRows.length,
    krRowsCount: krRows.length,
    rRows: rRows,
    krRows: krRows,
    members: TEAM_MEMBERS,
    rDefinitions: R_DEFINITIONS,
    krDefinitions: KR_DEFINITIONS
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetType: 'R' | 'KR' | 'both' = body.type || 'both';

    const supabase = getSupabase();
    let tasks: any[] = [];
    let assignees: any[] = [];

    if (supabase) {
      const [tasksRes, assigneesRes] = await Promise.all([
        supabase.from('briefs').select('*').limit(2000),
        supabase.from('assignees').select('*').limit(100)
      ]);
      if (tasksRes.data) tasks = tasksRes.data;
      if (assigneesRes.data) assignees = assigneesRes.data;
    }

    const now = new Date();
    const week = getWeekCode(now);
    const month = getMonthCode(now);
    const fy = getFiscalYear(now);

    const syncResults: any = {};

    // 1. Sync R
    if (targetType === 'R' || targetType === 'both') {
      const rRows = calculateAllRRows(tasks, assignees, now, body.updatedBy);
      const webhookRes = await pushToGoogleSheetWebhook({ type: 'Data_R', rows: rRows });
      const emailRes = await sendSyncEmails('R', {
        rRows,
        asOfDate: now,
        week,
        month,
        fy
      });

      syncResults.R = {
        success: true,
        count: rRows.length,
        webhook: webhookRes,
        email: emailRes
      };
    }

    // 2. Sync KR
    if (targetType === 'KR' || targetType === 'both') {
      const krRows = calculateAllKRRows(tasks, now, body.updatedBy);
      const webhookRes = await pushToGoogleSheetWebhook({ type: 'Data_KR', rows: krRows });
      const emailRes = await sendSyncEmails('KR', {
        krRows,
        asOfDate: now,
        month,
        fy
      });

      syncResults.KR = {
        success: true,
        count: krRows.length,
        webhook: webhookRes,
        email: emailRes
      };
    }

    return NextResponse.json({
      status: 'success',
      syncedAt: now.toISOString(),
      results: syncResults
    });

  } catch (err: any) {
    console.error(`[SHEETS SYNC API ERROR]`, err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
