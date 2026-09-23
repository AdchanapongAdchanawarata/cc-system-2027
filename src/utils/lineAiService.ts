import { createClient } from "@supabase/supabase-js";

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

let currentModelIndex = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetch live data context from Supabase briefs for AI or fallback engine
 */
export async function getLiveDataContext() {
  const supabase = getSupabase();
  if (!supabase) return { briefs: [], totalCount: 0 };

  try {
    const { data: briefs } = await supabase
      .from("briefs")
      .select("id, project_name, unit, status, created_at, deadline, details, coordinator_nickname, assignees(name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    return { briefs: briefs || [], totalCount: briefs?.length || 0 };
  } catch (err) {
    console.error("Failed to fetch live context:", err);
    return { briefs: [], totalCount: 0 };
  }
}

/**
 * Free AI Query Engine with Model Rotation & Zero-Cost Rule Fallback
 */
import { getAllLearnedFacts, getRecentHistory, recordLearnedFact } from "./lineMemoryService";

/**
 * Free AI Query Engine with Gen Z Positive Energy Persona, Health Care & Continuous Learning
 */
export async function queryLineAI(
  userQuestion: string,
  groupName: string = "general",
  groupId: string = "",
  askerName: string = ""
): Promise<string> {
  const { briefs } = await getLiveDataContext();
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Retrieve recent conversation history and learned facts
  const recentTurns = groupId ? getRecentHistory(groupId, 6) : [];
  const learnedFacts = getAllLearnedFacts();

  const historyContext = recentTurns.length > 0
    ? recentTurns.map(t => `${t.role === "assistant" ? "น้อง CC" : t.senderName}: ${t.text}`).join("\n")
    : "ยังไม่มีประวัติการคุยก่อนหน้า";

  // Check if user is teaching or giving new knowledge to remember
  if (
    userQuestion.includes("จำไว้") ||
    userQuestion.includes("รู้ไว้") ||
    userQuestion.includes("โน้ตไว้") ||
    userQuestion.includes("ข้อมูลใหม่")
  ) {
    recordLearnedFact(userQuestion.replace(/น้อง[\s_]?cc|จำไว้ว่า|โน้ตไว้ว่า/gi, "").trim(), groupName);
  }

  // 1. Try Gemini with Model Rotation if API Key is available
  if (geminiApiKey) {
    for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
      const model = GEMINI_MODELS[(currentModelIndex + attempt) % GEMINI_MODELS.length];
      try {
        const callerLabel = askerName ? `พี่ ${askerName}` : "พี่ๆ";
        const systemPrompt = `คุณคือ "น้อง CC" น้องเล็ก Gen Z ประจำทีม Creative and Communication (CC) ของ STeP มช. 🌸✨

🎯 กฎเหล็กสำคัญเพื่อความสงบเรียบร้อยของห้องแชท (Clean & Quiet Chat Rules):
1. **กระชับ สั้น ตรงประเด็น (2-4 บรรทัดพอดีคำ):** ตอบเฉพาะสิ่งที่ถาม สั้น กระชับ จบในตัว ไม่พิมพ์ยืดยาว ไม่ดันข้อความของคนอื่นตกฟีด
2. **ห้ามเตือนเรื่องสุขภาพ/พักผ่อนพร่ำเพรื่อ:** ห้ามพูดเรื่องจิบน้ำ ยืดเส้นยืดสาย หรือพักสายตา ถ้าผู้ใช้ไม่ได้บ่นเหนื่อย ป่วย ทำงานดึก หรือถามถึงสุขภาพโดยตรง! ตอบเฉพาะเรื่องงานหรือเรื่องที่ถามเท่านั้น
3. **ไม่ชวนคุยต่อโดยไม่จำเป็น:** ตอบคำถามเสร็จแล้วจบประเด็นเลย ไม่ต้องทิ้งท้ายถามว่า "มีอะไรให้น้องช่วยอีกมั้ย" เพื่อให้ช่องแชทไม่รกและเงียบสงบ
4. **มุก & มีมปัจจุบันแบบพอดีคำ:** ใช้ฟีลและมีม Gen Z ร่วมสมัยได้ (เช่น ช็อตฟีล, ฟีลตัวแม่, ใจฟู, นอยด์, สู้ชีวิต) เฉพาะเมื่อมีการชวนคุยเล่นหรือแซว แต่ไม่เล่นล้นจนเกินงาม
5. **ทักทายพี่ๆ ด้วยชื่อ ${callerLabel} อย่างเป็นกันเอง:** ซัพพอร์ตพี่ๆ ทุกคนในทีมอย่างอบอุ่นและเท่าเทียม
6. **กฎเหล็กเรื่องความเงียบในกลุ่ม:** ตอบเฉพาะเมื่อพี่ๆ เรียกชื่อน้อง CC หรือถามน้อง CC โดยตรงเท่านั้น ไม่สอดแทรกบทสนทนาระหว่างพี่ๆ ในทีมเด็ดขาด

📚 ข้อมูลที่น้อง CC จดจำได้:
${learnedFacts.slice(0, 5).join("\n")}

💬 บทสนทนาก่อนหน้า:
${historyContext}

📊 ข้อมูลงานในระบบล่าสุด:
${JSON.stringify(briefs.slice(0, 10).map((b: any) => ({ name: b.project_name, status: b.status, assignee: Array.isArray(b.assignees) ? b.assignees[0]?.name : (b.assignees?.name || b.details?.assignee) })), null, 1)}

คำถาม/ข้อความจาก ${callerLabel} ในกลุ่ม "${groupName}": "${userQuestion}"
จงตอบสั้นๆ 2-3 บรรทัด ตรงประเด็น ฟีล Gen Z น่ารัก ไม่รกแชท และไม่เทศนาเรื่องสุขภาพ:`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            currentModelIndex = (currentModelIndex + attempt) % GEMINI_MODELS.length;
            return text.trim();
          }
        } else if (res.status === 429) {
          console.warn(`Gemini Model ${model} reached rate limit, rotating to next model...`);
          continue;
        }
      } catch (err) {
        console.warn(`Gemini API error with model ${model}:`, err);
      }
    }
  }

  // 2. Zero-Cost Intelligent Fallback Engine (with Gen Z personality & care)
  return fallbackRuleEngine(userQuestion, briefs);
}

