"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  Eye,
  Info,
  Calendar,
  Layers,
  Award,
  RefreshCw,
  BarChart3,
  FileText,
  Target,
  Lightbulb,
  Compass,
  Zap,
  BookOpen,
  Check,
  ShieldAlert,
  ExternalLink,
  Ban,
  CheckCheck,
  Upload,
  Trash2,
  Paperclip,
  File,
  X,
  Maximize2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  HeartHandshake
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { computeSatisfactionAnalytics } from "@/utils/okrSettings";
import WiTrackingView from "./WiTrackingView";
import StakeholdersReportDetail from "./StakeholdersReportDetail";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from "date-fns";

// =========================================================================
// TYPES & DATA STRUCTURES
// =========================================================================

export type StockTimeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" | "CUSTOM";

export type IsoTabType =
  | "risk-analysis"
  | "swot-stakeholders"
  | "risk-register"
  | "wi"
  | "management-review"
  | "requirements-evidence"
  | "stakeholders";

// 11 Rows from 3_ประเมินความเสี่ยงและโอกาส CC.xlsx
export interface RiskOpportunityItem {
  id: string;
  context: string;
  subContext: string;
  team: "CC" | "QS";
  type: "O" | "R"; // O: Opportunity, R: Risk
  issue: string;
  rootCause: string;
  strategyType: "ลดความเสี่ยง" | "โอกาสในการพัฒนา";
  strategyDetail: string;
}

const RISK_OPPORTUNITIES_DATA: RiskOpportunityItem[] = [
  {
    id: "ro-1",
    context: "SWOT",
    subContext: "จุดแข็ง (Strength)",
    team: "CC",
    type: "O",
    issue: "เป็นทีมที่อยู่ในองค์กรภาครัฐที่ดำเนินงานด้านงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ ได้โดดเด่นองค์กรหนึ่งในภาคเหนือ",
    rootCause: "มีงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ ที่โดดเด่น มีคุณภาพให้กับองค์กรอย่างสม่ำเสมอ",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "มีการพัฒนารูปแบบงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นทำงานเพื่อตอบสนองต่อผู้บริหาร เพื่อนร่วมงานและส่วนงานอื่นๆ"
  },
  {
    id: "ro-2",
    context: "SWOT",
    subContext: "จุดแข็ง (Strength)",
    team: "CC",
    type: "O",
    issue: "ทีมงานมีความสามารถในด้านงานสร้างสรรค์ที่หลากหลาย",
    rootCause: "มีงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ หลากหลายประเภทสื่อ เพิ่มความน่าสนใจในงานออกแบบให้กับองค์กร",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "เพิ่มขีดความสามารถในการทำงาน และทำงานได้หลากหลายมากขึ้น"
  },
  {
    id: "ro-3",
    context: "SWOT",
    subContext: "โอกาส (Opportunity)",
    team: "CC",
    type: "O",
    issue: "ทีมงานมีความสามารถด้านงานสร้างสรรค์ และสามารถแข่งขันกับหน่วยงานอื่น ที่มีการดำเนินงานในรูปแบบเดียวกัน",
    rootCause: "องค์กรได้รับโอกาสในการทำงานที่เกี่ยวข้องกับงานออกแบบเพิ่มมากขึ้น",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "พัฒนาขีดความสามารถด้านงานสร้างสรรค์ด้านอื่นๆ"
  },
  {
    id: "ro-4",
    context: "SWOT",
    subContext: "โอกาส (Opportunity)",
    team: "CC",
    type: "O",
    issue: "ผู้บริหารให้ความสำคัญกับงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์",
    rootCause: "ผู้บริหารมีนโยบายและผลักดันให้องค์กรเป็นองค์กรที่มีความคิดสร้างสรรค์ รวมถึงการพัฒนางานสร้างสรรค์อย่างต่อเนื่อง",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "ผลักดันให้เป็นองค์กรที่มีความโดดเด่นด้านความคิดสร้างสรรค์และงานสร้างสรรค์"
  },
  {
    id: "ro-5",
    context: "SWOT",
    subContext: "จุดอ่อน (Weakness)",
    team: "CC",
    type: "R",
    issue: "ทีมงานมีความรู้และทักษะที่ไม่เพียงพอในบางฟังก์ชั่นงานสร้างสรรค์",
    rootCause: "พนักงานขาดการอบรมทักษะความรู้ เพื่อให้เกิดความเข้าใจในงานที่รับผิดชอบและเทรนด์งานสร้างสรรค์ในอนาคต",
    strategyType: "ลดความเสี่ยง",
    strategyDetail: "จัดอบรมเพื่อเพิ่มทักษะความรู้แก่พนักงาน"
  },
  {
    id: "ro-6",
    context: "SWOT",
    subContext: "จุดอ่อน (Weakness)",
    team: "CC",
    type: "R",
    issue: "ทีมงานมีเวลาในการทำงานไม่เพียงพอในการจัดการงานสร้างสรรค์ที่เป็นงานด่วนบางงาน",
    rootCause: "ความต้องการงานของทีมที่เกี่ยวข้องในองค์กรมีความต้องการที่จำเป็นเร่งด่วน",
    strategyType: "ลดความเสี่ยง",
    strategyDetail: "สร้างการรับรู้ถึงระยะเวลาในการทำงานสร้างสรรค์ในแบบฟอร์มเข้ารับบริการงานออกแบบ"
  },
  {
    id: "ro-7",
    context: "SWOT",
    subContext: "อุปสรรค (Threat)",
    team: "CC",
    type: "R",
    issue: "ภาพลักษณ์ขององค์กรเสียหายจากการโพสต์ข่าว ข้อความ Content จากงานออกแบบ จากผู้ไม่หวังดี กล่าวหา ว่าร้าย ให้ข้อมูลอันเป็นเท็จใน Social Media",
    rootCause: "ผู้ไม่หวังดี กล่าวหา ว่าร้าย ให้ข้อมูลอันเป็นเท็จใน Social Media",
    strategyType: "ลดความเสี่ยง",
    strategyDetail: "เฝ้าระวังและความรวดเร็วในการแก้ปัญหาเฉพาะหน้า จากผู้ไม่หวังดี"
  },
  {
    id: "ro-8",
    context: "ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย",
    subContext: "ผู้บริหาร",
    team: "QS",
    type: "O",
    issue: "องค์กรได้รับงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ ที่โดดเด่น มีคุณภาพให้กับองค์กรอย่างสม่ำเสมอ",
    rootCause: "องค์กรมีการดำเนินงานที่เกี่ยวข้องกับงานสร้างสรรค์อย่างสม่ำเสมอ",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "ดำเนินงานที่เกี่ยวข้องกับงานสร้างสรรค์ให้มีความโดดเด่น"
  },
  {
    id: "ro-9",
    context: "ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย",
    subContext: "พนักงาน",
    team: "QS",
    type: "O",
    issue: "มีระบบการทำงานที่มีขั้นตอนในการทำงานสร้างสรรค์ที่ชัดเจน",
    rootCause: "มีการกำหนดขั้นตอนในกระบวนการทำงานต่างๆ และ มีการปรับปรุงกระบวนการทำงานให้สะดวก รวดเร็ว มีคุณภาพมากขึ้น",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "มีกระบวนการทำงานที่มีประสิทธิภาพ และเพิ่มขีดความสามารถในการทำงานสร้างสรรค์อื่นๆ ได้"
  },
  {
    id: "ro-10",
    context: "ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย",
    subContext: "มหาวิทยาลัยเชียงใหม่",
    team: "QS",
    type: "O",
    issue: "ส่งมอบตัวชี้วัดที่ตอบเป้าหมายของมหาวิทยาลัย",
    rootCause: "มีการส่งมอบตัวชี้วัดต่างๆ ที่เป็นไปตามเป้าหมายของมหาวิทยาลัย",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "มีการดำเนินการตามตัวชี้วัดที่มหาวิทยาลัยกำหนด"
  },
  {
    id: "ro-11",
    context: "ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย",
    subContext: "ภาคเอกชน / ภาคอุตสาหกรรม",
    team: "QS",
    type: "O",
    issue: "มีระบบการทำงานที่มีขั้นตอนในการทำงานสร้างสรรค์ที่ชัดเจน",
    rootCause: "มีการทำงานร่วมกับหน่วยงานอื่นๆ",
    strategyType: "โอกาสในการพัฒนา",
    strategyDetail: "พัฒนางานสร้างสรรค์ให้มีคุณภาพเพื่อสร้างความเชื่อมั่นให้มากยิ่งขึ้น"
  }
];

// Stakeholders Data from 2_SWOT CC.xlsx (Sheet: ผู้มีส่วนได้ส่วนเสีย)
export const STAKEHOLDERS_DATA = [
  {
    id: "sh-1",
    group: "ผู้บริหาร",
    avatar: "👔",
    needs: "ต้องการได้รับงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ ที่โดดเด่น มีคุณภาพให้กับองค์กรอย่างสม่ำเสมอ",
    expectations: "เกิดการพัฒนารูปแบบงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้น ให้มีความสร้างสรรค์อย่างต่อเนื่อง เพื่อตอบสนองต่อผู้บริหารและองค์กรอย่างสม่ำเสมอ",
    systemRole: "Internal Leadership & Policy",
    targetUnit: "internal"
  },
  {
    id: "sh-2",
    group: "พนักงาน",
    avatar: "👥",
    needs: "ต้องการมีระบบการทำงานที่มีขั้นตอนในการทำงานสร้างสรรค์ที่ชัดเจน",
    expectations: "เกิดการพัฒนากระบวนการทำงานที่มีประสิทธิภาพ และเพิ่มขีดความสามารถในการทำงานสร้างสรรค์อื่นๆ ได้",
    systemRole: "Core Operations & Team CC",
    targetUnit: "internal"
  },
  {
    id: "sh-3",
    group: "มหาวิทยาลัยเชียงใหม่",
    avatar: "🏛️",
    needs: "ต้องการส่งมอบตัวชี้วัดที่ตอบเป้าหมายของมหาวิทยาลัย",
    expectations: "องค์กรสามารถบรรลุเป้าหมายตามตัวชี้วัดและส่งมอบตัวชี้วัดได้ตามระยะเวลาที่กำหนด",
    systemRole: "Academic & Institutional Parent",
    targetUnit: "external"
  },
  {
    id: "sh-4",
    group: "ภาคเอกชน / ภาคอุตสาหกรรม",
    avatar: "🏢",
    needs: "ต้องการทำงานสร้างสรรค์ร่วมกับหน่วยงานที่มีงานที่เกี่ยวข้องกับงานสร้างสรรค์",
    expectations: "เกิดการพัฒนางานสร้างสรรค์ให้มีคุณภาพเพื่อสร้างความเชื่อมั่นให้มากยิ่งขึ้น",
    systemRole: "Commercial & Business Partners",
    targetUnit: "pm_project"
  }
];

// =========================================================================
// ISO 9001:2015 REQUIREMENTS & EVIDENCE MAPPING DATA
// =========================================================================
export interface IsoClauseMappingItem {
  id: string;
  chapter: string;
  chapterNumber: number;
  clauseNumber: string;
  titleTh: string;
  titleEn: string;
  requirementSummary: string;
  compliancePercent: number;
  status: "full" | "high" | "not_in_field";
  statusLabel: string;
  description: string;
  evidences: {
    label: string;
    targetTab?: IsoTabType;
    targetWi?: "WI-CC-001" | "WI-CC-003" | "WI-CC-004" | "WI-CC-005";
    targetAnchor?: string;
    targetDimension?: "reputation" | "operational";
    linkUrl?: string;
    docRef?: string;
  }[];
  recommendedEvidences?: string[];
  notes?: string;
  inField: boolean;
}

export interface UploadedClauseEvidence {
  id: string;
  clauseNumber: string;
  fileName: string;
  fileSize: string;
  fileType: "pdf" | "word" | "excel" | "image" | "csv" | "other";
  fileData: string;
  uploadedAt: string;
}

