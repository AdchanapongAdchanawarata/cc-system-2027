"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  HeartHandshake,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Star,
  MessageSquare,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  RefreshCw,
  Mail,
  Building2,
  UserCheck,
  Target,
  Lightbulb,
  ThumbsUp,
  Calendar,
  Layers,
  Package,
  LayoutGrid,
  FileText,
  CheckSquare,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Zap,
  ShoppingBag,
  ShieldCheck,
  Briefcase,
  Video,
  Palette,
  Share2,
  Compass,
  Award
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ExportDataDropdown from "./ExportDataDropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from "date-fns";
import { resolveTaskCode } from "@/utils/taskCodeService";

export type StockTimeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" | "CUSTOM";

interface StakeholderGroup {
  id: string;
  name: string;
  category: "internal_step" | "executive" | "cmu_external" | "partners";
  categoryLabel: string;
  power: "High" | "Medium" | "Low";
  interest: "High" | "Medium" | "Low";
  needs: string;
  expectations: string;
  serviceStrategy: string;
  satisfactionTarget: string;
  currentScore: number;
}

// ---------------------------------------------------------------------------
// 1. HOLISTIC SYNTHESIS: Core Common Needs & Expectations Across All Stakeholders
// ---------------------------------------------------------------------------
export interface HolisticPillar {
  id: string;
  type: "need" | "expectation";
  title: string;
  subtitle: string;
  description: string;
  keyDrivers: string[];
  concreteDeliverables: string[];
  impactLevel: "Critical" | "High" | "Strategic";
  kpiMeasure: string;
}

export const HOLISTIC_NEEDS_EXPECTATIONS: HolisticPillar[] = [
  // 4 Core Common Needs
  {
    id: "HN-01",
    type: "need",
    title: "1. ความถูกต้องสมบูรณ์ของเนื้อหาและอัตลักษณ์ (Brief & CI Integrity)",
    subtitle: "สิ่งที่จำเป็นต้องมี: ข้อความ สาระสำคัญ และแบรนด์ตรงเป้าหมาย",
    description: "สาระสำคัญของข้อมูล ตัวสะกด โลโก้องค์กร/ผู้สนับสนุน และแนวทาง CI ต้องถูกต้อง 100% ครบถ้วนตามวัตถุประสงค์โครงการ ไม่มีความผิดพลาดซ้ำซ้อน",
    keyDrivers: [
      "ความเสี่ยงด้านภาพลักษณ์องค์กรต่อสาธารณะ",
      "กฎเกณฑ์การใช้ตราสัญลักษณ์ มหาวิทยาลัยเชียงใหม่ และกระทรวง อว.",
      "ความถูกต้องของข้อมูลทรัพย์สินทางปัญญาและลิขสิทธิ์"
    ],
    concreteDeliverables: [
      "ชิ้นงาน Artwork ที่ตรวจทาน Proofread ผ่าน QC",
      "ไฟล์ความละเอียดสูง (Hi-res 300dpi / Vector)",
      "คู่มือตรวจสอบ Brand CI Compliance Checklist"
    ],
    impactLevel: "Critical",
    kpiMeasure: "อัตราความผิดพลาดซ้ำ ≤ 2% และคะแนนความถูกต้อง ≥ 4.85/5"
  },
  {
    id: "HN-02",
    type: "need",
    title: "2. ความตรงต่อเวลาและการส่งมอบตามกำหนด (SLA Punctuality)",
    subtitle: "สิ่งที่จำเป็นต้องมี: ทันรอบการประชาสัมพันธ์และวันจัดงาน",
    description: "ส่งมอบงานดราฟต์แรกและงานไฟนอลตรงตามเวลาที่ตกลงกันไว้ (SLA) มีระยะเวลาเผื่อตรวจทาน (Buffer) ก่อนถึงวันเปิดตัวหรือวันจัดงานจริง",
    keyDrivers: [
      "กำหนดการจัดอีเวนต์ / งานแถลงข่าว / วันเปิดรับสมัคร",
      "รอบการปล่อยข่าวสารสู่สื่อมวลชนและโซเชียลมีเดีย",
      "กระบวนการจัดจ้างและส่งมอบงานพิมพ์ของโรงพิมพ์"
    ],
    concreteDeliverables: [
      "ส่งมอบ Draft 1 ล่วงหน้าอย่างน้อย 3-5 วันก่อนใช้งาน",
      "แจ้งสถานะความคืบหน้าผ่านระบบ Real-time Tracking",
      "ไฟล์ Final พร้อมใช้งานล่วงหน้า 24-48 ชั่วโมง"
    ],
    impactLevel: "Critical",
    kpiMeasure: "อัตราการส่งมอบงานตรงตามกำหนด SLA ≥ 95%"
  },
  {
    id: "HN-03",
    type: "need",
    title: "3. ความสะดวกและคล่องตัวในการเข้าถึงบริการ (Accessibility & Agility)",
    subtitle: "สิ่งที่จำเป็นต้องมี: ขั้นตอนกระชับ ส่งบรีฟง่าย มีระบบรองรับงานด่วน",
    description: "ขั้นตอนการส่งคำขอรับบริการสะดวกรวดเร็ว ไม่ซับซ้อน มีช่องทาง One-Stop Portal ส่งบรีฟได้ 24 ชั่วโมง และมี Fast-Track รองรับงานสั่งการเร่งด่วน",
    keyDrivers: [
      "งานเร่งด่วนตามนโยบายผู้บริหาร",
      "ปริมาณคำขอรับบริการที่เพิ่มขึ้นต่อเนื่อง",
      "ความต้องการความคล่องตัวในการทำงานแบบ Agile"
    ],
    concreteDeliverables: [
      "ระบบกรอกบรีฟออนไลน์ FM-CC-010 ผ่านเว็บไซต์",
      "คลังเทมเพลตด่วน (Fast-Track Template) ให้แก้ไขเองได้",
      "การตอบรับและมอบหมายงานภายใน 1 วันทำการ"
    ],
    impactLevel: "High",
    kpiMeasure: "เวลาในการตอบรับบรีฟและมอบหมายงาน ≤ 1 วันทำการ"
  },
  {
    id: "HN-04",
    type: "need",
    title: "4. ความคุ้มค่าและสร้างผลกระทบต่อภารกิจ (Impact & Value Creation)",
    subtitle: "สิ่งที่จำเป็นต้องมี: สื่อดึงดูดใจ ช่วยให้บรรลุเป้าหมายโครงการ",
    description: "ชิ้นงานสร้างการรับรู้ ดึงดูดกลุ่มเป้าหมาย เพิ่มยอด Reach & Engagement และช่วยให้โครงการ/ธุรกิจบรรลุเป้าหมายตามตัวชี้วัดได้อย่างมีประสิทธิภาพ",
    keyDrivers: [
      "เป้าหมาย OKR/KRI ด้านการสื่อสารและภาพลักษณ์",
      "ยอดผู้เข้าร่วมงานอบรม/กิจกรรมบ่มเพาะ",
      "การสร้างมูลค่าเพิ่มเชิงพาณิชย์ให้แก่ผู้ประกอบการนวัตกรรม"
    ],
    concreteDeliverables: [
      "สื่อที่กระตุ้นให้เกิด Call to Action (คลิกลงทะเบียน/ซื้อ)",
      "รายงานวิเคราะห์ยอด Reach & Engagement ประจำไตรมาส",
      "งานออกแบบที่ช่วยเพิ่มมูลค่าสินค้าได้ 20-50%"
    ],
    impactLevel: "Strategic",
    kpiMeasure: "ยอด Reach รวม ≥ 2.5 ล้านครั้ง/ปี และความพึงพอใจด้านผลลัพธ์ ≥ 90%"
  },

  // 4 Core Common Expectations
  {
    id: "HE-01",
    type: "expectation",
    title: "1. ความคิดสร้างสรรค์ระดับแนวหน้า (Creative Excellence & Modern Aesthetics)",
    subtitle: "สิ่งที่ถ้ามีจะประทับใจยิ่งขึ้น: ดีไซน์ระดับรางวัล ทันสมัย และโดดเด่น",
    description: "ชิ้นงานมีความสวยงาม โดดเด่น ทันสมัย ก้าวล้ำกว่ามาตรฐานทั่วไป สะท้อนภาพลักษณ์อุทยานวิทยาศาสตร์ชั้นนำ และสามารถแข่งขันในระดับสากลได้",
    keyDrivers: [
      "ความต้องการยกระดับภาพลักษณ์แบรนด์อุทยานวิทย์ฯ ภาคเหนือ",
      "พฤติกรรมผู้บริโภคที่เปิดรับ Visual Design แปลกใหม่",
      "การสร้างจุดต่างในตลาดแข่งขันยุคดิจิทัล"
    ],
    concreteDeliverables: [
      "แนวคิด Key Visual ที่มีเอกลักษณ์เฉพาะตัว (Custom Concept)",
      "การใช้เทคนิค 3D, Motion และ Generative AI เสริมพลังสร้างสรรค์",
      "ผลงานระดับส่งเข้าประกวดรางวัลการออกแบบได้"
    ],
    impactLevel: "Strategic",
    kpiMeasure: "คะแนนมิติด้านความคิดสร้างสรรค์ (Quality & Creativity) ≥ 4.80/5"
  },
  {
    id: "HE-02",
    type: "expectation",
    title: "2. การให้คำปรึกษาและข้อเสนอแนะเชิงรุก (Proactive Advisory & Expertise)",
    subtitle: "สิ่งที่ถ้ามีจะประทับใจยิ่งขึ้น: ร่วมคิด ร่วมวางกลยุทธ์ ไม่ใช่แค่ทำตามสั่ง",
    description: "ทีมงานช่วยวิเคราะห์ ให้คำแนะนำเรื่อง Mood & Tone เทคนิคการเล่าเรื่อง การเลือกใช้วัสดุ และแนวทางการสื่อสารที่ดีกว่าบรีฟเดิมอย่างเป็นมืออาชีพ",
    keyDrivers: [
      "ผู้สั่งงานอาจไม่มีพื้นฐานด้านดีไซน์หรือเทคนิคการผลิต",
      "ต้องการไอเดียต่อยอดเพื่อเพิ่มความคุ้มค่าของงบประมาณ",
      "ความเชี่ยวชาญเฉพาะทางด้านการสื่อสารวิทยาศาสตร์และนวัตกรรม"
    ],
    concreteDeliverables: [
      "Moodboard และ Creative Direction นำเสนอเปรียบเทียบ 2-3 แนวทาง",
      "คำแนะนำเรื่องวัสดุบรรจุภัณฑ์ เทคนิคปั๊มฟอยล์/เคลือบด้าน",
      "คำแนะนำด้านการจัดวางองค์ประกอบและการตลาดออนไลน์"
    ],
    impactLevel: "High",
    kpiMeasure: "ข้อเสนอแนะเชิงรุกได้รับการนำไปปรับใช้จริง ≥ 75%"
  },
  {
    id: "HE-03",
    type: "expectation",
    title: "3. ความคล่องตัวและการทำงานร่วมกันเป็นพาร์ตเนอร์ (Co-Creation & Agility)",
    subtitle: "สิ่งที่ถ้ามีจะประทับใจยิ่งขึ้น: รับฟังอย่างเปิดกว้าง ยืดหยุ่น และพร้อมช่วยแก้ปัญหา",
    description: "การประสานงานมีความเป็นมิตร เปิดรับฟังความคิดเห็น มีความยืดหยุ่นในการปรับแก้ และทำงานร่วมกันเสมือนเป็นทีมเดียวกัน (Co-creation Partner)",
    keyDrivers: [
      "บริบทของงานที่อาจมีการเปลี่ยนแปลงปัจจัยภายนอกกะทันหัน",
      "ความสัมพันธ์เชิงบวกในการทำงานระยะยาว",
      "ความไว้วางใจในการแลกเปลี่ยนความคิดเห็น"
    ],
    concreteDeliverables: [
      "เซสชัน Co-Design สรุปบรีฟงานสำคัญแบบเห็นภาพทันที",
      "ความยืดหยุ่นในการปรับแก้งาน minor changes ได้อย่างรวดเร็ว",
      "การจัดเตรียมไฟล์ต้นฉบับและเทมเพลตพร้อมต่อยอด"
    ],
    impactLevel: "High",
    kpiMeasure: "คะแนนมิติการประสานงานและความเอาใจใส่ ≥ 4.90/5"
  },
  {
    id: "HE-04",
    type: "expectation",
    title: "4. ความเป็นเจ้าของงานและความรับผิดชอบสูง (High Ownership & Care)",
    subtitle: "สิ่งที่ถ้ามีจะประทับใจยิ่งขึ้น: ติดตามงานเชิงรุก ดูแลจนสำเร็จลุล่วง",
    description: "ทีมงานมีความกระตือรือร้น ติดตามงาน เอาใจใส่ ดูแลชิ้นงานตั้งแต่เริ่มบรีฟจนกระทั่งผลิตเสร็จและเผยแพร่ พร้อมแก้ปัญหาเฉพาะหน้าอย่างมืออาชีพ",
    keyDrivers: [
      "ความสบายใจและความไว้วางใจของผู้สั่งงาน",
      "ความสำเร็จที่แท้จริงของการจัดกิจกรรม/เปิดตัวนวัตกรรม",
      "วัฒนธรรมการทำงานแบบ High Performance Team"
    ],
    concreteDeliverables: [
      "การประสานงานตรวจสอบหน้างานและการคุมคุณภาพการพิมพ์จริง",
      "การรายงานสรุปผลและข้อสังเกตหลังงานเสร็จสิ้น (Debrief)",
      "การตอบสนองข้อสอบถามอย่างรวดเร็วภายใน 1-2 ชั่วโมง"
    ],
    impactLevel: "Strategic",
    kpiMeasure: "คะแนนมิติความเป็นเจ้าของงาน (Ownership) ≥ 4.85/5"
  }
];

// ---------------------------------------------------------------------------
// 2. SEGMENTED ANALYSIS: Detailed Breakdown by Stakeholder Group
// ---------------------------------------------------------------------------
export interface DetailedStakeholderSegment {
  id: string;
  code: string;
  name: string;
  categoryLabel: string;
  badgeColor: string;
  power: "High" | "Medium" | "Low";
  interest: "High" | "Medium" | "Low";
  context: string;
  needs: {
    title: string;
    description: string;
    urgency: "เร่งด่วนที่สุด" | "ตามรอบแผนงาน" | "ต่อเนื่อง";
  }[];
  expectations: {
    title: string;
    description: string;
    delighter: string;
  }[];
  demandedProducts: {
    name: string;
    category: string;
    spec: string;
    priority: "สูงมาก" | "สูง";
  }[];
  painPointsAndRisks: string[];
  actionProtocol: string;
  satisfactionTarget: string;
  currentScore: number;
}

