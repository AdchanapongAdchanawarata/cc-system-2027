import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getLineGroupIds, getLineQuotaStatus, shouldSendMorningBriefToday } from '@/utils/lineBotConfig';
import { createClient } from '@supabase/supabase-js';
import { initBackgroundScheduler } from '@/utils/cronRunner';
import { getFreshCreativeTrend, getFreshEveningHealthMind } from '@/utils/dailyArticleService';
import { getTaskSurveyUrl } from '@/utils/surveyTokens';
import { shouldInternalTaskSkipEmail, getLeadTimeForTask } from '@/utils/pricing';
import { recordBotMessageId, recordBotActivity } from '@/utils/lineMemoryService';
import { getMemberOfficialEmail, DEFAULT_MEMBER_METADATA, CORE_OPERATIONAL_MEMBERS, getAssigneeFallbackName } from '@/utils/memberProfile';
import { resolveTaskCode } from '@/utils/taskCodeService';
import { getTaskFinancialDistribution, isCcPmProject, aggregateMemberWorkloadAndFinancials } from '@/utils/stats';
import { isR3Task, computeRealtimeMetrics } from '@/utils/okrSettings';

// Ensure in-process cron timer is active
initBackgroundScheduler();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function getBangkokNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}

function getBangkokDateStr(d: Date = getBangkokNow()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to push LINE message
async function pushLineMessage(targetId: string, text: string, mention?: any) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken || !targetId) {
    console.log(`[LINE PUSH SIMULATED (No Token/Target)]: To: ${targetId}\n${text}`);
    return { ok: true, simulated: true };
  }

  const sendRequest = async (payload: any) => {
    return await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify(payload),
    });
  };

  try {
    const messageObj: any = { type: 'text', text };
    if (mention && Array.isArray(mention.mentionees) && mention.mentionees.length > 0) {
      messageObj.mention = mention;
    }
    let res = await sendRequest({
      to: targetId,
      messages: [messageObj],
    });

    // Fallback: If failed with mention (e.g. 400 bad request due to mentionee type/index in 1-on-1 or API limits), retry without mention
    if (!res.ok && messageObj.mention) {
      console.warn(`[LINE PUSH] Mention failed (${res.status}), retrying without mention object...`);
      res = await sendRequest({
        to: targetId,
        messages: [{ type: 'text', text }],
      });
    }

    if (res.ok) {
      console.log(`[LINE PUSH SUCCESS] To: ${targetId}`);
      try {
        const resData = await res.json().catch(() => ({}));
        const promises: Promise<any>[] = [];
        if (resData?.sentMessages && Array.isArray(resData.sentMessages)) {
          resData.sentMessages.forEach((m: any) => {
            if (m?.id) promises.push(recordBotMessageId(m.id, targetId, text));
          });
        }
        promises.push(recordBotActivity(targetId, text));
        await Promise.allSettled(promises);
      } catch (e) {}
      return { ok: true };
    } else {
      const err = await res.json().catch(() => ({}));
      console.error(`[LINE PUSH FAILED]`, err);
      return { ok: false, error: err };
    }
  } catch (err: any) {
    console.error(`[LINE PUSH NETWORK ERROR]`, err);
    return { ok: false, error: err.message };
  }
}

// Helper to format LINE member tag with Thai honorific name (polite plain name, NO @)
function formatMemberTag(name: string) {
  if (!name || name === 'ยังไม่ระบุผู้รับผิดชอบ' || name === 'ยังไม่ระบุ' || name === 'ยังไม่มีคนรับ') return 'ยังไม่ระบุ';
  const cleanName = name.replace(/@/g, '').trim();
  if (cleanName.includes('วา') || cleanName.toLowerCase().includes('waweewa')) return 'พี่วา';
  if (cleanName.includes('จ๊อบ') || cleanName.toLowerCase().includes('job')) return 'พี่จ๊อบ';
  if (cleanName.includes('พิม') || cleanName.toLowerCase().includes('autcha')) return 'พี่พิม';
  if (cleanName.includes('ก้อง') || cleanName.toLowerCase().includes('itsara')) return 'พี่ก้อง';
  if (cleanName.includes('แก้ว') || cleanName.toLowerCase().includes('kaewkor') || cleanName.toLowerCase().includes('kyk')) return 'พี่แก้วก่อ';
  if (cleanName.includes('เยียร์') || cleanName.toLowerCase().includes('lalynn') || cleanName.toLowerCase().includes('llp')) return 'พี่เยียร์';
  if (cleanName.includes('ลูกอิน') || cleanName.toLowerCase().includes('lee') || cleanName.toLowerCase().includes('stk')) return 'พี่ลูกอิน';
  if (cleanName.includes('นิน') || cleanName.toLowerCase().includes('matanin')) return 'พี่นิน';
  if (cleanName.includes('โอ๊ต') || cleanName.toLowerCase().includes('oat') || cleanName.toLowerCase().includes('cnb')) return 'พี่โอ๊ต';
  if (cleanName.includes('เอ็นจอย') || cleanName.includes('น้องจอย')) return 'พี่เอ็นจอย';
  if (cleanName.includes('จอย') || cleanName.toLowerCase().includes('rati')) return 'พี่จอย';
  if (cleanName.includes('ต้า') || cleanName.toLowerCase().includes('ttar') || cleanName.toLowerCase().includes('tty')) return 'พี่ต้า';
  if (cleanName.includes('หนึ่ง')) return 'พี่หนึ่ง';
  if (cleanName.includes('อ้วน') || cleanName.toLowerCase().includes('tanya')) return 'อาจารย์อ้วน';
  if (cleanName.includes('กอล์ฟ') || cleanName.toLowerCase().includes('golf')) return 'อาจารย์กอล์ฟ';
  if (cleanName.includes('บ่าว') || cleanName.toLowerCase().includes('suriyah')) return 'อาจารย์บ่าว';
  if (cleanName.includes('วิน') || cleanName.toLowerCase().includes('win')) return 'อาจารย์วิน';
  return cleanName;
}

// Helper to format deadline to readable Thai date
function formatDeadlineThai(dateStr?: string | null) {
  if (!dateStr) return 'ไม่ระบุกำหนดส่ง';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split('T')[0];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543) % 100;
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr.split('T')[0];
  }
}

// Helper to format task code
function getTaskCodeDisplay(brief: any, allBriefs?: any[]) {
  if (brief?.details?.task_code) return brief.details.task_code;
  if (brief?.details?.idc_code && brief.details.idc_code.includes('70-')) return brief.details.idc_code;
  if (brief?.details?.rsp_code && brief.details.rsp_code.includes('70-')) return brief.details.rsp_code;
  return resolveTaskCode(brief, allBriefs);
}

// Helper to format unit display name
function formatUnit(unit: string) {
  const u = (unit || '').toLowerCase();
  if (u.includes('creative') || u.includes('design')) return 'Unit Design';
  if (u.includes('content')) return 'Unit Content';
  if (u.includes('pr')) return 'Unit PR';
  if (u.includes('internal')) return 'Internal';
  return unit || 'CC';
}