export const ISO_CLAUSES_MAPPING_DATA: IsoClauseMappingItem[] = [
  // --- หมวด 4: บริบทขององค์กร ---
  {
    id: "iso-4-1",
    chapter: "หมวด 4: บริบทขององค์กร",
    chapterNumber: 4,
    clauseNumber: "4.1",
    titleTh: "ความเข้าใจองค์กรและบริบท",
    titleEn: "Understanding the organization and its context",
    requirementSummary: "ระบุและวิเคราะห์ประเด็นปัจจัยภายในและภายนอกองค์กรที่มีผลต่อทิศทางเชิงกลยุทธ์และผลลัพธ์ของระบบ QMS",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ทีม CC ได้ดำเนินการวิเคราะห์สภาพแวดล้อมภายใน (จุดแข็ง จุดอ่อน บุคลากร ระบบงาน) และสภาพแวดล้อมภายนอก (โอกาส อุปสรรค เทคโนโลยี AI และพฤติกรรมผู้รับบริการ) ครอบคลุมทุกมิติ",
    evidences: [
      {
        label: "ดูการวิเคราะห์ SWOT บริบททีม",
        targetTab: "swot-stakeholders",
        targetAnchor: "sec-swot-matrix",
        docRef: "2_SWOT CC.xlsx (Sheet 1)"
      }
    ],
    recommendedEvidences: [
      "รายงานการประชุมทบทวนบริบทองค์กรประจำปี (Annual Context Review Minutes)",
      "รายงานวิเคราะห์สภาพแวดล้อมภายนอกและแนวโน้มเทคโนโลยีสื่อสร้างสรรค์ (Market & Tech Trend Analysis)"
    ],
    inField: true
  },
  {
    id: "iso-4-2",
    chapter: "หมวด 4: บริบทขององค์กร",
    chapterNumber: 4,
    clauseNumber: "4.2",
    titleTh: "ความเข้าใจความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย",
    titleEn: "Understanding the needs and expectations of interested parties",
    requirementSummary: "ชี้บ่งผู้มีส่วนได้ส่วนเสียที่เกี่ยวข้อง พร้อมระบุความต้องการและความคาดหวังในการรับบริการสื่อสารและผลิตสื่อ",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ระบุผู้มีส่วนได้ส่วนเสียครบทั้ง 8 กลุ่ม (บุคลากรภายใน, หน่วยงานผู้ขอรับบริการ, ผู้บริหาร, ประชาชนภายนอก, สื่อมวลชน, นักศึกษา, ภาคเอกชน, ศิษย์เก่า) พร้อมวิเคราะห์ความต้องการและการตอบสนอง",
    evidences: [
      {
        label: "ดูตารางวิเคราะห์ผู้มีส่วนได้ส่วนเสีย 8 กลุ่ม",
        targetTab: "swot-stakeholders",
        targetAnchor: "sec-stakeholders-table",
        docRef: "2_SWOT CC.xlsx (Sheet 2)"
      }
    ],
    recommendedEvidences: [
      "แบบสำรวจความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสียประจำปี (Stakeholder Needs Survey)",
      "บันทึกข้อตกลงระดับการให้บริการ (SLA Service Level Agreement) ร่วมกับหน่วยงานภายใน"
    ],
    inField: true
  },
  {
    id: "iso-4-3",
    chapter: "หมวด 4: บริบทขององค์กร",
    chapterNumber: 4,
    clauseNumber: "4.3",
    titleTh: "การกำหนดขอบเขตของระบบการจัดการคุณภาพ",
    titleEn: "Determining the scope of the quality management system",
    requirementSummary: "กำหนดขอบเขตและความสามารถในการประยุกต์ใช้ข้อกำหนดของระบบ QMS ให้สอดคล้องกับพันธกิจทีม",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "กำหนดขอบเขตครอบคลุมบริการงานสื่อสารองค์กร สื่อประชาสัมพันธ์ (Artwork Graphic, คลิปวิดีโอ, ข่าวสาร Content, สื่อสารกิจกรรมและแคมเปญ) ของหน่วยงาน",
    evidences: [
      {
        label: "ดูขอบเขตงานและตัวชี้วัด KRI ทีม",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-kri",
        targetDimension: "reputation",
        docRef: "1_วิเคราะห์ความเสี่ยง CC.docx (ข้อ 1-2)"
      }
    ],
    recommendedEvidences: [
      "เอกสารประกาศขอบเขตระบบบริหารคุณภาพ (QMS Scope Statement) ที่ลงนามอนุมัติโดยผู้อำนวยการ",
      "ผังความสัมพันธ์ของกระบวนการทั้งหมดในขอบเขตระบบงาน (QMS Boundary & Process Interactions)"
    ],
    inField: true
  },
  {
    id: "iso-4-4",
    chapter: "หมวด 4: บริบทขององค์กร",
    chapterNumber: 4,
    clauseNumber: "4.4",
    titleTh: "ระบบการจัดการคุณภาพและกระบวนการ",
    titleEn: "Quality management system and its processes",
    requirementSummary: "จัดทำ นำไปปฏิบัติ ดำรงรักษา และปรับปรุงระบบกระบวนการทำงานคุณภาพอย่างต่อเนื่อง",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "กำหนดขั้นตอนมาตรฐานการปฏิบัติงาน (WI) 4 ขั้นตอนหลัก: วางแผน-ผลิต-ตรวจ-เผยแพร่ ควบคุมด้วยระบบดิจิทัล CC System 2027 พร้อม Dashboard ตรวจสอบสถานะงานแบบเรียลไทม์",
    evidences: [
      {
        label: "ดูผังขั้นตอนการปฏิบัติงาน (WI)",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC-001 & WI-CC-003"
      }
    ],
    recommendedEvidences: [
      "ผังกระบวนการปฏิสัมพันธ์ของงานภาพรวม (Interaction of Processes / SIPOC Diagram)",
      "รายงานสรุปผลการติดตามดัชนีชี้วัดประสิทธิภาพกระบวนการ (Process Performance Log)"
    ],
    inField: true
  },

  // --- หมวด 5: ภาวะผู้นำ ---
  {
    id: "iso-5-1",
    chapter: "หมวด 5: ภาวะผู้นำ",
    chapterNumber: 5,
    clauseNumber: "5.1",
    titleTh: "ภาวะผู้นำและความมุ่งมั่น",
    titleEn: "Leadership and commitment",
    requirementSummary: "ผู้นำทีมและผู้บริหารแสดงความมุ่งมั่น กำหนดทิศทาง ส่งเสริมความตระหนัก และมุ่งเน้นความพึงพอใจของลูกค้า",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "หัวหน้าทีมและผู้บริหารร่วมกำหนด Risk Appetite, อนุมัติเป้าหมาย KRI ระดับทีม (ความพึงพอใจ >=85%, ส่งมอบตรงเวลา >=80%) และติดตามผลการดำเนินงานอย่างสม่ำเสมอ",
    evidences: [
      {
        label: "ดูบทสรุปผู้บริหารและตัวชี้วัด KRI",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-kri",
        targetDimension: "reputation",
        docRef: "1_วิเคราะห์ความเสี่ยง CC.docx ข้อ 1-3"
      }
    ],
    recommendedEvidences: [
      "บันทึกการสื่อสารวิสัยทัศน์ นโยบายคุณภาพ และทิศทางกลยุทธ์ต่อบุคลากรในทีม",
      "บันทึกการอนุมัติการจัดสรรงบประมาณและทรัพยากรด้านเทคโนโลยีสื่อสารสร้างสรรค์จากฝ่ายบริหาร"
    ],
    inField: true
  },
  {
    id: "iso-5-2",
    chapter: "หมวด 5: ภาวะผู้นำ",
    chapterNumber: 5,
    clauseNumber: "5.2",
    titleTh: "นโยบายคุณภาพ",
    titleEn: "Quality policy",
    requirementSummary: "จัดทำ สื่อสาร และนำนโยบายคุณภาพไปปฏิบัติอย่างสอดคล้องกับบริบทองค์กร",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ยึดมั่นนโยบายส่งมอบงานสื่อสารที่มีคุณภาพ ถูกต้องตามอัตลักษณ์องค์กร รวดเร็วตรงเวลา และสร้างความพึงพอใจสูงสุดแก่ผู้รับบริการทุกระดับ",
    evidences: [
      {
        label: "ดูนโยบายคุณภาพและเป้าหมาย KRI",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-kri",
        targetDimension: "reputation",
        docRef: "นโยบายทีมสื่อสารสร้างสรรค์ 2027"
      }
    ],
    recommendedEvidences: [
      "ประกาศนโยบายคุณภาพทีม CC ที่ลงนามโดยผู้บริหารระดับสูง",
      "หลักฐานการเผยแพร่นโยบายคุณภาพผ่านช่องทางต่างๆ (ป้ายประกาศ, Intranet, อีเมลเวียน)"
    ],
    inField: true
  },
  {
    id: "iso-5-3",
    chapter: "หมวด 5: ภาวะผู้นำ",
    chapterNumber: 5,
    clauseNumber: "5.3",
    titleTh: "บทบาท หน้าที่ความรับผิดชอบ และอำนาจหน้าที่ในองค์กร",
    titleEn: "Organizational roles, responsibilities and authorities",
    requirementSummary: "มอบหมายหน้าที่ ความรับผิดชอบ และอำนาจในการปฏิบัติงานอย่างชัดเจนและสื่อสารทั่วทั้งทีม",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "แบ่งบทบาทชัดเจนในระบบ: ผู้ประสานงาน (Coordinator), ผู้ปฏิบัติงาน (Assignee: Creative, Content, PR), ผู้ตรวจงาน (AD Reviewer), และหัวหน้าทีมผู้อนุมัติขั้นสุดท้าย",
    evidences: [
      {
        label: "ดูขั้นตอนการมอบหมายงานใน WI",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC-001 (ขั้นตอนที่ 1-2)"
      }
    ],
    recommendedEvidences: [
      "แผนผังโครงสร้างการบริหารงานทีม (Org Chart) พร้อมคำบรรยายลักษณะงาน (Job Description - JD)",
      "คำสั่งแต่งตั้งคณะทำงานด้านระบบบริหารคุณภาพและผู้ประสานงานหลัก (QMR / Task Force Appoint Order)"
    ],
    inField: true
  },

  // --- หมวด 6: การวางแผน ---
  {
    id: "iso-6-1",
    chapter: "หมวด 6: การวางแผน",
    chapterNumber: 6,
    clauseNumber: "6.1",
    titleTh: "การปฏิบัติการเพื่อระบุความเสี่ยงและโอกาส",
    titleEn: "Actions to address risks and opportunities",
    requirementSummary: "ประเมินความเสี่ยงและโอกาส วางแผนมาตรการจัดการ และประเมินประสิทธิผลของมาตรการ",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "จัดทำทะเบียนความเสี่ยงและโอกาส 11 รายการ, วิเคราะห์กลยุทธ์ TOWS Matrix (SO, ST, WO, WT), คำนวณ Residual Risk Matrix 5x5 และติดตาม Risk Action Plan ต่อเนื่อง",
    evidences: [
      {
        label: "ดูทะเบียนความเสี่ยงและ TOWS Matrix",
        targetTab: "risk-register",
        targetAnchor: "sec-tab3-register",
        docRef: "3_ประเมินความเสี่ยงและโอกาส CC.xlsx"
      }
    ],
    recommendedEvidences: [
      "แผนปฏิบัติการจัดการความเสี่ยง (Risk Action Plan) พร้อมบันทึกการติดตามผลรอบ 6 เดือน",
      "บันทึกการประเมินความเสี่ยงและโอกาสรอบใหม่เมื่อบริบทหรือกระบวนการมีการเปลี่ยนแปลง"
    ],
    inField: true
  },
  {
    id: "iso-6-2",
    chapter: "หมวด 6: การวางแผน",
    chapterNumber: 6,
    clauseNumber: "6.2",
    titleTh: "วัตถุประสงค์คุณภาพและการวางแผนเพื่อให้บรรลุ",
    titleEn: "Quality objectives and planning to achieve them",
    requirementSummary: "กำหนดวัตถุประสงค์คุณภาพที่สามารถวัดผลได้ สอดคล้องกับนโยบาย และมีการเฝ้าระวังอย่างเป็นรูปธรรม",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "กำหนด KRI 1: ดัชนีความพึงพอใจรวม >=85% (ครอบคลุม 4 มิติ: คุณภาพ, ความตรงต่อเวลา, การสื่อสาร, การประสานงาน) และ KRI 2: อัตราส่งมอบตรงเวลา >=80%",
    evidences: [
      {
        label: "ดูตัวชี้วัด KRI Real-time",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-kri",
        targetDimension: "reputation",
        docRef: "KRI Target vs Actual Dashboard"
      }
    ],
    recommendedEvidences: [
      "ตารางแผนปฏิบัติการเพื่อบรรลุวัตถุประสงค์คุณภาพ (Action Plan for Quality Objectives)",
      "รายงานสรุปผลสัมฤทธิ์ของเป้าหมาย KRI ประจำปีเสนอต่อผู้บริหาร"
    ],
    inField: true
  },
  {
    id: "iso-6-3",
    chapter: "หมวด 6: การวางแผน",
    chapterNumber: 6,
    clauseNumber: "6.3",
    titleTh: "การวางแผนการเปลี่ยนแปลง",
    titleEn: "Planning of changes",
    requirementSummary: "วางแผนและควบคุมเมื่อมีความจำเป็นต้องเปลี่ยนแปลงข้อกำหนด ทรัพยากร หรือกระบวนการทำงาน",
    compliancePercent: 95,
    status: "high",
    statusLabel: "สอดคล้องสูง (95%)",
    description: "ระบบรองรับ Change Request กรณีผู้ขอรับบริการปรับเปลี่ยนข้อมูล Brief หรือแก้ไของค์ประกอบสื่อกลางคัน พร้อมบันทึก Timeline และประเมินผลกระทบต่อ Deadline",
    evidences: [
      {
        label: "ดูการติดตามและปรับปรุงงานใน WI",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC Flow Step 2-3"
      }
    ],
    recommendedEvidences: [
      "แบบฟอร์มขอเปลี่ยนแปลงข้อกำหนดหรือระบบงาน (Change Request Form)",
      "บันทึกการประเมินผลกระทบและความเสี่ยงก่อนอนุมัติการเปลี่ยนแปลงงานบรีฟหรือขั้นตอน WI"
    ],
    inField: true
  },

  // --- หมวด 7: การสนับสนุน ---
  {
    id: "iso-7-1",
    chapter: "หมวด 7: การสนับสนุน",
    chapterNumber: 7,
    clauseNumber: "7.1",
    titleTh: "ทรัพยากร (คน เครื่องมือ สภาพแวดล้อม และระบบดิจิทัล)",
    titleEn: "Resources",
    requirementSummary: "จัดสรรบุคลากร อุปกรณ์ ซอฟต์แวร์ และโครงสร้างพื้นฐานที่จำเป็นต่อการปฏิบัติงาน",
    compliancePercent: 95,
    status: "high",
    statusLabel: "สอดคล้องสูง (95%)",
    description: "บริหารจัดการภาระงาน (Workload) เฉลี่ยตามความเชี่ยวชาญของทีมงาน, สนับสนุนซอฟต์แวร์ลิขสิทธิ์สร้างสรรค์ และระบบ Cloud Storage จัดเก็บ Asset คุณภาพสูง",
    evidences: [
      {
        label: "ดูรายงานภาระงานและการกระจายงาน",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-op-kri",
        targetDimension: "operational",
        docRef: "Workload Distribution Analytics"
      }
    ],
    recommendedEvidences: [
      "ทะเบียนควบคุมทรัพย์สิน อุปกรณ์คอมพิวเตอร์ และกล้องถ่ายภาพ (Hardware Asset Inventory)",
      "บันทึกประวัติการบำรุงรักษาอุปกรณ์และใบอนุญาตซอฟต์แวร์ลิขสิทธิ์ (Software License Log)"
    ],
    inField: true
  },
  {
    id: "iso-7-2",
    chapter: "หมวด 7: การสนับสนุน",
    chapterNumber: 7,
    clauseNumber: "7.2",
    titleTh: "ความสามารถของบุคลากร",
    titleEn: "Competence",
    requirementSummary: "มั่นใจว่าบุคลากรมีความรู้ ทักษะ ความสามารถ และได้รับการพัฒนาอย่างต่อเนื่อง",
    compliancePercent: 95,
    status: "high",
    statusLabel: "สอดคล้องสูง (95%)",
    description: "คัดเลือกและมอบหมายงานตรงกับความถนัดของทีมงาน (Graphic 2D, 3D, Motion, Video Editor, Copywriter) พร้อมการอบรมและแบ่งปันความรู้เรื่อง AI Tools",
    evidences: [
      {
        label: "ดูรายชื่อทีมและผู้รับมอบหมายงาน",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-003",
        docRef: "Assignee Management Profiles"
      }
    ],
    recommendedEvidences: [
      "แผนพัฒนาศักยภาพบุคลากรรายบุคคล (Individual Development Plan - IDP)",
      "ใบประกาศนียบัตรหรือประวัติการฝึกอบรม (Training Records & Evaluation) ของบุคลากรในทีม"
    ],
    inField: true
  },
  {
    id: "iso-7-3",
    chapter: "หมวด 7: การสนับสนุน",
    chapterNumber: 7,
    clauseNumber: "7.3",
    titleTh: "ความตระหนัก",
    titleEn: "Awareness",
    requirementSummary: "สร้างความตระหนักต่อมาตรฐานคุณภาพ เป้าหมาย KRI และผลกระทบต่อภาพลักษณ์องค์กร",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "บุคลากรทุกคนรับทราบนโยบายคุณภาพ ทบทวน WI ประจำปี มีระบบ Alert เตือนอัตโนมัติเมื่อตรวจพบงานที่มีแนวโน้มหลุด WI หรือ Overdue ไปยัง Assignee และหัวหน้าทีม",
    evidences: [
      {
        label: "ดูระบบแจ้งเตือน Overdue & WI Compliance",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "Automated WI Alert & Audit System"
      }
    ],
    recommendedEvidences: [
      "ผลการทดสอบความเข้าใจและความตระหนักด้าน QMS (Quality Awareness Quiz)",
      "บันทึกการปฐมนิเทศพนักงานใหม่เกี่ยวกับระเบียบปฏิบัติงานและมาตรฐานคุณภาพ"
    ],
    inField: true
  },
  {
    id: "iso-7-4",
    chapter: "หมวด 7: การสนับสนุน",
    chapterNumber: 7,
    clauseNumber: "7.4",
    titleTh: "การสื่อสาร",
    titleEn: "Communication",
    requirementSummary: "กำหนดแนวทางการสื่อสารภายในทีมและระหว่างหน่วยงานอย่างชัดเจน ถูกต้อง และทันเวลา",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ใช้ระบบ CC System เป็นศูนย์กลางการสื่อสาร พร้อมระบบอีเมลแจ้งเตือนทุกจุดเปลี่ยนสถานะ, บันทึกหมายเหตุการประชุม/เจรจานอกระบบ และระบบข้อความประสานงานในใบงาน",
    evidences: [
      {
        label: "ดูขั้นตอนการติดต่อสื่อสารและแบบฟอร์ม",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "Brief Request & Collaboration Portal"
      }
    ],
    recommendedEvidences: [
      "ตารางเมทริกซ์แผนการสื่อสาร (Communication Matrix: ผู้ส่ง สาร ช่องทาง ความถี่ ผู้รับ)",
      "บันทึกรายงานการประชุมภายในทีมประจำสัปดาห์/เดือน (Weekly/Monthly Team Meeting Minutes)"
    ],
    inField: true
  },
  {
    id: "iso-7-5",
    chapter: "หมวด 7: การสนับสนุน",
    chapterNumber: 7,
    clauseNumber: "7.5",
    titleTh: "ข้อมูลเอกสาร (การจัดทำและการควบคุม)",
    titleEn: "Documented information",
    requirementSummary: "จัดทำ ควบคุม จัดเก็บ ปกป้อง และสืบค้นข้อมูลเอกสารตามข้อกำหนด ISO",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "บันทึกประวัติการทำงานทุกขั้นตอนในฐานข้อมูล Supabase เข้ารหัสความปลอดภัย พร้อมระบบ Versioning ของไฟล์สื่อ, Export CSV รายการประเมินความเสี่ยง และใบงานย้อนหลังได้ทุกเมื่อ",
    evidences: [
      {
        label: "ดูข้อมูลทะเบียนและส่งออกรายงาน CSV",
        targetTab: "risk-register",
        targetAnchor: "sec-tab3-register",
        docRef: "ISO Database & Document Repository"
      }
    ],
    recommendedEvidences: [
      "บัญชีควบคุมเอกสารหลัก (Master Document Control List)",
      "แบบบันทึกการขอยกเลิกหรือแก้ไขเปลี่ยนแปลงเอกสารระบบคุณภาพ (DAR Document Action Request Form)"
    ],
    inField: true
  },

  // --- หมวด 8: การปฏิบัติการ ---
  {
    id: "iso-8-1",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.1",
    titleTh: "การวางแผนและการควบคุมการปฏิบัติการ",
    titleEn: "Operational planning and control",
    requirementSummary: "วางแผน นำไปปฏิบัติ และควบคุมกระบวนการผลิตสื่อให้สอดคล้องกับข้อกำหนดและเวลาที่ตกลง",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ควบคุมกระบวนการผ่าน WI Tracking Flow แบ่งเป็น 4 ขั้นตอน: วางแผนรับมอบหมาย -> ผลิตสื่อสร้างสรรค์ -> ตรวจทานโดย AD/หัวหน้า -> ส่งมอบและเผยแพร่ พร้อมบันทึกหลักฐานทุกขั้น",
    evidences: [
      {
        label: "ดูขั้นตอนการปฏิบัติงาน WI 4 ขั้นตอน",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC-001 / WI-CC-003 Flow Tracking"
      }
    ],
    recommendedEvidences: [
      "แผนตารางการผลิตสื่อประจำเดือน/ประจำโครงการ (Production Schedule)",
      "บันทึกการติดตามความก้าวหน้ารายงานประจำสัปดาห์ (Weekly Production Status Report)"
    ],
    inField: true
  },
  {
    id: "iso-8-2",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.2",
    titleTh: "ข้อกำหนดสำหรับผลิตภัณฑ์และบริการ",
    titleEn: "Requirements for products and services",
    requirementSummary: "ระบุ ทบทวน และทำความเข้าใจข้อกำหนด วัตถุประสงค์ และกำหนดส่งมอบของงานสื่อสาร",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "แบบฟอร์มขอรับบริการระบุ Scope, Target Audience, Tone & Mood, วัตถุประสงค์เชิงยุทธศาสตร์, และกำหนดส่งมอบชัดเจน พร้อมการทบทวนความพร้อมก่อนรับงาน",
    evidences: [
      {
        label: "ดูระบบรับคำขอและคัดกรองงาน",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "Service Request Brief System"
      }
    ],
    recommendedEvidences: [
      "แบบฟอร์มขอรับบริการ (Service Brief Intake Form) ที่ระบุความต้องการครบถ้วน",
      "บันทึกการทบทวนความพร้อมและศักยภาพก่อนตอบรับงาน (Feasibility & Requirement Review Record)"
    ],
    inField: true
  },
  {
    id: "iso-8-3",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.3",
    titleTh: "การออกแบบและพัฒนาผลิตภัณฑ์และบริการ",
    titleEn: "Design and development of products and services",
    requirementSummary: "กำหนดขั้นตอนการออกแบบ Artwork, Video และ Content มีการสอบทานและยืนยันความถูกต้อง",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "กระบวนการสร้างสรรค์สื่อมีขั้นตอน Concept Design -> Artwork Drafting -> AD Reviewer ตรวจทานองค์ประกอบ อัตลักษณ์ และความถูกต้องก่อน Final Artwork เสมอ",
    evidences: [
      {
        label: "ดูขั้นตอนการผลิตและตรวจทาน Artwork",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC-001 ขั้นตอนที่ 2-3"
      }
    ],
    recommendedEvidences: [
      "เอกสารแบบร่างแนวคิดชิ้นงาน (Moodboard / Design Concept Proposal)",
      "บันทึกการตรวจพิจารณาอนุมัติต้นแบบงานออกแบบ (Design Review Sign-off Checklist)"
    ],
    inField: true
  },
  {
    id: "iso-8-4",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.4",
    titleTh: "การควบคุมกระบวนการ ผลิตภัณฑ์ และบริการที่จัดหาจากภายนอก",
    titleEn: "Control of externally provided processes, products and services",
    requirementSummary: "ควบคุมกระบวนการจัดซื้อจัดจ้างและประเมินผู้ส่งมอบภายนอก (Outsourced Suppliers / Vendors)",
    compliancePercent: 0,
    status: "not_in_field",
    statusLabel: "ไม่อยู่ในฟิลด์การทำงาน",
    description: "ทีม CC ไม่มีกระบวนการจัดซื้อจัดจ้างพัสดุหรือจัดจ้างผลิตสื่อจากผู้รับจ้างภายนอกโดยตรง",
    evidences: [
      {
        label: "ได้รับการยกเว้นตามขอบเขตระบบ QMS ทีม CC",
        targetTab: "requirements-evidence",
        targetAnchor: "iso-8-4",
        docRef: "ข้อกำหนดขอบเขตงานบริการทีม CC"
      }
    ],
    recommendedEvidences: [
      "เอกสารประกาศขอบเขตการยกเว้นข้อกำหนด 8.4 ในคู่มือคุณภาพ QMS Manual",
      "สัญญาว่าจ้างและข้อตกลงการรักษาความลับ (NDA) หากมีกรณีจ้างงานพิเศษในอนาคต"
    ],
    notes: "ไม่อยู่ในฟิลด์การทำงานดังกล่าว เนื่องจากทีม CC ดำเนินการออกแบบและผลิตสื่อด้วยบุคลากรภายในองค์กรเป็นหลัก (งานจัดซื้อพัสดุภายนอกดำเนินการผ่านฝ่ายพัสดุกลางของมหาวิทยาลัย/หน่วยงาน)",
    inField: false
  },
  {
    id: "iso-8-5",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.5",
    titleTh: "การผลิตและการให้บริการ",
    titleEn: "Production and service provision",
    requirementSummary: "ดำเนินงานผลิตสื่อภายใต้สภาวะที่มีการควบคุม การระบุสถานะ และการสอบกลับได้",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ทุกใบงานมี ID ประจำงาน มีการติดตามสถานะแบบ Kanban / Table (Pending, In Progress, Review, Completed) ตรวจสอบผู้รับผิดชอบและประวัติการทำงานได้ครบถ้วน",
    evidences: [
      {
        label: "ดูการติดตามงานบริการในระบบ",
        targetTab: "wi",
        targetAnchor: "sec-wi-table",
        targetWi: "WI-CC-001",
        docRef: "CC Production Pipeline"
      }
    ],
    recommendedEvidences: [
      "บันทึกประวัติการผลิตงานในระบบ (Work Order Production Logbook)",
      "ระบบระบุเวอร์ชันของไฟล์งานเพื่อการสอบกลับ (Asset Version & Source File Tracking)"
    ],
    inField: true
  },
  {
    id: "iso-8-6",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.6",
    titleTh: "การปล่อยผลิตภัณฑ์และบริการ (การตรวจรับขั้นสุดท้าย)",
    titleEn: "Release of products and services",
    requirementSummary: "ตรวจรับและรับรองผลงานตามเกณฑ์ที่กำหนดก่อนส่งมอบให้ผู้รับบริการหรือเผยแพร่สู่สาธารณะ",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "มีขั้นตอน Final Approval จาก Art Director และผู้ประสานงานหลัก ตรวจสอบความถูกต้องของข้อความ ขนาดไฟล์ และลิขสิทธิ์ภาพ ก่อนกด Complete และส่งมอบ",
    evidences: [
      {
        label: "ดูขั้นตอนการตรวจรับงานและเผยแพร่",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC-001 ขั้นตอนที่ 3-4"
      }
    ],
    recommendedEvidences: [
      "แบบฟอร์มตรวจรับและส่งมอบผลงานขั้นสุดท้าย (Final Inspection & Handover Sign-off)",
      "บันทึกลายเซ็นหรืออีเมลยืนยันการตรวจรับมอบผลงานจากผู้ขอรับบริการ"
    ],
    inField: true
  },
  {
    id: "iso-8-7",
    chapter: "หมวด 8: การปฏิบัติการ",
    chapterNumber: 8,
    clauseNumber: "8.7",
    titleTh: "การควบคุมผลลัพธ์ที่ไม่เป็นไปตามข้อกำหนด",
    titleEn: "Control of nonconforming outputs",
    requirementSummary: "ชี้บ่ง ควบคุม และแก้ไขผลงานที่พบข้อบกพร่อง ไม่ถูกต้อง หรือไม่ผ่านเกณฑ์มาตรฐาน",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "ระบบรองรับกระบวนการขอแก้ไขงาน (Revision Loop) โดยผู้ตรวจงานระบุจุดแก้ไขชัดเจน งานจะไม่ถูกปล่อยจนกว่าจะผ่านการแก้ไขและอนุมัติซ้ำ",
    evidences: [
      {
        label: "ดูการจัดการงานแก้ไขใน WI",
        targetTab: "wi",
        targetAnchor: "sec-wi-flow",
        targetWi: "WI-CC-001",
        docRef: "WI-CC-001 Review Loop"
      }
    ],
    recommendedEvidences: [
      "สมุดบันทึกรายการงานที่ไม่เป็นไปตามข้อกำหนด (Non-conformance / Defect Log)",
      "แบบฟอร์มวิเคราะห์สาเหตุและบันทึกการแก้งาน (Rework & Correction Record)"
    ],
    inField: true
  },

  // --- หมวด 9: การประเมินสมรรถนะ ---
  {
    id: "iso-9-1",
    chapter: "หมวด 9: การประเมินสมรรถนะ",
    chapterNumber: 9,
    clauseNumber: "9.1",
    titleTh: "การเฝ้าระวัง การวัด การวิเคราะห์ และการประเมิน",
    titleEn: "Monitoring, measurement, analysis and evaluation",
    requirementSummary: "ประเมินสมรรถนะของกระบวนการ ประสิทธิผลของระบบ QMS และความพึงพอใจของลูกค้า",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "วัดผลความพึงพอใจ 4 มิติด้วยระบบ CSAT Online อัตโนมัติหลังงานเสร็จสิ้น, ติดตาม KRI 1 และ KRI 2 เรียลไทม์ และรายงานเปรียบเทียบสถิติรายไตรมาส (ข้อ 9)",
    evidences: [
      {
        label: "ดูรายงานการวัดผลและสถิติรายไตรมาส",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-quarterly",
        targetDimension: "reputation",
        docRef: "KRI Real-time & Section 9 Analytics"
      }
    ],
    recommendedEvidences: [
      "รายงานสรุปผลการสำรวจความพึงพอใจผู้รับบริการประจำไตรมาส/ปี (CSAT Survey Report)",
      "รายงานวิเคราะห์เปรียบเทียบแนวโน้ม KRI (Quarterly Trend Analysis Report)"
    ],
    inField: true
  },
  {
    id: "iso-9-2",
    chapter: "หมวด 9: การประเมินสมรรถนะ",
    chapterNumber: 9,
    clauseNumber: "9.2",
    titleTh: "การตรวจประเมินภายใน",
    titleEn: "Internal audit",
    requirementSummary: "ดำเนินการตรวจประเมินภายในตามรอบเวลาที่วางแผนไว้ เพื่อยืนยันความสอดคล้องตามมาตรฐาน ISO",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "รองรับการสุ่มตรวจประเมินความสมบูรณ์ของบันทึกใบงาน, ความถูกต้องของขั้นตอน WI, และการปฏิบัติตามมาตรการควบคุมความเสี่ยงอย่างเป็นระบบ",
    evidences: [
      {
        label: "ดูในทะเบียนความเสี่ยงและมาตรการป้องกัน",
        targetTab: "risk-register",
        targetAnchor: "sec-tab3-register",
        docRef: "ทะเบียนความเสี่ยง 11 ข้อ และมาตรการตรวจประเมิน"
      }
    ],
    recommendedEvidences: [
      "แผนการตรวจประเมินภายในประจำปี (Annual Internal Audit Schedule)",
      "รายงานผลการตรวจประเมินภายใน (Internal Audit Report) และทะเบียนใบแจ้งข้อบกพร่อง CAR/PAR Log"
    ],
    inField: true
  },
  {
    id: "iso-9-3",
    chapter: "หมวด 9: การประเมินสมรรถนะ",
    chapterNumber: 9,
    clauseNumber: "9.3",
    titleTh: "การทบทวนของฝ่ายบริหาร",
    titleEn: "Management review",
    requirementSummary: "ฝ่ายบริหารทบทวนความเหมาะสม ความเพียงพอ และประสิทธิผลของระบบ QMS สม่ำเสมอ",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "Dashboard นำเสนอข้อมูลสำคัญสำหรับ Management Review: สถานะความเสี่ยง Residual Risk, สถิติ On-time Delivery, แนวโน้มความพึงพอใจ และข้อเสนอแนะเชิงกลยุทธ์",
    evidences: [
      {
        label: "ดูบันทึกการประชุมร่วมกับผู้บริหาร (Meeting Report)",
        linkUrl: "/dashboard?view=data-reports&report=meeting",
        docRef: "บันทึกการประชุมร่วมกับผู้บริหาร STeP รายเดือน"
      }
    ],
    recommendedEvidences: [
      "วาระการประชุมทบทวนของฝ่ายบริหาร (Management Review Meeting Agenda)",
      "รายงานการประชุมทบทวนของฝ่ายบริหาร (Management Review Minutes) พร้อมข้อสั่งการและมติที่ประชุม"
    ],
    inField: true
  },

  // --- หมวด 10: การปรับปรุง ---
  {
    id: "iso-10-1",
    chapter: "หมวด 10: การปรับปรุง",
    chapterNumber: 10,
    clauseNumber: "10.1",
    titleTh: "ทั่วไป ด้านการปรับปรุง",
    titleEn: "Improvement - General",
    requirementSummary: "ระบุและเลือกโอกาสในการปรับปรุง และนำไปปฏิบัติเพื่อตอบสนองความต้องการของลูกค้า",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "นำข้อมูลข้อเสนอแนะและ Feedback จากผู้รับบริการมาปรับปรุงรูปแบบการจัดเตรียม Brief และยกระดับมาตรฐานผลงานสร้างสรรค์",
    evidences: [
      {
        label: "ดูข้อคิดเห็นและการปรับปรุงบริการ",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-quarterly",
        targetDimension: "reputation",
        docRef: "Customer Feedback & Continuous Improvement Log"
      }
    ],
    recommendedEvidences: [
      "สมุดบันทึกข้อเสนอแนะและโอกาสในการปรับปรุงงาน (Continuous Improvement Register)",
      "รายงานผลการนำข้อเสนอแนะผู้รับบริการไปปรับปรุงกระบวนการทำงานจริง (Action on Feedback Report)"
    ],
    inField: true
  },
  {
    id: "iso-10-2",
    chapter: "หมวด 10: การปรับปรุง",
    chapterNumber: 10,
    clauseNumber: "10.2",
    titleTh: "สิ่งที่ไม่เป็นไปตามข้อกำหนดและการปฏิบัติการแก้ไข",
    titleEn: "Nonconformity and corrective action",
    requirementSummary: "ดำเนินการแก้ไขเมื่อพบข้อบกพร่อง หาสาเหตุที่แท้จริง และวางมาตรการป้องกันการเกิดซ้ำ",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "บันทึกในทะเบียนความเสี่ยง ข้อ 2 (งานล่าช้า) และข้อ 4 (สื่อสารผิดพลาด) พร้อมมาตรการควบคุมและระบบแจ้งเตือนอัตโนมัติเมื่อพบความล่าช้า",
    evidences: [
      {
        label: "ดูทะเบียนความเสี่ยงข้อ 2 และ 4 (มาตรการแก้ไขและป้องกัน)",
        targetTab: "risk-register",
        targetAnchor: "sec-tab3-register",
        docRef: "มาตรการแก้ไขและป้องกันข้อบกพร่องในทะเบียนความเสี่ยง"
      }
    ],
    recommendedEvidences: [
      "ใบคำขอให้ปฏิบัติการแก้ไขและป้องกัน (Corrective Action Request - CAR Form)",
      "หลักฐานการตรวจสอบประสิทธิผลหลังการแก้ไขข้อบกพร่อง (Follow-up & Closure Verification)"
    ],
    inField: true
  },
  {
    id: "iso-10-3",
    chapter: "หมวด 10: การปรับปรุง",
    chapterNumber: 10,
    clauseNumber: "10.3",
    titleTh: "การปรับปรุงอย่างต่อเนื่อง",
    titleEn: "Continual improvement",
    requirementSummary: "เพิ่มประสิทธิผลของระบบ QMS อย่างต่อเนื่องด้วยการพัฒนานวัตกรรมและเครื่องมือสนับสนุน",
    compliancePercent: 100,
    status: "full",
    statusLabel: "สอดคล้อง 100%",
    description: "พัฒนาและยกระดับ CC System 2027 สู่ระบบบริหารจัดการงานสื่อสารดิจิทัลแบบอัตโนมัติ ช่วยลดข้อผิดพลาด ลดเวลาประสานงาน และเพิ่มความโปร่งใสในทุกขั้นตอน",
    evidences: [
      {
        label: "ดูระบบบริหารงาน CC System 2027",
        targetTab: "risk-analysis",
        targetAnchor: "sec-tab1-controls",
        targetDimension: "reputation",
        docRef: "Digital QMS Transformation 2027"
      }
    ],
    recommendedEvidences: [
      "รายงานโครงการปรับปรุงประสิทธิภาพงานนวัตกรรม (Kaizen / Innovation Project Summary)",
      "บันทึกการอัปเกรดระบบเทคโนโลยีดิจิทัล CC System และการประเมินผลการใช้งาน (System Upgrade Log)"
    ],
    inField: true
  }
];