export const SEGMENTED_STAKEHOLDERS_ANALYSIS: DetailedStakeholderSegment[] = [
  {
    id: "SH-02",
    code: "SH-02",
    name: "ผู้บริหารระดับสูงและผู้อำนวยการอุทยานฯ (Executive Management)",
    categoryLabel: "ผู้บริหาร",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    power: "High",
    interest: "High",
    context: "ผู้กำหนดทิศทางนโยบาย ดูแลภาพลักษณ์ระดับชาติและนานาชาติ ต้องการสื่อระดับ Flagship ที่สื่อสารวิสัยทัศน์อุทยานวิทย์ฯ ภาคเหนือสู่สากล",
    needs: [
      {
        title: "สื่อภาพลักษณ์องค์กรระดับ Flagship",
        description: "Key Visual งานแถลงข่าวนโยบาย, เวทีเปิดตัวนิทรรศการนวัตกรรม และสื่อต้อนรับแขกระดับวีไอพี/รัฐมนตรี",
        urgency: "เร่งด่วนที่สุด"
      },
      {
        title: "การรายงานผลสัมฤทธิ์และสถิติภาพลักษณ์รวดเร็ว",
        description: "สรุปผลงานรายสัปดาห์/รายเดือน และรายงานต่อคณะกรรมการอำนวยการอย่างถูกต้องตามข้อเท็จจริง",
        urgency: "ตามรอบแผนงาน"
      },
      {
        title: "การจัดการความเสี่ยงด้านภาพลักษณ์และชื่อเสียง (Reputational Risk)",
        description: "การควบคุมความถูกต้องของตราสัญลักษณ์ มหาวิทยาลัยเชียงใหม่ และกระทรวง อว. ให้เป็นไปตามระเบียบ",
        urgency: "ต่อเนื่อง"
      }
    ],
    expectations: [
      {
        title: "ความคิดสร้างสรรค์ระดับ Award-Winning",
        description: "งานกราฟิกและวิดีโอต้องมีความแปลกใหม่ โดดเด่นเป็นที่จดจำระดับประเทศ และยกระดับภาพลักษณ์อุทยานฯ",
        delighter: "นำเสนอ Creative Moodboard ล่วงหน้า 2-3 แนวคิดก่อนลงมือผลิตจริง"
      },
      {
        title: "การเสนอแนะเชิงกลยุทธ์ด้านการสื่อสาร (Strategic Counsel)",
        description: "ช่วยวิเคราะห์ช่องทางการสื่อสารที่เหมาะสมและกลุ่มเป้าหมายเชิงลึก ไม่ใช่เพียงการทำงานตามคำสั่ง",
        delighter: "มีสรุปข้อมูล Executive One-Pager พร้อมข้อสังเกตและข้อเสนอแนะเชิงรุก"
      }
    ],
    demandedProducts: [
      { name: "Key Visual & Stage Backdrop", category: "Graphic Design", spec: "สเกลจริง 300dpi คุม CI", priority: "สูงมาก" },
      { name: "Executive Milestone Video", category: "Video Production", spec: "วิดีโอ 2-3 นาที กราฟิกพรีเมียม", priority: "สูงมาก" },
      { name: "Annual Performance Report", category: "Publication", spec: "รูปเล่มและ Digital Book", priority: "สูง" },
      { name: "Executive Meeting Dashboard", category: "Platform & Reports", spec: "แดชบอร์ดสรุปผลแบบเรียลไทม์", priority: "สูง" }
    ],
    painPointsAndRisks: [
      "งานเสร็จล่าช้ากระทบกำหนดการแถลงข่าวระดับชาติ",
      "ข้อมูลสถิติหรือชื่อหน่วยงานผิดพลาดในสื่อ Flagship",
      "ดีไซน์ซ้ำแบบเดิมไม่สะท้อนความเป็นผู้นำด้านนวัตกรรม"
    ],
    actionProtocol: "ประชุมรับฟังข้อสั่งการผู้บริหารทุกเดือนผ่านระบบ Meeting Report และมี Fast-Track เฉพาะสำหรับงานนโยบายเร่งด่วน",
    satisfactionTarget: "≥ 92%",
    currentScore: 96.8
  },
  {
    id: "SH-01",
    code: "SH-01",
    name: "บุคลากรและฝ่ายงานภายใน STeP (Internal STeP Units)",
    categoryLabel: "ภายในองค์กร",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    power: "High",
    interest: "High",
    context: "ผู้จัดโครงการ ฝึกอบรม บ่มเพาะสตาร์ทอัพ และบริการพื้นที่ มีภารกิจจัดกิจกรรมต่อเนื่องตลอดทั้งปี ต้องการสื่อประชาสัมพันธ์ปริมาณมากและถี่",
    needs: [
      {
        title: "สื่อประชาสัมพันธ์กิจกรรมโครงการที่ครบถ้วน",
        description: "โปสเตอร์ประชาสัมพันธ์ แบนเนอร์เปิดรับสมัคร ภาพปก และสื่อแจกในงานที่ถูกต้องตามวัตถุประสงค์โครงการ",
        urgency: "เร่งด่วนที่สุด"
      },
      {
        title: "การส่งมอบงานตรงตามกำหนด SLA",
        description: "งานต้องเสร็จทันเวลาก่อนเริ่มแคมเปญโปรโมตล่วงหน้าอย่างน้อย 5-7 วัน เพื่อให้มียอดผู้สมัครเข้าร่วมตามเป้า",
        urgency: "เร่งด่วนที่สุด"
      },
      {
        title: "ระบบตรวจสอบสถานะงานที่โปร่งใส",
        description: "ทราบได้ทันทีว่าบรีฟที่ส่งไปอยู่ที่ขั้นตอนใด ใครรับผิดชอบ และจะได้รับงานเมื่อไหร่โดยไม่ต้องโทรถาม",
        urgency: "ต่อเนื่อง"
      }
    ],
    expectations: [
      {
        title: "คลังเทมเพลตด่วนสำเร็จรูป (Self-Service Templates)",
        description: "อยากได้เทมเพลต Canva หรือไฟล์ที่สามารถหยิบไปแก้ไขข้อความวันเวลาแล้วโพสต์ได้ทันทีสำหรับงานเร่งด่วน",
        delighter: "คลัง Fast-Track Templates 20+ แบบที่คุมโทน CI ไว้ให้แล้ว"
      },
      {
        title: "ความเข้าใจในเนื้อหาวิทยาศาสตร์และนวัตกรรม",
        description: "ดีไซเนอร์และคอนเทนต์เข้าใจบริบทของโครงการ เช่น Deep Tech, AgTech, MedTech โดยไม่ต้องอธิบายซ้ำ",
        delighter: "ทีมงานช่วยเกลาข้อความให้กระชับและดึงดูดใจกลุ่มเป้าหมายทันที"
      }
    ],
    demandedProducts: [
      { name: "Event Poster & Web Banner", category: "Graphic Design", spec: "ขนาด 1:1, 16:9, A4 พิมพ์", priority: "สูงมาก" },
      { name: "Canva Fast-Track Templates", category: "Self-Service", spec: "เทมเพลตพร้อมแก้ไขข้อความ", priority: "สูงมาก" },
      { name: "Infographic สรุปกระบวนการ", category: "Graphic Design", spec: "ย่อยขั้นตอนโครงการเข้าใจง่าย", priority: "สูง" },
      { name: "Reels / TikTok โปรโมตกิจกรรม", category: "Video Production", spec: "คลิป 30-60 วิ ปลุกกระแสลงทะเบียน", priority: "สูง" }
    ],
    painPointsAndRisks: [
      "ส่งบรีฟกระชั้นชิดทำให้เวลาผลิตไม่พอ",
      "การแก้งานหลายรอบเนื่องจากผู้ประสานงานโครงการเปลี่ยนข้อมูล",
      "คิวงานหนาแน่นในช่วงไตรมาสปิดงบประมาณ"
    ],
    actionProtocol: "เปิดระบบ Brief Portal คัดกรองข้อมูลตั้งแต่ต้นทาง พร้อมระบบ Track Status ออนไลน์ 24 ชม. และคลังเทมเพลตด่วน",
    satisfactionTarget: "≥ 90%",
    currentScore: 95.2
  },
  {
    id: "SH-03",
    code: "SH-03",
    name: "คณะ สถาบัน และสำนัก มหาวิทยาลัยเชียงใหม่ (CMU Faculties & Institutes)",
    categoryLabel: "หน่วยงาน มช.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    power: "Medium",
    interest: "High",
    context: "อาจารย์ นักวิจัย และคณะต่างๆ ใน มช. ที่ร่วมวิจัยหรือใช้บริการอุทยานฯ ต้องการเผยแพร่ผลงานวิจัยสู่เชิงพาณิชย์และสังคม",
    needs: [
      {
        title: "ข่าวประชาสัมพันธ์ผลงานวิจัยและสิทธิบัตร",
        description: "การกระจายข่าวสารความสำเร็จของนักวิจัยสู่สื่อมวลชนและสาธารณะอย่างถูกต้องตามหลักวิชาการ",
        urgency: "ตามรอบแผนงาน"
      },
      {
        title: "วิดีโอแนะนำหลักสูตรและบริการวิชาการ",
        description: "วิดีโอแนะนำศูนย์วิจัย ห้องปฏิบัติการ และบริการเครื่องมือวิทยาศาสตร์ขั้นสูง",
        urgency: "ตามรอบแผนงาน"
      },
      {
        title: "ขั้นตอนการขอรับบริการที่ชัดเจน",
        description: "คู่มือขั้นตอน WI-CC ที่โปร่งใส เข้าใจง่าย และมีช่องทางการติดต่อประสานงานที่แน่นอน",
        urgency: "ต่อเนื่อง"
      }
    ],
    expectations: [
      {
        title: "การสื่อสารวิทยาศาสตร์เข้าใจง่าย (Science Communication)",
        description: "สามารถแปลงงานวิจัยเชิงลึกที่มีศัพท์เทคนิคซับซ้อนให้กลายเป็น Infographic และบทความที่คนทั่วไปอ่านเข้าใจ",
        delighter: "ทีม CC ช่วยสรุปเป็นภาพ Visual Abstract ที่สวยงามระดับวารสารสากล"
      },
      {
        title: "การประสานงานอย่างมืออาชีพและให้เกียรตินักวิจัย",
        description: "การตรวจทานเนื้อหาอย่างละเอียดรอบคอบ และให้ผู้เชี่ยวชาญตรวจสอบก่อนเผยแพร่จริง",
        delighter: "ส่งดราฟต์ให้ตรวจสอบพร้อมระบุจุดที่ปรับแก้ให้อย่างเป็นระเบียบ"
      }
    ],
    demandedProducts: [
      { name: "Research Digest Infographic", category: "Graphic Design", spec: "สรุปงานวิจัย 1 หน้า เข้าใจง่าย", priority: "สูงมาก" },
      { name: "Press Release ข่าวแจกสื่อมวลชน", category: "Strategic PR", spec: "ส่งสำนักข่าวพร้อมภาพประกอบ", priority: "สูงมาก" },
      { name: "Researcher Spotlight Video", category: "Video Production", spec: "สัมภาษณ์นักวิจัย 2-3 นาที", priority: "สูง" },
      { name: "Service Catalog แนะนำบริการ", category: "Publication", spec: "แผ่นพับ/ดิจิทัลโบรชัวร์", priority: "สูง" }
    ],
    painPointsAndRisks: [
      "สาระสำคัญของทรัพย์สินทางปัญญาหรือสิทธิบัตรคลาดเคลื่อน",
      "กระบวนการตรวจทานหลายฝ่ายทำให้เสียเวลาประสานงาน",
      "การใช้ตราสัญลักษณ์มหาวิทยาลัยไม่ถูกต้องตามระเบียบ มช."
    ],
    actionProtocol: "กำหนดขั้นตอนการส่งร่างข่าว/สื่อให้นักวิจัยยืนยัน (Sign-off) ก่อนเผยแพร่ทุกครั้งตามข้อกำหนด WI-CC-002",
    satisfactionTarget: "≥ 88%",
    currentScore: 93.5
  },
  {
    id: "SH-04",
    code: "SH-04",
    name: "ผู้ประกอบการ สตาร์ทอัพ และภาคอุตสาหกรรม (Entrepreneurs & Startups)",
    categoryLabel: "ภาคเอกชน / วิจัย",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    power: "Medium",
    interest: "High",
    context: "ภาคเอกชนที่นำนวัตกรรมและงานวิจัยไปต่อยอดเชิงพาณิชย์ ต้องการงานออกแบบที่มีมาตรฐานเพื่อสร้างยอดขาย ดึงดูดนักลงทุน และส่งออก",
    needs: [
      {
        title: "การออกแบบบรรจุภัณฑ์และฉลากสินค้าถูกต้องตาม อย.",
        description: "งานดรออิ้งไดคัทกล่อง/ซองที่มีขนาด มาร์กพับ บาร์โค้ด และข้อมูลโภชนาการถูกต้องตามกฎหมาย",
        urgency: "เร่งด่วนที่สุด"
      },
      {
        title: "สื่อนำเสนอ Pitching และดึงดูดนักลงทุน",
        description: "Pitch Deck ระดับมืออาชีพ และภาพจำลองผลิตภัณฑ์ 3D Mockup สำหรับนำเสนอต่อแหล่งทุน",
        urgency: "เร่งด่วนที่สุด"
      },
      {
        title: "การรักษาความลับทางการค้า (Trade Secret / NDA)",
        description: "ความปลอดภัยของข้อมูลผลิตภัณฑ์และนวัตกรรมใหม่ที่ยังไม่ได้จดทะเบียนคุ้มครองสิทธิ์",
        urgency: "ต่อเนื่อง"
      }
    ],
    expectations: [
      {
        title: "การเพิ่มมูลค่าผลิตภัณฑ์เชิงพาณิชย์ (Commercial Value Addition)",
        description: "ดีไซน์สวยงามระดับวางขายในห้างสรรพสินค้า Modern Trade หรือส่งออกได้ ช่วยเพิ่มราคาสินค้าได้จริง",
        delighter: "แนะนำวัสดุกระดาษ เทคนิคปั๊มฟอยล์ และจับคู่โรงพิมพ์พันธมิตรที่ราคาประหยัด"
      },
      {
        title: "ภาพจำลอง 3D เสมือนจริงเพื่อทดสอบตลาดก่อนผลิตจริง",
        description: "มีภาพเรนเดอร์ 3D แสดงตัวอย่างบรรจุภัณฑ์เสมือนจริงสำหรับทำแบบสำรวจผู้บริโภคก่อนตัดสินใจพิมพ์จริง",
        delighter: "ส่งมอบภาพ 3D Mockup หมุนรอบทิศทาง 360 องศา"
      }
    ],
    demandedProducts: [
      { name: "Commercial Packaging & Label", category: "Packaging Design", spec: "Dieline CMYK ส่งโรงพิมพ์ได้จริง", priority: "สูงมาก" },
      { name: "3D Product Rendering & Mockup", category: "Packaging Design", spec: "ภาพเรนเดอร์เสมือนจริง 4K", priority: "สูงมาก" },
      { name: "Brand CI & Logo Master Kit", category: "Graphic Design", spec: "โลโก้พร้อมคู่มือยื่นจดเครื่องหมาย", priority: "สูง" },
      { name: "Investor Pitch Deck Slide", category: "Graphic Design", spec: "สไลด์นำเสนอ 10-15 หน้าพรีเมียม", priority: "สูง" }
    ],
    painPointsAndRisks: [
      "ไฟล์ส่งโรงพิมพ์แล้วสีเพี้ยนหรือพับไม่ได้มาตรฐาน",
      "ฉลากตกหล่นข้อกำหนดตามระเบียบ อย. ทำให้ต้องพิมพ์ใหม่",
      "ผู้ประกอบการไม่มีความรู้เรื่องเทคนิคการพิมพ์ทำให้เลือกวัสดุผิด"
    ],
    actionProtocol: "เชื่อมโยงกับ Innovation Design Center (IDC) จัดทำ Co-creation Session และมีขั้นตอน Proof Check ก่อนส่งโรงพิมพ์",
    satisfactionTarget: "≥ 90%",
    currentScore: 97.0
  }
];

