"use client";

import React, { useMemo } from "react";
import {
  Sparkles,
  Target,
  Compass,
  Download,
  TrendingUp,
  AlertTriangle,
  Zap,
  Layers,
  CheckCircle2,
  Users,
  ShieldCheck,
  BrainCircuit,
  ArrowRight
} from "lucide-react";
import { MemberStats, TeamExecutiveAnalysis } from "@/utils/stats";
import { RealtimeOKRSummary } from "@/utils/okrSettings";
import { TeamWorkloadInsights } from "@/utils/teamAnalytics";

interface TeamSwotTowsAnalysisProps {
  orgTotals: {
    totalSaveCost: number;
    totalOwnerCost: number;
    totalAssistantCost: number;
    totalTasks: number;
    tasksWithAssistants: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    activeStaff: number;
  };
  executiveAnalysis: TeamExecutiveAnalysis;
  memberStats: MemberStats[];
  realtimeMetrics?: RealtimeOKRSummary;
  teamWorkloadInsights?: TeamWorkloadInsights;
  unitStats?: Array<{
    unit: string;
    unitLabel: string;
    memberCount: number;
    totalSaveCost: number;
    totalTasksInvolved: number;
    avgDays: number;
    onTimeRate: number;
  }>;
}

export default function TeamSwotTowsAnalysis({
  orgTotals,
  executiveAnalysis,
  memberStats,
  realtimeMetrics,
  teamWorkloadInsights,
  unitStats = []
}: TeamSwotTowsAnalysisProps) {
  // Compute Real-time SWOT & TOWS based on Insights Dashboard Metrics
  const analysis = useMemo(() => {
    const totalTasks = Math.max(orgTotals.totalTasks, 1);
    const completedTasks = orgTotals.completedTasks;
    const saveCost = orgTotals.totalSaveCost;
    const assistantCost = orgTotals.totalAssistantCost;
    const assistantTasks = orgTotals.tasksWithAssistants;
    const collaborationPct = Math.round((assistantTasks / totalTasks) * 100);
    const onTimeRate = executiveAnalysis.teamOnTimeRate ?? 100;
    const avgTurnaround = executiveAnalysis.teamAvgTurnaroundDays || 2.8;
    const staffCount = orgTotals.activeStaff || memberStats.length || 14;
    const pendingTasks = orgTotals.pendingTasks;
    const inProgressTasks = orgTotals.inProgressTasks;
    const overallKR = realtimeMetrics?.overallKRScore ? Math.round(realtimeMetrics.overallKRScore) : 0;
    const burnoutCount = teamWorkloadInsights?.burnoutRiskCount || 0;

    // 1. Strengths (จุดแข็งภายใน - S)
    const strengths = [
      {
        id: "S1",
        title: "มูลค่าการประหยัดงบประมาณองค์กรสูงเด่น (High Save Cost Impact)",
        desc: `ทีม CC สามารถสร้างผลงานประหยัดงบจ้างภายนอกสะสมได้จริง ฿${saveCost.toLocaleString()} จากการส่งมอบงานสำเร็จแล้ว ${completedTasks} ชิ้นงาน (จากทั้งหมด ${orgTotals.totalTasks} ชิ้น) ช่วยลดภาระงบประมาณองค์กรได้ 100%`,
        metric: `฿${saveCost.toLocaleString()} Save Cost`,
        source: "แท็บ 1: จำนวนงาน & มูลค่า",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200"
      },
      {
        id: "S2",
        title: "การส่งมอบงานตรงเวลาและความรวดเร็วตามมาตรฐาน (On-Time Delivery)",
        desc: `อัตราการส่งมอบงานตรงเวลาสูงถึง ${onTimeRate}% ด้วยระยะเวลาการทำงานเฉลี่ย ${avgTurnaround} วัน/ชิ้นงาน แสดงถึงมาตรฐานการบริหารกระบวนการทำงานที่มีความคล่องตัวและเชื่อถือได้สูง`,
        metric: `ตรงเวลา ${onTimeRate}% (${avgTurnaround} วัน/งาน)`,
        source: "แท็บ 3: เวลา & ประสิทธิภาพ",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200"
      },
      {
        id: "S3",
        title: "วัฒนธรรมเพื่อนช่วยเพื่อนเข้มแข็ง (Cross-Unit Collaboration)",
        desc: `มีสัดส่วนงานที่มีผู้ช่วย (Assistant) สูงถึง ${collaborationPct}% (${assistantTasks} ชิ้นงาน) สร้างมูลค่าช่วยเหลืองานกันในทีม ฿${assistantCost.toLocaleString()} พลัง "ลมใต้ปีก" ป้องกันความโดดเดี่ยวในการทำงาน`,
        metric: `ร่วมมือ ${collaborationPct}% (฿${assistantCost.toLocaleString()})`,
        source: "แท็บ 5: สรุปภาพรวมทีม",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
      },
      {
        id: "S4",
        title: "ความเชี่ยวชาญแบบสหวิทยาการครอบคลุม 4 หน่วยงานสร้างสรรค์",
        desc: `ประกอบด้วย 4 สายงานหลัก (Creative, Content, PR, Internal) รวมสมาชิก ${staffCount} คน สามารถผลิตผลงานสื่อสารและสร้างสรรค์ภาพลักษณ์ได้ครบวงจรแบบ One-Stop Creative Service`,
        metric: `4 หน่วยงาน (${staffCount} คน)`,
        source: "โครงสร้างทีม CC",
        badgeColor: "bg-purple-50 text-purple-800 border-purple-200"
      }
    ];

    // 2. Weaknesses (จุดอ่อนภายใน - W)
    const weaknesses = [
      {
        id: "W1",
        title: "งานคั่งค้างในขั้นตอนรอเริ่มและกำลังดำเนินการ (Pending & In-Progress)",
        desc: `มีงานที่อยู่ในสถานะรอเริ่ม (Pending) ${pendingTasks} ชิ้นงาน และกำลังทำ ${inProgressTasks} ชิ้นงาน หากมีงานด่วนเข้ามาซ้อนทับกัน อาจส่งผลต่อคิวเริ่มงาน`,
        metric: `รอเริ่ม ${pendingTasks} / กำลังทำ ${inProgressTasks} งาน`,
        source: "สถานะงานระบบบรีฟ",
        badgeColor: "bg-rose-50 text-rose-800 border-rose-200"
      },
      {
        id: "W2",
        title: "ความไม่สมดุลของภาระงานในบางหน่วยงานและผู้ปฏิบัติงาน (Workload Imbalance)",
        desc: `หน่วยงานสายการผลิตหลัก (Creative / Content) มีปริมาณงานคิดเป็นสัดส่วนสูงที่สุด เมื่อเทียบกับหน่วยอื่น โดยพบสมาชิกที่มีภาระงานสะสมต่อเนื่องหรือมีความเสี่ยง Burnout จำนวน ${burnoutCount} คน`,
        metric: `เฝ้าระวังภาระงานสูง ${burnoutCount} คน`,
        source: "การกระจายภาระงาน",
        badgeColor: "bg-rose-50 text-rose-800 border-rose-200"
      },
      {
        id: "W3",
        title: "การเชื่อมโยงเป้าหมายยุทธศาสตร์ KR / TIP ยังมีช่องว่างในการระบุความสัมพันธ์",
        desc: `งานที่ส่งมอบบางส่วนยังเป็นงานสนับสนุนทั่วไป (Ad-hoc) ที่ยังไม่ได้เชื่อมโยงกับเป้าหมาย KR หรือ TIP ขององค์กรอย่างสมบูรณ์ (ปัจจุบันความสำเร็จภาพรวม KR อยู่ที่ ${overallKR}%)`,
        metric: `ความก้าวหน้า KR รวม ${overallKR}%`,
        source: "แท็บ 2: KR/R, KPI/TIP",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
      },
      {
        id: "W4",
        title: "การพึ่งพาความเชี่ยวชาญเฉพาะบุคคลในงานเทคนิคสูง (Key Person Dependency)",
        desc: `งานที่ต้องใช้ทักษะเฉพาะ เช่น 3D Render, Key Visual, Branding หรือระบบหลังบ้าน ยังพึ่งพาสมาชิกหลักเพียง 1-2 คน หากมีภารกิจซ้อนทับอาจเกิดคอขวด`,
        metric: `เสี่ยงคอขวดทักษะเฉพาะ`,
        source: "ผลงานรายบุคคล",
        badgeColor: "bg-rose-50 text-rose-800 border-rose-200"
      }
    ];

    // 3. Opportunities (โอกาสภายนอก - O)
    const opportunities = [
      {
        id: "O1",
        title: "อุปสงค์งานสื่อสารและการตลาดดิจิทัลของเครือข่ายเติบโตสูง (Digital Demand)",
        desc: `หน่วยงานภายใน มช. และเครือข่ายอุทยานวิทยาศาสตร์ฯ (RSP) มีความต้องการสื่อสารดิจิทัล แคมเปญ และชิ้นงานสร้างสรรค์เพิ่มสูงขึ้นต่อเนื่อง เป็นโอกาสขยายบทบาท Strategic Creative Partner`,
        metric: `ขยายเครือข่าย มช. & RSP`,
        source: "แนวโน้มอุปสงค์องค์กร",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
      },
      {
        id: "O2",
        title: "การยกระดับบริการสู่โครงการ PM งานออกแบบสร้างรายได้เชิงพาณิชย์",
        desc: `ต่อยอดโมเดลโครงการ PM งานออกแบบและที่ปรึกษาแบรนด์แก่ผู้ประกอบการภายนอกและภาคเอกชน เพื่อสร้าง New S-Curve รายได้สุทธิและผลกระทบเชิงเศรษฐกิจแก่อุทยานฯ`,
        metric: `สร้างรายได้ PM เชิงพาณิชย์`,
        source: "โครงการ PM งานออกแบบ",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
      },
      {
        id: "O3",
        title: "การประยุกต์ใช้ Generative AI ในกระบวนการทำงานสร้างสรรค์ (AI Workflow)",
        desc: `การนำ Generative AI มาช่วยร่าง Content, Research, Moodboard และสเก็ตช์ไอเดีย ช่วยลดระยะเวลาทำงานได้ 30-50% และเพิ่ม Capacity การผลิตผลงานขึ้นอย่างก้าวกระโดด`,
        metric: `เพิ่มศักยภาพ 1.5x - 2.0x`,
        source: "เทคโนโลยีสร้างสรรค์",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
      },
      {
        id: "O4",
        title: "การบริหารจัดการทีมเชิงรุกด้วยข้อมูล Data Analytics แบบเรียลไทม์",
        desc: `มีระบบ CC Insights บันทึกข้อมูล Lead Time, Save Cost และภาระงานรายบุคคลแบบ Real-time ช่วยให้หัวหน้าทีมและผู้บริหารตัดสินใจเชิงนโยบายได้อย่างแม่นยำ`,
        metric: `Real-time Decision Making`,
        source: "ระบบ CC Insights",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
      }
    ];

    // 4. Threats (อุปสรรคภายนอก - T)
    const threats = [
      {
        id: "T1",
        title: "ความเร่งด่วนของงานบรีฟแทรกและงานด่วนนอกแผน (Ad-hoc & Rush Requests)",
        desc: `งานบรีฟด่วนที่มีกรอบเวลาส่งกระชั้นชิด (< 48 ชั่วโมง) รบกวนตารางงานหลักของทีม และทำให้ต้องสลับบริบทการทำงาน (Context Switching) บ่อยครั้ง`,
        metric: `ความเสี่ยง SLA งานแทรก`,
        source: "พฤติกรรมการส่งบรีฟ",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
      },
      {
        id: "T2",
        title: "การเปลี่ยนแปลงของอัลกอริทึมและพฤติกรรมผู้บริโภคบนสื่อดิจิทัล",
        desc: `แพลตฟอร์ม Social Media ปรับเปลี่ยนเกณฑ์การเข้าถึง (Reach) อย่างรวดเร็ว ทำให้ทีมต้องอัปเดต Format คอนเทนต์และกลยุทธ์การสื่อสารอย่างสม่ำเสมอ`,
        metric: `ความผันผวนของช่องทางสื่อ`,
        source: "สภาพแวดล้อมสื่อดิจิทัล",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
      },
      {
        id: "T3",
        title: "ข้อจำกัดด้านอัตรากำลังคนต่อปริมาณความต้องการที่ขยายตัว (Capacity Limits)",
        desc: `ทีมงานประจำมีจำนวน ${staffCount} คน หากปริมาณงานในไตรมาสถัดไปเพิ่มขึ้นตามกิจกรรมประจำปี อาจเกิดภาวะงานล้นมือ (Overcapacity)`,
        metric: `กำลังคนจำกัด ${staffCount} คน`,
        source: "ขนาดทีมงาน",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
      },
      {
        id: "T4",
        title: "การแข่งขันในการดึงดูดและรักษาบุคลากรสายสร้างสรรค์และเทคโนโลยี",
        desc: `ตลาดแรงงานสาย Creative, Content และ Tech มีการแข่งขันสูง การรักษาสภาพแวดล้อมการทำงานที่ดีและแรงจูงใจในการทำงานจึงเป็นสิ่งสำคัญยิ่ง`,
        metric: `การรักษาบุคลากรผู้เชี่ยวชาญ`,
        source: "ตลาดแรงงานสายสร้างสรรค์",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
      }
    ];

    // 5. TOWS Strategic Matrix
    const tows = {
      so: {
        strategy: "กลยุทธ์เชิงรุก (SO Strategies - Maxi-Maxi)",
        theme: "ใช้จุดแข็งภายในต่อยอดโอกาสภายนอกเพื่อสร้างการเติบโตเชิงรุก",
        tactics: [
          {
            code: "SO-1",
            title: "ยกระดับสู่ผู้นำด้าน Strategic Creative Partner เครือข่าย RSP & มช.",
            detail: `นำสถิติส่งมอบงานตรงเวลา ${onTimeRate}% และมูลค่า Save Cost ฿${saveCost.toLocaleString()} มาเป็น Showcase เพื่อขยายการรับงานแคมเปญใหญ่และงานสื่อสารเชิงกลยุทธ์ระดับภูมิภาค`,
            links: "S1, S2 x O1, O2"
          },
          {
            code: "SO-2",
            title: "ทวีคูณศักยภาพผลงานด้วย AI x วัฒนธรรมลมใต้ปีก (Assistant Culture)",
            detail: `นำ Generative AI มาเสริมในกระบวนการทำงานร่วมกันข้ามสายงาน (${collaborationPct}% Collaboration) ช่วยให้ทีมผลิตชิ้นงานต้นแบบได้เร็วขึ้น 2 เท่าโดยไม่ต้องเพิ่มทรัพยากร`,
            links: "S3, S4 x O3"
          }
        ]
      },
      wo: {
        strategy: "กลยุทธ์เชิงพลิกฟื้น (WO Strategies - Mini-Maxi)",
        theme: "ใช้โอกาสภายนอกแก้ไขและลดทอนจุดอ่อนภายใน",
        tactics: [
          {
            code: "WO-1",
            title: "ระบบ Smart Templates & AI Automation เร่งเคลียร์งาน Pending",
            detail: `จัดทำชุดเทมเพลตมาตรฐานและนำเครื่องมืออัตโนมัติมาช่วยจัดคิวงานรอเริ่ม ${pendingTasks} ชิ้นงาน เพื่อลดระยะเวลาเริ่มต้นงาน (Waiting Time) ให้สั้นลง`,
            links: "W1 x O3, O4"
          },
          {
            code: "WO-2",
            title: "โครงการ Cross-Skill Training ระหว่าง 4 หน่วยงานสร้างสรรค์",
            detail: `จัดเวิร์กช็อปแลกเปลี่ยนทักษะงานออกแบบระหว่าง Creative, Content และ PR เพื่อให้สมาชิกสามารถทดแทนงานกันได้เมื่อเกิดช่วงพีค ลดการพึ่งพาตัวบุคคลเดี่ยว`,
            links: "W2, W4 x O1"
          }
        ]
      },
      st: {
        strategy: "กลยุทธ์เชิงป้องกัน (ST Strategies - Maxi-Mini)",
        theme: "ใช้จุดแข็งภายในรับมือและป้องกันอุปสรรคความเสี่ยงจากภายนอก",
        tactics: [
          {
            code: "ST-1",
            title: "จัดตั้ง Rapid-Response Assistant Buffer รับมืองานแทรกด่วน",
            detail: `ใช้ประโยชน์จากวัฒนธรรมเพื่อนช่วยเพื่อน (งานช่วย ${assistantTasks} ชิ้น) จัดสรรโควตาผู้ช่วยพร้อมสแตนด์บายรับงานบรีฟด่วน ป้องกันไม่ให้กระทบตารางงานหลัก`,
            links: "S3 x T1"
          },
          {
            code: "ST-2",
            title: "กำหนดข้อตกลง SLA ร่วมด้วยสถิติ Lead Time จริง (Data-Backed SLA)",
            detail: `นำข้อมูลระยะเวลาเฉลี่ย ${avgTurnaround} วัน/งาน มาใช้กำหนดข้อตกลงระยะเวลาส่งบรีฟงานล่วงหน้ากับหน่วยงานผู้ขอรับบริการ เพื่อลดปัญหางานบรีฟกระชั้นชิด`,
            links: "S2 x T1, T3"
          }
        ]
      },
      wt: {
        strategy: "กลยุทธ์เชิงตั้งรับ (WT Strategies - Mini-Mini)",
        theme: "ลดจุดอ่อนภายในและหลีกเลี่ยงผลกระทบจากอุปสรรคภายนอก",
        tactics: [
          {
            code: "WT-1",
            title: "ระบบแจ้งเตือนอัจฉริยะป้องกันคอขวดและภาวะ Overload",
            detail: `ใช้ Dashboard Real-time ตรวจจับเมื่อมีสมาชิกรับภาระงานเกินเกณฑ์ เพื่อกระจายงานทันที และป้องกันความเสี่ยงต่อภาวะหมดไฟ (Burnout)`,
            links: "W1, W2 x T3, T4"
          },
          {
            code: "WT-2",
            title: "คัดกรองงานตามกรอบความคุ้มค่าและยุทธศาสตร์ (Priority Matrix)",
            detail: `จัดลำดับความสำคัญของบรีฟงาน มุ่งเน้นงานที่สร้างมูลค่าสูงและสอดคล้องกับ KR/TIP ของอุทยานฯ พร้อมลดหรืองดเว้นงานสนับสนุนที่ซ้ำซ้อน`,
            links: "W3 x T3"
          }
        ]
      }
    };

    return {
      strengths,
      weaknesses,
      opportunities,
      threats,
      tows,
      metrics: {
        saveCost,
        completedTasks,
        totalTasks,
        collaborationPct,
        onTimeRate,
        avgTurnaround,
        pendingTasks,
        inProgressTasks,
        staffCount
      }
    };
  }, [orgTotals, executiveAnalysis, memberStats, realtimeMetrics, teamWorkloadInsights, unitStats]);

  // Export SWOT & TOWS to CSV / Excel
  const handleExportExcel = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"รายงานการวิเคราะห์เชิงกลยุทธ์ SWOT & TOWS Matrix - CC TEAM INSIGHTS"`);
    lines.push(`"วันที่สร้างรายงาน",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`"มูลค่า Save Cost รวม",${analysis.metrics.saveCost},"บาท"`);
    lines.push(`"งานที่ส่งมอบแล้ว",${analysis.metrics.completedTasks},"ชิ้น"`);
    lines.push(`"อัตราส่งมอบตรงเวลา",${analysis.metrics.onTimeRate},"%"`);
    lines.push(`"ระยะเวลาเฉลี่ย",${analysis.metrics.avgTurnaround},"วัน/ชิ้น"`);
    lines.push(`"สัดส่วนเพื่อนช่วยเพื่อน",${analysis.metrics.collaborationPct},"%"`);
    lines.push("");

    lines.push("=== 1. จุดแข็ง (Strengths - S) ===");
    lines.push('"รหัส","หัวข้อ","รายละเอียด","ตัวชี้วัด","ที่มา"');
    analysis.strengths.forEach(s => {
      lines.push(`"${s.id}","${s.title}","${s.desc.replace(/"/g, '""')}","${s.metric}","${s.source}"`);
    });
    lines.push("");

    lines.push("=== 2. จุดอ่อน (Weaknesses - W) ===");
    lines.push('"รหัส","หัวข้อ","รายละเอียด","ตัวชี้วัด","ที่มา"');
    analysis.weaknesses.forEach(w => {
      lines.push(`"${w.id}","${w.title}","${w.desc.replace(/"/g, '""')}","${w.metric}","${w.source}"`);
    });
    lines.push("");

    lines.push("=== 3. โอกาส (Opportunities - O) ===");
    lines.push('"รหัส","หัวข้อ","รายละเอียด","ตัวชี้วัด","ที่มา"');
    analysis.opportunities.forEach(o => {
      lines.push(`"${o.id}","${o.title}","${o.desc.replace(/"/g, '""')}","${o.metric}","${o.source}"`);
    });
    lines.push("");

    lines.push("=== 4. อุปสรรค (Threats - T) ===");
    lines.push('"รหัส","หัวข้อ","รายละเอียด","ตัวชี้วัด","ที่มา"');
    analysis.threats.forEach(t => {
      lines.push(`"${t.id}","${t.title}","${t.desc.replace(/"/g, '""')}","${t.metric}","${t.source}"`);
    });
    lines.push("");

    lines.push("=== 5. เมทริกซ์กลยุทธ์ TOWS Matrix ===");
    lines.push('"มิติกลยุทธ์","รหัส","มาตรการเชิงปฏิบัติการ","รายละเอียด","ปัจจัยที่เชื่อมโยง"');
    Object.values(analysis.tows).forEach(group => {
      group.tactics.forEach(t => {
        lines.push(`"${group.strategy}","${t.code}","${t.title}","${t.detail.replace(/"/g, '""')}","${t.links}"`);
      });
    });

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CC_Team_SWOT_TOWS_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header Card with Real-time Status and Multi-Source Integration Summary */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-1">
              <Sparkles size={12} className="text-rose-600" />
              <span>Real-Time Strategic Intelligence</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              <span>การวิเคราะห์ SWOT &amp; TOWS Matrix ภาพรวมทีม CC</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ประมวลผลสดจากข้อมูล Insights
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              สังเคราะห์ข้อมูลเรียลไทม์จาก <strong>1. จำนวนงาน &amp; Save Cost</strong>, <strong>2. เป้าหมาย KR/TIP</strong>, <strong>3. เวลา &amp; ประสิทธิภาพ</strong>, และ <strong>4. วัฒนธรรมความร่วมมือในทีม</strong>
            </p>
          </div>

          {/* Right Action & Snapshot Stats Container */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Real-time Snapshot Pill Stats */}
            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
              <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-600 block font-sans font-semibold">Save Cost รวม</span>
                <span className="font-bold text-emerald-900">฿{analysis.metrics.saveCost.toLocaleString()}</span>
              </div>
              <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-center">
                <span className="text-[10px] text-blue-600 block font-sans font-semibold">ส่งมอบตรงเวลา</span>
                <span className="font-bold text-blue-900">{analysis.metrics.onTimeRate}%</span>
              </div>
              <div className="bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 text-center">
                <span className="text-[10px] text-purple-600 block font-sans font-semibold">เพื่อนช่วยเพื่อน</span>
                <span className="font-bold text-purple-900">{analysis.metrics.collaborationPct}%</span>
              </div>
            </div>

            {/* Download Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.csv ภาษาไทยสมบูรณ์)"
            >
              <Download size={14} />
              <span>ดาวน์โหลด Excel</span>
            </button>
          </div>
        </div>

        {/* Section 1: SWOT Analysis (4-Grid) */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Target size={17} className="text-[#E03131]" />
              <h4 className="text-sm font-bold text-slate-900">
                1. การประเมินสภาวะแวดล้อม SWOT Analysis (4 มิติ)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              ปัจจัยภายใน (จุดแข็ง/จุดอ่อน) &amp; ปัจจัยภายนอก (โอกาส/อุปสรรค)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* S - Strengths */}
            <div className="bg-emerald-50/30 rounded-2xl border border-emerald-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    S
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-emerald-950">
                      Strengths (จุดแข็งภายใน)
                    </h5>
                    <p className="text-[10.5px] text-emerald-700">ศักยภาพ มาตรฐานความคุ้มค่า และการส่งมอบตรงเวลา</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {analysis.strengths.length} ปัจจัยหลัก
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.strengths.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-emerald-200/60 shadow-2xs space-y-1.5 hover:border-emerald-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${item.badgeColor}`}>
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>ที่มา: {item.source}</span>
                      <span className="font-mono font-bold text-emerald-600">[{item.id}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* W - Weaknesses */}
            <div className="bg-rose-50/30 rounded-2xl border border-rose-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    W
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-rose-950">
                      Weaknesses (จุดอ่อนภายใน)
                    </h5>
                    <p className="text-[10.5px] text-rose-700">ข้อจำกัด คิวงานคั่งค้าง และจุดที่ต้องเพิ่มความคล่องตัว</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  {analysis.weaknesses.length} ประเด็นพัฒนา
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.weaknesses.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-rose-200/60 shadow-2xs space-y-1.5 hover:border-rose-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${item.badgeColor}`}>
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>ที่มา: {item.source}</span>
                      <span className="font-mono font-bold text-rose-600">[{item.id}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* O - Opportunities */}
            <div className="bg-blue-50/30 rounded-2xl border border-blue-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    O
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-blue-950">
                      Opportunities (โอกาสภายนอก)
                    </h5>
                    <p className="text-[10.5px] text-blue-700">อุปสงค์สื่อดิจิทัล โครงการ PM และเทคโนโลยี AI</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  {analysis.opportunities.length} โอกาสการเติบโต
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.opportunities.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-blue-200/60 shadow-2xs space-y-1.5 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${item.badgeColor}`}>
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>ที่มา: {item.source}</span>
                      <span className="font-mono font-bold text-blue-600">[{item.id}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* T - Threats */}
            <div className="bg-amber-50/30 rounded-2xl border border-amber-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    T
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-amber-950">
                      Threats (อุปสรรคภายนอก)
                    </h5>
                    <p className="text-[10.5px] text-amber-700">งานแทรกด่วน ความผันผวนของสื่อ และข้อจำกัดกำลังคน</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {analysis.threats.length} ปัจจัยเสี่ยง
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.threats.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs space-y-1.5 hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${item.badgeColor}`}>
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>ที่มา: {item.source}</span>
                      <span className="font-mono font-bold text-amber-600">[{item.id}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: TOWS Strategic Matrix (4 Quadrants) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Compass size={17} className="text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">
                2. เมทริกซ์กำหนดกลยุทธ์เชิงปฏิบัติการ TOWS Strategic Matrix
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              การจับคู่ปัจจัย S-W x O-T กำหนดมาตรการขับเคลื่อน 4 ทิศทาง
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SO Strategies */}
            <div className="bg-emerald-50/25 rounded-2xl border border-emerald-300 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-2xs">
                    SO
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-emerald-950">
                      {analysis.tows.so.strategy}
                    </h5>
                    <p className="text-[10.5px] text-emerald-700">{analysis.tows.so.theme}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  จุดแข็ง x โอกาส
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.tows.so.tactics.map(tactic => (
                  <div key={tactic.code} className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
                        {tactic.code}
                      </span>
                      <h6 className="text-xs font-bold text-slate-900 leading-snug">
                        {tactic.title}
                      </h6>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                      {tactic.detail}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] pl-6 flex-wrap gap-1">
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ปัจจัยเชื่อมโยง: {tactic.links}
                      </span>
                      <span className="text-slate-400 font-medium">แผนขับเคลื่อนหลัก</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WO Strategies */}
            <div className="bg-blue-50/25 rounded-2xl border border-blue-300 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs shadow-2xs">
                    WO
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-blue-950">
                      {analysis.tows.wo.strategy}
                    </h5>
                    <p className="text-[10.5px] text-blue-700">{analysis.tows.wo.theme}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                  จุดอ่อน x โอกาส
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.tows.wo.tactics.map(tactic => (
                  <div key={tactic.code} className="bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-2xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold shrink-0">
                        {tactic.code}
                      </span>
                      <h6 className="text-xs font-bold text-slate-900 leading-snug">
                        {tactic.title}
                      </h6>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                      {tactic.detail}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] pl-6 flex-wrap gap-1">
                      <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        ปัจจัยเชื่อมโยง: {tactic.links}
                      </span>
                      <span className="text-slate-400 font-medium">มาตรการแก้ไข</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ST Strategies */}
            <div className="bg-amber-50/25 rounded-2xl border border-amber-300 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-600 text-white font-black text-xs shadow-2xs">
                    ST
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-amber-950">
                      {analysis.tows.st.strategy}
                    </h5>
                    <p className="text-[10.5px] text-amber-700">{analysis.tows.st.theme}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                  จุดแข็ง x อุปสรรค
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.tows.st.tactics.map(tactic => (
                  <div key={tactic.code} className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold shrink-0">
                        {tactic.code}
                      </span>
                      <h6 className="text-xs font-bold text-slate-900 leading-snug">
                        {tactic.title}
                      </h6>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                      {tactic.detail}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] pl-6 flex-wrap gap-1">
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ปัจจัยเชื่อมโยง: {tactic.links}
                      </span>
                      <span className="text-slate-400 font-medium">มาตรการป้องกัน</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WT Strategies */}
            <div className="bg-rose-50/25 rounded-2xl border border-rose-300 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs shadow-2xs">
                    WT
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-rose-950">
                      {analysis.tows.wt.strategy}
                    </h5>
                    <p className="text-[10.5px] text-rose-700">{analysis.tows.wt.theme}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                  จุดอ่อน x อุปสรรค
                </span>
              </div>

              <div className="space-y-2.5">
                {analysis.tows.wt.tactics.map(tactic => (
                  <div key={tactic.code} className="bg-white p-3.5 rounded-xl border border-rose-200/80 shadow-2xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono font-bold shrink-0">
                        {tactic.code}
                      </span>
                      <h6 className="text-xs font-bold text-slate-900 leading-snug">
                        {tactic.title}
                      </h6>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                      {tactic.detail}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] pl-6 flex-wrap gap-1">
                      <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ปัจจัยเชื่อมโยง: {tactic.links}
                      </span>
                      <span className="text-slate-400 font-medium">มาตรการควบคุมความเสี่ยง</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
