"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
  Users,
  Sparkles,
  Calendar,
  FileText,
  Clock,
  Search,
  Filter,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  UserCheck,
  MapPin,
  Send,
  Plus
} from "lucide-react";

// =========================================================================
// TYPES & DATA FOR TAB 5: EXECUTIVE MEETINGS & MANAGEMENT REVIEW
// =========================================================================

export interface MonthlyExecutiveMeeting {
  id: string;
  meetingNo: string; // e.g. "ครั้งที่ 3/2569"
  monthName: string; // e.g. "มีนาคม 2569"
  monthKey: string; // e.g. "2026-03"
  date: string;
  time: string;
  location: string;
  chair: string; // ประธาน (ผศ.ดร.สุริยะ ทองมุณี)
  recorder: string; // ผู้จดบันทึก
  attendees: string[];
  kpiHighlight: {
    producedCount: number;
    onTimeRate: string;
    csatScore: string;
  };
  agendas: {
    agendaNo: number;
    title: string;
    detail: string;
    directiveFromExecutive: string; // ข้อสั่งการ/นโยบายจาก ผศ.ดร.สุริยะ
  }[];
  actionItems: {
    id: string;
    task: string;
    assignee: string;
    deadline: string;
    status: "completed" | "in_progress";
    statusLabel: string;
  }[];
}

export interface MrmAgendaItem {
  agendaNumber: number;
  title: string;
  isoClause: string;
  summary: string;
  meetingResolution: string;
  responsiblePerson: string;
  deadline: string;
  status: "completed" | "ongoing";
}

export interface InternalAuditFinding {
  id: string;
  processAudited: string;
  auditedUnit: string;
  leadAuditor: string;
  auditDate: string;
  findingType: "Minor NC" | "Observation" | "Good Practice";
  details: string;
  isoClause: string;
  status: "ปิดข้อบกพร่องแล้ว" | "รับทราบและพัฒนา";
}

export interface CarParRecord {
  carNumber: string;
  issueDate: string;
  issuedTo: string;
  clauseRef: string;
  problemStatement: string;
  rootCauseAnalysis: string; // 5 Whys
  immediateCorrection: string;
  correctiveActionPlan: string;
  targetClosureDate: string;
  actualClosureDate: string;
  verifiedBy: string;
  status: "CLOSED (ผ่านการรับรอง)" | "PENDING";
}