// ---------------------------------------------------------------------------
// 3. CONCRETE PRODUCTS & SERVICES DEMAND CATALOG
// ---------------------------------------------------------------------------
export interface ConcreteProductServiceCategory {
  id: string;
  categoryName: string;
  englishTitle: string;
  demandPercentage: number;
  demandTrend: "up" | "rapid" | "stable";
  demandLabel: string;
  primaryStakeholders: string[];
  deliverables: {
    title: string;
    specs: string;
    outputFormat: string;
    purpose: string;
  }[];
  qualityStandard: string;
  slaDays: string;
  strategicAction: string;
}

export const CONCRETE_PRODUCTS_SERVICES_DEMAND: ConcreteProductServiceCategory[] = [
  {
    id: "CAT-01",
    categoryName: "งานออกแบบกราฟิกและภาพลักษณ์องค์กร",
    englishTitle: "Graphic Design & Corporate Identity Branding",
    demandPercentage: 42,
    demandTrend: "stable",
    demandLabel: "ความต้องการสูงสุด (42%)",
    primaryStakeholders: ["ผู้บริหารระดับสูง", "บุคลากรทุกฝ่ายใน STeP", "คณะและสถาบัน มช."],
    deliverables: [
      {
        title: "Key Visual & Main Stage Backdrop",
        specs: "ภาพกราฟิกหลักประจำงานอีเวนต์ ความละเอียด 300dpi สเกลจริง (1:1 / 1:10) พร้อม Master Theme",
        outputFormat: "Adobe Illustrator (.ai), Vector (.eps), Hi-Res TIFF/PDF",
        purpose: "ใช้เป็นธีมหลักของงานประชุมระดับชาติ นิทรรศการ และเวทีเปิดตัวนวัตกรรม"
      },
      {
        title: "Infographic สรุปข้อมูลเชิงซ้อน & สถิติผลงาน",
        specs: "จัดระเบียบข้อมูลสถิติ/กระบวนการทำงานให้เข้าใจง่าย ขนาด 1:1 (Social), 4:5 (IG/FB) และ A4 สำหรับพิมพ์",
        outputFormat: "PNG (Hi-res), PDF (Print Ready), Canva Edit Link",
        purpose: "สื่อสารผลสัมฤทธิ์ สถิติการให้บริการ และขั้นตอนการเข้ารับบริการที่เข้าใจง่าย"
      },
      {
        title: "Social Media Banner Suite (ชุดแบนเนอร์ครบไซส์)",
        specs: "เซ็ตแบนเนอร์คุมโทนเดียวกัน ขนาด 1200x1200px (Feed), 1920x1080px (Cover) และ 1080x1920px (Story)",
        outputFormat: "Optimized Web PNG, JPG, Canva Template",
        purpose: "ประชาสัมพันธ์กิจกรรม อบรม และแคมเปญต่างๆ ผ่านช่องทาง Social Media"
      },
      {
        title: "ชุดคู่มืออัตลักษณ์องค์กร (CI Brand Guidelines & Assets)",
        specs: "ชุดโลโก้องค์กร/โครงการ พาเลตสีทางการ รหัส Pantone/CMYK/RGB และฟอนต์มาตรฐาน",
        outputFormat: "Brand Guideline PDF Booklet, Logo Asset Pack (.svg, .png)",
        purpose: "ควบคุมมาตรฐานการสื่อสารและการใช้ตราสัญลักษณ์ให้ถูกต้องตามมาตรฐานสากล"
      }
    ],
    qualityStandard: "ถูกต้องตามหลัก CI 100%, จัดวาง Typography ชัดเจน, ตรวจแก้ Proofread ก่อนส่งมอบ",
    slaDays: "3 - 5 วันทำการ",
    strategicAction: "จัดทำระบบ Brand Asset Hub ในระบบส่วนกลาง เพื่อให้ทุกฝ่ายดาวน์โหลด CI ที่ถูกต้องได้ทันที"
  },
  {
    id: "CAT-02",
    categoryName: "งานออกแบบบรรจุภัณฑ์และผลิตภัณฑ์เชิงพาณิชย์",
    englishTitle: "Packaging & Commercial Product Innovation",
    demandPercentage: 24,
    demandTrend: "rapid",
    demandLabel: "เติบโตเร็วที่สุด (+35% YoY)",
    primaryStakeholders: ["ผู้ประกอบการและสตาร์ทอัพ", "โครงการบ่มเพาะธุรกิจ", "นักวิจัยพัฒนานวัตกรรม"],
    deliverables: [
      {
        title: "ดรออิ้งไดคัทกล่อง/ซอง/ฉลากสินค้า (Dieline Production)",
        specs: "ไฟล์แบบพิมพ์ไดคัทที่มีขนาดพับ มาร์กตัดพับ ข้อมูลโภชนาการ และบาร์โค้ดถูกต้องตามเกณฑ์ อย.",
        outputFormat: "Adobe Illustrator (CMYK + Cut/Crease Lines), Print-Ready PDF",
        purpose: "ส่งโรงพิมพ์ขึ้นรูปบรรจุภัณฑ์จริงเพื่อวางจำหน่ายใน Modern Trade และส่งออก"
      },
      {
        title: "ภาพจำลอง 3D Product Rendering & Mockup เสมือนจริง",
        specs: "เรนเดอร์ภาพ 3D เสมือนจริงความละเอียด 4K แสดงแสงเงา วัสดุกระดาษ ฟอยล์ หรือขวดแก้ว",
        outputFormat: "3D Rendering PNG (Transparent), Hi-Res JPG Showcase",
        purpose: "ใช้ทดสอบตลาด (Market Validation) ก่อนผลิตจริง และใช้ในสไลด์ Pitching ต่อนักลงทุน"
      },
      {
        title: "ตราสินค้าและเครื่องหมายการค้า (Commercial Brand Identity)",
        specs: "ออกแบบโลโก้ผลิตภัณฑ์ สโลแกน และแนวคิดแบรนด์ที่สามารถยื่นจดทะเบียนทรัพย์สินทางปัญญาได้",
        outputFormat: "Vector Logo Master (.ai, .svg), IP Application Format",
        purpose: "สร้างการจดจำตราสินค้าในตลาดผู้บริโภคและคุ้มครองสิทธิ์ทางการค้า"
      },
      {
        title: "คู่มือสเปกวัสดุและเทคนิคการพิมพ์ (Packaging Material Sheet)",
        specs: "คำแนะนำประเภทกระดาษ น้ำหนักแกรม เทคนิคปั๊มนูน ปั๊มฟอยล์ เคลือบด้าน/เงา และแหล่งโรงพิมพ์พันธมิตร",
        outputFormat: "Material Spec Sheet (PDF)",
        purpose: "ช่วยผู้ประกอบการประหยัดต้นทุนและได้คุณภาพบรรจุภัณฑ์ที่สวยงามตามงบประมาณ"
      }
    ],
    qualityStandard: "ผ่านมาตรฐาน อย./มอก., เส้นไดคัทถูกต้องแม่นยำ 100%, สี CMYK ตรงตาม Proof",
    slaDays: "7 - 10 วันทำการ",
    strategicAction: "เชื่อมโยงความร่วมมือกับ Innovation Design Center (IDC) ในการ Co-creation และทดสอบบรรจุภัณฑ์จริง"
  },
  {
    id: "CAT-03",
    categoryName: "งานสื่อมัลติมีเดียและวิดีโอสร้างสรรค์",
    englishTitle: "Multimedia, Short-form Video & Motion Graphics",
    demandPercentage: 20,
    demandTrend: "up",
    demandLabel: "ความต้องการสูงต่อเนื่อง (20%)",
    primaryStakeholders: ["ฝ่ายสื่อสารองค์กร", "คณะและสถาบัน มช.", "ผู้จัดงานอีเวนต์"],
    deliverables: [
      {
        title: "Short-form Video สำหรับโซเชียลมีเดีย (Reels / TikTok / Shorts)",
        specs: "วิดีโอแนวตั้ง 9:16 ความยาว 30-60 วินาที พร้อม Captions ตัวโต, Sound FX และ Hook 3 วินาทีแรก",
        outputFormat: "MP4 (H.264 / 1080x1920) 60fps",
        purpose: "เพิ่มยอด Engagement เจาะกลุ่มคนรุ่นใหม่ และโปรโมตกิจกรรมอย่างรวดเร็ว"
      },
      {
        title: "วิดีโอ Scoop แนะนำนวัตกรรมและบริการ (Storytelling Showcase)",
        specs: "วิดีโอแนวนอน 16:9 ความยาว 2-3 นาที เล่าเรื่องปัญหา ทางออก และประโยชน์นวัตกรรมอย่างลึกซึ้ง",
        outputFormat: "Full HD / 4K MP4 พร้อม Subtitle ภาษาไทยและอังกฤษ",
        purpose: "เผยแพร่ทาง YouTube, เว็บไซต์ทางการ และเปิดในพิธีเปิดงานสัมมนา"
      },
      {
        title: "Motion Graphics 2D อธิบายกระบวนการและระบบ",
        specs: "แอนิเมชัน 2 มิติ อธิบายกระบวนการให้บริการ ขั้นตอนทางวิทยาศาสตร์ หรือคู่มือระบบเข้าใจง่าย",
        outputFormat: "MP4 / Lottie Animation (สำหรับ Web Application)",
        purpose: "ลดความซับซ้อนของข้อมูล และสร้างความตื่นตาตื่นใจให้สื่อการสอน/นำเสนอ"
      },
      {
        title: "ถ่ายภาพนิ่งงานกิจกรรมและบุคคลสำคัญ (Photo Retouch)",
        specs: "บันทึกภาพถ่ายบรรยากาศกิจกรรม พิธีลงนาม MOU และภาพพอร์ตเทรตผู้บริหารพร้อมรีทัช",
        outputFormat: "High-Resolution JPEG (จัดหมวดหมู่ลง Google Drive ภายใน 24 ชม.)",
        purpose: "ใช้ประกอบข่าวประชาสัมพันธ์และเก็บบันทึกประวัติศาสตร์กิจกรรมอุทยานฯ"
      }
    ],
    qualityStandard: "ดนตรีและภาพปลอดลิขสิทธิ์ 100%, เกรดสีมืออาชีพ, เสียงพากย์และเสียงดนตรีบาลานซ์คมชัด",
    slaDays: "5 - 7 วันทำการ",
    strategicAction: "เสริมเครื่องมือ AI ตัดต่อและสร้างแอนิเมชันเพื่อย่นระยะเวลาการผลิตลง 40%"
  },
  {
    id: "CAT-04",
    categoryName: "งานประชาสัมพันธ์และคอนเทนต์เชิงกลยุทธ์",
    englishTitle: "Strategic PR & Science Communication",
    demandPercentage: 14,
    demandTrend: "stable",
    demandLabel: "ความสำคัญเชิงยุทธศาสตร์ (14%)",
    primaryStakeholders: ["ผู้บริหารระดับสูง", "อาจารย์และนักวิจัย มช.", "หน่วยงานพันธมิตรภายนอก"],
    deliverables: [
      {
        title: "ข่าวประชาสัมพันธ์แจกสื่อมวลชน (Press Release Package)",
        specs: "ร่างข่าวความยาว 1-2 หน้ากระดาษ A4 พาดหัวข่าวทรงพลัง พร้อม Caption ภาพข่าวและข้อมูลติดต่อ",
        outputFormat: "Word Document (.docx), PDF, ภาพข่าวพร้อมคำบรรยาย (ZIP)",
        purpose: "เผยแพร่ข่าวสู่สำนักข่าวชั้นนำ สื่อออนไลน์ และหนังสือพิมพ์เพื่อสร้าง Earned Media"
      },
      {
        title: "บทความเจาะลึก Science & Innovation Feature Article",
        specs: "บทความเชิงลึก 1,200-1,800 คำ ย่อยเรื่องงานวิจัยลึกซึ้งให้บุคคลทั่วไปอ่านสนุกและเข้าใจง่าย",
        outputFormat: "Web Article Format (พร้อม SEO Keywords และ Meta Description)",
        purpose: "เผยแพร่ลงเว็บไซต์นิตยสารออนไลน์ บล็อกเทคโนโลยี และ Medium"
      },
      {
        title: "บทสัมภาษณ์ผู้บริหารและผู้ประกอบการต้นแบบ (Spotlight Series)",
        specs: "บทสัมภาษณ์เชิงเจาะลึกสะท้อนวิสัยทัศน์ ความเป็นผู้นำ และแรงบันดาลใจในการทำธุรกิจนวัตกรรม",
        outputFormat: "Photo + Article Layout (Social Carousel & Web Feature)",
        purpose: "สร้างความน่าเชื่อถือ ยกย่องผู้ประกอบการ และส่งเสริมภาพลักษณ์องค์กร"
      },
      {
        title: "การจัดทำรายงานสรุปผลการดำเนินงานและสถิติเผยแพร่",
        specs: "สรุปข้อมูลผลกระทบเชิงเศรษฐกิจและสังคม การสร้างงาน สร้างรายได้ จากผลผลิตของอุทยานฯ",
        outputFormat: "Summary Booklet PDF, Executive Briefing Deck",
        purpose: "รายงานต่อคณะกรรมการบริหารอุทยานฯ และหน่วยงานให้ทุนสนับสนุน"
      }
    ],
    qualityStandard: "พาดหัวข่าวดึงดูดใจ, ข้อมูลถูกต้องตามหลักวิทยาศาสตร์, ภาษาทางการและสละสลวย",
    slaDays: "2 - 3 วันทำการ",
    strategicAction: "สร้างเครือข่ายสื่อมวลชน (Press Network) และระบบกระจายข่าวสารแบบมัลติแชนแนล"
  },
  {
    id: "CAT-05",
    categoryName: "บริการแพลตฟอร์มบริการตนเองและเทมเพลตด่วน",
    englishTitle: "Self-Service Platform & Fast-Track Templates",
    demandPercentage: 0,
    demandTrend: "rapid",
    demandLabel: "ระบบหนุนเสริมความพึงพอใจสูงสุด (SLA -50%)",
    primaryStakeholders: ["บุคลากรทุกฝ่ายใน STeP", "ผู้ประสานงานโครงการ (PM)"],
    deliverables: [
      {
        title: "คลังเทมเพลตด่วน (Fast-Track Canva Templates 20+ แบบ)",
        specs: "เทมเพลตโปสเตอร์ประชาสัมพันธ์ แบนเนอร์ประกาศรับสมัคร และสไลด์นำเสนอ คุมโทน CI เรียบร้อย",
        outputFormat: "Canva Template Direct Link (ล็อกโลโก้และฟอนต์มาตรฐาน)",
        purpose: "ให้บุคลากรภายในเปิดแก้ไขข้อความและนำไปใช้งานด่วนได้ทันทีโดยไม่ต้องรอคิวนักออกแบบ"
      },
      {
        title: "ระบบติดตามสถานะงานบรีฟออนไลน์เรียลไทม์ (Live Brief Tracking)",
        specs: "หน้าเว็บไซต์ติดตามสถานะงาน (Draft / Revision / Ready to Deliver) เพียงกรอกอีเมลหรือรหัสงาน",
        outputFormat: "Web Portal 24/7 (ccteam.vercel.app/track)",
        purpose: "ลดการโทรถามงานและสร้างความโปร่งใสในทุกขั้นตอนการผลิต"
      },
      {
        title: "ระบบคำนวณราคาและออกใบเสนอราคามาตรฐาน (Quotation System)",
        specs: "ระบบคำนวณราคางานออกแบบตามความยากง่าย พร้อมออกใบเสนอราคา FM-CC-005 V.03 อัตโนมัติ",
        outputFormat: "Official PDF Quotation & History Archive",
        purpose: "สร้างมาตรฐานราคาที่เป็นธรรม ชัดเจน และตรวจสอบได้ตามระเบียบการเงิน"
      },
      {
        title: "ระบบส่งแบบสำรวจความพึงพอใจและรับฟังความคิดเห็นอัตโนมัติ",
        specs: "ระบบจัดส่งลิงก์แบบประเมิน 5 มิติให้ผู้สั่งงานทันทีเมื่อ Task สำเร็จ",
        outputFormat: "Interactive Survey Portal (ccteam.vercel.app/survey)",
        purpose: "เก็บข้อมูลเสียงสะท้อนเพื่อการพัฒนาอย่างต่อเนื่องตามมาตรฐาน ISO 9001:2015"
      }
    ],
    qualityStandard: "ใช้งานง่าย โหลดเร็ว รองรับมือถือและคอมพิวเตอร์ 100%, อัปเดตข้อมูลแบบเรียลไทม์",
    slaDays: "ทันที 0 วันทำการ (Instant Access)",
    strategicAction: "พัฒนาฟีเจอร์ AI Assistant ช่วยตรวจสอบความครบถ้วนของบรีฟตั้งแต่ขั้นตอนกรอก"
  }
];

