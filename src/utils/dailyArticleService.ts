import fs from 'fs';
import path from 'path';

export interface SentArticleRecord {
  type: 'noon_creative_trend' | 'evening_health_mind';
  unit?: 'design' | 'content' | 'pr';
  title: string;
  date: string;
  sentAt: string;
}

const HISTORY_PATH = path.join(process.cwd(), 'src', 'data', 'sent_articles_history.json');

export function getSentHistory(): SentArticleRecord[] {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not read sent articles history:', err);
  }
  return [];
}

export function recordSentArticle(item: SentArticleRecord) {
  try {
    const dir = path.dirname(HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const history = getSentHistory();
    history.push(item);

    // Keep last 300 entries to prevent infinite file growth
    const trimmed = history.slice(-300);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save sent article record:', err);
  }
}

/**
 * Curated high-reputation links for fallback and reference grounding
 */
const CREATIVE_LINKS: Record<string, string[]> = {
  design: [
    'https://adaddictth.com',
    'https://creativetalklive.com',
    'https://brandthink.me',
    'https://www.creativebloq.com',
    'https://www.awwwards.com/trends'
  ],
  content: [
    'https://marketingoops.com',
    'https://creativetalklive.com',
    'https://brandthink.me',
    'https://adaddictth.com',
    'https://contentmarketinginstitute.com'
  ],
  pr: [
    'https://adaddictth.com',
    'https://creativetalklive.com',
    'https://brandthink.me',
    'https://www.prdaily.com',
    'https://marketingoops.com'
  ]
};

const HEALTH_LINKS = [
  { link: 'https://www.med.cmu.ac.th', source: 'คณะแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่' },
  { link: 'https://www.thaihealth.or.th', source: 'สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)' },
  { link: 'https://www.rama.mahidol.ac.th', source: 'รามาแชนแนล คณะแพทยศาสตร์ รพ.รามาธิบดี' },
  { link: 'https://dmh.go.th', source: 'กรมสุขภาพจิต กระทรวงสาธารณสุข' },
  { link: 'https://www.pobpad.com', source: 'Pobpad แพลตฟอร์มข้อมูลสุขภาพทางการแพทย์' }
];

/**
 * Call Google Gemini with JSON Response format
 */
async function callGeminiJson(prompt: string): Promise<any | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const models = ['gemini-2.5-flash', 'gemini-3-flash-preview'];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.85, // Higher temperature ensures fresh, diverse topics
            maxOutputTokens: 1000
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.title && parsed.summary) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // try next model
    }
  }
  return null;
}

/**
 * Generate FRESH, NON-REPEATING Creative Trend Article for 12:00 PM
 * Rotates strictly across Design -> Content -> PR
 */
