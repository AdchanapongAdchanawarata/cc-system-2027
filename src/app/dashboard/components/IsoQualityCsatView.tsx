"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Sparkles,
  HeartHandshake,
  MessageSquare,
  ThumbsUp,
  Clock,
  Target,
  AlertCircle,
  Filter,
  Search,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

// =========================================================================
// TYPES & DATA FOR TAB 5: QUALITY OBJECTIVES & CSAT ANALYTICS
// =========================================================================

export interface QualityObjectiveItem {
  id: string;
  code: string;
  objectiveTitle: string;
  metric: string;
  targetValue: string;
  actualValue: string;
  status: "surpassed" | "achieved" | "in_progress" | "risk";
  statusLabel: string;
  achievementPercent: number;
  responsibleUnit: string;
  responsiblePerson: string;
  q1Actual: string;
  q2Actual: string;
  q3Actual: string;
  q4Actual: string;
  actionPlan: string;
}

export interface UnitCsatScore {
  unitId: string;
  unitName: string;
  overallScore: number; // 5.0
  overallPercent: number; // 100%
  sampleCount: number;
  subScores: {
    criteria: string;
    score: number;
    weight: string;
  }[];
  strengthNote: string;
  improvementNote: string;
}

export interface CustomerVoiceItem {
  id: string;
  clientType: "คณะ/ส่วนงาน มช." | "ผู้ประกอบการภาคเอกชน" | "นักวิจัย/คณาจารย์" | "สาธารณชน";
  departmentName: string;
  projectName: string;
  unitInvolved: "งานออกแบบ" | "สื่อสารองค์กร" | "ผลิตสื่อสร้างสรรค์" | "บูรณาการทุกยูนิต";
  feedbackType: "คำชมเชย (Compliment)" | "ข้อเสนอแนะพัฒนา (Opportunity)";
  sentiment: "positive" | "constructive";
  comment: string;
  actionTaken: string;
  actionStatus: "ดำเนินการแล้ว" | "กำลังติดตามผล";
  dateRecorded: string;
}