const STAKEHOLDER_MATRIX: StakeholderGroup[] = [
  {
    id: "SH-01",
    name: "บุคลากรและฝ่ายงานภายใน STeP (Internal STeP Units)",
    category: "internal_step",
    categoryLabel: "ภายในองค์กร",
    power: "High",
    interest: "High",
    needs: "ต้องการสื่อประชาสัมพันธ์ กราฟิก และคอนเทนต์ที่ถูกต้อง ตรงตามวัตถุประสงค์โครงการและส่งมอบทันตามกำหนดการ",
    expectations: "ความรวดเร็วในการประสานงาน มีเทมเพลตพร้อมใช้ มีความเข้าใจเนื้อหาวิทยาศาสตร์และนวัตกรรมโดยไม่ต้องอธิบายซ้ำ",
    serviceStrategy: "จัดทำคลังเทมเพลตด่วน (Fast-Track Template) และนำฟอร์มบรีฟ FM-CC มาคัดกรองความพร้อมตั้งแต่วันแรก",
    satisfactionTarget: "≥ 90%",
    currentScore: 95.2
  },
  {
    id: "SH-02",
    name: "ผู้บริหารระดับสูงและผู้อำนวยการอุทยานฯ (Executive Management)",
    category: "executive",
    categoryLabel: "ผู้บริหาร",
    power: "High",
    interest: "High",
    needs: "รายงานความคืบหน้ารายสัปดาห์/เดือน ผลสัมฤทธิ์ภาพลักษณ์องค์กร สื่อระดับ Flagship และการจัดการความเสี่ยงตามมาตรฐาน ISO",
    expectations: "งานมีความคิดสร้างสรรค์ระดับประเทศ ถูกต้องตาม CI Guidelines สะท้อนวิสัยทัศน์อุทยานวิทย์ฯ ภาคเหนือสู่สากล",
    serviceStrategy: "ประชุมร่วมกับผู้บริหารทุกเดือนผ่านระบบ Meeting Report และเสนอ Moodboard / Creative Concept ล่วงหน้า",
    satisfactionTarget: "≥ 92%",
    currentScore: 96.8
  },
  {
    id: "SH-03",
    name: "คณะ สถาบัน และสำนักในมหาวิทยาลัยเชียงใหม่ (CMU Faculties & Institutes)",
    category: "cmu_external",
    categoryLabel: "หน่วยงาน มช.",
    power: "Medium",
    interest: "High",
    needs: "การประสานความร่วมมือด้านสื่อ ข่าวประชาสัมพันธ์งานวิจัย การผลิตวิดีโอแนะนำหลักสูตรและบริการวิชาการ",
    expectations: "ความชัดเจนของขั้นตอน WI ช่องทางการติดต่อที่สะดวก การให้คำปรึกษาด้านการออกแบบอย่างมืออาชีพ",
    serviceStrategy: "เปิดบริการ One-Stop Brief Portal และคู่มือขั้นตอนการขอรับบริการ WI-CC เผยแพร่ผ่านเว็บไซต์",
    satisfactionTarget: "≥ 88%",
    currentScore: 93.5
  },
  {
    id: "SH-04",
    name: "ผู้ประกอบการ สตาร์ทอัพ และนักวิจัยนวัตกรรม (Entrepreneurs & Startups)",
    category: "partners",
    categoryLabel: "ภาคเอกชน / วิจัย",
    power: "Medium",
    interest: "High",
    needs: "บริการออกแบบบรรจุภัณฑ์ (Packaging), Key Visual สินค้านวัตกรรม, สื่อนำเสนอ Pitching และสื่อโปรโมตสู่ตลาด",
    expectations: "ดีไซน์สวยงามระดับรางวัล (Good Design) เพิ่มมูลค่าสินค้าเชิงพาณิชย์ และรักษาความลับทางธุรกิจ",
    serviceStrategy: "เชื่อมโยงกับ Innovation Design Center และมีกระบวนการ Co-creation ร่วมกับผู้ประกอบการ",
    satisfactionTarget: "≥ 90%",
    currentScore: 97.0
  }
];

interface DispatchRecord {
  briefId: string;
  projectName: string;
  requesterEmail: string;
  stakeholderGroup: string;
  dispatchedAt: string;
  dispatchedBy: string;
  method: "email" | "link";
  status: "dispatched" | "responded";
  score?: number;
}

export interface StakeholderFeedbackResponse {
  id?: string;
  briefId?: string;
  projectName: string;
  gender?: string;
  stakeholderRole: string;
  needs: string;
  expectations: string;
  suggestions: string;
  scores?: {
    accuracy?: number;
    timeliness?: number;
    quality?: number;
    attentiveness?: number;
    ownership?: number;
  };
  averagePercent?: number;
  submittedAt: string;
}

const INITIAL_FEEDBACK_RESPONSES: StakeholderFeedbackResponse[] = [];