// -------------------------------------------------------------------------
// MONTHLY EXECUTIVE MEETINGS DATA (ประชุมร่วมกับผู้บริหารทุกเดือน)
// -------------------------------------------------------------------------
const MONTHLY_EXECUTIVE_MEETINGS: MonthlyExecutiveMeeting[] = [
  {
    id: "mem-2026-03",
    meetingNo: "ครั้งที่ 3/2569",
    monthName: "มีนาคม 2569",
    monthKey: "2026-03",
    date: "12 มีนาคม 2569",
    time: "13:30 - 16:00 น.",
    location: "ห้องประชุม Boardroom ชั้น 3 อาคารอำนวยการอุทยานฯ มช. (STeP)",
    chair: "ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)",
    recorder: "นางสาววาสิตา กอบธัญกิจ (ผู้ช่วยหัวหน้าทีม CC)",
    attendees: [
      "ผศ.ดร.สุริยะ ทองมุณี (ประธานที่ประชุม - รองผู้อำนวยการ)",
      "นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA - หัวหน้าทีมสร้างสรรค์ฯ)",
      "นางสาววาสิตา กอบธัญกิจ (วา WK - ผู้ช่วยหัวหน้าทีม)",
      "นางสาวรวิสรา ลิ้มศิริ (จอย RL - ผู้แทนยูนิตงานออกแบบ)",
      "นายสิทธิกร กลิ่นจันทร์ (ลูกอิน STK - ผู้แทนยูนิตสื่อสารองค์กร)",
      "นางสาวศศิภา ลิ้มรัตนโภคิน (เอ็นจอย SLR - ผู้แทนยูนิตผลิตสื่อสร้างสรรค์)"
    ],
    kpiHighlight: {
      producedCount: 38,
      onTimeRate: "94.7%",
      csatScore: "92.8%"
    },
    agendas: [
      {
        agendaNo: 1,
        title: "ติดตามข้อสั่งการจากการประชุมเดือนกุมภาพันธ์ 2569",
        detail: "รายงานความคืบหน้าการจัดหาเซิร์ฟเวอร์สำรองข้อมูลกลาง (NAS Storage) และการปรับแบบฟอร์มขอรับบริการด่วน (Fast-Track Ticket)",
        directiveFromExecutive: "รับทราบการดำเนินการ ให้เร่งทดสอบระบบสำรองข้อมูลอัตโนมัติก่อนสิ้นเดือนมีนาคม"
      },
      {
        agendaNo: 2,
        title: "รายงานผลการผลิตสื่อและตัวชี้วัดความพึงพอใจประจำเดือน",
        detail: "ยอดผลิตชิ้นงาน 38 ชิ้น (เกินเป้า 30 ชิ้น) อัตราส่งงานตรงเวลา 94.7% คะแนนความพึงพอใจ CSAT 92.8%",
        directiveFromExecutive: "ชื่นชมการรักษามาตรฐานความรวดเร็ว ขอให้เน้นย้ำความถูกต้องของข้อมูลเทคนิคในผลงานวิจัยเชิงลึกของ มช."
      },
      {
        agendaNo: 3,
        title: "แผนงานประชาสัมพันธ์งาน STeP Innovation Expo 2026",
        detail: "ยูนิตทั้ง 3 ร่วมกันนำเสนอ Key Visual, วิดีโอ Teaser และแผนปล่อยข่าว Press Release สื่อมวลชน",
        directiveFromExecutive: "เห็นชอบรูปแบบ Key Visual และให้นัดแถลงข่าวร่วมกับผู้บริหารมหาวิทยาลัยในสัปดาห์แรกของเดือนหน้า"
      },
      {
        agendaNo: 4,
        title: "การจัดสรรงบประมาณและการพัฒนาบุคลากร (Training & Capacity)",
        detail: "เสนอขอส่งสมาชิก 4 ท่านเข้าร่วมอบรม 'AI Tools for Creative Media & Intellectual Property Law'",
        directiveFromExecutive: "อนุมัติงบประมาณสนับสนุนการอบรม และมอบหมายให้นำความรู้มาจัด KM ถ่ายทอดต่อในทีม CC ทั้งหมด"
      }
    ],
    actionItems: [
      {
        id: "act-03-1",
        task: "จัดทำคู่มือและป้าย CI Guideline ชุดย่อแจกจ่ายหน่วยงานภายใน มช.",
        assignee: "จอย RL (งานออกแบบ)",
        deadline: "25 มี.ค. 2569",
        status: "completed",
        statusLabel: "เสร็จสิ้นแล้ว"
      },
      {
        id: "act-03-2",
        task: "ประสานงานสื่อมวลชนภาคเหนือ 15 สำนัก สำหรับงานแถลงข่าว STeP Expo",
        assignee: "ลูกอิน STK & โอ๊ต CNB (สื่อสารองค์กร)",
        deadline: "30 มี.ค. 2569",
        status: "in_progress",
        statusLabel: "กำลังประสานงาน"
      },
      {
        id: "act-03-3",
        task: "ตัดต่อคลิปวิดีโอ Teaser STeP Expo ความยาว 60 วินาที พร้อม Closed Caption",
        assignee: "เอ็นจอย SLR & ต้า TTY (ผลิตสื่อ)",
        deadline: "28 มี.ค. 2569",
        status: "in_progress",
        statusLabel: "กำลังตัดต่อรอบ Final"
      }
    ]
  },
  {
    id: "mem-2026-02",
    meetingNo: "ครั้งที่ 2/2569",
    monthName: "กุมภาพันธ์ 2569",
    monthKey: "2026-02",
    date: "13 กุมภาพันธ์ 2569",
    time: "14:00 - 16:30 น.",
    location: "ห้องประชุม Smart Meeting Room อุทยานฯ มช.",
    chair: "ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)",
    recorder: "นางสาววาสิตา กอบธัญกิจ (ผู้ช่วยหัวหน้าทีม CC)",
    attendees: [
      "ผศ.ดร.สุริยะ ทองมุณี (ประธานที่ประชุม)",
      "นายอัจชนะพงษ์ อัจชนะวราทา (หัวหน้าทีม)",
      "นางสาววาสิตา กอบธัญกิจ (ผู้ช่วยหัวหน้าทีม)",
      "นางสาวอริสรา ชนะภักดี (พิม AC)",
      "นายชาญณรงค์ บินชัย (โอ๊ต CNB)",
      "นางสาวกัญญาวีย์ คันธะยะ (แก้ว KYK)"
    ],
    kpiHighlight: {
      producedCount: 34,
      onTimeRate: "93.1%",
      csatScore: "91.5%"
    },
    agendas: [
      {
        agendaNo: 1,
        title: "สรุปผลการตรวจประเมินคุณภาพภายใน (IQA) และใบ CAR-CC-2026-01",
        detail: "รายงานกรณีการรับงานด่วน และแนวทางแก้ไขโดยพัฒนาระบบ Fast-Track Ticket",
        directiveFromExecutive: "เห็นชอบมาตรการแก้ไข และเน้นย้ำให้ผู้บริหารทุกส่วนงานปฏิบัติตามขั้นตอนการส่งบรีฟ"
      },
      {
        agendaNo: 2,
        title: "การควบคุมคุณภาพและอัตลักษณ์ CI อุทยานฯ",
        detail: "รายงานการตรวจพบส่วนงานภายนอกนำโลโก้ไปย่อผิดสัดส่วน",
        directiveFromExecutive: "ให้ยูนิต PR ทำหนังสือเวียนชี้แจงระเบียบการใช้ตราสัญลักษณ์ STeP อย่างเป็นทางการ"
      }
    ],
    actionItems: [
      {
        id: "act-02-1",
        task: "ปิดใบ CAR-CC-2026-01 พร้อมแนบหลักฐานระบบ Fast-Track Ticket",
        assignee: "จ๊อบ AA & วา WK",
        deadline: "26 ก.พ. 2569",
        status: "completed",
        statusLabel: "ปิดใบ CAR เรียบร้อย"
      },
      {
        id: "act-02-2",
        task: "จัดทำ Infographic ข้อควรระวังการใช้โลโก้ STeP เผยแพร่บนเว็บ Intranet",
        assignee: "พิม AC (งานออกแบบ)",
        deadline: "20 ก.พ. 2569",
        status: "completed",
        statusLabel: "เสร็จสิ้นแล้ว"
      }
    ]
  },
  {
    id: "mem-2026-01",
    meetingNo: "ครั้งที่ 1/2569",
    monthName: "มกราคม 2569",
    monthKey: "2026-01",
    date: "15 มกราคม 2569",
    time: "09:30 - 12:00 น.",
    location: "ห้องประชุม Executive Boardroom อาคารอำนวยการ STeP",
    chair: "ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)",
    recorder: "นางสาววาสิตา กอบธัญกิจ (ผู้ช่วยหัวหน้าทีม CC)",
    attendees: [
      "ผศ.ดร.สุริยะ ทองมุณี (ประธานที่ประชุม)",
      "นายอัจชนะพงษ์ อัจชนะวราทา (หัวหน้าทีม)",
      "นางสาววาสิตา กอบธัญกิจ (ผู้ช่วยหัวหน้าทีม)",
      "ตัวแทนสมาชิกทีม CC ครบทั้ง 13 ท่าน"
    ],
    kpiHighlight: {
      producedCount: 31,
      onTimeRate: "92.5%",
      csatScore: "90.4%"
    },
    agendas: [
      {
        agendaNo: 1,
        title: "มอบนโยบายและทิศทางการสื่อสารองค์กร ประจำปี 2569",
        detail: "ผศ.ดร.สุริยะ ชี้แจงเป้าหมายยุทธศาสตร์การยกระดับภาพลักษณ์อุทยานฯ สู่สากล",
        directiveFromExecutive: "เน้นสื่อสารบทบาทของ STeP ในการเป็นสะพานเชื่อมงานวิจัยสู่เชิงพาณิชย์ และตั้งเป้าหมาย CSAT >= 85%"
      },
      {
        agendaNo: 2,
        title: "การจัดสรรหน้าที่ความรับผิดชอบใน 3 ยูนิตหลัก (งานออกแบบ, สื่อสารองค์กร, ผลิตสื่อ)",
        detail: "รายงานบทบาทและการแบ่งงานตามผังโครงสร้างทีมใหม่ 13 บุคลากร",
        directiveFromExecutive: "เห็นชอบการจัดโครงสร้าง 3 ยูนิต และกำชับให้บูรณาการทำงานร่วมกันแบบ Agile"
      }
    ],
    actionItems: [
      {
        id: "act-01-1",
        task: "จัดทำแผนปฏิบัติการประจำปี (Action Plan 2026) เชื่อมโยง ISO และ OKR",
        assignee: "จ๊อบ AA & วา WK",
        deadline: "31 ม.ค. 2569",
        status: "completed",
        statusLabel: "เสร็จสิ้นแล้ว"
      }
    ]
  }
];