export async function getFreshCreativeTrend(requestedUnit?: 'design' | 'content' | 'pr'): Promise<{
  unitBadge: string;
  title: string;
  summary: string;
  link: string;
  tag: string;
  unit: 'design' | 'content' | 'pr';
}> {
  const history = getSentHistory();
  const pastTrends = history.filter(h => h.type === 'noon_creative_trend');
  const pastTitles = pastTrends.map(h => h.title);

  // Calculate rotation if not explicitly requested
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const unitTypes = ['design', 'content', 'pr'] as const;
  const unit = requestedUnit && unitTypes.includes(requestedUnit)
    ? requestedUnit
    : unitTypes[dayOfYear % 3];

  let unitName = 'Design & Creative';
  let unitBadge = '🎨 [สายงาน Design & Creative]';
  let unitFocus = 'เทรนด์งานออกแบบกราฟิก, AI Generative Art Direction, Motion Graphics, 3D Spatial UI, Typography, Visual Identity ล่าสุดของปี 2026/2027';

  if (unit === 'content') {
    unitName = 'Content Creation';
    unitBadge = '✍️ [สายงาน Content Creation]';
    unitFocus = 'เทรนด์การทำ Short-form Video, Hook 3 วินาที, Storytelling เล่าเรื่องยากให้สนุก, การเขียนแคปชันสะกดสายตา, คอนเทนต์นวัตกรรมและเทคโนโลยี 2026';
  } else if (unit === 'pr') {
    unitName = 'PR & Communications';
    unitBadge = '📢 [สายงาน PR & Communications]';
    unitFocus = 'เทรนด์การสื่อสารองค์กรยุคใหม่, Media Pitching มัดใจ บก. ข่าว, Crisis Communication บนโซเชียล, Event PR เชิงประสบการณ์, การสร้าง Thought Leadership 2026';
  }

  const prompt = `คุณคือน้อง CC บรรณาธิการ AI ผู้ช่วยประจำทีม Creative and Communication (CC) ของอุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP CMU)
วันนี้คุณต้องเขียนบทความ "Creative & Trends Drop" ประจำช่วงเวลา 12:00 น. สำหรับ ${unitName}

🎯 กฎเหล็กที่สำคัญที่สุด:
1. **ห้ามซ้ำกับหัวข้อที่เคยส่งไปแล้วเด็ดขาด!**
รายการหัวข้อที่เคยส่งไปแล้วในอดีต (ห้ามซ้ำหรือคล้ายคลึง):
${pastTitles.slice(-25).map(t => `- ${t}`).join('\n') || '- ยังไม่มีประวัติ'}

2. **เน้นความสดใหม่ กระแสนิยม เทรนด์นวัตกรรมปี 2026 ล่าสุด:**
เจาะจงที่: ${unitFocus}
ให้เป็นเรื่องใหม่ที่คนทำงานสายนี้กำลังพูดถึง นำไปปรับใช้กับการทำงานจริงของทีมได้ทันที

3. **โครงสร้างเนื้อหาบทความ (เนื้อหาแน่น อ่านสนุก 8-12 บรรทัด):**
- เกริ่นนำบริบทและความท้าทายปัจจุบัน
- วิเคราะห์ 3 หัวข้อย่อยหลัก (bullet points) พร้อมตัวอย่างเทคนิคหรือ Case study เจาะลึก
- สรุป Key Takeaway สั้นๆ 1 บรรทัด
- สไตล์ภาษาเป็นกันเอง ฉลาด ทันสมัย มีพลังบวกสไตล์น้อง CC Gen Z

4. **ตอบกลับเป็น JSON เท่านั้น โครงสร้างดังนี้:**
{
  "title": "ชื่อหัวข้อบทความที่น่าดึงดูดและสดใหม่ (ไม่ซ้ำรายการข้างบน)",
  "summary": "เนื้อหาบทความละเอียด 8-12 บรรทัด พร้อม bullet points และ Key Takeaway",
  "link": "เลือกลิงก์ที่น่าเชื่อถือ 1 ลิงก์จาก (${CREATIVE_LINKS[unit].join(', ')})",
  "tag": "#Hashtag 3-4 คำที่ตรงกับเทรนด์"
}`;

  const generated = await callGeminiJson(prompt);

  if (generated && generated.title && generated.summary) {
    const isDuplicate = pastTitles.some(t => t.toLowerCase().includes(generated.title.toLowerCase().trim()));
    if (!isDuplicate) {
      recordSentArticle({
        type: 'noon_creative_trend',
        unit,
        title: generated.title,
        date: new Date().toISOString().split('T')[0],
        sentAt: new Date().toISOString()
      });

      return {
        unitBadge,
        title: generated.title,
        summary: generated.summary,
        link: generated.link || CREATIVE_LINKS[unit][0],
        tag: generated.tag || `#${unitName.replace(/\s+/g, '')} #InnovationTrends #CCInsight`,
        unit
      };
    }
  }

  // Fallback: Diverse, dynamic curated database with unique seeds
  const fallbackList = getDynamicCreativeFallback(unit, pastTitles);
  const selected = fallbackList[0];

  recordSentArticle({
    type: 'noon_creative_trend',
    unit,
    title: selected.title,
    date: new Date().toISOString().split('T')[0],
    sentAt: new Date().toISOString()
  });

  return {
    unitBadge,
    title: selected.title,
    summary: selected.summary,
    link: selected.link,
    tag: selected.tag,
    unit
  };
}

/**
 * Generate FRESH, NON-REPEATING Office Health & Mind Article for 16:45 PM
 */