/**
 * Intelligent Data Synthesis Engine (100% Free, Runs Locally, Fast & Accurate)
 */
export function fallbackRuleEngine(query: string, briefs: any[]): string {
  const q = query.toLowerCase();
  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://cc-insights.step.cmu.ac.th");
  const briefFormUrl = `${origin}/request`;
  const trackUrl = `${origin}/track`;

  // 1. ขอลิงก์ส่งบรีฟ / ฟอร์มขอรับบริการ
  if (q.includes("บรีฟ") || q.includes("ฟอร์ม") || q.includes("ขอลิงก์") || q.includes("ส่งงาน") || q.includes("brief") || q.includes("ขอแบบฟอร์ม")) {
    return `📝 [แบบฟอร์มส่งบรีฟงาน - ทีม CC] ✨
🔗 ยื่นงานใหม่: ${briefFormUrl}
🔍 ติดตามสถานะงาน: ${trackUrl}
ยูนิตที่พร้อมบริการ: Creative Design, Content, PR & Communication ค่าา 🌸`;
  }

  // 2. งานด่วน / Urgent
  if (q.includes("ด่วน") || q.includes("urgent")) {
    const urgentTasks = briefs.filter(b => {
      const isMarkedUrgent = b.details?.is_urgent === true || b.details?.isUrgent === true;
      const deadlineStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      let isNearDeadline = false;
      if (deadlineStr && b.status !== "completed") {
        const diffDays = (new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 2) isNearDeadline = true;
      }
      return (isMarkedUrgent || isNearDeadline) && b.status !== "completed";
    });

    if (urgentTasks.length === 0) {
      return `✅ [เช็กงานด่วนให้แล้วค่า]\nช่วงนี้ไม่มีงานด่วน 48 ชม. ทุกโปรเจกต์ดำเนินงานตามแผนปกติค่าบ ✨`;
    }

    let msg = `🚨 [แจ้งเตือนงานด่วน & ใกล้ส่งมอบ (${urgentTasks.length} งาน)]\n`;
    urgentTasks.slice(0, 5).forEach((t, i) => {
      const dStr = t.deadline || t.details?.usage_date || "ไม่ระบุ";
      const assignee = t.assignees?.name || t.details?.assignee || "ยังไม่ระบุผู้รับผิดชอบ";
      msg += `\n${i + 1}. **${t.project_name}** (${t.unit}) - ส่ง: ${dStr} (${assignee})`;
    });
    return msg;
  }

  // 3. งานส่งวันนี้
  if (q.includes("วันนี้") || q.includes("today")) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTasks = briefs.filter(b => {
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      return dStr && dStr.startsWith(todayStr) && b.status !== "completed";
    });

    if (todayTasks.length === 0) {
      return `☀️ [รายงานงานวันนี้]\nวันนี้ไม่มีงานครบกำหนดส่งมอบในระบบค่าบ จัดการงานได้ราบรื่นเลยค่า ✨`;
    }

    let msg = `🎯 [งานที่มีกำหนดส่งมอบวันนี้ (${todayTasks.length} งาน)]\n`;
    todayTasks.forEach((t, i) => {
      const assignee = t.assignees?.name || t.details?.assignee || "ยังไม่ระบุ";
      msg += `\n${i + 1}. **${t.project_name}** (${t.unit}) - ผู้ดูแล: ${assignee}`;
    });
    return msg;
  }

  // 4. งานค้าง / สถานะงาน
  if (q.includes("งานค้าง") || q.includes("สถานะ") || q.includes("ค้าง")) {
    const pending = briefs.filter(b => b.status === "pending").length;
    const inProgress = briefs.filter(b => b.status === "in_progress" || b.status === "progress").length;
    const completed = briefs.filter(b => b.status === "completed").length;

    return `📊 [อัปเดตสถิติภาระงานในระบบ]
• รอดำเนินการ (Pending): ${pending} งาน
• กำลังดำเนินการ (In Progress): ${inProgress} งาน
• ส่งมอบเรียบร้อย (Completed): ${completed} งาน
• รวมงานในระบบทั้งหมด: ${briefs.length} งานค่าบ ✨`;
  }

  // 5. ความผิดปกติ / ความเสี่ยง
  if (q.includes("ผิดปกติ") || q.includes("ความเสี่ยง") || q.includes("เตือน") || q.includes("anomaly") || q.includes("risk")) {
    const noAssignee = briefs.filter(b => !b.assignees && !b.details?.assignee && b.status !== "completed");
    const now = Date.now();
    const overdue = briefs.filter(b => {
      const dStr = b.deadline || b.details?.usage_date;
      return dStr && new Date(dStr).getTime() < now && b.status !== "completed";
    });

    return `⚠️ [สแกนจุดเฝ้าระวังของระบบ]
• งานที่ยังไม่มีผู้รับผิดชอบ: ${noAssignee.length} งาน ${noAssignee.length > 0 ? "👉 รอมอบหมาย" : "✅ ครบถ้วน"}
• งานเกินกำหนดส่ง (Overdue): ${overdue.length} งาน ${overdue.length > 0 ? "👉 รอติดตาม" : "✅ ไม่มีงานหลุด"} ✨`;
  }

  // 6. สรุปภาพรวม / Save Cost
  if (q.includes("สรุป") || q.includes("ภาพรวม") || q.includes("save cost") || q.includes("ผลงาน")) {
    const completed = briefs.filter(b => b.status === "completed").length;
    return `📈 [สรุปภาพรวมผลงานทีม CC] 🏆
• งานทั้งหมด: ${briefs.length} งาน | ส่งมอบแล้ว: ${completed} งาน
• กำลังดำเนินการ: ${briefs.filter(b => b.status !== "completed").length} งาน
ดูรายงานเชิงลึกได้ที่ CC Insights Portal ค่าบ ✨`;
  }

  // 7. ขอไอเดีย / เทรนด์สร้างสรรค์ (On-Demand ไม่เสียโควตา Push)
  if (q.includes("เทรนด์") || q.includes("ไอเดีย") || q.includes("ความคิดสร้างสรรค์") || q.includes("trend") || q.includes("idea")) {
    return `💡 [Creative & Trends Drop On-Demand 🎨✨]
สามารถอ่านเทรนด์สร้างสรรค์ประจำวันฉบับย่อได้ใน Morning Brief 09:00 น. หรือคลิกดูไอเดียและกรณีศึกษาใหม่ๆ ได้ที่:
🔗 Fast Company Design: https://www.fastcompany.com/co-design
🔗 Ad Age Creativity: https://adage.com/creativity
🔗 Content Marketing Institute: https://contentmarketinginstitute.com
อยากได้ไอเดียสายไหน (Design, Content, PR) ถามน้อง CC เจาะจงได้เลยค่าา 🚀`;
  }

  // 8. สุขภาพกาย / สุขภาพใจ (On-Demand ไม่เสียโควตา Push)
  if (q.includes("สุขภาพ") || q.includes("เมื่อย") || q.includes("ปวด") || q.includes("office syndrome") || q.includes("พักผ่อน") || q.includes("เครียด") || q.includes("เหนื่อย")) {
    return `🧘‍♂️ [Office Care & Mind Reset On-Demand 🤍✨]
พี่ๆ อย่าลืมพักสายตาด้วยกฎ 20-20-20 (มองไกล 20 ฟุต นาน 20 วินาที ทุก 20 นาที) และลุกขยับยืดเหยียดคอบ่าไหล่กันด้วยน้า!
🔗 ท่ายืดกล้ามเนื้อชาวออฟฟิศ (คณะแพทยศาสตร์ มช.): https://www.med.cmu.ac.th
🔗 สุขภาพจิตและการจัดการความเครียด (กรมสุขภาพจิต): https://dmh.go.th
น้อง CC เป็นห่วงสุขภาพพี่ๆ ทุกคนนะค้าา ดื่มน้ำเยอะๆ น้า 🧋🌸`;
  }

  // 9. แนะนำตัว / ฟังก์ชัน
  return `🤖 ฮายค่า! น้อง CC น้องเล็ก Gen Z ประจำทีม CC พร้อมซัพพอร์ตพี่ๆ เมื่อเรียกใช้น้าา ✨\n• "ขอบรีฟ" (ขอลิงก์ส่งงาน)\n• "งานด่วน" / "งานวันนี้" (เช็คเดดไลน์)\n• "งานค้าง" / "ความผิดปกติ" (ตรวจระบบ)\n• "ขอไอเดีย" / "สุขภาพ" (ทริคดีๆ ระหว่างวัน)`;
}