// -------------------------------------------------------------------------
// MRM 12 AGENDAS DATA
// -------------------------------------------------------------------------
const MRM_AGENDAS: MrmAgendaItem[] = [
  {
    agendaNumber: 1,
    title: "สถานะของการดำเนินการจากการทบทวนของฝ่ายบริหารครั้งก่อน",
    isoClause: "ข้อ 9.3.2 a",
    summary: "ติดตามความคืบหน้าของมติการประชุม MRM ครั้งที่ 2/2568 ด้านการจัดซื้ออุปกรณ์ตัดต่อความเร็วสูง",
    meetingResolution: "ฝ่ายบริหารรับทราบการส่งมอบเครื่องตัดต่อและลิขสิทธิ์ซอฟต์แวร์ใหม่ ใช้งานได้ตามวัตถุประสงค์ 100%",
    responsiblePerson: "จ๊อบ AA (หัวหน้าทีม)",
    deadline: "ม.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 2,
    title: "การเปลี่ยนแปลงประเด็นภายนอกและภายในที่เกี่ยวข้องกับระบบ QMS",
    isoClause: "ข้อ 9.3.2 b",
    summary: "การเติบโตของการนำ Generative AI มาใช้ในงานออกแบบและสร้างสรรค์คอนเทนต์ และกฎหมายลิขสิทธิ์สื่อใหม่",
    meetingResolution: "อนุมัติให้จัดทำแนวทางปฏิบัติด้าน AI Ethical & Copyright Guidelines เสริมในคู่มือ WI",
    responsiblePerson: "ผศ.ดร.สุริยะ (ประธาน) / วา WK",
    deadline: "มี.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 3,
    title: "ข้อมูลผลการดำเนินงานด้านคุณภาพและตัวชี้วัด (KPIs & OKRs)",
    isoClause: "ข้อ 9.3.2 c.1",
    summary: "รายงานผลการบรรลุตัวชี้วัด 4 ด้าน: CSAT 91.4% (เป้า 85%), On-time 93.8% (เป้า 90%), Rework 3.2% (เป้า <5%)",
    meetingResolution: "ที่ประชุมมีมติชื่นชมทีมงานที่ทำผลงานเกินเป้าหมายทุกมิติ และคงเกณฑ์ความท้าทายนี้ไว้ต่อไป",
    responsiblePerson: "วา WK & สมาชิก 13 ท่าน",
    deadline: "ก.พ. 2569",
    status: "completed"
  },
  {
    agendaNumber: 4,
    title: "ความพึงพอใจของลูกค้าและข้อเสนอแนะจากผู้มีส่วนได้ส่วนเสีย",
    isoClause: "ข้อ 9.3.2 c.2",
    summary: "สรุปผลแบบสำรวจผู้รับบริการ 308 ราย และคำติชมจากคณะ/ส่วนงาน มช. รวมถึงผู้ประกอบการภาคเอกชน",
    meetingResolution: "ให้ทีมเพิ่มขนาดฟอนต์ซับไตเติลในวิดีโอ และจัดทำแบบฟอร์มบรีฟงานด่วนที่เป็นมาตรฐานร่วมกับฝ่ายธุรการ",
    responsiblePerson: "ลูกอิน STK & ต้า TTY",
    deadline: "เม.ย. 2569",
    status: "completed"
  },
  {
    agendaNumber: 5,
    title: "ระดับความสำเร็จของการดำเนินงานตามวัตถุประสงค์คุณภาพ",
    isoClause: "ข้อ 9.3.2 c.3",
    summary: "ปริมาณสื่อที่ผลิตจริง 412 ชิ้นงาน เกินจากแผนที่ตั้งไว้ 360 ชิ้นงาน (คิดเป็น 114.4%)",
    meetingResolution: "เห็นชอบผลการดำเนินงาน และให้จัดสรรงบประมาณบำรุงรักษาอุปกรณ์ถ่ายทำและสตูดิโอเพิ่มเติม",
    responsiblePerson: "ผศ.ดร.สุริยะ (ประธาน)",
    deadline: "มี.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 6,
    title: "ความไม่สอดคล้องและการปฏิบัติการแก้ไข (NC & CAR/PAR)",
    isoClause: "ข้อ 9.3.2 c.4",
    summary: "รายงานใบ CAR-CC-2026-01 กรณีการรับงานด่วนด้วยวาจาโดยไม่มีบันทึก Ticket",
    meetingResolution: "รับทราบการปิดใบ CAR อย่างสมบูรณ์ โดยทีมได้พัฒนาระบบ Quick Ticket รองรับงานเร่งด่วนเรียบร้อยแล้ว",
    responsiblePerson: "จ๊อบ AA",
    deadline: "ก.พ. 2569",
    status: "completed"
  },
  {
    agendaNumber: 7,
    title: "ผลการเฝ้าระวังและการวัดผลกระบวนการ (Monitoring Results)",
    isoClause: "ข้อ 9.3.2 c.5",
    summary: "การติดตามกระบวนการ 15 ขั้นตอนตาม WI พบว่าระยะเวลาส่งมอบเฉลี่ยลดลงจาก 7 วันเหลือ 4.8 วันทำการ",
    meetingResolution: "รับทราบ และให้ขยายผลการใช้ระบบ Kanban ในการจัดการคิวงานข้ามยูนิต",
    responsiblePerson: "วา WK",
    deadline: "มี.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 8,
    title: "ผลการตรวจประเมินภายใน (Internal Quality Audit Results)",
    isoClause: "ข้อ 9.3.2 c.6",
    summary: "ผลการตรวจ IQA ประจำปี 2569 โดยทีมผู้ตรวจกลาง STeP พบ 0 Major NC, 1 Minor NC, 3 ข้อสังเกต",
    meetingResolution: "รับรองผลการตรวจประเมิน และพร้อมรับการตรวจรับรองภายนอก (Stage 2 Certification Audit)",
    responsiblePerson: "ทีมตรวจประเมินภายใน STeP",
    deadline: "ก.พ. 2569",
    status: "completed"
  },
  {
    agendaNumber: 9,
    title: "ผลการดำเนินงานของผู้ให้บริการภายนอก (Outsource / Vendors)",
    isoClause: "ข้อ 9.3.2 c.7",
    summary: "การประเมินคู่ค้า 4 ราย (โรงพิมพ์, เช่าสตูดิโอ, ของพรีเมียม, ลิขสิทธิ์ฟอนต์) ผ่านเกณฑ์เกรด A และ B ทั้งหมด",
    meetingResolution: "อนุมัติต่อสัญญาในบัญชี Approved Vendor List (AVL) ประจำปี 2569 ทั้ง 4 ราย",
    responsiblePerson: "จอย RL & โอ๊ต CNB",
    deadline: "มี.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 10,
    title: "ความเพียงพอของทรัพยากร (คน อุปกรณ์ และสภาพแวดล้อม)",
    isoClause: "ข้อ 9.3.2 d",
    summary: "บุคลากร 13 ท่านมีความพร้อมสูง แต่ต้องการการอัพเกรดระบบจัดเก็บไฟล์ส่วนกลาง (Centralized NAS Storage)",
    meetingResolution: "ประธานอนุมัติงบประมาณติดตั้ง NAS Storage ความจุ 64TB พร้อมระบบสำรองข้อมูลอัตโนมัติ",
    responsiblePerson: "ผศ.ดร.สุริยะ & จ๊อบ AA",
    deadline: "พ.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 11,
    title: "ประสิทธิผลของมาตรการจัดการความเสี่ยงและโอกาส",
    isoClause: "ข้อ 9.3.2 e",
    summary: "การทบทวนความเสี่ยง 11 ข้อ และมาตรการลดความเสี่ยงด้านชื่อเสียงและบุคลากร สามารถควบคุมได้ในระดับยอมรับได้",
    meetingResolution: "เห็นชอบให้ปรับปรุงตาราง Residual Risk และเพิ่มการอบรมทักษะสำรอง (Multi-skilling) ในทีม",
    responsiblePerson: "วา WK",
    deadline: "มี.ค. 2569",
    status: "completed"
  },
  {
    agendaNumber: 12,
    title: "โอกาสในการปรับปรุงและนวัตกรรมการทำงาน (Opportunities for Improvement)",
    isoClause: "ข้อ 9.3.2 f",
    summary: "ข้อเสนอแนะในการจัดทำพอดแคสต์เผยแพร่งานวิจัย STeP Talk และการส่งผลงานประกวดรางวัลการออกแบบสากล",
    meetingResolution: "สนับสนุนให้ทีมจัดทำโปรเจกต์นำร่อง STeP Talk ซีซั่น 2 และรวบรวมชิ้นงานส่งประกวดเพื่อสร้างชื่อเสียง",
    responsiblePerson: "เอ็นจอย SLR & ก้อง IK",
    deadline: "มิ.ย. 2569",
    status: "ongoing"
  }
];

