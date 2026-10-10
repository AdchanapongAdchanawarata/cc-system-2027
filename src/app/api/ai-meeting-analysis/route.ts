import { NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview"
];

interface AgendaInput {
  id?: string;
  category: "info" | "continuous";
  title: string;
  assignees?: string[];
  notes?: string;
  completed?: boolean;
}

interface MeetingAnalysisRequest {
  title: string;
  date?: string;
  meetingType: "internal" | "executive";
  chair?: string;
  recorder?: string;
  agendas: AgendaInput[];
}

interface AnalysisResult {
  observations: string;
  risks: string;
  solutions: string;
  engineUsed: string;
}

function generateHeuristicAnalysis(data: MeetingAnalysisRequest): AnalysisResult {
  const { title, meetingType, agendas = [] } = data;
  const isExecutive = meetingType === "executive";
  const infoAgendas = agendas.filter(a => a.category === "info");
  const contAgendas = agendas.filter(a => a.category === "continuous");

  // Collect all unique assignees across agendas
  const allAssignees = Array.from(new Set(agendas.flatMap(a => a.assignees || [])));
  const agendaTitles = agendas.map(a => a.title.trim()).filter(Boolean);

  // 1. Generate Observations (ข้อสังเกตสำคัญ)
  const obsPoints: string[] = [];
  if (isExecutive) {
    obsPoints.push(`การประชุมร่วมกับผู้บริหาร STeP มุ่งเน้นการเชื่อมโยงทิศทางยุทธศาสตร์องค์กรและการรายงานผลการดำเนินงานตามตัวชี้วัด`);
  } else {
    obsPoints.push(`การประชุมภายในทีม CC ครั้งนี้เน้นการติดตามความต่อเนื่องของงาน (${contAgendas.length} วาระ) และการแจ้งนโยบาย/แนวทางใหม่ (${infoAgendas.length} วาระ)`);
  }

  if (contAgendas.length > 0) {
    const keyContTitles = contAgendas.slice(0, 2).map(a => `"${a.title}"`).join(", ");
    obsPoints.push(`มีงานที่ต้องติดตามความคืบหน้าต่อเนื่อง ได้แก่ ${keyContTitles} ซึ่งต้องการการประสานงานระหว่างผู้รับผิดชอบ`);
  }

  if (allAssignees.length > 0) {
    obsPoints.push(`ผู้รับผิดชอบหลักในวาระต่างๆ ครอบคลุม: ${allAssignees.join(", ")} สะท้อนการแบ่งบทบาทตามความเชี่ยวชาญของแต่ละยูนิต`);
  }

  if (agendaTitles.some(t => t.toLowerCase().includes("career") || t.includes("ยูนิต") || t.includes("ระดมสมอง"))) {
    obsPoints.push(`มีการหยิบยกประเด็นการพัฒนาโครงสร้างทีมและระบบการทำงาน เพื่อให้สอดรับกับภาระงานจริงของทีมงานทุกคน`);
  }

  // 2. Generate Risks (ความเสี่ยงที่ต้องระวัง)
  const riskPoints: string[] = [];
  if (contAgendas.length >= 3) {
    riskPoints.push(`จำนวนวาระต่อเนื่องมีหลายประเด็นพร้อมกัน อาจทำให้การติดตามผลไม่ทั่วถึงหากไม่มีการกำหนดผู้ประสานงานหลักชัดเจน`);
  } else {
    riskPoints.push(`ความเสี่ยงด้านความชัดเจนของกรอบเวลาส่งมอบ (Deliverables) ในแต่ละวาระต่อเนื่อง หากยังไม่ได้ระบุวันครบกำหนดที่แน่นอน`);
  }

  const multiAssigneeAgendas = agendas.filter(a => (a.assignees || []).length > 2);
  if (multiAssigneeAgendas.length > 0) {
    riskPoints.push(`วาระที่มีผู้รับผิดชอบร่วมกันหลายคน อาจเกิดความซ้ำซ้อนหรือความล่าช้าในการเริ่มดำเนินงานหากไม่มีผู้ถือธงนำ (Lead Owner)`);
  }

  if (agendaTitles.some(t => t.includes("3 ยูนิต") || t.includes("ทีม") || t.includes("ระดมสมอง"))) {
    riskPoints.push(`การรวบรวมข้อคิดเห็นและการปรับเข้ากับทั้ง 3 ยูนิตต้องใช้เวลา อาจกระทบต่อกำหนดการดำเนินงานประจำหากไม่มีการสรุปข้อสรุปเป็นลายลักษณ์อักษร`);
  }

  // 3. Generate Solutions (แนวทางแก้ไข / แนวทางการพัฒนา)
  const solPoints: string[] = [];
  solPoints.push(`กำหนดผู้รับผิดชอบหลัก (Lead Coordinator) 1 คนต่อแต่ละวาระ เพื่อเป็นจุดประสานงานกลางในการติดตามความคืบหน้า`);
  
  if (contAgendas.length > 0) {
    solPoints.push(`จัดทำตารางสรุป Milestone ย่อยสำหรับการดำเนินงานแต่ละยูนิต และอัปเดตสถานะในรอบการประชุมสัปดาห์ถัดไป`);
  }

  if (infoAgendas.length > 0) {
    solPoints.push(`สื่อสารสรุปมติและประเด็นแจ้งเพื่อทราบให้สมาชิกทีมทุกคนได้รับทราบอย่างเป็นทางการผ่านช่องทางกลุ่มงาน CC`);
  }

  return {
    observations: obsPoints.map(p => `• ${p}`).join("\n"),
    risks: riskPoints.map(p => `• ${p}`).join("\n"),
    solutions: solPoints.map(p => `• ${p}`).join("\n"),
    engineUsed: "Rule-Based Smart Assistant"
  };
}

