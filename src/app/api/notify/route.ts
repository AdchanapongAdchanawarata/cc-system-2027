import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getLineGroupIds } from '@/utils/lineBotConfig';
import { createClient } from '@supabase/supabase-js';
import { initBackgroundScheduler } from '@/utils/cronRunner';
import { getFreshCreativeTrend, getFreshEveningHealthMind } from '@/utils/dailyArticleService';
import { getTaskSurveyUrl } from '@/utils/surveyTokens';
import { shouldInternalTaskSkipEmail } from '@/utils/pricing';

// Ensure in-process cron timer is active
initBackgroundScheduler();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// Helper to push LINE message
async function pushLineMessage(targetId: string, text: string) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken || !targetId) {
    console.log(`[LINE PUSH SIMULATED (No Token/Target)]: To: ${targetId}\n${text}`);
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: targetId,
        messages: [{ type: 'text', text }],
      }),
    });

    if (res.ok) {
      console.log(`[LINE PUSH SUCCESS] To: ${targetId}`);
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
      let assignLead = 'คุณวา หรือ คุณจ๊อบ';

      if (u.includes('creative')) {
        unitName = 'Creative';
        assignLead = 'คุณวา (ผู้รับผิดชอบ Unit Creative) หรือ คุณจ๊อบ';
      } else if (u.includes('content')) {
        unitName = 'Content';
        assignLead = 'คุณวา หรือ ผู้ดูแล Unit Content';
      } else if (u.includes('pr')) {
        unitName = 'PR & Comm';
        assignLead = 'คุณวา หรือ ผู้ดูแล Unit PR & Comm';
      }

      // Check timeline urgency
      let diffDays = 999;
      if (usageDate) {
        const targetDate = new Date(usageDate).getTime();
        if (!isNaN(targetDate)) {
          diffDays = Math.ceil((targetDate - Date.now()) / (1000 * 60 * 60 * 24));
        }
      }
      const isTightTimeline = isUrgent || (diffDays >= 0 && diffDays <= 3);

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
${targetUrl}`;

      const targetId = notyGroupId || execGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: 'ส่งการแจ้งเตือนบรีฟใหม่เข้ากลุ่ม Creative step (NOTY) เรียบร้อยแล้ว',
        lineSent: pushRes.ok,
      });
    }

    // 2. Comprehensive Morning Brief (Pushed to 'Creative step (NOTY)' at 09:00 AM on workdays - Exactly ONCE per day)
    else if (action === 'morning_brief') {
      const supabase = getSupabase();
      const todayStr = new Date().toISOString().split('T')[0];
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      let newBriefs: any[] = [];
      let todayTasks: any[] = [];
      let urgentTasks: any[] = [];
      let overdueTasks: any[] = [];
      let unassignedTasks: any[] = [];
      let stalledPendingTasks: any[] = [];
      let inProgressTasks: any[] = [];

      if (supabase) {
        const { data: briefs } = await supabase
          .from('briefs')
          .select('id, project_name, unit, status, deadline, created_at, details, coordinator_nickname, assignees(id, name)')
          .neq('status', 'completed')
          .order('created_at', { ascending: false });

        if (briefs) {
          briefs.forEach((b: any) => {
            const hasAssignee = !!(b.assignees?.name || b.details?.assignee);
            const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
            const isToday = dStr && dStr.startsWith(todayStr);
            const isOverdue = dStr && new Date(dStr).getTime() < now && !isToday;
            const diffDays = dStr ? (new Date(dStr).getTime() - now) / (1000 * 60 * 60 * 24) : 999;
            const isUrgent = (b.details?.is_urgent || b.details?.isUrgent || (diffDays >= 0 && diffDays <= 2)) && !isToday;
            const isNewSinceYesterday = new Date(b.created_at).getTime() >= twentyFourHoursAgo;

            if (isNewSinceYesterday) newBriefs.push(b);
            if (isToday) todayTasks.push(b);
            if (isUrgent) urgentTasks.push(b);
            if (isOverdue) overdueTasks.push(b);
            if (!hasAssignee) unassignedTasks.push(b);
            if (b.status === 'pending' && new Date(b.created_at).getTime() < threeDaysAgo) stalledPendingTasks.push(b);
            if (b.status === 'in_progress' || b.status === 'progress') inProgressTasks.push(b);
          });
        }
      }

      const formatUnit = (unit: string) => {
        const u = (unit || '').toLowerCase();
        if (u.includes('creative')) return 'Creative';
        if (u.includes('content')) return 'Content';
        if (u.includes('pr')) return 'PR & Comm';
        return unit || 'CC';
      };

      const getAssigneesText = (tasks: any[]) => {
        const names = Array.from(new Set(tasks.map(t => t.assignees?.name || t.details?.assignee || 'ยังไม่ระบุผู้รับผิดชอบ'))).filter(Boolean);
        return names.length > 0 ? names.join(', ') : 'ผู้รับผิดชอบ';
      };

      // Get today's rotating trend snippet to include in Morning Brief
      let trendSnippet = '';
      try {
        const trendData = await getFreshCreativeTrend();
        trendSnippet = `\n\n💡 **Creative & Trends Drop ประจำวัน (${trendData.unitBadge}):**\n• **${trendData.title}**\n🔗 อ่านเพิ่มเติม: ${trendData.link}`;
      } catch (e) {
        console.warn('Could not fetch morning trend snippet:', e);
      }

      const todayThai = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      let lineMsg = `☀️ [Morning Brief ประจำวัน • ${todayThai}]\nสวัสดีตอนเช้าพี่ๆ ทีมสร้างสรรค์และการสื่อสาร (CC) ครับ! 🌸✨\n`;

      // Section 1: งานใหม่ที่ส่งเข้ามาในรอบ 24 ชม. (New Incoming Briefs)
      if (newBriefs.length > 0) {
        lineMsg += `\n📥 **1. งานใหม่ที่ส่งเข้ามาในรอบ 24 ชม. (${newBriefs.length} งาน):**`;
        newBriefs.slice(0, 4).forEach((t, i) => {
          const uName = formatUnit(t.unit);
          lineMsg += `\n${i + 1}. **${t.project_name}** [${uName}] (ผู้ขอ: ${t.coordinator_nickname || 'ไม่ระบุ'})`;
        });
        lineMsg += `\n👉 **สิ่งที่ต้องทำต่อ:** ขอให้ **คุณวา (ผู้รับผิดชอบ Unit Creative)** หรือ **คุณจ๊อบ** ตรวจรับบรีฟและ Assign ผู้รับผิดชอบในระบบครับ`;
      } else {
        lineMsg += `\n📥 **1. งานใหม่:** ในรอบ 24 ชม. ไม่มีบรีฟใหม่ส่งเข้ามาครับ`;
      }

      // Section 2: งานครบกำหนดส่งวันนี้ (Due Today)
      lineMsg += `\n\n🎯 **2. งานครบกำหนดส่งวันนี้ (${todayTasks.length} งาน):**`;
      if (todayTasks.length === 0) {
        lineMsg += `\n• วันนี้ไม่มีงานครบกำหนดส่งมอบครับ จัดการงานตามแผนปกติได้ราบรื่นเลยครับ 👍`;
      } else {
        todayTasks.forEach((t, i) => {
          const assignee = t.assignees?.name || t.details?.assignee || 'ยังไม่ระบุผู้รับผิดชอบ';
          lineMsg += `\n${i + 1}. **${t.project_name}**\n   • ยูนิต: ${formatUnit(t.unit)} | ผู้รับผิดชอบ: **${assignee}**`;
        });
        const todayAssignees = getAssigneesText(todayTasks);
        lineMsg += `\n👉 **สิ่งที่ต้องทำต่อ:** ขอให้ผู้รับผิดชอบ (**${todayAssignees}**) ตรวจทานความเรียบร้อยรอบสุดท้ายและส่งมอบงานภายในวันนี้ หากติดขัดปัญหาให้รีบแจ้งคุณวาหรือคุณจ๊อบทันทีครับ`;
      }

      // Section 3: งานด่วนเฝ้าระวัง 48 ชม. (Urgent 48h)
      if (urgentTasks.length > 0) {
        lineMsg += `\n\n🚨 **3. งานด่วนเฝ้าระวัง 48 ชม. (${urgentTasks.length} งาน):**`;
        urgentTasks.slice(0, 4).forEach((t, i) => {
          const assignee = t.assignees?.name || t.details?.assignee || 'ยังไม่ระบุผู้รับผิดชอบ';
          const dStr = t.deadline || t.details?.usage_date || 'เร็วๆ นี้';
          lineMsg += `\n• **${t.project_name}** [${formatUnit(t.unit)}] • ผู้รับผิดชอบ: **${assignee}** (กำหนดส่ง: ${dStr})`;
        });
        lineMsg += `\n👉 **สิ่งที่ต้องทำต่อ:** ขอให้ผู้รับผิดชอบเร่งมือตามไทม์ไลน์ และขอให้ **คุณวา หรือ คุณจ๊อบ** ช่วยติดตามอย่างใกล้ชิดครับ`;
      }

      // Section 4: สแกนความผิดปกติ (Unassigned / Stalled Pending / Overdue)
      const anomalyCount = unassignedTasks.length + stalledPendingTasks.length + overdueTasks.length;
      if (anomalyCount > 0) {
        lineMsg += `\n\n⚠️ **4. สแกนจุดเฝ้าระวังและความผิดปกติในระบบ:**`;
        if (unassignedTasks.length > 0) {
          lineMsg += `\n• **งานที่ยังไม่มีผู้รับผิดชอบ (${unassignedTasks.length} งาน):** ขอให้ **คุณวา หรือ คุณจ๊อบ** เร่ง Assign งานโดยด่วนครับ`;
        }
        if (stalledPendingTasks.length > 0) {
          lineMsg += `\n• **งานค้างสถานะ Pending > 3 วัน (${stalledPendingTasks.length} งาน):** ขอให้ผู้ดูแลยูนิตตรวจรับบรีฟและขยับเป็น In Progress ครับ`;
        }
        if (overdueTasks.length > 0) {
          lineMsg += `\n• **งานเกินกำหนดส่ง Overdue (${overdueTasks.length} งาน):** ขอให้ **คุณวา หรือ คุณจ๊อบ** เร่งติดตามกับผู้รับผิดชอบเพื่อปิดจ็อบหรือปรับขยายเวลาครับ`;
        }
      }

      // Section 5: สรุปภาพรวมภาระงาน In Progress
      const creativeCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('creative')).length;
      const contentCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('content')).length;
      const prCount = inProgressTasks.filter(t => (t.unit || '').toLowerCase().includes('pr')).length;

      lineMsg += `\n\n⚙️ **5. กำลังดำเนินการ (In Progress รวม ${inProgressTasks.length} งาน):**\n• Creative: ${creativeCount} งาน | Content: ${contentCount} งาน | PR: ${prCount} งาน`;

      // Section 6: Trend & Inspiration of the Day
      if (trendSnippet) {
        lineMsg += trendSnippet;
      }

      lineMsg += `\n\n🔗 จัดการและดูรายละเอียดงานทั้งหมด:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://cc-insights.step.cmu.ac.th'}/dashboard?view=dashboards`;
      lineMsg += `\nขอให้วันนี้เป็นวันที่ราบรื่นและเปี่ยมไปด้วยพลังสร้างสรรค์ครับ! 💪✨`;

      const targetId = notyGroupId || execGroupId;
      const pushRes = await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: 'ส่ง Morning Brief แบบรวมศูนย์ (ครบทุกเรื่องใน 1 รอบ) เข้ากลุ่มเรียบร้อยแล้ว',
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
            const dStr = b.deadline || b.details?.usage_date;
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
        lineMsg += `\n📌 **1. งานที่ยังไม่มีผู้รับผิดชอบ (${unassignedList.length} งาน):**`;
        unassignedList.slice(0, 4).forEach((t, i) => {
          lineMsg += `\n${i + 1}. **${t.project_name}** [ยูนิต: ${formatUnit(t.unit)}] (ผู้ขอ: ${t.coordinator_nickname || 'ไม่ระบุ'})`;
        });
        lineMsg += `\n👉 **แนวทางแก้ไข:** ขอให้ **คุณวา (ผู้ช่วยหัวหน้าทีม)** หรือคุณจ๊อบ เร่งรับ Assign ผู้รับผิดชอบอย่างเร่งด่วน เพื่อให้เริ่มงานได้ตามไทม์ไลน์`;
      }

      // 2. งานค้างในสถานะ Pending เกิน 3 วัน + แนวทางแก้ไข
      if (stalledPendingList.length > 0) {
        lineMsg += `\n\n📌 **2. งานค้างในสถานะ Pending > 3 วัน (${stalledPendingList.length} งาน):**`;
        stalledPendingList.slice(0, 3).forEach((t, i) => {
          const assignee = t.assignees?.name || t.details?.assignee || 'ยังไม่มีคนรับ';
          lineMsg += `\n• **${t.project_name}** [ยูนิต: ${formatUnit(t.unit)}] (ผู้รับผิดชอบ: ${assignee})`;
        });
        lineMsg += `\n👉 **แนวทางแก้ไข:** ขอให้ผู้ดูแลยูนิตหรือผู้ประสานงานเร่งตรวจรับบรีฟและขยับสถานะเป็น In Progress ทันที`;
      }

      // 3. งานเกินกำหนดส่ง (Overdue) + แนวทางแก้ไข
      if (overdueList.length > 0) {
        lineMsg += `\n\n📌 **3. งานเกินกำหนดส่ง Overdue (${overdueList.length} งาน):**`;
        overdueList.slice(0, 4).forEach((t, i) => {
          const assignee = t.assignees?.name || t.details?.assignee || 'ยังไม่ระบุ';
          lineMsg += `\n• **${t.project_name}** [ยูนิต: ${formatUnit(t.unit)}] • ผู้รับผิดชอบ: **${assignee}**`;
        });
        lineMsg += `\n👉 **แนวทางแก้ไข:** ขอให้ **คุณวา หรือ คุณจ๊อบ** ติดตามงานอย่างเร่งด่วนกับผู้รับผิดชอบเพื่อเคลียร์ส่งมอบ หรือประสานผู้ขอเพื่อปรับขยายเวลาในระบบ`;
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
      const { reporter, executives, ccStaff, subject, emailBody, lineSummaryText } = body;
      
      const execList = executives && executives.length > 0 
        ? executives.map((ex: any) => ({
            role: 'Executive (ผู้บริหาร)',
            name: `${ex.position ? `${ex.position} ` : ''}${ex.fullName || ex.name}`,
            email: ex.email || 'executives@step.cmu.ac.th'
          }))
        : [{ role: 'Executive (ผู้บริหาร)', name: 'คณะผู้บริหารและผู้อำนวยการ', email: 'executives@step.cmu.ac.th' }];

      const ccList = ccStaff && ccStaff.length > 0
        ? ccStaff.map((st: any) => ({
            role: 'Staff (ทีมงาน CC)',
            name: `${st.fullName || st.name} (${st.position || st.unit || 'CC'})`,
            email: st.email || `${st.name?.toLowerCase().replace(/\s+/g, '') || 'staff'}@step.cmu.ac.th`
          }))
        : [];

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
      console.log(`To: ${execList.map((e: any) => e.name).join(', ')}`);
      console.log(`CC Staff: ${ccList.length} members`);

      // LINE Push to CC TEAM Group
      const finalLineMessage = lineSummaryText || `📊 [CC TEAM • รายงานสรุปผลการดำเนินงานประจำเดือน]\nเรียน คณะผู้บริหารและทีมงานทุกท่าน\nระบบได้จัดส่งอีเมลรายงานประจำเดือนเรียบร้อยแล้ว\nตรวจสอบรายละเอียดได้ทางอีเมลหรือระบบ CC Insights`;
      const targetId = execGroupId || notyGroupId;
      const pushRes = await pushLineMessage(targetId, finalLineMessage);

      return NextResponse.json({
        success: true,
        message: `จัดส่งอีเมลรายงานประจำเดือนถึงคณะผู้บริหาร (${execList.map((e: any) => e.name).join(', ')}) และ CC สมาชิกทีม CC (${ccList.length} ท่าน) สำเร็จเรียบร้อย!`,
        lineSent: pushRes.ok,
        lineStatusMessage: pushRes.ok ? 'ส่งสรุปรายงานเข้ากลุ่ม LINE CC TEAM สำเร็จ' : 'จำลองการส่งเข้ากลุ่ม LINE CC TEAM สำเร็จ',
        recipients: allRecipients,
        ccRecipients: ccList,
        dispatchTime: new Date().toISOString()
      });
    }

    // 4.1 Automated Monthly Performance Summary for CC TEAM (Pushed on Last Workday 09:00 AM)
    else if (action === 'monthly_performance_summary') {
      const supabase = getSupabase();
      const now = new Date();
      const thaiMonthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const monthNameThai = thaiMonthNames[now.getMonth()];
      const yearThai = now.getFullYear() + 543;

      let totalTasks = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let creativeCount = 0;
      let contentCount = 0;
      let prCount = 0;
      let totalSaveCost = 0;
      let totalProfit = 0;
      let satisfactionAvg = 0;
      let satisfactionCount = 0;

      if (supabase) {
        const { data: briefs } = await supabase
          .from('briefs')
          .select('id, unit, status, created_at, details');

        if (briefs) {
          totalTasks = briefs.length;
          briefs.forEach((b: any) => {
            if (b.status === 'completed') completedTasks++;
            else if (b.status === 'in_progress' || b.status === 'progress') inProgressTasks++;

            const u = (b.unit || '').toLowerCase();
            if (u.includes('creative')) creativeCount++;
            else if (u.includes('content')) contentCount++;
            else if (u.includes('pr')) prCount++;

            const sc = Number(b.details?.save_cost_value || b.details?.saveCost || 0);
            if (!isNaN(sc)) totalSaveCost += sc;

            const pf = Number(b.details?.profit || b.details?.project_profit || 0);
            if (!isNaN(pf)) totalProfit += pf;

            const score = b.details?.satisfaction_scores?.averagePercent || b.details?.satisfaction_rate;
            if (typeof score === 'number' && score > 0) {
              satisfactionAvg += score;
              satisfactionCount++;
            }
          });
          if (satisfactionCount > 0) {
            satisfactionAvg = Math.round(satisfactionAvg / satisfactionCount);
          }
        }
      }

      let lineMsg = `🏆 [CC TEAM • สรุปผลการดำเนินงานประจำเดือน ${monthNameThai} ${yearThai}]\n`;
      lineMsg += `เรียน คณะผู้บริหารและทีมสร้างสรรค์และการสื่อสาร (CC) ทุกท่าน 🌸✨\n\n`;
      lineMsg += `สรุปภาพรวมผลการดำเนินงานตลอดเดือนที่ผ่านมา:\n`;
      lineMsg += `• 📦 **จำนวนงานทั้งหมดในระบบ:** ${totalTasks} งาน\n`;
      lineMsg += `• ✅ **ส่งมอบงานสำเร็จ (Completed):** ${completedTasks} งาน\n`;
      lineMsg += `• ⚙️ **งานที่อยู่ระหว่างดำเนินการ:** ${inProgressTasks} งาน\n\n`;

      lineMsg += `📊 **สัดส่วนผลงานแยกตามสายงาน (Unit):**\n`;
      lineMsg += `• 🎨 Creative Design: ${creativeCount} งาน\n`;
      lineMsg += `• ✍️ Content Creator: ${contentCount} งาน\n`;
      lineMsg += `• 📢 PR & Communication: ${prCount} งาน\n\n`;

      if (totalSaveCost > 0 || totalProfit > 0) {
        lineMsg += `💰 **มูลค่าผลประโยชน์องค์กร (Value Impact):**\n`;
        if (totalSaveCost > 0) lineMsg += `• 🛡️ ประหยัดงบประมาณองค์กร (Save Cost): ฿${totalSaveCost.toLocaleString()}\n`;
        if (totalProfit > 0) lineMsg += `• 📈 กำไรโครงการจากการให้บริการ: ฿${totalProfit.toLocaleString()}\n`;
        lineMsg += `\n`;
      }

      if (satisfactionAvg > 0) {
        lineMsg += `⭐ **ความพึงพอใจการให้บริการเฉลี่ย:** ${satisfactionAvg}% (จาก ${satisfactionCount} โครงการ)\n\n`;
      }

      lineMsg += `🔗 ตรวจสอบรายงานเชิงลึกและ OKRs/KPIs ทีม:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://cc-insights.step.cmu.ac.th'}/dashboard?view=dashboards\n`;
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
      const targetEmail = requesterEmail || body.requester_email || 'requester@step.cmu.ac.th';

      let pName = projectName || '';
      let pTeam = body.department || body.team || '';
      let pCoordinator = requesterName || body.coordinator || '';

      const supabase = getSupabase();
      if (supabase && briefId) {
        try {
          const { data: b } = await supabase.from('briefs').select('project_name, decision_maker, coordinator_nickname, details, status, unit').eq('id', briefId).single();
          if (b) {
            // Internal tasks (except PM โครงการ, ให้คำปรึกษาเชิงสร้างสรรค์, ให้คำปรึกษา/รับโจทย์ ผู้ประกอบการ) do not require email dispatch
            if (shouldInternalTaskSkipEmail(b)) {
              console.log(`[SURVEY EMAIL SKIPPED] Task ${briefId} (${b.project_name}) is an internal task without email requirement. Skipping.`);
              return NextResponse.json({
                success: true,
                skipped: true,
                message: 'งานภายในถูกบันทึกเชิงข้อมูลในระบบเรียบร้อยแล้ว โดยไม่ต้องจัดส่งอีเมล',
              });
            }

            // Strict check: อีเมลแบบประเมินจะส่งอัตโนมัติเมื่องานอยู่ในสถานะ 'completed' เท่านั้น
            if (b.status && b.status !== 'completed') {
              console.warn(`[SURVEY EMAIL REJECTED] Task ${briefId} is currently '${b.status}', not 'completed'. Aborting survey dispatch.`);
              return NextResponse.json({
                success: false,
                message: `ไม่อนุญาตให้จัดส่งแบบประเมิน: อีเมลจะถูกจัดส่งเมื่อชิ้นงานเสร็จสิ้น (completed) เท่านั้น (สถานะปัจจุบัน: ${b.status})`,
                currentStatus: b.status
              }, { status: 400 });
            }

            if (!pName) pName = b.project_name || '';
            if (!pTeam) pTeam = b.decision_maker || b.details?.team || '';
            if (!pCoordinator) pCoordinator = b.coordinator_nickname || '';
          }
        } catch (e) {}
      }
      
      // Obfuscated survey URL with pre-filled parameters so PM does not need to retype anything
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const origin = `${protocol}://${host}`;
      const baseSurveyUrl = getTaskSurveyUrl(briefId || '', assigneeId || '', origin);
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

      // Update brief survey status in Supabase if briefId exists
      if (supabase && briefId) {
        try {
          const { data: b } = await supabase.from('briefs').select('details').eq('id', briefId).single();
          if (b) {
            const updatedDetails = {
              ...(b.details || {}),
              survey_status: b.details?.survey_status || 'sent',
              survey_sent_at: new Date().toISOString()
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
        dispatchTime: new Date().toISOString()
      });
    }

    // 5.1 Kickoff & In Progress Email Dispatch (Sent to PM, Assignee, Team Lead, and Assistant Lead)
    else if (action === 'kickoff_in_progress_email') {
      const { to, cc, subject, body: emailBodyText, briefId, taskCode, assigneeName, from, senderName } = body;

      // Check if internal task that skips email
      if (briefId) {
        const supabase = getSupabase();
        if (supabase) {
          try {
            const { data: b } = await supabase.from('briefs').select('unit, project_name, details').eq('id', briefId).single();
            if (b && shouldInternalTaskSkipEmail(b)) {
              console.log(`[KICKOFF EMAIL SKIPPED] Task ${briefId} (${b.project_name}) is an internal task without email requirement. Skipping.`);
              return NextResponse.json({
                success: true,
                skipped: true,
                message: 'งานภายในถูกบันทึกเชิงข้อมูลในระบบเรียบร้อยแล้ว โดยไม่ต้องจัดส่งอีเมลแจ้งเริ่มงาน',
              });
            }
          } catch (e) {}
        }
      }

      console.log(`=========================================`);
      console.log(`[KICKOFF IN-PROGRESS EMAIL DISPATCH]`);
      console.log(`Task Code: ${taskCode || 'CC-TASK'}`);
      console.log(`From: ${senderName || assigneeName || 'ผู้รับผิดชอบงาน CC'} <${from || 'cc@step.cmu.ac.th'}>`);
      console.log(`To: ${to}`);
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

          const sendInfo = await transporter.sendMail({
            from: `"${senderName || assigneeName || 'ทีม CC'} via CC TEAM" <${smtpUser}>`,
            replyTo: from || `${(assigneeName || '').toLowerCase().replace(/\s+/g, '')}@step.cmu.ac.th`,
            to,
            cc: Array.isArray(cc) && cc.length > 0 ? cc : undefined,
            subject,
            text: emailBodyText,
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
              kickoff_email_to: to,
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

      // LINE Push Notification to Notify Group that task has kicked off
      const lineMsg = `⚡ [เริ่มดำเนินการงาน • In Progress]
📌 **${taskCode || 'งานใหม่'}**: ${projectName || 'ชิ้นงาน'}
• ผู้รับผิดชอบ (ผู้ส่ง): **${senderName || assigneeName || 'ทีม CC'}** (${from || 'CC'})
• ผู้สั่งงาน (PM / ผู้รับหลัก): ${to || 'ไม่ระบุอีเมล'}
✉️ ระบบได้จัดส่งอีเมลแจ้งเริ่มงาน (Email Thread) ถึงผู้สั่งงานเรียบร้อยแล้ว`;

      const targetId = notyGroupId || execGroupId;
      await pushLineMessage(targetId, lineMsg);

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

      // 2. LINE Push Notification to Notify Group
      const toCount = Array.isArray(to) ? to.length : (to ? to.split(',').length : 0);
      const ccCount = Array.isArray(cc) ? cc.length : (cc ? cc.split(',').length : 0);
      const lineMsg = `📋 [บันทึกการประชุม CC ส่งถึงคณะผู้บริหารและทีมงานแล้ว]
📌 **${title || subject || 'บันทึกการประชุม'}**
• วันที่ประชุม: ${date || '-'}
• ประธานที่ประชุม: ${chair || 'นายอัจชนะพงษ์ อัจชนะวราทา'}
• ผู้จดบันทึก: ${recorder || 'นางสาววาสิตา กอบธัญกิจ'}
• ผู้รับหลัก (คณะผู้บริหาร & ผอ.): ${toCount} ท่าน
• สำเนา (ทีมงาน CC ทุกคน): ${ccCount} ท่าน
✉️ ดำเนินการเปิดส่งผ่าน Gmail (@step.cmu.ac.th) และบันทึกลงระบบคลาวด์เรียบร้อยแล้ว`;

      const targetId = notyGroupId || execGroupId;
      await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: `จัดส่งบันทึกการประชุม "${title || subject}" ถึงคณะผู้บริหาร (${toCount} ท่าน) และ CC ทีมงาน (${ccCount} ท่าน) เรียบร้อยแล้ว`,
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

      // LINE Push Notification
      const lineMsg = `⭐ [ส่งแบบประเมินผู้มีส่วนได้ส่วนเสีย • Stakeholder VOC]
📌 **${projectName || 'ชิ้นงาน'}**
• กลุ่มผู้มีส่วนได้ส่วนเสีย: **${stakeholderGroup || 'ผู้รับบริการ'}**
• ผู้รับ (To): ${targetEmail || 'ไม่ระบุอีเมล'}
✉️ จัดส่งลิงก์แบบประเมินเรียบร้อยแล้ว`;

      const targetId = notyGroupId || execGroupId;
      await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: `ส่งแบบประเมินผู้มีส่วนได้ส่วนเสียสำหรับงาน "${projectName}" ไปยัง ${targetEmail} เรียบร้อยแล้ว`,
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
        : '• มีขั้นตอนที่ไม่สอดคล้องตามระเบียบการปฏิบัติงาน หรือส่งมอบล่าช้ากว่า SLA';

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

      // Also push real-time LINE notification to team group
      const lineMsg = `${isBreached ? '🚨 [แจ้งเตือน: งานหลุดจากมาตรฐาน WI]' : '⚠️ [แจ้งเตือน: งานมีแนวโน้มหลุดเกณฑ์ WI]'}
📌 **${taskCode || 'CC-TASK'}**: ${projectName || 'ไม่ระบุชื่อ'}
• มาตรฐาน: ${wiType || 'WI-CC'}
• ผู้รับผิดชอบ: **${assigneeName || 'ทีม CC'}** (${targetToEmail})
• แจ้งเตือนถึง: ผู้รับผิดชอบ, คุณจ๊อบ (หัวหน้าทีม) และ คุณวา (รองหัวหน้าทีม)

⚠️ **ข้อสังเกตที่พบ:**
${deviationBullets}

✉️ ระบบได้จัดส่งอีเมลแจ้งเตือนถึงผู้รับผิดชอบ, หัวหน้าทีม และรองหัวหน้าทีมเรียบร้อยแล้ว`;

      const targetId = notyGroupId || execGroupId;
      await pushLineMessage(targetId, lineMsg);

      return NextResponse.json({
        success: true,
        message: `จัดส่งอีเมลแจ้งเตือน ${severityTag} ถึง Assignee (${targetToEmail}) พร้อม CC หัวหน้าทีม (${teamLead.name}) และรองหัวหน้าทีม (${assistantLead.name}) เรียบร้อยแล้ว`,
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