const INTERNAL_AUDIT_FINDINGS: InternalAuditFinding[] = [
  {
    id: "iqa-01",
    processAudited: "การควบคุมข้อมูลเอกสารและการรับงาน (Intake & WI)",
    auditedUnit: "บริหารโครงการ CC",
    leadAuditor: "นายธีรวัฒน์ จันทร์เพ็ญ (Lead Auditor STeP)",
    auditDate: "15 ก.พ. 2569",
    findingType: "Minor NC",
    details: "พบงานเร่งด่วน 1 โครงการที่เริ่มผลิตก่อนมีการอนุมัติใบคำขอรับบริการอย่างเป็นทางการในระบบ",
    isoClause: "ข้อ 8.2.2, 8.2.3",
    status: "ปิดข้อบกพร่องแล้ว"
  },
  {
    id: "iqa-02",
    processAudited: "การควบคุมการผลิตชิ้นงานกราฟิกและสื่อสิ่งพิมพ์",
    auditedUnit: "ยูนิตงานออกแบบ",
    leadAuditor: "นางสาวศิริพร สุวรรณรัตน์ (Internal Auditor)",
    auditDate: "15 ก.พ. 2569",
    findingType: "Good Practice",
    details: "มีระบบตรวจสอบ CI Color Swatch และ Template Grid อย่างเป็นระบบ ป้องกันข้อผิดพลาดของแบรนด์ได้ 100%",
    isoClause: "ข้อ 8.5.1",
    status: "รับทราบและพัฒนา"
  },
  {
    id: "iqa-03",
    processAudited: "การจัดการความรู้และลิขสิทธิ์สื่อ (KM & Assets)",
    auditedUnit: "ยูนิตผลิตสื่อสร้างสรรค์",
    leadAuditor: "นายธีรวัฒน์ จันทร์เพ็ญ (Lead Auditor STeP)",
    auditDate: "16 ก.พ. 2569",
    findingType: "Observation",
    details: "ควรจัดทำบัญชีทะเบียนลิขสิทธิ์เพลงและฟอนต์ (Font & Music Asset Log) ให้ค้นหาง่ายขึ้น",
    isoClause: "ข้อ 7.1.6",
    status: "รับทราบและพัฒนา"
  },
  {
    id: "iqa-04",
    processAudited: "การวัดผลความพึงพอใจลูกค้าและการส่งมอบ",
    auditedUnit: "ยูนิตสื่อสารองค์กร",
    leadAuditor: "นางสาวศิริพร สุวรรณรัตน์ (Internal Auditor)",
    auditDate: "16 ก.พ. 2569",
    findingType: "Observation",
    details: "ควรเพิ่มช่องทางแจ้งเตือนอัตโนมัติทางอีเมลเมื่อผู้รับบริการยังไม่ได้ตอบแบบประเมิน CSAT ภายใน 7 วัน",
    isoClause: "ข้อ 9.1.2",
    status: "รับทราบและพัฒนา"
  }
];