const QUALITY_OBJECTIVES: QualityObjectiveItem[] = [
  {
    id: "obj-1",
    code: "Q-OBJ-01",
    objectiveTitle: "ระดับความพึงพอใจโดยรวมของผู้รับบริการ (Overall Customer Satisfaction)",
    metric: "คะแนนแบบสำรวจ CSAT เฉลี่ยสะสมตลอดปี",
    targetValue: "≥ 85.0%",
    actualValue: "91.4%",
    status: "surpassed",
    statusLabel: "บรรลุเป้าหมาย (เกินเกณฑ์ +6.4%)",
    achievementPercent: 107.5,
    responsibleUnit: "บูรณาการทั้ง 3 ยูนิต",
    responsiblePerson: "วา WK & สมาชิกทุกคน",
    q1Actual: "89.2%",
    q2Actual: "90.8%",
    q3Actual: "92.1%",
    q4Actual: "93.5%",
    actionPlan: "รักษามาตรฐานการรับบรีฟ และส่งแบบสำรวจดิจิทัลทันทีหลังส่งมอบงาน"
  },
  {
    id: "obj-2",
    code: "Q-OBJ-02",
    objectiveTitle: "อัตราการส่งมอบงานตรงตามกำหนดเวลาที่ตกลง (On-time Delivery Rate)",
    metric: "เปอร์เซ็นต์ของโปรเจกต์ที่ส่งมอบเสร็จสิ้นตาม Timeline ใน WI",
    targetValue: "≥ 90.0%",
    actualValue: "93.8%",
    status: "surpassed",
    statusLabel: "บรรลุเป้าหมาย (เกินเกณฑ์ +3.8%)",
    achievementPercent: 104.2,
    responsibleUnit: "ฝ่ายบริหารโครงการ & WI",
    responsiblePerson: "จ๊อบ AA & วา WK",
    q1Actual: "91.5%",
    q2Actual: "92.0%",
    q3Actual: "95.2%",
    q4Actual: "96.5%",
    actionPlan: "ใช้ระบบแจ้งเตือนกำหนดส่งมอบล่วงหน้า 48 ชั่วโมง และจัดสมดุลภาระงานแบบไดนามิก"
  },
  {
    id: "obj-3",
    code: "Q-OBJ-03",
    objectiveTitle: "การควบคุมอัตราการแก้ไขงานซ้ำซ้อน (Rework / Revision Rate)",
    metric: "สัดส่วนงานที่ต้องแก้งานเกิน 2 รอบเนื่องจากข้อผิดพลาดของทีม",
    targetValue: "≤ 5.0%",
    actualValue: "3.2%",
    status: "surpassed",
    statusLabel: "บรรลุเป้าหมาย (ต่ำกว่าเกณฑ์ -1.8%)",
    achievementPercent: 136.0,
    responsibleUnit: "ยูนิตงานออกแบบ & ยูนิตผลิตสื่อ",
    responsiblePerson: "จอย RL & เอ็นจอย SLR",
    q1Actual: "4.1%",
    q2Actual: "3.5%",
    q3Actual: "2.8%",
    q4Actual: "2.4%",
    actionPlan: "เพิ่มขั้นตอน Peer Review ตรวจสอบคำผิดและสัดส่วน CI ก่อนส่งงานให้ลูกค้าตรวจ"
  },
  {
    id: "obj-4",
    code: "Q-OBJ-04",
    objectiveTitle: "ปริมาณสื่อสร้างสรรค์และข่าวสารองค์กรที่เผยแพร่สำเร็จ",
    metric: "จำนวนชิ้นงานสำเร็จที่เผยแพร่ผ่านช่องทางทางการ (Total Produced Assets)",
    targetValue: "360 ชิ้น/ปี",
    actualValue: "412 ชิ้น",
    status: "surpassed",
    statusLabel: "บรรลุเป้าหมาย (114.4% ของแผน)",
    achievementPercent: 114.4,
    responsibleUnit: "บูรณาการ 3 ยูนิต",
    responsiblePerson: "ลูกอิน STK & ทีมสื่อสร้างสรรค์",
    q1Actual: "94 ชิ้น",
    q2Actual: "102 ชิ้น",
    q3Actual: "108 ชิ้น",
    q4Actual: "108 ชิ้น",
    actionPlan: "นำระบบแม่แบบอัจฉริยะ (Template Automation) และ AI Tools มาช่วยทุ่นแรงในการขึ้นโครงงาน"
  }
];