export async function getFreshEveningHealthMind(): Promise<{
  title: string;
  summary: string;
  link: string;
  source: string;
  tag: string;
}> {
  const history = getSentHistory();
  const pastHealth = history.filter(h => h.type === 'evening_health_mind');
  const pastTitles = pastHealth.map(h => h.title);

  const prompt = `คุณคือน้อง CC น้องเล็ก Gen Z ประจำทีม Creative and Communication (CC) ของ STeP มช.
เขียนบทความ "Office Care & Mind Reset" ประจำช่วงเวลา 16:45 น. (ก่อนเวลาเลิกงาน 15 นาที) เพื่อดูแลสุขภาพกายและสุขภาพใจของพี่ๆ ชาวออฟฟิศ

🎯 กฎเหล็กที่สำคัญที่สุด:
1. **ห้ามซ้ำกับหัวข้อที่เคยส่งไปแล้วเด็ดขาด!**
รายการหัวข้อที่เคยส่งไปแล้วในอดีต (ห้ามซ้ำ):
${pastTitles.slice(-25).map(t => `- ${t}`).join('\n') || '- ยังไม่มีประวัติ'}

2. **เน้นเทรนด์สุขภาพคนทำงานยุคใหม่ (Well-being & Ergonomics 2026):**
เลือก 1 หัวข้อที่สดใหม่และตรงจุด เช่น:
- ท่ายืด Somatic Stretches หรือ Vagus Nerve Reset สลายความเครียดเรื้อรัง
- เทคนิคผ่อนคลายกล้ามเนื้อมือและนิ้วจากการคลิกเมาส์/พิมพ์คีย์บอร์ด (Trigger Finger / Mouse Elbow)
- วิธีรีเซ็ตสมองจาก Brain Fog และ Dopamine Overload หลังจ้องจอทั้งวัน
- กฎการตัดสวิตช์บทบาทคนทำงาน (Work Shutdown Ritual) เพื่อการพักผ่อนที่มีคุณภาพ
- เทคนิคการหายใจแบบ Box Breathing หรือ 4-7-8 เพื่อลดฮอร์โมนคอร์ติซอล (Cortisol)

3. **โครงสร้างเนื้อหา (ละเอียด ทำตามได้จริง 8-12 บรรทัด):**
- อธิบายสาเหตุทางกายภาพหรือจิตใจสั้นๆ
- ระบุขั้นตอนการปฏิบัติเป็นสเต็ป 1-2-3 ชัดเจน ทำตามได้ทันทีบนโต๊ะทำงาน
- ข้อควรระวังและทริกเพิ่มเติม
- คำอวยพรอบอุ่นให้พี่ๆ เลิกงานไปพักผ่อนอย่างมีความสุข

4. **ตอบกลับเป็น JSON เท่านั้น โครงสร้างดังนี้:**
{
  "title": "ชื่อหัวข้อสุขภาพที่สดใหม่และน่าสนใจ (ไม่ซ้ำรายการข้างบน)",
  "summary": "เนื้อหาบทความละเอียด 8-12 บรรทัด พร้อมขั้นตอน 1-2-3 และคำแนะนำ",
  "link": "เลือกลิงก์จากรายชื่อ (https://www.med.cmu.ac.th, https://www.thaihealth.or.th, https://www.rama.mahidol.ac.th, https://dmh.go.th, https://www.pobpad.com)",
  "source": "ชื่อแหล่งข้อมูลทางการแพทย์ที่สอดคล้องกับลิงก์",
  "tag": "#Hashtag 3-4 คำ"
}`;

  const generated = await callGeminiJson(prompt);

  if (generated && generated.title && generated.summary) {
    const isDuplicate = pastTitles.some(t => t.toLowerCase().includes(generated.title.toLowerCase().trim()));
    if (!isDuplicate) {
      recordSentArticle({
        type: 'evening_health_mind',
        title: generated.title,
        date: new Date().toISOString().split('T')[0],
        sentAt: new Date().toISOString()
      });

      return {
        title: generated.title,
        summary: generated.summary,
        link: generated.link || HEALTH_LINKS[0].link,
        source: generated.source || HEALTH_LINKS[0].source,
        tag: generated.tag || '#OfficeSyndrome #MindReset #HealthyOffice'
      };
    }
  }

  // Fallback: Pick a dynamic non-duplicate health topic
  const fallbackList = getDynamicHealthFallback(pastTitles);
  const selected = fallbackList[0];

  recordSentArticle({
    type: 'evening_health_mind',
    title: selected.title,
    date: new Date().toISOString().split('T')[0],
    sentAt: new Date().toISOString()
  });

  return selected;
}

/**
 * Curated Fallback pools that filter out any previously sent titles
 */