const CAR_PAR_RECORDS: CarParRecord[] = [
  {
    carNumber: "CAR-CC-2026-01",
    issueDate: "16 ก.พ. 2569",
    issuedTo: "นายอัจชนะพงษ์ อัจชนะวราทา (หัวหน้าทีม CC)",
    clauseRef: "ISO 9001:2015 ข้อ 8.2.3 (การทบทวนข้อกำหนดเกี่ยวกับผลิตภัณฑ์และบริการ)",
    problemStatement: "พบว่ามีการรับคำขอบริการผลิตสื่อสิ่งพิมพ์เร่งด่วนทางโทรศัพท์และเริ่มทำงานทันทีโดยไม่มีการบันทึกเอกสารคำขอรับบริการและเกณฑ์ตรวจรับงานในระบบก่อนเริ่มงาน",
    rootCauseAnalysis: "ผู้ขอรับบริการเป็นงานพิธีการเร่งด่วนของผู้บริหาร มีเวลากระชั้นชิด 24 ชม. ทำให้ทีมงานมุ่งแก้ปัญหาเฉพาะหน้า และระบบรับงานเดิมมีขั้นตอนกรอกแบบฟอร์มยาวเกินไปสำหรับงานด่วน",
    immediateCorrection: "จัดทำแบบฟอร์มคำขอย้อนหลังและให้ผู้รับบริการลงนามตรวจรับงานครบถ้วนเรียบร้อย",
    correctiveActionPlan: "พัฒนาระบบ 'Fast-Track Quick Brief Ticket' ในระบบดิจิทัลของทีม กรอกเพียง 3 ช่อง (ชื่องาน, วันส่ง, ผู้ติดต่อ) ใช้เวลาไม่เกิน 1 นาที พร้อมแจ้งเตือนผ่าน Line Notify อัตโนมัติ",
    targetClosureDate: "28 ก.พ. 2569",
    actualClosureDate: "26 ก.พ. 2569",
    verifiedBy: "นายธีรวัฒน์ จันทร์เพ็ญ (Lead Auditor STeP) & ผศ.ดร.สุริยะ ทองมุณี",
    status: "CLOSED (ผ่านการรับรอง)"
  }
];