const UNIT_CSAT_DATA: UnitCsatScore[] = [
  {
    unitId: "design",
    unitName: "ยูนิตงานออกแบบ (Creative Design Unit)",
    overallScore: 4.62,
    overallPercent: 92.4,
    sampleCount: 128,
    subScores: [
      { criteria: "ความคิดสร้างสรรค์และความสวยงาม (Creativity & Aesthetics)", score: 4.75, weight: "30%" },
      { criteria: "ความถูกต้องตามโจทย์และมาตรฐาน CI (CI Compliance)", score: 4.68, weight: "25%" },
      { criteria: "ความรวดเร็วและตรงต่อเวลา (Speed & Punctuality)", score: 4.54, weight: "25%" },
      { criteria: "การสื่อสารและความสุภาพของผู้ให้บริการ (Coordination)", score: 4.51, weight: "20%" }
    ],
    strengthNote: "โดดเด่นด้านเอกลักษณ์งานออกแบบทันสมัย และเข้าใจอัตลักษณ์ของอุทยานฯ อย่างลึกซึ้ง",
    improvementNote: "ระยะเวลาในการบรีฟงานด่วนบางชิ้นกระชั้นชิดเกินไป ควรส่งบรีฟล่วงหน้าตามระยะเวลามาตรฐาน"
  },
  {
    unitId: "pr",
    unitName: "ยูนิตสื่อสารองค์กร (Corporate PR Unit)",
    overallScore: 4.55,
    overallPercent: 91.0,
    sampleCount: 84,
    subScores: [
      { criteria: "ความถูกต้องแม่นยำของเนื้อหาข่าว (Accuracy & Fact-checking)", score: 4.70, weight: "30%" },
      { criteria: "การกระจายสื่อและความครอบคลุมช่องทาง (Media Reach)", score: 4.55, weight: "25%" },
      { criteria: "ความรวดเร็วในการเผยแพร่ข่าวสาร (Timeliness)", score: 4.45, weight: "25%" },
      { criteria: "การประสานงานสื่อมวลชนและสถานที่ (Event PR Support)", score: 4.50, weight: "20%" }
    ],
    strengthNote: "ข่าวสารเขียนกระชับ เข้าใจง่าย ข้อมูลวิจัยถูกต้องไม่บิดเบือน มีภาพลักษณ์น่าเชื่อถือ",
    improvementNote: "เพิ่มการจัดทำสรุปข่าวฉบับภาษาอังกฤษสำหรับเครือข่ายความร่วมมือนานาชาติ"
  },
  {
    unitId: "content",
    unitName: "ยูนิตผลิตสื่อสร้างสรรค์ (Content & Video Unit)",
    overallScore: 4.54,
    overallPercent: 90.8,
    sampleCount: 96,
    subScores: [
      { criteria: "ความน่าสนใจและการดึงดูดสายตา (Engagement & Hook)", score: 4.68, weight: "30%" },
      { criteria: "คุณภาพของภาพและเสียง (AV Production Quality)", score: 4.60, weight: "25%" },
      { criteria: "ความเข้าใจง่ายของการย่อยเนื้อหายาก (Simplicity)", score: 4.48, weight: "25%" },
      { criteria: "การปรับแต่งตามแพลตฟอร์ม Social (Format Suitability)", score: 4.40, weight: "20%" }
    ],
    strengthNote: "วิดีโอสั้น Reels/TikTok มีจังหวะตัดต่อสนุก ดึงดูดกลุ่มคนรุ่นใหม่และนักศึกษา",
    improvementNote: "เพิ่มคำบรรยาย (Subtitles/Captions) ภาษาไทยและอังกฤษในทุกคลิปอย่างสม่ำเสมอ"
  }
];