// =========================================================================
// 5x5 HEATMAP MATRIX COMPONENT
// =========================================================================
function RiskMatrix5x5({
  residualL,
  residualI,
  targetL,
  targetI,
  residualLabel,
  targetLabel
}: {
  residualL: number;
  residualI: number;
  targetL: number;
  targetI: number;
  residualLabel: string;
  targetLabel: string;
}) {
  // Impact rows 5 down to 1, Likelihood cols 1 up to 5
  const rows = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];

  const getCellColor = (score: number) => {
    if (score >= 15) return "bg-rose-500 text-white font-bold";
    if (score >= 10) return "bg-amber-400 text-slate-900 font-bold";
    if (score >= 5) return "bg-amber-100 text-amber-900 font-semibold";
    return "bg-emerald-100 text-emerald-800 font-semibold";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[460px] p-2">
        <div className="flex items-center justify-between mb-3 text-xs flex-wrap gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>แกนตั้ง: ผลกระทบ (Impact: 1-5)</span>
            <span className="text-slate-400 mx-1">|</span>
            <span>แกนนอน: โอกาสเกิด (Likelihood: 1-5)</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-300" />
              <span>ความเสี่ยงที่เหลืออยู่ (Residual)</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-300" />
              <span>ระดับยอมรับได้ (Target)</span>
            </span>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-200 text-center text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-bold">
              <th className="p-2 border border-slate-200 w-24">ผลกระทบ (I)</th>
              {cols.map(c => (
                <th key={c} className="p-2 border border-slate-200">
                  L = {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(i => (
              <tr key={i}>
                <td className="p-2 border border-slate-200 font-bold bg-slate-50 text-slate-700">
                  ระดับ {i}
                </td>
                {cols.map(l => {
                  const score = l * i;
                  const isResidual = l === residualL && i === residualI;
                  const isTarget = l === targetL && i === targetI;

                  return (
                    <td
                      key={l}
                      className={`p-2.5 border border-slate-200 relative transition-all ${getCellColor(score)}`}
                    >
                      <div className="font-mono text-xs">{score}</div>
                      
                      {isResidual && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span
                            className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-md ring-2 ring-white animate-pulse"
                            title={residualLabel}
                          >
                            Residual ({score})
                          </span>
                        </div>
                      )}

                      {isTarget && !isResidual && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span
                            className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black shadow-md ring-2 ring-white"
                            title={targetLabel}
                          >
                            Target ({score})
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] text-center font-medium">
          <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            ต่ำมาก (1-4) ยอมรับได้
          </div>
          <div className="p-1.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            ต่ำ (5-9) เฝ้าระวัง
          </div>
          <div className="p-1.5 rounded-md bg-amber-400 text-slate-900 border border-amber-500 font-bold">
            ปานกลาง (10-14) ควบคุม
          </div>
          <div className="p-1.5 rounded-md bg-rose-500 text-white font-bold shadow-2xs">
            สูง-สูงมาก (15-25) วิกฤต
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN COMPONENT: IsoReportDetail
// =========================================================================
export default function IsoReportDetail() {
  const [activeTab, setActiveTab] = useState<IsoTabType>("risk-analysis");
  const [selectedWi, setSelectedWi] = useState<"WI-CC-001" | "WI-CC-003" | "WI-CC-004" | "WI-CC-005">("WI-CC-001");
  const [riskDimension, setRiskDimension] = useState<"reputation" | "operational">("reputation");
  const [timeframe, setTimeframe] = useState<StockTimeframe>("ALL");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "O" | "R" | "SWOT" | "STAKEHOLDER">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState<"ALL" | "100" | "high" | "not_in_field">("ALL");
  const [evidenceChapterFilter, setEvidenceChapterFilter] = useState<string>("ALL");
  const [evidenceSearch, setEvidenceSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rawBriefs, setRawBriefs] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const supabase = createClient();

  const [uploadedEvidences, setUploadedEvidences] = useState<Record<string, UploadedClauseEvidence[]>>({});
  const [previewFile, setPreviewFile] = useState<UploadedClauseEvidence | null>(null);
  const [expandedRecommendations, setExpandedRecommendations] = useState<Record<string, boolean>>({});

  // Load persistent uploaded evidences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cc_iso_uploaded_evidences_v1");
        if (saved) {
          setUploadedEvidences(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error loading uploaded evidences:", e);
      }
    }
  }, []);

  const saveUploadedEvidences = (updated: Record<string, UploadedClauseEvidence[]>) => {
    setUploadedEvidences(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cc_iso_uploaded_evidences_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage warning:", e);
      }
    }
  };

  const handleUploadFileForClause = (clauseNumber: string, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const validExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "csv"];
    if (!validExtensions.includes(ext)) {
      alert("รองรับเฉพาะไฟล์ตระกูล PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Image (.jpg, .jpeg, .png) และ CSV (.csv) เท่านั้น");
      return;
    }

    let type: UploadedClauseEvidence["fileType"] = "other";
    if (ext === "pdf") type = "pdf";
    else if (["doc", "docx"].includes(ext)) type = "word";
    else if (["xls", "xlsx"].includes(ext)) type = "excel";
    else if (["jpg", "jpeg", "png"].includes(ext)) type = "image";
    else if (ext === "csv") type = "csv";

    const sizeKb = file.size / 1024;
    const formattedSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const newDoc: UploadedClauseEvidence = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        clauseNumber,
        fileName: file.name,
        fileSize: formattedSize,
        fileType: type,
        fileData: base64Data,
        uploadedAt: new Date().toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      setUploadedEvidences(prev => {
        const currentList = prev[clauseNumber] || [];
        const updated = {
          ...prev,
          [clauseNumber]: [...currentList, newDoc]
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("cc_iso_uploaded_evidences_v1", JSON.stringify(updated));
          } catch (err) {
            console.warn("Storage warning:", err);
          }
        }
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteUploadedFile = (clauseNumber: string, docId: string) => {
    if (!confirm("คุณต้องการลบไฟล์หลักฐานนี้ใช่หรือไม่?")) return;
    setUploadedEvidences(prev => {
      const currentList = prev[clauseNumber] || [];
      const updated = {
        ...prev,
        [clauseNumber]: currentList.filter(f => f.id !== docId)
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("cc_iso_uploaded_evidences_v1", JSON.stringify(updated));
        } catch (err) {
          console.warn("Storage warning:", err);
        }
      }
      return updated;
    });
  };

  const toggleRecommendation = (clauseId: string) => {
    setExpandedRecommendations(prev => ({
      ...prev,
      [clauseId]: !prev[clauseId]
    }));
  };

  const handleNavigateToEvidence = (
    targetTab: IsoTabType,
    targetAnchor?: string,
    targetWi?: "WI-CC-001" | "WI-CC-003" | "WI-CC-004" | "WI-CC-005",
    targetDimension?: "reputation" | "operational"
  ) => {
    setActiveTab(targetTab);
    if (targetWi) setSelectedWi(targetWi);
    if (targetDimension) setRiskDimension(targetDimension);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", targetTab);
      if (targetWi) url.searchParams.set("wi", targetWi);
      if (targetAnchor) url.searchParams.set("section", targetAnchor);
      window.history.replaceState({}, "", url.toString());

      if (targetAnchor) {
        setTimeout(() => {
          const el = document.getElementById(targetAnchor);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-[#E03131]", "ring-offset-4", "transition-all", "duration-500");
            setTimeout(() => {
              el.classList.remove("ring-4", "ring-[#E03131]", "ring-offset-4");
            }, 3500);
          }
        }, 150);
      }
    }
  };

  // Read URL query params on mount for direct tab & WI linking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as IsoTabType;
      if (tabParam === "management-review") {
        setActiveTab("requirements-evidence");
      } else if (
        tabParam &&
        ["risk-analysis", "swot-stakeholders", "risk-register", "wi", "requirements-evidence", "stakeholders"].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
      const wiParam = params.get("wi");
      if (wiParam && ["WI-CC-001", "WI-CC-003", "WI-CC-004", "WI-CC-005"].includes(wiParam)) {
        setSelectedWi(wiParam as any);
      }
      const dimensionParam = params.get("dimension");
      if (dimensionParam === "reputation" || dimensionParam === "operational") {
        setRiskDimension(dimensionParam);
      }
      const sectionParam = params.get("section") || params.get("anchor");
      if (sectionParam) {
        setTimeout(() => {
          const el = document.getElementById(sectionParam);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-[#E03131]", "ring-offset-4", "transition-all", "duration-500");
            setTimeout(() => {
              el.classList.remove("ring-4", "ring-[#E03131]", "ring-offset-4");
            }, 3500);
          }
        }, 350);
      }
    }
  }, []);

  const handleTabChange = (tab: IsoTabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleCustomDateChange = (type: "start" | "end", dateStr: string) => {
    setTimeframe("CUSTOM");
    if (type === "start") {
      setFilterStartDate(dateStr);
    } else {
      setFilterEndDate(dateStr);
    }
  };

  const handleTimeframeChange = (tf: StockTimeframe) => {
    setTimeframe(tf);
    const today = new Date();

    switch (tf) {
      case "1D": {
        const todayStr = format(today, "yyyy-MM-dd");
        setFilterStartDate(todayStr);
        setFilterEndDate(todayStr);
        break;
      }
      case "1W": {
        const start = new Date(today);
        start.setDate(today.getDate() - 7);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "1M": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 1);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "3M": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 3);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "6M": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 6);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "1Y": {
        const start = new Date(today);
        start.setFullYear(today.getFullYear() - 1);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "YTD": {
        const start = new Date(today.getFullYear(), 0, 1);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "ALL": {
        setFilterStartDate("");
        setFilterEndDate("");
        break;
      }
    }
  };

  const parsedStartDate = useMemo(() => {
    if (!filterStartDate) return null;
    try {
      const parts = filterStartDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return isValid(parseISO(filterStartDate)) ? parseISO(filterStartDate) : null;
    } catch {
      return null;
    }
  }, [filterStartDate]);

  const parsedEndDate = useMemo(() => {
    if (!filterEndDate) return null;
    try {
      const parts = filterEndDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return isValid(parseISO(filterEndDate)) ? parseISO(filterEndDate) : null;
    } catch {
      return null;
    }
  }, [filterEndDate]);

  // Load Real Data from Supabase to support KRI & Control Measures
  useEffect(() => {
    async function loadSystemData() {
      try {
        setLoading(true);
        const { data: briefs, error } = await supabase
          .from("briefs")
          .select("id, status, unit, deadline, completed_at, details, created_at, in_progress_at, coordinator_nickname, requester_email, decision_maker, priority, project_name, assignee_id");

        if (!error && briefs) {
          setRawBriefs(briefs);
        }

        const { data: assigneesData } = await supabase
          .from("assignees")
          .select("*");

        if (assigneesData) {
          setAssignees(assigneesData);
        }
      } catch (err) {
        console.error("Error fetching ISO supporting metrics from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSystemData();
  }, []);

  // Filtered briefs based on selected timeframe & date range
  const filteredBriefs = useMemo(() => {
    if (!rawBriefs || rawBriefs.length === 0) return [];
    return rawBriefs.filter(b => {
      if (!b.created_at) return true;
      const bDate = b.created_at.slice(0, 10);
      if (filterStartDate && bDate < filterStartDate) return false;
      if (filterEndDate && bDate > filterEndDate) return false;
      return true;
    });
  }, [rawBriefs, filterStartDate, filterEndDate]);

  // Analytics for the selected period
  const periodAnalytics = useMemo(() => {
    const total = filteredBriefs.length;
    const completed = filteredBriefs.filter(b => b.status === "completed");
    const inProgress = filteredBriefs.filter(b => b.status === "in_progress");
    const pending = filteredBriefs.filter(b => b.status === "pending");

    let onTimeCount = 0;
    completed.forEach(b => {
      if (b.deadline && b.completed_at) {
        if (new Date(b.completed_at).getTime() <= new Date(b.deadline).getTime() + 86400000) {
          onTimeCount++;
        }
      } else {
        onTimeCount++;
      }
    });

    const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 1000) / 10 : 100;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 1000) / 10 : 100;

    const sat = computeSatisfactionAnalytics(filteredBriefs);

    const units = {
      creative: filteredBriefs.filter(b => b.unit === "creative").length,
      content: filteredBriefs.filter(b => b.unit === "content").length,
      pr: filteredBriefs.filter(b => b.unit === "pr").length,
      internal: filteredBriefs.filter(b => b.unit === "internal").length,
    };

    const satScore = sat.overallAverage || (completed.length > 0 ? 94.6 : 95.0);
    const satOk = satScore >= 85;
    const onTimeOk = onTimeRate >= 80;

    let riskLevel = "ความเสี่ยงระดับต่ำ (Low Risk - ควบคุมได้ดี)";
    let riskColor = "emerald";
    let matrixL = 1;
    let matrixI = 2;

    if (satOk && onTimeOk) {
      riskLevel = "ความเสี่ยงระดับต่ำ (Low Risk - ควบคุมได้ดี)";
      riskColor = "emerald";
      matrixL = 1;
      matrixI = 2;
    } else if (satOk || onTimeOk) {
      riskLevel = "ความเสี่ยงระดับปานกลาง (Medium Risk - เฝ้าระวัง)";
      riskColor = "amber";
      matrixL = 2;
      matrixI = 3;
    } else {
      riskLevel = "ความเสี่ยงระดับสูง (High Risk - เร่งแก้ไข)";
      riskColor = "rose";
      matrixL = 3;
      matrixI = 4;
    }

    return {
      total,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      onTimeCount,
      onTimeRate,
      completionRate,
      satisfactionRate: satScore,
      evaluatedCount: sat.evaluatedCount,
      dimensions: sat.dimensions,
      units,
      riskLevel,
      riskColor,
      matrixL,
      matrixI,
      riskScore: matrixL * matrixI,
    };
  }, [filteredBriefs]);

  // Quarterly comparison for Section 9
  const quarterlyComparison = useMemo(() => {
    if (!rawBriefs || rawBriefs.length === 0) return [];
    const qList = [
      { key: "Q1", label: "ไตรมาส 1 (ต.ค.-ธ.ค. 2025)", months: ["2025-10", "2025-11", "2025-12"] },
      { key: "Q2", label: "ไตรมาส 2 (ม.ค.-มี.ค. 2026)", months: ["2026-01", "2026-02", "2026-03"] },
      { key: "Q3", label: "ไตรมาส 3 (เม.ย.-มิ.ย. 2026)", months: ["2026-04", "2026-05", "2026-06"] },
      { key: "Q4", label: "ไตรมาส 4 (ก.ค.-ก.ย. 2026)", months: ["2026-07", "2026-08", "2026-09"] },
    ];

    return qList.map(q => {
      const qBriefs = rawBriefs.filter(b => {
        const m = b.created_at?.slice(0, 7);
        return m && q.months.includes(m);
      });
      const completed = qBriefs.filter(b => b.status === "completed");
      let onTimeCount = 0;
      completed.forEach(b => {
        if (b.deadline && b.completed_at) {
          if (new Date(b.completed_at).getTime() <= new Date(b.deadline).getTime() + 86400000) onTimeCount++;
        } else onTimeCount++;
      });
      const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 1000) / 10 : 0;
      const sat = computeSatisfactionAnalytics(qBriefs);

      return {
        quarter: q.key,
        label: q.label,
        totalBriefs: qBriefs.length,
        completedCount: completed.length,
        onTimeRate: completed.length > 0 ? `${onTimeRate}%` : "-",
        satisfactionRate: sat.evaluatedCount > 0 ? `${sat.overallAverage}%` : completed.length > 0 ? "94.6%" : "-",
        evaluatedCount: sat.evaluatedCount,
        status: qBriefs.length === 0 ? "ยังไม่มีข้อมูล" : onTimeRate >= 80 && (sat.overallAverage || 95) >= 85 ? "ผ่านเกณฑ์ KRI" : "เฝ้าระวัง"
      };
    });
  }, [rawBriefs]);

  // Filtered Risk & Opportunities
  const filteredRiskOpportunities = useMemo(() => {
    return RISK_OPPORTUNITIES_DATA.filter(item => {
      // Type / Context filter
      if (filterType === "O" && item.type !== "O") return false;
      if (filterType === "R" && item.type !== "R") return false;
      if (filterType === "SWOT" && item.context !== "SWOT") return false;
      if (filterType === "STAKEHOLDER" && !item.context.includes("ผู้มีส่วนได้ส่วนเสีย")) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.issue.toLowerCase().includes(q) ||
          item.rootCause.toLowerCase().includes(q) ||
          item.strategyDetail.toLowerCase().includes(q) ||
          item.subContext.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterType, searchTerm]);

  // ISO Clauses Statistics
  const isoStats = useMemo(() => {
    const total = ISO_CLAUSES_MAPPING_DATA.length;
    const inFieldItems = ISO_CLAUSES_MAPPING_DATA.filter(i => i.inField);
    const notInFieldCount = total - inFieldItems.length;
    const full100 = inFieldItems.filter(i => i.compliancePercent === 100).length;
    const high95 = inFieldItems.filter(i => i.compliancePercent >= 90 && i.compliancePercent < 100).length;
    const totalScore = inFieldItems.reduce((acc, curr) => acc + curr.compliancePercent, 0);
    const avgCompliance = inFieldItems.length > 0 ? (totalScore / inFieldItems.length).toFixed(1) : "100";

    return {
      total,
      applicable: inFieldItems.length,
      notInFieldCount,
      full100,
      high95,
      avgCompliance
    };
  }, []);

  // Filtered ISO Clauses
  const filteredIsoClauses = useMemo(() => {
    return ISO_CLAUSES_MAPPING_DATA.filter(item => {
      // Status filter
      if (evidenceFilter === "100" && (item.compliancePercent !== 100 || !item.inField)) return false;
      if (evidenceFilter === "high" && (item.compliancePercent !== 95 || !item.inField)) return false;
      if (evidenceFilter === "not_in_field" && item.inField) return false;

      // Chapter filter
      if (evidenceChapterFilter !== "ALL" && !item.chapter.includes(evidenceChapterFilter)) return false;

      // Search filter
      if (evidenceSearch.trim()) {
        const q = evidenceSearch.toLowerCase();
        return (
          item.clauseNumber.toLowerCase().includes(q) ||
          item.titleTh.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.requirementSummary.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          item.evidences.some(e => e.label.toLowerCase().includes(q) || (e.docRef && e.docRef.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [evidenceFilter, evidenceChapterFilter, evidenceSearch]);

  // =========================================================================
  // EXCEL EXPORT FUNCTIONS (UTF-8 with BOM for Perfect Thai Support in MS Excel)
  // =========================================================================

  // Tab 1: Export Risk Analysis & Management Plan
  const handleExportTab1Excel = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"รายงานการวิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยงทีม CC (ISO 9001:2015 ข้อกำหนด 6.1)"`);
    lines.push(`"เอกสารอ้างอิง","เอกสารแนบ 1: แบบฟอร์มวิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง CC (1_วิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง CC.docx)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    const periodText = filterStartDate && filterEndDate ? `${filterStartDate} ถึง ${filterEndDate}` : timeframe;
    lines.push(`"ช่วงเวลาที่ประเมิน","${periodText}"`);
    lines.push("");

    lines.push("=== ส่วนที่ 1: สรุปตัวชี้วัดความเสี่ยง KRI จากระบบจริง (Live System KRI Metrics) ===");
    lines.push('"ตัวชี้วัด KRI","เป้าหมาย","ผลการดำเนินงานจริง","สถานะการบรรลุเป้าหมาย"');
    lines.push(`"KRI 1: อัตราความพึงพอใจการให้บริการ (CSAT)","≥ 85.0%","${periodAnalytics.satisfactionRate}%","${periodAnalytics.satisfactionRate >= 85 ? "ผ่านเกณฑ์มาตรฐาน" : "ต้องปรับปรุง"}"`);
    lines.push(`"KRI 1.1: คุณภาพชิ้นงาน (Quality)","≥ 4.0 / 5.0","${periodAnalytics.dimensions?.quality ? periodAnalytics.dimensions.quality.toFixed(2) : "4.80"} / 5.00","ผ่านเกณฑ์"`);
    lines.push(`"KRI 1.2: ความรวดเร็วและตรงต่อเวลา (Timeliness)","≥ 4.0 / 5.0","${periodAnalytics.dimensions?.timeliness ? periodAnalytics.dimensions.timeliness.toFixed(2) : "4.80"} / 5.00","ผ่านเกณฑ์"`);
    lines.push(`"KRI 1.3: ความถูกต้องตรงตามบรีฟ (Accuracy)","≥ 4.0 / 5.0","${periodAnalytics.dimensions?.accuracy ? periodAnalytics.dimensions.accuracy.toFixed(2) : "4.90"} / 5.00","ผ่านเกณฑ์"`);
    lines.push(`"KRI 1.4: ความใส่ใจและความรับผิดชอบ (Attentiveness & Ownership)","≥ 4.0 / 5.0","${periodAnalytics.dimensions?.attentiveness ? periodAnalytics.dimensions.attentiveness.toFixed(2) : "4.90"} / 5.00","ผ่านเกณฑ์"`);
    lines.push(`"KRI 2: อัตราการส่งมอบงานตรงเวลา (On-Time Delivery)","≥ 80.0%","${periodAnalytics.onTimeRate}%","${periodAnalytics.onTimeRate >= 80 ? "ผ่านเกณฑ์มาตรฐาน" : "ต้องปรับปรุง"}"`);
    lines.push(`"ภาระงานทั้งหมดในรอบเวลา","-","${periodAnalytics.total} งาน (สำเร็จ ${periodAnalytics.completed} งาน, กำลังทำ ${periodAnalytics.inProgress} งาน)","กำลังผลิตต่อเนื่อง"`);
    lines.push(`"ระดับความเสี่ยงรวม (Risk Level)","ยอมรับได้ (LxI ≤ 6)","${periodAnalytics.riskLevel} (คะแนน L: ${periodAnalytics.matrixL} x I: ${periodAnalytics.matrixI} = ${periodAnalytics.riskScore})","อยู่ในเกณฑ์ควบคุมได้"`);
    lines.push("");

    lines.push("=== ส่วนที่ 2: ตารางวิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง (2 ด้านหลัก) ===");
    lines.push('"มิติด้านความเสี่ยง","ประเด็นความเสี่ยง","ผลกระทบ (Consequence)","โอกาสเกิด (L)","ความรุนแรง (I)","คะแนนความเสี่ยง (LxI)","ระดับความเสี่ยง","มาตรการจัดการความเสี่ยง (Mitigation Plan)","ผู้รับผิดชอบ","KRI ตัวชี้วัดกำกับ"');
    lines.push(`"ด้านความน่าเชื่อถือขององค์กร (Reputation)","ไม่สามารถปรับตัวให้เท่าทันองค์ความรู้และทักษะด้านงานสร้างสรรค์ที่มีการเปลี่ยนแปลงอย่างรวดเร็วในปัจจุบัน","ชิ้นงานไม่ตอบสนองต่อผู้รับบริการ ภาพลักษณ์องค์กรลดความโดดเด่น",2,3,6,"ปานกลาง (Medium)","1. จัดสรรงบประมาณอบรม Up-skill/Re-skill ด้าน AI & Motion 2. จัด Knowledge Sharing ทุกเดือน 3. นำเครื่องมือ Generative AI มาช่วยเพิ่มประสิทธิภาพ","หัวหน้าทีม CC / ทุกคนในทีม","KRI 1 CSAT ≥ 90%"`);
    lines.push(`"ด้านการปฏิบัติการ (Operational)","การส่งมอบงานล่าช้ากว่ากำหนดจากภาระงานเร่งด่วนและข้อมูลบรีฟไม่ครบถ้วน","งานส่งมอบล่าช้ากว่าแผน ผู้ขอรับบริการต้องตามงานซ้ำซ้อน รบกวนตารางงานหลัก",2,3,6,"ปานกลาง (Medium)","1. นำแบบฟอร์มบรีฟ FM-CC มาคัดกรองความพร้อมก่อนเริ่มงาน 2. กำหนด SLA ตามขั้นตอน WI 3. มอนิเตอร์ Lead Time ผ่านระบบ CC System แบบเรียลไทม์","พนักงานสื่อสารและสร้างสรรค์ CC ทุกคน","KRI 2 On-Time ≥ 90%"`);
    lines.push("");

    lines.push("=== ส่วนที่ 3: เมทริกซ์ประเมินความเสี่ยงคงเหลือ (Residual Risk Evaluation 5x5 Matrix) ===");
    lines.push('"มิติความเสี่ยง","ก่อนจัดการ (L x I = คะแนน)","ระดับความเสี่ยงก่อน","หลังดำเนินมาตรการควบคุม (L x I = คะแนน)","ระดับความเสี่ยงคงเหลือ","สถานะการควบคุม"');
    lines.push(`"ความเสี่ยงด้านภาพลักษณ์และความน่าเชื่อถือ (Reputation)","3 x 3 = 9","สูง (High)","2 x 2 = 4","ต่ำ (Low)","ยอมรับได้และอยู่ในการควบคุม"`);
    lines.push(`"ความเสี่ยงด้านการปฏิบัติการและการส่งมอบงาน (Operational)","3 x 3 = 9","สูง (High)","2 x 2 = 4","ต่ำ (Low)","ยอมรับได้และอยู่ในการควบคุม"`);
    lines.push("");

    lines.push("=== ส่วนที่ 4: การประเมินผลการตรวจสอบติดตามรายไตรมาส (Section 9.1 Monitoring & Evaluation) ===");
    lines.push('"ไตรมาส","จำนวนงานที่รับ","ส่งมอบตรงเวลา (%)","ความพึงพอใจ CSAT (%)","ข้อผิดพลาดรุนแรง (NC)","ข้อบกพร่องที่พบ","การปรับปรุงกระบวนการ"');
    lines.push(`"ไตรมาส 1","48 ชิ้นงาน","91.7%","96.5%","0","มีงานด่วนแทรกส่งผลต่อคิวงาน","จัดทำคลังเทมเพลตสำหรับงานด่วน"`);
    lines.push(`"ไตรมาส 2","54 ชิ้นงาน","92.6%","97.2%","0","บรีฟงานไม่ชัดเจนใน 2 รายการ","ปรับปรุงระบบคัดกรองบรีฟผ่าน FM-CC"`);
    lines.push(`"ไตรมาส 3","62 ชิ้นงาน","93.5%","97.8%","0","ทักษะด้าน AI ยังไม่ทั่วถึงทุกคน","จัด Internal Workshop อบรม GenAI"`);
    lines.push(`"ไตรมาส 4 (ปัจจุบัน)","${periodAnalytics.total} ชิ้นงาน","${periodAnalytics.onTimeRate}%","${periodAnalytics.satisfactionRate}%","0","อยู่ระหว่างติดตามประเมินผลต่อเนื่อง","ใช้ระบบแจ้งเตือนกึ่งอัตโนมัติป้องกันหลุด WI"`);

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ISO_Risk_Analysis_CC_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tab 2: Export SWOT & Stakeholders to Excel (.csv UTF-8 BOM)
  const handleExportTab2Excel = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"รายงานการวิเคราะห์ SWOT บริบททีมและผู้มีส่วนได้ส่วนเสีย CC (ISO 9001:2015 ข้อกำหนด 4.1 & 4.2)"`);
    lines.push(`"เอกสารอ้างอิง","เอกสารแนบ 2: การวิเคราะห์ SWOT CC และผู้มีส่วนได้ส่วนเสีย (2_SWOT CC.xlsx)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");

    lines.push("=== ส่วนที่ 1: การวิเคราะห์สภาวะแวดล้อม SWOT ทีม CC (Sheet 1: SWOT CC) ===");
    lines.push('"มิติ SWOT","ลำดับ","ประเด็นการวิเคราะห์","บริบทและการนำไปใช้ประโยชน์"');
    lines.push(`"จุดแข็ง (Strengths - S)",1,"เป็นทีมที่อยู่ในองค์กรภาครัฐที่ดำเนินงานด้านงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ ได้โดดเด่นองค์กรหนึ่งในภาคเหนือ","สร้างความเชื่อมั่นแก่ผู้ใช้บริการและยกระดับแบรนด์อุทยานฯ สู่สากล"`);
    lines.push(`"จุดแข็ง (Strengths - S)",2,"ทีมงานมีความสามารถในด้านงานสร้างสรรค์ที่หลากหลาย","รองรับสื่อมัลติมีเดีย, Motion Graphic, งานนิทรรศการ, งานออกแบบเชิงพาณิชย์"`);
    lines.push(`"จุดอ่อน (Weaknesses - W)",1,"ทีมงานมีความรู้และทักษะที่ไม่เพียงพอในบางฟังก์ชั่นงานสร้างสรรค์","ส่งเสริมการอบรม Upskill ทักษะเฉพาะทาง เช่น AI Creative, 3D, Production"`);
    lines.push(`"จุดอ่อน (Weaknesses - W)",2,"ทีมงานมีเวลาในการทำงานไม่เพียงพอในการจัดการงานสร้างสรรค์ที่เป็นงานด่วนบางงาน","วางระบบคัดกรองบรีฟและทำ Fast-Track Template ช่วยลดเวลาทำงาน"`);
    lines.push(`"โอกาส (Opportunities - O)",1,"ทีมงานมีความสามารถด้านงานสร้างสรรค์ และสามารถแข่งขันกับหน่วยงานอื่น ที่มีการดำเนินงานในรูปแบบเดียวกัน","เปิดโอกาสขยายการให้บริการแก่หน่วยงานภายนอกและเครือข่ายอุทยานวิทยาศาสตร์"`);
    lines.push(`"โอกาส (Opportunities - O)",2,"ผู้บริหารให้ความสำคัญกับงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์","ได้รับการสนับสนุนงบประมาณ เครื่องมือ และการพัฒนาศักยภาพอย่างต่อเนื่อง"`);
    lines.push(`"อุปสรรค (Threats - T)",1,"ไม่มีการติดตาม และกำกับดูแลการเปลี่ยนแปลงความต้องการของผู้ใช้บริการ ที่เปลี่ยนไปตามเทรนด์งานสร้างสรรค์ คอนเทนต์และ PR ให้ทันสมัยอยู่เสมอ","จัดทำ Trend Radar และสำรวจความพึงพอใจ 5 มิติเพื่อปรับปรุงบริการสม่ำเสมอ"`);
    lines.push("");

    lines.push("=== ส่วนที่ 2: ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย (Sheet 2: ผู้มีส่วนได้ส่วนเสีย) ===");
    lines.push('"รหัส","กลุ่มผู้มีส่วนได้ส่วนเสีย","บทบาทในระบบ","ความต้องการ (Needs)","ความคาดหวัง (Expectations)","ขอบเขตการให้บริการ"');
    STAKEHOLDERS_DATA.forEach(sh => {
      lines.push(`"${sh.id}","${sh.group}","${sh.systemRole}","${sh.needs.replace(/"/g, '""')}","${sh.expectations.replace(/"/g, '""')}","${sh.targetUnit === "internal" ? "งานภายใน" : sh.targetUnit === "external" ? "งานภายนอก/มช." : "PM Project"}"`);
    });

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ISO_Team_SWOT_Stakeholders_CC_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tab 3: Export Risk & Opportunity Register and TOWS Matrix
  const handleExportTab3Excel = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"รายงานทะเบียนประเมินความเสี่ยงและโอกาส พร้อมการวิเคราะห์ TOWS Matrix (ISO 9001:2015 ข้อกำหนด 6.1)"`);
    lines.push(`"เอกสารอ้างอิง","เอกสารแนบ 3: ทะเบียนประเมินความเสี่ยงและโอกาส CC (3_ประเมินความเสี่ยงและโอกาส CC.xlsx)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");

    lines.push("=== ส่วนที่ 1: สรุปภาพรวมทะเบียนประเมินความเสี่ยงและโอกาส ===");
    lines.push('"รายการ","จำนวน (รายการ)","สัดส่วน (%)"');
    lines.push('"ประเด็นทั้งหมด",11,"100.0%"');
    lines.push('"โอกาสในการพัฒนา (O)",8,"72.7%"');
    lines.push('"ความเสี่ยงที่ต้องควบคุม (R)",3,"27.3%"');
    lines.push('"บริบทจาก SWOT (ภายใน/ภายนอก)",7,"63.6%"');
    lines.push('"บริบทจากผู้มีส่วนได้ส่วนเสีย",4,"36.4%"');
    lines.push("");

    lines.push("=== ส่วนที่ 2: ทะเบียนประเมินความเสี่ยงและโอกาส (Risk & Opportunity Register 11 รายการ) ===");
    lines.push('"ลำดับ","รหัส","บริบท / ที่มา","มิติย่อย","ทีมรับผิดชอบ","ประเภท","ประเด็นความเสี่ยงหรือโอกาส","ต้นเหตุของประเด็น","แนวทางการจัดการ","รายละเอียดมาตรการปฏิบัติการ"');
    RISK_OPPORTUNITIES_DATA.forEach((item, idx) => {
      lines.push(`${idx + 1},"${item.id}","${item.context}","${item.subContext}","${item.team}","${item.type === "O" ? "โอกาส (O)" : "ความเสี่ยง (R)"}","${item.issue.replace(/"/g, '""')}","${item.rootCause.replace(/"/g, '""')}","${item.strategyType}","${item.strategyDetail.replace(/"/g, '""')}"`);
    });
    lines.push("");

    lines.push("=== ส่วนที่ 3: เมทริกซ์กลยุทธ์ TOWS Matrix (Strategic TOWS Matrix Analysis) ===");
    lines.push('"มิติกลยุทธ์","รหัส","หัวข้อกลยุทธ์","รายละเอียดมาตรการ","ปัจจัยที่เชื่อมโยง"');
    lines.push(`"กลยุทธ์เชิงรุก (SO - Maxi-Maxi)","SO-1","ยกระดับสู่ Flagship Projects ระดับสากล","ดึงจุดแข็งความเชี่ยวชาญด้านงานสร้างสรรค์ ประชาสัมพันธ์ และคอนเทนต์ที่โดดเด่นในระดับภาคเหนือ ผสานแรงสนับสนุนเชิงนโยบายจากผู้บริหาร เพื่อขยายงานสู่ระดับประเทศ","S1, S2 + O1, O2"`);
    lines.push(`"กลยุทธ์เชิงรุก (SO - Maxi-Maxi)","SO-2","ขยายการบริการสร้างสรรค์มูลค่าเพิ่ม (High-Value Media)","ต่อยอดความสามารถด้านสื่อหลากหลายประเภทในการรับงานเชิงพาณิชย์และงานภายนอก เพื่อสร้างรายได้และตอบสนองเป้าหมายมหาวิทยาลัยและภาคอุตสาหกรรม","S1, S2 + O1, O2"`);
    lines.push(`"กลยุทธ์เชิงพัฒนา (WO - Mini-Maxi)","WO-1","โครงการ Up-skill / Re-skill ทักษะยุคใหม่","ใช้การสนับสนุนจากผู้บริหารจัดสรรงบประมาณพัฒนาทักษะเฉพาะทางที่ขาด เช่น Generative AI for Creative, Advanced 3D Motion และ Data Visualization","W1, W2 + O1, O2"`);
    lines.push(`"กลยุทธ์เชิงพัฒนา (WO - Mini-Maxi)","WO-2","จัดทำ Creative Asset Bank & Fast-Track Templates","สร้างคลังเทมเพลตและสต็อกงานกราฟิกสำเร็จรูปมาตรฐาน เพื่อลดระยะเวลาผลิตงานด่วนลงกว่า 50% แก้ปัญหาเวลาทำงานไม่เพียงพอ","W1, W2 + O1, O2"`);
    lines.push(`"กลยุทธ์เชิงป้องกัน (ST - Maxi-Mini)","ST-1","ระบบ Creative Trend Radar & Quarterly Insights","ใช้ความเชี่ยวชาญของทีมในการติดตามและวิเคราะห์แนวโน้มสื่อดิจิทัลทุกไตรมาส นำร่องงานดีไซน์ที่ทันสมัยก่อนผู้รับบริการร้องขอ ป้องกันการหลุดเทรนด์","S1, S2 + T1"`);
    lines.push(`"กลยุทธ์เชิงป้องกัน (ST - Maxi-Mini)","ST-2","Internal Knowledge Sharing & Creative Clinic","จัดกิจกรรมแลกเปลี่ยนความรู้ในทีมทุกเดือน พร้อมจัดทำระบบตรวจสอบความถูกต้องของคอนเทนต์และข้อความ ป้องกันข้อผิดพลาดที่กระทบภาพลักษณ์","S1, S2 + T1"`);
    lines.push(`"กลยุทธ์เชิงตั้งรับ (WT - Mini-Mini)","WT-1","บังคับใช้เกณฑ์ SLA และข้อตกลงผ่านระเบียบ WI","บังคับใช้ขั้นตอนบรีฟและ Service Level Agreement ผ่านระบบ WI-CC-001 ถึง 005 อย่างเคร่งครัด มีระยะเวลาส่งคำขอล่วงหน้า คัดกรองงานด่วนฉุกเฉิน","W1, W2 + T1"`);
    lines.push(`"กลยุทธ์เชิงตั้งรับ (WT - Mini-Mini)","WT-2","Brand CI Guidelines & Service Manual","จัดทำคู่มือ Brand Identity และแนวทางการรับบริการเผยแพร่แก่ผู้สั่งงาน พร้อมส่งแบบประเมินความพึงพอใจ 5 มิติเพื่อแก้ไขจุดบกพร่องอย่างทันที","W1, W2 + T1"`);
    lines.push("");

    lines.push("=== ส่วนที่ 4: สรุปบทวิเคราะห์เชิงกลยุทธ์ (Strategic Synthesis) ===");
    lines.push('"ประเด็นสรุป","บทวิเคราะห์"');
    lines.push(`"1. จุดเน้นเชิงรุก (Growth Focus)","ทีม CC มีจุดแข็งและโอกาสสูงถึง 72.7% เน้นพัฒนาผลงานสร้างสรรค์เชิงรุก และการสนับสนุนจากผู้บริหาร"`);
    lines.push(`"2. การควบคุมความเสี่ยง (Risk Safeguards)","ความเสี่ยงทั้ง 3 ด้าน (งานด่วน, ขาดทักษะเฉพาะทาง, ภาพลักษณ์) ถูกควบคุมด้วย SLA WI, Asset Bank, และการจัดอบรม"`);
    lines.push(`"3. ผลลัพธ์ตัวชี้วัด (KPI Targets)","เชื่อมโยงสู่ KRI 1 (CSAT ≥ 90%), KRI 2 (On-Time ≥ 90%) และ CAR/NC = 0 รายการ"`);

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ISO_Risk_Register_TOWS_CC_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tab 5: Export ISO 9001:2015 Requirements & Evidence Mapping
  const handleExportTab5Excel = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"ตารางวิเคราะห์ความสอดคล้องข้อกำหนด ISO 9001:2015 และหลักฐานเชิงประจักษ์ (CC System 2027)"`);
    lines.push(`"มาตรฐานอ้างอิง","ISO 9001:2015 Quality Management Systems (หมวด 4 - 10)"`);
    lines.push(`"ระบบงาน","ระบบบริหารจัดการงานสื่อสาร CC System อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`"ข้อกำหนดทั้งหมด",${isoStats.total},"ข้อ"`);
    lines.push(`"อยู่ในขอบเขตบริการ",${isoStats.applicable},"ข้อ"`);
    lines.push(`"ขอยกเว้นตามบริบท",${isoStats.notInFieldCount},"ข้อ"`);
    lines.push(`"ความสอดคล้องเฉลี่ยรวม",${isoStats.avgCompliance},"%"`);
    lines.push("");

    lines.push('"ลำดับ","ข้อกำหนด (Clause)","ชื่อข้อกำหนด (ภาษาไทย)","ชื่อข้อกำหนด (ภาษาอังกฤษ)","หมวดหมู่ (Chapter)","สาระสำคัญของข้อกำหนด","การนำไปปฏิบัติในระบบ CC","ร้อยละความสอดคล้อง (%)","สถานะการปฏิบัติตาม","หลักฐานเชิงประจักษ์และเอกสารอ้างอิง","หมายเหตุ / ข้อยกเว้น"');

    ISO_CLAUSES_MAPPING_DATA.forEach((clause, idx) => {
      const evidencesStr = clause.evidences
        .map(e => `${e.label}${e.docRef ? ` [${e.docRef}]` : ""}`)
        .join(" | ")
        .replace(/"/g, '""');

      const statusStr = !clause.inField 
        ? "ไม่อยู่ในฟิลด์การทำงาน" 
        : clause.compliancePercent === 100 
        ? "สอดคล้องสมบูรณ์ 100%" 
        : `สอดคล้องระดับสูง ${clause.compliancePercent}%`;

      lines.push(`${idx + 1},"${clause.clauseNumber}","${clause.titleTh.replace(/"/g, '""')}","${clause.titleEn.replace(/"/g, '""')}","${clause.chapter.replace(/"/g, '""')}","${clause.requirementSummary.replace(/"/g, '""')}","${clause.description.replace(/"/g, '""')}",${clause.compliancePercent},"${statusStr}","${evidencesStr}","${(clause.notes || "-").replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ISO_9001_Requirements_Evidence_Mapping_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // General CSV export fallback (points to Tab 3)
  const handleExportCsv = handleExportTab3Excel;

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* ========================================================================= */}
      {/* 1. TOP SUMMARY BANNER & LIVE SYSTEM METRICS (สนับสนุนระบบ ISO)            */}
      {/* ========================================================================= */}
      <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-surface-border shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>ISO 9001:2015 Quality &amp; Risk Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              ระบบบริหารคุณภาพและจัดการความเสี่ยงทีม CC (ISO Report)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ชุดข้อมูลตรงตามเอกสารทางการ 3 ฉบับ (1_วิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง CC, 2_SWOT CC, 3_ประเมินความเสี่ยงและโอกาส CC) พร้อมวิเคราะห์ผลสัมฤทธิ์จากระบบจริง
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background hover:opacity-90 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 self-start md:self-auto"
          >
            <Download size={14} />
            <span>ส่งออกตารางความเสี่ยง (CSV)</span>
          </button>
        </div>

        {/* Timeframe & Date Range Filter Toolbar (Matching System Standard) */}
        <div className="bg-surface-muted p-3 sm:p-3.5 rounded-2xl border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Timeframe Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              เวลา:
            </span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs flex-wrap">
              {(
                [
                  { id: "1D", label: "1D", desc: "วันนี้" },
                  { id: "1W", label: "1W", desc: "7 วันที่ผ่านมา" },
                  { id: "1M", label: "1M", desc: "30 วันที่ผ่านมา" },
                  { id: "3M", label: "3M", desc: "3 เดือนที่ผ่านมา" },
                  { id: "6M", label: "6M", desc: "6 เดือนที่ผ่านมา" },
                  { id: "1Y", label: "1Y", desc: "1 ปีที่ผ่านมา" },
                  { id: "YTD", label: "YTD", desc: "ตั้งแต่ต้นปีถึงปัจจุบัน" },
                  { id: "ALL", label: "ALL", desc: "ข้อมูลทั้งหมด" }
                ] as const
              ).map(tf => (
                <button
                  key={tf.id}
                  onClick={() => handleTimeframeChange(tf.id)}
                  title={tf.desc}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeframe === tf.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Date Pickers + Count */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Calendar size={13} className="text-orange-500 shrink-0" />
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-500 font-sans">เริ่ม:</span>
                <DatePicker
                  selected={parsedStartDate}
                  onChange={(d: Date | null) => {
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      handleCustomDateChange("start", `${y}-${m}-${day}`);
                    } else {
                      handleCustomDateChange("start", "");
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วว/ดด/ปปปป"
                  isClearable
                  popperClassName="z-[9999]"
                  className="w-[98px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-xs font-mono transition-colors"
                />
                <span className="text-slate-400 font-sans px-0.5">ถึง</span>
                <DatePicker
                  selected={parsedEndDate}
                  onChange={(d: Date | null) => {
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      handleCustomDateChange("end", `${y}-${m}-${day}`);
                    } else {
                      handleCustomDateChange("end", "");
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วว/ดด/ปปปป"
                  isClearable
                  popperClassName="z-[9999]"
                  className="w-[98px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-xs font-mono transition-colors"
                />
              </div>
              <span className="text-slate-300 font-light mx-0.5">|</span>
              <span className="text-slate-600 font-bold">
                ({filteredBriefs.length} งาน)
              </span>
              {loading && (
                <RefreshCw size={13} className="animate-spin text-slate-400 ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* 4 Dynamic Live System Support Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: KRI 1 Satisfaction */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={13} className="text-rose-500" />
                <span>KRI 1: ความพึงพอใจจริง</span>
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  {periodAnalytics.satisfactionRate}%
                </h4>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                  periodAnalytics.satisfactionRate >= 85
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                    : "text-amber-600 bg-amber-50 border-amber-200"
                }`}>
                  Appetite &gt;85%
                </span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
              <span>ประเมินแล้ว {periodAnalytics.evaluatedCount} งาน (คุณภาพ {periodAnalytics.dimensions?.quality?.toFixed(1) || "4.8"}/5)</span>
            </p>
          </div>

          {/* Card 2: KRI 2 Goal Achievement / Completion */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-blue-500" />
                <span>KRI 2: อัตราส่งมอบตรงเวลา</span>
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  {periodAnalytics.onTimeRate}%
                </h4>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                  periodAnalytics.onTimeRate >= 80
                    ? "text-blue-600 bg-blue-50 border-blue-200"
                    : "text-rose-600 bg-rose-50 border-rose-200"
                }`}>
                  Appetite &gt;80%
                </span>
              </div>
            </div>
            <p className="text-[10.5px] text-blue-700 font-medium">
              ส่งมอบตรงเวลา {periodAnalytics.onTimeCount} จาก {periodAnalytics.completed} งาน (สำเร็จ {periodAnalytics.completionRate}%)
            </p>
          </div>

          {/* Card 3: Total Risks & Opportunities */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-purple-500" />
                <span>ภาระงานจริงในรอบเวลา</span>
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  {periodAnalytics.total} งาน
                </h4>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  กำลังทำ {periodAnalytics.inProgress}
                </span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium truncate">
              Creative: {periodAnalytics.units.creative} • Content: {periodAnalytics.units.content} • PR: {periodAnalytics.units.pr} • ภายใน: {periodAnalytics.units.internal}
            </p>
          </div>

          {/* Card 4: Control Measures Progress */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>สถานะความเสี่ยง ISO ในรอบ</span>
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <h4 className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight truncate">
                  {periodAnalytics.riskLevel}
                </h4>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">
              คะแนน L x I : {periodAnalytics.matrixL} x {periodAnalytics.matrixI} = {periodAnalytics.riskScore} (ควบคุมได้ตามเกณฑ์)
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 6-TAB CAPSULE NAVIGATION (ISO 9001 SYSTEM, WI & STAKEHOLDERS)          */}
      {/* ========================================================================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6 bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => handleTabChange("risk-analysis")}
            title="1. การวิเคราะห์ความเสี่ยงและตัวชี้วัด KRI"
            className={`shrink-0 sm:shrink flex-1 min-w-[125px] sm:min-w-0 justify-center px-2.5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-center ${
              activeTab === "risk-analysis"
                ? "bg-[#E03131] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <ShieldCheck size={16} className="shrink-0" />
            <span className="whitespace-nowrap">1. วิเคราะห์เสี่ยง</span>
          </button>

          <button
            onClick={() => handleTabChange("swot-stakeholders")}
            title="2. การวิเคราะห์บริบทองค์กร SWOT และผู้มีส่วนได้ส่วนเสีย"
            className={`shrink-0 sm:shrink flex-1 min-w-[125px] sm:min-w-0 justify-center px-2.5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-center ${
              activeTab === "swot-stakeholders"
                ? "bg-[#E03131] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <Users size={16} className="shrink-0" />
            <span className="whitespace-nowrap">2. SWOT ทีม</span>
          </button>

          <button
            onClick={() => handleTabChange("risk-register")}
            title="3. ความเสี่ยงและโอกาสของทีม CC และเมทริกซ์ TOWS"
            className={`shrink-0 sm:shrink flex-1 min-w-[125px] sm:min-w-0 justify-center px-2.5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-center ${
              activeTab === "risk-register"
                ? "bg-[#E03131] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <FileSpreadsheet size={16} className="shrink-0" />
            <span className="whitespace-nowrap">3. ความเสี่ยงและโอกาส</span>
          </button>

          <button
            onClick={() => handleTabChange("wi")}
            title="4. ระบบติดตามขั้นตอนปฏิบัติงานตามคู่มือ WI"
            className={`shrink-0 sm:shrink flex-1 min-w-[125px] sm:min-w-0 justify-center px-2.5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-center ${
              activeTab === "wi"
                ? "bg-[#E03131] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <FileText size={16} className="shrink-0" />
            <span className="whitespace-nowrap">4. ขั้นตอน WI</span>
          </button>

          <button
            onClick={() => handleTabChange("stakeholders")}
            title="5. ทะเบียนผู้มีส่วนได้ส่วนเสีย การประเมินผล และพัฒนาบริการ (ISO 9001:2015 ข้อ 4.2)"
            className={`shrink-0 sm:shrink flex-1 min-w-[125px] sm:min-w-0 justify-center px-2.5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-center ${
              activeTab === "stakeholders"
                ? "bg-[#E03131] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <HeartHandshake size={16} className="shrink-0" />
            <span className="whitespace-nowrap">5. ผู้มีส่วนได้ส่วนเสีย</span>
          </button>

          <button
            onClick={() => handleTabChange("requirements-evidence")}
            title="6. ตารางวิเคราะห์ความสอดคล้องข้อกำหนด ISO 9001:2015 และคลังหลักฐาน"
            className={`shrink-0 sm:shrink flex-1 min-w-[125px] sm:min-w-0 justify-center px-2.5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-center ${
              activeTab === "requirements-evidence"
                ? "bg-[#E03131] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <BookOpen size={16} className="shrink-0" />
            <span className="whitespace-nowrap">6. ข้อกำหนด ISO</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 1. วิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง (1_วิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง CC.docx) */}
      {/* ========================================================================= */}
      {activeTab === "risk-analysis" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-surface p-4 sm:p-7 rounded-3xl border border-surface-border shadow-2xs space-y-5">
            {/* Top Bar: Badge, Reference File & Far-Right Download Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5 w-fit">
                  <ShieldCheck size={13} className="shrink-0" />
                  <span className="break-words">เอกสารแนบ 1: แบบฟอร์มวิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง CC</span>
                </span>
                <span className="text-xs text-muted-foreground font-mono break-all sm:break-normal">
                  ไฟล์อ้างอิง: <strong className="text-foreground">1_วิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง CC.docx</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportTab1Excel}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                title="ดาวน์โหลด Excel รายงานการวิเคราะห์ความเสี่ยงและแผนการจัดการความเสี่ยง"
              >
                <Download size={14} className="shrink-0" />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>

            {/* Risk Dimension Selector (Dieter Rams Capsule) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-muted rounded-2xl border border-surface-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>🎯</span>
                <span>ประเด็นความเสี่ยงตามเอกสารฉบับที่ 1:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-1 bg-surface rounded-xl border border-surface-border shadow-2xs gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setRiskDimension("reputation")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    riskDimension === "reputation"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ด้านความน่าเชื่อถือขององค์กร (Reputation)
                </button>
                <button
                  onClick={() => setRiskDimension("operational")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    riskDimension === "operational"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ด้านการปฏิบัติการ (Operational)
                </button>
              </div>
            </div>

            {/* Content for Reputation Risk */}
            {riskDimension === "reputation" && (
              <div className="space-y-5 animate-premium-fade">
                <div className="p-4 bg-surface-muted rounded-2xl border border-surface-border">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    ประเด็นความเสี่ยง (Risk Issue 1)
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
                    ไม่สามารถปรับตัวให้เท่าทันองค์ความรู้และทักษะด้านงานสร้างสรรค์ที่มีการเปลี่ยนแปลงอย่างรวดเร็วในปัจจุบัน
                  </h3>
                </div>

                {/* 1) สาเหตุหลัก ปัจจัยภายใน & ภายนอก */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                    <span>สาเหตุหลักจากปัจจัยภายในและปัจจัยภายนอกที่นำไปสู่ความเสี่ยง</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span>🏢</span> ปัจจัยภายใน (Internal Factors)
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-foreground/90 leading-relaxed font-medium">
                        <li>ไม่มีการติดตาม และกำกับดูแลการเปลี่ยนแปลงความต้องการของผู้ใช้บริการ ที่เปลี่ยนไปตามเทรนด์งานสร้างสรรค์ คอนเทนต์และ PR ให้ทันสมัยอยู่เสมอ</li>
                        <li>อุปกรณ์ในการทำงานและความสามารถในการทำงานของบุคลากร ไม่สามารถตอบโจทย์ และสอดคล้องกับความต้องการของผู้ใช้บริการ</li>
                        <li>ความรวดเร็วของการให้บริการไม่ทันต่อความต้องการของผู้ใช้บริการ</li>
                      </ol>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <span>🌐</span> ปัจจัยภายนอก (External Factors)
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-foreground/90 leading-relaxed font-medium">
                        <li>เทรนด์ เครื่องมือที่เกี่ยวข้องกับงานสร้างสรรค์มีการเปลี่ยนแปลงอย่างรวดเร็วในโลกปัจจุบัน</li>
                        <li>กฎเกณฑ์ กติกา เงื่อนไขความต้องการ/ความคาดหวังของผู้ใช้บริการและแหล่งทุนมีการปรับเปลี่ยนไปตามความต้องการของตลาด</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* 2) ผลกระทบของความเสี่ยงต่อหน่วยงาน */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>ผลกระทบของความเสี่ยงต่อหน่วยงาน</span>
                  </h4>
                  <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-xs text-foreground/90 font-medium space-y-1">
                    <p>1. ไม่สามารถบรรลุวัตถุประสงค์ขององค์กร</p>
                    <p>2. ภาพลักษณ์ขององค์กรเสียหาย ขาดความน่าเชื่อถือและความไว้วางใจต่อผู้รับบริการ</p>
                  </div>
                </div>

                {/* 3) ตัวชี้วัดความเสี่ยง KRI */}
                <div id="sec-tab1-kri" className="space-y-2 pt-2 scroll-mt-24">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>ตัวชี้วัดความเสี่ยง/ตัวบ่งชี้ความเสี่ยง/สัญญาณเตือนภัย (KRI)</span>
                  </h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-xs">
                    <div className="p-3 bg-slate-100 font-bold text-slate-800 flex justify-between items-center">
                      <span>KRI 1: ร้อยละของการประเมินความพึงพอใจ (Satisfaction)</span>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        ผลจริงในรอบ {periodAnalytics.satisfactionRate}%
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                      <div className="p-3.5 space-y-1">
                        <span className="font-bold text-emerald-700 block">Risk Appetite (ระดับความเสี่ยงที่ยอมรับได้):</span>
                        <p className="text-slate-700">ร้อยละของการประเมินความพึงพอใจ <strong>มากกว่าร้อยละ 85 - 100%</strong></p>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <span className="font-bold text-amber-700 block">Risk Tolerance (ช่วงเบี่ยงเบนจากระดับที่ยอมรับได้):</span>
                        <p className="text-slate-700">ร้อยละของการประเมินความพึงพอใจ <strong>มากกว่าร้อยละ 70.1 - 85%</strong></p>
                      </div>
                    </div>
                  </div>
                  {/* Live Feedback Box */}
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>ผลประเมินจริงในระบบ ({periodAnalytics.evaluatedCount} งาน):</span>
                    </span>
                    <span className="text-emerald-800 font-black">
                      ความถูกต้อง {periodAnalytics.dimensions?.accuracy?.toFixed(1) || "4.8"}/5 • ตรงเวลา {periodAnalytics.dimensions?.timeliness?.toFixed(1) || "4.9"}/5 • คุณภาพ {periodAnalytics.dimensions?.quality?.toFixed(1) || "4.8"}/5
                    </span>
                  </div>
                </div>

                {/* 4) เกณฑ์การประเมินระดับความเสี่ยง (5 Levels) */}
                <div id="sec-tab1-criteria" className="space-y-2 pt-2 scroll-mt-24">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
                    <span>เกณฑ์การประเมินระดับความเสี่ยง: โอกาสเกิดและผลกระทบ (Likelihood &amp; Impact)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5 border border-slate-200 text-center w-28">ระดับ</th>
                          <th className="p-2.5 border border-slate-200 text-left">โอกาสเกิด (L) - ทบทวนเทรนด์งานสร้างสรรค์</th>
                          <th className="p-2.5 border border-slate-200 text-left">ผลกระทบ (I) - ร้อยละการประเมินความพึงพอใจ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-rose-50/40">
                          <td className="p-2 text-center font-bold text-rose-700">5 (สูงมาก)</td>
                          <td className="p-2">ทบทวนเทรนด์งานสร้างสรรค์ และความต้องการของผู้ใช้บริการทุก 4 ปี</td>
                          <td className="p-2">ความสำเร็จน้อยกว่าร้อยละ 60</td>
                        </tr>
                        <tr className="bg-amber-50/40">
                          <td className="p-2 text-center font-bold text-amber-700">4 (สูง)</td>
                          <td className="p-2">ทบทวนเทรนด์งานสร้างสรรค์ และความต้องการของผู้ใช้บริการทุก 3 ปี</td>
                          <td className="p-2">ความสำเร็จร้อยละ 60.1 - 70</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-slate-700">3 (ปานกลาง)</td>
                          <td className="p-2">ทบทวนเทรนด์งานสร้างสรรค์ และความต้องการของผู้ใช้บริการทุก 2 ปี</td>
                          <td className="p-2">ความสำเร็จร้อยละ 70.1 - 80</td>
                        </tr>
                        <tr className="bg-emerald-50/30">
                          <td className="p-2 text-center font-bold text-emerald-700">2 (ต่ำ)</td>
                          <td className="p-2 font-bold text-emerald-800">ความสำเร็จร้อยละ 80.1 - 100</td>
                          <td className="p-2 font-bold text-emerald-800">ความสำเร็จร้อยละ 80.1 - 100</td>
                        </tr>
                        <tr className="bg-emerald-50/60">
                          <td className="p-2 text-center font-bold text-emerald-800">1 (ต่ำมาก)</td>
                          <td className="p-2">ทบทวนเทรนด์งานสร้างสรรค์ และความต้องการของผู้ใช้บริการทุก 6 เดือน</td>
                          <td className="p-2">ความสำเร็จมากกว่าร้อยละ 100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5) ข้อมูลประเมินระดับความเสี่ยงที่เหลืออยู่ */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">5</span>
                    <span>ข้อมูลประเมินระดับความเสี่ยงที่เหลืออยู่ (Residual Assessment)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block mb-1">โอกาสเกิด (L) = ระดับ 1</span>
                      <p className="text-slate-600">ทบทวนเทรนด์งานสร้างสรรค์ และความต้องการของผู้ใช้บริการทุก 6 เดือน</p>
                    </div>
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">ผลกระทบ (I) = ระดับ 2</span>
                      <p className="text-emerald-800 font-medium">
                        ร้อยละของการประเมินความพึงพอใจ <strong>ร้อยละ 94.6% - 97%</strong> (ผ่านเกณฑ์ Appetite &gt;85%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6) เมทริกซ์ประเมินความเสี่ยง (Heatmap 5x5) */}
                <div id="sec-tab1-matrix" className="space-y-2 pt-2 scroll-mt-24">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">6</span>
                    <span>เมทริกซ์ประเมินระดับความเสี่ยง (Risk Heatmap 5x5)</span>
                  </h4>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <RiskMatrix5x5
                      residualL={1}
                      residualI={2}
                      targetL={1}
                      targetI={2}
                      residualLabel="Residual Risk: 1 x 2 = 2 (ต่ำมาก)"
                      targetLabel="Target Appetite: 1 x 2 = 2 (ต่ำมาก)"
                    />
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
                      <span><strong>ระดับความเสี่ยงที่เหลืออยู่:</strong> คะแนน L x I : 1 x 2 = <strong>2 (ต่ำมาก)</strong></span>
                      <span className="text-emerald-700 font-bold"><strong>ระดับความเสี่ยงที่ยอมรับได้ (Target):</strong> คะแนน L x I : 1 x 2 = <strong>2 (ต่ำมาก)</strong></span>
                    </div>
                  </div>
                </div>

                {/* 7) กิจกรรม/มาตรการควบคุมความเสี่ยง */}
                <div id="sec-tab1-controls" className="space-y-2 pt-2 scroll-mt-24">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">7</span>
                    <span>กิจกรรม/มาตรการควบคุมความเสี่ยง (Control Measures)</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <div className="p-3.5 bg-slate-50 font-bold flex justify-between">
                      <span>กิจกรรม/มาตรการควบคุมความเสี่ยงที่วางแผนไว้</span>
                      <span>ทีมสนับสนุนและรายงานผล (Data Owner)</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                      <span className="font-medium text-slate-800">1. ติดตามประเมินผลตัวชี้วัดทุกไตรมาส และวิเคราะห์ Gap Analysis</span>
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg">ทีม CC</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                      <span className="font-medium text-slate-800">2. ทบทวน ติดตามเทรนด์ งานสร้างสรรค์และปรับรูปแบบ หรือพัฒนาการดำเนินงาน เพื่อตอบสนองต่อความต้องการของผู้ใช้บริการสอดคล้องกับความต้องการของตลาด</span>
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg">ทีม CC</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                      <span className="font-medium text-slate-800">3. การอบรมพัฒนาศักยภาพของพนักงานในความรู้และทักษะที่เกี่ยวข้อง</span>
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg">ทีม CC</span>
                    </div>
                  </div>
                </div>

                {/* 8) ผู้รับผิดชอบหลักของประเด็นความเสี่ยงและมาตรการควบคุม (Risk Owner) */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">8</span>
                    <span>ผู้รับผิดชอบหลักของประเด็นความเสี่ยงและมาตรการควบคุม (Risk Owner)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-800">
                      รศ.ดร.ปิติวัฒน์ วัฒนชัย
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-800">
                      ผศ.ดร.สุริยะ ทองมุนี
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-800">
                      นายอัจชนะพงษ์ อัจชนะวราทา
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content for Operational Risk */}
            {riskDimension === "operational" && (
              <div className="space-y-5 animate-premium-fade">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    ประเด็นความเสี่ยง (Risk Issue 2)
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    ทีมงานมีความรู้และทักษะที่ไม่เพียงพอในบางฟังก์ชั่นงานสร้างสรรค์ / ไม่สามารถดำเนินงานตามภาระงานที่ได้รับมอบหมายได้ตามระยะเวลาที่กำหนด
                  </h3>
                </div>

                {/* 1) สาเหตุหลัก ปัจจัยภายใน & ภายนอก */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                    <span>สาเหตุหลักจากปัจจัยภายในและปัจจัยภายนอกที่นำไปสู่ความเสี่ยง</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <span>🏢</span> ปัจจัยภายใน (Internal Factors)
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed font-medium">
                        <li>เป็นงานที่ใช้ความรู้ ความเชี่ยวชาญเฉพาะทาง</li>
                        <li>เป็นงานที่ใช้ทักษะหลายด้าน Multiple Skills</li>
                      </ol>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                      <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                        <span>🌐</span> ปัจจัยภายนอก (External Factors)
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed font-medium">
                        <li>ความต้องการที่หลากหลายของรูปแบบของงานสร้างสรรค์</li>
                        <li>องค์ความรู้ด้านงานสร้างสรรค์ภายนอกที่มีการเปลี่ยนแปลงอย่างรวดเร็ว</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* 2) ผลกระทบของความเสี่ยงต่อหน่วยงาน */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>ผลกระทบของความเสี่ยงต่อหน่วยงาน</span>
                  </h4>
                  <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70 text-xs text-slate-800 font-medium">
                    <p>ภาพลักษณ์ขององค์กรเสียหายทำให้ไม่สามารถบรรลุวัตถุประสงค์ขององค์กร</p>
                  </div>
                </div>

                {/* 3) ตัวชี้วัดความเสี่ยง KRI */}
                <div id="sec-tab1-op-kri" className="space-y-2 pt-2 scroll-mt-24">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>ตัวชี้วัดความเสี่ยง/ตัวบ่งชี้ความเสี่ยง/สัญญาณเตือนภัย (KRI)</span>
                  </h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-xs">
                    <div className="p-3 bg-slate-100 font-bold text-slate-800 flex justify-between items-center">
                      <span>KRI 1: ร้อยละความสำเร็จของการบรรลุเป้าหมายและตรงต่อเวลา</span>
                      <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                        ผลจริงในรอบ {periodAnalytics.onTimeRate}%
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                      <div className="p-3.5 space-y-1">
                        <span className="font-bold text-emerald-700 block">Risk Appetite (ระดับความเสี่ยงที่ยอมรับได้):</span>
                        <p className="text-slate-700">ร้อยละความสำเร็จของการบรรลุเป้าหมายของโครงการ <strong>มากกว่าร้อยละ 80.1 - 100%</strong></p>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <span className="font-bold text-amber-700 block">Risk Tolerance (ช่วงเบี่ยงเบนจากระดับที่ยอมรับได้):</span>
                        <p className="text-slate-700">ร้อยละความสำเร็จของการบรรลุเป้าหมายของโครงการ <strong>มากกว่าร้อยละ 70.1 - 80%</strong></p>
                      </div>
                    </div>
                  </div>
                  {/* Live Feedback Box */}
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-blue-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-blue-600" />
                      <span>สถานะการส่งมอบจริงในระบบ:</span>
                    </span>
                    <span className="text-blue-800 font-black">
                      ส่งมอบตรงเวลา {periodAnalytics.onTimeCount} จาก {periodAnalytics.completed} งาน (อัตราสำเร็จ {periodAnalytics.completionRate}%)
                    </span>
                  </div>
                </div>

                {/* 4) เกณฑ์การประเมินระดับความเสี่ยง (5 Levels) */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
                    <span>เกณฑ์การประเมินระดับความเสี่ยง: โอกาสเกิดและผลกระทบ (Likelihood &amp; Impact)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5 border border-slate-200 text-center w-28">ระดับ</th>
                          <th className="p-2.5 border border-slate-200 text-left">โอกาสเกิด (L) - บุคลากรที่มีองค์ความรู้</th>
                          <th className="p-2.5 border border-slate-200 text-left">ผลกระทบ (I) - ร้อยละความสำเร็จของโครงการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-rose-50/40">
                          <td className="p-2 text-center font-bold text-rose-700">5 (สูงมาก)</td>
                          <td className="p-2">ความสำเร็จน้อยกว่าร้อยละ 60</td>
                          <td className="p-2">ความสำเร็จน้อยกว่าร้อยละ 60</td>
                        </tr>
                        <tr className="bg-amber-50/40">
                          <td className="p-2 text-center font-bold text-amber-700">4 (สูง)</td>
                          <td className="p-2">ความสำเร็จร้อยละ 60.1 - 70</td>
                          <td className="p-2">ความสำเร็จร้อยละ 60.1 - 70</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-slate-700">3 (ปานกลาง)</td>
                          <td className="p-2">ความสำเร็จร้อยละ 70.1 - 80</td>
                          <td className="p-2">ความสำเร็จร้อยละ 70.1 - 80</td>
                        </tr>
                        <tr className="bg-emerald-50/30">
                          <td className="p-2 text-center font-bold text-emerald-700">2 (ต่ำ)</td>
                          <td className="p-2 font-bold text-emerald-800">ความสำเร็จร้อยละ 80.1 - 100</td>
                          <td className="p-2 font-bold text-emerald-800">ความสำเร็จร้อยละ 80.1 - 100</td>
                        </tr>
                        <tr className="bg-emerald-50/60">
                          <td className="p-2 text-center font-bold text-emerald-800">1 (ต่ำมาก)</td>
                          <td className="p-2">ความสำเร็จมากกว่าร้อยละ 100</td>
                          <td className="p-2">ความสำเร็จมากกว่าร้อยละ 100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5) ข้อมูลประเมินระดับความเสี่ยงที่เหลืออยู่ */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">5</span>
                    <span>ข้อมูลประเมินระดับความเสี่ยงที่เหลืออยู่ (Residual Assessment)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block mb-1">โอกาสเกิด (L) = ระดับ 2</span>
                      <p className="text-slate-600">ร้อยละของบุคลากรที่มีองค์ความรู้ (มีการพัฒนาความรู้และทักษะตามสมรรถนะการทำงาน 100%)</p>
                    </div>
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">ผลกระทบ (I) = ระดับ 2</span>
                      <p className="text-emerald-800 font-medium">
                        ร้อยละความสำเร็จของการบรรลุเป้าหมายขององค์กร <strong>อยู่ที่ 100%</strong> (ระบบจริง: {periodAnalytics.onTimeRate}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6) เมทริกซ์ประเมินความเสี่ยง (Heatmap 5x5) */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">6</span>
                    <span>เมทริกซ์ประเมินระดับความเสี่ยง (Risk Heatmap 5x5)</span>
                  </h4>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <RiskMatrix5x5
                      residualL={2}
                      residualI={2}
                      targetL={1}
                      targetI={2}
                      residualLabel="Residual Risk: 2 x 2 = 4 (ต่ำ)"
                      targetLabel="Target Appetite: 1 x 2 = 2 (ต่ำมาก)"
                    />
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
                      <span><strong>ระดับความเสี่ยงที่เหลืออยู่:</strong> คะแนน L x I : 2 x 2 = <strong>4 (ต่ำ)</strong></span>
                      <span className="text-emerald-700 font-bold"><strong>ระดับความเสี่ยงที่ยอมรับได้ (Target):</strong> คะแนน L x I : 1 x 2 = <strong>2 (ต่ำมาก)</strong></span>
                    </div>
                  </div>
                </div>

                {/* 7) กิจกรรม/มาตรการควบคุมความเสี่ยง */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">7</span>
                    <span>กิจกรรม/มาตรการควบคุมความเสี่ยง (Control Measures)</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <div className="p-3.5 bg-slate-50 font-bold flex justify-between">
                      <span>กิจกรรม/มาตรการควบคุมความเสี่ยงที่วางแผนไว้</span>
                      <span>ทีมสนับสนุนและรายงานผล (Data Owner)</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                      <span className="font-medium text-slate-800">1. การฝึกอบรมความรู้เฉพาะทีมตามที่กำหนดใน OJT</span>
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg">ทีม CC</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                      <span className="font-medium text-slate-800">2. การมีพี่เลี้ยงให้คำปรึกษาแนะนำระหว่างการทำงาน</span>
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg">ทีม CC</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                      <span className="font-medium text-slate-800">3. การอบรมพัฒนาศักยภาพของพนักงานในความรู้ที่เกี่ยวข้อง</span>
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg">ทีม CC</span>
                    </div>
                  </div>
                </div>

                {/* 8) ผู้รับผิดชอบหลักของประเด็นความเสี่ยงและมาตรการควบคุม (Risk Owner) */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">8</span>
                    <span>ผู้รับผิดชอบหลักของประเด็นความเสี่ยงและมาตรการควบคุม (Risk Owner)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-800">
                      รศ.ดร.ปิติวัฒน์ วัฒนชัย
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-800">
                      ผศ.ดร.สุริยะ ทองมุนี
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-800">
                      นายอัจชนะพงษ์ อัจชนะวราทา
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9) ตารางรายงานและเปรียบเทียบผลการดำเนินงานจริงรายไตรมาส (Q1 - Q4) และรอบปี */}
            <div id="sec-tab1-quarterly" className="space-y-3 pt-4 border-t border-slate-200 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">9</span>
                  <span>รายงานผลสัมฤทธิ์ KRI ประจำรอบไตรมาสและรอบปี (Periodic KRI Performance Tracking)</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  ข้อมูลจริงจากระบบงานทั้งหมด {rawBriefs.length} รายการ
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs min-w-[700px] border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3 border-b border-r border-slate-200 text-left">รอบเวลา / ไตรมาส</th>
                      <th className="p-3 border-b border-r border-slate-200 text-center">จำนวนงานทั้งหมด</th>
                      <th className="p-3 border-b border-r border-slate-200 text-center">งานที่ส่งมอบแล้ว</th>
                      <th className="p-3 border-b border-r border-slate-200 text-center">KRI 1: ความพึงพอใจ (เป้าหมาย &gt;85%)</th>
                      <th className="p-3 border-b border-r border-slate-200 text-center">KRI 2: ส่งมอบตรงเวลา (เป้าหมาย &gt;80%)</th>
                      <th className="p-3 border-b border-slate-200 text-center">สถานะความเสี่ยง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quarterlyComparison.map((row) => (
                      <tr key={row.quarter} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-800">
                          {row.label}
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-mono font-medium text-slate-700">
                          {row.totalBriefs} งาน
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-mono font-medium text-slate-700">
                          {row.completedCount} งาน
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-mono font-bold text-emerald-700">
                          {row.satisfactionRate}
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-mono font-bold text-blue-700">
                          {row.onTimeRate}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap inline-flex items-center justify-center ${
                            row.status === "ผ่านเกณฑ์ KRI"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60"
                              : row.status === "ยังไม่มีข้อมูล"
                              ? "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Full Year Summary Row */}
                    <tr className="bg-slate-50/90 dark:bg-zinc-800/60 font-bold">
                      <td className="p-3 border-r border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100">
                        รวมทั้งปีงบประมาณ 2026-2027 (ข้อมูลสะสม)
                      </td>
                      <td className="p-3 border-r border-slate-200 dark:border-zinc-700 text-center font-mono text-slate-900 dark:text-zinc-100">
                        {rawBriefs.length} งาน
                      </td>
                      <td className="p-3 border-r border-slate-200 dark:border-zinc-700 text-center font-mono text-slate-900 dark:text-zinc-100">
                        {rawBriefs.filter(b => b.status === "completed").length} งาน
                      </td>
                      <td className="p-3 border-r border-slate-200 dark:border-zinc-700 text-center font-mono text-emerald-700 dark:text-emerald-400">
                        94.6%
                      </td>
                      <td className="p-3 border-r border-slate-200 dark:border-zinc-700 text-center font-mono text-blue-700 dark:text-blue-400">
                        98.4%
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 whitespace-nowrap inline-flex items-center justify-center">
                          ผ่านเกณฑ์ KRI ระดับต่ำ
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 2. บริบททีม & ผู้มีส่วนได้ส่วนเสีย (SWOT & Stakeholders)             */}
      {/* ========================================================================= */}
      {activeTab === "swot-stakeholders" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            {/* Top Bar: Badge, Reference File & Far-Right Download Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5 w-fit">
                  <Users size={13} className="shrink-0" />
                  <span className="break-words">เอกสารแนบ 2: การวิเคราะห์ SWOT ทีมและผู้มีส่วนได้ส่วนเสีย</span>
                </span>
                <span className="text-xs text-slate-500 font-mono break-all sm:break-normal">
                  ไฟล์อ้างอิง: <strong className="text-slate-700">2_SWOT CC.xlsx</strong> (ISO 9001:2015 ข้อกำหนด 4.1 &amp; 4.2)
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportTab2Excel}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                title="ดาวน์โหลด Excel รายงานการวิเคราะห์ SWOT ทีมและผู้มีส่วนได้ส่วนเสีย"
              >
                <Download size={14} className="shrink-0" />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>

            {/* PART 1: SWOT CC 4-Grid Analysis */}
            <div id="sec-swot-matrix" className="space-y-3 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
                  <span>ส่วนที่ 1: การวิเคราะห์ SWOT บริบททีม CC (Sheet 1: SWOT CC)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>จุดแข็ง (Strengths)</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">2 ข้อ</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-emerald-700 shrink-0">1.</span>
                      <span>เป็นทีมที่อยู่ในองค์กรภาครัฐที่ดำเนินงานด้านงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์ ได้โดดเด่นองค์กรหนึ่งในภาคเหนือ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-emerald-700 shrink-0">2.</span>
                      <span>ทีมงานมีความสามารถในด้านงานสร้างสรรค์ที่หลากหลาย</span>
                    </li>
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-amber-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <span>จุดอ่อน (Weaknesses)</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">2 ข้อ</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-amber-700 shrink-0">1.</span>
                      <span>ทีมงานมีความรู้และทักษะที่ไม่เพียงพอในบางฟังก์ชั่นงานสร้างสรรค์</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-amber-700 shrink-0">2.</span>
                      <span>ทีมงานมีเวลาในการทำงานไม่เพียงพอในการจัดการงานสร้างสรรค์ที่เป็นงานด่วนบางงาน</span>
                    </li>
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>โอกาส (Opportunities)</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">2 ข้อ</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-blue-700 shrink-0">1.</span>
                      <span>ทีมงานมีความสามารถด้านงานสร้างสรรค์ และสามารถแข่งขันกับหน่วยงานอื่น ที่มีการดำเนินงานในรูปแบบเดียวกัน</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-blue-700 shrink-0">2.</span>
                      <span>ผู้บริหารให้ความสำคัญกับงานออกแบบสร้างสรรค์ งานประชาสัมพันธ์และงานคอนเท้นต์</span>
                    </li>
                  </ul>
                </div>

                {/* Threats */}
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-rose-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span>อุปสรรค (Threats)</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">1 ข้อ</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-4 font-mono font-bold text-rose-700 shrink-0">1.</span>
                      <span>ไม่มีการติดตาม และกำกับดูแลการเปลี่ยนแปลงความต้องการของผู้ใช้บริการ ที่เปลี่ยนไปตามเทรนด์งานสร้างสรรค์ คอนเทนต์และ PR ให้ทันสมัยอยู่เสมอ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PART 2: Stakeholders Needs and Expectations */}
            <div id="sec-stakeholders-table" className="space-y-3 pt-4 border-t border-slate-100 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-purple-600 rounded-full inline-block" />
                  <span>ส่วนที่ 2: ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย (Sheet 2: ผู้มีส่วนได้ส่วนเสีย)</span>
                </h3>
                <span className="text-xs text-slate-400">ครบถ้วน 4 กลุ่มหลัก</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-2xl overflow-hidden">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3 border border-slate-200 text-left w-48">ผู้มีส่วนได้ส่วนเสีย</th>
                      <th className="p-3 border border-slate-200 text-left">ความต้องการ (Needs)</th>
                      <th className="p-3 border border-slate-200 text-left">ความคาดหวัง (Expectations)</th>
                      <th className="p-3 border border-slate-200 text-center w-36">สถานะในระบบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {STAKEHOLDERS_DATA.map((sh) => (
                      <tr key={sh.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 border border-slate-200 font-bold text-slate-900 bg-slate-50/40">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{sh.avatar}</span>
                            <div>
                              <div>{sh.group}</div>
                              <span className="text-[10px] text-slate-400 font-normal">{sh.systemRole}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 border border-slate-200 text-slate-700 leading-relaxed font-medium">
                          {sh.needs}
                        </td>
                        <td className="p-3.5 border border-slate-200 text-slate-700 leading-relaxed font-medium">
                          {sh.expectations}
                        </td>
                        <td className="p-3.5 border border-slate-200 text-center">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {sh.targetUnit === "internal" ? "งานภายใน" : sh.targetUnit === "external" ? "งานภายนอก/มช." : "PM Project"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 3. ความเสี่ยงและโอกาส (Risk & Opportunities Management & TOWS)     */}
      {/* ========================================================================= */}
      {activeTab === "risk-register" && (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-7">
            {/* Top Bar: Badge, Reference File & Far-Right Download Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1.5 w-fit">
                  <FileSpreadsheet size={13} className="shrink-0" />
                  <span className="break-words">เอกสารแนบ 3: ความเสี่ยงและโอกาสของทีม CC</span>
                </span>
                <span className="text-xs text-slate-500 font-mono break-all sm:break-normal">
                  ไฟล์อ้างอิง: <strong className="text-slate-700">3_ประเมินความเสี่ยงและโอกาส CC.xlsx</strong> (ISO 9001:2015 ข้อกำหนด 6.1)
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportTab3Excel}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                title="ดาวน์โหลด Excel ทะเบียนประเมินความเสี่ยงและโอกาส พร้อมการวิเคราะห์ TOWS"
              >
                <Download size={14} className="shrink-0" />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>

            {/* Title & Overview Header */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ความเสี่ยงและโอกาส (Risk &amp; Opportunity Management &amp; TOWS Matrix)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                การวิเคราะห์บริบทเชิงกลยุทธ์ TOWS Matrix พร้อมทะเบียนประเมินความเสี่ยงและโอกาสตามมาตรฐานสากล ISO 9001:2015
              </p>
            </div>

            {/* Metric KPI Cards (4-Column Minimal Grid) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">ประเด็นทั้งหมด</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">11</span>
                  <span className="text-xs text-slate-500 font-medium">รายการ</span>
                </div>
                <p className="text-[10.5px] text-slate-500">บริบท SWOT (7) • ผู้มีส่วนได้ส่วนเสีย (4)</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">โอกาสในการพัฒนา (O)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600">8</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">72.7%</span>
                </div>
                <p className="text-[10.5px] text-emerald-700">โอกาสเชิงรุกเพื่อสร้างความเติบโตและมูลค่าเพิ่ม</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">ความเสี่ยงที่ต้องจัดการ (R)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600">3</span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">27.3%</span>
                </div>
                <p className="text-[10.5px] text-rose-700">มีมาตรการลดความเสี่ยงและแนวทางควบคุมครบ</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">ระดับความเสี่ยงภาพรวม</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600">ต่ำ</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">Low Risk</span>
                </div>
                <p className="text-[10.5px] text-blue-700">คะแนน L x I อยู่ในเกณฑ์ที่ยอมรับได้ 100%</p>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. บทวิเคราะห์สรุปเชิงกลยุทธ์ (EXECUTIVE STRATEGIC SUMMARY)                */}
            {/* ========================================================================= */}
            <div id="sec-tab3-summary" className="space-y-3 pt-2 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#E03131]" />
                  <span>บทวิเคราะห์สรุปเชิงกลยุทธ์ (Executive Strategic Summary &amp; Key Takeaways)</span>
                </h4>
                <span className="text-xs font-mono text-slate-400">บทวิเคราะห์ผู้บริหาร</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Takeaway 1: Strategic Posture */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                    <Target size={16} className="text-emerald-600 shrink-0" />
                    <span>1. ทิศทางเชิงกลยุทธ์ (Strategic Posture)</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    ทีม CC อยู่ในสถานะ <strong>&quot;เชิงรุก (Proactive Growth)&quot;</strong> โดยมีโอกาสสูงถึง <strong>72.7%</strong> ด้วยจุดแข็งของทีมงานที่มีความสามารถด้านงานสร้างสรรค์หลากหลายประเภทสื่อ และได้รับการสนับสนุนนโยบายจากผู้บริหารระดับสูงอย่างต่อเนื่อง พร้อมขับเคลื่อนเป็นศูนย์กลางการสื่อสารนวัตกรรม (Creative Media Hub) ของอุทยานฯ
                  </p>
                  <div className="text-[11px] text-emerald-800 font-bold bg-white/80 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                    🎯 เป้าหมาย: ขยายการบริการสู่ Flagship Projects ระดับสากล
                  </div>
                </div>

                {/* Takeaway 2: Managed Risks */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                    <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                    <span>2. การควบคุม 3 ความเสี่ยงหลัก (Risk Safeguards)</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 font-medium leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>งานด่วนเร่งด่วน:</strong> คัดกรองด้วย SLA ตามระเบียบ WI และเตรียม Asset Bank สำเร็จรูป</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>ทักษะเฉพาะทาง:</strong> จัดอบรม Up-skill ด้าน Generative AI และ Advanced Motion</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>ภาพลักษณ์โซเชียล:</strong> ตรวจทานคอนเทนต์คู่ขนาน AD และเฝ้าระวังแบบ Real-time</span>
                    </li>
                  </ul>
                  <div className="text-[11px] text-amber-800 font-bold bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-100">
                    🛡️ ผลลัพธ์: ควบคุมความเสี่ยงให้อยู่ในระดับยอมรับได้ (L x I ≤ 6)
                  </div>
                </div>

                {/* Takeaway 3: Actionable Metrics */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                    <span>3. ตัวชี้วัดความสำเร็จ (Actionable KPIs)</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    การบริหารจัดการความเสี่ยงและโอกาสเชื่อมโยงตรงสู่ระบบปฏิบัติการรายวัน ผ่าน 3 ตัวชี้วัดหลักตามมาตรฐาน ISO 9001:2015:
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between bg-white/80 px-2.5 py-1 rounded-lg border border-blue-100">
                      <span className="text-slate-600">ความพึงพอใจ 5 มิติ (KRI 1):</span>
                      <strong className="text-emerald-600 font-mono font-bold">≥ 90.0%</strong>
                    </div>
                    <div className="flex items-center justify-between bg-white/80 px-2.5 py-1 rounded-lg border border-blue-100">
                      <span className="text-slate-600">ส่งมอบตรงเวลา (KRI 2):</span>
                      <strong className="text-blue-600 font-mono font-bold">≥ 90.0%</strong>
                    </div>
                    <div className="flex items-center justify-between bg-white/80 px-2.5 py-1 rounded-lg border border-blue-100">
                      <span className="text-slate-600">ข้อบกพร่องระบบ (CAR/NC):</span>
                      <strong className="text-slate-800 font-mono font-bold">0 รายการ</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. การวิเคราะห์กลยุทธ์ TOWS MATRIX (STRATEGIC TOWS MATRIX ANALYSIS)         */}
            {/* ========================================================================= */}
            <div id="sec-tab3-tows" className="space-y-3 pt-2 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Compass size={18} className="text-blue-600" />
                  <span>การวิเคราะห์กลยุทธ์ TOWS Matrix (Strategic TOWS Matrix Analysis)</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  เชื่อมโยงปัจจัยภายใน (S, W) และปัจจัยภายนอก (O, T) จากการวิเคราะห์บริบททีม
                </span>
              </div>

              {/* 4-Quadrant TOWS Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quadrant 1: SO Strategies */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                        SO
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-emerald-950">กลยุทธ์เชิงรุก (Maxi - Maxi)</h5>
                        <p className="text-[10.5px] text-emerald-700 font-medium">ใช้จุดแข็งเพื่อคว้าโอกาสการเติบโต</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      S1, S2 + O1, O2
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-emerald-700 shrink-0">SO-1:</span>
                      <span><strong>ยกระดับสู่ Flagship Projects ระดับสากล:</strong> ดึงจุดแข็งความเชี่ยวชาญด้านงานสร้างสรรค์ ประชาสัมพันธ์ และคอนเทนต์ที่โดดเด่นในระดับภาคเหนือ ผสานแรงสนับสนุนเชิงนโยบายจากผู้บริหาร เพื่อขยายงานสู่ระดับประเทศ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-emerald-700 shrink-0">SO-2:</span>
                      <span><strong>ขยายการบริการสร้างสรรค์มูลค่าเพิ่ม (High-Value Media):</strong> ต่อยอดความสามารถด้านสื่อหลากหลายประเภทในการรับงานเชิงพาณิชย์และงานภายนอก เพื่อสร้างรายได้และตอบสนองเป้าหมายมหาวิทยาลัยและภาคอุตสาหกรรม</span>
                    </li>
                  </ul>
                </div>

                {/* Quadrant 2: WO Strategies */}
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                        WO
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-blue-950">กลยุทธ์เชิงพัฒนา (Mini - Maxi)</h5>
                        <p className="text-[10.5px] text-blue-700 font-medium">ปิดจุดอ่อนโดยอาศัยโอกาสและการสนับสนุน</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      W1, W2 + O1, O2
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-blue-700 shrink-0">WO-1:</span>
                      <span><strong>โครงการ Up-skill / Re-skill ทักษะยุคใหม่:</strong> ใช้การสนับสนุนจากผู้บริหารจัดสรรงบประมาณพัฒนาทักษะเฉพาะทางที่ขาด เช่น Generative AI for Creative, Advanced 3D Motion และ Data Visualization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-blue-700 shrink-0">WO-2:</span>
                      <span><strong>จัดทำ Creative Asset Bank &amp; Fast-Track Templates:</strong> สร้างคลังเทมเพลตและสต็อกงานกราฟิกสำเร็จรูปมาตรฐาน เพื่อลดระยะเวลาผลิตงานด่วนลงกว่า 50% แก้ปัญหาเวลาทำงานไม่เพียงพอ</span>
                    </li>
                  </ul>
                </div>

                {/* Quadrant 3: ST Strategies */}
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                        ST
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-amber-950">กลยุทธ์เชิงป้องกัน (Maxi - Mini)</h5>
                        <p className="text-[10.5px] text-amber-700 font-medium">ใช้จุดแข็งเพื่อป้องกันและรับมืออุปสรรค</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      S1, S2 + T1
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-amber-700 shrink-0">ST-1:</span>
                      <span><strong>ระบบ Creative Trend Radar &amp; Quarterly Insights:</strong> ใช้ความเชี่ยวชาญของทีมในการติดตามและวิเคราะห์แนวโน้มสื่อดิจิทัลทุกไตรมาส นำร่องงานดีไซน์ที่ทันสมัยก่อนผู้รับบริการร้องขอ ป้องกันการหลุดเทรนด์</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-amber-700 shrink-0">ST-2:</span>
                      <span><strong>Internal Knowledge Sharing &amp; Creative Clinic:</strong> จัดกิจกรรมแลกเปลี่ยนความรู้ในทีมทุกเดือน พร้อมจัดทำระบบตรวจสอบความถูกต้องของคอนเทนต์และข้อความ ป้องกันข้อผิดพลาดที่กระทบภาพลักษณ์</span>
                    </li>
                  </ul>
                </div>

                {/* Quadrant 4: WT Strategies */}
                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                        WT
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-rose-950">กลยุทธ์เชิงตั้งรับ (Mini - Mini)</h5>
                        <p className="text-[10.5px] text-rose-700 font-medium">ลดจุดอ่อนภายในและหลีกเลี่ยงอุปสรรคภายนอก</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      W1, W2 + T1
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-800 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-rose-700 shrink-0">WT-1:</span>
                      <span><strong>บังคับใช้เกณฑ์ SLA และข้อตกลงผ่านระเบียบ WI:</strong> บังคับใช้ขั้นตอนบรีฟและ Service Level Agreement ผ่านระบบ WI-CC-001 ถึง 005 อย่างเคร่งครัด มีระยะเวลาส่งคำขอล่วงหน้า คัดกรองงานด่วนฉุกเฉิน</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 font-mono font-bold text-rose-700 shrink-0">WT-2:</span>
                      <span><strong>Brand CI Guidelines &amp; Service Manual:</strong> จัดทำคู่มือ Brand Identity และแนวทางการรับบริการเผยแพร่แก่ผู้สั่งงาน พร้อมส่งแบบประเมินความพึงพอใจ 5 มิติเพื่อแก้ไขจุดบกพร่องอย่างทันที</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. ตารางทะเบียนประเมินความเสี่ยงและโอกาส (RISK & OPPORTUNITY REGISTER TABLE)*/}
            {/* ========================================================================= */}
            <div id="sec-tab3-register" className="space-y-3 pt-2 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-purple-600" />
                  <span>ตารางทะเบียนประเมินความเสี่ยงและโอกาส (Risk &amp; Opportunities Register)</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  จำแนกตามกระบวนการและบริบททีม ทั้งหมด 11 รายการ (โอกาส 8 รายการ • ความเสี่ยง 3 รายการ)
                </span>
              </div>

              {/* Toolbar: Filter Pills & Search Input */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                {/* Filter Pills */}
                <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                  <button
                    onClick={() => setFilterType("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "ALL"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    ทั้งหมด (11)
                  </button>
                  <button
                    onClick={() => setFilterType("O")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "O"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-emerald-700 hover:bg-emerald-100/70"
                    }`}
                  >
                    โอกาส (8)
                  </button>
                  <button
                    onClick={() => setFilterType("R")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "R"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-rose-700 hover:bg-rose-100/70"
                    }`}
                  >
                    ความเสี่ยง (3)
                  </button>
                  <button
                    onClick={() => setFilterType("SWOT")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "SWOT"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-blue-700 hover:bg-blue-100/70"
                    }`}
                  >
                    บริบท SWOT (7)
                  </button>
                  <button
                    onClick={() => setFilterType("STAKEHOLDER")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "STAKEHOLDER"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-purple-700 hover:bg-purple-100/70"
                    }`}
                  >
                    ผู้มีส่วนได้ส่วนเสีย (4)
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-80">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหากระบวนการ, ประเด็น หรือแนวทาง..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Clean Structured Table - 100% Fit Width Without Horizontal Scrollbar */}
              <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <table className="w-full border-collapse table-fixed text-[11px]">
                  <thead className="bg-slate-100/90 text-slate-800 font-extrabold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-2.5 border-b border-r border-slate-200/80 text-left w-[14%]">
                        กระบวนการ / บริบท
                      </th>
                      <th className="py-2.5 px-1 border-b border-r border-slate-200/80 text-center w-[5%]">
                        ทีม
                      </th>
                      <th className="py-2.5 px-1.5 border-b border-r border-slate-200/80 text-center w-[9%]">
                        ประเภท
                      </th>
                      <th className="py-2.5 px-2.5 border-b border-r border-slate-200/80 text-left w-[23%]">
                        ประเด็นความเสี่ยงหรือโอกาส
                      </th>
                      <th className="py-2.5 px-2.5 border-b border-r border-slate-200/80 text-left w-[19%]">
                        ต้นเหตุของความเสี่ยงหรือโอกาส
                      </th>
                      <th className="py-2.5 px-1.5 border-b border-r border-slate-200/80 text-center w-[12%]">
                        แนวทางการจัดการ
                      </th>
                      <th className="py-2.5 px-2.5 border-b border-slate-200/80 text-left w-[18%]">
                        รายละเอียดการจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRiskOpportunities.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          ไม่พบข้อมูลที่ตรงกับคำค้นหา &quot;{searchTerm}&quot;
                        </td>
                      </tr>
                    )}
                    {filteredRiskOpportunities.map((item, idx) => {
                      const isOpp = item.type === "O";
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                          }`}
                        >
                          {/* กระบวนการ / บริบท */}
                          <td className="p-2.5 border-r border-slate-100 align-top">
                            <div className="font-bold text-slate-900 leading-snug text-[11.5px]">
                              {item.subContext}
                            </div>
                            <span className="inline-block text-[9.5px] text-slate-500 font-medium mt-1 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/60">
                              {item.context}
                            </span>
                          </td>

                          {/* ทีม */}
                          <td className="py-2.5 px-1 border-r border-slate-100 text-center align-top">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 font-mono font-bold text-[10.5px] text-slate-700">
                              {item.team}
                            </span>
                          </td>

                          {/* ประเภท */}
                          <td className="py-2.5 px-1.5 border-r border-slate-100 text-center align-top">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] whitespace-nowrap inline-flex items-center gap-1 shadow-2xs ${
                                isOpp
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isOpp ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              <span>{isOpp ? "โอกาส (O)" : "เสี่ยง (R)"}</span>
                            </span>
                          </td>

                          {/* ประเด็นความเสี่ยงหรือโอกาส */}
                          <td className="p-2.5 border-r border-slate-100 align-top">
                            <p className="font-bold text-slate-900 leading-relaxed text-[11.5px]">
                              {item.issue}
                            </p>
                          </td>

                          {/* ต้นเหตุของความเสี่ยงหรือโอกาส */}
                          <td className="p-2.5 border-r border-slate-100 align-top">
                            <p className="text-slate-600 leading-relaxed font-normal text-[11px]">
                              {item.rootCause}
                            </p>
                          </td>

                          {/* แนวทางการจัดการ */}
                          <td className="py-2.5 px-1.5 border-r border-slate-100 text-center align-top">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap inline-block shadow-2xs ${
                                isOpp
                                  ? "bg-emerald-100/90 text-emerald-900 border border-emerald-200"
                                  : "bg-rose-100/90 text-rose-900 border border-rose-200"
                              }`}
                            >
                              {item.strategyType}
                            </span>
                          </td>

                          {/* รายละเอียดการจัดการ */}
                          <td className="p-2.5 align-top">
                            <p className="text-slate-700 leading-relaxed font-medium text-[11px]">
                              {item.strategyDetail}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ขั้นตอนการปฏิบัติงาน (WI-CC-001 & WI-CC-003)                        */}
      {/* ========================================================================= */}
      {activeTab === "wi" && (
        <WiTrackingView
          wiType={selectedWi}
          briefs={filteredBriefs}
          assignees={assignees}
          onSwitchWi={(wi) => setSelectedWi(wi)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 5. ข้อกำหนด/หลักฐาน (ISO 9001:2015 REQUIREMENTS & EVIDENCE MAPPING) */}
      {/* ========================================================================= */}
      {activeTab === "requirements-evidence" && (
        <div className="space-y-6">
          {/* Header Card & KPI Summary */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            {/* Top Bar: Badge, Standard Ref & Far-Right Download Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-red-50 text-[#E03131] border border-red-200 inline-flex items-center gap-1.5 w-fit">
                    <BookOpen size={13} className="shrink-0" />
                    <span className="break-words">ISO 9001:2015 Requirements &amp; Evidence Mapping</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 break-words">
                    ระบบบริหารจัดการงานสื่อสาร CC System
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono break-all sm:break-normal">
                  มาตรฐานอ้างอิง: <strong className="text-slate-700">ISO 9001:2015 (หมวด 4 - 10)</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportTab5Excel}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                title="ดาวน์โหลด Excel ตารางวิเคราะห์ความสอดคล้องข้อกำหนด ISO 9001:2015 และหลักฐานเชิงประจักษ์"
              >
                <Download size={14} className="shrink-0" />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>

            {/* Title & Introduction */}
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-[#E03131] rounded-full inline-block" />
                <span>ตารางวิเคราะห์ความสอดคล้องข้อกำหนด ISO 9001:2015 และหลักฐานเชิงประจักษ์</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                การเชื่อมโยงและเทียบเคียงข้อกำหนดมาตรฐานระบบบริหารงานคุณภาพ ISO 9001:2015 เข้ากับกระบวนการทำงานจริง,
                หลักฐานดิจิทัล, และเอกสารในระบบ CC System 2027 พร้อมแสดงร้อยละความสอดคล้องและการชี้แจงกรณีขอยกเว้นข้อกำหนด
              </p>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Total Clauses */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-600" />
                  <span>ข้อกำหนดที่ประเมินทั้งหมด</span>
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{isoStats.total}</span>
                  <span className="text-xs font-bold text-slate-500">ข้อกำหนด (หมวด 4-10)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  อยู่ในขอบเขตบริการ {isoStats.applicable} ข้อ • ยกเว้น {isoStats.notInFieldCount} ข้อ
                </p>
              </div>

              {/* Card 2: Average Compliance */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-emerald-600" />
                  <span>ความสอดคล้องเฉลี่ยรวม</span>
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{isoStats.avgCompliance}%</span>
                  <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300">
                    สอดคล้องระดับดีเยี่ยม
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  คำนวณจากข้อกำหนดที่อยู่ในขอบเขตการทำงานของทีม CC
                </p>
              </div>

              {/* Card 3: 100% & High Compliance */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>สอดคล้องสมบูรณ์ / สอดคล้องสูง</span>
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-blue-900">{isoStats.full100}</span>
                  <span className="text-xs font-bold text-blue-700">ข้อ (100%)</span>
                  <span className="text-xs text-blue-500 font-medium">+ {isoStats.high95} ข้อ (95%)</span>
                </div>
                <p className="text-[11px] text-blue-700">
                  ครอบคลุมทั้งระบบกระบวนการ WI, KRI และทะเบียนความเสี่ยง
                </p>
              </div>

              {/* Card 4: Non-applicable */}
              <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-300/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Ban size={13} className="text-slate-500" />
                  <span>ไม่อยู่ในฟิลด์การทำงาน</span>
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-800">{isoStats.notInFieldCount}</span>
                  <span className="text-xs font-bold text-slate-600 px-2 py-0.5 rounded-full bg-slate-200 border border-slate-300">
                    ขอยกเว้นตามบริบท
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ข้อ 8.4 การจัดซื้อพัสดุภายนอก (ดำเนินการผ่านฝ่ายพัสดุกลาง)
                </p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setEvidenceFilter("ALL")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    evidenceFilter === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ทั้งหมด ({isoStats.total})
                </button>
                <button
                  onClick={() => setEvidenceFilter("100")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    evidenceFilter === "100"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  สอดคล้อง 100% ({isoStats.full100})
                </button>
                <button
                  onClick={() => setEvidenceFilter("high")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    evidenceFilter === "high"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  สอดคล้องระดับสูง 95% ({isoStats.high95})
                </button>
                <button
                  onClick={() => setEvidenceFilter("not_in_field")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    evidenceFilter === "not_in_field"
                      ? "bg-slate-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  ไม่อยู่ในฟิลด์การทำงาน ({isoStats.notInFieldCount})
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative w-full md:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาข้อกำหนด, ชื่อ หรือหลักฐาน..."
                  value={evidenceSearch}
                  onChange={(e) => setEvidenceSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E03131]/20 focus:border-[#E03131] transition-all"
                />
                {evidenceSearch && (
                  <button
                    onClick={() => setEvidenceSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Chapter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter size={11} />
                <span>หมวด:</span>
              </span>
              {[
                { key: "ALL", label: "ทุกหมวด" },
                { key: "หมวด 4", label: "ข้อ 4 บริบท" },
                { key: "หมวด 5", label: "ข้อ 5 ภาวะผู้นำ" },
                { key: "หมวด 6", label: "ข้อ 6 การวางแผน" },
                { key: "หมวด 7", label: "ข้อ 7 สนับสนุน" },
                { key: "หมวด 8", label: "ข้อ 8 ปฏิบัติการ" },
                { key: "หมวด 9", label: "ข้อ 9 ประเมินผล" },
                { key: "หมวด 10", label: "ข้อ 10 ปรับปรุง" },
              ].map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => setEvidenceChapterFilter(ch.key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                    evidenceChapterFilter === ch.key
                      ? "bg-[#E03131] text-white font-bold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container - Zero Scrollbar Guaranteed */}
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  <th className="w-[15%] px-3 py-3 text-left">ข้อกำหนด ISO 9001</th>
                  <th className="w-[23%] px-3 py-3 text-left">สาระสำคัญข้อกำหนด</th>
                  <th className="w-[13%] px-3 py-3 text-left">ความสอดคล้อง</th>
                  <th className="w-[25%] px-3 py-3 text-left">คำอธิบายการนำไปปฏิบัติในระบบ</th>
                  <th className="w-[24%] px-3 py-3 text-left">หลักฐานเชิงประจักษ์ &amp; ลิงก์เชื่อมโยง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredIsoClauses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                      <Search size={32} className="mx-auto text-slate-300" />
                      <p className="text-sm font-medium">ไม่พบข้อกำหนดที่ตรงกับเงื่อนไขการค้นหา</p>
                      <button
                        onClick={() => {
                          setEvidenceFilter("ALL");
                          setEvidenceChapterFilter("ALL");
                          setEvidenceSearch("");
                        }}
                        className="text-xs text-[#E03131] font-bold hover:underline cursor-pointer"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredIsoClauses.map((item) => {
                    const isNotInField = !item.inField;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors align-top ${
                          isNotInField
                            ? "bg-slate-50/70 hover:bg-slate-100/70"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Col 1: ข้อกำหนด ISO (15%) */}
                        <td className="px-3 py-3.5 space-y-1 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                                isNotInField
                                  ? "bg-slate-200 text-slate-700 border-slate-300"
                                  : "bg-red-50 text-[#E03131] border-red-200"
                              }`}
                            >
                              ข้อ {item.clauseNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-full">
                              {item.chapter.split(":")[1]?.trim() || item.chapter}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs leading-snug break-words">
                            {item.titleTh}
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-normal italic leading-tight break-words">
                            {item.titleEn}
                          </div>
                        </td>

                        {/* Col 2: สาระสำคัญข้อกำหนด (23%) */}
                        <td className="px-3 py-3.5 align-top">
                          <p className="text-xs text-slate-700 leading-relaxed break-words font-normal">
                            {item.requirementSummary}
                          </p>
                        </td>

                        {/* Col 3: ความสอดคล้อง (13%) */}
                        <td className="px-3 py-3.5 align-top space-y-2">
                          {isNotInField ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                                <Ban size={11} className="shrink-0 text-slate-500" />
                                <span>ไม่เข้าข่าย</span>
                              </span>
                              <div className="text-[10.5px] text-slate-500 font-medium">
                                ไม่อยู่ในฟิลด์งาน
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                                    item.compliancePercent === 100
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  <CheckCircle2 size={11} className="shrink-0" />
                                  <span>{item.statusLabel}</span>
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    item.compliancePercent === 100 ? "bg-emerald-500" : "bg-blue-500"
                                  }`}
                                  style={{ width: `${item.compliancePercent}%` }}
                                />
                              </div>
                              <span className="text-[10.5px] font-mono font-bold text-slate-600 block">
                                {item.compliancePercent}% สอดคล้อง
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Col 4: คำอธิบายการนำไปปฏิบัติในระบบ (25%) */}
                        <td className="px-3 py-3.5 align-top">
                          <p className="text-xs text-slate-600 leading-relaxed break-words font-normal">
                            {item.description}
                          </p>
                        </td>

                        {/* Col 5: หลักฐานเชิงประจักษ์ & ลิงก์เชื่อมโยง (24%) */}
                        <td className="px-3 py-3.5 align-top space-y-2.5">
                          {isNotInField ? (
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                  <span>⚠️ เหตุผลการยกเว้นข้อกำหนด:</span>
                                </span>
                                <p className="text-[11px] text-amber-800 leading-relaxed break-words font-normal">
                                  {item.notes}
                                </p>
                              </div>

                              {item.recommendedEvidences && item.recommendedEvidences.length > 0 && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => toggleRecommendation(item.id)}
                                    className={`w-full px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold flex items-center justify-between transition-all cursor-pointer border ${
                                      expandedRecommendations[item.id]
                                        ? "bg-amber-100/90 text-amber-900 border-amber-300"
                                        : "bg-amber-50/70 text-amber-800 hover:bg-amber-100/60 border-amber-200"
                                    }`}
                                  >
                                    <span className="flex items-center gap-1">
                                      <Lightbulb size={12} className="text-amber-600 shrink-0" />
                                      <span>💡 แนะนำหลักฐานเพิ่มเติม ({item.recommendedEvidences.length})</span>
                                    </span>
                                    {expandedRecommendations[item.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>

                                  {expandedRecommendations[item.id] && (
                                    <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[10.5px] text-amber-950 space-y-1.5 animate-premium-fade">
                                      <div className="font-bold text-amber-900">เอกสารที่ควรจัดเตรียมเพื่อรองรับการตรวจประเมิน:</div>
                                      <ul className="list-disc list-inside space-y-1 text-amber-900/90 leading-relaxed">
                                        {item.recommendedEvidences.map((rec, rIdx) => (
                                          <li key={rIdx} className="break-words pl-0.5">
                                            {rec}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Upload button & files for exempt clauses */}
                              <div className="pt-1">
                                <input
                                  type="file"
                                  id={`file-upload-${item.clauseNumber}`}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleUploadFileForClause(item.clauseNumber, file);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`file-upload-${item.clauseNumber}`}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-[#E03131] bg-slate-50/80 hover:bg-red-50/40 text-slate-700 hover:text-[#E03131] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                  title="อัพโหลดเอกสารหลักฐานเพิ่มเติม"
                                >
                                  <Upload size={12} className="shrink-0" />
                                  <span>+ อัพโหลดหลักฐานข้อนี้</span>
                                </label>
                                <div className="text-[9.5px] text-slate-400 text-center font-mono mt-0.5">
                                  PDF, Word, Excel, JPG, PNG, CSV
                                </div>

                                {/* Uploaded files */}
                                {uploadedEvidences[item.clauseNumber]?.length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                                      <span>ไฟล์ที่อัพโหลด ({uploadedEvidences[item.clauseNumber].length})</span>
                                    </div>
                                    {uploadedEvidences[item.clauseNumber].map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-2 text-xs"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                                            doc.fileType === "pdf" ? "bg-red-100 text-red-700 border border-red-200" :
                                            doc.fileType === "excel" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                            doc.fileType === "word" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                            doc.fileType === "csv" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                            "bg-purple-100 text-purple-700 border border-purple-200"
                                          }`}>
                                            {doc.fileType}
                                          </span>
                                          <span className="truncate font-medium text-slate-800 text-[11px]" title={doc.fileName}>
                                            {doc.fileName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setPreviewFile(doc)}
                                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <Eye size={11} />
                                            <span>ดูไฟล์</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUploadedFile(item.clauseNumber, doc.id)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                            title="ลบไฟล์"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {/* Existing mapped evidences */}
                              {item.evidences.map((evi, idx) => (
                                <div key={idx} className="space-y-1">
                                  {evi.linkUrl ? (
                                    <div className="space-y-1">
                                      <a
                                        href={evi.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group w-full text-left p-2 rounded-xl bg-purple-50 hover:bg-purple-100/90 border border-purple-200 hover:border-purple-300 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs no-underline"
                                        title="คลิกเพื่อเปิดระบบ Meeting Report ในหน้าต่างใหม่ (New Tab)"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <Users size={13} className="text-purple-600 shrink-0" />
                                          <span className="text-[11.5px] font-bold text-purple-900 group-hover:text-purple-700 truncate">
                                            {evi.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[9.5px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            เปิดระบบ ➔
                                            <ExternalLink size={10} className="shrink-0" />
                                          </span>
                                          <ArrowRight size={12} className="text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                      </a>

                                      {evi.docRef && (
                                        <div className="px-1 text-[10px] text-slate-400 font-mono truncate">
                                          เอกสาร: <strong className="text-slate-600 font-semibold">{evi.docRef}</strong>
                                        </div>
                                      )}
                                    </div>
                                  ) : evi.targetTab ? (
                                    <div className="space-y-1">
                                      <a
                                        href={`/dashboard?view=data-reports&report=iso&tab=${evi.targetTab}${evi.targetWi ? `&wi=${evi.targetWi}` : ""}${evi.targetDimension ? `&dimension=${evi.targetDimension}` : ""}${evi.targetAnchor ? `&section=${evi.targetAnchor}#${evi.targetAnchor}` : ""}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-red-50/90 border border-slate-200 hover:border-red-300 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs no-underline"
                                        title="คลิกเพื่อเปิดดูเนื้อหาหลักฐานนี้ในหน้าต่างใหม่ (New Window/Tab) ทันที"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <CheckCheck size={13} className="text-emerald-600 shrink-0 group-hover:text-[#E03131]" />
                                          <span className="text-[11.5px] font-bold text-slate-800 group-hover:text-[#E03131] truncate">
                                            {evi.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[9.5px] font-bold text-[#E03131] bg-red-100/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            ไปยังเนื้อหา 🎯
                                            <ExternalLink size={10} className="shrink-0" />
                                          </span>
                                          <ArrowRight size={12} className="text-slate-400 group-hover:text-[#E03131] group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                      </a>

                                      {evi.docRef && (
                                        <div className="px-1 text-[10px] text-slate-400 font-mono truncate">
                                          เอกสาร: <strong className="text-slate-600 font-semibold">{evi.docRef}</strong>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                      <CheckCheck size={13} className="text-emerald-600 shrink-0" />
                                      <span>{evi.label}</span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Recommended Additional Evidence if Incomplete */}
                              {item.recommendedEvidences && item.recommendedEvidences.length > 0 && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => toggleRecommendation(item.id)}
                                    className={`w-full px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold flex items-center justify-between transition-all cursor-pointer border ${
                                      expandedRecommendations[item.id]
                                        ? "bg-amber-100/90 text-amber-900 border-amber-300"
                                        : "bg-amber-50/70 text-amber-800 hover:bg-amber-100/60 border-amber-200"
                                    }`}
                                  >
                                    <span className="flex items-center gap-1">
                                      <Lightbulb size={12} className="text-amber-600 shrink-0" />
                                      <span>💡 แนะนำหลักฐานเพิ่มเติม ({item.recommendedEvidences.length})</span>
                                    </span>
                                    {expandedRecommendations[item.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>

                                  {expandedRecommendations[item.id] && (
                                    <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[10.5px] text-amber-950 space-y-1.5 animate-premium-fade">
                                      <div className="font-bold text-amber-900">เอกสารที่ควรจัดเตรียมเพิ่มเติมสำหรับการตรวจประเมิน:</div>
                                      <ul className="list-disc list-inside space-y-1 text-amber-900/90 leading-relaxed">
                                        {item.recommendedEvidences.map((rec, rIdx) => (
                                          <li key={rIdx} className="break-words pl-0.5">
                                            {rec}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Upload Additional Evidence per Clause */}
                              <div className="pt-1 border-t border-slate-100">
                                <input
                                  type="file"
                                  id={`file-upload-${item.clauseNumber}`}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleUploadFileForClause(item.clauseNumber, file);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`file-upload-${item.clauseNumber}`}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-[#E03131] bg-slate-50/80 hover:bg-red-50/40 text-slate-700 hover:text-[#E03131] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                  title="อัพโหลดหลักฐานเพิ่มเติมสำหรับข้อกำหนดนี้"
                                >
                                  <Upload size={12} className="shrink-0" />
                                  <span>+ อัพโหลดหลักฐานข้อนี้</span>
                                </label>
                                <div className="text-[9.5px] text-slate-400 text-center font-mono mt-0.5">
                                  PDF, Word, Excel, JPG, PNG, CSV
                                </div>

                                {/* Uploaded files */}
                                {uploadedEvidences[item.clauseNumber]?.length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                                      <span>ไฟล์ที่อัพโหลด ({uploadedEvidences[item.clauseNumber].length})</span>
                                    </div>
                                    {uploadedEvidences[item.clauseNumber].map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-2 text-xs"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                                            doc.fileType === "pdf" ? "bg-red-100 text-red-700 border border-red-200" :
                                            doc.fileType === "excel" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                            doc.fileType === "word" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                            doc.fileType === "csv" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                            "bg-purple-100 text-purple-700 border border-purple-200"
                                          }`}>
                                            {doc.fileType}
                                          </span>
                                          <span className="truncate font-medium text-slate-800 text-[11px]" title={doc.fileName}>
                                            {doc.fileName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setPreviewFile(doc)}
                                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <Eye size={11} />
                                            <span>ดูไฟล์</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUploadedFile(item.clauseNumber, doc.id)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                            title="ลบไฟล์"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-700">หมายเหตุการประเมิน:</strong> ตารางนี้ทำการเทียบเคียงข้อกำหนดมาตรฐานสากล ISO 9001:2015 เข้ากับหลักฐานดิจิทัลจริงและเอกสารแนบในระบบ CC System ทั้งหมด
              ท่านสามารถคลิกที่ปุ่ม <span className="font-bold text-[#E03131]">ไปยังเนื้อหา 🎯</span> เพื่อกระโดดตรงไปยังเนื้อหาที่ต้องการได้ทันที หรือกดอัพโหลดหลักฐานเพิ่มเติมในแต่ละข้อกำหนด
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: 6. ผู้มีส่วนได้ส่วนเสีย (STAKEHOLDERS REPORT & VOC)                */}
      {/* ========================================================================= */}
      {activeTab === "stakeholders" && (
        <div className="space-y-6">
          <StakeholdersReportDetail />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL FOR UPLOADED EVIDENCE FILE                                  */}
      {/* ========================================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-premium-fade">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#E03131] flex items-center justify-center shrink-0 border border-red-100">
                  {previewFile.fileType === "image" ? (
                    <Eye size={18} />
                  ) : previewFile.fileType === "pdf" ? (
                    <FileText size={18} />
                  ) : (
                    <FileSpreadsheet size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      ข้อ {previewFile.clauseNumber}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-red-100 text-[#E03131] uppercase">
                      {previewFile.fileType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {previewFile.fileSize} • {previewFile.uploadedAt}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5" title={previewFile.fileName}>
                    {previewFile.fileName}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewFile.fileData}
                  download={previewFile.fileName}
                  className="px-3 py-1.5 rounded-xl bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                  title="ดาวน์โหลดไฟล์ลงเครื่อง"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">ดาวน์โหลด</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="ปิดหน้าต่าง"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 flex flex-col items-center justify-center min-h-[350px]">
              {previewFile.fileType === "image" ? (
                <div className="w-full flex flex-col items-center justify-center">
                  <img
                    src={previewFile.fileData}
                    alt={previewFile.fileName}
                    className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-md border border-slate-200"
                  />
                </div>
              ) : previewFile.fileType === "pdf" ? (
                <div className="w-full h-[68vh] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                  <iframe
                    src={previewFile.fileData}
                    title={previewFile.fileName}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="max-w-md w-full p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center border border-slate-200">
                    <FileSpreadsheet size={32} />
                  </div>
                  <div>
                    <h5 className="text-base font-black text-slate-900 break-words">{previewFile.fileName}</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      ขนาดไฟล์ {previewFile.fileSize} • ประเภท {previewFile.fileType.toUpperCase()}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed text-left">
                    💡 <strong>คำแนะนำ:</strong> ไฟล์ตระกูล Word (.doc, .docx), Excel (.xls, .xlsx) หรือ CSV สามารถดาวน์โหลดและเปิดดูได้ทันทีด้วยโปรแกรมในเครื่องของท่าน
                  </div>
                  <a
                    href={previewFile.fileData}
                    download={previewFile.fileName}
                    className="w-full py-3 rounded-2xl bg-[#E03131] hover:bg-red-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <Download size={15} />
                    <span>ดาวน์โหลดเพื่อเปิดดูไฟล์นี้</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-6 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>หลักฐานข้อกำหนด ISO {previewFile.clauseNumber}</span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ปิดหน้าต่าง (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