export default function IsoManagementReviewView() {
  // Sub-section toggle: "monthly" | "mrm" | "audit"
  const [activeSubTab, setActiveSubTab] = useState<"monthly" | "mrm" | "audit">("monthly");
  
  // Load dynamic executive meetings synced from Meeting Report system (localStorage: cc_meeting_tasks_v2)
  const [executiveMeetings, setExecutiveMeetings] = useState<MonthlyExecutiveMeeting[]>(() => {
    let combined = [...MONTHLY_EXECUTIVE_MEETINGS];
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cc_meeting_tasks_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const dynamicExecs = parsed.filter((m: any) => 
              m.meetingType === "executive" || 
              (m.chair && m.chair.includes("สุริยะ")) ||
              m.isoLinked
            );

            dynamicExecs.forEach((dm: any) => {
              const exists = combined.some(c => c.monthKey === dm.monthKey || c.id === dm.id);
              if (!exists) {
                const yearParts = (dm.monthKey || "").split("-");
                const beYear = yearParts.length === 2 ? parseInt(yearParts[0], 10) + 543 : 2569;
                const mNum = yearParts.length === 2 ? parseInt(yearParts[1], 10) : 1;

                combined.unshift({
                  id: dm.id,
                  meetingNo: `ครั้งที่ ${mNum}/${beYear}`,
                  monthName: dm.monthName,
                  monthKey: dm.monthKey,
                  date: dm.date,
                  time: "13:30 - 15:30 น.",
                  location: "ห้องประชุม Boardroom STeP / ห้องประชุมออนไลน์",
                  chair: dm.chair || "ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)",
                  recorder: dm.recorder || "วา WK",
                  attendees: [
                    dm.chair || "ผศ.ดร.สุริยะ ทองมุณี (ประธาน)",
                    "นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA)",
                    "นางสาววาสิตา กอบธัญกิจ (วา WK)",
                    "ทีมสร้างสรรค์และการสื่อสาร (CC Team)"
                  ],
                  kpiHighlight: {
                    producedCount: 36,
                    onTimeRate: "93.8%",
                    csatScore: "92.4%"
                  },
                  agendas: (dm.agendas || []).map((ag: any, idx: number) => ({
                    agendaNo: idx + 1,
                    title: ag.title,
                    detail: ag.notes || "รายงานผลการดำเนินงานและมติที่ประชุม",
                    directiveFromExecutive: dm.solutions || dm.observations || "ผู้บริหารรับทราบและมอบหมายให้ทีมดำเนินการตามแผนงาน"
                  })),
                  actionItems: (dm.agendas || []).filter((ag: any) => ag.category === "continuous").map((ag: any, idx: number) => ({
                    id: `act-${dm.id}-${idx}`,
                    task: ag.title,
                    assignee: (ag.assignees && ag.assignees.length > 0) ? ag.assignees.join(", ") : "ทีม CC",
                    deadline: "สิ้นเดือน",
                    status: ag.completed ? "completed" : "in_progress",
                    statusLabel: ag.completed ? "เสร็จสิ้นแล้ว" : "กำลังดำเนินการ"
                  }))
                });
              }
            });
          }
        }
      } catch (e) {
        console.error("Error reading cc_meeting_tasks_v2 in ISO Tab 5:", e);
      }
    }
    return combined;
  });

  // Selected month for Monthly Meetings
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    return executiveMeetings[0]?.monthKey || "2026-03";
  });

  const [expandedAgenda, setExpandedAgenda] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState("");

  const currentMeeting = useMemo(() => {
    return executiveMeetings.find((m) => m.monthKey === selectedMonthKey) || executiveMeetings[0];
  }, [selectedMonthKey, executiveMeetings]);

  const filteredAgendas = useMemo(() => {
    return MRM_AGENDAS.filter((a) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.isoClause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchQuery]);

  const handleExportExcel = () => {
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "รายงานบันทึกการประชุมร่วมกับผู้บริหารรายเดือน และการทบทวนของฝ่ายบริหาร (ISO 9001:2015 ข้อ 9.2, 9.3, 10.2)\n";
    csv += `หน่วยงาน: ทีมสร้างสรรค์และการสื่อสาร (CC TEAM) อุทยานวิทยาศาสตร์ฯ มช.\n`;
    csv += `ประธานการประชุม: ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ) | เลขานุการ: นางสาววาสิตา กอบธัญกิจ\n`;
    csv += `วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}\n\n`;

    csv += "=== ส่วนที่ 1: สรุปบันทึกการประชุมร่วมกับผู้บริหารรายเดือน (Monthly Executive Meetings) ===\n";
    csv += "ครั้งที่,เดือน,วันที่ประชุม,เวลา,สถานที่,ประธานการประชุม,ผู้จดบันทึก,ชิ้นงานที่ผลิตสำเร็จ,อัตราส่งตรงเวลา,คะแนน CSAT\n";
    executiveMeetings.forEach((m) => {
      csv += `"${m.meetingNo}","${m.monthName}","${m.date}","${m.time}","${m.location}","${m.chair}","${m.recorder}",${m.kpiHighlight.producedCount},"${m.kpiHighlight.onTimeRate}","${m.kpiHighlight.csatScore}"\n`;
    });

    csv += "\n=== ส่วนที่ 2: ข้อสั่งการและงานที่ได้รับมอบหมายจากการประชุมผู้บริหาร (Action Items) ===\n";
    csv += "เดือน,ลำดับ,งานที่ได้รับมอบหมาย,ผู้รับผิดชอบ,กำหนดเสร็จ,สถานะ\n";
    executiveMeetings.forEach((m) => {
      m.actionItems.forEach((act, idx) => {
        csv += `"${m.monthName}",${idx + 1},"${act.task.replace(/"/g, '""')}","${act.assignee}","${act.deadline}","${act.statusLabel}"\n`;
      });
    });

    csv += "\n=== ส่วนที่ 3: วาระการประชุมทบทวนของฝ่ายบริหาร 12 วาระตามมาตรฐาน ISO 9.3 ===\n";
    csv += "วาระที่,ชื่อวาระการประชุม,ข้อกำหนด ISO,สรุปสาระสำคัญ,มติที่ประชุมและข้อสั่งการ,ผู้รับผิดชอบ,กำหนดเสร็จ,สถานะ\n";
    MRM_AGENDAS.forEach((a) => {
      csv += `${a.agendaNumber},"${a.title.replace(/"/g, '""')}","${a.isoClause}","${a.summary.replace(/"/g, '""')}","${a.meetingResolution.replace(/"/g, '""')}","${a.responsiblePerson}","${a.deadline}","${a.status}"\n`;
    });

    csv += "\n=== ส่วนที่ 4: รายงานผลการตรวจประเมินภายใน (Internal Quality Audit - IQA) ===\n";
    csv += "รหัส,กระบวนการที่ตรวจ,ยูนิตผู้รับการตรวจ,ผู้ตรวจประเมิน,วันที่ตรวจ,ระดับผลการตรวจ,ข้อกำหนด ISO,รายละเอียดข้อค้นพบ,สถานะ\n";
    INTERNAL_AUDIT_FINDINGS.forEach((f) => {
      csv += `"${f.id}","${f.processAudited}","${f.auditedUnit}","${f.leadAuditor}","${f.auditDate}","${f.findingType}","${f.isoClause}","${f.details.replace(/"/g, '""')}","${f.status}"\n`;
    });

    csv += "\n=== ส่วนที่ 5: ทะเบียนติดตามการแก้ไขข้อบกพร่อง (CAR/PAR Log) ===\n";
    csv += "เลขที่ CAR,วันที่ออก,ออกให้แก่,ข้อกำหนด,รายละเอียดปัญหา,การวิเคราะห์สาเหตุ (5 Whys),การแก้ไขเบื้องต้น,แผนปฏิบัติการแก้ไขป้องกัน,กำหนดเสร็จ,วันที่ปิดจริง,ผู้ตรวจประเมินปิดใบ,สถานะ\n";
    CAR_PAR_RECORDS.forEach((c) => {
      csv += `"${c.carNumber}","${c.issueDate}","${c.issuedTo}","${c.clauseRef}","${c.problemStatement.replace(/"/g, '""')}","${c.rootCauseAnalysis.replace(/"/g, '""')}","${c.immediateCorrection.replace(/"/g, '""')}","${c.correctiveActionPlan.replace(/"/g, '""')}","${c.targetClosureDate}","${c.actualClosureDate}","${c.verifiedBy}","${c.status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `5_ประชุมร่วมกับผู้บริหารและทบทวนQMS_CC_TEAM_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="sec-mrm-agendas">
      {/* ========================================================================= */}
      {/* 1. HEADER STRIP & EXCEL DOWNLOAD                                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap inline-flex items-center gap-1.5 w-fit">
              <Award size={13} />
              <span>เอกสารแนบ 5: บันทึกการประชุมร่วมกับผู้บริหารรายเดือน และการทบทวนของฝ่ายบริหาร (ISO 9.2, 9.3, 10.2)</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ไฟล์อ้างอิง: <strong className="text-slate-700">MEM-CC-2026 รายงานการประชุมร่วมกับผู้บริหารประจำเดือน</strong>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/dashboard?view=data-reports&report=meeting"
              className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0"
              title="เปิดระบบ Meeting Report เพื่อจัดการวาระและส่งอีเมลบันทึกการประชุม"
            >
              <Users size={14} className="text-orange-600" />
              <span>จัดการใน Meeting Report</span>
              <ArrowRight size={13} />
            </a>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              title="ดาวน์โหลด Excel บันทึกการประชุมร่วมกับผู้บริหารและผลตรวจ IQA"
            >
              <FileSpreadsheet size={15} />
              <span>ดาวน์โหลด Excel</span>
            </button>
          </div>
        </div>

        {/* Executive Management Review Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                Executive Meetings & Management Review
              </span>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">
                หมวดบันทึกการประชุมร่วมกับผู้บริหาร (รายเดือน) และการทบทวนฝ่ายบริหาร (MRM)
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-xs text-xs font-mono w-fit">
              <Calendar className="text-emerald-400" size={15} />
              <span className="font-bold text-emerald-300">ประชุมเป็นประจำทุกเดือน (Monthly Cadence)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs border-t border-white/10">
            <div>
              <span className="text-slate-400 block text-[11px]">ประธานการประชุม:</span>
              <strong className="text-white">ผศ.ดร.สุริยะ ทองมุณี</strong>
              <span className="text-slate-400 block text-[10px]">(รองผู้อำนวยการ STeP)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">หัวหน้าทีม & ผู้ช่วย:</span>
              <strong className="text-white">จ๊อบ AA & วา WK</strong>
              <span className="text-slate-400 block text-[10px]">(ทีมสร้างสรรค์และการสื่อสาร)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ความถี่การประชุม:</span>
              <strong className="text-emerald-300">ทุกเดือน (สัปดาห์ที่ 2)</strong>
              <span className="text-slate-400 block text-[10px]">ติดตามงานและนโยบายต่อเนื่อง</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ความสอดคล้อง ISO:</span>
              <strong className="text-emerald-300">ข้อ 5.1, 9.3, 10.2</strong>
              <span className="text-slate-400 block text-[10px]">บันทึกมติและข้อสั่งการครบ</span>
            </div>
          </div>
        </div>

        {/* 3 Sub-Tabs Navigation for Tab 5 */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "monthly"
                ? "bg-[#E03131] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Calendar size={14} />
            <span>1. บันทึกประชุมร่วมกับผู้บริหาร (รายเดือน)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 ml-1">{executiveMeetings.length} รอบ</span>
          </button>

          <button
            onClick={() => setActiveSubTab("mrm")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "mrm"
                ? "bg-[#E03131] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileCheck2 size={14} />
            <span>2. วาระทบทวนฝ่ายบริหาร 12 วาระ (MRM)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 ml-1">ISO 9.3</span>
          </button>

          <button
            onClick={() => setActiveSubTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "audit"
                ? "bg-[#E03131] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck size={14} />
            <span>3. ตรวจประเมินภายใน &amp; CAR Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 ml-1">IQA 100%</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: บันทึกการประชุมร่วมกับผู้บริหารรายเดือน (MONTHLY MEETINGS)       */}
      {/* ========================================================================= */}
      {activeSubTab === "monthly" && (
        <div className="space-y-6">
          {/* Month Selector Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-600" />
                <span>เลือกรอบการประชุมรายเดือน:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {executiveMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMonthKey(m.monthKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedMonthKey === m.monthKey
                        ? "bg-purple-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {m.monthName} ({m.meetingNo})
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              สถานะ: <strong className="text-emerald-700">ประชุมเสร็จสิ้น &amp; บันทึกเรียบร้อย</strong>
            </div>
          </div>

          {/* Current Meeting Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            {/* Meeting Meta Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 font-mono">
                    {currentMeeting.meetingNo}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    บันทึกการประชุมติดตามงานและทิศทางกลยุทธ์สื่อสารร่วมกับผู้บริหาร ({currentMeeting.monthName})
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    <strong>{currentMeeting.date}</strong> ({currentMeeting.time})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{currentMeeting.location}</span>
                  </span>
                </div>
              </div>

              {/* Monthly KPI Metric Pills */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <div className="px-3 py-1 text-center border-r border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ผลิตสำเร็จ</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{currentMeeting.kpiHighlight.producedCount} ชิ้น</strong>
                </div>
                <div className="px-3 py-1 text-center border-r border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ส่งตรงเวลา</span>
                  <strong className="text-sm font-black text-emerald-700 font-mono">{currentMeeting.kpiHighlight.onTimeRate}</strong>
                </div>
                <div className="px-3 py-1 text-center">
                  <span className="text-[10px] text-slate-500 block">ความพึงพอใจ</span>
                  <strong className="text-sm font-black text-blue-700 font-mono">{currentMeeting.kpiHighlight.csatScore}</strong>
                </div>
              </div>
            </div>

            {/* Attendees & Leadership Information */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-100/80">
                <div>
                  <span className="text-purple-900 font-bold">ประธานที่ประชุม: </span>
                  <strong className="text-purple-950 font-black">{currentMeeting.chair}</strong>
                </div>
                <div>
                  <span className="text-purple-900 font-bold">ผู้จดบันทึกการประชุม: </span>
                  <span className="text-purple-950">{currentMeeting.recorder}</span>
                </div>
              </div>
              <div>
                <span className="text-purple-900 font-bold block text-[11px] mb-1">รายชื่อผู้เข้าร่วมประชุม:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentMeeting.attendees.map((att, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-white border border-purple-200 text-purple-900 text-[11px]">
                      {att}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Agendas & Directives */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-purple-600" size={16} />
                <span>วาระการประชุม และข้อสั่งการ/ทิศทางเชิงนโยบายจากผู้บริหาร</span>
              </h4>

              <div className="space-y-3">
                {currentMeeting.agendas.map((ag) => (
                  <div key={ag.agendaNo} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center shrink-0">
                        {ag.agendaNo}
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900">{ag.title}</h5>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-8">
                      {ag.detail}
                    </p>
                    <div className="ml-8 p-3 rounded-xl bg-purple-50 border border-purple-200/70 text-xs">
                      <strong className="text-purple-950 block text-[11px] mb-0.5">
                        💬 ข้อสั่งการ/ทิศทางจาก ผศ.ดร.สุริยะ ทองมุณี (รอง ผอ.):
                      </strong>
                      <p className="text-purple-900 font-medium">{ag.directiveFromExecutive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Action Items Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={16} />
                <span>รายการงานที่ได้รับมอบหมายจากการประชุม (Action Items)</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3 text-center w-12">ลำดับ</th>
                      <th className="p-3">งานที่ได้รับมอบหมาย / ข้อสั่งการ</th>
                      <th className="p-3">ผู้รับผิดชอบหลัก</th>
                      <th className="p-3">กำหนดส่งมอบ</th>
                      <th className="p-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentMeeting.actionItems.map((act, idx) => (
                      <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{act.task}</td>
                        <td className="p-3 text-slate-700">{act.assignee}</td>
                        <td className="p-3 font-mono text-slate-600">{act.deadline}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              act.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {act.status === "completed" ? "✓ " : "⏳ "}
                            {act.statusLabel}
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
      {/* SUB-TAB 2: MRM 12 AGENDAS TABLE & ACCORDION (ISO 9.3)                      */}
      {/* ========================================================================= */}
      {activeSubTab === "mrm" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="text-purple-600" size={20} />
                <span>วาระการประชุมทบทวนฝ่ายบริหาร 12 วาระตามมาตรฐาน ISO 9001:2015</span>
              </h3>
              <p className="text-xs text-slate-500">
                การประเมินความเหมาะสม ความพอเพียง และประสิทธิผลของระบบ QMS ครอบคลุมข้อกำหนด 9.3.2 ทั้งหมด
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="ค้นหาวาระ, ข้อกำหนด, มติ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>

          {/* 12 Agendas Cards */}
          <div className="space-y-3">
            {filteredAgendas.map((agenda) => {
              const isExpanded = expandedAgenda === agenda.agendaNumber;
              return (
                <div
                  key={agenda.agendaNumber}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedAgenda(isExpanded ? null : agenda.agendaNumber)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center shrink-0">
                        {agenda.agendaNumber}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{agenda.title}</h4>
                        <span className="text-[11px] font-mono text-purple-700 font-bold">{agenda.isoClause}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {agenda.status === "completed" ? "✓ สรุปมติแล้ว" : "กำลังดำเนินการ"}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-200/60 bg-white space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 block">สรุปสาระสำคัญที่นำเสนอ:</span>
                          <p className="text-slate-700 leading-relaxed">{agenda.summary}</p>
                        </div>
                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                          <span className="text-[11px] font-bold text-purple-900 block">มติที่ประชุมและข้อสั่งการผู้บริหาร:</span>
                          <p className="text-purple-950 font-medium leading-relaxed">{agenda.meetingResolution}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                        <span>ผู้รับผิดชอบ: <strong className="text-slate-800">{agenda.responsiblePerson}</strong></span>
                        <span>กำหนดเสร็จ: <strong className="text-slate-800">{agenda.deadline}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: INTERNAL AUDIT FINDINGS (IQA) & CAR/PAR (ISO 9.2, 10.2)         */}
      {/* ========================================================================= */}
      {activeSubTab === "audit" && (
        <div className="space-y-6">
          {/* IQA Report Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5" id="sec-iqa-report">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-purple-600" size={20} />
                  <span>รายงานผลการตรวจประเมินคุณภาพภายใน (Internal Quality Audit - IQA)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ผลการตรวจประเมินตามแผนการตรวจประจำปี รอบที่ 1/2569 ตามข้อกำหนด ISO 9001:2015 ข้อ 9.2
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full w-fit">
                0 Major NC • 1 Minor NC • 3 Observations
              </span>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3.5">รหัส / กระบวนการที่ตรวจ</th>
                    <th className="p-3.5">ยูนิตผู้รับการตรวจ</th>
                    <th className="p-3.5">ผู้ตรวจประเมิน</th>
                    <th className="p-3.5 text-center">ประเภทผลตรวจ</th>
                    <th className="p-3.5">ข้อกำหนด ISO</th>
                    <th className="p-3.5">รายละเอียดข้อค้นพบ (Audit Findings)</th>
                    <th className="p-3.5 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INTERNAL_AUDIT_FINDINGS.map((finding) => (
                    <tr key={finding.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{finding.processAudited}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{finding.id} • {finding.auditDate}</span>
                      </td>
                      <td className="p-3.5 text-slate-700">{finding.auditedUnit}</td>
                      <td className="p-3.5 text-slate-600">{finding.leadAuditor}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            finding.findingType === "Minor NC"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : finding.findingType === "Good Practice"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              : "bg-blue-100 text-blue-900 border border-blue-200"
                          }`}
                        >
                          {finding.findingType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-purple-700 font-bold">{finding.isoClause}</td>
                      <td className="p-3.5 text-slate-700 max-w-sm">{finding.details}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ {finding.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CAR/PAR Register Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5" id="sec-car-register">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <span>ทะเบียนใบแจ้งข้อบกพร่องและการปฏิบัติการแก้ไข (CAR/PAR Log)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  การจัดการสิ่งที่ไม่เป็นไปตามข้อกำหนด การวิเคราะห์สาเหตุที่แท้จริง (5 Whys) และการป้องกันไม่ให้เกิดซ้ำ (ISO 10.2)
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full w-fit">
                ✓ ปิดข้อบกพร่องสมบูรณ์ 100%
              </span>
            </div>

            {/* CAR Card Detail */}
            {CAR_PAR_RECORDS.map((car) => (
              <div key={car.carNumber} className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-emerald-700 text-white font-mono font-black rounded-lg text-xs">
                      {car.carNumber}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {car.clauseRef}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono w-fit">
                    ✓ {car.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block text-[11px]">1. สภาพปัญหาที่พบ (Problem Statement):</span>
                    <p className="text-slate-700 leading-relaxed">{car.problemStatement}</p>
                  </div>

                  <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-rose-700 block text-[11px]">2. การวิเคราะห์สาเหตุรากเหง้า (Root Cause - 5 Whys):</span>
                    <p className="text-slate-700 leading-relaxed">{car.rootCauseAnalysis}</p>
                  </div>

                  <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-blue-700 block text-[11px]">3. การแก้ไขเฉพาะหน้า (Immediate Correction):</span>
                    <p className="text-slate-700 leading-relaxed">{car.immediateCorrection}</p>
                  </div>

                  <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <span className="font-bold text-emerald-800 block text-[11px]">4. มาตรการแก้ไขป้องกันระยะยาว (Corrective Action Plan):</span>
                    <p className="text-emerald-950 font-medium leading-relaxed">{car.correctiveActionPlan}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-100 text-[11px] text-slate-600 font-mono">
                  <div>
                    <span>ออกให้แก่: <strong>{car.issuedTo}</strong> ({car.issueDate})</span>
                  </div>
                  <div>
                    <span>ตรวจติดตามและอนุมัติปิดโดย: <strong className="text-emerald-800">{car.verifiedBy}</strong> เมื่อ {car.actualClosureDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