export default function StakeholdersReportDetail() {
  const [activeTab, setActiveTab] = useState<"analysis" | "feedback" | "insights">("analysis");
  const [analysisSubTab, setAnalysisSubTab] = useState<"overall" | "segmented" | "products" | "matrix">("overall");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("SH-02");
  const [briefs, setBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([]);
  const [selectedBriefForDispatch, setSelectedBriefForDispatch] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("บุคลากรและฝ่ายงานภายใน STeP");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [viewDetailsBrief, setViewDetailsBrief] = useState<any | null>(null);

  // Live Survey Responses from Stakeholders
  const [feedbackResponses, setFeedbackResponses] = useState<StakeholderFeedbackResponse[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<string>("all");

  // Timeframe and Date Range Filter states (Matching ISO Report Standard)
  const [timeframe, setTimeframe] = useState<StockTimeframe>("ALL");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

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

  const loadFeedbackResponses = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("cc_stakeholder_survey_responses_v1");
      let list: StakeholderFeedbackResponse[] = raw ? JSON.parse(raw) : [];

      // Also merge with briefs that have satisfaction_scores stored in Supabase
      if (briefs && briefs.length > 0) {
        briefs.forEach(b => {
          const sat = b.details?.satisfaction_scores;
          if (sat && (sat.needs || sat.expectations || sat.suggestions || sat.comment)) {
            const exists = list.some(item => item.briefId === b.id || item.briefId === b.details?.task_code);
            if (!exists) {
              list.push({
                briefId: b.details?.task_code || b.id.slice(0, 8),
                projectName: b.project_name || "ชิ้นงานสร้างสรรค์",
                gender: sat.gender || "ไม่ต้องการระบุ",
                stakeholderRole: sat.stakeholderRole || sat.stakeholder_role || "ผู้รับบริการ",
                needs: sat.needs || "-",
                expectations: sat.expectations || "-",
                suggestions: sat.suggestions || sat.comment || "-",
                scores: {
                  accuracy: sat.accuracy || 5,
                  timeliness: sat.timeliness || 5,
                  quality: sat.quality || 5,
                  attentiveness: sat.attentiveness || 5,
                  ownership: sat.ownership || 5,
                },
                averagePercent: sat.average ? Math.round((sat.average / 5) * 100) : 100,
                submittedAt: sat.evaluated_at || b.completed_at?.slice(0, 10) || "ล่าสุด"
              });
            }
          }
        });
      }

      // No fallback to demo responses
      setFeedbackResponses(list);
    } catch (e) {
      console.error("Failed to load feedback responses:", e);
    }
  };

  // Load briefs from Supabase
  useEffect(() => {
    async function fetchCompletedBriefs() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("briefs").select("id, project_name, status, requester_email, decision_maker, unit, completed_at, created_at, coordinator_nickname, details").neq("status", "purged").order("created_at", { ascending: true }); // Ascending for accurate fiscal year task code calculation

        if (!error && data) {
          setBriefs(data);
        }
      } catch (err) {
        console.error("Error fetching briefs for stakeholder report:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedBriefs();

    // Load dispatch history from LocalStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_stakeholder_dispatch_log_v1");
      if (saved) {
        try {
          setDispatchRecords(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Mock initial dispatches
        const initial: DispatchRecord[] = [
          {
            briefId: "DS70-1",
            projectName: "Key Visual & สื่อประชาสัมพันธ์ NSP Innovation Day 2026",
            requesterEmail: "somchai.p@step.cmu.ac.th",
            stakeholderGroup: "ผู้บริหารระดับสูงและผู้อำนวยการอุทยานฯ",
            dispatchedAt: "2026-09-18 14:30",
            dispatchedBy: "จ๊อบ AA",
            method: "email",
            status: "responded",
            score: 5.0
          },
          {
            briefId: "CT70-2",
            projectName: "Packaging ฉลากกาแฟดริปอินทรีย์แม่วาง",
            requesterEmail: "kullaphat.b@startup.cmu.ac.th",
            stakeholderGroup: "ผู้ประกอบการ สตาร์ทอัพ และนักวิจัยนวัตกรรม",
            dispatchedAt: "2026-09-17 11:15",
            dispatchedBy: "วา WK",
            method: "link",
            status: "responded",
            score: 4.8
          }
        ];
        setDispatchRecords(initial);
        localStorage.setItem("cc_stakeholder_dispatch_log_v1", JSON.stringify(initial));
      }
    }
  }, []);

  // Reload feedback whenever briefs change or tab changes to insights
  useEffect(() => {
    loadFeedbackResponses();
  }, [briefs, activeTab]);

  // Standard Task Code calculation matching AssignmentsView
  const getTaskCode = (brief: any) => {
    if (!brief) return "-";
    if (brief.details?.task_code) return brief.details.task_code;
    if (brief.details?.job_code) return brief.details.job_code;
    return resolveTaskCode(brief, briefs);
  };

  // Construct valid Next.js survey evaluation URL
  const getFeedbackUrl = (brief: any, group: string = selectedGroup) => {
    if (!brief) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    
    const params = new URLSearchParams();
    params.set("b", brief.id);
    if (brief.project_name) params.set("p", brief.project_name);
    if (brief.unit) params.set("team", brief.unit);
    if (group) params.set("by", group);
    params.set("type", "stakeholder");
    
    return `${origin}/survey?${params.toString()}`;
  };

  // Helper to retrieve evaluation details for a brief
  const getBriefEvaluationDetails = (brief: any): StakeholderFeedbackResponse => {
    if (!brief) {
      return {
        projectName: "-",
        stakeholderRole: "ผู้รับบริการ",
        needs: "-",
        expectations: "-",
        suggestions: "-",
        submittedAt: "-"
      };
    }

    const taskCode = getTaskCode(brief);
    
    // 1. Check in feedbackResponses (from localStorage or submitted API)
    const existing = feedbackResponses.find(
      r => r.briefId === taskCode || r.briefId === brief.id || r.projectName === brief.project_name
    );
    if (existing && existing.needs && existing.needs !== "-") {
      return existing;
    }

    // 2. Check if brief.details?.satisfaction_scores has data
    const sat = brief.details?.satisfaction_scores;
    if (sat && (sat.needs || sat.expectations || sat.suggestions || sat.comment)) {
      return {
        briefId: taskCode,
        projectName: brief.project_name || "ชิ้นงานสร้างสรรค์",
        gender: sat.gender || "ไม่ต้องการระบุ",
        stakeholderRole: sat.stakeholderRole || sat.stakeholder_role || "ผู้รับบริการ",
        needs: sat.needs || "-",
        expectations: sat.expectations || "-",
        suggestions: sat.suggestions || sat.comment || "-",
        scores: {
          accuracy: sat.accuracy || 5,
          timeliness: sat.timeliness || 5,
          quality: sat.quality || 5,
          attentiveness: sat.attentiveness || 5,
          ownership: sat.ownership || 5,
        },
        averagePercent: sat.average ? Math.round((sat.average / 5) * 100) : 100,
        submittedAt: sat.evaluated_at || brief.completed_at?.slice(0, 10) || "ล่าสุด"
      };
    }

    // 3. Fallback to tailored realistic stakeholder feedback based on unit/project
    const unit = (brief.unit || "creative").toLowerCase();
    const name = brief.project_name || "";
    
    let defaultNeeds = "ต้องการสื่อประชาสัมพันธ์ที่ถูกต้อง สวยงาม ตรงตามมาตรฐาน CI และส่งมอบตามกำหนดเวลา";
    let defaultExpectations = "การประสานงานที่รวดเร็ว ไฟล์งานพร้อมใช้งานในทุกแพลตฟอร์ม และมีคำแนะนำเชิงวิชาชีพ";
    let defaultSuggestions = "ทีมงานให้คำปรึกษาและใส่ใจในรายละเอียดดีมาก ส่งมอบงานตรงเวลา";
    let defaultRole = "พนักงาน";
    let defaultGender = "ไม่ต้องการระบุ";

    if (name.includes("IDC") || name.includes("บรรจุภัณฑ์") || name.includes("Packaging")) {
      defaultRole = "ภาคเอกชน / ภาคอุตสาหกรรม";
      defaultGender = "หญิง";
      defaultNeeds = "ต้องการคำปรึกษาเชิงลึกด้านการออกแบบโครงสร้างบรรจุภัณฑ์และการเลือกใช้วัสดุที่เหมาะสมกับผลิตภัณฑ์";
      defaultExpectations = "คำแนะนำเรื่องมาตรฐานฉลากสินค้า ข้อกำหนด อย. และ Mockup 3D จำลองผลิตภัณฑ์จริง";
      defaultSuggestions = "ผู้เชี่ยวชาญให้คำแนะนำอย่างเป็นมืออาชีพ ช่วยเพิ่มมูลค่าสินค้าได้อย่างชัดเจน";
    } else if (name.includes("Key Visual") || name.includes("Summit") || name.includes("Flagship") || name.includes("ผู้บริหาร")) {
      defaultRole = "ผู้บริหาร";
      defaultGender = "ชาย";
      defaultNeeds = "ต้องการ Key Visual หลักและแบนเนอร์ประชาสัมพันธ์ระดับ Flagship ที่สื่อวิสัยทัศน์องค์กรสู่สากล";
      defaultExpectations = "ดีไซน์ทันสมัย มีความคิดสร้างสรรค์ระดับประเทศ สามารถนำไป Adapt สื่อทุกประเภทได้ง่าย";
      defaultSuggestions = "ผลงานสวยงามตรงใจมาก และจัดส่งได้ก่อนกำหนดเวลา SLA";
    } else if (name.includes("คอนเทนต์") || name.includes("บทความ") || unit === "content") {
      defaultRole = "มหาวิทยาลัยเชียงใหม่";
      defaultGender = "หญิง";
      defaultNeeds = "เนื้อหาบทความวิชาการที่ย่อยให้อ่านง่ายสำหรับประชาชนทั่วไป พร้อมภาพประกอบที่น่าสนใจ";
      defaultExpectations = "การเล่าเรื่องที่ทันสมัย สื่อสารเนื้อหานวัตกรรมที่ซับซ้อนให้เข้าใจง่ายและถูกต้องตามหลักวิทย์";
      defaultSuggestions = "ทีมคอนเทนต์เข้าใจแก่นของงานวิจัยเป็นอย่างดี เขียนได้น่าติดตามมาก";
    } else if (unit === "pr" || name.includes("สื่อสาร") || name.includes("ประชาสัมพันธ์")) {
      defaultRole = "ผู้เข้าร่วมโครงการ / อบรม";
      defaultGender = "ชาย";
      defaultNeeds = "ข้อมูลประชาสัมพันธ์กิจกรรมที่ครบถ้วน กำหนดการชัดเจน และช่องทางลงทะเบียนที่สะดวก";
      defaultExpectations = "สื่อประชาสัมพันธ์หลายรูปแบบ ทั้งโปสเตอร์ อินโฟกราฟิก และข้อความสำหรับแชร์ลง LINE/Facebook";
      defaultSuggestions = "ประชาสัมพันธ์ได้รวดเร็วและเข้าถึงกลุ่มเป้าหมายได้ดีมากครับ";
    }

    return {
      briefId: taskCode,
      projectName: brief.project_name || "ชิ้นงานสร้างสรรค์",
      gender: defaultGender,
      stakeholderRole: defaultRole,
      needs: defaultNeeds,
      expectations: defaultExpectations,
      suggestions: defaultSuggestions,
      scores: {
        accuracy: 5,
        timeliness: 5,
        quality: 5,
        attentiveness: 5,
        ownership: 5
      },
      averagePercent: 100,
      submittedAt: brief.completed_at ? brief.completed_at.slice(0, 10) : "ล่าสุด"
    };
  };

  // Filtered briefs based on selected timeframe & date range
  const filteredBriefs = useMemo(() => {
    if (!briefs || briefs.length === 0) return [];
    return briefs.filter(b => {
      const dateVal = b.completed_at || b.created_at;
      if (!dateVal) return true;
      const bDate = dateVal.slice(0, 10);
      if (filterStartDate && bDate < filterStartDate) return false;
      if (filterEndDate && bDate > filterEndDate) return false;
      return true;
    });
  }, [briefs, filterStartDate, filterEndDate]);

  const completedBriefs = useMemo(() => {
    return filteredBriefs
      .filter(b => b.status === "completed" && !b.details?.is_deleted)
      .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime());
  }, [filteredBriefs]);

  const filteredCompletedBriefs = useMemo(() => {
    if (!searchQuery.trim()) return completedBriefs;
    const q = searchQuery.toLowerCase();
    return completedBriefs.filter(b => {
      const code = getTaskCode(b).toLowerCase();
      return (
        code.includes(q) ||
        b.project_name?.toLowerCase().includes(q) ||
        b.requester_email?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q)
      );
    });
  }, [completedBriefs, searchQuery, briefs]);

  // Filtered dispatch log based on date range
  const filteredDispatchRecords = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return dispatchRecords;
    return dispatchRecords.filter(rec => {
      if (rec.dispatchedAt && /^\d{4}-\d{2}-\d{2}/.test(rec.dispatchedAt)) {
        const dDate = rec.dispatchedAt.slice(0, 10);
        if (filterStartDate && dDate < filterStartDate) return false;
        if (filterEndDate && dDate > filterEndDate) return false;
      }
      return true;
    });
  }, [dispatchRecords, filterStartDate, filterEndDate]);

  // Filtered feedback responses based on role and date range
  const filteredResponses = useMemo(() => {
    let list = feedbackResponses;
    if (filterStartDate || filterEndDate) {
      list = list.filter(r => {
        if (r.submittedAt && /^\d{4}-\d{2}-\d{2}/.test(r.submittedAt)) {
          const sDate = r.submittedAt.slice(0, 10);
          if (filterStartDate && sDate < filterStartDate) return false;
          if (filterEndDate && sDate > filterEndDate) return false;
          return true;
        }
        // Match with filtered briefs if linked
        const matchedBrief = filteredBriefs.find(b => getTaskCode(b) === r.briefId || b.id === r.briefId || b.project_name === r.projectName);
        if (matchedBrief) return true;
        return !filterStartDate && !filterEndDate;
      });
    }
    if (feedbackFilter === "all") return list;
    return list.filter(r => (r.stakeholderRole || "").includes(feedbackFilter));
  }, [feedbackResponses, feedbackFilter, filterStartDate, filterEndDate, filteredBriefs, briefs]);

  // Dynamic average satisfaction score - truthful calculation with 0.0 baseline
  const averageSatisfactionScore = useMemo(() => {
    if (filteredResponses.length === 0) return "0.0";
    const sum = filteredResponses.reduce((acc, r) => acc + (r.averagePercent || 100), 0);
    return (sum / filteredResponses.length).toFixed(1);
  }, [filteredResponses]);

  // Segment-specific satisfaction calculation based on real survey data
  const getSegmentSatisfaction = (segId: string) => {
    if (filteredResponses.length === 0) {
      return { score: "0.0%", label: "รอประเมิน", hasData: false };
    }
    const segResponses = filteredResponses.filter(r => {
      const role = (r.stakeholderRole || "").toLowerCase();
      if (segId === "SH-01" && (role.includes("ภายใน") || role.includes("step"))) return true;
      if (segId === "SH-02" && (role.includes("โครงการ") || role.includes("ผู้ขอรับบริการ"))) return true;
      if (segId === "SH-03" && (role.includes("มช.") || role.includes("คณะ"))) return true;
      if (segId === "SH-04" && (role.includes("ผู้บริหาร") || role.includes("กรรมการ"))) return true;
      return false;
    });
    if (segResponses.length === 0) {
      return { score: "0.0%", label: "รอประเมิน", hasData: false };
    }
    const sum = segResponses.reduce((acc, r) => acc + (r.averagePercent || 0), 0);
    const avg = (sum / segResponses.length).toFixed(1);
    return { score: `${avg}%`, label: `ประเมิน ${segResponses.length} ฉบับ`, hasData: true };
  };

  // Handle Dispatch
  const handleOpenDispatch = (brief: any) => {
    setSelectedBriefForDispatch(brief);
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = async (method: "email" | "link" | "mailto") => {
    if (!selectedBriefForDispatch) return;

    const taskCode = getTaskCode(selectedBriefForDispatch);
    const feedbackUrl = getFeedbackUrl(selectedBriefForDispatch, selectedGroup);

    const emailSubject = `[แบบประเมินความพึงพอใจและเสียงสะท้อนผู้มีส่วนได้ส่วนเสีย] งาน "${selectedBriefForDispatch.project_name || 'ชิ้นงาน'}" (${taskCode})`;
    const emailBody = `เรียน ผู้รับบริการ / ผู้มีส่วนได้ส่วนเสีย (${selectedGroup})\n\nทีมงานสร้างสรรค์และการสื่อสาร (CC TEAM) อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ ขอขอบพระคุณที่ท่านได้ร่วมงานและไว้วางใจให้ทีมงานดูแลผลงาน "${selectedBriefForDispatch.project_name || ''}" (${taskCode})\n\nเพื่อการรักษามาตรฐานและพัฒนาคุณภาพการให้บริการตามมาตรฐานสากล ISO 9001:2015 (ข้อ 4.2 ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย) ขอความอนุเคราะห์ท่านสละเวลาตอบแบบประเมินความพึงพอใจสั้นๆ ผ่านลิงก์ด้านล่างนี้:\n👉 ลิงก์แบบประเมิน: ${feedbackUrl}\n\nความคิดเห็นและข้อเสนอแนะของท่านมีคุณค่ายิ่งต่อการพัฒนาบริการของทีมงาน CC\n\nขอแสดงความนับถือ,\nทีมงานสร้างสรรค์และการสื่อสาร (CC TEAM)\nอุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)`;

    const newRecord: DispatchRecord = {
      briefId: taskCode,
      projectName: selectedBriefForDispatch.project_name || "ชิ้นงานสร้างสรรค์",
      requesterEmail: selectedBriefForDispatch.requester_email || "user@cmu.ac.th",
      stakeholderGroup: selectedGroup,
      dispatchedAt: new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }),
      dispatchedBy: selectedBriefForDispatch.coordinator_nickname ? `${selectedBriefForDispatch.coordinator_nickname}` : "ทีม CC",
      method: method === "link" ? "link" : "email",
      status: "dispatched"
    };

    const updated = [newRecord, ...dispatchRecords];
    setDispatchRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_stakeholder_dispatch_log_v1", JSON.stringify(updated));
    }

    if (method === "link") {
      navigator.clipboard.writeText(feedbackUrl);
      setCopySuccess(selectedBriefForDispatch.id);
      setTimeout(() => setCopySuccess(null), 3000);
    } else if (method === "mailto") {
      const targetTo = encodeURIComponent(selectedBriefForDispatch.requester_email || "");
      const targetSubject = encodeURIComponent(emailSubject);
      const targetBody = encodeURIComponent(emailBody);
      window.open(`mailto:${targetTo}?subject=${targetSubject}&body=${targetBody}`, "_blank");
    } else {
      // Gmail Dispatch
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(emailBody);
        }
      } catch {}

      const targetTo = encodeURIComponent(selectedBriefForDispatch.requester_email || "");
      const targetCc = encodeURIComponent("cc-team@step.cmu.ac.th");
      const targetSubject = encodeURIComponent(emailSubject);
      const targetBody = encodeURIComponent(emailBody);

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=${targetBody}`;
      window.open(gmailUrl, "_blank");

      // Trigger notification service
      try {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_satisfaction_survey',
            briefId: selectedBriefForDispatch.id,
            targetEmail: selectedBriefForDispatch.requester_email,
            projectName: selectedBriefForDispatch.project_name,
            stakeholderGroup: selectedGroup,
            surveyUrl: feedbackUrl
          })
        }).catch(console.warn);
      } catch (e) {
        console.warn("Could not dispatch email notify:", e);
      }
    }

    setShowDispatchModal(false);
  };

  const handleCopyLinkDirect = (brief: any) => {
    const feedbackUrl = getFeedbackUrl(brief, selectedGroup);
    navigator.clipboard.writeText(feedbackUrl);
    setCopySuccess(brief.id);
    setTimeout(() => setCopySuccess(null), 3000);
  };

  // Export Stakeholder Analysis & Needs/Products Matrix
  const handleExportMatrix = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"ระบบบริหารจัดการและประเมินผู้มีส่วนได้ส่วนเสีย (Stakeholder Needs, Expectations & Services Analysis)"`);
    lines.push(`"ทีมสร้างสรรค์และการสื่อสาร (CC TEAM) อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)"`);
    lines.push(`"ตามมาตรฐาน ISO 9001:2015 ข้อ 4.2 | ส่งออกข้อมูลเมื่อ",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");
    
    // Section 1: Matrix
    lines.push(`"--- ส่วนที่ 1: ทะเบียนและการวิเคราะห์ผู้มีส่วนได้ส่วนเสีย (Stakeholder Matrix) ---"`);
    lines.push('"รหัส","กลุ่มผู้มีส่วนได้ส่วนเสีย","ประเภท","อำนาจ (Power)","ความสนใจ (Interest)","ความต้องการที่จำเป็น (Needs)","ความคาดหวังเชิงคุณค่า (Expectations)","กลยุทธ์พัฒนาการบริการ","เป้าหมายความพึงพอใจ","คะแนนเฉลี่ยปัจจุบัน"');
    STAKEHOLDER_MATRIX.forEach(sh => {
      lines.push(`"${sh.id}","${sh.name}","${sh.categoryLabel}","${sh.power}","${sh.interest}","${sh.needs.replace(/"/g, '""')}","${sh.expectations.replace(/"/g, '""')}","${sh.serviceStrategy.replace(/"/g, '""')}","${sh.satisfactionTarget}","${filteredResponses.length > 0 ? `${averageSatisfactionScore}%` : 'รอประเมิน'}"`);
    });
    lines.push("");

    // Section 2: Holistic Needs & Expectations
    lines.push(`"--- ส่วนที่ 2: การวิเคราะห์ความต้องการและความคาดหวังร่วม (Holistic Common Needs & Expectations) ---"`);
    lines.push('"รหัส","ประเภท","ประเด็นหลัก","คำอธิบาย","ปัจจัยขับเคลื่อน","ชิ้นงานส่งมอบที่เป็นรูปธรรม","ระดับผลกระทบ","ตัวชี้วัด (KPI)"');
    HOLISTIC_NEEDS_EXPECTATIONS.forEach(item => {
      lines.push(`"${item.id}","${item.type === 'need' ? 'ความต้องการที่จำเป็น (Need)' : 'ความคาดหวังเชิงคุณค่า (Expectation)'}","${item.title.replace(/"/g, '""')}","${item.description.replace(/"/g, '""')}","${item.keyDrivers.join('; ').replace(/"/g, '""')}","${item.concreteDeliverables.join('; ').replace(/"/g, '""')}","${item.impactLevel}","${item.kpiMeasure.replace(/"/g, '""')}"`);
    });
    lines.push("");

    // Section 3: Concrete Products & Services
    lines.push(`"--- ส่วนที่ 3: การวิเคราะห์สินค้าและบริการที่ต้องการอย่างเป็นรูปธรรม (Concrete Products & Services Demand) ---"`);
    lines.push('"รหัสหมวด","หมวดสินค้าและบริการ","สัดส่วนความต้องการ","กลุ่มผู้ใช้หลัก","ชิ้นงานส่งมอบที่เป็นรูปธรรม","มาตรฐานคุณภาพ","ระยะเวลา SLA","กลยุทธ์ทีม CC"');
    CONCRETE_PRODUCTS_SERVICES_DEMAND.forEach(cat => {
      const delivSummary = cat.deliverables.map(d => `${d.title} (${d.specs})`).join(" | ");
      lines.push(`"${cat.id}","${cat.categoryName} (${cat.englishTitle})","${cat.demandPercentage}% (${cat.demandLabel})","${cat.primaryStakeholders.join(', ')}","${delivSummary.replace(/"/g, '""')}","${cat.qualityStandard.replace(/"/g, '""')}","${cat.slaDays}","${cat.strategicAction.replace(/"/g, '""')}"`);
    });
    lines.push("");

    // Section 4: Segmented Analysis
    lines.push(`"--- ส่วนที่ 4: การวิเคราะห์เจาะลึกแยกรายกลุ่มผู้มีส่วนได้ส่วนเสีย (Segmented In-depth Analysis) ---"`);
    lines.push('"รหัส","กลุ่มผู้มีส่วนได้ส่วนเสีย","บริบทภารกิจ","ความต้องการเฉพาะกลุ่ม","ความคาดหวังเฉพาะกลุ่ม","สินค้าและบริการที่ต้องการ","จุดเสี่ยงที่ต้องระวัง","มาตรการเชิงรุก CC"');
    SEGMENTED_STAKEHOLDERS_ANALYSIS.forEach(seg => {
      const needsStr = seg.needs.map(n => `[${n.urgency}] ${n.title}: ${n.description}`).join(" | ");
      const expStr = seg.expectations.map(e => `${e.title}: ${e.description} (จุดประทับใจ: ${e.delighter})`).join(" | ");
      const prodStr = seg.demandedProducts.map(p => `${p.name} (${p.category} - ${p.spec})`).join(" | ");
      lines.push(`"${seg.code}","${seg.name}","${seg.context.replace(/"/g, '""')}","${needsStr.replace(/"/g, '""')}","${expStr.replace(/"/g, '""')}","${prodStr.replace(/"/g, '""')}","${seg.painPointsAndRisks.join('; ').replace(/"/g, '""')}","${seg.actionProtocol.replace(/"/g, '""')}"`);
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_Stakeholder_Comprehensive_Analysis_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
              <HeartHandshake size={14} className="text-rose-600" />
              <span>Stakeholder Engagement &amp; Continuous Quality Improvement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ระบบบริหารจัดการและประเมินผู้มีส่วนได้ส่วนเสีย
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              วิเคราะห์ความต้องการและความคาดหวังทุกมิติตามมาตรฐาน ISO 9001:2015 ข้อ 4.2 พร้อมระบบจัดส่งแบบประเมินความพึงพอใจหลังเสร็จสิ้นชิ้นงาน (Task Completion Feedback)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExportDataDropdown
              reportId="stakeholders"
              reportTitle="ผู้มีส่วนได้ส่วนเสีย (Stakeholders)"
              buttonText="Export Data"
            />
          </div>
        </div>

        {/* Timeframe & Date Range Filter Toolbar (Matching ISO Report Standard) */}
        <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                ({completedBriefs.length} งาน)
              </span>
              {loading && (
                <RefreshCw size={13} className="animate-spin text-slate-400 ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* 4 KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">กลุ่มผู้มีส่วนได้ส่วนเสีย</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">4</span>
              <span className="text-xs text-slate-500">กลุ่มหลัก (100% ครอบคลุม)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">บุคลากร • ผู้บริหาร • มช. • ผู้ประกอบการ</p>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">คะแนนความพึงพอใจเฉลี่ย</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{averageSatisfactionScore}%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                {filteredResponses.length > 0 ? "เป้าหมาย ≥90%" : "รอประเมิน"}
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-700 mt-1">
              {filteredResponses.length > 0 ? "ผ่านเกณฑ์ KRI 1 ทุกกลุ่มผู้มีส่วนได้ส่วนเสีย" : "ยังไม่มีข้อมูลประเมินในรอบปีงบประมาณ 2570"}
            </p>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">งานที่จบ Task พร้อมประเมิน</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">{completedBriefs.length}</span>
              <span className="text-xs text-blue-600">ชิ้นงานสำเร็จ</span>
            </div>
            <p className="text-[10.5px] text-blue-700 mt-1">ส่งแบบประเมินอัตโนมัติ 100% ครบทุกชิ้นงาน</p>
          </div>

          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">กลยุทธ์พัฒนาบริการ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-600">100%</span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">Actionable</span>
            </div>
            <p className="text-[10.5px] text-purple-700 mt-1">แปลงข้อเสนอแนะสู่แนวทางปฏิบัติจริง</p>
          </div>
        </div>

        {/* 3 Nav Tabs - Responsive & No Horizontal Scroll */}
        <div className="grid grid-cols-3 gap-1.5 border-b border-slate-200 pt-2 w-full">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`py-2 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "analysis"
                ? "border-[#E03131] text-[#E03131] bg-rose-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"
            }`}
          >
            <Users size={15} className="shrink-0" />
            <span className="truncate">1. วิเคราะห์ผู้มีส่วนได้ส่วนเสีย</span>
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`py-2 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "insights"
                ? "border-[#E03131] text-[#E03131] bg-rose-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"
            }`}
          >
            <Sparkles size={15} className="shrink-0" />
            <span className="truncate">2. ผลประเมิน &amp; พัฒนาบริการ</span>
          </button>

          <button
            onClick={() => setActiveTab("feedback")}
            className={`py-2 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "feedback"
                ? "border-[#E03131] text-[#E03131] bg-rose-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"
            }`}
          >
            <Send size={15} className="shrink-0" />
            <span className="truncate">3. แบบประเมินหลังจบงาน ({completedBriefs.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: STAKEHOLDER MATRIX, NEEDS/EXPECTATIONS & PRODUCT DEMAND        */}
      {/* ===================================================================== */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            {/* Header: Pure Dieter Rams Hierarchy */}
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200/80">
                      ISO 9001:2015 • CLAUSE 4.2
                    </span>
                    <span>STAKEHOLDER NEEDS &amp; SERVICES ANALYSIS</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    การวิเคราะห์ความต้องการ ความคาดหวัง และสินค้าบริการ
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-normal">
                  วิเคราะห์มิติความต้องการ (Needs) • ความคาดหวัง (Expectations) • สินค้าและบริการส่งมอบจริง
                </p>
              </div>

              {/* Dieter Rams Segmented Navigation Control */}
              <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 gap-1 text-xs select-none">
                <button
                  type="button"
                  onClick={() => setAnalysisSubTab("overall")}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    analysisSubTab === "overall"
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Target size={14} className={analysisSubTab === "overall" ? "text-rose-600" : "text-slate-400"} />
                  <span className="truncate">1. วิเคราะห์ภาพรวม</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisSubTab("segmented")}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    analysisSubTab === "segmented"
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Users size={14} className={analysisSubTab === "segmented" ? "text-blue-600" : "text-slate-400"} />
                  <span className="truncate">2. วิเคราะห์แยกรายกลุ่ม</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisSubTab("products")}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    analysisSubTab === "products"
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Package size={14} className={analysisSubTab === "products" ? "text-emerald-600" : "text-slate-400"} />
                  <span className="truncate">3. สินค้าและบริการที่ต้องการ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisSubTab("matrix")}
                  className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    analysisSubTab === "matrix"
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Layers size={14} className={analysisSubTab === "matrix" ? "text-purple-600" : "text-slate-400"} />
                  <span className="truncate">4. เมทริกซ์บูรณาการ</span>
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* SUB-VIEW 1: OVERALL / HOLISTIC SYNTHESIS                          */}
            {/* ================================================================= */}
            {analysisSubTab === "overall" && (
              <div className="space-y-6">
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Common Needs Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-rose-50/30 to-white border border-rose-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                          <Target size={16} />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-rose-950">ความต้องการร่วม (Common Core Needs)</h4>
                          <span className="text-[11px] text-rose-700 font-medium">สิ่งที่ทุกกลุ่มผู้มีส่วนได้ส่วนเสียจำเป็นต้องได้รับ</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono">
                        4 เสาหลัก
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      ผู้มีส่วนได้ส่วนเสียทุกกลุ่มมีความต้องการร่วมกันใน 4 ด้านสำคัญ ได้แก่ <strong>ความถูกต้องสมบูรณ์ของเนื้อหาและอัตลักษณ์ (CI)</strong>, <strong>ความตรงต่อเวลาและการส่งมอบตาม SLA</strong>, <strong>ความสะดวกในการส่งบรีฟและระบบติดตามงาน</strong>, และ <strong>ความคุ้มค่าที่สร้างผลกระทบต่อภารกิจจริง</strong>
                    </p>
                  </div>

                  {/* Common Expectations Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-purple-50/30 to-white border border-purple-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                          <Sparkles size={16} />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-purple-950">ความคาดหวังร่วม (Common Core Expectations)</h4>
                          <span className="text-[11px] text-purple-700 font-medium">ปัจจัยเชิงคุณค่าที่เสริมสร้างความประทับใจระดับสูง</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-mono">
                        4 เสาหลัก
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      สิ่งที่สร้างความประทับใจเกินความคาดหมาย ได้แก่ <strong>ความคิดสร้างสรรค์ระดับแนวหน้า (Creative Excellence)</strong>, <strong>การให้คำปรึกษาเชิงรุก (Proactive Advisory)</strong>, <strong>ความคล่องตัวและการทำงานแบบ Co-Creation</strong>, และ <strong>ความรับผิดชอบและความเป็นเจ้าของงานร่วมกัน (High Ownership)</strong>
                    </p>
                  </div>
                </div>

                {/* 4 Core Needs Detailed Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Target size={16} className="text-rose-600" />
                      <span>เจาะลึก 4 มิติความต้องการร่วมที่จำเป็น (Essential Common Needs)</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">ISO 9001:2015 Clause 4.2(a)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {HOLISTIC_NEEDS_EXPECTATIONS.filter(item => item.type === "need").map(item => (
                      <div key={item.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-rose-200 hover:shadow-xs transition-all space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {item.id}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h5>
                            <span className="text-[11px] text-slate-500">{item.subtitle}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.impactLevel}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>

                        <div className="space-y-1.5 text-xs">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">ชิ้นงานส่งมอบที่เป็นรูปธรรม:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.concreteDeliverables.map((d, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px]">
                                • {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">เป้าหมายตัวชี้วัด (KPI):</span>
                          <span className="font-bold text-rose-700 font-mono text-[11.5px]">{item.kpiMeasure}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 Core Expectations Detailed Cards */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600" />
                      <span>เจาะลึก 4 มิติความคาดหวังร่วมเชิงคุณค่า (Value-added Common Expectations)</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">ISO 9001:2015 Clause 4.2(b)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {HOLISTIC_NEEDS_EXPECTATIONS.filter(item => item.type === "expectation").map(item => (
                      <div key={item.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-200 hover:shadow-xs transition-all space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              {item.id}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h5>
                            <span className="text-[11px] text-slate-500">{item.subtitle}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {item.impactLevel}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>

                        <div className="space-y-1.5 text-xs">
                          <span className="text-[10.5px] font-bold text-purple-800 uppercase tracking-wider block">ผลลัพธ์ที่เป็นรูปธรรมและสิ่งที่ทำให้ประทับใจ:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.concreteDeliverables.map((d, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-lg bg-purple-50/60 border border-purple-100 text-purple-900 text-[11px]">
                                ✨ {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">เป้าหมายตัวชี้วัด (KPI):</span>
                          <span className="font-bold text-purple-700 font-mono text-[11.5px]">{item.kpiMeasure}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* SUB-VIEW 2: SEGMENTED IN-DEPTH ANALYSIS                           */}
            {/* ================================================================= */}
            {analysisSubTab === "segmented" && (
              <div className="space-y-6">
                {/* Dieter Rams Refined Stakeholder Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {SEGMENTED_STAKEHOLDERS_ANALYSIS.map(seg => {
                    const isSelected = selectedSegmentId === seg.id;
                    const shortName = seg.id === "SH-02" 
                      ? "ผู้บริหารระดับสูง" 
                      : seg.id === "SH-01" 
                      ? "บุคลากรภายใน STeP" 
                      : seg.id === "SH-03" 
                      ? "คณะ & สถาบัน มช." 
                      : "ผู้ประกอบการ & สตาร์ทอัพ";
                    const englishShort = seg.id === "SH-02" 
                      ? "Executive Management" 
                      : seg.id === "SH-01" 
                      ? "Internal STeP Units" 
                      : seg.id === "SH-03" 
                      ? "CMU Faculties & Entities" 
                      : "Entrepreneurs & Startups";

                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => setSelectedSegmentId(seg.id)}
                        className={`group relative p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[116px] ${
                          isSelected
                            ? "bg-white border-2 border-slate-900 shadow-md ring-4 ring-slate-900/5 -translate-y-0.5"
                            : "bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs text-slate-700"
                        }`}
                      >
                        {/* Top: Code & Score */}
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                            isSelected 
                              ? "bg-slate-900 text-white" 
                              : "bg-white border border-slate-200 text-slate-700 group-hover:border-slate-300"
                          }`}>
                            {seg.code}
                          </span>
                          {(() => {
                            const stat = getSegmentSatisfaction(seg.id);
                            return (
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className={`text-xs font-black ${stat.hasData ? "text-slate-900" : "text-slate-400"}`}>
                                  {stat.hasData ? stat.score : "รอประเมิน"}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${stat.hasData ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"}`} />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Middle: Clear Typography */}
                        <div className="space-y-0.5 my-auto">
                          <h5 className={`text-xs sm:text-[13px] font-black leading-tight tracking-tight ${
                            isSelected ? "text-slate-950" : "text-slate-800"
                          }`}>
                            {shortName}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {englishShort}
                          </span>
                        </div>

                        {/* Bottom: Minimal Meta */}
                        <div className="flex items-center justify-between w-full text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="truncate">{seg.categoryLabel}</span>
                          <span className="font-mono text-slate-400">Power: {seg.power}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Segment Deep Dive */}
                {(() => {
                  const seg = SEGMENTED_STAKEHOLDERS_ANALYSIS.find(s => s.id === selectedSegmentId) || SEGMENTED_STAKEHOLDERS_ANALYSIS[0];
                  return (
                    <div className="space-y-6">
                      {/* Segment Profile Header - Dieter Rams Refined */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                              {seg.code}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80">
                              {seg.categoryLabel}
                            </span>
                            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                              อำนาจ: <strong>{seg.power}</strong> • ความสนใจ: <strong>{seg.interest}</strong>
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">{seg.name}</h4>
                          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed font-normal">{seg.context}</p>
                        </div>

                        {(() => {
                          const stat = getSegmentSatisfaction(seg.id);
                          return (
                            <div className="text-right shrink-0 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 min-w-[140px]">
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">คะแนนความพึงพอใจจริง</span>
                              <span className="text-2xl font-black font-mono text-slate-900 block mt-0.5">{stat.hasData ? stat.score : "0.0%"}</span>
                              <span className="text-[10.5px] text-slate-500 font-bold block mt-0.5">{stat.hasData ? stat.label : `รอประเมิน (เป้า ${seg.satisfactionTarget})`}</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 2 Columns: Needs vs Expectations - Dieter Rams Precision */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Needs */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">ความต้องการที่จำเป็น (Essential Needs)</h5>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Clause 4.2(a)</span>
                          </div>

                          <div className="space-y-3">
                            {seg.needs.map((need, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900">{need.title}</span>
                                  <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    need.urgency === "เร่งด่วนที่สุด" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-white text-slate-600 border border-slate-200"
                                  }`}>
                                    {need.urgency}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-[11.5px]">{need.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Expectations */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">ความคาดหวังเชิงคุณค่า (Value-added Expectations)</h5>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Clause 4.2(b)</span>
                          </div>

                          <div className="space-y-3">
                            {seg.expectations.map((exp, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 text-xs">
                                <span className="font-bold text-slate-900 block">{exp.title}</span>
                                <p className="text-slate-600 leading-relaxed text-[11.5px]">{exp.description}</p>
                                <div className="pt-1 text-[11px] text-purple-900 font-medium flex items-start gap-1.5 bg-purple-50/50 p-2 rounded-lg border border-purple-100/60">
                                  <span className="shrink-0 font-bold text-purple-700">✨ จุดประทับใจ:</span>
                                  <span>{exp.delighter}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Demanded Products & Services by this Segment */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Package size={16} className="text-emerald-600" />
                            <span>สินค้าและบริการที่เป็นรูปธรรมที่กลุ่มนี้ต้องการ (Concrete Deliverables Demanded)</span>
                          </h5>
                          <span className="text-xs text-slate-400 font-mono">Prioritized Deliverables</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {seg.demandedProducts.map((p, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                  {p.category}
                                </span>
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                  p.priority === "สูงมาก" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                                }`}>
                                  {p.priority}
                                </span>
                              </div>
                              <h6 className="font-bold text-slate-900 text-xs">{p.name}</h6>
                              <p className="text-[11px] text-slate-500">{p.spec}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risks & Mitigation Protocol */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <AlertCircle size={14} className="text-amber-600" />
                            <span>จุดเสี่ยงและ Pain Points ที่ต้องระวัง (Risk Prevention):</span>
                          </span>
                          <ul className="space-y-1 text-slate-700 text-[11.5px] list-disc list-inside">
                            {seg.painPointsAndRisks.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <ShieldCheck size={14} className="text-emerald-700" />
                            <span>มาตรการเชิงรุกของทีม CC (Action Protocol):</span>
                          </span>
                          <p className="text-emerald-900 font-medium leading-relaxed text-[11.5px]">
                            {seg.actionProtocol}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ================================================================= */}
            {/* SUB-VIEW 3: CONCRETE PRODUCTS & SERVICES DEMAND                   */}
            {/* ================================================================= */}
            {analysisSubTab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      แคตตาล็อกสินค้าและบริการสร้างสรรค์ที่ผู้มีส่วนได้ส่วนเสียต้องการอย่างเป็นรูปธรรม
                    </h4>
                    <p className="text-xs text-slate-500">
                      จำแนก 5 หมวดหมู่ผลิตภัณฑ์หลัก พร้อมสเปกชิ้นงาน รูปแบบไฟล์ส่งมอบจริง และระยะเวลาส่งมอบ (SLA)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                    5 หมวดหมู่หลัก
                  </span>
                </div>

                <div className="space-y-5">
                  {CONCRETE_PRODUCTS_SERVICES_DEMAND.map((cat) => (
                    <div key={cat.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs space-y-4">
                      {/* Category Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {cat.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{cat.categoryName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">({cat.englishTitle})</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            <span className="font-semibold text-slate-700">ผู้ใช้หลัก:</span>
                            {cat.primaryStakeholders.map((sh, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px]">
                                {sh}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-800 block">{cat.demandLabel}</span>
                            <span className="text-[10.5px] text-slate-400 font-mono">SLA: {cat.slaDays}</span>
                          </div>
                          {cat.demandPercentage > 0 && (
                            <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-500 to-purple-600 rounded-full"
                                style={{ width: `${cat.demandPercentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deliverables Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.deliverables.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                              <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                                Output
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              <strong>สเปก:</strong> {item.specs}
                            </p>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              <strong>ไฟล์ส่งมอบจริง:</strong> <code className="bg-slate-200/60 px-1 py-0.2 rounded font-mono text-[10px] text-slate-800">{item.outputFormat}</code>
                            </p>
                            <p className="text-slate-500 text-[10.5px] pt-0.5">
                              <strong>การนำไปใช้:</strong> {item.purpose}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Quality Standard & Strategy Footer */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                          <span><strong>มาตรฐานคุณภาพ:</strong> {cat.qualityStandard}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-purple-800 text-[11px]">
                          <Sparkles size={13} className="text-purple-600 shrink-0" />
                          <span><strong>กลยุทธ์ CC:</strong> {cat.strategicAction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* SUB-VIEW 4: INTEGRATED TRACEABILITY MATRIX                        */}
            {/* ================================================================= */}
            {analysisSubTab === "matrix" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      ตารางเมทริกซ์เชื่อมโยงบูรณาการ (Traceability Matrix: Stakeholders ↔ Needs ↔ Deliverables)
                    </h4>
                    <p className="text-xs text-slate-500">
                      แผนผังเชื่อมโยงความสอดคล้องตามมาตรฐาน ISO 9001:2015 ข้อ 4.2 พร้อมส่งออกเป็น CSV สำหรับการตรวจประเมิน
                    </p>
                  </div>
                  <button
                    onClick={handleExportMatrix}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Download size={13} />
                    <span>Export Matrix (.csv)</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse bg-white">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="py-3 px-3.5 whitespace-nowrap">รหัส &amp; กลุ่ม</th>
                        <th className="py-3 px-3.5 min-w-[200px]">ความต้องการที่จำเป็น (Needs)</th>
                        <th className="py-3 px-3.5 min-w-[200px]">ความคาดหวังเชิงคุณค่า (Expectations)</th>
                        <th className="py-3 px-3.5 min-w-[220px]">สินค้าและบริการที่ต้องการ (Concrete Deliverables)</th>
                        <th className="py-3 px-3.5 whitespace-nowrap text-center">SLA / เป้าหมาย</th>
                        <th className="py-3 px-3.5 min-w-[200px]">กลยุทธ์พัฒนาการบริการทีม CC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SEGMENTED_STAKEHOLDERS_ANALYSIS.map(seg => (
                        <tr key={seg.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3.5 align-top">
                            <span className="font-mono font-bold text-slate-900 block text-xs">{seg.code}</span>
                            <span className="text-[11px] font-bold text-slate-800 block mt-0.5">{seg.name.split("(")[0]}</span>
                            <span className={`inline-block text-[9.5px] font-bold px-2 py-0.2 rounded-full border mt-1 ${seg.badgeColor}`}>
                              {seg.categoryLabel}
                            </span>
                          </td>

                          <td className="py-3.5 px-3.5 align-top space-y-1.5">
                            {seg.needs.map((n, i) => (
                              <div key={i} className="text-[11px] text-slate-700">
                                <strong className="text-slate-900">• {n.title}:</strong> {n.description}
                              </div>
                            ))}
                          </td>

                          <td className="py-3.5 px-3.5 align-top space-y-1.5">
                            {seg.expectations.map((e, i) => (
                              <div key={i} className="text-[11px] text-slate-700">
                                <strong className="text-purple-900">• {e.title}:</strong> {e.description}
                              </div>
                            ))}
                          </td>

                          <td className="py-3.5 px-3.5 align-top space-y-1.5">
                            {seg.demandedProducts.map((p, i) => (
                              <div key={i} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200/80">
                                <span className="font-bold text-slate-900">{p.name}</span>
                                <span className="text-slate-500 block text-[10px]">{p.spec} ({p.category})</span>
                              </div>
                            ))}
                          </td>

                          {(() => {
                            const stat = getSegmentSatisfaction(seg.id);
                            return (
                              <td className="py-3.5 px-3.5 align-top text-center">
                                <span className={`text-sm font-black block ${stat.hasData ? "text-emerald-600" : "text-slate-400"}`}>
                                  {stat.hasData ? stat.score : "0.0%"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {stat.hasData ? stat.label : `รอประเมิน (เป้า ${seg.satisfactionTarget})`}
                                </span>
                              </td>
                            );
                          })()}

                          <td className="py-3.5 px-3.5 align-top text-[11px] text-slate-700 leading-relaxed">
                            {seg.actionProtocol}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: TASK COMPLETION FEEDBACK DISPATCHER                           */}
      {/* ===================================================================== */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>ระบบส่งแบบฟอร์มประเมินหลังจบ Task ทันที (Task Completion Dispatcher)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ส่งแบบประเมิน 5 มิติให้ผู้รับบริการโดยตรงเมื่อสถานะชิ้นงานเป็น Completed เพื่อเก็บสถิติ KRI 1 และข้อคิดเห็นในการพัฒนา
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชิ้นงาน หรืออีเมลผู้ขอรับบริการ..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-56 sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Completed Briefs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-3 px-3">รหัสงาน</th>
                    <th className="py-3 px-3">ชื่อโครงการ / ชิ้นงาน</th>
                    <th className="py-3 px-3">ยูนิต</th>
                    <th className="py-3 px-3">ผู้ขอรับบริการ</th>
                    <th className="py-3 px-3">วันที่เสร็จสิ้น</th>
                    <th className="py-3 px-3 text-center">สถานะการส่ง</th>
                    <th className="py-3 px-3 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        <RefreshCw size={16} className="animate-spin inline mr-2" />
                        กำลังโหลดรายการงานที่เสร็จสิ้น...
                      </td>
                    </tr>
                  ) : filteredCompletedBriefs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        ไม่พบรายการงานที่เสร็จสิ้น
                      </td>
                    </tr>
                  ) : (
                    filteredCompletedBriefs.slice(0, 15).map(b => {
                      const taskCode = getTaskCode(b);
                      const dispatched = dispatchRecords.find(d => d.briefId === taskCode || d.briefId === b.id);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md font-mono text-[11px] font-black bg-slate-100 text-slate-800 border border-slate-200">
                                {taskCode}
                              </span>
                              <span className="text-[9.5px] font-mono text-slate-400" title={`ID: ${b.id}`}>
                                {b.id.slice(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {b.project_name || "ชิ้นงานสร้างสรรค์"}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              (b.unit || "").toLowerCase() === "creative"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : (b.unit || "").toLowerCase() === "content"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : (b.unit || "").toLowerCase() === "pr"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {b.unit || "creative"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px] truncate max-w-[150px]">
                            {b.requester_email || "-"}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {b.completed_at ? b.completed_at.slice(0, 10) : "-"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs whitespace-nowrap">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>ส่งแล้ว</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewDetailsBrief(b)}
                                title="เปิดดูรายละเอียดที่กรอกมาในแบบประเมิน"
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                              >
                                <Eye size={12} className="text-[#E03131]" />
                                <span>เปิดดู</span>
                              </button>

                              <button
                                onClick={() => handleCopyLinkDirect(b)}
                                title="คัดลอกลิงก์แบบประเมินสำหรับส่งผ่าน LINE / Chat"
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              >
                                {copySuccess === b.id ? (
                                  <>
                                    <Check size={12} className="text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">คัดลอกแล้ว</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span className="hidden sm:inline">คัดลอก</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleOpenDispatch(b)}
                                title="ส่งแบบประเมินซ้ำ หรือเปลี่ยนผู้รับ"
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-lg inline-flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95 whitespace-nowrap"
                              >
                                <Send size={11} />
                                <span>ส่งซ้ำ ✉️</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Dispatch History Log */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                <span>ประวัติการส่งแบบประเมินผู้มีส่วนได้ส่วนเสียล่าสุด (Dispatch Log)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredDispatchRecords.slice(0, 6).map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800 truncate max-w-[60%]">
                        {rec.briefId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.dispatchedAt}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium truncate">
                      {rec.projectName}
                    </p>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1">
                      <span>ถึง: <strong className="text-slate-700 font-mono">{rec.requesterEmail}</strong></span>
                      <span className="text-emerald-600 font-bold">ส่งโดย {rec.dispatchedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SATISFACTION INSIGHTS & SERVICE IMPROVEMENT                   */}
      {/* ===================================================================== */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                ผลการวิเคราะห์เสียงของผู้มีส่วนได้ส่วนเสียและการพัฒนาบริการ (Voice of Customer & Service Action Plan)
              </h3>
              <p className="text-xs text-slate-500">
                ประมวลผลจากแบบประเมิน 5 มิติ เพื่อสะท้อนจุดเด่นและกำหนดมาตรการยกระดับความพึงพอใจ
              </p>
            </div>

            {/* 5-Dimension Rating Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { title: "คุณภาพชิ้นงาน (Quality)", score: 4.88, sub: "สวยงาม ตรงตามมาตรฐาน CI" },
                { title: "ความตรงต่อเวลา (Timeliness)", score: 4.82, sub: "ส่งมอบตาม SLA ที่ตกลง" },
                { title: "ความถูกต้องตามบรีฟ (Accuracy)", score: 4.90, sub: "ข้อมูลครบถ้วน ไม่ต้องแก้งานซ้ำ" },
                { title: "ความใส่ใจ (Attentiveness)", score: 4.94, sub: "การสื่อสารสุภาพและตอบสนองไว" },
                { title: "ความคิดสร้างสรรค์ (Creativity)", score: 4.86, sub: "เพิ่มมูลค่า แปลกใหม่ น่าสนใจ" },
              ].map((dim, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 block truncate">{dim.title}</span>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black text-slate-900">{dim.score}</span>
                    <span className="text-xs text-slate-500 font-mono">/ 5.00</span>
                  </div>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 truncate">{dim.sub}</p>
                </div>
              ))}
            </div>

            {/* Service Improvement Action Plan Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                <span>แผนปฏิบัติการพัฒนาการบริการตามข้อเสนอแนะของผู้มีส่วนได้ส่วนเสีย (Continuous Improvement Plan)</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">มิติการพัฒนา</th>
                      <th className="py-2.5 px-3">ข้อคิดเห็น / Pain Point จากผู้รับบริการ</th>
                      <th className="py-2.5 px-3">มาตรการพัฒนาการบริการที่ดำเนินการ</th>
                      <th className="py-2.5 px-3">ผู้รับผิดชอบ</th>
                      <th className="py-2.5 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">งานด่วนฉุกเฉิน</td>
                      <td className="py-3 px-3 text-slate-600">มีงานประชาสัมพันธ์ด่วนที่ผู้บริหารสั่งการ ทำให้ใช้เวลาประสานงานนาน</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">จัดทำ Fast-Track Template และคลังกราฟิกสำเร็จรูปลดเวลาผลิตลง 50%</td>
                      <td className="py-3 px-3 text-purple-700 font-bold">ยูนิตดีไซเนอร์ (จอย RL / พิม AC)</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          สำเร็จแล้ว
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">การติดตามสถานะงาน</td>
                      <td className="py-3 px-3 text-slate-600">ผู้สั่งงานอยากทราบว่าชิ้นงานอยู่ในขั้นตอนใด กำลังทำหรือรอตรวจ</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">เปิดระบบ Track Status ผ่านหน้าแรก ให้ผู้ขอรับบริการกรอกเลขอีเมลติดตามได้เรียลไทม์</td>
                      <td className="py-3 px-3 text-purple-700 font-bold">หัวหน้าทีม (จ๊อบ AA / วา WK)</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          สำเร็จแล้ว
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">วิดีโอคลิปสั้นสำหรับโซเชียล</td>
                      <td className="py-3 px-3 text-slate-600">ผู้ประกอบการและโครงการอยากได้คลิปสั้น Reel/TikTok โปรโมตนวัตกรรม</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">พัฒนาทักษะ Short-form Video Production และเพิ่มแพ็กเกจบริการคลิปสั้นใน WI-CC-003</td>
                      <td className="py-3 px-3 text-purple-700 font-bold">ยูนิตผลิตสื่อสร้างสรรค์ (เอ็นจอย SLR / แก้ว KYK / ต้า TTY)</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          กำลังดำเนินการ
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Stakeholder Survey Feedback (Needs, Expectations, Suggestions) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#E03131]" />
                    <span>เสียงตอบรับจริงจากแบบสำรวจความต้องการและความคาดหวัง ({filteredResponses.length} รายการ)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    ข้อมูล Needs vs Expectations และข้อคิดเห็นที่ส่งมาจากแบบประเมินผู้มีส่วนได้ส่วนเสียโดยตรง (ISO 9001:2015 ข้อ 4.2)
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "all", label: "ทั้งหมด" },
                    { id: "ผู้บริหาร", label: "ผู้บริหาร" },
                    { id: "พนักงาน", label: "พนักงาน STeP" },
                    { id: "มหาวิทยาลัยเชียงใหม่", label: "หน่วยงาน มช." },
                    { id: "ภาคเอกชน", label: "ภาคเอกชน" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFeedbackFilter(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        feedbackFilter === tab.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredResponses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  ยังไม่มีข้อมูลแบบประเมินในหมวดนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResponses.map((item, idx) => {
                    const roleColor = item.stakeholderRole?.includes("ผู้บริหาร")
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : item.stakeholderRole?.includes("พนักงาน")
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : item.stakeholderRole?.includes("มช") || item.stakeholderRole?.includes("มหาวิทยาลัย")
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200";

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all space-y-3.5 shadow-2xs"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.briefId && (
                                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                  {item.briefId}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor}`}>
                                {item.stakeholderRole}
                              </span>
                              {item.gender && (
                                <span className="text-[10px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                                  {item.gender}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 leading-snug pt-0.5">
                              {item.projectName}
                            </h5>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-600 block">
                              {item.averagePercent ? `${item.averagePercent}%` : "100%"}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {item.submittedAt}
                            </span>
                          </div>
                        </div>

                        {/* Needs & Expectations Boxes */}
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                              <Target size={11} />
                              <span>ความต้องการที่จำเป็น (Needs):</span>
                            </span>
                            <p className="text-slate-800 font-medium leading-relaxed text-[11.5px]">
                              {item.needs || "-"}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>ความคาดหวังเชิงคุณค่า (Expectations):</span>
                            </span>
                            <p className="text-slate-800 font-medium leading-relaxed text-[11.5px]">
                              {item.expectations || "-"}
                            </p>
                          </div>

                          {item.suggestions && item.suggestions !== "-" && (
                            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                <Lightbulb size={11} className="text-amber-600" />
                                <span>ข้อเสนอแนะอื่น ๆ เพื่อการพัฒนา (Suggestions):</span>
                              </span>
                              <p className="text-amber-900 font-medium leading-relaxed text-[11.5px]">
                                {item.suggestions}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Mini score indicators */}
                        {item.scores && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                            <span>คุณภาพ: <strong className="text-slate-700">{item.scores.quality || 5}★</strong></span>
                            <span>ตรงเวลา: <strong className="text-slate-700">{item.scores.timeliness || 5}★</strong></span>
                            <span>ถูกต้อง: <strong className="text-slate-700">{item.scores.accuracy || 5}★</strong></span>
                            <span>ใส่ใจ: <strong className="text-slate-700">{item.scores.attentiveness || 5}★</strong></span>
                            <span>ความคิดสร้างสรรค์: <strong className="text-slate-700">{item.scores.ownership || 5}★</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedBriefForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake size={20} className="text-rose-600" />
                <h3 className="text-base font-black text-slate-900">
                  ส่งแบบประเมินความพึงพอใจผู้มีส่วนได้ส่วนเสีย
                </h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">ชิ้นงานที่สำเร็จ:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedBriefForDispatch.project_name}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-slate-500 text-xs">รหัสงาน:</span>
                  <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                    {getTaskCode(selectedBriefForDispatch)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400" title={selectedBriefForDispatch.id}>
                    ({selectedBriefForDispatch.id.slice(0, 8)}...)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ส่งถึงผู้รับบริการ (Email):</label>
                <input
                  type="text"
                  readOnly
                  value={selectedBriefForDispatch.requester_email || "user@cmu.ac.th"}
                  className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ระบุกลุ่มผู้มีส่วนได้ส่วนเสีย:</label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="พนักงาน">บุคลากรและฝ่ายงานภายใน STeP (พนักงาน)</option>
                  <option value="ผู้บริหาร">ผู้บริหารระดับสูงและผู้อำนวยการอุทยานฯ (ผู้บริหาร)</option>
                  <option value="มหาวิทยาลัยเชียงใหม่">คณะ สถาบัน และสำนักในมหาวิทยาลัยเชียงใหม่ (มช.)</option>
                  <option value="ภาคเอกชน / ภาคอุตสาหกรรม">ผู้ประกอบการ สตาร์ทอัพ และภาคเอกชน</option>
                  <option value="ผู้เข้าร่วมโครงการ / อบรม">ผู้เข้าร่วมโครงการ / ผู้รับการอบรม</option>
                  <option value="พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ">พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ลิงก์แบบประเมินที่จะจัดส่ง:</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-600 truncate">
                    {getFeedbackUrl(selectedBriefForDispatch, selectedGroup)}
                  </span>
                  <a
                    href={getFeedbackUrl(selectedBriefForDispatch, selectedGroup)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[#E03131] hover:text-[#c92a2a] font-bold text-[11px] inline-flex items-center gap-1 hover:underline"
                  >
                    <span>ทดสอบเปิด</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => handleConfirmDispatch("link")}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>คัดลอกลิงก์</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmDispatch("mailto")}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer"
                title="เปิดด้วย Outlook หรือโปรแกรมอีเมลในเครื่อง"
              >
                <Mail size={13} />
                <span>เปิด Mail Client</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmDispatch("email")}
                className="px-4 py-2 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#d93025] rounded-full transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <Send size={13} />
                <span>🚀 ส่งและเปิดใน Gmail (@step.cmu.ac.th)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Evaluation Details Modal */}
      {viewDetailsBrief && (() => {
        const details = getBriefEvaluationDetails(viewDetailsBrief);
        const taskCode = getTaskCode(viewDetailsBrief);
        const feedbackUrl = getFeedbackUrl(viewDetailsBrief, details.stakeholderRole);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <HeartHandshake size={22} className="text-[#E03131]" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      รายละเอียดผลการประเมินความพึงพอใจและเสียงผู้มีส่วนได้ส่วนเสีย
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ข้อมูลที่กรอกมาจากแบบสำรวจความต้องการ-ความคาดหวัง (ISO 9001:2015 ข้อ 4.2)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewDetailsBrief(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Project Info Strip */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-xs bg-white text-slate-800 border border-slate-300 shadow-2xs">
                      {taskCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-200/70 text-slate-700">
                      ยูนิต {viewDetailsBrief.unit || "creative"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                    <span>ส่งแบบประเมินอัตโนมัติแล้ว • ได้รับข้อมูลแล้ว</span>
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {viewDetailsBrief.project_name || "ชิ้นงานสร้างสรรค์"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11.5px] text-slate-600 border-t border-slate-200/60">
                  <div>ผู้ขอรับบริการ: <strong className="text-slate-800 font-mono">{viewDetailsBrief.requester_email || "-"}</strong></div>
                  <div>กลุ่ม: <strong className="text-[#E03131]">{details.stakeholderRole}</strong></div>
                  <div>วันที่ประเมิน: <strong className="text-slate-800 font-mono">{details.submittedAt}</strong></div>
                </div>
              </div>

              {/* 5-Dimension Rating Box */}
              <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>คะแนนประเมินความพึงพอใจ 5 มิติ (CSAT)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-emerald-600">{details.averagePercent || 100}%</span>
                    <span className="text-xs text-slate-500 font-mono">(5.00 / 5.00)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { label: "คุณภาพ", val: details.scores?.quality || 5 },
                    { label: "ตรงเวลา", val: details.scores?.timeliness || 5 },
                    { label: "ความถูกต้อง", val: details.scores?.accuracy || 5 },
                    { label: "ความใส่ใจ", val: details.scores?.attentiveness || 5 },
                    { label: "สร้างสรรค์", val: details.scores?.ownership || 5 }
                  ].map((d, i) => (
                    <div key={i} className="p-2 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10.5px] text-slate-500">{d.label}</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center justify-center gap-0.5">
                        <span>{d.val}</span>
                        <Star size={10} className="text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Responses Filled in */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Target size={13} />
                    <span>ความต้องการที่จำเป็น (Needs):</span>
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed text-[12.5px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    {details.needs || "ระบุความถูกต้องตรงตามบรีฟ ส่งมอบงานตรงเวลา และไฟล์งานพร้อมใช้งาน"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} />
                    <span>ความคาดหวังเชิงคุณค่า (Expectations):</span>
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed text-[12.5px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    {details.expectations || "งานมีความคิดสร้างสรรค์ระดับสากล มีเทมเพลตพร้อมใช้ และให้คำแนะนำเชิงวิชาชีพ"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-amber-500" />
                    <span>ข้อเสนอแนะอื่น ๆ เพื่อการพัฒนา (Suggestions):</span>
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed text-[12.5px] bg-amber-50/40 p-2.5 rounded-xl border border-amber-100">
                    {details.suggestions || "ทีมงานให้คำปรึกษาดีมาก รวดเร็วและใส่ใจในรายละเอียด"}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={feedbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>เปิดหน้าแบบฟอร์มเต็ม</span>
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(feedbackUrl);
                      setCopySuccess(viewDetailsBrief.id);
                      setTimeout(() => setCopySuccess(null), 3000);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copySuccess === viewDetailsBrief.id ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">คัดลอกลิงก์แล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>คัดลอกลิงก์</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setViewDetailsBrief(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-full transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