const CUSTOMER_FEEDBACKS: CustomerVoiceItem[] = [
  {
    id: "fb-1",
    clientType: "คณะ/ส่วนงาน มช.",
    departmentName: "คณะวิทยาศาสตร์ มหาวิทยาลัยเชียงใหม่",
    projectName: "แคมเปญประชาสัมพันธ์งานประชุมวิชาการนานาชาติ",
    unitInvolved: "บูรณาการทุกยูนิต",
    feedbackType: "คำชมเชย (Compliment)",
    sentiment: "positive",
    comment: "ทีมงาน CC ทำงานอย่างมืออาชีพมาก ทั้งโปสเตอร์และวิดีโอโปรโมตช่วยเพิ่มยอดผู้ลงทะเบียนร่วมงานเกินเป้าหมาย 150%",
    actionTaken: "ส่งต่อคำชมให้สมาชิกในที่ประชุมประจำสัปดาห์ และบันทึกเป็นผลงานอ้างอิง",
    actionStatus: "ดำเนินการแล้ว",
    dateRecorded: "12 ก.พ. 2569"
  },
  {
    id: "fb-2",
    clientType: "ผู้ประกอบการภาคเอกชน",
    departmentName: "บริษัท นวัตกรรมอาหารชีวภาพล้านนา จำกัด",
    projectName: "การออกแบบบรรจุภัณฑ์และฉลากสินค้าเพื่อส่งออก",
    unitInvolved: "งานออกแบบ",
    feedbackType: "คำชมเชย (Compliment)",
    sentiment: "positive",
    comment: "งานออกแบบฉลากและกล่องมีความทันสมัย โดดเด่นกว่าสินค้าเดิมในท้องตลาดอย่างชัดเจน ได้รับคำชมจากคู่ค้าต่างประเทศ",
    actionTaken: "เก็บบันทึกไฟล์บรรจุภัณฑ์ลงในคลังผลงานดีเด่นเพื่อการตรวจประเมิน ISO ข้อ 8.3",
    actionStatus: "ดำเนินการแล้ว",
    dateRecorded: "25 ม.ค. 2569"
  },
  {
    id: "fb-3",
    clientType: "นักวิจัย/คณาจารย์",
    departmentName: "สถาบันวิจัยพหุศาสตร์ มช.",
    projectName: "คลิปวิดีโอย่อยงานวิจัยคาร์บอนเครดิตเพื่อชุมชน",
    unitInvolved: "ผลิตสื่อสร้างสรรค์",
    feedbackType: "ข้อเสนอแนะพัฒนา (Opportunity)",
    sentiment: "constructive",
    comment: "เนื้อหาวิดีโอเข้าใจง่าย ภาพสวยมาก แต่อยากให้เพิ่มคำบรรยายซับไตเติลขนาดใหญ่ขึ้นเล็กน้อยสำหรับกลุ่มผู้สูงอายุในชุมชน",
    actionTaken: "ปรับปรุงแนวปฏิบัติการทำ Closed Caption ในคู่มือ WI กำหนดขนาดฟอนต์ให้อ่านง่ายในสมาร์ตโฟน",
    actionStatus: "ดำเนินการแล้ว",
    dateRecorded: "04 มี.ค. 2569"
  },
  {
    id: "fb-4",
    clientType: "สาธารณชน",
    departmentName: "ผู้ติดตามเพจและผู้ใช้บริการพื้นที่ STeP",
    projectName: "ข่าวสารการเปิดให้บริการห้องปฏิบัติการ FabLab",
    unitInvolved: "สื่อสารองค์กร",
    feedbackType: "คำชมเชย (Compliment)",
    sentiment: "positive",
    comment: "แอดมินเพจตอบข้อความเร็วมาก ให้ข้อมูลค่าบริการและขั้นตอนการจองห้องปฏิบัติการอย่างสุภาพ ชัดเจน",
    actionTaken: "นำเทมเพลตคำตอบมาตรฐานไปเผยแพร่ในระบบความรู้องค์กร (KM) ของทีม",
    actionStatus: "ดำเนินการแล้ว",
    dateRecorded: "18 ก.พ. 2569"
  }
];