export async function POST(request: Request) {
  try {
    const body: MeetingAnalysisRequest = await request.json();
    const { title, meetingType, chair, recorder, agendas = [] } = body;

    if (!title && agendas.length === 0) {
      return NextResponse.json({
        observations: "• กรุณาระบุชื่อการประชุมหรือเพิ่มวาระการประชุมก่อนกดวิเคราะห์",
        risks: "• ยังไม่มีข้อมูลวาระสำหรับการประเมินความเสี่ยง",
        solutions: "• เพิ่มวาระแจ้งเพื่อทราบหรือวาระต่อเนื่องเพื่อรับการวิเคราะห์ที่ตรงจุด",
        engineUsed: "Initial Prompt"
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If Gemini key is available, try invoking Gemini
    if (geminiApiKey) {
      const prompt = `คุณคือผู้ช่วยเลขานุการบริหารและที่ปรึกษาการบริหารจัดการทีม Creative & Content (CC System) มหาวิทยาลัยเชียงใหม่ (CMU STeP)
โปรดวิเคราะห์ข้อมูลการประชุมนี้ตามข้อเท็จจริงอย่างตรงไปตรงมา ไม่กล่าวอ้างเกินจริง ไม่แต่งตัวเลขที่ไม่มีอยู่จริง และให้ข้อเสนอแนะที่เป็นรูปธรรมในการทำงาน

ข้อมูลการประชุม:
- ชื่อการประชุม: ${title || "ไม่ระบุ"}
- ประเภท: ${meetingType === "executive" ? "ประชุมร่วมกับผู้บริหาร STeP" : "ประชุมภายในทีม CC"}
- ประธาน: ${chair || "ไม่ระบุ"}
- ผู้จดบันทึก: ${recorder || "ไม่ระบุ"}
- วาระการประชุม (${agendas.length} ข้อ):
${agendas.map((a, i) => `${i + 1}. [${a.category === "continuous" ? "วาระต่อเนื่อง" : "แจ้งเพื่อทราบ"}] ${a.title}
   - ผู้รับผิดชอบ: ${(a.assignees || []).join(", ") || "ไม่ระบุ"}
   - บันทึกเพิ่มเติม: ${a.notes || "ไม่มี"}`).join("\n")}

ให้ส่งผลลัพธ์เป็น JSON ล้วนๆ ในรูปแบบ:
{
  "observations": "ข้อสังเกตสำคัญในที่ประชุม เขียนเป็นข้อๆ สั้นกระชับ",
  "risks": "ความเสี่ยงที่ต้องระวังในการดำเนินงาน เขียนเป็นข้อๆ สั้นกระชับ",
  "solutions": "แนวทางการพัฒนา / แนวทางแก้ไขเชิงปฏิบัติ เขียนเป็นข้อๆ สั้นกระชับ"
}`;

      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(8000),
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2
                }
              })
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.observations && parsed.risks && parsed.solutions) {
                return NextResponse.json({
                  observations: parsed.observations,
                  risks: parsed.risks,
                  solutions: parsed.solutions,
                  engineUsed: `Gemini (${model})`
                });
              }
            }
          }
        } catch {
          // fallback to next model or rule-based
        }
      }
    }

    // High quality rule-based fallback
    const result = generateHeuristicAnalysis(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