function getDynamicCreativeFallback(unit: 'design' | 'content' | 'pr', pastTitles: string[]) {
  const pools: Record<string, any[]> = {
    design: [
      {
        title: "AI & Generative Visuals: วิธีผสาน AI เข้ากับงานดีไซน์ให้มีชั้นเชิงและไม่ซ้ำใคร",
        summary: `ในยุคที่เครื่องมือ Gen-AI เข้าถึงง่ายจนใครๆ ก็เจนรูปได้ ความท้าทายของทีมครีเอทีฟไม่ใช่แค่ "เจนรูปออกมาได้มั้ย" แต่คือ "จะทำอย่างไรให้งานมีเอกลักษณ์เฉพาะตัวและตอบโจทย์แบรนด์":\n\n• **AI เป็น Idea Co-Pilot:** ใช้ AI ช่วยระดม Mood & Tone, หา Texture แปลกใหม่ หรือขึ้น Concept Background ช่วยย่นเวลา Research จากครึ่งวันเหลือเพียง 15 นาที\n• **Human Touch & Art Direction:** หัวใจสำคัญยังคงเป็นการคุม Hierarchy, Typography และ Color Palette ที่ดีไซเนอร์ต้องนำมา Compose และขัดเกลาด้วยตัวเอง\n• **Prompting สไตล์เฉพาะทาง:** ระบุสไตล์เฉพาะ เช่น Editorial Photography, Risograph Print หรือ 3D Clay Render ผสมผสาน Lighting ที่เจาะจง หลีกเลี่ยงภาพสำเร็จรูปที่ดูซ้ำในตลาด\n\n💡 **Key Takeaway:** AI ช่วยเร่งความเร็วในการทดลอง แต่รสนิยมและความเข้าใจโจทย์ของครีเอทีฟคือสิ่งที่สร้างมูลค่าที่แท้จริงครับ!`,
        link: "https://adaddictth.com",
        tag: "#CreativeDesign #ArtDirection #AItools #DesignTrend"
      },
      {
        title: "Kinetic Typography & Motion Graphics: ลูกเล่นตัวอักษรขยับได้ ดึงดูดสายตาบน Social Media",
        summary: `ในสมรภูมิ Social Media ที่ผู้ใช้เลื่อนฟีดด้วยความเร็วสูง การใช้ข้อความนิ่งๆ อาจไม่เพียงพออีกต่อไป เทรนด์ Kinetic Typography จึงกลายเป็นอาวุธสำคัญ:\n\n• **Hook 3 วินาทีแรกด้วย Typo จังหวะกระชับ:** ใช้ลูกเล่นตัวอักษรเด้ง ขยาย หรือซูมเข้าตามจังหวะเสียงพูด ช่วยตรึงสายตาและเพิ่ม Retention Rate ได้มากกว่า 40%\n• **จับคู่ฟอนต์สร้าง Dynamic Contrast:** ใช้ฟอนต์ตัวหนาตัดกับฟอนต์ลายมือ หรือตัวพิมพ์ใหญ่ผสมตัวเอียง เน้นคำสำคัญให้จับใจความได้ทันทีโดยไม่ต้องเปิดเสียง\n• **Sync กับ Sound Effects:** ใส่อนิเมชันการพิมพ์หรือเสียง Whoosh เบาๆ ช่วยให้คอนเทนต์ดูพรีเมียมและน่าติดตามขึ้น\n\n💡 **Key Takeaway:** ตัวอักษรคือองค์ประกอบภาพที่สร้างอารมณ์และขับเคลื่อนจังหวะของงานสร้างสรรค์ครับ!`,
        link: "https://brandthink.me",
        tag: "#MotionGraphic #DesignTrends #Typography #CreativeVisual"
      },
      {
        title: "Tactile & Clay 3D Aesthetic: เทรนด์งานดีไซน์สามมิติสัมผัสดินน้ำมันและงานคราฟต์",
        summary: `ท่ามกลางงานดิจิทัลที่ดูคมกริบ เทรนด์ 3D Claymorphic และ Tactile Textures กำลังมาแรงเพราะให้ความรู้สึกอบอุ่นและจับต้องได้:\n\n• **ความไม่สมบูรณ์แบบที่มีเสน่ห์ (Handmade Imperfection):** การใส่รอยสัมผัส พื้นผิวขรุขระ หรือแสงเงาแบบสตูดิโอถ่ายภาพโมเดลจริง ช่วยลดความแข็งกระด้างของงานกราฟิกคอมพิวเตอร์\n• **เชื่อมโยงกับคนรุ่นใหม่:** สไตล์นี้ให้ความรู้สึกเป็นมิตร เข้าถึงง่าย เหมาะกับแบรนด์นวัตกรรมที่ต้องการสื่อสารเรื่องที่เป็นมิตรกับผู้บริโภค\n• **มิติและการจัดแสง Soft Lighting:** ใช้แสงธรรมชาติและเงาฟุ้ง (Ambient Occlusion) ทำให้ชิ้นงานดูมีน้ำหนักและโดดเด่นสะดุดตาบนฟีด\n\n💡 **Key Takeaway:** ความรู้สึกอบอุ่นแบบงานคราฟต์ช่วยสร้างความไว้วางใจและความผูกพันระหว่างแบรนด์กับผู้ชมได้ลึกซึ้งยิ่งขึ้นครับ!`,
        link: "https://creativetalklive.com",
        tag: "#3DDesign #Claymorphic #VisualTrend #CraftAesthetic"
      }
    ],
    content: [
      {
        title: "Short-form Hook Strategy: กฎ 3 วินาทีแรกของ Content Video ยุคใหม่",
        summary: `งานวิดีโอคุณภาพสูงแต่ยอดวิวไม่เดิน มักเกิดจาก "3 วินาทีแรก" ที่ยังไม่ล็อกนิ้วโป้งคนดู:\n\n• **Visual Disruption:** เปิดเฟรมแรกด้วยภาพที่ไม่คุ้นตา มุมกล้องแปลกใหม่ หรือการเคลื่อนไหวที่ฉับไว เพื่อตัดอารมณ์คนที่กำลังไถฟีดเรื่อยเปื่อย\n• **เปิดด้วย Pain Point หรือคำถามชวนสงสัย:** ยิงประเด็นทันที เช่น "รู้หรือไม่ว่า...", "3 ข้อผิดพลาดที่คนทำ...", หรือแสดงผลลัพธ์สุดท้ายก่อนแล้วค่อยย้อนเล่าวิธีทำ\n• **Micro-Pacing:** ตัดต่อภาพตัดสลับทุก 1.5 - 2.5 วินาที พร้อมใส่ Sound Effect หรือ Subtitle ไฮไลท์คำ เพื่อกระตุ้นความสนใจตลอดเวลา\n\n💡 **Key Takeaway:** อย่าเก็บทีเด็ดไว้ท้ายคลิป จงเอาส่วนที่น่าสนใจที่สุดมาเปิดหัวเพื่อซื้อเวลาให้คนดูอยู่ต่อจนจบครับ!`,
        link: "https://marketingoops.com",
        tag: "#ContentCreator #VideoStrategy #Storytelling #Shorts"
      },
      {
        title: "Storytelling Formula: โครงสร้างเล่าเรื่องนวัตกรรมให้คนทั่วไปเข้าใจง่ายและน่าติดตาม",
        summary: `โจทย์ใหญ่ของทีมสื่อสารวิทยาศาสตร์คือ "เรื่องเข้าใจยากแต่ต้องเล่าให้สนุก" ลองใช้สูตร 3 องก์นี้วางโครงสร้างคอนเทนต์:\n\n• **1. The Hook & The Monster:** เริ่มต้นด้วยปัญหาที่คนฟังเข้าถึงได้ในชีวิตประจำวัน อย่าเพิ่งเปิดด้วยชื่อโปรเจกต์ แต่ให้เปิดด้วยความเจ็บปวดที่กำลังรอการแก้ไข\n• **2. The Struggle & Innovation:** เล่าถึงความพยายามและเทคโนโลยีที่ถูกคิดค้นขึ้นมาเพื่อแก้ปัญหานั้น อธิบายหลักการด้วยการเปรียบเทียบ (Analogy)\n• **3. The Transformation:** สรุปให้เห็นภาพว่าชีวิตคน สังคม หรือโลกใบนี้จะดีขึ้นอย่างไรหลังจากนวัตกรรมนี้สำเร็จ\n\n💡 **Key Takeaway:** คนไม่ได้จำข้อมูลดิบ แต่คนจำ "เรื่องราว" และ "ความรู้สึก" ที่เชื่อมโยงกับชีวิตของพวกเขาครับ!`,
        link: "https://creativetalklive.com",
        tag: "#ContentWriting #Storytelling #Copywriting #InnovationStory"
      },
      {
        title: "Algorithm Shift 2026: คอนเทนต์ที่เน้น Save & Share ชนะคอนเทนต์เรียก Like",
        summary: `อัลกอริทึมของ Social Media ปัจจุบันให้ค่าน้ำหนักกับ "การบันทึกไว้ดูซ้ำ (Save)" และ "การส่งต่อให้เพื่อน (Direct Share)" สูงกว่ายอด Like ธรรมดาถึง 3 เท่า:\n\n• **Cheatsheet & Summary Content:** คอนเทนต์แบบสรุปขั้นตอน, คลังเครื่องมือ, หรือ Infographic แบบ How-to มีอัตราการกด Save สูงสุด\n• **Relatable Emotion:** คอนเทนต์ที่แตะความรู้สึกร่วมของคนทำงาน ช็อตฟีล หรือเรื่องตลกในสายอาชีพ จะมีอัตราการกดแชร์เข้ากลุ่มแชทสูงที่สุด\n• **Clear Call-to-Save:** ทิ้งท้ายคลิปหรือรูปภาพด้วยข้อความเตือนความจำ เช่น "เซฟเก็บไว้ใช้ตอนเริ่มโปรเจกต์หน้าได้เลย!"\n\n💡 **Key Takeaway:** ผลิตคอนเทนต์ที่มีคุณค่าจนคนอยากเก็บไว้เป็นคู่มือส่วนตัว คือสูตรสำเร็จของการเติบโตแบบ Organic ในปัจจุบันครับ!`,
        link: "https://brandthink.me",
        tag: "#SocialAlgorithm #ContentStrategy #GrowthTips #ShareableContent"
      }
    ],
    pr: [
      {
        title: "Modern Media Pitching: วิธีเขียนข่าวประชาสัมพันธ์ (Press Release) ให้บรรณาธิการเลือกตีพิมพ์",
        summary: `ในยุคที่กล่องจดหมายของนักข่าวมีข่าวกว่า 100 ฉบับต่อวัน ข่าวที่จะได้รับการหยิบไปลงต้องมีทั้งคุณค่าและความพร้อมใช้ทันที:\n\n• **Newsworthy Angle:** อย่าเขียนเน้นแค่องค์กรทำอะไร แต่เน้นว่า "สังคมหรือคนอ่านได้อะไร" มีผลกระทบต่อชีวิตคนอย่างไร\n• **คว่ำพีระมิดข่าว (Inverted Pyramid):** สรุป 5W1H ไว้ในย่อหน้าแรก ใครอ่านแค่ 3 บรรทัดแรกก็เข้าใจภาพรวมได้ทันที\n• **Press Kit พร้อมใช้:** แนบลิงก์ Google Drive รวมภาพถ่ายความละเอียดสูงทั้งแนวนอน/แนวตั้ง พร้อมข้อความบรรยายภาพ และเบอร์ติดต่อผู้ให้สัมภาษณ์ที่ติดต่อได้จริง\n\n💡 **Key Takeaway:** ช่วยให้นักข่าวทำงานง่ายและเร็วที่สุด คือหัวใจสำคัญของการรักษาความสัมพันธ์ระยะยาวกับสื่อมวลชนครับ!`,
        link: "https://www.prdaily.com",
        tag: "#PRStrategy #MediaRelations #PressRelease #MediaPitch"
      },
      {
        title: "Crisis Communication: 3 กฎเหล็กรับมือประเด็นดราม่าและสื่อสารอย่างมืออาชีพในภาวะวิกฤต",
        summary: `ความเร็วใน Social Media ทำให้ประเด็นเล็กๆ ลุกลามกลายเป็นวิกฤตองค์กรได้ในเวลาไม่กี่ชั่วโมง การมีหลักยึดที่ชัดเจนจะช่วยกู้วิกฤตได้ทันท่วงที:\n\n• **1. Speed with Empathy:** แถลงการณ์แรกต้องออกภายใน 1-2 ชั่วโมง ยอมรับข้อเท็จจริง แสดงความเสียใจและเห็นอกเห็นใจผู้ได้รับผลกระทบ โดยไม่แก้ตัว\n• **2. Single Source of Truth:** แต่งตั้งผู้ให้ข้อมูลหลักเพียงคนเดียว เพื่อป้องกันข้อมูลขัดแย้งกันเอง\n• **3. Action-Oriented Solutions:** ชี้แจงขั้นตอนการแก้ไขปัญหาเป็นข้อๆ พร้อมไทม์ไลน์ที่ชัดเจน และรายงานความคืบหน้าอย่างโปร่งใส\n\n💡 **Key Takeaway:** การรับมืออย่างซื่อสัตย์ จริงใจ และรวดเร็ว สามารถเปลี่ยนวิกฤตให้กลายเป็นความเชื่อมั่นที่เหนียวแน่นขึ้นได้ครับ!`,
        link: "https://adaddictth.com",
        tag: "#CrisisManagement #PRComm #BrandReputation #CorporatePR"
      },
      {
        title: "Data-Driven PR: การใช้สถิติและผลสำรวจจริงเป็นแม่เหล็กดึงดูดสื่อมวลชน",
        summary: `ข่าวประชาสัมพันธ์ที่มีตัวเลข สถิติ หรือ Insight ผลสำรวจ จะได้รับการแชร์และอ้างอิงจากสื่อสายธุรกิจสูงกว่าข่าวพิธีการเปิดงานถึง 5 เท่า:\n\n• **สร้าง Original Data:** นำข้อมูลจากผลการดำเนินงาน หรือแบบสำรวจความคิดเห็นกลุ่มตัวอย่าง มาสรุปเป็นเปอร์เซ็นต์หรือกราฟเข้าใจง่าย\n• **พาดหัวข่าวด้วยตัวเลขหมัดฮุก:** เช่น "ผลสำรวจชี้ 78% ของสตาร์ทอัพภาคเหนือเลือกใช้ AI เพิ่มผลผลิตในปีนี้"\n• **Infographic One-Sheet:** แนบแผ่นสรุปข้อมูล 1 หน้า ที่สื่อสามารถแคปหน้าจอไปประกอบข่าวหรือโพสต์ลงเพจได้ทันที\n\n💡 **Key Takeaway:** สื่อชอบข้อเท็จจริงและตัวเลขที่จับต้องได้มากกว่าคำโฆษณาเชิงพรรณนาครับ!`,
        link: "https://creativetalklive.com",
        tag: "#DataPR #StrategicComm #PublicRelations #MediaHook"
      }
    ]
  };

  const pool = pools[unit] || pools.design;
  const filtered = pool.filter(item => !pastTitles.some(t => t.toLowerCase().includes(item.title.toLowerCase().trim())));
  return filtered.length > 0 ? filtered : pool;
}