const formatTag = formatMemberTag;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, briefId, assigneeName, projectName, type } = body;
    const { notyGroupId, execGroupId } = await getLineGroupIds();

    console.log("=========================================");
    console.log(`[NOTIFY ACTION: ${action}] - Target: ${projectName || briefId || 'General'}`);

    // 1. New Brief Alert (Pushed to 'Creative step (NOTY)' immediately)
    if (action === 'new_brief_alert') {
      const { unit, coordinator, department, usageDate, isUrgent, detailsText, category, briefUrl } = body;
      const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'https://cc-insights.step.cmu.ac.th');
      const targetUrl = briefUrl || `${origin}/dashboard?view=dashboards`;

      const u = (unit || '').toLowerCase();
      let unitName = 'CC';
      let assignLead = 'พี่วา หรือ พี่จ๊อบ';

      if (u.includes('creative') || u.includes('design')) {
        unitName = 'Design';
        assignLead = 'พี่วา (ผู้รับผิดชอบ Unit Design)';
      } else if (u.includes('content')) {
        unitName = 'Content';
        assignLead = 'พี่จ๊อบ (หัวหน้าทีม CC & ผู้ดูแล Content)';
      } else if (u.includes('pr')) {
        unitName = 'PR & Comm';
        assignLead = 'พี่จ๊อบ (หัวหน้าทีม CC & ผู้ดูแล PR & Comm)';
      }

      // Check timeline urgency against objective Lead Time standard (e.g., Poster >= 5 days, PR >= 3 days)
      const requiredLeadTime = getLeadTimeForTask(unit, category, projectName);
      let diffDays = 999;
      if (usageDate) {
        const targetDate = new Date(usageDate).getTime();
        if (!isNaN(targetDate)) {
          diffDays = Math.ceil((targetDate - Date.now()) / (1000 * 60 * 60 * 24));
        }
      }
      const isLeadTimeViolated = diffDays >= 0 && diffDays < requiredLeadTime;
      const isTightTimeline = isUrgent || isLeadTimeViolated || (diffDays >= 0 && diffDays <= 3);

      // Check complexity keywords
      const fullText = `${projectName || ''} ${category || ''} ${detailsText || ''}`.toLowerCase();
      const complexKeywords = ['video', 'วิดีโอ', 'คลิป', 'ตัดต่อ', 'ถ่ายทำ', 'motion', 'โมชั่น', '3d', 'animation', 'แอนิเมชัน', 'exhibition', 'นิทรรศการ', 'event', 'อีเวนต์', 'key visual', 'branding', 'ci', 'หลายชิ้น', 'ชุด', 'campaign', 'แคมเปญ', 'live', 'สูจิบัตร', 'booklet', 'annual report', 'ยาก', 'ซับซ้อน'];
      const isComplex = complexKeywords.some(k => fullText.includes(k)) || (detailsText && detailsText.length > 70);

      // AI Analysis / Recommendation via Gemini or Smart Fallback
      let aiAdvice = '';
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiApiKey) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2800);
          const prompt = `คุณคือน้อง CC ผู้ช่วย AI ประจำทีม Creative & Communication (CC) ของ STeP มช. 
มีบรีฟงานใหม่เข้ามาในระบบ:
- ชื่องาน/โครงการ: ${projectName || 'ไม่ระบุ'}
- ยูนิต: ${unitName} Unit
- หมวดหมู่งาน: ${category || 'ทั่วไป'}
- รายละเอียด: ${detailsText || 'ไม่มีระบุ'}
- กำหนดส่ง: ${usageDate || 'ไม่ระบุ'} (${isTightTimeline ? 'กระชั้นชิด' : 'ตามแผน'})
- ความเร่งด่วน: ${isUrgent ? 'งานด่วนพิเศษ' : 'งานปกติ'}

กฎเหล็ก (Anti-Hallucination): วิเคราะห์เฉพาะจากข้อมูลบรีฟที่มีอยู่จริงเท่านั้น ห้ามแต่งเติมหรือสร้างข้อมูลเท็จเด็ดขาด

ให้เขียนการประเมินงานและข้อควรระวัง สั้นๆ ไม่เกิน 2 บรรทัด เช่น:
- ดูจากรายละเอียดงานแล้วระดับความยากเป็นอย่างไร (ค่อนข้างยาก/ซับซ้อน หรือมาตรฐาน)
- ระยะเวลาส่งกระชั้นชิดหรือไม่
- ข้อควรระวังและการจัดคน เช่น "อาจจะต้องมีผู้ช่วยคอยซัพพอร์ต/ช่วยประกบ"
ตอบเฉพาะข้อความวิเคราะห์ 1-2 บรรทัด (ขึ้นต้นด้วย ⚠️ ข้อควรระวัง: หรือ 💡 คำแนะนำ:):`;

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 250, temperature: 0.3 }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              aiAdvice = text.trim();
            }
          }
        } catch (e) {
          // Fallback to heuristic rule
        }
      }

      if (!aiAdvice) {
        if (isTightTimeline && isComplex) {
          aiAdvice = '⚠️ **ข้อควรระวัง:** ดูจากรายละเอียดงานแล้วค่อนข้างยาก/สเกลซับซ้อน และระยะเวลาส่งกระชั้นชิด อาจจะต้องมีผู้ช่วยคอยประกบช่วยงานนี้ครับ!';
        } else if (isTightTimeline) {
          aiAdvice = '⚠️ **ข้อควรระวัง:** ระยะเวลาส่งกระชั้นชิด ขอให้เร่งจัดสรรผู้รับผิดชอบและเริ่มงานทันที หรือพิจารณาจัดผู้ช่วยซัพพอร์ตครับ';
        } else if (isComplex) {
          aiAdvice = '💡 **ข้อแนะนำ:** รายละเอียดงานค่อนข้างละเอียด/สเกลใหญ่ แนะนำให้รีบคอนเฟิร์มสเปกบรีฟกับผู้ขอ และพิจารณาจัดผู้ช่วยหากงานหลักติดพันครับ';
        } else {
          aiAdvice = '💡 **ข้อแนะนำ:** สเกลงานมาตรฐาน สามารถจัดสรรผู้รับผิดชอบตามความถนัดของทีมได้เลยครับ';
        }
      }

      const urgentBadge = isUrgent 
        ? '🚨 [มีบรีฟงานใหม่เข้ามา - ด่วนพิเศษ!]' 
        : '📥 [มีบรีฟงานใหม่ส่งเข้ามา - แจ้งเตือนทันที]';

      const assignAction = (isUrgent || isTightTimeline)
        ? `👉 **การดำเนินการ:** ขอให้ **${assignLead}** รีบ Assign ผู้รับผิดชอบงานนี้อย่างเร่งด่วนครับ!`
        : `👉 **การดำเนินการ:** ขอให้ **${assignLead}** ตรวจรับบรีฟและ Assign ผู้รับผิดชอบงานนี้ในระบบครับ`;

      const lineMsg = `${urgentBadge}
โครงการ: **${projectName || 'ไม่ระบุชื่อ'}**
• ยูนิตที่ขอ: ${unitName} Unit
• ผู้ประสานงาน: ${coordinator || 'ไม่ระบุ'} (${department || 'ไม่ระบุฝ่าย'})
• วันที่ต้องการส่งมอบ: ${usageDate || 'ไม่ระบุ'}${isTightTimeline ? ' ⚡ (กระชั้นชิด)' : ''}

${assignAction}

${aiAdvice}

🔗 ตรวจรับบรีฟและมอบหมายงานได้ที่:
${targetUrl}

💬 **ต้องการสอบถามข้อมูลหรือข้อควรระวังงานนี้เพิ่มเติม?**
• กด **Reply (ตอบกลับ)** ที่ข้อความนี้ได้เลยครับ
• หรือพิมพ์ **"น้อง CC [คำถาม]"** หรือ **@น้อง CC** ในกลุ่มได้ตลอดเวลาครับ 🤖✨`;

      // Real-time LINE notification disabled per user instruction (reported centrally in Morning Brief instead)
      console.log(`[LINE PUSH SKIPPED for new_brief_alert per user configuration]`);

      return NextResponse.json({
        success: true,
        message: 'บันทึกบรีฟใหม่เรียบร้อย (งดแจ้งเตือนเข้ากลุ่ม LINE โดยจะรวบรวมรายงานใน Morning Brief ประจำวันแทน)',
        lineSent: false,
      });
    }

    // 1.5 Task Assignment (Strict Privacy Guard: No direct email inbox intrusion, No 1-on-1 personal LINE DM)
    else if (action === 'assignee_changed' || action === 'task_assigned') {
      const { projectName, assigneeName } = body;
      console.log(`[ASSIGNEE CHANGED / TASK ASSIGNED] Project: ${projectName || 'N/A'} -> Assignee: ${assigneeName || 'N/A'} (Direct email and personal LINE push disabled to protect privacy)`);

      return NextResponse.json({
        success: true,
        message: 'บันทึกการมอบหมายงานเรียบร้อย (งดส่งอีเมลเข้ากล่องข้อความและงด LINE 1-on-1 เพื่อรักษาความเป็นส่วนตัว)',
        emailSent: false,
        lineSent: false,
      });
    }

    // 2. Comprehensive Morning Brief (Pushed to 'Creative step (NOTY)' at 09:00 AM on workdays - Balanced & Paced)
    else if (action === 'morning_brief') {
      const forceDispatch = body?.force === true;

      // Intelligent Quota Pacing & Ironclad Guard:
      // Balances Morning Brief evenly across remaining workweeks (e.g. Mon, Wed) so quota is never depleted prematurely.
      if (!forceDispatch) {
        try {
          const pacingCheck = await shouldSendMorningBriefToday();
          if (!pacingCheck.allowed) {
            console.warn(`[QUOTA PACING] ${pacingCheck.reason}`);
            return NextResponse.json({
              success: true,
              skipped: true,
              message: pacingCheck.reason,
              quotaPacing: pacingCheck.quotaInfo,
            });
          }
        } catch (qErr) {
          console.warn('[QUOTA PACING CHECK ERROR]', qErr);
        }
      }

      const supabase = getSupabase();
      const todayStr = getBangkokDateStr();
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      let newBriefs: any[] = [];
      let todayTasks: any[] = [];
      let urgentTasks: any[] = [];
      let overdueTasks: any[] = [];
      let unassignedTasks: any[] = [];
      let todoTasks: any[] = [];
      let stalledPendingTasks: any[] = [];
      let inProgressTasks: any[] = [];
      let rawBriefsList: any[] = [];

      const resolveTaskAssignee = (b: any) =>
        b?.assignees?.name || b?.details?.assignee || getAssigneeFallbackName(b?.assignee_id) || 'ยังไม่ระบุผู้รับผิดชอบ';

      if (supabase) {
        const { data: briefs } = await supabase
          .from('briefs')
          .select('id, project_name, unit, status, deadline, created_at, details, coordinator_nickname, assignee_id, assignees(id, name)')
          .neq('status', 'completed')
          .order('created_at', { ascending: false });

        if (briefs) {
          rawBriefsList = briefs;
          briefs.forEach((b: any) => {
            const isDeleted = b.details?.is_deleted || b.details?.is_permanently_deleted || b.status === 'purged' || b.status === 'cancelled' || b.status === 'cancel';
            const isTest = b.details?.is_test ||
              /\[(STRESS_TEST|TEST|BENCHMARK)\]/i.test(b.project_name || '') ||
              /Automated Load Benchmark/i.test(b.project_name || '') ||
              (b.project_name && b.project_name.toLowerCase().startsWith('test'));

            if (isDeleted || isTest) return;

            const hasAssignee = Boolean((b.assignee_id && b.assignee_id.trim() !== '') || b.assignees?.name || b.details?.assignee);
            const dStr = b.details?.publish_date || b.deadline || b.details?.usage_date;
            const dDatePart = dStr ? String(dStr).slice(0, 10) : '';
            const isToday = Boolean(dDatePart && dDatePart === todayStr);
            const isOverdue = Boolean(dDatePart && dDatePart < todayStr);
            const diffDays = dStr ? (new Date(dStr).getTime() - now) / (1000 * 60 * 60 * 24) : 999;
            const slaLeadTime = getLeadTimeForTask(b.unit, b.details?.category || b.details?.service_name, b.project_name);
            const isSlaUrgent = diffDays >= 0 && diffDays < slaLeadTime;
            const isUrgent = (b.details?.is_urgent || b.details?.isUrgent || isSlaUrgent || (diffDays >= 0 && diffDays <= 2)) && !isToday && !isOverdue;
            const isNewSinceYesterday = new Date(b.created_at).getTime() >= twentyFourHoursAgo;

            if (isNewSinceYesterday) newBriefs.push(b);
            if (isToday) todayTasks.push(b);
            if (isUrgent) urgentTasks.push(b);
            if (isOverdue) overdueTasks.push(b);
            if (!hasAssignee && (b.status === 'pending' || b.status === 'in_progress' || b.status === 'progress' || !b.status)) unassignedTasks.push(b);
            if (hasAssignee && b.status === 'pending') todoTasks.push(b);
            if (b.status === 'pending' && new Date(b.created_at).getTime() < threeDaysAgo) stalledPendingTasks.push(b);
            if (b.status === 'in_progress' || b.status === 'progress') inProgressTasks.push(b);
          });
        }
      }

      const getAssigneesText = (tasks: any[]) => {
        const names = Array.from(new Set(tasks.map(t => resolveTaskAssignee(t)))).filter(Boolean);
        return names.length > 0 ? names.map(n => formatMemberTag(n)).join(', ') : 'ผู้รับผิดชอบ';
      };

      const todayThai = new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      let lineMsg = `☀️ [Morning Brief ประจำวัน • ${todayThai}]\nสวัสดีตอนเช้าพี่ๆ ทีมสร้างสรรค์และการสื่อสาร (CC) ครับ! 🌸✨\n`;

      const unassignedCreative = unassignedTasks.filter(t => (t.unit || '').toLowerCase().includes('creative') || (t.unit || '').toLowerCase().includes('design'));

      // เรียงลำดับความสำคัญความเสี่ยงของงาน Design: งานเกินกำหนดส่ง (Overdue) ก่อน -> งานใกล้ถึงกำหนดส่ง -> งานอื่นๆ
      unassignedCreative.sort((a, b) => {
        const dateA = a.details?.publish_date || a.deadline || a.details?.usage_date || '9999-99-99';
        const dateB = b.details?.publish_date || b.deadline || b.details?.usage_date || '9999-99-99';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });

      // พาดหัวคำเตือนงานค้างสำหรับกลุ่ม NOTY (ตรงไปตรงมา ชัดเจน ไม่อ้อมค้อม เพื่อกระตุ้นให้งานเดินทันที)
      if (unassignedCreative.length > 0) {
        lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n🚨🚨 **[คำเตือนงานค้าง: พี่วา รีบมอบหมายงาน Design ด่วน!]** 🚨🚨\n━━━━━━━━━━━━━━━━━━━━\n`;
        lineMsg += `⚠️ **มีงาน Design รอมอบหมายค้างอยู่ในระบบถึง ${unassignedCreative.length} งาน** หากไม่รีบจ่ายงาน น้องๆ นักออกแบบจะรู้ตัวช้าและทำงานไม่ทันกำหนดแน่นอนครับ!\n\n`;
        lineMsg += `👉 **สิ่งที่ต้องทำทันที:** ขอ **พี่วา (ผู้รับผิดชอบ Unit Design)** เข้าไปเคาะจ่ายงานในระบบให้เสร็จสิ้นภายในช่วงเช้านี้ เพื่อให้งานเริ่มเดินได้ทันทีครับ\n━━━━━━━━━━━━━━━━━━━━\n`;
      }

      // พาดหัวคำเตือนงานเกินกำหนดส่ง (Overdue)
      if (overdueTasks.length > 0) {
        lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n⏰⏰ **[คำเตือนงานเกินกำหนด: พบงาน Overdue ${overdueTasks.length} งาน!]** ⏰⏰\n━━━━━━━━━━━━━━━━━━━━\n`;
        lineMsg += `⚠️ มีงานที่เกินกำหนดส่งแล้วในระบบ ขอให้ผู้รับผิดชอบและหัวหน้ายูนิตเร่งเคลียร์ส่งมอบ หรือประสานผู้ขอเพื่อปรับขยายเวลาทันทีครับ!\n`;
        overdueTasks.slice(0, 4).forEach((t, i) => {
          const code = getTaskCodeDisplay(t, rawBriefsList);
          const rawAssignee = resolveTaskAssignee(t);
          const assignee = formatMemberTag(rawAssignee);
          const dStr = formatDeadlineThai(t.details?.publish_date || t.deadline || t.details?.usage_date);
          lineMsg += `\n${i + 1}. [${formatUnit(t.unit)}] **${code}** : ${t.project_name}\n   └ ผู้รับผิดชอบ: **${assignee}** (ครบกำหนด: ${dStr})`;
        });
        lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      }

      // จุดเฝ้าระวังงานค้างใน To-Do นานเกิน 3 วัน
      if (stalledPendingTasks.length > 0) {
        lineMsg += `\n⏳ **[เฝ้าระวัง: งานค้างใน To-Do list > 3 วัน (${stalledPendingTasks.length} งาน)]:** ค้างนานเกินไปแล้ว ขอให้ผู้รับผิดชอบและหัวหน้ายูนิตรีบตรวจรับบรีฟและเริ่มเป็น In Progress ครับ\n`;
      }

      // ตารางที่ 1: งานที่รอ Assign ทั้งหมด
      lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n📋 **ตารางงานรอ ASSIGN ทั้งหมด (${unassignedTasks.length} งาน):**\n━━━━━━━━━━━━━━━━━━━━`;
      if (unassignedTasks.length === 0) {
        lineMsg += `\n✨ ขณะนี้ไม่มีงานค้างรอจัดสรร — มอบหมายครบถ้วนทุกงานแล้วครับ 👍\n`;
      } else {
        // เรียงลำดับงาน: งานเกินกำหนดส่งก่อน -> กำหนดส่งใกล้สุด
        unassignedTasks.sort((a, b) => {
          const dateA = a.details?.publish_date || a.deadline || a.details?.usage_date || '9999-99-99';
          const dateB = b.details?.publish_date || b.deadline || b.details?.usage_date || '9999-99-99';
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        });

        unassignedTasks.forEach((t, i) => {
          const code = getTaskCodeDisplay(t, rawBriefsList);
          const uName = formatUnit(t.unit);
          const dStr = formatDeadlineThai(t.details?.publish_date || t.deadline || t.details?.usage_date);
          const req = t.coordinator_nickname || 'ไม่ระบุ';
          lineMsg += `\n${i + 1}. [${uName}] **${code}** : ${t.project_name}\n   └ ⏰ กำหนดส่ง: ${dStr} | ผู้ขอ: ${req}`;
        });

        const hasCreativeUnassigned = unassignedTasks.some(t => (t.unit || '').toLowerCase().includes('creative') || (t.unit || '').toLowerCase().includes('design'));
        const hasOtherUnassigned = unassignedTasks.some(t => !(t.unit || '').toLowerCase().includes('creative') && !(t.unit || '').toLowerCase().includes('design'));
        const assignDirectives = [];
        if (hasCreativeUnassigned) assignDirectives.push(`ขอ **พี่วา (ผู้รับผิดชอบ Unit Design)** เร่งมอบหมายงาน Design`);
        if (hasOtherUnassigned) assignDirectives.push(`ขอ **พี่จ๊อบ (หัวหน้าทีม CC)** เร่งมอบหมายงาน Content/PR`);
        lineMsg += `\n\n👉 **สิ่งที่ต้องทำต่อ:** ${assignDirectives.join(' และ ')} ในระบบทันทีครับ\n`;
      }

      // ตารางที่ 2: งาน TO-DO LIST ทั้งหมด พร้อมคนที่ได้รับมอบหมาย
      lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n📝 **ตารางงาน TO-DO LIST ทั้งหมด (${todoTasks.length} งาน):**\n━━━━━━━━━━━━━━━━━━━━`;
      if (todoTasks.length === 0) {
        lineMsg += `\n✨ ขณะนี้ไม่มีงานค้างใน To-Do list ครับ\n`;
      } else {
        // จัดกลุ่มตามผู้รับผิดชอบ เพื่อให้เห็นชัดว่าใครรับผิดชอบอะไร เป็นงานของใคร ยูนิตไหน
        const groupedTodo: Record<string, any[]> = {};
        todoTasks.forEach(t => {
          const rawName = resolveTaskAssignee(t);
          const name = formatMemberTag(rawName);
          if (!groupedTodo[name]) groupedTodo[name] = [];
          groupedTodo[name].push(t);
        });

        const sortedPersons = Object.keys(groupedTodo).sort();

        sortedPersons.forEach((person) => {
          const tasks = groupedTodo[person];
          tasks.sort((a, b) => {
            const dateA = a.details?.publish_date || a.deadline || a.details?.usage_date || '9999-99-99';
            const dateB = b.details?.publish_date || b.deadline || b.details?.usage_date || '9999-99-99';
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });

          const units = Array.from(new Set(tasks.map(t => formatUnit(t.unit)))).join(', ');
          lineMsg += `\n\n👤 **${person}** (${units} • ${tasks.length} งาน):`;
          tasks.forEach((t) => {
            const code = getTaskCodeDisplay(t, rawBriefsList);
            const uName = formatUnit(t.unit);
            const dStr = formatDeadlineThai(t.details?.publish_date || t.deadline || t.details?.usage_date);
            lineMsg += `\n • [${uName}] **${code}** : ${t.project_name}\n   └ ⏰ กำหนดส่ง: ${dStr}`;
          });
        });
        lineMsg += `\n`;
      }

      // ตาราง/รายการ: งานครบกำหนดส่งวันนี้ (Due Today)
      lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n🎯 **งานครบกำหนดส่งวันนี้ (${todayTasks.length} งาน):**\n━━━━━━━━━━━━━━━━━━━━`;
      if (todayTasks.length === 0) {
        lineMsg += `\n• วันนี้ไม่มีงานครบกำหนดส่งมอบครับ จัดการงานตามแผนปกติได้ราบรื่นเลยครับ 👍`;
      } else {
        todayTasks.forEach((t, i) => {
          const code = getTaskCodeDisplay(t, rawBriefsList);
          const rawAssignee = resolveTaskAssignee(t);
          const assignee = formatMemberTag(rawAssignee);
          lineMsg += `\n${i + 1}. [${formatUnit(t.unit)}] **${code}** : ${t.project_name}\n   └ ผู้รับผิดชอบ: **${assignee}**`;
        });
        const todayAssignees = getAssigneesText(todayTasks);
        lineMsg += `\n👉 **สิ่งที่ต้องทำต่อ:** ขอให้ผู้รับผิดชอบ (**${todayAssignees}**) ตรวจทานความเรียบร้อยรอบสุดท้ายและส่งมอบงานภายในวันนี้ หากติดขัดปัญหาให้รีบแจ้งหัวหน้ายูนิตทันทีครับ`;
      }

      // Section 3: งานด่วนเฝ้าระวัง 48 ชม. (Urgent 48h)
      if (urgentTasks.length > 0) {
        lineMsg += `\n\n🚨 **งานด่วนเฝ้าระวัง 48 ชม. (${urgentTasks.length} งาน):**`;
        urgentTasks.slice(0, 5).forEach((t) => {
          const code = getTaskCodeDisplay(t, rawBriefsList);
          const rawAssignee = resolveTaskAssignee(t);
          const assignee = formatMemberTag(rawAssignee);
          const dStr = formatDeadlineThai(t.details?.publish_date || t.deadline || t.details?.usage_date);
          lineMsg += `\n• [${formatUnit(t.unit)}] **${code}** : ${t.project_name}\n   └ ผู้รับผิดชอบ: **${assignee}** | กำหนดส่ง: ${dStr}`;
        });
        lineMsg += `\n👉 **สิ่งที่ต้องทำต่อ:** ขอให้ผู้รับผิดชอบเร่งมือตามไทม์ไลน์ และขอให้หัวหน้าแต่ละยูนิตช่วยติดตามอย่างใกล้ชิดครับ`;
      }

      // Section 4: สรุปภาพรวมสถานะงานในระบบ
      const creativeCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('creative') || (t.unit || '').toLowerCase().includes('design')).length;
      const contentCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('content')).length;
      const prCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('pr')).length;
      const internalCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('internal')).length;

      lineMsg += `\n\n⚙️ **สรุปภาพรวมสถานะงานในระบบ:**\n• กำลังดำเนินการ (In Progress): รวม ${inProgressTasks.length} งาน (Design: ${creativeCount} | Content: ${contentCount} | PR: ${prCount}${internalCount > 0 ? ` | Internal: ${internalCount}` : ''})\n• รอดำเนินการ (To-Do): รวม ${todoTasks.length} งาน\n• รอมอบหมาย (Unassigned): รวม ${unassignedTasks.length} งาน`;

      lineMsg += `\n\n🔗 จัดการและดูรายละเอียดงานทั้งหมด:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://ccteam.vercel.app'}/dashboard?view=dashboards`;
      lineMsg += `\n\n💬 **มีข้อสงสัยหรือต้องการสอบถามข้อมูลงานเพิ่มเติม?**`;
      lineMsg += `\n• กด **Reply (ตอบกลับ)** ที่ข้อความของน้อง CC นี้ได้เลยครับ`;
      lineMsg += `\n• หรือพิมพ์ **"น้อง CC [คำถาม]"** หรือ **@น้อง CC** ในกลุ่ม (เช่น *"น้อง CC วันนี้มีงานของใครบ้าง"*)`;
      lineMsg += `\n• หรือทักแชทเดี่ยวกับน้อง CC เพื่อเช็กข้อมูลงานส่วนตัวได้ตลอด 24 ชม. ครับ 🤖✨`;
      lineMsg += `\n\nขอให้วันนี้เป็นวันที่ราบรื่นและเปี่ยมไปด้วยพลังสร้างสรรค์ครับ! 💪✨`;

      const mentionPayload = {
        mentionees: [
          {
            index: 0,
            length: 4,
            type: 'all'
          }
        ]
      };

      const targetId = notyGroupId || execGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg, mentionPayload);

      return NextResponse.json({
        success: true,
        message: 'ส่ง Morning Brief ประจำวัน (ตรงไปตรงมา เน้น Action ด่วน) เข้ากลุ่ม NOTY เรียบร้อยแล้ว',
        lineSent: pushRes.ok,
      });
    }

    // 3. Anomaly Scan Alert (Limited to ONCE PER DAY, Detailed Assignee, Unit, and Specific Resolution)
    else if (action === 'anomaly_scan') {
      const todayStr = new Date().toISOString().split('T')[0];
      const trackerPath = path.join(process.cwd(), 'src', 'data', 'anomaly_scan_tracker.json');
      
      // Check if already scanned today (Unless body.force is true)
      if (!body.force) {
        try {
          if (fs.existsSync(trackerPath)) {
            const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
            if (tracker.lastScanDate === todayStr) {
              console.log(`[ANOMALY SCAN] Already sent today (${todayStr}). Skipping to avoid spam.`);
              return NextResponse.json({
                success: true,
                skipped: true,
                message: `วันนี้ได้ส่งรายงานสแกนความผิดปกติไปแล้ว 1 ครั้ง (${todayStr}) ตามกฎจำกัดวันละ 1 ครั้งครับ`,
              });
            }
          }
        } catch (e) {
          console.warn('Could not read anomaly scan tracker:', e);
        }
      }

      const supabase = getSupabase();
      let unassignedList: any[] = [];
      let stalledPendingList: any[] = [];
      let overdueList: any[] = [];
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      if (supabase) {
        const { data: briefs } = await supabase
          .from('briefs')
          .select('id, project_name, unit, status, created_at, deadline, details, coordinator_nickname, assignees(id, name)')
          .neq('status', 'completed');

        if (briefs) {
          briefs.forEach((b: any) => {
            if (!b || b.status === 'cancelled' || b.status === 'purged') return;
            const d = b.details || {};
            if (d.is_deleted === true || d.is_permanently_deleted === true || d.is_test === true) return;
            const tLower = ((b.project_name || '') + ' ' + (d.client_name || '')).toLowerCase();
            if (tLower.includes('benchmark') || tLower.includes('stress-test') || tLower.includes('test system')) return;

            const hasAssignee = !!(b.assignees?.name || b.details?.assignee);
            // 1. Unassigned
            if (!hasAssignee) {
              unassignedList.push(b);
            }
            // 2. Stalled in pending > 3 days
            if (b.status === 'pending' && new Date(b.created_at).getTime() < threeDaysAgo) {
              stalledPendingList.push(b);
            }
            // 3. Overdue
            const dStr = b.details?.publish_date || b.deadline || b.details?.usage_date;
            if (dStr && new Date(dStr).getTime() < now) {
              overdueList.push(b);
            }
          });
        }
      }

      if (unassignedList.length === 0 && stalledPendingList.length === 0 && overdueList.length === 0) {
        return NextResponse.json({ success: true, message: 'ระบบปกติ ไม่พบความผิดปกติ' });
      }

      const formatUnit = (unit: string) => {
        const u = (unit || '').toLowerCase();
        if (u.includes('creative')) return 'Creative';
        if (u.includes('content')) return 'Content';
        if (u.includes('pr')) return 'PR & Comm';
        return unit || 'CC';
      };

      const todayThai = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      let lineMsg = `⚠️ [รายงานสแกนความผิดปกติประจำวัน • ${todayThai}]\nตรวจพบจุดเฝ้าระวังที่ต้องดำเนินการแก้ไขในระบบ:\n`;

      // 1. งานที่ยังไม่มีผู้รับผิดชอบ (Unassigned) + แนวทางแก้ไข
      if (unassignedList.length > 0) {
        const unassignedCreative = unassignedList.filter(t => (t.unit || '').toLowerCase().includes('creative') || (t.unit || '').toLowerCase().includes('design'));
        const unassignedOther = unassignedList.filter(t => !(t.unit || '').toLowerCase().includes('creative') && !(t.unit || '').toLowerCase().includes('design'));

        // เรียงลำดับความสำคัญความเสี่ยงของงาน Design: งานเกินกำหนดส่ง (Overdue) ก่อน -> งานใกล้ถึงกำหนดส่ง -> งานอื่นๆ
        unassignedCreative.sort((a, b) => {
          const dateA = a.details?.publish_date || a.deadline || a.details?.usage_date || '9999-99-99';
          const dateB = b.details?.publish_date || b.deadline || b.details?.usage_date || '9999-99-99';
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        });

        if (unassignedCreative.length > 0) {
          lineMsg += `\n━━━━━━━━━━━━━━━━━━━━\n🚨🚨 **[คำเตือนความเสี่ยงสูง: พี่วา รีบมอบหมายงานด่วน!]** 🚨🚨\n━━━━━━━━━━━━━━━━━━━━\n`;
          lineMsg += `⚠️ **มีงานค้างเป็นเวลาหลายวันจำนวนมาก (${unassignedCreative.length} งาน) อาจส่งผลให้นักออกแบบทำงานไม่ทันและเกิดความกดดันในการทำงานเนื่องจากรู้ตัวช้า!**\n`;
          lineMsg += `\n🚨 **รายละเอียดงาน Design ค้างที่ UNASSIGNED (${unassignedCreative.length} งาน) เรียงตามลำดับความเร่งด่วน:**`;
          unassignedCreative.forEach((t, i) => {
            const dStr = (t.details?.publish_date || t.deadline || t.details?.usage_date || 'ไม่ระบุกำหนดส่ง').split('T')[0];
            const isPast = dStr !== 'ไม่ระบุกำหนดส่ง' && new Date(dStr).getTime() < now;
            const badge = isPast ? '⚡ [เกินกำหนดส่ง]' : '⏳ [รอมอบหมาย]';
            lineMsg += `\n   ${i + 1}. ${badge} **${t.project_name}** (กำหนดส่ง: ${dStr} | ผู้ขอ: ${t.coordinator_nickname || 'ไม่ระบุ'})`;
          });
          lineMsg += `\n   👉 **ความรับผิดชอบและการแก้ไข:** แนะนำ **พี่วา (ผู้รับผิดชอบ Unit Design)** โดยตรง ในการเร่งดำเนินการมอบหมายงานแก่นักออกแบบในระบบทันทีครับ`;
          lineMsg += `\n   ⚠️ **เหตุผลความเสี่ยง:** มีงานค้างเป็นเวลาหลายวันจำนวนมาก (${unassignedCreative.length} งาน) หาก **พี่วา** ไม่รีบดำเนินการมอบหมาย จะส่งผลให้นักออกแบบทำงานไม่ทันและเกิดความกดดันในการทำงานเนื่องจากรู้ตัวช้า ทำให้ประสิทธิภาพและความประณีตของงานลดลง อีกทั้งยังส่งผลกระทบต่อการประเมินการทำงานของ PM แนะนำให้ **พี่วา** ในฐานะผู้กำกับดูแล ควรเข้ามาตรวจตรา ควบคุม และแจกแจงงานอย่างสม่ำเสมอครับ\n━━━━━━━━━━━━━━━━━━━━\n`;
        }

        if (unassignedOther.length > 0) {
          lineMsg += `\n\n📌 **งาน Content / PR ที่ยังไม่ได้มอบหมาย (${unassignedOther.length} งาน):**`;
          unassignedOther.slice(0, 3).forEach((t, i) => {
            lineMsg += `\n   • **${t.project_name}** [ยูนิต: ${formatUnit(t.unit)}]`;
          });
          lineMsg += `\n   👉 **ความรับผิดชอบ:** ขอให้ **พี่จ๊อบ (หัวหน้าทีม CC & ผู้ดูแล Content/PR)** เร่งตรวจรับและมอบหมายผู้รับผิดชอบในระบบครับ`;
        }
      }

      // 2. งานค้างในสถานะ Pending เกิน 3 วัน + แนวทางแก้ไข
      if (stalledPendingList.length > 0) {
        lineMsg += `\n\n📌 **2. งานค้างในสถานะ Pending > 3 วัน (${stalledPendingList.length} งาน):**`;
        stalledPendingList.slice(0, 3).forEach((t, i) => {
          const rawAssignee = t.assignees?.name || t.details?.assignee || 'ยังไม่มีคนรับ';
          const assignee = formatMemberTag(rawAssignee);
          lineMsg += `\n• **${t.project_name}** [ยูนิต: ${formatUnit(t.unit)}] (ผู้รับผิดชอบ: ${assignee})`;
        });
        lineMsg += `\n👉 **แนวทางแก้ไข:** ขอให้ผู้ดูแลยูนิตหรือผู้ประสานงานเร่งตรวจรับบรีฟและขยับสถานะเป็น In Progress ทันที`;
      }

      // 3. งานเกินกำหนดส่ง (Overdue) + แนวทางแก้ไข
      if (overdueList.length > 0) {
        lineMsg += `\n\n📌 **3. งานเกินกำหนดส่ง Overdue (${overdueList.length} งาน):**`;
        overdueList.slice(0, 4).forEach((t, i) => {
          const rawAssignee = t.assignees?.name || t.details?.assignee || 'ยังไม่ระบุ';
          const assignee = formatMemberTag(rawAssignee);
          lineMsg += `\n• **${t.project_name}** [ยูนิต: ${formatUnit(t.unit)}] • ผู้รับผิดชอบ: ${assignee}`;
        });
        lineMsg += `\n👉 **แนวทางแก้ไข:** ขอให้ **พี่วา หรือ พี่จ๊อบ** ติดตามงานอย่างเร่งด่วนกับผู้รับผิดชอบเพื่อเคลียร์ส่งมอบ หรือประสานผู้ขอเพื่อปรับขยายเวลาในระบบ`;
      }

      lineMsg += `\n\n🔗 จัดการและอัปเดตสถานะงานได้ที่:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://cc-insights.step.cmu.ac.th'}/dashboard?view=dashboards`;

      const targetId = notyGroupId || execGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg);

      // Record that today's anomaly scan was sent
      try {
        const dir = path.dirname(trackerPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(trackerPath, JSON.stringify({ lastScanDate: todayStr, sentAt: new Date().toISOString() }, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Could not save anomaly scan tracker:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'ส่งแจ้งเตือนความผิดปกติ (จำกัดวันละ 1 ครั้ง) เข้ากลุ่มเรียบร้อยแล้ว',
        lineSent: pushRes.ok,
      });
    }

    // 4. Executive Monthly Report Dispatch (Pushed to 'CC TEAM' and sent via Email)
    else if (action === 'executive_report_dispatch') {
      const { reporter, executives, ccStaff, subject, emailBody, toEmails, ccEmails } = body;
      
      let execList: any[] = [];
      if (toEmails && typeof toEmails === 'string') {
        const rawList = toEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
        execList = rawList.map((em: string) => {
          let name = em;
          if (em.includes('suriyah')) name = 'ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)';
          else if (em.includes('pitiwat')) name = 'รศ.ดร.ปิติวัฒน์ วัฒนชัย (ผู้อำนวยการ)';
          return {
            role: 'Executive (ผู้บริหาร)',
            name,
            email: em,
          };
        });
      } else if (executives && executives.length > 0) {
        execList = executives.map((ex: any) => ({
          role: 'Executive (ผู้บริหาร)',
          name: `${ex.position ? `${ex.position} ` : ''}${ex.fullName || ex.name}`,
          email: ex.email || 'executives@step.cmu.ac.th'
        }));
      } else {
        execList = [
          { role: 'Executive (ผู้บริหาร)', name: 'รศ.ดร.ปิติวัฒน์ วัฒนชัย (ผู้อำนวยการ)', email: 'pitiwat@step.cmu.ac.th' },
          { role: 'Executive (ผู้บริหาร)', name: 'ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)', email: 'suriyah@step.cmu.ac.th' }
        ];
      }

      let ccList: any[] = [];
      if (ccEmails && typeof ccEmails === 'string') {
        const rawCc = ccEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
        ccList = rawCc.map((em: string) => ({
          role: 'Staff (ทีมงาน CC)',
          name: em,
          email: em
        }));
      } else if (ccStaff && ccStaff.length > 0) {
        ccList = ccStaff.map((st: any) => ({
          role: 'Staff (ทีมงาน CC)',
          name: `${st.fullName || st.name} (${st.position || st.unit || 'CC'})`,
          email: st.email || getMemberOfficialEmail(st.name)
        }));
      }

      const allRecipients = [
        ...execList,
        { 
          role: 'Reporter / Team Lead (ผู้รายงาน)', 
          name: `${reporter?.fullName || 'จ๊อบ AA'} (${reporter?.position || 'CC Lead'})`, 
          email: reporter?.email || 'adchanapong@step.cmu.ac.th' 
        }
      ];

      console.log(`[EXECUTIVE & STAFF CC MONTHLY REPORT DISPATCH]`);
      console.log(`Subject: ${subject}`);
      console.log(`To: ${execList.map((e: any) => e.name || e.email).join(', ')}`);
      console.log(`CC Staff: ${ccList.length} members (${ccList.map((c: any) => c.email).join(', ')})`);

      // Backend Email Dispatch via Nodemailer if SMTP configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      let emailSendResult: { simulated: boolean; messageId?: string; error?: string } = { simulated: true };

      if (smtpHost && smtpUser && smtpPass && execList.length > 0) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const toAddresses = execList.map((e: any) => e.email).filter(Boolean);
          const ccAddresses = ccList.map((c: any) => c.email).filter(Boolean);

          const sendInfo = await transporter.sendMail({
            from: `"${reporter?.fullName || reporter?.name || 'หัวหน้าทีม CC'} (CC TEAM)" <${smtpUser}>`,
            replyTo: reporter?.email || 'adchanapong@step.cmu.ac.th',
            to: toAddresses,
            cc: ccAddresses.length > 0 ? ccAddresses : undefined,
            subject: subject || '[CC TEAM] รายงานสรุปผลการดำเนินงาน ประจำเดือน',
            text: emailBody || '',
          });

          emailSendResult = { simulated: false, messageId: sendInfo.messageId };
          console.log(`[EXECUTIVE MONTHLY REPORT LIVE SENT] Message ID: ${sendInfo.messageId}`);
        } catch (mailErr: any) {
          console.error(`[EXECUTIVE MONTHLY REPORT SMTP ERROR]`, mailErr);
          emailSendResult = { simulated: false, error: mailErr.message };
        }
      }

      return NextResponse.json({
        success: true,
        message: `จัดส่งอีเมลรายงานประจำเดือนถึงคณะผู้บริหาร (${execList.map((e: any) => e.email).join(', ')}) และ CC สมาชิกทีม (${ccList.length} ท่าน) สำเร็จเรียบร้อย!`,
        lineSent: false,
        emailSendResult,
        recipients: allRecipients,
        ccRecipients: ccList,
        dispatchTime: new Date().toISOString()
      });
    }

    // 4.0 Automated Weekly Executive Report for CC TEAM (Every Friday 16:30 PM)
    else if (action === 'weekly_executive_report') {
      const bkkNow = getBangkokNow();
      const todayStr = getBangkokDateStr(bkkNow);
      // Rule: อาทิตย์สุดท้ายของเดือนไม่ต้องมีรายงานวีค เพราะมีรายงานเดือนแล้ว
      const curDate = bkkNow.getDate();
      const lastDayOfMonth = new Date(bkkNow.getFullYear(), bkkNow.getMonth() + 1, 0).getDate();
      const isLastWeekOfMonth = (curDate + 7) > lastDayOfMonth;

      if (!body.force && isLastWeekOfMonth) {
        console.log(`[WEEKLY EXECUTIVE REPORT] Skipped on last Friday of month because Monthly Performance Summary covers it.`);
        return NextResponse.json({
          success: true,
          skipped: true,
          message: 'สัปดาห์สุดท้ายของเดือนงดส่งรายงานประจำสัปดาห์ เนื่องจากมีรายงานประจำเดือนสรุปภาพรวมครบถ้วนแล้ว',
        });
      }

      const supabase = getSupabase();
      const nowMs = Date.now();
      const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
      const fridayThai = new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      if (supabase) {
        let okrConfig: any = null;
        try {
          const { data: okrRow } = await supabase
            .from('okr_settings')
            .select('target_value')
            .eq('description', 'CONFIG_OKR_STATE_JSON')
            .maybeSingle();
          if (okrRow?.target_value) {
            okrConfig = JSON.parse(okrRow.target_value);
          }
        } catch (e) {
          console.warn("Could not parse manual okr metrics:", e);
        }

        const assigneeMap: Record<string, string> = {};
        const assigneesList: { id: string; name: string; unit?: string }[] = [];
        try {
          const { data: dbAssignees } = await supabase.from('assignees').select('id, name, unit');
          if (Array.isArray(dbAssignees)) {
            dbAssignees.forEach((a: any) => {
              if (a?.id && a?.name) {
                assigneeMap[a.id] = a.name;
                assigneesList.push({ id: a.id, name: a.name, unit: a.unit });
              }
            });
          }
        } catch (e) {}

        CORE_OPERATIONAL_MEMBERS.forEach((cm) => {
          if (!assigneeMap[cm.id]) {
            assigneeMap[cm.id] = cm.name;
          }
          if (!assigneesList.some((a) => a.id === cm.id || a.name.trim() === cm.name.trim())) {
            assigneesList.push({ id: cm.id, name: cm.name, unit: cm.unit });
          }
        });

        const { data: rawBriefs, error: briefsErr } = await supabase
          .from('briefs')
          .select('*')
          .neq('status', 'purged');

        if (briefsErr) {
          console.error('[WEEKLY REPORT] Briefs query error:', briefsErr);
        }

        const allValidBriefs = (rawBriefs || []).filter((b: any) => {
          const isDeleted = b.details?.is_deleted || b.details?.is_permanently_deleted;
          const isTest = b.details?.is_test ||
            /\[(STRESS_TEST|TEST|BENCHMARK)\]/i.test(b.project_name || '') ||
            /Automated Load Benchmark/i.test(b.project_name || '') ||
            (b.project_name && b.project_name.toLowerCase().startsWith('test'));
          return !isDeleted && !isTest;
        });

        const activeBriefs = allValidBriefs.filter((b: any) => b.status !== 'cancelled' && b.status !== 'cancel');

        let completedAll: any[] = [];
        let completedThisWeek: any[] = [];
        let inProgressTasks: any[] = [];
        let todoTasks: any[] = [];
        let unassignedTasks: any[] = [];
        let cancelledTasks: any[] = [];
        let overdueTasks: any[] = [];

        let creativeCount = 0;
        let contentCount = 0;
        let prCount = 0;
        let internalCount = 0;

        let totalPortfolioSaveCost = 0;
        let totalOwnerCost = 0;
        let totalAssistantCost = 0;
        let tasksWithAssistants = 0;
        let deliveredSaveCost = 0;
        let weeklyDeliveredSaveCost = 0;

        let pmProjects: any[] = [];
        let totalPmRevenue = 0;
        let totalPmCost = 0;
        let totalPmProfit = 0;

        let evaluatedBriefs: any[] = [];

        allValidBriefs.forEach((b: any) => {
          const isCancelled = b.status === 'cancelled' || b.status === 'cancel';
          const isCompleted = b.status === 'completed' || b.status === 'complete';
          const isInProgress = b.status === 'in_progress' || b.status === 'progress';
          const isPending = b.status === 'pending';
          const isUnassigned = isPending && !b.assignee_id;
          const isTodo = isPending && !!b.assignee_id;

          if (isCancelled) cancelledTasks.push(b);
          else if (isCompleted) completedAll.push(b);
          else if (isInProgress) inProgressTasks.push(b);
          else if (isUnassigned) unassignedTasks.push(b);
          else if (isTodo) todoTasks.push(b);

          const dStr = b.details?.publish_date || b.deadline || b.details?.usage_date;
          const dDatePart = dStr ? String(dStr).slice(0, 10) : '';
          if (!isCompleted && !isCancelled && dDatePart && dDatePart < todayStr) {
            overdueTasks.push(b);
          }

          const dist = getTaskFinancialDistribution(b);

          if (!isCancelled) {
            const u = (b.unit || '').toLowerCase();
            if (u === 'creative' || u === 'design') creativeCount++;
            else if (u === 'content') contentCount++;
            else if (u === 'pr') prCount++;
            else if (u === 'internal') internalCount++;
            else internalCount++;

            totalPortfolioSaveCost += dist.totalSaveCost;
            if (dist.ownerShare) totalOwnerCost += dist.ownerShare.save_cost;
            dist.assistantShares.forEach((a: any) => {
              totalAssistantCost += a.save_cost;
            });
            if (dist.assistantShares.length > 0) tasksWithAssistants++;

            if (isCcPmProject(b)) {
              pmProjects.push(b);
              const d = b.details || {};
              const rev = Number(d.revenue || 0);
              const cost = Number(d.cost || 0);
              const profit = d.profit !== undefined && d.profit !== null ? Number(d.profit) : (rev - cost);
              totalPmRevenue += rev;
              totalPmCost += cost;
              if (profit > 0) totalPmProfit += profit;
            }
          }

          if (isCompleted) {
            const sc = dist.totalSaveCost;
            if (!isNaN(sc) && sc > 0) deliveredSaveCost += sc;

            const compTime = new Date(b.completed_at || b.created_at).getTime();
            if (compTime >= sevenDaysAgo) {
              completedThisWeek.push(b);
              if (!isNaN(sc) && sc > 0) weeklyDeliveredSaveCost += sc;
            }

            const satRate = b.details?.satisfaction_rate || b.details?.satisfaction_scores?.averagePercent;
            if (satRate) {
              evaluatedBriefs.push(b);
            }
          }
        });

        // Dynamic Team Dynamics (Turnaround Speed, On-Time Rate, and BOH Index)
        const memberStats = aggregateMemberWorkloadAndFinancials(allValidBriefs, assigneesList);
        const totalTurnaroundDays = memberStats.reduce((sum, m) => sum + (m.totalTurnaroundDays || 0), 0);
        const totalCompletedWithTime = memberStats.reduce((sum, m) => sum + (m.completedTasksWithTime || 0), 0);
        const avgTurnaroundDays = totalCompletedWithTime > 0 ? Number((totalTurnaroundDays / totalCompletedWithTime).toFixed(1)) : 0;
        const totalOnTime = memberStats.reduce((sum, m) => sum + (m.onTimeCompletedCount || 0), 0);
        const totalLate = memberStats.reduce((sum, m) => sum + (m.lateCompletedCount || 0), 0);
        const totalRatedOnTime = totalOnTime + totalLate;
        const teamOnTimeRate = totalRatedOnTime > 0 ? Math.round((totalOnTime / totalRatedOnTime) * 100) : 100;
        const avgBohScore = memberStats.length > 0
          ? Math.round(memberStats.reduce((sum, m) => sum + (m.citizenshipScore || 0), 0) / memberStats.length)
          : 0;

        // Dynamic PM Margin & Status
        const completedPmCount = pmProjects.filter((p: any) => p.status === 'completed' || p.status === 'complete').length;
        const activePmCount = pmProjects.length - completedPmCount;
        const pmMarginPct = totalPmRevenue > 0 ? Math.round((totalPmProfit / totalPmRevenue) * 100) : 0;
        const pmStatusText = completedPmCount > 0 && activePmCount > 0
          ? `(ส่งมอบแล้ว ${completedPmCount} • อยู่ระหว่างดำเนินงาน ${activePmCount} โครงการ)`
          : activePmCount > 0
          ? `(อยู่ระหว่างดำเนินงานทั้ง ${activePmCount} โครงการ)`
          : pmProjects.length > 0
          ? `(ส่งมอบเสร็จสิ้น ${completedPmCount} โครงการ)`
          : '';

        const okrSummary = computeRealtimeMetrics(allValidBriefs, okrConfig, 10, 10);
        const rMap: Record<string, any> = {};
        (okrSummary.krs || []).forEach((k: any) => {
          (k.rResults || []).forEach((r: any) => {
            rMap[r.code] = r;
          });
        });

        const targetR1 = rMap['R1']?.target || 1200;
        const targetR2 = rMap['R2']?.target || 85;
        const targetR3 = rMap['R3']?.target || 350;
        const targetR4 = rMap['R4']?.target || 85;
        const actualR5 = rMap['R5']?.actual || 0;
        const targetR5 = rMap['R5']?.target || 6000000;
        const actualR6 = rMap['R6']?.actual || 0;
        const targetR6 = rMap['R6']?.target || 60000;
        const targetR7 = rMap['R7']?.target || 3000000;
        const targetR8 = rMap['R8']?.target || 1000000;
        const targetR9 = rMap['R9']?.target || 85;
        const totalKR4Target = targetR7 + targetR8;

        const totalTasksCount = allValidBriefs.length;
        const activeTasksCount = activeBriefs.length;
        const teamHeadcount = 12;

        const roundLabel = 'รอบ 16:30 น. (บ่าย 4 โมงครึ่ง • สรุปสิ้นสัปดาห์)';
        let lineMsg = `📊 [CC TEAM • รายงานสรุปผลการดำเนินงานประจำสัปดาห์]\n`;
        lineMsg += `ประจำ${fridayThai} (${roundLabel})\n`;
        lineMsg += `เรียน คณะผู้บริหารและทีมงานสร้างสรรค์และการสื่อสาร (CC) ทุกท่าน 🌸✨\n\n`;

        lineMsg += `สรุปภาพรวมความคืบหน้าการดำเนินงานในรอบสัปดาห์นี้:\n`;
        lineMsg += `• ✅ **ส่งมอบสำเร็จในสัปดาห์นี้:** ${completedThisWeek.length} งาน (สะสมปีนี้ ${completedAll.length} งาน)\n`;
        lineMsg += `• ⚙️ **งานที่อยู่ระหว่างดำเนินการ (In Progress):** ${inProgressTasks.length} งาน\n`;
        lineMsg += `• 📋 **งานในคิวรอเริ่ม (To-Do List):** ${todoTasks.length} งาน\n`;
        lineMsg += `• 📥 **งานรอมอบหมายผู้รับผิดชอบ (Unassigned):** ${unassignedTasks.length} งาน\n`;
        const satAvgStr = okrSummary.totalEvaluatedBriefs > 0 ? `เฉลี่ย ${okrSummary.averageSatisfactionRate}%` : 'ยังไม่มีการประเมินจริง (0%)';
        lineMsg += `• 🌟 **งานที่ได้รับการประเมินความพึงพอใจแล้ว:** ${evaluatedBriefs.length} งาน (${satAvgStr})\n\n`;

        if (completedThisWeek.length > 0) {
          lineMsg += `📌 **ไฮไลต์งานส่งมอบสำเร็จสัปดาห์นี้ (${completedThisWeek.length} งาน):**\n`;
          completedThisWeek.slice(0, 5).forEach((t: any, i: number) => {
            const rawAssignee = (t.assignee_id && assigneeMap[t.assignee_id]) || t.assignees?.name || t.details?.assignee || getAssigneeFallbackName(t.assignee_id) || '';
            const assigneeStr = rawAssignee ? ` • ${formatTag(rawAssignee)}` : '';
            lineMsg += `${i + 1}. **${t.project_name}** [Unit ${(t.unit || '').toUpperCase()}]${assigneeStr}\n`;
          });
          lineMsg += `\n`;
        }

        lineMsg += `📊 **สถานะงานและปริมาณงานสะสมทั้งหมดในระบบ (${totalTasksCount} งาน):**\n`;
        lineMsg += `• 1. 📥 **รอมอบหมาย (Unassigned):** ${unassignedTasks.length} งาน\n`;
        lineMsg += `• 2. 📋 **รอเริ่มดำเนินงาน (To-Do List):** ${todoTasks.length} งาน (รวมรอทำ ${unassignedTasks.length + todoTasks.length} งาน)\n`;
        lineMsg += `• 3. ⚙️ **กำลังดำเนินการ (In Progress):** ${inProgressTasks.length} งาน\n`;
        lineMsg += `• 4. ✅ **ส่งมอบสำเร็จสะสม (Completed):** ${completedAll.length} งาน (สัปดาห์นี้ +${completedThisWeek.length} งาน)\n`;
        lineMsg += `• 5. ⏰ **งานเกินกำหนดส่ง (Overdue):** ${overdueTasks.length} งาน\n`;
        if (cancelledTasks.length > 0) {
          lineMsg += `• 6. 🚫 **งานยกเลิก (Cancelled):** ${cancelledTasks.length} งาน\n`;
        }
        lineMsg += `\n`;

        lineMsg += `📈 **สัดส่วนภาระงานแยกตามสายงาน (Active ${activeTasksCount} งาน):**\n`;
        lineMsg += `• 🎨 Creative Design: ${creativeCount} งาน\n`;
        lineMsg += `• ✍️ Content Creator: ${contentCount} งาน\n`;
        lineMsg += `• 📢 PR & Communication: ${prCount} งาน\n`;
        lineMsg += `• 🏢 บริการและสนับสนุนภายใน (Internal Task): ${internalCount} งาน\n\n`;

        lineMsg += `🛡️ **สรุปมูลค่าประหยัดงบประมาณองค์กร (Save Cost):**\n`;
        lineMsg += `• 🏆 **Save Cost รวมในระบบ (Portfolio Save Cost):** ฿${totalPortfolioSaveCost.toLocaleString()} บาท\n`;
        lineMsg += `   └ งานหลัก: ฿${totalOwnerCost.toLocaleString()} บาท | งานช่วย: ฿${totalAssistantCost.toLocaleString()} บาท (เฉลี่ย ฿${Math.round(totalPortfolioSaveCost / teamHeadcount).toLocaleString()} / คน)\n`;
        lineMsg += `• 💰 **Save Cost งานที่ส่งมอบสำเร็จแล้ว:** ฿${deliveredSaveCost.toLocaleString()} บาท (สัปดาห์นี้ +฿${weeklyDeliveredSaveCost.toLocaleString()} บาท)\n`;
        lineMsg += `*(ประเมินเทียบเท่ามูลค่าตลาดการจ้างผลิตสื่อและคอนเทนต์ภายนอก)*\n\n`;

        lineMsg += `🤝 **งานช่วยเกื้อกูลและประสิทธิภาพทีม (Team Dynamics):**\n`;
        lineMsg += `• 👥 **งานช่วยเกื้อกูล (Cross-Skilling Assist):** ${tasksWithAssistants} งาน (${Math.round((tasksWithAssistants / (activeTasksCount || 1)) * 100)}% ของระบบ • มูลค่างานช่วย ฿${totalAssistantCost.toLocaleString()} บาท)\n`;
        lineMsg += `• ⚡ **ความเร็วส่งมอบเฉลี่ย:** ${avgTurnaroundDays} วัน/งาน | ส่งมอบตรงเวลา ${teamOnTimeRate}%\n`;
        lineMsg += `• 🛡️ **ดัชนีงานหลังบ้านและการมีส่วนร่วม (BOH):** ${avgBohScore} / 100 คะแนน\n\n`;

        lineMsg += `💼 **โครงการที่มีเงินเข้าของ CC (PM โครงการ):**\n`;
        lineMsg += `• โครงการบริหารจัดการ: ${pmProjects.length} โครงการ ${pmStatusText}\n`;
        lineMsg += `• รายรับรวม: ฿${totalPmRevenue.toLocaleString()} บาท | ต้นทุนรวม: ฿${totalPmCost.toLocaleString()} บาท\n`;
        lineMsg += `• 📈 **กำไรโครงการรวม (PM Profit):** ฿${totalPmProfit.toLocaleString()} บาท (Margin ${pmMarginPct}% • ${activePmCount > 0 ? 'รอรับรู้เมื่อส่งมอบเสร็จสิ้น' : 'รับรู้ตามโครงการที่ส่งมอบ'})\n\n`;

        lineMsg += `🎯 **รายละเอียดตัวชี้วัดความสำเร็จ OKR & R รายตัว (Key Results):**\n\n`;

        lineMsg += `🔹 **KR1: จำนวนผลงานภายในองค์กร (น้ำหนัก 60%)**\n`;
        lineMsg += `• **R1 (ผลงานบริการภายใน):** สัปดาห์นี้ ${completedThisWeek.filter((b: any) => !isR3Task(b)).length} งาน | สะสม ${okrSummary.totalInternalTasks} / ${targetR1.toLocaleString()} งาน (${((okrSummary.totalInternalTasks / targetR1) * 100).toFixed(1)}%)\n`;
        const r2Pct = okrSummary.avgInternalSatisfaction || 0;
        const r2Cnt = okrSummary.totalInternalEvaluated || 0;
        const r2Desc = r2Cnt > 0
          ? `**${r2Pct}%** (ประเมินแล้ว ${r2Cnt} งาน • เป้าหมาย ≥ ${targetR2}% • ${r2Pct >= targetR2 ? 'บรรลุตามเกณฑ์' : 'ต่ำกว่าเกณฑ์'})`
          : `**0%** (ยังไม่มีการประเมินจริง • เป้าหมาย ≥ ${targetR2}%)`;
        lineMsg += `• **R2 (ร้อยละความพึงพอใจภายใน):** ${r2Desc}\n\n`;

        lineMsg += `🔹 **KR2: จำนวนผลงานภายนอก มช. และ RSP (น้ำหนัก 10%)**\n`;
        lineMsg += `• **R3 (ผลงานภายนอก มช./RSP):** สัปดาห์นี้ ${completedThisWeek.filter((b: any) => isR3Task(b)).length} งาน | สะสม ${okrSummary.totalExternalTasks} / ${targetR3.toLocaleString()} งาน (${targetR3 > 0 ? ((okrSummary.totalExternalTasks / targetR3) * 100).toFixed(1) : '0.0'}%)\n`;
        const r4Pct = okrSummary.avgExternalSatisfaction || 0;
        const r4Cnt = okrSummary.totalExternalEvaluated || 0;
        const r4Desc = r4Cnt > 0
          ? `**${r4Pct}%** (ประเมินแล้ว ${r4Cnt} งาน • เป้าหมาย ≥ ${targetR4}% • ${r4Pct >= targetR4 ? 'บรรลุตามเกณฑ์' : 'ต่ำกว่าเกณฑ์'})`
          : `0% (ยังไม่มีงานประเมินในรอบนี้ • เป้าหมาย ≥ ${targetR4}%)`;
        lineMsg += `• **R4 (ร้อยละความพึงพอใจภายนอก):** ${r4Desc}\n\n`;

        lineMsg += `🔹 **KR3: มูลค่าการรับรู้ที่องค์กรได้รับ (น้ำหนัก 10%)**\n`;
        lineMsg += `• **R5 (จำนวน Reach สะสม):** ${actualR5.toLocaleString()} / ${targetR5.toLocaleString()} Reach (${targetR5 > 0 ? ((actualR5 / targetR5) * 100).toFixed(1) : '0.0'}%)\n`;
        lineMsg += `• **R6 (จำนวน Engagement สะสม):** ${actualR6.toLocaleString()} / ${targetR6.toLocaleString()} Engagements (${targetR6 > 0 ? ((actualR6 / targetR6) * 100).toFixed(1) : '0.0'}%)\n\n`;

        const realizedProfit = (okrSummary.totalProfitGov || 0) + (okrSummary.totalProfitPrivate || 0);
        const pipelineProfit = (okrSummary.pipelineProfitGov || 0) + (okrSummary.pipelineProfitPrivate || 0);
        lineMsg += `🔹 **KR4: กำไรที่เกิดจากการให้บริการของทีม (เป้าหมายรวม ฿${totalKR4Target.toLocaleString()} บาท • น้ำหนัก 20%)**\n`;
        lineMsg += `• **ผลงานรับรู้จริงสะสม:** ฿${realizedProfit.toLocaleString()} / ฿${totalKR4Target.toLocaleString()} บาท${pipelineProfit > 0 ? ` (กำลังดำเนินงาน Pipeline ฿${pipelineProfit.toLocaleString()} บาท จาก ${pmProjects.length} โครงการ PM)` : ''}\n`;
        lineMsg += `• **R7 (กำไรบริการภาครัฐ):** ฿${(okrSummary.totalProfitGov || 0).toLocaleString()} / ฿${targetR7.toLocaleString()} บาท${(okrSummary.pipelineProfitGov || 0) > 0 ? ` (อยู่ระหว่างดำเนินงาน ฿${(okrSummary.pipelineProfitGov || 0).toLocaleString()} บาท)` : ''}\n`;
        lineMsg += `• **R8 (กำไรบริการภาคเอกชน):** ฿${(okrSummary.totalProfitPrivate || 0).toLocaleString()} / ฿${targetR8.toLocaleString()} บาท${(okrSummary.pipelineProfitPrivate || 0) > 0 ? ` (อยู่ระหว่างดำเนินงาน ฿${(okrSummary.pipelineProfitPrivate || 0).toLocaleString()} บาท)` : ''}\n`;
        const r9Pct = okrSummary.avgServiceSatisfaction || 0;
        const r9Cnt = okrSummary.totalServiceEvaluated || 0;
        const r9Desc = r9Cnt > 0
          ? `**${r9Pct}%** (ประเมินแล้ว ${r9Cnt} งาน • เป้าหมาย ≥ ${targetR9}% • ${r9Pct >= targetR9 ? 'บรรลุตามเกณฑ์' : 'ต่ำกว่าเกณฑ์'})`
          : `0% (ยังไม่มีงานประเมินในรอบนี้ • เป้าหมาย ≥ ${targetR9}%)`;
        lineMsg += `• **R9 (ร้อยละความพึงพอใจงานสร้างรายได้):** ${r9Desc}\n\n`;

        if (evaluatedBriefs.length > 0) {
          lineMsg += `🌟 **ไฮไลต์ผลประเมินความพึงพอใจ (${evaluatedBriefs.length} งานที่ประเมินแล้ว):**\n`;
          evaluatedBriefs.forEach((eb: any, idx: number) => {
            const scores = eb.details?.satisfaction_scores || {};
            const evalBy = scores.evaluatedBy || 'ผู้รับบริการ';
            const evalScore = scores.averagePercent || scores.scorePercent || eb.details?.satisfaction_rate || 100;
            const comment = scores.comment || scores.suggestions || 'พึงพอใจระดับดีเยี่ยม';
            lineMsg += `${idx + 1}. **${eb.project_name}** [Unit ${(eb.unit || '').toUpperCase()}]\n`;
            lineMsg += `   └ คะแนน: **${evalScore}%** (ประเมินโดย: ${evalBy})\n`;
            if (comment && comment !== 'ไม่มีข้อเสนอแนะเพิ่มเติม') {
              lineMsg += `   └ ความคิดเห็น: *"${comment}"*\n`;
            }
          });
          lineMsg += `\n`;
        }

        lineMsg += `💡 **บทวิเคราะห์สั้นๆ ฝ่ายบริหาร (Executive Weekly Insights):**\n`;
        const insightSatStr = evaluatedBriefs.length > 0
          ? `คุณภาพผลงานได้รับการประเมินเฉลี่ย ${okrSummary.averageSatisfactionRate}% จาก ${evaluatedBriefs.length} งานที่ส่งแบบประเมินกลับมา`
          : `ยังไม่มีแบบประเมินความพึงพอใจส่งกลับมาในรอบนี้ (0%)`;
        lineMsg += `• **อัตราเร่งงาน (Velocity):** สัปดาห์นี้ส่งมอบงานสำเร็จแล้ว ${completedThisWeek.length} งาน ${insightSatStr}\n`;
        lineMsg += `• **มูลค่าความคุ้มค่า (Value & Save Cost):** สร้างมูลค่า Save Cost รวมในระบบ ฿${totalPortfolioSaveCost.toLocaleString()} บาท (ส่งมอบแล้ว ฿${deliveredSaveCost.toLocaleString()} บาท) โดยมีโครงการสร้างรายได้และกำไร (PM) มูลค่ากำไรรวม ฿${totalPmProfit.toLocaleString()} บาท\n`;
        lineMsg += `• **จุดโฟกัสสัปดาห์ถัดไป:** มีงานรอมอบหมาย (Unassigned) ${unassignedTasks.length} งาน และงานคิวรอทำ (To-Do) ${todoTasks.length} งาน${overdueTasks.length > 0 ? ` (รวมถึงงานเกินกำหนดส่ง ${overdueTasks.length} งาน)` : ''} ควรรีบกระจายงานเพื่อป้องกันงานสะสมและรักษาอัตราส่งตรงเวลา\n\n`;

        lineMsg += `🔗 ตรวจสอบรายละเอียดและ Executive Insights:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://ccteam.vercel.app'}/dashboard?view=dashboards\n`;
        lineMsg += `\n💬 **ต้องการสอบถามข้อมูลหรือเจาะลึกสถิติงานเพิ่มเติม?**\n`;
        lineMsg += `• กด **Reply (ตอบกลับ)** ที่ข้อความของน้อง CC นี้ได้เลยครับ\n`;
        lineMsg += `• หรือพิมพ์ **"น้อง CC [คำถาม]"** หรือ **@น้อง CC** ในกลุ่มได้ตลอดเวลาครับ 🤖✨\n\n`;
        lineMsg += `ขอให้คณะผู้บริหารและพี่ๆ ทุกท่านมีความสุขในวันศุกร์และสุดสัปดาห์นี้ครับ! 🌿☕`;

        const targetId = execGroupId || notyGroupId;
        const pushRes = await pushLineMessage(targetId, lineMsg);

        return NextResponse.json({
          success: true,
          message: `จัดส่งรายงานประจำสัปดาห์ (วันศุกร์ 16:30 น.) เข้ากลุ่ม LINE CC TEAM เรียบร้อยแล้ว`,
          lineSent: pushRes.ok,
          completedCount: completedThisWeek.length,
          inProgressCount: inProgressTasks.length
        });
      }
    }

    // 4.1 Automated Monthly Performance Summary for CC TEAM (Pushed on Last Workday 09:00 AM)
    else if (action === 'monthly_performance_summary') {
      const supabase = getSupabase();
      const bkkNow = getBangkokNow();
      const todayStr = getBangkokDateStr(bkkNow);
      const thaiMonthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const monthNameThai = thaiMonthNames[bkkNow.getMonth()];
      const yearThai = bkkNow.getFullYear() + 543;
      const currentMonthIndex = bkkNow.getMonth();
      const currentYear = bkkNow.getFullYear();

      let okrConfig: any = null;
      let rawBriefs: any[] = [];
      const assigneesList: { id: string; name: string; unit?: string }[] = [];

      if (supabase) {
        try {
          const { data: okrRow } = await supabase
            .from('okr_settings')
            .select('target_value')
            .eq('description', 'CONFIG_OKR_STATE_JSON')
            .maybeSingle();
          if (okrRow?.target_value) {
            okrConfig = JSON.parse(okrRow.target_value);
          }
        } catch (e) {
          console.warn("Could not parse manual okr metrics:", e);
        }

        try {
          const { data: dbAssignees } = await supabase.from('assignees').select('id, name, unit');
          if (Array.isArray(dbAssignees)) {
            dbAssignees.forEach((a: any) => {
              if (a?.id && a?.name) {
                assigneesList.push({ id: a.id, name: a.name, unit: a.unit });
              }
            });
          }
        } catch (e) {}

        const { data: briefsData } = await supabase
          .from('briefs')
          .select('*')
          .neq('status', 'purged');
        rawBriefs = briefsData || [];
      }

      CORE_OPERATIONAL_MEMBERS.forEach((cm) => {
        if (!assigneesList.some((a) => a.id === cm.id || a.name.trim() === cm.name.trim())) {
          assigneesList.push({ id: cm.id, name: cm.name, unit: cm.unit });
        }
      });

      // IRONCLAD DATA INTEGRITY: Exclude soft-deleted and test/stress/benchmark briefs
      const allValidBriefs = rawBriefs.filter((b: any) => {
        const isDeleted = b.details?.is_deleted || b.details?.is_permanently_deleted;
        const isTest = b.details?.is_test ||
          /\[(STRESS_TEST|TEST|BENCHMARK)\]/i.test(b.project_name || '') ||
          /Automated Load Benchmark/i.test(b.project_name || '') ||
          (b.project_name && b.project_name.toLowerCase().startsWith('test'));
        return !isDeleted && !isTest;
      });

      const activeBriefs = allValidBriefs.filter((b: any) => b.status !== 'cancelled' && b.status !== 'cancel');

      let completedAll: any[] = [];
      let completedThisMonth: any[] = [];
      let inProgressTasks: any[] = [];
      let todoTasks: any[] = [];
      let unassignedTasks: any[] = [];
      let cancelledTasks: any[] = [];
      let overdueTasks: any[] = [];

      let creativeCount = 0;
      let contentCount = 0;
      let prCount = 0;
      let internalCount = 0;

      let totalPortfolioSaveCost = 0;
      let totalOwnerCost = 0;
      let totalAssistantCost = 0;
      let tasksWithAssistants = 0;
      let deliveredSaveCost = 0;
      let monthlyDeliveredSaveCost = 0;

      let pmProjects: any[] = [];
      let totalPmRevenue = 0;
      let totalPmCost = 0;
      let totalPmProfit = 0;

      let evaluatedBriefs: any[] = [];

      allValidBriefs.forEach((b: any) => {
        const isCancelled = b.status === 'cancelled' || b.status === 'cancel';
        const isCompleted = b.status === 'completed' || b.status === 'complete';
        const isInProgress = b.status === 'in_progress' || b.status === 'progress';
        const isPending = b.status === 'pending';
        const isUnassigned = isPending && !b.assignee_id;
        const isTodo = isPending && !!b.assignee_id;

        if (isCancelled) cancelledTasks.push(b);
        else if (isCompleted) completedAll.push(b);
        else if (isInProgress) inProgressTasks.push(b);
        else if (isUnassigned) unassignedTasks.push(b);
        else if (isTodo) todoTasks.push(b);

        const dStr = b.details?.publish_date || b.deadline || b.details?.usage_date;
        const dDatePart = dStr ? String(dStr).slice(0, 10) : '';
        if (!isCompleted && !isCancelled && dDatePart && dDatePart < todayStr) {
          overdueTasks.push(b);
        }

        const dist = getTaskFinancialDistribution(b);

        if (!isCancelled) {
          const u = (b.unit || '').toLowerCase();
          if (u === 'creative' || u === 'design') creativeCount++;
          else if (u === 'content') contentCount++;
          else if (u === 'pr') prCount++;
          else if (u === 'internal') internalCount++;
          else internalCount++;

          totalPortfolioSaveCost += dist.totalSaveCost;
          if (dist.ownerShare) totalOwnerCost += dist.ownerShare.save_cost;
          dist.assistantShares.forEach((a: any) => {
            totalAssistantCost += a.save_cost;
          });
          if (dist.assistantShares.length > 0) tasksWithAssistants++;

          if (isCcPmProject(b)) {
            pmProjects.push(b);
            const d = b.details || {};
            const rev = Number(d.revenue || 0);
            const cost = Number(d.cost || 0);
            const profit = d.profit !== undefined && d.profit !== null ? Number(d.profit) : (rev - cost);
            totalPmRevenue += rev;
            totalPmCost += cost;
            if (profit > 0) totalPmProfit += profit;
          }
        }

        if (isCompleted) {
          const sc = dist.totalSaveCost;
          if (!isNaN(sc) && sc > 0) deliveredSaveCost += sc;

          const compDate = new Date(new Date(b.completed_at || b.created_at).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
          if (compDate.getMonth() === currentMonthIndex && compDate.getFullYear() === currentYear) {
            completedThisMonth.push(b);
            if (!isNaN(sc) && sc > 0) monthlyDeliveredSaveCost += sc;
          }

          const satRate = b.details?.satisfaction_rate || b.details?.satisfaction_scores?.averagePercent;
          if (satRate) {
            evaluatedBriefs.push(b);
          }
        }
      });

      // Dynamic Team Dynamics (Turnaround Speed, On-Time Rate, and BOH Index)
      const memberStats = aggregateMemberWorkloadAndFinancials(allValidBriefs, assigneesList);
      const totalTurnaroundDays = memberStats.reduce((sum, m) => sum + (m.totalTurnaroundDays || 0), 0);
      const totalCompletedWithTime = memberStats.reduce((sum, m) => sum + (m.completedTasksWithTime || 0), 0);
      const avgTurnaroundDays = totalCompletedWithTime > 0 ? Number((totalTurnaroundDays / totalCompletedWithTime).toFixed(1)) : 0;
      const totalOnTime = memberStats.reduce((sum, m) => sum + (m.onTimeCompletedCount || 0), 0);
      const totalLate = memberStats.reduce((sum, m) => sum + (m.lateCompletedCount || 0), 0);
      const totalRatedOnTime = totalOnTime + totalLate;
      const teamOnTimeRate = totalRatedOnTime > 0 ? Math.round((totalOnTime / totalRatedOnTime) * 100) : 100;
      const avgBohScore = memberStats.length > 0
        ? Math.round(memberStats.reduce((sum, m) => sum + (m.citizenshipScore || 0), 0) / memberStats.length)
        : 0;

      const completedPmCount = pmProjects.filter((p: any) => p.status === 'completed' || p.status === 'complete').length;
      const activePmCount = pmProjects.length - completedPmCount;
      const pmMarginPct = totalPmRevenue > 0 ? Math.round((totalPmProfit / totalPmRevenue) * 100) : 0;

      const okrSummary = computeRealtimeMetrics(allValidBriefs, okrConfig, 10, 10);
      const rMap: Record<string, any> = {};
      (okrSummary.krs || []).forEach((k: any) => {
        (k.rResults || []).forEach((r: any) => {
          rMap[r.code] = r;
        });
      });

      const targetR1 = rMap['R1']?.target || 1200;
      const targetR2 = rMap['R2']?.target || 85;
      const targetR3 = rMap['R3']?.target || 350;
      const targetR4 = rMap['R4']?.target || 85;
      const actualR5 = rMap['R5']?.actual || 0;
      const targetR5 = rMap['R5']?.target || 6000000;
      const actualR6 = rMap['R6']?.actual || 0;
      const targetR6 = rMap['R6']?.target || 60000;
      const targetR7 = rMap['R7']?.target || 3000000;
      const targetR8 = rMap['R8']?.target || 1000000;
      const targetR9 = rMap['R9']?.target || 85;
      const totalKR4Target = targetR7 + targetR8;

      const totalTasksCount = allValidBriefs.length;
      const activeTasksCount = activeBriefs.length;
      const teamHeadcount = 12;

      let lineMsg = `🏆 [CC TEAM • สรุปผลการดำเนินงานประจำเดือน ${monthNameThai} ${yearThai}]\n`;
      lineMsg += `เรียน คณะผู้บริหารและทีมสร้างสรรค์และการสื่อสาร (CC) ทุกท่าน 🌸✨\n\n`;

      lineMsg += `สรุปภาพรวมผลการดำเนินงานตลอดเดือนที่ผ่านมา:\n`;
      lineMsg += `• 📦 **จำนวนงานทั้งหมดในระบบ:** ${totalTasksCount} งาน (งานที่กำลังดำเนินงาน/รอทำ ${activeTasksCount} งาน)\n`;
      lineMsg += `• ✅ **ส่งมอบสำเร็จสะสม (Completed):** ${completedAll.length} งาน (เดือนนี้ +${completedThisMonth.length} งาน)\n`;
      lineMsg += `• ⚙️ **งานที่อยู่ระหว่างดำเนินการ (In Progress):** ${inProgressTasks.length} งาน\n`;
      lineMsg += `• 📋 **งานในคิวรอเริ่ม (To-Do List):** ${todoTasks.length} งาน | 📥 **รอมอบหมาย:** ${unassignedTasks.length} งาน\n`;
      lineMsg += `• ⏰ **งานเกินกำหนดส่ง (Overdue):** ${overdueTasks.length} งาน\n`;
      if (cancelledTasks.length > 0) {
        lineMsg += `• 🚫 **งานยกเลิก (Cancelled):** ${cancelledTasks.length} งาน\n`;
      }
      lineMsg += `\n`;

      lineMsg += `📊 **สัดส่วนภาระงานแยกตามสายงาน (Active ${activeTasksCount} งาน):**\n`;
      lineMsg += `• 🎨 Creative Design: ${creativeCount} งาน\n`;
      lineMsg += `• ✍️ Content Creator: ${contentCount} งาน\n`;
      lineMsg += `• 📢 PR & Communication: ${prCount} งาน\n`;
      lineMsg += `• 🏢 บริการและสนับสนุนภายใน (Internal Task): ${internalCount} งาน\n\n`;

      lineMsg += `🛡️ **สรุปมูลค่าประหยัดงบประมาณองค์กร (Save Cost):**\n`;
      lineMsg += `• 🏆 **Save Cost รวมในระบบ (Portfolio Save Cost):** ฿${totalPortfolioSaveCost.toLocaleString()} บาท\n`;
      lineMsg += `   └ งานหลัก: ฿${totalOwnerCost.toLocaleString()} บาท | งานช่วย: ฿${totalAssistantCost.toLocaleString()} บาท (เฉลี่ย ฿${Math.round(totalPortfolioSaveCost / teamHeadcount).toLocaleString()} / คน)\n`;
      lineMsg += `• 💰 **Save Cost งานที่ส่งมอบสำเร็จแล้ว:** ฿${deliveredSaveCost.toLocaleString()} บาท (เดือนนี้ +฿${monthlyDeliveredSaveCost.toLocaleString()} บาท)\n`;
      lineMsg += `*(ประเมินเทียบเท่ามูลค่าตลาดการจ้างผลิตสื่อและคอนเทนต์ภายนอก)*\n\n`;

      lineMsg += `🤝 **งานช่วยเกื้อกูลและประสิทธิภาพทีม (Team Dynamics):**\n`;
      lineMsg += `• 👥 **งานช่วยเกื้อกูล (Cross-Skilling Assist):** ${tasksWithAssistants} งาน (${Math.round((tasksWithAssistants / (activeTasksCount || 1)) * 100)}% ของระบบ • มูลค่างานช่วย ฿${totalAssistantCost.toLocaleString()} บาท)\n`;
      lineMsg += `• ⚡ **ความเร็วส่งมอบเฉลี่ย:** ${avgTurnaroundDays} วัน/งาน | ส่งมอบตรงเวลา ${teamOnTimeRate}%\n`;
      lineMsg += `• 🛡️ **ดัชนีงานหลังบ้านและการมีส่วนร่วม (BOH):** ${avgBohScore} / 100 คะแนน\n\n`;

      lineMsg += `💼 **โครงการที่มีเงินเข้าของ CC (PM โครงการ):**\n`;
      lineMsg += `• โครงการบริหารจัดการ: ${pmProjects.length} โครงการ\n`;
      lineMsg += `• รายรับรวม: ฿${totalPmRevenue.toLocaleString()} บาท | ต้นทุนรวม: ฿${totalPmCost.toLocaleString()} บาท\n`;
      lineMsg += `• 📈 **กำไรโครงการรวม (PM Profit):** ฿${totalPmProfit.toLocaleString()} บาท (Margin ${pmMarginPct}% • ${activePmCount > 0 ? 'รอรับรู้เมื่อส่งมอบเสร็จสิ้น' : 'รับรู้ตามโครงการที่ส่งมอบ'})\n\n`;

      lineMsg += `🎯 **รายละเอียดตัวชี้วัดความสำเร็จ OKR & R รายตัว (Key Results):**\n\n`;

      lineMsg += `🔹 **KR1: จำนวนผลงานภายในองค์กร (น้ำหนัก 60%)**\n`;
      lineMsg += `• **R1 (ผลงานบริการภายใน):** เดือนนี้ ${completedThisMonth.filter((b: any) => !isR3Task(b)).length} งาน | สะสม ${okrSummary.totalInternalTasks} / ${targetR1.toLocaleString()} งาน (${((okrSummary.totalInternalTasks / targetR1) * 100).toFixed(1)}%)\n`;
      const monthR2Pct = okrSummary.avgInternalSatisfaction || 0;
      const monthR2Cnt = okrSummary.totalInternalEvaluated || 0;
      const monthR2Desc = monthR2Cnt > 0
        ? `**${monthR2Pct}%** (ประเมินแล้ว ${monthR2Cnt} งาน • เป้าหมาย ≥ ${targetR2}% • ${monthR2Pct >= targetR2 ? 'บรรลุตามเกณฑ์' : 'ต่ำกว่าเกณฑ์'})`
        : `**0%** (ยังไม่มีการประเมินจริง • เป้าหมาย ≥ ${targetR2}%)`;
      lineMsg += `• **R2 (ร้อยละความพึงพอใจภายใน):** ${monthR2Desc}\n\n`;

      lineMsg += `🔹 **KR2: จำนวนผลงานภายนอก มช. และ RSP (น้ำหนัก 10%)**\n`;
      lineMsg += `• **R3 (ผลงานภายนอก มช./RSP):** เดือนนี้ ${completedThisMonth.filter((b: any) => isR3Task(b)).length} งาน | สะสม ${okrSummary.totalExternalTasks} / ${targetR3.toLocaleString()} งาน (${targetR3 > 0 ? ((okrSummary.totalExternalTasks / targetR3) * 100).toFixed(1) : '0.0'}%)\n`;
      const monthR4Pct = okrSummary.avgExternalSatisfaction || 0;
      const monthR4Cnt = okrSummary.totalExternalEvaluated || 0;
      const monthR4Desc = monthR4Cnt > 0
        ? `**${monthR4Pct}%** (ประเมินแล้ว ${monthR4Cnt} งาน • เป้าหมาย ≥ ${targetR4}% • ${monthR4Pct >= targetR4 ? 'บรรลุตามเกณฑ์' : 'ต่ำกว่าเกณฑ์'})`
        : `0% (ยังไม่มีงานประเมินในรอบนี้ • เป้าหมาย ≥ ${targetR4}%)`;
      lineMsg += `• **R4 (ร้อยละความพึงพอใจภายนอก):** ${monthR4Desc}\n\n`;

      lineMsg += `🔹 **KR3: มูลค่าการรับรู้ที่องค์กรได้รับ (น้ำหนัก 10%)**\n`;
      lineMsg += `• **R5 (จำนวน Reach สะสม):** ${actualR5.toLocaleString()} / ${targetR5.toLocaleString()} Reach (${targetR5 > 0 ? ((actualR5 / targetR5) * 100).toFixed(1) : '0.0'}%)\n`;
      lineMsg += `• **R6 (จำนวน Engagement สะสม):** ${actualR6.toLocaleString()} / ${targetR6.toLocaleString()} Engagements (${targetR6 > 0 ? ((actualR6 / targetR6) * 100).toFixed(1) : '0.0'}%)\n\n`;

      const monthRealizedProfit = (okrSummary.totalProfitGov || 0) + (okrSummary.totalProfitPrivate || 0);
      const monthPipelineProfit = (okrSummary.pipelineProfitGov || 0) + (okrSummary.pipelineProfitPrivate || 0);
      lineMsg += `🔹 **KR4: กำไรที่เกิดจากการให้บริการของทีม (เป้าหมายรวม ฿${totalKR4Target.toLocaleString()} บาท • น้ำหนัก 20%)**\n`;
      lineMsg += `• **ผลงานรับรู้จริงสะสม:** ฿${monthRealizedProfit.toLocaleString()} / ฿${totalKR4Target.toLocaleString()} บาท${monthPipelineProfit > 0 ? ` (กำลังดำเนินงาน Pipeline ฿${monthPipelineProfit.toLocaleString()} บาท จาก ${pmProjects.length} โครงการ PM)` : ''}\n`;
      lineMsg += `• **R7 (กำไรบริการภาครัฐ):** ฿${(okrSummary.totalProfitGov || 0).toLocaleString()} / ฿${targetR7.toLocaleString()} บาท${(okrSummary.pipelineProfitGov || 0) > 0 ? ` (อยู่ระหว่างดำเนินงาน ฿${(okrSummary.pipelineProfitGov || 0).toLocaleString()} บาท)` : ''}\n`;
      lineMsg += `• **R8 (กำไรบริการภาคเอกชน):** ฿${(okrSummary.totalProfitPrivate || 0).toLocaleString()} / ฿${targetR8.toLocaleString()} บาท${(okrSummary.pipelineProfitPrivate || 0) > 0 ? ` (อยู่ระหว่างดำเนินงาน ฿${(okrSummary.pipelineProfitPrivate || 0).toLocaleString()} บาท)` : ''}\n`;
      const monthR9Pct = okrSummary.avgServiceSatisfaction || 0;
      const monthR9Cnt = okrSummary.totalServiceEvaluated || 0;
      const monthR9Desc = monthR9Cnt > 0
        ? `**${monthR9Pct}%** (ประเมินแล้ว ${monthR9Cnt} งาน • เป้าหมาย ≥ ${targetR9}% • ${monthR9Pct >= targetR9 ? 'บรรลุตามเกณฑ์' : 'ต่ำกว่าเกณฑ์'})`
        : `0% (ยังไม่มีงานประเมินในรอบนี้ • เป้าหมาย ≥ ${targetR9}%)`;
      lineMsg += `• **R9 (ร้อยละความพึงพอใจงานสร้างรายได้):** ${monthR9Desc}\n\n`;

      if (evaluatedBriefs.length > 0) {
        lineMsg += `🌟 **ไฮไลต์ผลประเมินความพึงพอใจ (${evaluatedBriefs.length} งานที่ประเมินแล้ว):**\n`;
        evaluatedBriefs.forEach((eb: any, idx: number) => {
          const scores = eb.details?.satisfaction_scores || {};
          const evalBy = scores.evaluatedBy || 'ผู้รับบริการ';
          const evalScore = scores.averagePercent || scores.scorePercent || eb.details?.satisfaction_rate || 100;
          const comment = scores.comment || scores.suggestions || 'พึงพอใจระดับดีเยี่ยม';
          lineMsg += `${idx + 1}. **${eb.project_name}** [Unit ${(eb.unit || '').toUpperCase()}]\n`;
          lineMsg += `   └ คะแนน: **${evalScore}%** (ประเมินโดย: ${evalBy})\n`;
          if (comment && comment !== 'ไม่มีข้อเสนอแนะเพิ่มเติม') {
            lineMsg += `   └ ความคิดเห็น: *"${comment}"*\n`;
          }
        });
        lineMsg += `\n`;
      }

      lineMsg += `🧭 **การวิเคราะห์สถานการณ์ทีมเชิงลึก (Strategic Insights):**\n`;
      lineMsg += `• **สถานการณ์ทีม:** กำลังคนในทีม ${teamHeadcount} ท่าน มีงานส่งมอบสะสม ${completedAll.length} งาน สร้างมูลค่า Save Cost รวม ฿${totalPortfolioSaveCost.toLocaleString()} บาท (ส่งมอบแล้ว ฿${deliveredSaveCost.toLocaleString()} บาท)\n`;
      const satHighlight = okrSummary.totalEvaluatedBriefs > 0
        ? `ความพึงพอใจเฉลี่ย ${okrSummary.averageSatisfactionRate}% (${evaluatedBriefs.length} งานประเมิน)`
        : `ยังไม่มีผลประเมินความพึงพอใจส่งกลับมา (0%)`;
      lineMsg += `• **จุดแข็ง:** ${satHighlight} มีวัฒนธรรมงานช่วยเกื้อกูล (Cross-Skilling) ถึง ${tasksWithAssistants} งาน (${Math.round((tasksWithAssistants / (activeTasksCount || 1)) * 100)}%)\n`;
      lineMsg += `• **จุดโฟกัสและแนวทางพัฒนา:** มีงานรอจัดสรรและรอทำรวม ${unassignedTasks.length + todoTasks.length} งาน (Unassigned ${unassignedTasks.length} • To-Do ${todoTasks.length}) และงานเกินกำหนด ${overdueTasks.length} งาน ควรกระจายงานตาม Lead Time และติดตามงานอย่างใกล้ชิด\n\n`;

      lineMsg += `🔗 ตรวจสอบรายงานเชิงลึกและ OKRs/KPIs ทีม:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://ccteam.vercel.app'}/dashboard?view=dashboards\n`;
      lineMsg += `\n💬 **ต้องการสอบถามข้อมูลหรือเจาะลึกสถิติงานเพิ่มเติม?**\n`;
      lineMsg += `• กด **Reply (ตอบกลับ)** ที่ข้อความของน้อง CC นี้ได้เลยครับ\n`;
      lineMsg += `• หรือพิมพ์ **"น้อง CC [คำถาม]"** หรือ **@น้อง CC** ในกลุ่มได้ตลอดเวลาครับ 🤖✨\n\n`;
      lineMsg += `ขอบคุณทีมงานทุกท่านที่ร่วมสร้างสรรค์ผลงานอย่างเต็มที่ครับ! 💪✨`;

      const targetId = execGroupId || notyGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: `จัดส่งสรุปผลการดำเนินงานประจำเดือน ${monthNameThai} ${yearThai} เข้ากลุ่ม LINE สำเร็จ`,
        lineSent: pushRes.ok,
        targetGroup: execGroupId ? 'CC TEAM' : 'Fallback Group'
      });
    }

    // 5. Satisfaction Survey / Task Completed (Branded in the name of CC TEAM without individual names)
    else if (action === 'task_completed' || action === 'satisfaction_survey_dispatch') {
      const { requesterEmail, requesterName, briefId, assigneeId } = body;

      let pName = projectName || '';
      let pTeam = body.department || body.team || '';
      let pCoordinator = requesterName || body.coordinator || '';
      let targetEmail = requesterEmail || body.requester_email || '';
      let targetAssigneeId = assigneeId || body.assignee_id || '';

      const supabase = getSupabase();
      if (supabase && briefId) {
        try {
          const { data: b } = await supabase.from('briefs').select('project_name, decision_maker, coordinator_nickname, details, status, unit, requester_email, assignee_id').eq('id', briefId).single();
          if (b) {
            // Auto-heal status check: If status is not yet 'completed', update it to 'completed' in Supabase to eliminate race conditions
            if (b.status && b.status !== 'completed') {
              console.log(`[SURVEY EMAIL AUTO-HEAL] Task ${briefId} status was '${b.status}'. Updating status to 'completed' to guarantee email delivery.`);
              await supabase.from('briefs').update({
                status: 'completed',
                completed_at: new Date().toISOString()
              }).eq('id', briefId);
            }

            if (!pName) pName = b.project_name || '';
            if (!pTeam) pTeam = b.decision_maker || b.details?.team || '';
            if (!pCoordinator) pCoordinator = b.coordinator_nickname || '';
            if (!targetEmail) targetEmail = b.requester_email || b.details?.requester_email || '';
            if (!targetAssigneeId) targetAssigneeId = b.assignee_id || '';
          }
        } catch (e) {}
      }

      if (!targetEmail || targetEmail === 'internal@step.cmu.ac.th' || targetEmail === 'requester@step.cmu.ac.th') {
        targetEmail = 'adchanapong@step.cmu.ac.th';
      }
      
      // Obfuscated survey URL with pre-filled parameters so PM does not need to retype anything
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const origin = `${protocol}://${host}`;
      const baseSurveyUrl = getTaskSurveyUrl(briefId || '', targetAssigneeId, origin);
      const urlObj = new URL(baseSurveyUrl);
      if (pName) urlObj.searchParams.set('p', pName);
      if (pTeam) urlObj.searchParams.set('team', pTeam);
      if (pCoordinator) urlObj.searchParams.set('by', `PM / คุณ${pCoordinator}`);
      const surveyUrl = urlObj.toString();

      const emailSubject = `[CC TEAM] ขอความอนุเคราะห์ประเมินความพึงพอใจการให้บริการ สำหรับงาน: ${pName || 'ชิ้นงาน'}`;
      const emailSender = `CC TEAM (ทีมสร้างสรรค์และการสื่อสาร CMU STeP) <adchanapong@step.cmu.ac.th>`;
      const ccEmails = ['wasita@step.cmu.ac.th', 'adchanapong@step.cmu.ac.th']; // วา, จ๊อบ
      const emailBody = `เรียน ผู้สั่งงาน / ผู้ดูแลโครงการ (PM)

ทางทีมสร้างสรรค์และการสื่อสาร (CC TEAM) ขอขอบพระคุณเป็นอย่างยิ่งที่ท่านได้มอบความไว้วางใจให้ทีมงานร่วมจัดทำชิ้นงาน "${pName || 'ชิ้นงาน'}"

เพื่อให้การบริการของทีม CC TEAM มีมาตรฐานและสามารถตอบสนองความต้องการของท่านได้อย่างดียิ่งขึ้นอย่างต่อเนื่อง ทางทีมงานขอความอนุเคราะห์ท่านสละเวลาสั้นๆ ประมาณ 1 นาที ในการทำแบบประเมินความพึงพอใจการให้บริการ (5 มิติ)

🔗 ลิงก์แบบประเมินความพึงพอใจ:
${surveyUrl}

* หมายเหตุ: ระบบได้กรอกข้อมูลชิ้นงานและสังกัดของท่านจากระบบไว้เรียบร้อยแล้ว ท่านสามารถประเมิน 5 มิติและส่งได้ทันที โดยแบบประเมินนี้จัดส่งในนามภาพรวมทีม CC TEAM และผลการประเมินจะถูกนำไปใช้เพื่อยกระดับคุณภาพงานบริการของทีมต่อไป

ขอแสดงความนับถือ,
ทีมงานสร้างสรรค์และการสื่อสาร (CC TEAM)
อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)`;

      // Backend Email Dispatch via Nodemailer (if SMTP configured)
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      let emailSendResult: { simulated: boolean; messageId?: string; error?: string } = { simulated: true };

      if (smtpHost && smtpUser && smtpPass && targetEmail && targetEmail.includes('@') && !targetEmail.includes('requester@step.cmu.ac.th')) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const formattedText = (emailBody || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');

          const emailHtmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="margin-bottom: 24px;">
    ${formattedText}
  </div>
  <div style="margin: 28px 0; text-align: center;">
    <a href="${surveyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      ⭐ ทำแบบประเมินความพึงพอใจ 5 มิติ (ใช้เวลา 1 นาที)
    </a>
  </div>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
    <tr>
      <td style="width: 58px; vertical-align: middle; padding-right: 14px;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #2563eb; color: #ffffff; font-weight: bold; font-size: 18px; line-height: 52px; text-align: center; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          CC
        </div>
      </td>
      <td style="vertical-align: middle;">
        <div style="font-weight: bold; font-size: 14px; color: #0f172a;">ทีมสร้างสรรค์และการสื่อสาร (CC TEAM)</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Creative &amp; Communication Team</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)</div>
      </td>
    </tr>
  </table>
</div>`;

          const sendInfo = await transporter.sendMail({
            from: `"CC TEAM (ทีมสร้างสรรค์และการสื่อสาร CMU STeP)" <${smtpUser}>`,
            replyTo: 'adchanapong@step.cmu.ac.th',
            to: targetEmail,
            cc: ccEmails,
            subject: emailSubject,
            text: emailBody,
            html: emailHtmlBody,
          });

          emailSendResult = { simulated: false, messageId: sendInfo.messageId };
          console.log(`[COMPLETED & SURVEY EMAIL LIVE SENT] Message ID: ${sendInfo.messageId}`);
        } catch (mailErr: any) {
          console.error(`[COMPLETED & SURVEY EMAIL SMTP ERROR]`, mailErr);
          emailSendResult = { simulated: false, error: mailErr.message };
        }
      }

      // Update brief survey status in Supabase if briefId exists
      if (supabase && briefId) {
        try {
          const { data: b } = await supabase.from('briefs').select('details').eq('id', briefId).single();
          if (b) {
            const updatedDetails = {
              ...(b.details || {}),
              survey_status: 'sent',
              survey_sent_at: new Date().toISOString(),
              completed_email_to: targetEmail,
              completed_email_simulated: emailSendResult.simulated,
              ...(emailSendResult.messageId ? { completed_email_msg_id: emailSendResult.messageId } : {})
            };
            await supabase.from('briefs').update({ details: updatedDetails }).eq('id', briefId);
          }
        } catch (e) {
          console.error('Error updating brief survey_status:', e);
        }
      }

      console.log(`[SATISFACTION SURVEY DISPATCHED IN THE NAME OF CC TEAM]
To: ${targetEmail}
CC: ${ccEmails.join(', ')}
From: ${emailSender}
Subject: ${emailSubject}
Survey URL: ${surveyUrl}`);

      return NextResponse.json({
        success: true,
        message: `จัดส่งแบบประเมินความพึงพอใจในนามทีม CC TEAM ไปยังอีเมลผู้สั่งงาน (${targetEmail}) และ CC จ๊อบ, วา เรียบร้อยแล้ว`,
        task: pName || projectName,
        sender: emailSender,
        recipient: targetEmail,
        cc: ccEmails,
        surveyUrl,
        emailResult: emailSendResult,
        dispatchTime: new Date().toISOString()
      });
    }

    // 5.1 Kickoff & In Progress Email Dispatch (Sent to PM, Assignee, Team Lead, and Assistant Lead)
    else if (action === 'kickoff_in_progress_email') {
      const { to, cc, subject, body: emailBodyText, briefId, taskCode, assigneeName, from, senderName } = body;
      let targetTo = to;
      if (!targetTo || targetTo === 'internal@step.cmu.ac.th' || targetTo === 'requester@step.cmu.ac.th') {
        targetTo = 'adchanapong@step.cmu.ac.th';
      }

      console.log(`=========================================`);
      console.log(`[KICKOFF IN-PROGRESS EMAIL DISPATCH]`);
      console.log(`Task Code: ${taskCode || 'CC-TASK'}`);
      console.log(`From: ${senderName || assigneeName || 'ผู้รับผิดชอบงาน CC'} <${from || 'cc@step.cmu.ac.th'}>`);
      console.log(`To: ${targetTo}`);
      console.log(`CC: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
      console.log(`Subject: ${subject}`);
      console.log(`Assignee: ${assigneeName || 'ทีม CC'}`);
      console.log(`=========================================`);

      // Backend Email Dispatch via Nodemailer (Approach 1: Automated Server Dispatch)
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      let emailSendResult: { simulated: boolean; messageId?: string; error?: string } = { simulated: true };

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const formattedText = (emailBodyText || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');

          const emailHtmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="margin-bottom: 24px;">
    ${formattedText}
  </div>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
    <tr>
      <td style="width: 58px; vertical-align: middle; padding-right: 14px;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #f37135; color: #ffffff; font-weight: bold; font-size: 18px; line-height: 52px; text-align: center; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          ${(senderName || assigneeName || 'CC').slice(0, 2)}
        </div>
      </td>
      <td style="vertical-align: middle;">
        <div style="font-weight: bold; font-size: 14px; color: #0f172a;">${senderName || assigneeName || 'ทีมสร้างสรรค์และสื่อสารองค์กร (CC)'}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">พนักงานสร้างสรรค์และสื่อสารองค์กร (Creative &amp; Communication)</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)</div>
      </td>
    </tr>
  </table>
</div>`;

          const sendInfo = await transporter.sendMail({
            from: `"${senderName || assigneeName || 'ทีม CC'} via CC TEAM" <${smtpUser}>`,
            replyTo: from || `${(assigneeName || '').toLowerCase().replace(/\s+/g, '')}@step.cmu.ac.th`,
            to: targetTo,
            cc: Array.isArray(cc) && cc.length > 0 ? cc : undefined,
            subject,
            text: emailBodyText,
            html: emailHtmlBody,
          });

          emailSendResult = { simulated: false, messageId: sendInfo.messageId };
          console.log(`[KICKOFF EMAIL LIVE SENT] Message ID: ${sendInfo.messageId}`);
        } catch (mailErr: any) {
          console.error(`[KICKOFF EMAIL SMTP ERROR]`, mailErr);
          emailSendResult = { simulated: false, error: mailErr.message };
        }
      }

      // Update brief in Supabase to track kickoff email record
      const supabase = getSupabase();
      if (supabase && briefId) {
        try {
          const { data: b } = await supabase.from('briefs').select('details').eq('id', briefId).single();
          if (b) {
            const updatedDetails = {
              ...(b.details || {}),
              kickoff_email_sent_at: new Date().toISOString(),
              kickoff_email_to: targetTo,
              kickoff_email_from: from,
              kickoff_email_sender: senderName || assigneeName,
              kickoff_email_simulated: emailSendResult.simulated,
            };
            await supabase.from('briefs').update({ details: updatedDetails }).eq('id', briefId);
          }
        } catch (e) {
          console.error('Error updating brief kickoff_email_sent_at:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `จัดส่งอีเมลแจ้งเริ่มงาน (In Progress) จาก ${senderName || assigneeName || 'ทีม CC'} ถึงผู้สั่งงาน (${to}) และ CC ทีมงาน (${Array.isArray(cc) ? cc.join(', ') : cc}) เรียบร้อยแล้ว`,
        from: from || 'cc@step.cmu.ac.th',
        to,
        cc,
        subject,
        taskCode,
        emailResult: emailSendResult,
        dispatchTime: new Date().toISOString()
      });
    }

    // 5.1.1 Meeting Report Email Dispatch (Sent to Executives & CC Team)
    else if (action === 'meeting_report_email') {
      const { to, cc, subject, body: emailBodyText, meetingId, title, date, chair, recorder } = body;

      console.log(`=========================================`);
      console.log(`[MEETING REPORT EMAIL DISPATCH]`);
      console.log(`Meeting: ${title || 'การประชุม CC'}`);
      console.log(`Date: ${date}`);
      console.log(`Chair: ${chair} | Recorder: ${recorder}`);
      console.log(`To (Executives): ${Array.isArray(to) ? to.join(', ') : to}`);
      console.log(`CC (Team): ${Array.isArray(cc) ? cc.join(', ') : cc}`);
      console.log(`Subject: ${subject}`);
      console.log(`=========================================`);

      // 1. SMTP live dispatch if credentials configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      let emailSendResult: { simulated: boolean; messageId?: string; error?: string } = { simulated: true };

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const sendInfo = await transporter.sendMail({
            from: `"${recorder || chair || 'ทีมงาน CC'} via CC SYSTEM" <${smtpUser}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            cc: Array.isArray(cc) && cc.length > 0 ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
            subject,
            text: emailBodyText,
          });

          emailSendResult = { simulated: false, messageId: sendInfo.messageId };
          console.log(`[MEETING REPORT EMAIL LIVE SENT via SMTP] Message ID: ${sendInfo.messageId}`);
        } catch (mailErr: any) {
          console.error(`[MEETING REPORT EMAIL SMTP ERROR]`, mailErr);
          emailSendResult = { simulated: false, error: mailErr.message };
        }
      }

      // 2. LINE Push Notification disabled per user instruction (sent via Gmail & cloud storage only)
      console.log(`[LINE PUSH SKIPPED for meeting_report_email per user configuration]`);

      const toCount = Array.isArray(to) ? to.length : (to ? to.split(',').length : 0);
      const ccCount = Array.isArray(cc) ? cc.length : (cc ? cc.split(',').length : 0);

      return NextResponse.json({
        success: true,
        message: `จัดส่งบันทึกการประชุม "${title || subject}" ถึงคณะผู้บริหาร (${toCount} ท่าน) และ CC ทีมงาน (${ccCount} ท่าน) เรียบร้อยแล้ว (งดส่งเข้ากลุ่ม LINE)`,
        emailResult: emailSendResult,
        dispatchTime: new Date().toISOString()
      });
    }

    // 5.1.2 Stakeholder Satisfaction Survey Dispatch (Direct or Follow-up)
    else if (action === 'send_satisfaction_survey' || action === 'stakeholder_survey_dispatch') {
      const { briefId, targetEmail, projectName, stakeholderGroup, surveyUrl } = body;

      console.log(`=========================================`);
      console.log(`[STAKEHOLDER SURVEY EMAIL DISPATCH]`);
      console.log(`Project: ${projectName || briefId}`);
      console.log(`To: ${targetEmail}`);
      console.log(`Group: ${stakeholderGroup || 'ผู้มีส่วนได้ส่วนเสีย'}`);
      console.log(`=========================================`);

      // SMTP dispatch if configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      let emailSendResult: { simulated: boolean; messageId?: string; error?: string } = { simulated: true };

      if (smtpHost && smtpUser && smtpPass && targetEmail) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const sendInfo = await transporter.sendMail({
            from: `"ทีมงาน CC (Creative & Communication)" <${smtpUser}>`,
            to: targetEmail,
            subject: `[แบบประเมินความพึงพอใจและเสียงสะท้อนผู้มีส่วนได้ส่วนเสีย] งาน "${projectName || 'การให้บริการ'}"`,
            text: `เรียน ผู้รับบริการ / ผู้มีส่วนได้ส่วนเสีย\n\nทีมงาน CC ขอขอบพระคุณที่ท่านได้ไว้วางใจให้ทีมงานดูแลงาน "${projectName || ''}"\n\nเพื่อการปรับปรุงและพัฒนาคุณภาพการให้บริการตามมาตรฐาน ISO 9001:2015 ข้อ 4.2 ขอความอนุเคราะห์ท่านสละเวลาตอบแบบประเมินความพึงพอใจสั้นๆ ผ่านลิงก์:\n${surveyUrl || ''}\n\nขอแสดงความนับถือ,\nทีมงานสร้างสรรค์และการสื่อสาร (CC TEAM)\nอุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่`,
          });

          emailSendResult = { simulated: false, messageId: sendInfo.messageId };
        } catch (mailErr: any) {
          console.error(`[STAKEHOLDER SURVEY SMTP ERROR]`, mailErr);
          emailSendResult = { simulated: false, error: mailErr.message };
        }
      }

      // LINE Push Notification disabled per user instruction (sent via email only)
      console.log(`[LINE PUSH SKIPPED for stakeholder_survey_dispatch per user configuration]`);

      return NextResponse.json({
        success: true,
        message: `ส่งแบบประเมินผู้มีส่วนได้ส่วนเสียสำหรับงาน "${projectName}" ไปยัง ${targetEmail} เรียบร้อยแล้ว (งดส่งเข้ากลุ่ม LINE)`,
        emailResult: emailSendResult,
        dispatchTime: new Date().toISOString()
      });
    }

    // 5.2 WI Deviation & Risk Alert (Sent immediately to Assignee, Team Lead, and Deputy Team Lead)
    else if (action === 'wi_deviation_alert') {
      const {
        briefId,
        taskCode,
        projectName,
        wiType,
        wiAlertLevel, // 'breached' | 'at_risk'
        deviations = [],
        assigneeName,
        assigneeEmail,
        deadline,
        status,
        unit
      } = body;

      const teamLead = {
        name: "จ๊อบ AA",
        fullName: "นายอัจชนะพงษ์ อัจชนะวราทา",
        email: "adchanapong@step.cmu.ac.th"
      };

      const assistantLead = {
        name: "วา WK",
        fullName: "นางสาววาสิตา กอบธัญกิจ",
        email: "wasita@step.cmu.ac.th"
      };

      const targetToEmail = assigneeEmail || "cc@step.cmu.ac.th";
      const ccList = [teamLead.email, assistantLead.email];

      const isBreached = wiAlertLevel === 'breached';
      const severityTag = isBreached ? '🚨 หลุดเกณฑ์ WI' : '⚠️ มีแนวโน้มหลุดเกณฑ์ WI';
      const emailSubject = `${isBreached ? '🚨 [หลุดเกณฑ์ WI]' : '⚠️ [เตือนความเสี่ยง WI]'} แจ้งเตือนการควบคุมมาตรฐาน ${wiType || 'WI'}: ${taskCode || 'CC-TASK'} - ${projectName || 'ชิ้นงาน'}`;

      const deviationBullets = (Array.isArray(deviations) && deviations.length > 0)
        ? deviations.map((d: string) => `• ${d}`).join('\n')
        : '• มีขั้นตอนที่ไม่สอดคล้องตามระเบียบการปฏิบัติงาน หรือส่งมอบล่าช้ากว่ากำหนด';

      const emailBodyText = `เรียน ผู้รับผิดชอบงาน (${assigneeName || 'ทีมงาน CC'}),
สำเนา (CC): หัวหน้าทีม (${teamLead.name} - ${teamLead.fullName}), รองหัวหน้าทีม (${assistantLead.name} - ${assistantLead.fullName})

ระบบติดตามมาตรฐานการปฏิบัติงาน (Work Instruction Monitoring) ขอแจ้งเตือนว่างานต่อไปนี้ ${severityTag}

----------------------------------------------------------------------
📋 ข้อมูลชิ้นงานที่ต้องติดตามเร่งด่วน:
• รหัสงาน: ${taskCode || 'CC-TASK'}
• ชื่องาน / โครงการ: ${projectName || 'ไม่ระบุชื่อ'}
• มาตรฐานที่บังคับใช้: ${wiType || 'WI-CC'}
• ผู้รับผิดชอบ (Assignee): ${assigneeName || 'ทีม CC'} (${targetToEmail})
• ยูนิต: ${unit || 'CC'}
• สถานะปัจจุบัน: ${status || 'รอดำเนินการ'}
• กำหนดส่งมอบ (Deadline): ${deadline || 'ไม่ระบุ'}
----------------------------------------------------------------------

🔍 ข้อสังเกตและประเด็นความเสี่ยงที่ตรวจพบ:
${deviationBullets}

👉 แนวทางการดำเนินการทันที:
1. สำหรับผู้รับผิดชอบงาน (${assigneeName}):
   - ตรวจสอบประเด็นปัญหาและเร่งดำเนินการประสานงานกับผู้สั่งงานหรือผู้เกี่ยวข้องทันที
   - หากมีข้อติดขัดด้านสเปกงานหรือปริมาณงาน ให้ขอคำปรึกษาจากรองหัวหน้าทีมหรือหัวหน้าทีม
2. สำหรับหัวหน้าทีม (${teamLead.name}) และ รองหัวหน้าทีม (${assistantLead.name}):
   - โปรดเข้ากำกับดูแลและพิจารณาจัดสรรทรัพยากร/ผู้ช่วยสนับสนุน เพื่อป้องกันความเสียหายต่อตัวชี้วัดคุณภาพ ISO 9001 (KRI)

🔗 เข้าตรวจสอบรายละเอียดชิ้นงานและการตอบโต้ทางอีเมลในระบบได้ที่:
${process.env.NEXT_PUBLIC_APP_URL || 'https://cc-insights.step.cmu.ac.th'}/dashboard

ขอแสดงความนับถือ,
ระบบบริหารคุณภาพและติดตามมาตรฐาน WI (CC System 2027)
อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)`;

      console.log(`=========================================`);
      console.log(`[WI DEVIATION ALERT EMAIL DISPATCH]`);
      console.log(`Severity: ${severityTag}`);
      console.log(`Task: ${taskCode} - ${projectName}`);
      console.log(`To (Assignee): ${targetToEmail}`);
      console.log(`CC (Team Lead & Deputy): ${ccList.join(', ')}`);
      console.log(`Deviations:\n${deviationBullets}`);
      console.log(`=========================================`);

      // Nodemailer dispatch if SMTP configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      let emailSendResult: { simulated: boolean; messageId?: string; error?: string } = { simulated: true };

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const sendInfo = await transporter.sendMail({
            from: `"CC Quality Monitoring System" <${smtpUser}>`,
            to: targetToEmail,
            cc: ccList,
            subject: emailSubject,
            text: emailBodyText,
          });

          emailSendResult = { simulated: false, messageId: sendInfo.messageId };
          console.log(`[WI ALERT EMAIL LIVE SENT] Message ID: ${sendInfo.messageId}`);
        } catch (mailErr: any) {
          console.error(`[WI ALERT EMAIL SMTP ERROR]`, mailErr);
          emailSendResult = { simulated: false, error: mailErr.message };
        }
      }

      // Update brief in Supabase to track WI alert timestamp
      const supabase = getSupabase();
      if (supabase && briefId) {
        try {
          const { data: b } = await supabase.from('briefs').select('details').eq('id', briefId).single();
          if (b) {
            const updatedDetails = {
              ...(b.details || {}),
              wi_alert_sent_at: new Date().toISOString(),
              wi_alert_level: wiAlertLevel,
              wi_alert_reasons: deviations,
              wi_alert_recipients: {
                to: targetToEmail,
                cc: ccList
              }
            };
            await supabase.from('briefs').update({ details: updatedDetails }).eq('id', briefId);
          }
        } catch (e) {
          console.error('Error updating brief wi_alert_sent_at:', e);
        }
      }

      // Real-time LINE notification disabled per user instruction (alerts sent via Email to Assignee, Team Lead, and Deputy Lead only)
      console.log(`[LINE PUSH SKIPPED for wi_deviation_alert per user configuration]`);

      return NextResponse.json({
        success: true,
        message: `จัดส่งอีเมลแจ้งเตือน ${severityTag} ถึง Assignee (${targetToEmail}) พร้อม CC หัวหน้าทีม (${teamLead.name}) และรองหัวหน้าทีม (${assistantLead.name}) เรียบร้อยแล้ว (งดส่งเข้ากลุ่ม LINE)`,
        recipients: {
          to: targetToEmail,
          cc: ccList
        },
        wiType,
        taskCode,
        emailResult: emailSendResult,
        dispatchTime: new Date().toISOString()
      });
    }

    // 6. Midday Creative & Trends Drop (12:00 PM Daily - Always Fresh & Non-Repeating)
    else if (action === 'noon_creative_trend') {
      const articleData = await getFreshCreativeTrend(body.unit);

      let lineMsg = `💡 [Creative & Trends Drop • เที่ยงนี้กับน้อง CC 🎨✨]
${articleData.unitBadge} วันนี้ถึงคิวเติมอาหารสมองและไอเดียของสายนี้แล้วครับพี่ๆ!

📌 **${articleData.title}**

${articleData.summary}

🔗 **อ่านบทความฉบับเต็ม & ดูตัวอย่างเพิ่มเติม:**
${articleData.link}

${articleData.tag}
ขอให้อิ่มอร่อยกับมื้อเที่ยง แล้วลุยงานช่วงบ่ายแบบไอเดียพุ่งกระฉูดเลยครับ! 🚀☀️`;

      const targetId = notyGroupId || execGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: 'ส่งบทความอัปเดตเทรนด์ความคิดสร้างสรรค์ (12:00 น. สดใหม่ไม่ซ้ำ) เข้ากลุ่มเรียบร้อยแล้ว',
        unit: articleData.unit,
        article: articleData.title,
        lineSent: pushRes.ok,
      });
    }

    // 7. Evening Health & Mind Care (16:45 PM Daily - Always Fresh & Non-Repeating)
    else if (action === 'evening_health_mind') {
      const tipData = await getFreshEveningHealthMind();

      let lineMsg = `💆 [Office Care & Mind Reset • สุขภาพกาย สุขภาพใจ ก่อนเลิกงาน 🌿🧘‍♂️]
อีกไม่กี่นาทีจะหมดเวลาทำงานแล้ว น้อง CC ขอชวนพี่ๆ มายืดเส้นยืดสายและรีเซ็ตสมองกันครับ!

📌 **${tipData.title}**

${tipData.summary}

🔗 **อ่านบทความและวิธีดูแลสุขภาพเพิ่มเติม:**
${tipData.link} (ข้อมูลจาก: ${tipData.source})

${tipData.tag}
ใกล้เลิกงานแล้ว วางงานไว้ที่ออฟฟิศ แล้วกลับไปพักผ่อนเติมพลังให้เต็มที่นะครับ! 🤍✨`;

      const targetId = notyGroupId || execGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: 'ส่งบทความสุขภาพกาย-สุขภาพใจ (16:45 น. สดใหม่ไม่ซ้ำ) เข้ากลุ่มเรียบร้อยแล้ว',
        tip: tipData.title,
        lineSent: pushRes.ok,
      });
    }

    return NextResponse.json({ success: true, message: "Action processed successfully." });
  } catch (error: any) {
    console.error('Error in notify API:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