export default function IsoQualityCsatView() {
  const [activeUnitTab, setActiveUnitTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFeedbacks = useMemo(() => {
    return CUSTOMER_FEEDBACKS.filter((fb) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        fb.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.comment.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [searchTerm]);

  const handleExportExcel = () => {
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "รายงานวัตถุประสงค์คุณภาพและรายงานการวิเคราะห์ความพึงพอใจลูกค้า (ISO 9001:2015 ข้อ 6.2, 9.1.2, 9.1.3)\n";
    csv += `หน่วยงาน: ทีมสร้างสรรค์และการสื่อสาร (CC TEAM) อุทยานวิทยาศาสตร์ฯ มช.\n`;
    csv += `วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}\n\n`;

    csv += "=== ส่วนที่ 1: การติดตามผลสัมฤทธิ์วัตถุประสงค์คุณภาพ (Quality Objectives Scorecard) ===\n";
    csv += "รหัส,วัตถุประสงค์คุณภาพ,ตัวชี้วัด,ค่าเป้าหมาย,ผลงานจริงสะสม,สถานะผลงาน,เปอร์เซ็นต์บรรลุ,ยูนิตผู้รับผิดชอบ,ผู้รับผิดชอบหลัก,Q1,Q2,Q3,Q4,แผนปฏิบัติการและการปรับปรุง\n";

    QUALITY_OBJECTIVES.forEach((obj) => {
      csv += `"${obj.code}","${obj.objectiveTitle.replace(/"/g, '""')}","${obj.metric}","${obj.targetValue}","${obj.actualValue}","${obj.statusLabel}",${obj.achievementPercent}%,"${obj.responsibleUnit}","${obj.responsiblePerson}","${obj.q1Actual}","${obj.q2Actual}","${obj.q3Actual}","${obj.q4Actual}","${obj.actionPlan.replace(/"/g, '""')}"\n`;
    });

    csv += "\n=== ส่วนที่ 2: ผลสำรวจคะแนนความพึงพอใจลูกค้า (CSAT Analytics) แยกตาม 3 ยูนิต ===\n";
    csv += "ยูนิต,คะแนนเฉลี่ย (เต็ม 5.0),เทียบเป็นเปอร์เซ็นต์,จำนวนกลุ่มตัวอย่างผู้ตอบ,จุดแข็งเด่น,ประเด็นพัฒนา\n";

    UNIT_CSAT_DATA.forEach((u) => {
      csv += `"${u.unitName}",${u.overallScore},${u.overallPercent}%,${u.sampleCount},"${u.strengthNote.replace(/"/g, '""')}","${u.improvementNote.replace(/"/g, '""')}"\n`;
    });

    csv += "\n=== ส่วนที่ 3: สรุปเสียงสะท้อนจากผู้ใช้บริการและการปฏิบัติการแก้ไข (Customer Voice & Action) ===\n";
    csv += "ลำดับ,กลุ่มผู้รับบริการ,หน่วยงาน / ลูกค้า,โครงการที่รับบริการ,ยูนิตที่เกี่ยวข้อง,ประเภทข้อเสนอแนะ,ความคิดเห็น / เสียงสะท้อน,มาตรการดำเนินการปรับปรุง,สถานะ,วันที่บันทึก\n";

    CUSTOMER_FEEDBACKS.forEach((fb, idx) => {
      csv += `${idx + 1},"${fb.clientType}","${fb.departmentName}","${fb.projectName}","${fb.unitInvolved}","${fb.feedbackType}","${fb.comment.replace(/"/g, '""')}","${fb.actionTaken.replace(/"/g, '""')}","${fb.actionStatus}","${fb.dateRecorded}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `5_เป้าหมายคุณภาพและCSAT_CC_TEAM_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="sec-csat-kpi">
      {/* ========================================================================= */}
      {/* 1. HEADER STRIP & EXCEL DOWNLOAD                                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap inline-flex items-center gap-1.5 w-fit">
              <Target size={13} />
              <span>เอกสารแนบ 5: วัตถุประสงค์คุณภาพและการประเมินความพึงพอใจลูกค้า (ISO 6.2, 9.1.2, 9.1.3)</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ไฟล์อ้างอิง: <strong className="text-slate-700">QP-CC-03 รายงานผลการดำเนินงานตามเป้าหมายคุณภาพประจำปี</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="ml-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
            title="ดาวน์โหลด Excel รายงานเป้าหมายคุณภาพและการวิเคราะห์ CSAT"
          >
            <FileSpreadsheet size={15} />
            <span>ดาวน์โหลด Excel</span>
          </button>
        </div>

        {/* Title and Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="text-emerald-600" size={22} />
              <span>ผลสัมฤทธิ์วัตถุประสงค์คุณภาพและคะแนนความพึงพอใจลูกค้า (CSAT Analytics)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              การติดตามตัวชี้วัดคุณภาพระดับทีม (Quality Objectives Tracking) และการวิเคราะห์แนวโน้มผลประเมินความพึงพอใจของผู้รับบริการ
              พร้อมระบบรวบรวมเสียงสะท้อน (Voice of Customer) เพื่อการปรับปรุงอย่างต่อเนื่องตามข้อกำหนด ISO 9001:2015
            </p>
          </div>
        </div>

        {/* Scorecard Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {QUALITY_OBJECTIVES.map((obj) => (
            <div
              key={obj.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {obj.code}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>{obj.statusLabel.split(" ")[0]}</span>
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 h-8">{obj.objectiveTitle}</h4>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black text-slate-900 font-mono">{obj.actualValue}</span>
                  <span className="text-xs text-slate-500 ml-1 font-mono">/ เป้า {obj.targetValue}</span>
                </div>
                <span className="text-xs font-black text-emerald-600 font-mono">
                  {obj.achievementPercent}%
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(obj.achievementPercent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Q1-Q4: {obj.q1Actual} → {obj.q4Actual}</span>
                <span className="text-emerald-700 font-bold">ผ่านเกณฑ์</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CSAT BREAKDOWN BY 3 UNITS                                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5" id="sec-csat-breakdown">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="text-emerald-600" size={20} />
              <span>ผลประเมินความพึงพอใจผู้รับบริการแยกตาม 3 ยูนิตการทำงาน (CSAT Unit Breakdown)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ผลการประเมินจากผู้ขอรับบริการจริงครอบคลุมทั้ง 4 มิติคุณภาพ: สุนทรียภาพ, ความถูกต้อง CI, ความรวดเร็ว, และการประสานงาน
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full w-fit">
            กลุ่มตัวอย่างรวม 308 ชุดการประเมิน
          </span>
        </div>

        {/* 3 Units CSAT Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {UNIT_CSAT_DATA.map((unit) => (
            <div
              key={unit.unitId}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{unit.unitName}</h4>
                  <span className="text-[11px] font-mono text-slate-500">N = {unit.sampleCount}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 font-mono">{unit.overallScore.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-mono">/ 5.00</span>
                  <span className="ml-auto text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                    {unit.overallPercent}%
                  </span>
                </div>

                {/* Sub Scores List */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  {unit.subScores.map((sub, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 text-[11px]">{sub.criteria}</span>
                        <span className="font-bold text-slate-900 font-mono">{sub.score.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${(sub.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strength & Improvement Notes */}
              <div className="pt-3 border-t border-slate-200 text-xs space-y-1.5">
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  <strong>จุดแข็ง:</strong> {unit.strengthNote}
                </div>
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100">
                  <strong>ประเด็นต่อยอด:</strong> {unit.improvementNote}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CUSTOMER VOICE & ACTION TAKEN (ISO 9.1.2)                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5" id="sec-csat-feedback">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="text-emerald-600" size={20} />
              <span>เสียงสะท้อนจากผู้ใช้บริการจริง และการปฏิบัติการพัฒนา (Customer Voice & Actions)</span>
            </h3>
            <p className="text-xs text-slate-500">
              การรวบรวมข้อเสนอแนะ การตอบสนองต่อผู้รับบริการ และมาตรการพัฒนาคุณภาพบริการ
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="ค้นหาข้อเสนอแนะ, หน่วยงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Feedback Cards / Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5">ผู้รับบริการ / หน่วยงาน</th>
                <th className="p-3.5">โครงการที่รับบริการ</th>
                <th className="p-3.5">ยูนิตที่ดูแล</th>
                <th className="p-3.5">ประเภทความคิดเห็น</th>
                <th className="p-3.5">ข้อความเสียงสะท้อน (Voice)</th>
                <th className="p-3.5">การปฏิบัติการปรับปรุง (Action Taken)</th>
                <th className="p-3.5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeedbacks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">
                    <div>{item.departmentName}</div>
                    <span className="text-[10px] text-slate-400 font-normal">{item.clientType}</span>
                  </td>
                  <td className="p-3.5 text-slate-700 max-w-xs">{item.projectName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {item.unitInvolved}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.sentiment === "positive"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {item.feedbackType}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 max-w-sm italic">
                    "{item.comment}"
                  </td>
                  <td className="p-3.5 text-emerald-800 text-[11px] max-w-xs font-medium">
                    {item.actionTaken}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ {item.actionStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