function getDynamicHealthFallback(pastTitles: string[]) {
  const pool = [
    {
      title: "3 ท่ายืดคลายปวดคอ บ่า ไหล่ บนเก้าอี้ทำงาน (Office Syndrome Relief Guide)",
      summary: `การนั่งทำงานหน้าจอคอมพิวเตอร์ติดต่อกันหลายชั่วโมง ทำให้กล้ามเนื้อ Trapezius และสะบักหลังหดเกร็งสะสม ซึ่งเป็นต้นเหตุของอาการปวดร้าวขึ้นศีรษะและสะบักจม ก่อนลุกจากโต๊ะ ลองใช้เวลา 3 นาทีทำ 3 ท่านี้กันครับ:\n\n1. **ท่ายืดสะบักหลัง (Cross-Body Shoulder Stretch):** ยกแขนขวาพาดข้ามหน้าอก ใช้แขนซ้ายงอข้อศอกเกี่ยวและดึงเข้าหาลำตัวจนรู้สึกตึงที่หัวไหล่และสะบัก หายใจเข้า-ออกช้าๆ ค้างไว้ 15-20 วินาที แล้วสลับข้าง\n2. **ท่ายืดกล้ามเนื้อข้างลำคอ (Upper Trapezius Stretch):** นั่งหลังตรง มือขวาจับใต้ขอบเก้าอี้ มือซ้ายเอื้อมข้ามศีรษะมาแตะใบหูขวา ค่อยๆ เอียงศีรษะไปทางซ้ายอย่างนุ่มนวล ค้างไว้ 15 วินาที สลับทำอีกข้าง\n3. **ท่าเปิดอกบีบสะบัก (Chest Opener & Posture Reset):** ประสานมือไว้ด้านหลังท้ายทอย กางข้อศอกออกให้กว้างที่สุด แอ่นอกขึ้นเบาๆ พร้อมหายใจเข้าลึกๆ 5 ครั้ง\n\n⚠️ **ข้อแนะนำ:** ขณะยืดอย่ากลั้นหายใจ และยืดแค่รู้สึกตึงสบาย ทำสม่ำเสมอทุกเย็นจะช่วยฟื้นฟูกล้ามเนื้อได้ดีเยี่ยมครับ!`,
      link: "https://www.med.cmu.ac.th",
      source: "คณะแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่",
      tag: "#OfficeSyndrome #ยืดเส้นยืดสาย #Ergonomics"
    },
    {
      title: "Vagus Nerve Reset: เทคนิครีเซ็ตระบบประสาทคลายเครียดสะสมใน 2 นาที",
      summary: `การทำงานเร่งด่วนและตอบข้อความตลอดวันทำให้ระบบประสาท Sympathetic (สู้หรือหนี) ทำงานหนักจนร่างกายตึงเครียดโดยไม่รู้ตัว:\n\n1. **การกลอกสายตาซ้าย-ขวาแบบนุ่มนวล (Eye Movement Reset):** ประสานมือไว้หลังท้ายทอย หันหน้าตรง กลอกเฉพาะดวงตาไปทางขวาสุด ค้างไว้ 30 วินาทีจนรู้สึกอยากถอนหายใจหรือหาว แล้วสลับมองไปทางซ้าย\n2. **การหายใจแบบ Sighing Breath:** สูดหายใจเข้าทางจมูก 2 จังหวะสั้นๆ แล้วผ่อนลมหายใจออกทางปากยาวๆ ทำซ้ำ 3-5 รอบ อัตราการเต้นของหัวใจจะชะลอลงทันที\n3. **จิบน้ำอุ่นช้าๆ:** การกลืนน้ำอุ่นจะกระตุ้นเส้นประสาท Vagus ในลำคอ ช่วยส่งสัญญาณบอกสมองว่าปลอดภัยและพร้อมพักผ่อน\n\n💡 **Tip:** การรีเซ็ตระบบประสาทก่อนขับรถกลับบ้านช่วยลดอาการอ่อนเพลียสะสมได้อย่างน่าประหลาดใจครับ!`,
      link: "https://dmh.go.th",
      source: "กรมสุขภาพจิต กระทรวงสาธารณสุข",
      tag: "#MentalHealth #VagusNerve #คลายเครียด #MindReset"
    },
    {
      title: "สูตร 20-20-20 ถนอมดวงตาจากแสงสีฟ้าของหน้าจอ (Digital Eye Strain Prevention)",
      summary: `ชาวออฟฟิศที่จ้องหน้าจอมากกว่า 6 ชั่วโมงต่อวัน มักเจอปัญหาตาล้า แสบตา และตาแห้ง การพักสายตาด้วยหลัก 20-20-20 ช่วยฟื้นฟูกล้ามเนื้อตาได้ทันที:\n\n1. **กฎ 20-20-20:** ทุกๆ 20 นาทีของการทำงาน ให้ละสายตาจากหน้าจอแล้วมองออกไปที่จุดไกลๆ 20 ฟุต (ประมาณ 6 เมตร) เป็นเวลา 20 วินาที\n2. **การกะพริบตาและการประคบอุ่น:** กะพริบตาถี่ๆ 10 ครั้ง หรือถูฝ่ามือทั้งสองให้อุ่นแล้วนำมาครอบดวงตาเบาๆ โดยไม่กดทับ 30 วินาที เพื่อกระตุ้นต่อมน้ำตา\n3. **ปรับระดับจอภาพ:** ขอบบนของจอควรอยู่ต่ำกว่าระดับสายตาเล็กน้อย เพื่อให้เปลือกตาเปิดกว้างน้อยลง ช่วยชะลอการระเหยของน้ำตา\n\n💡 **Tip:** คืนนี้ลองหลีกเลี่ยงการไถจอมือถือก่อนนอน 30 นาที เพื่อให้ดวงตาและสมองได้พักผ่อนอย่างแท้จริงครับ!`,
      link: "https://www.pobpad.com",
      source: "Pobpad แพลตฟอร์มข้อมูลสุขภาพทางการแพทย์",
      tag: "#EyeCare #สุขภาพดวงตา #DigitalWellness"
    }
  ];

  const filtered = pool.filter(item => !pastTitles.some(t => t.toLowerCase().includes(item.title.toLowerCase().trim())));
  return filtered.length > 0 ? filtered : pool;
}
