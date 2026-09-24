"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { exportIDCFullPdf } from "@/utils/idcPdfExport";
import {
  Users,
  Building2,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit3,
  DollarSign,
  Package,
  Layers,
  BarChart3,
  PieChart,
  Star,
  Check,
  X,
  Phone,
  HelpCircle,
  Lightbulb,
  ArrowUpRight,
  Palette,
  Briefcase,
  Calendar,
  Percent,
  RefreshCw,
  ArrowLeft,
  Zap,
  Target,
  ShieldCheck,
  Compass,
  Crosshair,
  Award,
  ArrowRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from "date-fns";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";

export type StockTimeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" | "CUSTOM";

// ==========================================
// Type Definitions
// ==========================================

export type ServiceMainCategory =
  | "consultation" // 1. เข้ารับคำปรึกษา
  | "product_design" // 2. ออกแบบผลิตภัณฑ์
  | "packaging_design" // 3. ออกแบบบรรจุภัณฑ์
  | "print_media" // 4. ออกแบบสื่อสิ่งพิมพ์
  | "logo_branding" // 5. ออกแบบตราสัญลักษณ์
  | "ci_branding" // 6. ออกแบบอัตลักษณ์ ( CI )
  | "other"; // 7. อื่นๆ

export type ConsultationSubCategory =
  | "product"
  | "packaging"
  | "print"
  | "logo"
  | "other";

export type BusinessType =
  | "food_processing" // การแปรรูปอาหาร
  | "agriculture_biotech" // การเกษตรและเทคโนโลยีชีวภาพ
  | "tourism" // การท่องเที่ยว
  | "digital" // ดิจิทัล
  | "other"; // อื่นๆ

export type OrganizationType = "private" | "government"; // ภาคเอกชน, ภาครัฐ

export type TaskStatus = "pending" | "in_progress" | "completed";

export const IDC_BUSINESS_TYPE_OPTIONS: ModernSelectOption[] = [
  { value: "food_processing", label: "1. การแปรรูปอาหาร", desc: "อุตสาหกรรมแปรรูปอาหาร เกษตรแปรรูป และอาหารแห่งอนาคต" },
  { value: "agriculture_biotech", label: "2. การเกษตรและเทคโนโลยีชีวภาพ", desc: "การเกษตรสมัยใหม่ เกษตรแม่นยำ และชีวภัณฑ์นวัตกรรม" },
  { value: "tourism", label: "3. การท่องเที่ยว", desc: "การท่องเที่ยวสร้างสรรค์ การบริการ และสุขภาพ Well-being" },
  { value: "digital", label: "4. ดิจิทัล", desc: "เทคโนโลยีดิจิทัล ซอฟต์แวร์ แพลตฟอร์ม และปัญญาประดิษฐ์" },
  { value: "other", label: "5. อื่นๆ (ระบุ)", desc: "หัตถกรรม พลังงานสะอาด หรือธุรกิจกลุ่มอื่นๆ" }
];

export const IDC_SERVICE_FILTER_OPTIONS: ModernSelectOption[] = [
  { value: "all", label: "ทุกประเภทบริการ", desc: "แสดงงานทุกประเภทการให้บริการของศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "consultation", label: "เข้ารับคำปรึกษา", desc: "การให้คำปรึกษาเชิงลึกด้านการออกแบบและนวัตกรรม" },
  { value: "product_design", label: "ออกแบบผลิตภัณฑ์", desc: "บริการออกแบบผลิตภัณฑ์อุตสาหกรรมและเชิงพาณิชย์" },
  { value: "packaging_design", label: "ออกแบบบรรจุภัณฑ์", desc: "บริการพัฒนาโครงสร้างและกราฟิกบรรจุภัณฑ์" },
  { value: "print_media", label: "ออกแบบสื่อสิ่งพิมพ์", desc: "บริการออกแบบสื่อสิ่งพิมพ์ แผ่นพับ โปสเตอร์ แคตตาล็อก" },
  { value: "logo_branding", label: "ออกแบบตราสัญลักษณ์", desc: "บริการออกแบบโลโก้และเครื่องหมายการค้า" },
  { value: "ci_branding", label: "ออกแบบอัตลักษณ์ ( CI )", desc: "บริการจัดทำคู่มืออัตลักษณ์องค์กร Corporate Identity" },
  { value: "other", label: "อื่นๆ", desc: "บริการงานออกแบบสร้างสรรค์ประเภทอื่นๆ" }
];

export const IDC_BUSINESS_FILTER_OPTIONS: ModernSelectOption[] = [
  { value: "all", label: "ทุกกลุ่มธุรกิจ", desc: "แสดงงานทุกกลุ่มอุตสาหกรรมและผู้ประกอบการ" },
  ...IDC_BUSINESS_TYPE_OPTIONS
];

export const IDC_ASSIGNEE_OPTIONS: ModernSelectOption[] = [
  { value: "รอมอบหมาย", label: "⏳ รอมอบหมาย", desc: "ยังไม่ได้ระบุผู้รับผิดชอบงาน" },
  { value: "จ๊อบ AA", label: "จ๊อบ AA", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "วา WK", label: "วา WK", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "จอย RL", label: "จอย RL", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "พิม AC", label: "พิม AC", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "เยียร์ LLP", label: "เยียร์ LLP", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "นิน MTN", label: "นิน MTN", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" },
  { value: "ก้อง IK", label: "ก้อง IK", desc: "ทีมงานศูนย์ออกแบบและพัฒนานวัตกรรม" }
];

export const IDC_EDIT_STATUS_OPTIONS: ModernSelectOption[] = [
  { value: "pending", label: "รอดำเนินการ (Pending)", desc: "งานที่รับเรื่องแล้วและอยู่ระหว่างรอมอบหมาย/เริ่มงาน" },
  { value: "in_progress", label: "กำลังดำเนินการ (In Progress)", desc: "งานที่อยู่ระหว่างการออกแบบและพัฒนา" },
  { value: "completed", label: "เสร็จสิ้น (Completed)", desc: "งานที่ส่งมอบเรียบร้อยและประเมินผลความพึงพอใจแล้ว" }
];

export const IDC_ORGANIZATION_TYPE_OPTIONS: ModernSelectOption[] = [
  { value: "private", label: "🏢 ภาคเอกชน", desc: "นิติบุคคล, ห้างหุ้นส่วน, บริษัทจำกัด หรือผู้ประกอบการอิสระ" },
  { value: "government", label: "🏛️ ภาครัฐ", desc: "หน่วยงานราชการ, สถาบันการศึกษา หรือองค์กรของรัฐ" }
];

export const IDC_EDIT_SERVICE_MAIN_OPTIONS: ModernSelectOption[] = [
  { value: "product_design", label: "1. ออกแบบผลิตภัณฑ์", desc: "บริการออกแบบผลิตภัณฑ์อุตสาหกรรมและเชิงพาณิชย์" },
  { value: "packaging_design", label: "2. ออกแบบบรรจุภัณฑ์", desc: "บริการพัฒนาโครงสร้างและกราฟิกบรรจุภัณฑ์" },
  { value: "print_media", label: "3. ออกแบบสื่อสิ่งพิมพ์", desc: "บริการออกแบบสื่อสิ่งพิมพ์ แผ่นพับ โปสเตอร์ แคตตาล็อก" },
  { value: "logo_branding", label: "4. ออกแบบตราสัญลักษณ์", desc: "บริการออกแบบโลโก้และเครื่องหมายการค้า" },
  { value: "ci_branding", label: "5. ออกแบบอัตลักษณ์ ( CI )", desc: "บริการจัดทำคู่มืออัตลักษณ์องค์กร Corporate Identity" },
  { value: "other", label: "6. อื่นๆ (ระบุ)", desc: "บริการงานออกแบบสร้างสรรค์ประเภทอื่นๆ" }
];

export const IDC_STATUS_FILTER_OPTIONS: ModernSelectOption[] = [
  { value: "all", label: "ทุกสถานะ", desc: "แสดงงานทุกสถานะการดำเนินงาน" },
  { value: "pending", label: "รอดำเนินการ (Pending)", desc: "งานที่รับเรื่องแล้วและอยู่ระหว่างรอมอบหมาย/เริ่มงาน" },
  { value: "in_progress", label: "กำลังดำเนินการ (In Progress)", desc: "งานที่อยู่ระหว่างการออกแบบและพัฒนา" },
  { value: "completed", label: "เสร็จสิ้น (Completed)", desc: "งานที่ส่งมอบเรียบร้อยและประเมินผลความพึงพอใจแล้ว" }
];

export interface IDCRecord {
  id: string;
  code: string; // e.g. "IDC-2026-001"
  date: string; // "YYYY-MM-DD"
  // 1. ผู้รับบริการ & องค์กร
  clientName: string; // ชื่อผู้รับบริการ
  companyName: string; // ชื่อสถานประกอบการ
  organizationType: OrganizationType; // ประเภทหน่วยงาน: ภาคเอกชน, ภาครัฐ
  businessType: BusinessType; // ประเภทธุรกิจ
  businessTypeOther?: string; // ถ้าเลือกอื่นๆ
  address: string; // ที่อยู่
  taxId: string; // เลขประจำตัวผู้เสียภาษี
  phone: string; // เบอร์โทร
  email: string; // Email

  // 2. บริการ & ปริมาณ
  serviceMain: ServiceMainCategory; // ประเภทการเข้ารับบริการ
  consultationSub?: ConsultationSubCategory; // กรณีเลือกเข้ารับคำปรึกษา
  consultationSubOther?: string;
  serviceOtherDetail?: string; // กรณีเลือกอื่นๆ ในหมวดหลัก
  pieceCount: number; // จำนวนชิ้น / จำนวนครั้ง (KPI 31)
  projectBrief?: string; // รายละเอียดงานเพิ่มเติม

  // 3. ข้อมูลภายในและการเงิน (Assignee)
  assignee: string; // ผู้รับผิดชอบงาน
  revenue: number; // รายได้ที่บันทึกภายใน (บาท) (KPI 30)
  status: TaskStatus; // pending -> in_progress -> completed

  // 4. การประเมินความพึงพอใจ (KPI 34)
  surveyToken: string;
  surveySent: boolean;
  surveySentAt?: string;
  satisfactionScore?: number; // 1-5 scale (เช่น 4.9)
  satisfactionFeedback?: string;
  satisfactionEvaluatedAt?: string;
}

// Initial Mock Records for Demonstration & Rich Baseline
const INITIAL_RECORDS: IDCRecord[] = [
  {
    id: "idc-rec-1",
    code: "IDC-2026-001",
    date: "2026-06-25",
    clientName: "คุณกมลรัตน์ เลิศวานิช",
    companyName: "บริษัท ล้านนา ฟรุตส์ แอนด์ ดราย จำกัด",
    organizationType: "private",
    businessType: "food_processing",
    address: "128/4 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200",
    taxId: "0505562001928",
    phone: "081-952-4412",
    email: "kamonrat@lannafruits.co.th",
    serviceMain: "packaging_design",
    pieceCount: 3,
    projectBrief: "ออกแบบกล่องบรรจุภัณฑ์ลำไยอบแห้งพรีเมียมส่งออกตลาดญี่ปุ่น 3 รูปแบบ",
    assignee: "เยียร์ LLP",
    revenue: 45000,
    status: "completed",
    surveyToken: "survey-tok-001",
    surveySent: true,
    surveySentAt: "2026-06-28 16:30",
    satisfactionScore: 5.0,
    satisfactionFeedback: "งานออกแบบสวยงามทันสมัย ตรงตามโจทย์ส่งออกญี่ปุ่นมากค่ะ",
    satisfactionEvaluatedAt: "2026-06-29 10:20"
  },
  {
    id: "idc-rec-2",
    code: "IDC-2026-002",
    date: "2026-08-10",
    clientName: "ดร.ณัฐพงษ์ เจริญจิตวิทยา",
    companyName: "สถาบันวิจัยเกษตรอินทรีย์ล้านนา",
    organizationType: "government",
    businessType: "agriculture_biotech",
    address: "239 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200",
    taxId: "0994000123456",
    phone: "053-941-000",
    email: "nattapong@agri-bio.org",
    serviceMain: "consultation",
    consultationSub: "branding" as any, // fallback or logo
    consultationSubOther: "การจัดทำอัตลักษณ์สินค้าเกษตรปลอดภัย",
    pieceCount: 1,
    projectBrief: "ขอคำปรึกษาการวางทิศทางอัตลักษณ์และแบรนด์สินค้าชีวภาพสำหรับเกษตรกรแปลงใหญ่",
    assignee: "จ๊อบ AA",
    revenue: 12000,
    status: "completed",
    surveyToken: "survey-tok-002",
    surveySent: true,
    surveySentAt: "2026-08-12 11:00",
    satisfactionScore: 4.8,
    satisfactionFeedback: "ให้คำแนะนำเชิงลึกที่เป็นรูปธรรมและนำไปใช้งานต่อได้ทันทีครับ",
    satisfactionEvaluatedAt: "2026-08-12 14:45"
  },
  {
    id: "idc-rec-3",
    code: "IDC-2026-003",
    date: "2026-08-30",
    clientName: "คุณปิยะวัฒน์ ทองประเสริฐ",
    companyName: "ห้างหุ้นส่วนจำกัด กรีนฮิลล์ เอโค ทราเวล",
    organizationType: "private",
    businessType: "tourism",
    address: "45 ถ.ช้างคลาน อ.เมือง จ.เชียงใหม่ 50100",
    taxId: "0503558004112",
    phone: "089-771-3329",
    email: "piyawat@greenhillchiangmai.com",
    serviceMain: "print_media",
    pieceCount: 2,
    projectBrief: "ออกแบบชุดโบรชัวร์และ Infographic คู่มือท่องเที่ยวเชิงนิเวศน์ดอยอินทนนท์ 2 ภาษา",
    assignee: "พิม AC",
    revenue: 28000,
    status: "completed",
    surveyToken: "survey-tok-003",
    surveySent: true,
    surveySentAt: "2026-09-02 09:15",
    satisfactionScore: 4.9,
    satisfactionFeedback: "กราฟิกเข้าใจง่าย สีสันเข้ากับธีมธรรมชาติยอดเยี่ยม",
    satisfactionEvaluatedAt: "2026-09-02 16:00"
  },
  {
    id: "idc-rec-4",
    code: "IDC-2026-004",
    date: "2026-09-12",
    clientName: "คุณมนัสวินท์ เชษฐการ",
    companyName: "บริษัท เชียงใหม่ โลคอล ดิจิทัล โซลูชั่นส์ จำกัด",
    organizationType: "private",
    businessType: "digital",
    address: "99 หมู่ 2 ต.ป่าแดด อ.เมือง จ.เชียงใหม่ 50100",
    taxId: "0505565008910",
    phone: "082-445-9988",
    email: "manaswin@local-digital.tech",
    serviceMain: "logo_branding",
    pieceCount: 1,
    projectBrief: "ออกแบบตราสัญลักษณ์ (Logo CI) สำหรับแอปพลิเคชันท่องเที่ยวชุมชน Smart Lanna",
    assignee: "เยียร์ LLP",
    revenue: 35000,
    status: "in_progress",
    surveyToken: "survey-tok-004",
    surveySent: false
  },
  {
    id: "idc-rec-5",
    code: "IDC-2026-005",
    date: "2026-09-15",
    clientName: "คุณศิริพร เจริญผล",
    companyName: "กลุ่มวิสาหกิจชุมชนแปรรูปเห็ดหอมแม่แจ่ม",
    organizationType: "private",
    businessType: "food_processing",
    address: "18 หมู่ 4 ต.แม่นาจร อ.แม่แจ่ม จ.เชียงใหม่ 50270",
    taxId: "0993000552199",
    phone: "086-112-9087",
    email: "siriporn.maechaem@gmail.com",
    serviceMain: "consultation",
    consultationSub: "packaging",
    pieceCount: 1,
    projectBrief: "รับคำปรึกษาการยืดอายุและวัสดุบรรจุภัณฑ์ถุงซิปล็อคสูญญากาศสำหรับเห็ดอบกรอบ",
    assignee: "วา WK",
    revenue: 10000,
    status: "completed",
    surveyToken: "survey-tok-005",
    surveySent: true,
    surveySentAt: "2026-09-16 15:00",
    satisfactionScore: 4.7,
    satisfactionFeedback: "ได้คำแนะนำเรื่องมาตรฐาน อย. และการเลือกซองฟอยล์ดีมากๆ ค่ะ",
    satisfactionEvaluatedAt: "2026-09-16 16:30"
  },
  {
    id: "idc-rec-6",
    code: "IDC-2026-006",
    date: "2026-09-17",
    clientName: "นายวิทวัส เกียรติสกุล",
    companyName: "บริษัท นอร์ทเทิร์น สมาร์ท ฟาร์ม จำกัด",
    organizationType: "private",
    businessType: "agriculture_biotech",
    address: "142 ต.สันผักหวาน อ.หางดง จ.เชียงใหม่ 50230",
    taxId: "0505564003418",
    phone: "084-556-7812",
    email: "wittawat@smartfarm-north.com",
    serviceMain: "product_design",
    pieceCount: 2,
    projectBrief: "ออกแบบโครงสร้างเซ็นเซอร์ตรวจวัดดินและกล่องควบคุม IOT แปลงเกษตรกรรม",
    assignee: "จ๊อบ AA",
    revenue: 52000,
    status: "in_progress",
    surveyToken: "survey-tok-006",
    surveySent: false
  }
];

function isIDCBrief(b: any): boolean {
  if (!b) return false;
  if (b.details?.is_deleted) return false;
  const idcCode = b.details?.idc_code;
  const name = b.project_name || "";
  const sCat = b.details?.service_category || "";
  const cat = b.details?.category || "";
  return Boolean(
    idcCode ||
    name.startsWith("[IDC]") ||
    name.startsWith("[ศูนย์ออกแบบนวัตกรรม]") ||
    sCat.includes("Innovation Design Center") ||
    sCat.includes("ศูนย์ออกแบบ") ||
    sCat.includes("IDC") ||
    cat.includes("IDC")
  );
}

function convertBriefToIDCRecord(b: any, aMap: Record<string, { name: string; unit?: string }>): IDCRecord {
  const details = b.details || {};
  const code = details.idc_code || `IDC-2026-${String(b.id).slice(0, 4).toUpperCase()}`;
  const date = details.date || (b.created_at ? b.created_at.split("T")[0] : new Date().toISOString().split("T")[0]);
  const clientName = details.client_name || b.coordinator_nickname || "ไม่ระบุชื่อ";
  const companyName = details.company_name || "";
  const orgType: OrganizationType = details.organization_type || (b.decision_maker === "ภาครัฐ" ? "government" : "private");
  const businessType: BusinessType = details.business_type || "other";

  let serviceMain: ServiceMainCategory = details.service_main || details.service_type || "product_design";
  if (!["consultation", "product_design", "packaging_design", "print_media", "logo_branding", "other"].includes(serviceMain)) {
    const rawCategory = (details.service_category || details.category || "").toLowerCase();
    if (rawCategory.includes("บรรจุภัณฑ์") || rawCategory.includes("packaging")) serviceMain = "packaging_design";
    else if (rawCategory.includes("ผลิตภัณฑ์") || rawCategory.includes("product")) serviceMain = "product_design";
    else if (rawCategory.includes("สิ่งพิมพ์") || rawCategory.includes("print")) serviceMain = "print_media";
    else if (rawCategory.includes("ตราสัญลักษณ์") || rawCategory.includes("logo") || rawCategory.includes("ci")) serviceMain = "logo_branding";
    else if (rawCategory.includes("ปรึกษา") || rawCategory.includes("consult")) serviceMain = "consultation";
    else serviceMain = "other";
  }

  const assigneeName = aMap[b.assignee_id]?.name || details.assignee_name || (b.assignee_id === "47adfbc2-8d0e-4dc7-87ad-98895be82026" ? "พิม AC" : "พิม AC");

  return {
    id: b.id,
    code,
    date,
    clientName,
    companyName,
    organizationType: orgType,
    businessType,
    businessTypeOther: details.business_type_other || "",
    address: details.address || "",
    taxId: details.tax_id || "",
    phone: details.phone || "",
    email: b.requester_email || details.email || "",
    serviceMain,
    consultationSub: details.consultation_sub || "product",
    consultationSubOther: details.consultation_sub_other || details.other_service || "",
    serviceOtherDetail: details.service_other_detail || details.other_service || "",
    pieceCount: Number(details.piece_count) || 1,
    projectBrief: details.project_brief || details.description || details.details || "",
    assignee: assigneeName,
    revenue: Number(details.revenue) || 0,
    status: (b.status === "pending" || b.status === "in_progress" || b.status === "completed") ? b.status : "in_progress",
    surveyToken: details.survey_token || `survey-${b.id}`,
    surveySent: Boolean(details.survey_sent),
    surveySentAt: details.survey_sent_at || undefined,
    satisfactionScore: details.satisfaction_score ? Number(details.satisfaction_score) : undefined,
    satisfactionFeedback: details.satisfaction_feedback || undefined,
    satisfactionEvaluatedAt: details.satisfaction_evaluated_at || undefined
  };
}

export interface InnovationDesignCenterReportProps {
  activeTab?: "form" | "records" | "dashboard" | "pm-design";
  onTabChange?: (tab: "form" | "records" | "dashboard" | "pm-design") => void;
  exportPdfTrigger?: number;
}

export default function InnovationDesignCenterReport({
  activeTab: externalActiveTab,
  onTabChange,
  exportPdfTrigger,
}: InnovationDesignCenterReportProps = {}) {
  // Navigation Tabs: Form | Dataset & 5 KPIs | Dashboard & Strategy | PM Design Revenue
  const [internalActiveTab, setInternalActiveTab] = useState<"form" | "records" | "dashboard" | "pm-design">("records");
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = (tab: "form" | "records" | "dashboard" | "pm-design") => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  // Main Records State with LocalStorage Persistence
  const [records, setRecords] = useState<IDCRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_idc_records_v3");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Map legacy pending to in_progress and fix designer initials
            return parsed.map((item: any) => ({
              ...item,
              status: item.status === "pending" ? "in_progress" : item.status,
              assignee:
                item.assignee === "เยียร์ YR"
                  ? "เยียร์ LLP"
                  : item.assignee === "พิม PM"
                  ? "พิม AC"
                  : item.assignee
            }));
          }
        } catch (e) {
          console.error("Error parsing IDC records:", e);
        }
      }
    }
    return INITIAL_RECORDS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_idc_records_v3", JSON.stringify(records));
    }
  }, [records]);

  // Global Date Range Filter State (Applies across all tabs)
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
        // ปีปัจจุบัน (ตั้งแต่ 1 ม.ค. ถึงวันนี้)
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

  // PM Design Tasks from Supabase State
  const [pmBriefs, setPmBriefs] = useState<any[]>([]);
  const [assigneesMap, setAssigneesMap] = useState<Record<string, { name: string; unit?: string }>>({});
  const [loadingPm, setLoadingPm] = useState(false);
  const [pmSearchTerm, setPmSearchTerm] = useState("");
  const [pmFilterSector, setPmFilterSector] = useState<string>("all");
  const [pmFilterStatus, setPmFilterStatus] = useState<string>("all");
  const [pmFilterCategory, setPmFilterCategory] = useState<string>("all");
  const [selectedPmDetail, setSelectedPmDetail] = useState<any | null>(null);

  // Fetch PM Briefs & Assignees
  const fetchPMData = useCallback(async () => {
    setLoadingPm(true);
    try {
      const supabase = createClient();
      // 1. Assignees
      const { data: assigneesData } = await supabase
        .from('assignees')
        .select('id, name, unit');
      const map: Record<string, { name: string; unit?: string }> = {};
      if (assigneesData) {
        assigneesData.forEach(a => {
          map[a.id] = { name: a.name, unit: a.unit };
        });
        setAssigneesMap(map);
      }

      // 2. Briefs
      const { data: briefsData, error } = await supabase
        .from('briefs')
        .select('*')
        .order('created_at', { ascending: false });

      if (briefsData && !error) {
        setPmBriefs(briefsData);

        // Filter and map IDC briefs to IDCRecord
        const idcBriefs = briefsData.filter(isIDCBrief);
        if (idcBriefs.length > 0) {
          const mappedRecords: IDCRecord[] = idcBriefs.map(b => convertBriefToIDCRecord(b, map));
          mappedRecords.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
          setRecords(mappedRecords);
        }
      }
    } catch (err) {
      console.error("Error fetching PM briefs:", err);
    } finally {
      setLoadingPm(false);
    }
  }, []);

  useEffect(() => {
    fetchPMData();
  }, [fetchPMData]);

  // Filter for PM Design projects
  const designPmProjects = useMemo(() => {
    return pmBriefs.filter(b => {
      if (b.details?.is_deleted) return false;
      
      // 1. Explicitly marked as creative (Design)
      const pmWorkType = (b.details?.pm_work_type || "").toLowerCase();
      const isExplicitCreative = pmWorkType === "creative" || pmWorkType === "design";
      
      // 2. Unit is creative and has PM details
      const isCreativeUnit = b.unit === "creative" && Boolean(b.details?.project_code || b.details?.revenue !== undefined);
      
      // 3. PM project with design keywords or brand identity
      const isPMProject = Boolean(b.details?.project_code);
      const category = (b.details?.pm_work_category || b.details?.service_category || b.details?.category || "").toLowerCase();
      const projectName = (b.project_name || "").toLowerCase();
      
      const hasDesignKeywords = 
        category.includes("design") ||
        category.includes("creative") ||
        category.includes("ออกแบบ") ||
        category.includes("อัตลักษณ์") ||
        category.includes("logo") ||
        category.includes("packaging") ||
        category.includes("visual") ||
        projectName.includes("อัตลักษณ์") ||
        projectName.includes("ออกแบบ") ||
        projectName.includes("ดีไซน์") ||
        projectName.includes("บรรจุภัณฑ์");

      return isExplicitCreative || isCreativeUnit || (isPMProject && !b.details?.pm_work_type && hasDesignKeywords);
    });
  }, [pmBriefs]);

  // Filtered PM Design projects
  const filteredDesignPm = useMemo(() => {
    return designPmProjects.filter(b => {
      const code = b.details?.project_code || '';
      const name = b.project_name || '';
      const assigneeName = assigneesMap[b.assignee_id]?.name || b.coordinator_nickname || '';
      const category = b.details?.pm_work_category || b.details?.service_category || b.details?.category || '';
      const sector = b.details?.client_sector || (code.includes('GOV') ? 'government' : code.includes('PRIV') ? 'private' : '');

      // Date filtering for PM tasks
      const bDate = (b.details?.date || b.details?.project_date || b.created_at || "").split("T")[0];
      if (filterStartDate && bDate && bDate < filterStartDate) return false;
      if (filterEndDate && bDate && bDate > filterEndDate) return false;

      const matchSearch = !pmSearchTerm || 
        code.toLowerCase().includes(pmSearchTerm.toLowerCase()) ||
        name.toLowerCase().includes(pmSearchTerm.toLowerCase()) ||
        assigneeName.toLowerCase().includes(pmSearchTerm.toLowerCase()) ||
        category.toLowerCase().includes(pmSearchTerm.toLowerCase());

      const matchSector = pmFilterSector === 'all' || sector === pmFilterSector;
      const matchStatus = pmFilterStatus === 'all' || b.status === pmFilterStatus;
      const matchCategory = pmFilterCategory === 'all' || category === pmFilterCategory;

      return matchSearch && matchSector && matchStatus && matchCategory;
    });
  }, [designPmProjects, pmSearchTerm, pmFilterSector, pmFilterStatus, pmFilterCategory, assigneesMap, filterStartDate, filterEndDate]);

  // Financial KPIs for PM Design
  const pmFinancialSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let govCount = 0;
    let privCount = 0;
    let govRevenue = 0;
    let privRevenue = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;

    filteredDesignPm.forEach(b => {
      const rev = Number(b.details?.revenue) || 0;
      const cost = Number(b.details?.cost) || 0;
      const profit = b.details?.profit !== undefined && b.details?.profit !== null && b.details?.profit !== "" 
        ? Number(b.details?.profit) 
        : (rev - cost);

      totalRevenue += rev;
      totalCost += cost;
      totalProfit += profit;

      const sector = b.details?.client_sector || (b.details?.project_code?.includes('GOV') ? 'government' : 'private');
      if (sector === 'government') {
        govCount++;
        govRevenue += rev;
      } else {
        privCount++;
        privRevenue += rev;
      }

      if (b.status === 'completed') completedCount++;
      else if (b.status === 'in_progress') inProgressCount++;
      else pendingCount++;
    });

    const projectCount = filteredDesignPm.length;
    const avgRevenuePerProject = projectCount > 0 ? Math.round(totalRevenue / projectCount) : 0;
    const profitMarginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      projectCount,
      avgRevenuePerProject,
      profitMarginPercent,
      govCount,
      privCount,
      govRevenue,
      privRevenue,
      completedCount,
      inProgressCount,
      pendingCount
    };
  }, [filteredDesignPm]);

  // Export PM Design to CSV
  const handleExportPmDesignCSV = () => {
    if (filteredDesignPm.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const headers = [
      "รหัสโครงการ PM",
      "ชื่องานโครงการ",
      "ประเภทงานหลัก",
      "บริการย่อย Design",
      "ภาคส่วนผู้รับบริการ",
      "ผู้รับผิดชอบ (Assignee)",
      "รายรับ บาท (Revenue)",
      "ต้นทุน บาท (Cost)",
      "กำไรสุทธิ บาท (Profit)",
      "อัตรากำไร (%)",
      "กำหนดส่งมอบ",
      "สถานะงาน",
      "วันที่สร้าง"
    ];

    const statusMap: Record<string, string> = {
      completed: "เสร็จสิ้น (Completed)",
      in_progress: "กำลังทำ (In Progress)",
      pending: "รอดำเนินการ (Pending)",
      cancelled: "ยกเลิก (Cancelled)"
    };

    const rows = filteredDesignPm.map((b, idx) => {
      const code = b.details?.project_code || `PM-CC-${idx + 1}`;
      const rev = Number(b.details?.revenue) || 0;
      const cost = Number(b.details?.cost) || 0;
      const profit = b.details?.profit !== undefined && b.details?.profit !== null && b.details?.profit !== "" 
        ? Number(b.details?.profit) 
        : (rev - cost);
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : "0";
      const sector = (b.details?.client_sector === "government" || code.includes("GOV")) ? "ภาครัฐ" : "ภาคเอกชน";
      const assigneeName = assigneesMap[b.assignee_id]?.name || b.coordinator_nickname || "ไม่ระบุ";
      const category = b.details?.pm_work_category || b.details?.service_category || b.details?.category || "งานออกแบบ (Design)";
      const statusText = statusMap[b.status] || b.status;
      const deadline = b.deadline || "-";
      const createdAt = b.created_at ? new Date(b.created_at).toLocaleDateString("th-TH") : "-";

      return [
        `"${code}"`,
        `"${(b.project_name || "").replace(/"/g, '""')}"`,
        `"Design (งานออกแบบ)"`,
        `"${category.replace(/"/g, '""')}"`,
        `"${sector}"`,
        `"${assigneeName}"`,
        rev,
        cost,
        profit,
        `"${margin}%"`,
        `"${deadline}"`,
        `"${statusText}"`,
        `"${createdAt}"`
      ].join(",");
    });

    const summarySection = [
      "",
      "--- สรุปตัวชี้วัดทางการเงินโครงการ PM งานออกแบบ (Design PM Financials) ---",
      `"จำนวนโครงการ PM งานออกแบบรวม",${pmFinancialSummary.projectCount},"โครงการ"`,
      `"รายรับรวม (Total Revenue)",${pmFinancialSummary.totalRevenue},"บาท"`,
      `"ต้นทุนรวม (Total Cost)",${pmFinancialSummary.totalCost},"บาท"`,
      `"กำไรสุทธิรวม (Total Profit)",${pmFinancialSummary.totalProfit},"บาท"`,
      `"อัตรากำไรสุทธิรวม",${pmFinancialSummary.profitMarginPercent},"%"`
    ].join("\n");

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n") + "\n\n" + summarySection;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CC_PM_Design_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form State (For Entrepreneur Intake - internal fields are managed in Dataset tab)
  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    organizationType: "private" as OrganizationType,
    businessType: "food_processing" as BusinessType,
    businessTypeOther: "",
    address: "",
    taxId: "",
    phone: "",
    email: "",
    services: ["product_design"] as ServiceMainCategory[],
    serviceMain: "product_design" as ServiceMainCategory,
    consultationSub: "product" as ConsultationSubCategory,
    consultationSubOther: "",
    serviceOtherDetail: "",
    pieceCount: 1,
    projectBrief: ""
  });

  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({
    product_design: 1
  });

  const updateServiceQty = (key: string, delta: number) => {
    setServiceQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, (prev[key] || 1) + delta)
    }));
  };

  const setServiceQty = (key: string, qty: number) => {
    setServiceQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, qty)
    }));
  };

  const toggleService = (key: ServiceMainCategory) => {
    setFormData(prev => {
      const exists = prev.services.includes(key);
      const updated = exists
        ? prev.services.filter(k => k !== key)
        : [...prev.services, key];
      return {
        ...prev,
        services: updated,
        serviceMain: updated[0] || "other"
      };
    });
    if (!serviceQuantities[key]) {
      setServiceQuantities(prev => ({ ...prev, [key]: 1 }));
    }
  };

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterBusinessType, setFilterBusinessType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Survey Modal State
  const [surveyModalRecord, setSurveyModalRecord] = useState<IDCRecord | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isCopiedFormLink, setIsCopiedFormLink] = useState(false);

  // Edit / Delete Modal State
  const [editingRecord, setEditingRecord] = useState<IDCRecord | null>(null);

  // Date filtered records (used by Tab 1 & Tab 3)
  const dateFilteredRecords = useMemo(() => {
    return records.filter(item => {
      if (filterStartDate && item.date < filterStartDate) return false;
      if (filterEndDate && item.date > filterEndDate) return false;
      return true;
    });
  }, [records, filterStartDate, filterEndDate]);

  // Filtered records based on date and filters
  const filteredRecords = useMemo(() => {
    return dateFilteredRecords.filter(item => {
      const matchSearch =
        !searchTerm ||
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.taxId.includes(searchTerm) ||
        item.phone.includes(searchTerm);

      const matchService = filterService === "all" || item.serviceMain === filterService;
      const matchBusiness = filterBusinessType === "all" || item.businessType === filterBusinessType;
      const matchStatus = filterStatus === "all" || item.status === filterStatus;

      return matchSearch && matchService && matchBusiness && matchStatus;
    });
  }, [dateFilteredRecords, searchTerm, filterService, filterBusinessType, filterStatus]);

  // ==========================================
  // Calculated 5 Core KPIs + IMPACT (Calculated from filteredRecords)
  // ==========================================
  const kpiMetrics = useMemo(() => {
    // (29) KPI คน: จำนวนผู้เข้ารับบริการ (จำนวนราย)
    const kpiClients = filteredRecords.length;

    // (31) KPI ผลงาน: จำนวนกี่ชิ้นผลงานในหมวดประเภทการเข้ารับบริการ โดยรวมการเข้ารับคำปรึกษาด้วย
    const kpiPieces = filteredRecords.reduce((sum, r) => sum + (Number(r.pieceCount) || 1), 0);

    // (30) KPI รายได้: ผลรวมข้อมูลภายในที่ผู้รับผิดชอบหรือ assignee กรอกเอง (บาท)
    const kpiRevenue = filteredRecords.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);

    // (32) KPI ต่อชิ้น: ราคาเฉลี่ยต่อชิ้นผลงาน เอา (30) KPI รายได้ หารด้วย (31) KPI ผลงาน
    const kpiAvgPerPiece = kpiPieces > 0 ? Math.round(kpiRevenue / kpiPieces) : 0;

    // IMPACT: เอา (30) KPI รายได้ คูณ 7.5 แล้วเป็นตัวเลขเงิน
    const kpiImpact = Math.round(kpiRevenue * 7.5);

    // (34) พึงพอใจ: คะแนนความพึงพอใจเฉลี่ย และ สัดส่วนการตอบแบบประเมิน
    const evaluatedRecords = filteredRecords.filter(r => typeof r.satisfactionScore === "number");
    const avgScore =
      evaluatedRecords.length > 0
        ? (evaluatedRecords.reduce((sum, r) => sum + (r.satisfactionScore || 0), 0) / evaluatedRecords.length).toFixed(2)
        : filteredRecords.length === 0
        ? "0.00"
        : "4.85";

    // % ความพึงพอใจ คำนวณเป็นร้อยละจากคะแนนเต็ม 5.0 (เช่น 4.85 / 5 * 100 = 97%)
    const satisfactionPercentage = evaluatedRecords.length > 0 ? Math.round((parseFloat(avgScore) / 5) * 100) : 0;

    // ผู้ที่ส่งแบบประเมิน (surveySent หรือ completed หรือ evaluated)
    const sentCount = filteredRecords.filter(
      r => r.surveySent || r.status === "completed" || typeof r.satisfactionScore === "number"
    ).length;
    const evaluatedCount = evaluatedRecords.length;
    const surveyResponseRate = sentCount > 0 ? Math.round((evaluatedCount / sentCount) * 100) : 100;

    return {
      kpiClients, // (29)
      kpiPieces, // (31)
      kpiRevenue, // (30)
      kpiAvgPerPiece, // (32)
      kpiImpact, // IMPACT (30) * 7.5
      avgScore, // (34)
      satisfactionPercentage, // % ความพึงพอใจ
      sentCount, // ส่ง X
      evaluatedCount, // ตอบ Y
      surveyResponseRate,
      completedCount: sentCount
    };
  }, [filteredRecords]);

  const currentTabItemCount = useMemo(() => {
    if (activeTab === "records") return filteredRecords.length;
    if (activeTab === "pm-design") return filteredDesignPm.length;
    return dateFilteredRecords.length;
  }, [activeTab, filteredRecords.length, filteredDesignPm.length, dateFilteredRecords.length]);

  // ==========================================
  // Real-Time SWOT & TOWS Strategic Synthesis
  // Synthesizes 1. Dataset & 5 Core KPIs + IMPACT, 2. PM Design Projects, 3. Strategic Dashboard
  // ==========================================
  const swotAndTowsAnalysis = useMemo(() => {
    // 1. Sector Analysis
    const totalClients = dateFilteredRecords.length;
    const privateRecords = dateFilteredRecords.filter(r => r.organizationType === "private").length;
    const govRecords = dateFilteredRecords.filter(r => r.organizationType === "government").length;
    const privatePct = totalClients > 0 ? Math.round((privateRecords / totalClients) * 100) : 0;
    const govPct = totalClients > 0 ? Math.round((govRecords / totalClients) * 100) : 0;

    // 2. Industry Cluster Analysis
    const clusterCounts: Record<string, number> = {};
    dateFilteredRecords.forEach(r => {
      clusterCounts[r.businessType] = (clusterCounts[r.businessType] || 0) + 1;
    });
    const clusterLabels: Record<string, string> = {
      food_processing: "การแปรรูปอาหาร",
      agriculture_biotech: "เกษตร-เทคโนโลยีชีวภาพ",
      tourism: "การท่องเที่ยวและบริการสร้างสรรค์",
      digital: "ดิจิทัลและเทคโนโลยี",
      other: "อื่นๆ"
    };
    const sortedClusters = Object.entries(clusterCounts).sort((a, b) => b[1] - a[1]);
    const topClusterKey = sortedClusters[0]?.[0] || "food_processing";
    const topClusterName = clusterLabels[topClusterKey] || "การแปรรูปอาหาร";
    const topClusterCount = sortedClusters[0]?.[1] || 0;
    const topClusterPct = totalClients > 0 ? Math.round((topClusterCount / totalClients) * 100) : 0;

    // 3. Service Breakdown
    const serviceCounts: Record<string, number> = {};
    dateFilteredRecords.forEach(r => {
      serviceCounts[r.serviceMain] = (serviceCounts[r.serviceMain] || 0) + 1;
    });
    const serviceLabels: Record<string, string> = {
      packaging_design: "ออกแบบบรรจุภัณฑ์",
      consultation: "เข้ารับคำปรึกษา",
      logo_branding: "ออกแบบตราสัญลักษณ์",
      ci_branding: "ออกแบบอัตลักษณ์ (CI)",
      product_design: "ออกแบบผลิตภัณฑ์",
      print_media: "ออกแบบสื่อสิ่งพิมพ์",
      other: "อื่นๆ"
    };
    const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
    const topServiceKey = sortedServices[0]?.[0] || "packaging_design";
    const topServiceName = serviceLabels[topServiceKey] || "ออกแบบบรรจุภัณฑ์";
    const topServiceCount = sortedServices[0]?.[1] || 0;
    const topServicePct = totalClients > 0 ? Math.round((topServiceCount / totalClients) * 100) : 0;

    // 4. PM Metrics
    const pmRev = pmFinancialSummary.totalRevenue;
    const pmCost = pmFinancialSummary.totalCost;
    const pmProfit = pmFinancialSummary.totalProfit;
    const pmMargin = parseFloat(pmFinancialSummary.profitMarginPercent) || 0;
    const pmProjects = pmFinancialSummary.projectCount;
    const pmCompleted = pmFinancialSummary.completedCount;
    const pmInProgress = pmFinancialSummary.inProgressCount;
    const pmCompletionRate = pmProjects > 0 ? Math.round((pmCompleted / pmProjects) * 100) : 0;

    // 5. Combined Financial & Economic Metrics
    const totalCombinedRevenue = kpiMetrics.kpiRevenue + pmRev;
    const totalCombinedImpact = kpiMetrics.kpiImpact + Math.round(pmRev * 7.5);

    // Dynamic Strengths (จุดแข็ง - S)
    const strengths = [
      {
        id: "S1",
        title: "ความพึงพอใจการให้บริการระดับสูงมาก (KPI 34)",
        desc: `คะแนนเฉลี่ย ${kpiMetrics.avgScore}/5.0 (${kpiMetrics.satisfactionPercentage}%) จากผู้ประเมิน ${kpiMetrics.evaluatedCount} ราย สะท้อนถึงมาตรฐานคุณภาพงานสร้างสรรค์และความเชื่อมั่นของผู้รับบริการอย่างโดดเด่น`,
        metric: `★ ${kpiMetrics.avgScore} / 5.0`,
        source: "1. ชุดข้อมูล 5 KPI",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
      },
      {
        id: "S2",
        title: "ความสามารถในการทำกำไรของโครงการ PM งานออกแบบแข็งแกร่ง",
        desc: `โครงการ PM งานออกแบบมีอัตรากำไรสุทธิสูงถึง ${pmFinancialSummary.profitMarginPercent}% (กำไรสุทธิ ฿${pmProfit.toLocaleString()} จากรายรับ ฿${pmRev.toLocaleString()}) พิสูจน์ประสิทธิภาพการบริหารต้นทุนที่เป็นเลิศ`,
        metric: `Margin ${pmFinancialSummary.profitMarginPercent}%`,
        source: "2. โครงการ PM งานออกแบบ",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
      },
      {
        id: "S3",
        title: "พลังตัวคูณผลกระทบเชิงเศรษฐกิจสูง (7.5x Economic IMPACT)",
        desc: `สร้างผลกระทบต่อเศรษฐกิจภูมิภาครวมกว่า ฿${kpiMetrics.kpiImpact.toLocaleString()} (คำนวณจาก 7.5 เท่าของรายได้ ฿${kpiMetrics.kpiRevenue.toLocaleString()}) โดยเมื่อรวม PM จะสร้างผลกระทบสูงถึง ฿${totalCombinedImpact.toLocaleString()}`,
        metric: `฿${(kpiMetrics.kpiImpact / 1000000).toFixed(2)}M IMPACT`,
        source: "1. ชุดข้อมูล 5 KPI",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
      },
      {
        id: "S4",
        title: "ฐานผู้ประกอบการภาคเอกชนให้ความไว้วางใจสูง",
        desc: `สัดส่วนลูกค้าภาคเอกชนสูงถึง ${privatePct}% (${privateRecords} ราย) ส่วนใหญ่เป็นกลุ่ม SME และสตาร์ตอัปท้องถิ่น มีการส่งมอบงานรวมกว่า ${kpiMetrics.kpiPieces} ชิ้นงาน`,
        metric: `เอกชน ${privatePct}% (${privateRecords} ราย)`,
        source: "3. แดชบอร์ดเชิงกลยุทธ์",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
      }
    ];

    // Dynamic Weaknesses (จุดอ่อน - W)
    const weaknesses = [
      {
        id: "W1",
        title: "อัตราการตอบกลับแบบประเมินผลยังไม่ครอบคลุม 100%",
        desc: `ส่งแบบประเมิน ${kpiMetrics.sentCount} ราย แต่ตอบกลับ ${kpiMetrics.evaluatedCount} ราย (Response Rate: ${kpiMetrics.surveyResponseRate}%) ผู้ประกอบการบางส่วนเมื่อได้รับมอบไฟล์งานแล้วมักละเลยการประเมินผล`,
        metric: `ตอบกลับ ${kpiMetrics.surveyResponseRate}% (${kpiMetrics.evaluatedCount}/${kpiMetrics.sentCount})`,
        source: "1. ชุดข้อมูล 5 KPI",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
      },
      {
        id: "W2",
        title: "สัดส่วนโครงการที่อยู่ระหว่างดำเนินการสะสม (Work-In-Progress)",
        desc: `มีโครงการ PM ที่อยู่ระหว่างดำเนินการ ${pmInProgress} โครงการ (${pmProjects > 0 ? Math.round((pmInProgress / pmProjects) * 100) : 0}% ของงานทั้งหมด) สะท้อนระยะเวลาหมุนเวียนงานที่อาจเกิดคอขวดระหว่างทาง`,
        metric: `ค้างทำ ${pmInProgress} โครงการ`,
        source: "2. โครงการ PM งานออกแบบ",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
      },
      {
        id: "W3",
        title: "การกระจุกตัวในกลุ่มอุตสาหกรรมเดียว (Cluster Dependency)",
        desc: `กลุ่ม ${topClusterName} ครองสัดส่วนสูงถึง ${topClusterPct}% (${topClusterCount} ราย) ส่งผลให้รายได้และปริมาณงานขึ้นอยู่กับฤดูกาลผลผลิตและรอบการตลาดของกลุ่มนี้เป็นหลัก`,
        metric: `${topClusterName} ${topClusterPct}%`,
        source: "3. แดชบอร์ดเชิงกลยุทธ์",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
      },
      {
        id: "W4",
        title: "มูลค่าเฉลี่ยต่องานในบางรายการยังต่ำกว่าศักยภาพสูงสุด",
        desc: `ราคาเฉลี่ยต่อชิ้นผลงานอยู่ที่ ฿${kpiMetrics.kpiAvgPerPiece.toLocaleString()} / ชิ้น ซึ่งยังสามารถยกระดับผ่านการเสนอแพ็กเกจอัตลักษณ์แบรนด์แบบครบวงจร (Full Identity Package)`,
        metric: `เฉลี่ย ฿${kpiMetrics.kpiAvgPerPiece.toLocaleString()}/ชิ้น`,
        source: "1. ชุดข้อมูล 5 KPI",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
      }
    ];

    // Dynamic Opportunities (โอกาส - O)
    const opportunities = [
      {
        id: "O1",
        title: `ความต้องการบริการด้าน ${topServiceName} เติบโตต่อเนื่อง`,
        desc: `ความต้องการ ${topServiceName} คิดเป็น ${topServicePct}% สอดคล้องกับนโยบายเร่งยกระดับมาตรฐานสินค้าชุมชนสู่โมเดิร์นเทรดและตลาดการค้าออนไลน์ระดับสากล`,
        metric: `ดีมานด์อันดับ 1 (${topServicePct}%)`,
        source: "3. แดชบอร์ดเชิงกลยุทธ์",
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200"
      },
      {
        id: "O2",
        title: "โอกาสเชื่อมโยงงบสนับสนุนและนวัตกรรม Voucher ภาครัฐ",
        desc: `การบูรณาการกับทุน TED Fund, บพข., กสพ. และอุทยานฯ ช่วยปลดล็อกงบว่าจ้างของ SME ปัจจุบันมีรายรับจากโครงการภาครัฐ ฿${pmFinancialSummary.govRevenue.toLocaleString()} (${pmFinancialSummary.govCount} งาน)`,
        metric: `งบรัฐ ฿${pmFinancialSummary.govRevenue.toLocaleString()}`,
        source: "2. โครงการ PM งานออกแบบ",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
      },
      {
        id: "O3",
        title: "กระแสเศรษฐกิจชีวภาพ หมุนเวียน และสีเขียว (BCG Economy)",
        desc: `ผู้ประกอบการเกษตรและอาหารชีวภาพในภาคเหนือมีความต้องการบรรจุภัณฑ์ที่เป็นมิตรต่อสิ่งแวดล้อมและย่อยสลายได้ เปิดโอกาสสร้างมูลค่าเพิ่มต่องานออกแบบขั้นสูง`,
        metric: `เทรนด์ BCG & Green Growth`,
        source: "3. แดชบอร์ดเชิงกลยุทธ์",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
      },
      {
        id: "O4",
        title: "การยกระดับสู่การออกแบบอัตลักษณ์องค์กรเต็มรูปแบบ (Full CI)",
        desc: `ผู้เข้ารับคำปรึกษากว่า 60% มีแนวโน้มพัฒนาต่อยอดสู่การว่าจ้างออกแบบอัตลักษณ์ (CI) และกราฟิกการตลาดเชิงพาณิชย์ ช่วยสร้างมูลค่าสะสมต่อเนื่อง`,
        metric: `Cross-sell อัตลักษณ์ CI`,
        source: "1. ชุดข้อมูล 5 KPI",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
      }
    ];

    // Dynamic Threats (อุปสรรค - T)
    const threats = [
      {
        id: "T1",
        title: "แรงกดดันจาก Generative AI และเครื่องมือออกแบบอัตโนมัติ",
        desc: `เครื่องมือออกแบบ AI สำเร็จรูปลดต้นทุนงานกราฟิกพื้นฐาน ทำให้ผู้ประกอบการบางกลุ่มคาดหวังราคาที่ต่ำลงหรือหันไปใช้บริการทดแทน`,
        metric: `AI & Automation Shift`,
        source: "3. แดชบอร์ดเชิงกลยุทธ์",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
      },
      {
        id: "T2",
        title: "ความเสี่ยงการแบกรับต้นทุนและการแก้งานซ้ำซ้อน (Scope Creep)",
        desc: `ต้นทุนรวมโครงการ PM ปัจจุบันอยู่ที่ ฿${pmCost.toLocaleString()} หากลูกค้าไม่มี Design Brief ที่ชัดเจน การแก้ไขแบบซ้ำซ้อนจะกระทบอัตรากำไรโดยตรง`,
        metric: `ต้นทุนรวม ฿${pmCost.toLocaleString()}`,
        source: "2. โครงการ PM งานออกแบบ",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
      },
      {
        id: "T3",
        title: "ข้อจำกัดด้านงบประมาณและสภาพคล่องของผู้ประกอบการ Micro-SME",
        desc: `ความผันผวนทางเศรษฐกิจและกำลังซื้ออาจทำให้ผู้ประกอบการรายย่อยชะลอการตัดสินใจว่าจ้าง หรือลดงบประมาณในขั้นตอนการผลิตจริง`,
        metric: `ความเสี่ยงสภาพคล่อง SME`,
        source: "1. ชุดข้อมูล 5 KPI",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
      },
      {
        id: "T4",
        title: "ความล่าช้าในการจัดส่งข้อมูลผลิตภัณฑ์และเอกสารรับรอง",
        desc: `การรอข้อมูลคุณค่าทางโภชนาการ ผลตรวจแล็บ และเลขที่จดแจ้ง อย. จากลูกค้า ส่งผลให้งานค้างในสถานะ In Progress นานเกินกำหนดส่งมอบ`,
        metric: `Bottleneck ส่งมอบเอกสาร`,
        source: "3. แดชบอร์ดเชิงกลยุทธ์",
        badgeColor: "bg-orange-50 text-orange-700 border-orange-200"
      }
    ];

    // Dynamic TOWS Strategic Matrix
    const tows = {
      so: {
        strategy: "กลยุทธ์เชิงรุก (SO Strategies - Max-Max)",
        theme: "ใช้จุดแข็งด้านคุณภาพความพึงพอใจและผลกำไรสูง เร่งขยายบริการสู่ตลาดเป้าหมายที่มีดีมานด์สูงสุด",
        badge: "เชิงรุก (SO)",
        badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300",
        containerStyle: "border-emerald-200 bg-emerald-50/20 hover:border-emerald-400",
        accentColor: "bg-emerald-600 text-white",
        tactics: [
          {
            code: "SO-1",
            title: `แพ็กเกจพรีเมียม "Total Brand & Packaging Solution" เจาะกลุ่ม ${topClusterName}`,
            detail: `นำผลงานจริงพร้อมคะแนนความพึงพอใจระดับสูง (${kpiMetrics.avgScore}/5.0) และตัวเลขผลกระทบทางเศรษฐกิจ 7.5 เท่า (IMPACT ฿${kpiMetrics.kpiImpact.toLocaleString()}) เป็นข้อเสนอเชิงประจักษ์ในการปิดดีลกลุ่มผู้ประกอบการแปรรูปอาหารและเกษตรนวัตกรรม`,
            impactKpi: "หนุน (30) รายได้ & (34) ความพึงพอใจ",
            target: `ผลักดันรายได้รวมทะลุเป้าหมาย ฿${(totalCombinedRevenue * 1.25).toLocaleString()}`
          },
          {
            code: "SO-2",
            title: "ขยายโครงการ PM ร่วมทุนภาครัฐ-เอกชน (Co-Funding Project Scaling)",
            detail: `ใช้จุดแข็งด้าน Margin ที่แข็งแกร่ง (${pmFinancialSummary.profitMarginPercent}%) ขยายความร่วมมือกับกองทุน TED Fund และ NIA เพื่อเพิ่มมูลค่าโครงการ PM จากเฉลี่ย ฿${pmFinancialSummary.avgRevenuePerProject.toLocaleString()} สู่โครงการนวัตกรรมขนาดใหญ่`,
            impactKpi: "ขยาย PM Revenue & Net Profit",
            target: `รักษา Margin ไม่ต่ำกว่า 60% ในทุกโครงการ`
          }
        ]
      },
      wo: {
        strategy: "กลยุทธ์เชิงแก้ไข/พัฒนา (WO Strategies - Min-Max)",
        theme: "เอาชนะจุดอ่อนด้านงานค้างสะสมและอัตราตอบแบบประเมิน โดยอาศัยโอกาสจากเทคโนโลยีและตลาดใหม่",
        badge: "เชิงแก้ไข (WO)",
        badgeStyle: "bg-blue-100 text-blue-800 border-blue-300",
        containerStyle: "border-blue-200 bg-blue-50/20 hover:border-blue-400",
        accentColor: "bg-blue-600 text-white",
        tactics: [
          {
            code: "WO-1",
            title: "ระบบ One-Click LINE Survey Link ผูกการดาวน์โหลดไฟล์ผลงานจริง",
            detail: `แก้ปัญหาอัตราตอบแบบประเมินความพึงพอใจ (${kpiMetrics.surveyResponseRate}% ตอบ ${kpiMetrics.evaluatedCount} จาก ${kpiMetrics.sentCount} ราย) โดยผูกลิงก์ดาวน์โหลด Final Print-ready Assets เข้ากับการตอบแบบสอบถามสั้น 3 ข้อ เพิ่ม Response Rate สู่ 95%+`,
            impactKpi: "ปิด Gap KPI 34 ความพึงพอใจ",
            target: "อัตราตอบแบบประเมินมากกว่า 95%"
          },
          {
            code: "WO-2",
            title: `กระจายความเสี่ยงพอร์ตโฟลิโอสู่ Green Packaging & Digital Branding`,
            detail: `ลดการพึ่งพากลุ่ม ${topClusterName} (${topClusterPct}%) โดยเปิดสายบริการบรรจุภัณฑ์รักษ์โลก (BCG) และสื่ออัตลักษณ์ดิจิทัล เพื่อดึงดูดลูกค้าเอกชนกลุ่มเทคโนโลยีและการท่องเที่ยวเชิงสร้างสรรค์`,
            impactKpi: "กระจายสัดส่วนอุตสาหกรรมเป้าหมาย",
            target: "เพิ่มสัดส่วนอุตสาหกรรมอื่นเป็น > 40%"
          }
        ]
      },
      st: {
        strategy: "กลยุทธ์เชิงป้องกัน (ST Strategies - Max-Min)",
        theme: "ใช้จุดแข็งความเชี่ยวชาญแบบบูรณาการระดับอุทยานฯ ป้องกันการคุกคามจาก AI และสงครามราคา",
        badge: "เชิงป้องกัน (ST)",
        badgeStyle: "bg-amber-100 text-amber-800 border-amber-300",
        containerStyle: "border-amber-200 bg-amber-50/20 hover:border-amber-400",
        accentColor: "bg-amber-600 text-white",
        tactics: [
          {
            code: "ST-1",
            title: "ชูจุดเด่นที่ AI เลียนแบบไม่ได้: Mockup ขึ้นรูปจริง & ห้องแล็บทดสอบบรรจุภัณฑ์",
            detail: `สร้างความแตกต่างเหนือ Generative AI และกราฟิกฟรีแลนซ์ทั่วไป โดยชูศักยภาพของ STeP ด้านการขึ้นรูปต้นแบบ 3D Mockup จริง, การทดสอบ Shelf-life ในห้องปฏิบัติการ, และคำปรึกษาการคุ้มครองสิทธิบัตร/ทรัพย์สินทางปัญญา`,
            impactKpi: "สร้างแต้มต่อการแข่งขัน & พรีเมียมแบรนดิ้ง",
            target: "100% ของงานออกแบบผ่านการตรวจสเปกผลิตจริง"
          },
          {
            code: "ST-2",
            title: "โครงสร้างราคาแบบ Modular Tiering รองรับ SME ทุกระดับงบประมาณ",
            detail: `นำโครงสร้างกำไรที่แข็งแรง (${pmFinancialSummary.profitMarginPercent}%) มาจัดแพ็กเกจแบ่งระดับ (Starter / Growth / Enterprise) เพื่อให้ Micro-SME เข้าถึงได้ตามงบประมาณ โดยรักษามาตรฐานงานและไม่เกิดการตัดราคา`,
            impactKpi: "หนุน (29) จำนวนผู้รับบริการ & ป้องกัน Margin",
            target: "ขยายฐานลูกค้าเอกชนไม่ต่ำกว่า 15-20 ราย/รอบ"
          }
        ]
      },
      wt: {
        strategy: "กลยุทธ์เชิงรับ/ลดความเสี่ยง (WT Strategies - Min-Min)",
        theme: "ลดต้นทุนแฝง ป้องกันปัญหาแก้งานซ้ำซ้อน และลดความเสี่ยงจากความล่าช้าของผู้รับบริการ",
        badge: "เชิงรับ/ลดความเสี่ยง (WT)",
        badgeStyle: "bg-rose-100 text-rose-800 border-rose-300",
        containerStyle: "border-rose-200 bg-rose-50/20 hover:border-rose-400",
        accentColor: "bg-rose-600 text-white",
        tactics: [
          {
            code: "WT-1",
            title: "ระบบ Standardized Design Intake & นโยบายจำกัดรอบแก้ไขแบบ (Revision Lock)",
            detail: `คุมต้นทุนรวมของโครงการ PM (ปัจจุบัน ฿${pmCost.toLocaleString()}) โดยกำหนดให้ผู้ประกอบการส่งเอกสารบังคับ (สเปกผลิตภัณฑ์, เลข อย., โลโก้เดิม) ก่อนเริ่มงาน และทำข้อตกลงตรวจแก้แบบร่างไม่เกิน 3 ครั้ง เพื่อเคลียร์งานค้าง In Progress (${pmInProgress} โครงการ)`,
            impactKpi: "ลดต้นทุนโครงการ & เร่งปิดสถานะงาน",
            target: `ลดงานค้าง In Progress ลง 50% ภายใน 30 วัน`
          },
          {
            code: "WT-2",
            title: "พัฒนา Asset Template มาตรฐานเพื่อเร่งรอบหมุนเวียนงาน (Turnaround Time)",
            detail: `จัดทำเทมเพลตมาตรฐานสำหรับงานฉลากและสิ่งพิมพ์ เพื่อลดเวลาการขึ้นโครงสร้าง เพิ่มรายได้เฉลี่ยต่อชิ้นงาน (ปัจจุบัน ฿${kpiMetrics.kpiAvgPerPiece.toLocaleString()}/ชิ้น) และลดความเสี่ยงจากการชะลอตัวทางเศรษฐกิจ`,
            impactKpi: "ยกระดับ (32) รายได้เฉลี่ยต่อชิ้นงาน",
            target: `ดันมูลค่าเฉลี่ยต่อชิ้นงานเกิน ฿${Math.round(kpiMetrics.kpiAvgPerPiece * 1.3).toLocaleString()}`
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
      totalClients,
      privateRecords,
      govRecords,
      privatePct,
      govPct,
      topClusterName,
      topClusterPct,
      topServiceName,
      topServicePct,
      pmRev,
      pmCost,
      pmProfit,
      pmMargin,
      pmProjects,
      pmCompleted,
      pmInProgress,
      pmCompletionRate,
      totalCombinedRevenue,
      totalCombinedImpact
    };
  }, [dateFilteredRecords, kpiMetrics, pmFinancialSummary]);

  // ==========================================
  // Comprehensive 3-Part Executive PDF Export
  // ==========================================
  const handleExportFullPdf = useCallback(() => {
    exportIDCFullPdf({
      timeframe,
      filterStartDate,
      filterEndDate,
      records: dateFilteredRecords,
      kpiMetrics,
      designPmProjects: filteredDesignPm,
      pmFinancialSummary,
      swotAndTowsAnalysis
    });
  }, [timeframe, filterStartDate, filterEndDate, dateFilteredRecords, kpiMetrics, filteredDesignPm, pmFinancialSummary, swotAndTowsAnalysis]);

  // Trigger export if requested via exportPdfTrigger prop
  const lastPdfTriggerRef = useRef(exportPdfTrigger);
  const exportCsvRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (exportPdfTrigger && exportPdfTrigger !== lastPdfTriggerRef.current) {
      lastPdfTriggerRef.current = exportPdfTrigger;
      handleExportFullPdf();
    }
  }, [exportPdfTrigger, handleExportFullPdf]);

  // Global window event listener for export
  useEffect(() => {
    const onTrigger = () => handleExportFullPdf();
    const onTriggerCsv = () => {
      if (exportCsvRef.current) exportCsvRef.current();
    };
    window.addEventListener("export-idc-full-pdf", onTrigger);
    window.addEventListener("export-idc-csv", onTriggerCsv);
    return () => {
      window.removeEventListener("export-idc-full-pdf", onTrigger);
      window.removeEventListener("export-idc-csv", onTriggerCsv);
    };
  }, [handleExportFullPdf]);

  // Export Strategic Dashboard & SWOT/TOWS to Excel / CSV
  const handleExportStrategicExcel = () => {
    const lines: string[] = [];

    const timeframeText =
      filterStartDate && filterEndDate
        ? `ระหว่างวันที่ ${filterStartDate} ถึง ${filterEndDate}`
        : filterStartDate
        ? `ตั้งแต่วันที่ ${filterStartDate}`
        : filterEndDate
        ? `จนถึงวันที่ ${filterEndDate}`
        : timeframe === "ALL"
        ? "ข้อมูลทั้งหมดตั้งแต่เริ่มระบบ (ALL)"
        : `ช่วงเวลา: ${timeframe}`;

    // Title / Metadata
    lines.push(`"รายงานการวิเคราะห์เชิงกลยุทธ์ แดชบอร์ด และ SWOT / TOWS Matrix - ศูนย์ออกแบบและพัฒนานวัตกรรม"`);
    lines.push(`"ช่วงเวลาที่เลือก: ${timeframeText}"`);
    lines.push(`"วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")} ${new Date().toLocaleTimeString("th-TH")}"`);
    lines.push("");

    // Section 1: 5 Core KPIs & IMPACT
    lines.push("=== 1. สรุปผลการประเมิน 5 ตัวชี้วัดสำคัญ (5 Core KPIs) & 7.5x IMPACT ===");
    lines.push(`"ตัวชี้วัด","ผลการดำเนินงาน","หน่วย","เป้าหมาย/หมายเหตุ"`);
    lines.push(`"(29) KPI คน (จำนวนผู้เข้ารับบริการ)",${kpiMetrics.kpiClients},"ราย","สะสมตามช่วงเวลา"`);
    lines.push(`"(31) KPI ผลงาน (จำนวนชิ้นผลงานรวม)",${kpiMetrics.kpiPieces},"ชิ้น/ครั้ง","รวมการเข้ารับคำปรึกษา"`);
    lines.push(`"(30) KPI รายได้ (ผลรวมรายได้ภายใน)",${kpiMetrics.kpiRevenue},"บาท","รายได้จากผู้ประกอบการ"`);
    lines.push(`"(32) KPI ต่อชิ้น (ราคาเฉลี่ยต่อชิ้น)",${kpiMetrics.kpiAvgPerPiece},"บาท/ชิ้น","คำนวณจาก (30) หารด้วย (31)"`);
    lines.push(`"7.5x Economic IMPACT (ผลกระทบทางเศรษฐกิจ)",${kpiMetrics.kpiImpact},"บาท","คำนวณจาก (30) x 7.5 เท่า"`);
    lines.push(`"(34) KPI ความพึงพอใจเฉลี่ย",${kpiMetrics.avgScore},"/ 5.0 คะแนน","คิดเป็น ${kpiMetrics.satisfactionPercentage}%"`);
    lines.push(`"สัดส่วนการส่ง/ตอบแบบประเมิน","ส่ง ${kpiMetrics.sentCount} / ตอบ ${kpiMetrics.evaluatedCount} (${kpiMetrics.surveyResponseRate}%)","ราย","อัตราการตอบกลับแบบประเมิน"`);
    lines.push("");

    // Section 2: PM Design Financials
    lines.push("=== 2. สรุปตัวเลขทางการเงินโครงการ PM งานออกแบบ (Design PM Financials) ===");
    lines.push(`"รายการตัวชี้วัด PM","มูลค่า","หน่วย"`);
    lines.push(`"จำนวนโครงการ PM ทั้งหมด",${pmFinancialSummary.projectCount},"โครงการ"`);
    lines.push(`"โครงการที่เสร็จสิ้น (Completed)",${pmFinancialSummary.completedCount},"โครงการ"`);
    lines.push(`"โครงการที่อยู่ระหว่างดำเนินการ (In Progress)",${pmFinancialSummary.inProgressCount},"โครงการ"`);
    lines.push(`"รายรับรวม (Total Revenue)",${pmFinancialSummary.totalRevenue},"บาท"`);
    lines.push(`"ต้นทุนรวม (Total Cost)",${pmFinancialSummary.totalCost},"บาท"`);
    lines.push(`"กำไรสุทธิรวม (Net Profit)",${pmFinancialSummary.totalProfit},"บาท"`);
    lines.push(`"อัตรากำไรสุทธิ (Profit Margin)",${pmFinancialSummary.profitMarginPercent},"% "`);
    lines.push(`"รายได้รวม 2 ระบบ (Dataset + PM)",${swotAndTowsAnalysis.totalCombinedRevenue},"บาท"`);
    lines.push(`"7.5x IMPACT รวม 2 ระบบ",${swotAndTowsAnalysis.totalCombinedImpact},"บาท"`);
    lines.push("");

    // Section 3: Market & Industry Segmentation
    lines.push("=== 3. การวิเคราะห์ส่วนแบ่งตลาดและคลัสเตอร์อุตสาหกรรม ===");
    lines.push(`"กลุ่มเป้าหมาย/สัดส่วน","จำนวน","สัดส่วน (%)"`);
    lines.push(`"ภาคเอกชน (Private SME)",${swotAndTowsAnalysis.privateRecords},"${swotAndTowsAnalysis.privatePct}%"`);
    lines.push(`"ภาครัฐและหน่วยงาน (Government)",${swotAndTowsAnalysis.govRecords},"${swotAndTowsAnalysis.govPct}%"`);
    lines.push(`"อุตสาหกรรมอันดับ 1 (${swotAndTowsAnalysis.topClusterName})",-,"${swotAndTowsAnalysis.topClusterPct}%"`);
    lines.push(`"บริการออกแบบยอดนิยม (${swotAndTowsAnalysis.topServiceName})",-,"${swotAndTowsAnalysis.topServicePct}%"`);
    lines.push("");

    // Section 4: SWOT Analysis
    lines.push("=== 4. การประเมินสภาวะแวดล้อม SWOT Analysis (4 มิติ) ===");
    lines.push(`"มิติ SWOT","รหัส","หัวข้อการวิเคราะห์","รายละเอียดเชิงลึก","ตัวชี้วัดเชิงประจักษ์","แหล่งที่มาข้อมูล"`);
    swotAndTowsAnalysis.strengths.forEach(s => {
      lines.push(`"จุดแข็ง (Strengths - S)","${s.id}","${s.title.replace(/"/g, '""')}","${s.desc.replace(/"/g, '""')}","${s.metric.replace(/"/g, '""')}","${s.source}"`);
    });
    swotAndTowsAnalysis.weaknesses.forEach(w => {
      lines.push(`"จุดอ่อน (Weaknesses - W)","${w.id}","${w.title.replace(/"/g, '""')}","${w.desc.replace(/"/g, '""')}","${w.metric.replace(/"/g, '""')}","${w.source}"`);
    });
    swotAndTowsAnalysis.opportunities.forEach(o => {
      lines.push(`"โอกาส (Opportunities - O)","${o.id}","${o.title.replace(/"/g, '""')}","${o.desc.replace(/"/g, '""')}","${o.metric.replace(/"/g, '""')}","${o.source}"`);
    });
    swotAndTowsAnalysis.threats.forEach(t => {
      lines.push(`"อุปสรรค (Threats - T)","${t.id}","${t.title.replace(/"/g, '""')}","${t.desc.replace(/"/g, '""')}","${t.metric.replace(/"/g, '""')}","${t.source}"`);
    });
    lines.push("");

    // Section 5: TOWS Matrix
    lines.push("=== 5. เมทริกซ์กำหนดทิศทางกลยุทธ์ TOWS Matrix (4 ทิศทาง) ===");
    lines.push(`"ทิศทางกลยุทธ์","รหัสมาตรการ","ชื่อมาตรการกลยุทธ์","รายละเอียดแผนการดำเนินงาน","ตัวชี้วัดที่ส่งผล (Impact KPI)","เป้าหมายเชิงผลลัพธ์ (Target)"`);
    
    // SO
    swotAndTowsAnalysis.tows.so.tactics.forEach(t => {
      lines.push(`"${swotAndTowsAnalysis.tows.so.strategy}","${t.code}","${t.title.replace(/"/g, '""')}","${t.detail.replace(/"/g, '""')}","${t.impactKpi.replace(/"/g, '""')}","${t.target.replace(/"/g, '""')}"`);
    });
    // WO
    swotAndTowsAnalysis.tows.wo.tactics.forEach(t => {
      lines.push(`"${swotAndTowsAnalysis.tows.wo.strategy}","${t.code}","${t.title.replace(/"/g, '""')}","${t.detail.replace(/"/g, '""')}","${t.impactKpi.replace(/"/g, '""')}","${t.target.replace(/"/g, '""')}"`);
    });
    // ST
    swotAndTowsAnalysis.tows.st.tactics.forEach(t => {
      lines.push(`"${swotAndTowsAnalysis.tows.st.strategy}","${t.code}","${t.title.replace(/"/g, '""')}","${t.detail.replace(/"/g, '""')}","${t.impactKpi.replace(/"/g, '""')}","${t.target.replace(/"/g, '""')}"`);
    });
    // WT
    swotAndTowsAnalysis.tows.wt.tactics.forEach(t => {
      lines.push(`"${swotAndTowsAnalysis.tows.wt.strategy}","${t.code}","${t.title.replace(/"/g, '""')}","${t.detail.replace(/"/g, '""')}","${t.impactKpi.replace(/"/g, '""')}","${t.target.replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IDC_Strategic_SWOT_TOWS_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // Form Submission Handler (Requirement 3: Add to Internal tasks with Assignee: พิม)
  // ==========================================
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.companyName.trim()) {
      alert("กรุณากรอกชื่อผู้รับบริการ และชื่อสถานประกอบการ");
      return;
    }

    if (formData.services && formData.services.length === 0) {
      alert("กรุณาเลือกประเภทงานที่ต้องการรับคำปรึกษาอย่างน้อย 1 รายการ");
      return;
    }

    const nextCodeNumber = records.length + 1;
    const newCode = `IDC-2026-${String(nextCodeNumber).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const newToken = `survey-${Date.now().toString(36)}`;

    const PIM_ID = "47adfbc2-8d0e-4dc7-87ad-98895be82026";
    const PIM_NAME = "พิม AC";

    const serviceMap: Record<ServiceMainCategory, string> = {
      product_design: "ออกแบบผลิตภัณฑ์",
      packaging_design: "ออกแบบบรรจุภัณฑ์",
      print_media: "ออกแบบสื่อสิ่งพิมพ์",
      logo_branding: "ออกแบบตราสัญลักษณ์",
      ci_branding: "ออกแบบอัตลักษณ์ ( CI )",
      other: formData.serviceOtherDetail.trim() || "อื่นๆ",
      consultation: "เข้ารับคำปรึกษา"
    };
    const selectedServices = formData.services && formData.services.length > 0 ? formData.services : [formData.serviceMain];
    const totalPieces = selectedServices.reduce((sum, s) => sum + (serviceQuantities[s] || 1), 0);
    const selectedLabels = selectedServices.map(s => {
      const name = serviceMap[s] || s;
      const qty = serviceQuantities[s] || 1;
      return qty > 1 ? `${name} (${qty} ชิ้น)` : name;
    });
    const serviceLabel = selectedLabels.join(", ") || "งานให้คำปรึกษา";

    // 1. Insert into Supabase 'briefs' table as an Internal Task assigned to Pim
    try {
      const supabase = createClient();
      const taskTitle = `[ศูนย์ออกแบบนวัตกรรม] ให้คำปรึกษา: ${serviceLabel} - ${formData.companyName.trim()}`;

      const { data: insertedData, error: briefError } = await supabase.from('briefs').insert([{
        project_name: taskTitle,
        unit: 'internal',
        status: 'pending',
        priority: 'Medium',
        assignee_id: PIM_ID,
        coordinator_nickname: formData.clientName.trim(),
        requester_email: formData.email.trim() || 'idc@step.cmu.ac.th',
        decision_maker: formData.organizationType === 'government' ? 'ภาครัฐ' : 'ภาคเอกชน',
        details: {
          date: today,
          category: 'Design',
          service_category: 'Innovation Design Center',
          idc_code: newCode,
          client_name: formData.clientName.trim(),
          company_name: formData.companyName.trim(),
          organization: formData.organizationType === 'government' ? 'ภาครัฐ' : 'ภาคเอกชน',
          organization_type: formData.organizationType,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          tax_id: formData.taxId.trim(),
          address: formData.address.trim(),
          business_type: formData.businessType,
          business_type_other: formData.businessTypeOther.trim(),
          services: selectedServices,
          service_labels: selectedLabels,
          service_quantities: serviceQuantities,
          service_main: selectedServices[0] || 'other',
          service_label: serviceLabel,
          service_other_detail: formData.serviceOtherDetail.trim(),
          piece_count: totalPieces,
          revenue: 0,
          description: formData.projectBrief.trim() || `คำขอรับคำปรึกษาศูนย์ออกแบบและพัฒนานวัตกรรม: ${serviceLabel}\nผู้รับบริการ: ${formData.clientName.trim()} (${formData.companyName.trim()})\nเบอร์โทร: ${formData.phone.trim()}`,
          project_brief: formData.projectBrief.trim(),
          details: formData.projectBrief.trim() || `คำขอรับคำปรึกษาศูนย์ออกแบบและพัฒนานวัตกรรม: ${serviceLabel}\nผู้รับบริการ: ${formData.clientName.trim()} (${formData.companyName.trim()})\nเบอร์โทร: ${formData.phone.trim()}`,
          survey_token: newToken,
          survey_sent: false,
          assignee_name: PIM_NAME,
          team: 'CC'
        }
      }]).select();

      if (briefError) {
        console.error("Error creating task in Supabase:", briefError);
      } else {
        await fetchPMData();
      }
    } catch (err) {
      console.error("Failed to insert brief:", err);
    }

    // 2. Add to IDC local records dataset
    const newRec: IDCRecord = {
      id: `idc-rec-${Date.now()}`,
      code: newCode,
      date: today,
      clientName: formData.clientName.trim(),
      companyName: formData.companyName.trim(),
      organizationType: formData.organizationType,
      businessType: formData.businessType,
      businessTypeOther: formData.businessTypeOther.trim(),
      address: formData.address.trim(),
      taxId: formData.taxId.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      serviceMain: formData.serviceMain,
      serviceOtherDetail: formData.serviceOtherDetail.trim(),
      pieceCount: totalPieces,
      projectBrief: formData.projectBrief.trim(),
      assignee: PIM_NAME,
      revenue: 0,
      status: "pending",
      surveyToken: newToken,
      surveySent: false
    };

    setRecords(prev => [newRec, ...prev.filter(r => r.code !== newCode)]);

    // Reset Form
    setFormData({
      clientName: "",
      companyName: "",
      organizationType: "private",
      businessType: "food_processing",
      businessTypeOther: "",
      address: "",
      taxId: "",
      phone: "",
      email: "",
      services: ["product_design"] as ServiceMainCategory[],
      serviceMain: "product_design",
      consultationSub: "product",
      consultationSubOther: "",
      serviceOtherDetail: "",
      pieceCount: 1,
      projectBrief: ""
    });

    alert(`✅ บันทึกข้อมูลคำขอเข้ารับบริการสำเร็จ!\n\n📋 รหัสคำขอ: ${newCode}\n📌 ข้อมูลแสดงในตารางชุดข้อมูลศูนย์ออกแบบและพัฒนานวัตกรรม และขึ้นไปที่ Kanban Board รวม (ประเภทงาน Internal / ผู้รับผิดชอบ พิม AC) เรียบร้อยแล้วครับ`);
    setActiveTab("records");
  };

  // Handler for Assignee to update responsible person directly from dataset
  const handleUpdateAssignee = async (recordId: string, newAssignee: string) => {
    setRecords(prev =>
      prev.map(r => (r.id === recordId ? { ...r, assignee: newAssignee } : r))
    );

    try {
      const supabase = createClient();
      const foundEntry = Object.entries(assigneesMap).find(([_, val]) => val.name === newAssignee);
      const newAssigneeId = foundEntry ? foundEntry[0] : null;

      const { data: cur } = await supabase.from('briefs').select('details').eq('id', recordId).single();
      const updatedDetails = {
        ...(cur?.details || {}),
        assignee_name: newAssignee
      };
      const payload: any = { details: updatedDetails };
      if (newAssigneeId) payload.assignee_id = newAssigneeId;

      await supabase.from('briefs').update(payload).eq('id', recordId);
    } catch (e) {
      console.error("Error updating assignee in Supabase:", e);
    }
  };

  // Handler for Assignee to update internal revenue directly from dataset
  const handleUpdateRevenue = async (recordId: string, newRevenue: number) => {
    setRecords(prev =>
      prev.map(r => (r.id === recordId ? { ...r, revenue: newRevenue } : r))
    );

    try {
      const supabase = createClient();
      const { data: cur } = await supabase.from('briefs').select('details').eq('id', recordId).single();
      const updatedDetails = {
        ...(cur?.details || {}),
        revenue: newRevenue
      };
      await supabase.from('briefs').update({ details: updatedDetails }).eq('id', recordId);
    } catch (e) {
      console.error("Error updating revenue in Supabase:", e);
    }
  };

  // Handler to save full record edits from the Edit Modal
  const handleSaveEditedRecord = async (updated: IDCRecord) => {
    setRecords(prev =>
      prev.map(r => (r.id === updated.id ? updated : r))
    );
    setEditingRecord(null);

    try {
      const supabase = createClient();
      const foundEntry = Object.entries(assigneesMap).find(([_, val]) => val.name === updated.assignee);
      const newAssigneeId = foundEntry ? foundEntry[0] : null;

      const { data: cur } = await supabase.from('briefs').select('details').eq('id', updated.id).single();
      const updatedDetails = {
        ...(cur?.details || {}),
        idc_code: updated.code,
        client_name: updated.clientName,
        company_name: updated.companyName,
        organization: updated.organizationType === "government" ? "ภาครัฐ" : "ภาคเอกชน",
        organization_type: updated.organizationType,
        business_type: updated.businessType,
        business_type_other: updated.businessTypeOther || "",
        address: updated.address,
        tax_id: updated.taxId,
        phone: updated.phone,
        email: updated.email,
        service_main: updated.serviceMain,
        service_other_detail: updated.serviceOtherDetail || "",
        piece_count: updated.pieceCount,
        revenue: updated.revenue,
        project_brief: updated.projectBrief,
        description: updated.projectBrief,
        assignee_name: updated.assignee,
        satisfaction_score: updated.satisfactionScore || null
      };

      const payload: any = {
        coordinator_nickname: updated.clientName,
        requester_email: updated.email,
        decision_maker: updated.organizationType === "government" ? "ภาครัฐ" : "ภาคเอกชน",
        status: updated.status,
        details: updatedDetails
      };
      if (newAssigneeId) payload.assignee_id = newAssigneeId;

      await supabase.from('briefs').update(payload).eq('id', updated.id);
      alert(`บันทึกการแก้ไขข้อมูลรหัส ${updated.code} เรียบร้อยแล้ว`);
    } catch (e) {
      console.error("Error saving edited record to Supabase:", e);
      alert(`บันทึกการแก้ไขข้อมูลรหัส ${updated.code} เรียบร้อยแล้ว`);
    }
  };

  // Status Change Handler: "กำลังทำ" <-> "เสร็จสิ้น"
  // When status changes to "เสร็จสิ้น", the satisfaction survey is automatically dispatched!
  const handleUpdateStatus = async (recordId: string, newStatus: TaskStatus) => {
    let targetRecord: IDCRecord | null = null;
    const nowIso = new Date().toISOString();
    const isCompleting = newStatus === "completed";

    setRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          const updated: IDCRecord = {
            ...r,
            status: newStatus,
            surveySent: isCompleting ? true : r.surveySent,
            surveySentAt: isCompleting && !r.surveySent ? nowIso : r.surveySentAt
          };
          targetRecord = updated;
          return updated;
        }
        return r;
      })
    );

    try {
      const supabase = createClient();
      const { data: cur } = await supabase.from('briefs').select('details').eq('id', recordId).single();
      const updatedDetails = {
        ...(cur?.details || {}),
        survey_sent: isCompleting ? true : (cur?.details?.survey_sent || false),
        survey_sent_at: isCompleting && !cur?.details?.survey_sent ? nowIso : (cur?.details?.survey_sent_at || null)
      };
      const updates: any = {
        status: newStatus,
        details: updatedDetails
      };
      if (newStatus === 'completed') updates.completed_at = nowIso;
      if (newStatus === 'in_progress') updates.in_progress_at = nowIso;

      await supabase.from('briefs').update(updates).eq('id', recordId);
    } catch (e) {
      console.error("Error updating status in Supabase:", e);
    }

    if (newStatus === "completed" && targetRecord) {
      const rec = targetRecord as IDCRecord;
      setCopyFeedback(`🚀 สถานะเป็น "เสร็จสิ้น" — ส่งแบบประเมินความพึงพอใจการเข้ารับคำปรึกษาให้คุณ ${rec.clientName} (${rec.companyName}) อัตโนมัติแล้ว!`);
      setTimeout(() => setCopyFeedback(null), 4500);
    } else if (newStatus === "in_progress") {
      setCopyFeedback(`🔄 อัปเดตสถานะงานเป็น "กำลังทำ" เรียบร้อย`);
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, code: string) => {
    if (confirm(`คุณต้องการลบข้อมูลคำขอรหัส ${code} ใช่หรือไม่?`)) {
      setRecords(prev => prev.filter(r => r.id !== id));
      try {
        const supabase = createClient();
        await supabase.from('briefs').delete().eq('id', id);
      } catch (e) {
        console.error("Error deleting record from Supabase:", e);
      }
    }
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออกตามเงื่อนไขที่เลือก");
      return;
    }

    const headers = [
      "รหัสคำขอ",
      "วันที่รับเรื่อง",
      "ชื่อผู้รับบริการ",
      "ชื่อสถานประกอบการ",
      "ประเภทหน่วยงาน",
      "ประเภทธุรกิจ",
      "ประเภทการเข้ารับบริการ",
      "รายละเอียดบริการ/ประเภทคำปรึกษา",
      "จำนวนชิ้น/ครั้ง (KPI 31)",
      "รายได้ภายใน บาท (KPI 30)",
      "ผู้รับผิดชอบ (Assignee)",
      "เบอร์โทร",
      "อีเมล",
      "เลขประจำตัวผู้เสียภาษี",
      "ที่อยู่",
      "สถานะงาน",
      "คะแนนความพึงพอใจ (KPI 34)",
      "ความคิดเห็นความพึงพอใจ"
    ];

    const serviceNameMap: Record<ServiceMainCategory, string> = {
      consultation: "เข้ารับคำปรึกษา",
      product_design: "ออกแบบผลิตภัณฑ์",
      packaging_design: "ออกแบบบรรจุภัณฑ์",
      print_media: "ออกแบบสื่อสิ่งพิมพ์",
      logo_branding: "ออกแบบตราสัญลักษณ์",
      ci_branding: "ออกแบบอัตลักษณ์ ( CI )",
      other: "อื่นๆ"
    };

    const businessMap: Record<BusinessType, string> = {
      food_processing: "การแปรรูปอาหาร",
      agriculture_biotech: "การเกษตรและเทคโนโลยีชีวภาพ",
      tourism: "การท่องเที่ยว",
      digital: "ดิจิทัล",
      other: "อื่นๆ"
    };

    const rows = filteredRecords.map(r => {
      let subDetail = "";
      if (r.serviceMain === "consultation") {
        const subMap: Record<ConsultationSubCategory, string> = {
          product: "ผลิตภัณฑ์",
          packaging: "บรรจุภัณฑ์",
          print: "สื่อสิ่งพิมพ์",
          logo: "ตราสัญลักษณ์",
          other: r.consultationSubOther || "อื่นๆ"
        };
        subDetail = `คำปรึกษาด้าน: ${subMap[r.consultationSub || "product"]}`;
      } else if (r.serviceMain === "other") {
        subDetail = r.serviceOtherDetail || "";
      } else {
        subDetail = r.projectBrief || "";
      }

      return [
        `"${r.code}"`,
        `"${r.date}"`,
        `"${r.clientName}"`,
        `"${r.companyName}"`,
        `"${r.organizationType === "private" ? "ภาคเอกชน" : "ภาครัฐ"}"`,
        `"${businessMap[r.businessType] || r.businessType} ${r.businessTypeOther ? `(${r.businessTypeOther})` : ""}"`,
        `"${serviceNameMap[r.serviceMain] || r.serviceMain}"`,
        `"${subDetail.replace(/"/g, '""')}"`,
        r.pieceCount,
        r.revenue,
        `"${r.assignee}"`,
        `"${r.phone}"`,
        `"${r.email}"`,
        `"${r.taxId}"`,
        `"${(r.address || "").replace(/"/g, '""')}"`,
        `"${r.status === "completed" ? "เสร็จสิ้น (Completed)" : r.status === "in_progress" ? "กำลังดำเนินการ" : "รอดำเนินการ"}"`,
        r.satisfactionScore || "",
        `"${(r.satisfactionFeedback || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    // KPI Summary Section in CSV
    const kpiSummarySection = [
      "",
      "--- สรุปผล 5 ตัวชี้วัดสำคัญ (IDC 5 KPIs) ---",
      `"(29) KPI คน (จำนวนผู้รับบริการ)",${kpiMetrics.kpiClients},"ราย"`,
      `"(31) KPI ผลงาน (จำนวนชิ้นผลงานรวม)",${kpiMetrics.kpiPieces},"ชิ้น/ครั้ง"`,
      `"(30) KPI รายได้ (ผลรวมรายได้ภายใน)",${kpiMetrics.kpiRevenue},"บาท"`,
      `"(32) KPI ต่อชิ้น (ราคาเฉลี่ยต่อชิ้น)",${kpiMetrics.kpiAvgPerPiece},"บาท/ชิ้น"`,
      `"(34) KPI ความพึงพอใจเฉลี่ย",${kpiMetrics.avgScore},"/ 5.0 คะแนน"`
    ].join("\n");

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n") + "\n\n" + kpiSummarySection;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IDC_Report_Dataset_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  exportCsvRef.current = handleExportCSV;

  // Helper to generate Satisfaction Survey Link
  const getSurveyLink = (record: IDCRecord) => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const serviceTitle = record.serviceMain === "consultation" ? "การให้คำปรึกษา" : "การออกแบบ";
    return `${origin}/survey?type=idc&project=${encodeURIComponent(record.code)}&client=${encodeURIComponent(record.clientName)}&company=${encodeURIComponent(record.companyName)}&service=${encodeURIComponent(serviceTitle)}&token=${record.surveyToken}`;
  };

  // Copy LINE Message Helper
  const handleCopyLineSurvey = (record: IDCRecord) => {
    const link = getSurveyLink(record);
    const serviceTitle = record.serviceMain === "consultation" ? "การให้คำปรึกษาด้านนวัตกรรมและการออกแบบ" : "งานออกแบบ";
    const text = `เรียน คุณ${record.clientName} (${record.companyName})\nศูนย์ออกแบบและพัฒนานวัตกรรม (Innovation Design Center) อุทยานวิทยาศาสตร์ฯ ขอขอบพระคุณที่เข้ารับบริการ ${serviceTitle} (รหัสงาน ${record.code})\n\nเพื่อการพัฒนาและปรับปรุงคุณภาพการให้คำปรึกษา ขอความอนุเคราะห์ท่านตอบแบบประเมินความพึงพอใจในการเข้ารับคำปรึกษา (ใช้เวลาเพียง 1 นาที) ได้ที่ลิงก์นี้:\n${link}\n\nขอขอบพระคุณเป็นอย่างยิ่งครับ/ค่ะ`;

    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback("คัดลอกข้อความและลิงก์สำหรับส่งทาง LINE แล้ว!");
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  // Send Email Helper (Opens Mail Client with Prefilled Content)
  const handleSendEmailSurvey = (record: IDCRecord) => {
    const link = getSurveyLink(record);
    const serviceTitle = record.serviceMain === "consultation" ? "การให้คำปรึกษาด้านนวัตกรรมและการออกแบบ" : "การออกแบบ";
    const subject = encodeURIComponent(`[แบบประเมิน] ความพึงพอใจในการเข้ารับคำปรึกษา (${record.code}) - ${record.companyName}`);
    const body = encodeURIComponent(
      `เรียน คุณ${record.clientName} (${record.companyName})\n\nศูนย์ออกแบบและพัฒนานวัตกรรม (Innovation Design Center) อุทยานวิทยาศาสตร์และเทคโนโลยี ขอขอบพระคุณท่านที่ได้เข้ารับบริการ ${serviceTitle} รหัสงาน: ${record.code} จำนวน ${record.pieceCount} ${record.serviceMain === "consultation" ? "ครั้ง" : "ชิ้น"}\n\nเพื่อให้การให้คำปรึกษามีประโยชน์และตอบโจทย์ผู้ประกอบการสูงสุด ขอความอนุเคราะห์ท่านสละเวลาตอบแบบประเมินความพึงพอใจในการเข้ารับคำปรึกษาผ่านลิงก์ด้านล่างนี้:\n${link}\n\nขอแสดงความนับถือ,\nศูนย์ออกแบบและพัฒนานวัตกรรม (Innovation Design Center)\nอุทยานวิทยาศาสตร์และเทคโนโลยี`
    );

    window.open(`mailto:${record.email}?subject=${subject}&body=${body}`, "_blank");

    // Mark as sent
    setRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? { ...r, surveySent: true, surveySentAt: new Date().toLocaleString("th-TH") }
          : r
      )
    );
  };

  // Quick simulate rating
  const handleSimulateRating = (score: number) => {
    if (!surveyModalRecord) return;
    setRecords(prev =>
      prev.map(r =>
        r.id === surveyModalRecord.id
          ? {
              ...r,
              surveySent: true,
              satisfactionScore: score,
              satisfactionEvaluatedAt: new Date().toLocaleString("th-TH"),
              satisfactionFeedback:
                score >= 4.5
                  ? "ผลงานประทับใจมาก ตรงตามโจทย์และส่งมอบรวดเร็ว"
                  : "บริการดี ให้คำแนะนำเป็นประโยชน์มาก"
            }
          : r
      )
    );
    setSurveyModalRecord(prev =>
      prev
        ? {
            ...prev,
            surveySent: true,
            satisfactionScore: score,
            satisfactionEvaluatedAt: new Date().toLocaleString("th-TH")
          }
        : null
    );
    alert(`บันทึกผลการประเมินความพึงพอใจ ${score} ดาว เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP TAB NAVIGATION: EXACT RED CAPSULE STYLE (MATCHING MEETING REPORT)      */}
      {/* Distributed evenly across container with NO overflow scrollbar             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
        <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 gap-1">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex-1 shrink-0 sm:shrink min-w-fit justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "records"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/90"
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>1. ชุดข้อมูล &amp; การประเมิน 5 KPI</span>
          </button>

          <button
            onClick={() => setActiveTab("pm-design")}
            className={`flex-1 shrink-0 sm:shrink min-w-fit justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "pm-design"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/90"
            }`}
          >
            <Palette size={15} />
            <span>2. โครงการ PM งานออกแบบ</span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 shrink-0 sm:shrink min-w-fit justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/90"
            }`}
          >
            <TrendingUp size={15} />
            <span>3. แดชบอร์ด &amp; วิเคราะห์เชิงกลยุทธ์</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIME & DATE RANGE FILTER TOOLBAR (VISIBLE ON ALL TABS - REQUIREMENT 3)    */}
      {/* ========================================================================= */}
      {activeTab !== "form" && (
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Timeframe Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              เวลา:
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-zinc-950 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs flex-wrap">
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
                      ? "bg-slate-900 dark:bg-orange-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-850"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Date Pickers + Count */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <Calendar size={13} className="text-orange-500 shrink-0" />
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-sans">เริ่ม:</span>
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
                  className="w-[98px] bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-xs font-mono transition-colors"
                />
                <span className="text-slate-400 dark:text-zinc-500 font-sans px-0.5">ถึง</span>
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
                  className="w-[98px] bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-xs font-mono transition-colors"
                />
              </div>
              <span className="text-slate-300 dark:text-zinc-700 font-light mx-0.5">|</span>
              <span className="text-slate-600 dark:text-zinc-300 font-bold">
                ({currentTabItemCount} งาน)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DATASET & 5 CORE KPIS + IMPACT (REQUIREMENT 2)                      */}
      {/* ========================================================================= */}
      {activeTab === "records" && (
        <div className="space-y-6">
          {/* 5 Core KPI Highlights Bar + IMPACT */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* (29) KPI คน */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-orange-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users size={13} className="text-orange-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  (29) KPI คน
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1.5 min-w-0 overflow-hidden">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums truncate">
                  {kpiMetrics.kpiClients}
                </h3>
                <span className="text-xs font-semibold text-slate-400 shrink-0">ราย</span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                จำนวนผู้เข้ารับบริการรวม
              </p>
            </div>

            {/* (31) KPI ผลงาน */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-purple-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Package size={13} className="text-purple-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  (31) KPI ผลงาน
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1.5 min-w-0 overflow-hidden">
                <h3 className="text-xl sm:text-2xl font-black text-purple-900 tracking-tight tabular-nums truncate">
                  {kpiMetrics.kpiPieces}
                </h3>
                <span className="text-xs font-semibold text-slate-400 shrink-0">ชิ้น/ครั้ง</span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                ผลงาน &amp; การให้คำปรึกษา
              </p>
            </div>

            {/* (30) KPI รายได้ */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <DollarSign size={13} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  (30) KPI รายได้
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-emerald-700 tracking-tight tabular-nums truncate">
                  ฿{kpiMetrics.kpiRevenue.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                Assignee บันทึกรายได้สะสม
              </p>
            </div>

            {/* (32) KPI ต่อชิ้น */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers size={13} className="text-blue-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  (32) เฉลี่ยต่อชิ้น
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-blue-900 tracking-tight tabular-nums truncate">
                  ฿{kpiMetrics.kpiAvgPerPiece.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                คำนวณจาก (30) ÷ (31)
              </p>
            </div>

            {/* IMPACT: (30) KPI รายได้ * 7.5 */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-violet-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap size={13} className="text-violet-600 fill-violet-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  7.5x Economic IMPACT
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-violet-700 tracking-tight tabular-nums truncate">
                  ฿{kpiMetrics.kpiImpact.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                คำนวณจาก (30) × 7.5 เท่า
              </p>
            </div>

            {/* (34) พึงพอใจ */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Star size={13} className="text-amber-500 fill-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  (34) ความพึงพอใจ
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-amber-600 tracking-tight tabular-nums shrink-0">
                  {kpiMetrics.avgScore}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">/ 5.0</span>
                <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100/90 px-1 py-0.5 rounded border border-amber-300 shrink-0">
                  ({kpiMetrics.satisfactionPercentage}%)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                ส่ง {kpiMetrics.sentCount} / ตอบ {kpiMetrics.evaluatedCount}
              </p>
            </div>
          </div>

          {/* Table Controls & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้รับบริการ, สถานประกอบการ, รหัสงาน..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                  title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.csv ภาษาไทยสมบูรณ์)"
                >
                  <Download size={14} />
                  <span>ดาวน์โหลด Excel</span>
                </button>

                <button
                  onClick={() => setActiveTab("form")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E03131] hover:bg-[#c92a2a] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                  title="เปิดแบบฟอร์มบันทึกคำขอรับบริการสำหรับผู้ประกอบการ"
                >
                  <Plus size={14} />
                  <span>แบบฟอร์มผู้ประกอบการ</span>
                </button>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
                <Filter size={12} /> ตัวกรอง:
              </span>

              {/* Service Filter */}
              <div className="w-full sm:w-52 md:w-56">
                <ModernSelect
                  value={filterService}
                  onChange={val => setFilterService(val)}
                  options={IDC_SERVICE_FILTER_OPTIONS}
                  placeholder="ทุกประเภทบริการ"
                  searchPlaceholder="ค้นหาประเภทบริการ..."
                  searchable={true}
                  className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-1.5 px-3 text-xs shadow-2xs"
                />
              </div>

              {/* Business Filter */}
              <div className="w-full sm:w-52 md:w-56">
                <ModernSelect
                  value={filterBusinessType}
                  onChange={val => setFilterBusinessType(val)}
                  options={IDC_BUSINESS_FILTER_OPTIONS}
                  placeholder="ทุกกลุ่มธุรกิจ"
                  searchPlaceholder="ค้นหากลุ่มธุรกิจ..."
                  searchable={true}
                  className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-1.5 px-3 text-xs shadow-2xs"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-44 md:w-48">
                <ModernSelect
                  value={filterStatus}
                  onChange={val => setFilterStatus(val)}
                  options={IDC_STATUS_FILTER_OPTIONS}
                  placeholder="ทุกสถานะ"
                  searchPlaceholder="ค้นหาสถานะ..."
                  searchable={true}
                  className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-1.5 px-3 text-xs shadow-2xs"
                />
              </div>

              {(filterService !== "all" || filterBusinessType !== "all" || filterStatus !== "all" || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterService("all");
                    setFilterBusinessType("all");
                    setFilterStatus("all");
                    setSearchTerm("");
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 underline sm:ml-2 cursor-pointer font-medium self-start sm:self-auto"
                >
                  ล้างตัวกรอง
                </button>
              )}

              <span className="w-full sm:w-auto sm:ml-auto text-slate-400 text-[11.5px] text-left sm:text-right pt-1 sm:pt-0">
                แสดง {filteredRecords.length} จากทั้งหมด {records.length} รายการ
              </span>
            </div>
          </div>

          {/* Dataset Table View - Horizontally scrollable on mobile, never squished */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="min-w-[880px] w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-2.5 pl-4 pr-2 w-[100px] text-left whitespace-nowrap">รหัส/วันที่</th>
                    <th className="py-2.5 px-2.5 min-w-[200px] text-left font-extrabold text-slate-800 whitespace-nowrap">ผู้รับบริการ / สถานประกอบการ</th>
                    <th className="py-2.5 px-2 w-[110px] text-left whitespace-nowrap">หน่วยงาน/ธุรกิจ</th>
                    <th className="py-2.5 px-2 min-w-[150px] text-left whitespace-nowrap">ประเภทการเข้ารับบริการ</th>
                    <th className="py-2.5 px-1.5 w-[75px] text-center whitespace-nowrap">
                      <span title="(31) KPI ผลงาน รวมชิ้นงานและคำปรึกษา">(31) ผลงาน</span>
                    </th>
                    <th className="py-2.5 px-1.5 w-[90px] text-right whitespace-nowrap">
                      <span title="(30) KPI รายได้ ที่ assignee กรอก">(30) รายได้</span>
                    </th>
                    <th className="py-2.5 px-1.5 w-[95px] text-center whitespace-nowrap">ผู้รับผิดชอบ</th>
                    <th className="py-2.5 px-1 w-[90px] text-center whitespace-nowrap">สถานะ</th>
                    <th className="py-2.5 px-1.5 w-[80px] text-center whitespace-nowrap">
                      <span title="(34) ลิงก์ประเมินความพึงพอใจ">(34) พอใจ</span>
                    </th>
                    <th className="py-2.5 pl-1.5 pr-4 w-[75px] text-center whitespace-nowrap">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        ไม่พบข้อมูลคำขอตามเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(item => {
                      const serviceLabels: Record<ServiceMainCategory, string> = {
                        consultation: "เข้ารับคำปรึกษา",
                        product_design: "ออกแบบผลิตภัณฑ์",
                        packaging_design: "ออกแบบบรรจุภัณฑ์",
                        print_media: "ออกแบบสื่อสิ่งพิมพ์",
                        logo_branding: "ออกแบบตราสัญลักษณ์",
                        ci_branding: "ออกแบบอัตลักษณ์ ( CI )",
                        other: "อื่นๆ"
                      };

                      const businessLabels: Record<BusinessType, string> = {
                        food_processing: "แปรรูปอาหาร",
                        agriculture_biotech: "เกษตร-เทคโนฯ ชีวภาพ",
                        tourism: "ท่องเที่ยว",
                        digital: "ดิจิทัล",
                        other: item.businessTypeOther || "อื่นๆ"
                      };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* 1. Code & Date (No overlap with client name) */}
                          <td className="py-2.5 pl-4 pr-2 align-top overflow-hidden">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded text-[10px] inline-block tracking-tight whitespace-nowrap shadow-2xs">
                              {item.code}
                            </span>
                            <div className="text-[9.5px] text-slate-400 mt-1 whitespace-nowrap font-medium">{item.date}</div>
                          </td>

                          {/* 2. Client & Company */}
                          <td className="py-2.5 px-2.5 align-top">
                            <div className="font-black text-slate-900 text-[13px] tracking-tight leading-snug truncate" title={item.clientName}>
                              {item.clientName}
                            </div>
                            <div className="text-[11.5px] font-bold text-slate-700 truncate mt-0.5 flex items-center gap-1" title={item.companyName}>
                              <Building2 size={12} className="shrink-0 text-slate-400" />
                              <span className="truncate">{item.companyName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1 truncate">
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <Phone size={10} className="shrink-0 text-slate-400" />
                                <span>{item.phone}</span>
                              </span>
                              {item.email && (
                                <span className="text-slate-400 font-mono text-[9.5px] truncate hidden xl:inline" title={item.email}>
                                  • {item.email}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Organization & Business Type */}
                          <td className="py-2.5 px-1.5 align-top">
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                item.organizationType === "private"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {item.organizationType === "private" ? "เอกชน" : "ภาครัฐ"}
                            </span>
                            <div className="text-[10px] text-slate-600 mt-1 truncate font-medium" title={businessLabels[item.businessType]}>
                              {businessLabels[item.businessType]}
                            </div>
                          </td>

                          {/* 4. Service Type & Subdetail (คำอธิบายลงมาอีกบรรทัด) */}
                          <td className="py-2.5 px-2 align-top">
                            <span className="font-bold text-slate-800 text-[11.5px] block truncate" title={serviceLabels[item.serviceMain]}>
                              {serviceLabels[item.serviceMain]}
                            </span>
                            {item.serviceMain === "consultation" && (
                              <div className="mt-0.5">
                                <span className="text-[9.5px] font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 inline-block max-w-full truncate">
                                  ด้าน: {item.consultationSub === "product"
                                    ? "ผลิตภัณฑ์"
                                    : item.consultationSub === "packaging"
                                    ? "บรรจุภัณฑ์"
                                    : item.consultationSub === "print"
                                    ? "สื่อสิ่งพิมพ์"
                                    : item.consultationSub === "logo"
                                    ? "ตราสัญลักษณ์"
                                    : item.consultationSubOther || "อื่นๆ"}
                                </span>
                              </div>
                            )}
                            {item.projectBrief && (
                              <p
                                className="text-[10px] text-slate-500 leading-tight line-clamp-2 mt-1 break-words font-normal"
                                title={item.projectBrief}
                              >
                                {item.projectBrief}
                              </p>
                            )}
                          </td>

                          {/* 5. (31) KPI ผลงาน */}
                          <td className="py-2.5 px-1 text-center align-middle">
                            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200 font-bold text-[10px] inline-block whitespace-nowrap">
                              {item.pieceCount} {item.serviceMain === "consultation" ? "ครั้ง" : "ชิ้น"}
                            </span>
                          </td>

                          {/* 6. (30) KPI รายได้ (Assignee กรอกเองได้ - Compact) */}
                          <td className="py-2 px-1 text-right align-middle">
                            <div className="inline-flex items-center justify-end gap-0.5 bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 focus-within:border-emerald-500 rounded-lg px-1 py-0.5 transition-all shadow-2xs w-full max-w-[78px]">
                              <span className="text-[9.5px] font-bold text-slate-400">฿</span>
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={item.revenue === 0 ? "" : item.revenue}
                                placeholder="0"
                                onChange={e => handleUpdateRevenue(item.id, Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-right text-[10.5px] font-mono font-bold text-emerald-700 focus:outline-none bg-transparent"
                                title="Assignee กรอกรายได้สำหรับคำนวณ KPI 30 และ 32"
                              />
                            </div>
                          </td>

                          {/* 7. Assignee (Assignee เลือกเองได้ - Compact) */}
                          <td className="py-2 px-1 align-middle text-center">
                            <select
                              value={item.assignee || "รอมอบหมาย"}
                              onChange={e => handleUpdateAssignee(item.id, e.target.value)}
                              className={`w-full px-1 py-1 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer truncate ${
                                item.assignee && item.assignee !== "รอมอบหมาย"
                                  ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/70"
                                  : "bg-amber-50 text-amber-800 border-amber-300 font-semibold"
                              }`}
                              title="เลือกผู้รับผิดชอบงาน"
                            >
                              <option value="รอมอบหมาย">⏳ รอมอบหมาย</option>
                              <option value="จ๊อบ AA">จ๊อบ AA</option>
                              <option value="วา WK">วา WK</option>
                              <option value="จอย RL">จอย RL</option>
                              <option value="พิม AC">พิม AC</option>
                              <option value="เยียร์ LLP">เยียร์ LLP</option>
                              <option value="นิน MTN">นิน MTN</option>
                              <option value="ก้อง IK">ก้อง IK</option>
                            </select>
                          </td>

                          {/* 8. Task Status Dropdown - กำลังทำ / เสร็จสิ้น */}
                          <td className="py-2 px-0.5 text-center align-middle">
                            <select
                              value={item.status === "completed" ? "completed" : "in_progress"}
                              onChange={e => handleUpdateStatus(item.id, e.target.value as TaskStatus)}
                              className={`w-full px-1 py-1 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer truncate shadow-2xs ${
                                item.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70"
                                  : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100/70"
                              }`}
                              title="เปลี่ยนสถานะงาน (เมื่อเปลี่ยนเป็นเสร็จสิ้น ระบบจะส่งแบบประเมินอัตโนมัติ)"
                            >
                              <option value="in_progress">กำลังทำ</option>
                              <option value="completed">เสร็จสิ้น</option>
                            </select>
                          </td>

                          {/* 9. (34) Satisfaction Survey Action */}
                          <td className="py-2 px-0.5 text-center align-middle">
                            {item.satisfactionScore ? (
                              <button
                                onClick={() => setSurveyModalRecord(item)}
                                className="inline-flex items-center justify-center gap-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 px-1 py-1 rounded-lg border border-amber-200 font-bold text-[9.5px] cursor-pointer w-full transition-all"
                                title="ดูผลการประเมินการเข้ารับคำปรึกษา"
                              >
                                <Star size={9} className="fill-amber-400 text-amber-500 shrink-0" />
                                <span>{item.satisfactionScore.toFixed(1)}</span>
                              </button>
                            ) : item.surveySent ? (
                              <button
                                onClick={() => setSurveyModalRecord(item)}
                                className="inline-flex items-center justify-center gap-0.5 px-0.5 py-1 rounded-lg text-[9px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer w-full shadow-2xs"
                                title="ส่งแบบประเมินอัตโนมัติแล้ว (คลิกเพื่อดูรายละเอียดหรือจำลองผล)"
                              >
                                <CheckCircle2 size={9} className="shrink-0 text-blue-600" />
                                <span>ส่งแล้ว</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSurveyModalRecord(item)}
                                className="inline-flex items-center justify-center gap-0.5 px-0.5 py-1 rounded-lg text-[9px] font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-all cursor-pointer w-full shadow-2xs"
                                title="ส่งแบบประเมินการเข้ารับคำปรึกษา"
                              >
                                <Share2 size={8.5} className="shrink-0" />
                                <span>ส่งประเมิน</span>
                              </button>
                            )}
                          </td>

                          {/* 10. Actions (ปุ่มแก้ไข และ ปุ่มลบ) - Generous right margin */}
                          <td className="py-2 pl-1.5 pr-4 text-center align-middle">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setEditingRecord({ ...item })}
                                className="p-1.5 text-slate-500 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                                title="แก้ไขข้อมูลคำขอ"
                              >
                                <Edit3 size={11.5} />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(item.id, item.code)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                                title="ลบข้อมูลคำขอ"
                              >
                                <Trash2 size={11.5} />
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ENTREPRENEUR INTAKE FORM (REQUIREMENT 1)                           */}
      {/* ========================================================================= */}
      {activeTab === "form" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Bar with Share Public Link option */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 mb-1.5">
                <Sparkles size={12} />
                แบบฟอร์มรับคำขอเข้ารับบริการ (Innovation Design Center Intake Form)
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                แบบฟอร์มสำหรับส่งให้ผู้ประกอบการ หรือ เจ้าหน้าที่บันทึกเข้าระบบ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                รวบรวมข้อมูลผู้ประกอบการ ความต้องการงานบริการ และส่งต่อเพื่อคำนวณ KPI อัตโนมัติ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("records")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={14} />
                <span>กลับหน้ารายงาน</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const sampleUrl = typeof window !== "undefined" ? `${window.location.origin}/idc-form` : "";
                  navigator.clipboard.writeText(sampleUrl);
                  setIsCopiedFormLink(true);
                  setTimeout(() => setIsCopiedFormLink(false), 2500);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isCopiedFormLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{isCopiedFormLink ? "คัดลอกลิงก์ฟอร์มแล้ว!" : "คัดลอกลิงก์ฟอร์มแชร์ลูกค้า"}</span>
              </button>
            </div>
          </div>

          {/* Main Form Card */}
          <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            {/* Section 1: ข้อมูลผู้รับบริการและสถานประกอบการ */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 size={16} className="text-orange-500" />
                <span>1. ข้อมูลผู้รับบริการ &amp; สถานประกอบการ</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ชื่อผู้รับบริการ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้รับบริการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณกมลรัตน์ เลิศวานิช"
                    value={formData.clientName}
                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* ชื่อสถานประกอบการ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อสถานประกอบการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น บริษัท ล้านนา ฟรุตส์ แอนด์ ดราย จำกัด"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* ประเภทหน่วยงาน: ภาคเอกชน, ภาครัฐ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทหน่วยงาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, organizationType: "private" })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.organizationType === "private"
                          ? "bg-blue-50 text-blue-700 border-blue-400 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏢 ภาคเอกชน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, organizationType: "government" })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.organizationType === "government"
                          ? "bg-purple-50 text-purple-700 border-purple-400 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏛️ ภาครัฐ</span>
                    </button>
                  </div>
                </div>

                {/* ประเภทธุรกิจ / ผลิตภัณฑ์ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทธุรกิจ / ผลิตภัณฑ์ <span className="text-rose-500">*</span>
                  </label>
                  <ModernSelect
                    value={formData.businessType}
                    onChange={val => setFormData({ ...formData, businessType: val as BusinessType })}
                    options={IDC_BUSINESS_TYPE_OPTIONS}
                    placeholder="เลือกประเภทธุรกิจ / ผลิตภัณฑ์..."
                    searchPlaceholder="ค้นหาประเภทธุรกิจ (เช่น อาหาร, เกษตร, ดิจิทัล)..."
                    searchable={true}
                    className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-2.5 px-4 text-xs sm:text-sm shadow-2xs hover:border-slate-300"
                  />
                </div>
              </div>

              {/* ช่องระบุถ้าเลือกประเภทธุรกิจ "อื่นๆ" */}
              {formData.businessType === "other" && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระบุประเภทธุรกิจ / ผลิตภัณฑ์อื่นๆ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น หัตถกรรมและสิ่งทอสร้างสรรค์, พลังงานสะอาด ฯลฯ"
                    value={formData.businessTypeOther}
                    onChange={e => setFormData({ ...formData, businessTypeOther: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {/* เลขผู้เสียภาษี, เบอร์โทร, อีเมล */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 0505562001928"
                    value={formData.taxId}
                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 081-952-4412"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email (สำหรับส่งแบบประเมิน) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="เช่น contact@business.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* ที่อยู่ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่สถานประกอบการ</label>
                <textarea
                  rows={2}
                  placeholder="เลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Section 2: ประเภทงานที่รับคำปรึกษา */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Layers size={16} className="text-orange-500" />
                <span>2. ประเภทงานที่รับคำปรึกษา</span>
              </h4>

              {/* เลือกประเภทงานที่รับคำปรึกษา */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    เลือกประเภทงานที่ต้องการรับคำปรึกษา <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    สามารถเลือกได้หลายอย่าง (ระบุจำนวนชิ้นในแต่ละประเภทได้)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { key: "product_design", label: "ออกแบบผลิตภัณฑ์" },
                    { key: "packaging_design", label: "ออกแบบบรรจุภัณฑ์" },
                    { key: "print_media", label: "ออกแบบสื่อสิ่งพิมพ์" },
                    { key: "logo_branding", label: "ออกแบบตราสัญลักษณ์" },
                    { key: "ci_branding", label: "ออกแบบอัตลักษณ์ ( CI )" },
                    { key: "other", label: "อื่นๆ (ระบุ)" }
                  ].map(s => {
                    const isSelected = formData.services.includes(s.key as ServiceMainCategory);
                    const qty = serviceQuantities[s.key] || 1;
                    return (
                      <div
                        key={s.key}
                        onClick={() => toggleService(s.key as ServiceMainCategory)}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? "bg-orange-50/70 text-orange-950 border-orange-400 shadow-2xs ring-1 ring-orange-400"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="leading-snug">{s.label}</span>
                          {isSelected ? (
                            <CheckCircle2 size={16} className="text-orange-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </div>

                        {isSelected && (
                          <div
                            onClick={e => e.stopPropagation()}
                            className="mt-2.5 pt-2 border-t border-orange-200/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150"
                          >
                            <span className="text-slate-600 font-medium text-[11px]">จำนวน:</span>
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-orange-300 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateServiceQty(s.key, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-100 text-orange-800 font-bold cursor-pointer select-none transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={e => setServiceQty(s.key, parseInt(e.target.value) || 1)}
                                className="w-8 text-center font-mono font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => updateServiceQty(s.key, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-100 text-orange-800 font-bold cursor-pointer select-none transition-colors"
                              >
                                +
                              </button>
                              <span className="text-[10.5px] text-slate-500 font-normal pl-0.5">ชิ้น</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* กรณีเลือก อื่นๆ ในหมวดหลัก */}
              {formData.services.includes("other") && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระบุประเภทงานที่ต้องการรับคำปรึกษาเพิ่มเติม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={formData.services.includes("other")}
                    placeholder="เช่น 3D Visualization, Mockup ต้นแบบเสมือนจริง ฯลฯ"
                    value={formData.serviceOtherDetail}
                    onChange={e => setFormData({ ...formData, serviceOtherDetail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* รายละเอียดสังเขป / วัตถุประสงค์งาน (Project Brief) - Full Width */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดสังเขป / วัตถุประสงค์งาน (Project Brief)
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ต้องการคำปรึกษาการปรับภาพลักษณ์แบรนด์สำหรับส่งออก, การเลือกวัสดุบรรจุภัณฑ์รักษ์โลก ฯลฯ"
                  value={formData.projectBrief}
                  onChange={e => setFormData({ ...formData, projectBrief: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("records")}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-[#E03131] hover:bg-[#c92a2a] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>บันทึกคำขอเข้ารับบริการ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DASHBOARD & STRATEGIC INSIGHTS (REQUIREMENT 3)                     */}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                <BarChart3 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  แดชบอร์ด &amp; วิเคราะห์เชิงกลยุทธ์ (Strategic Dashboard)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  สรุปผลการดำเนินงาน 5 Core KPIs, การกระจายตัวของคลัสเตอร์อุตสาหกรรม และการสังเคราะห์ SWOT &amp; TOWS Matrix แบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportStrategicExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.csv ภาษาไทยสมบูรณ์)"
              >
                <Download size={14} />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>
          </div>

          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. อัตราการสำเร็จของโครงการ */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex flex-col justify-between h-[124px]">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <CheckCircle2 size={13} className="shrink-0 text-orange-400" />
                <span>อัตราการสำเร็จโครงการ</span>
              </span>
              <div className="my-auto py-0.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tabular-nums">{kpiMetrics.completedCount} / {kpiMetrics.kpiClients}</span>
                <span className="text-xs text-slate-300 font-medium">
                  ({kpiMetrics.kpiClients > 0 ? Math.round((kpiMetrics.completedCount / kpiMetrics.kpiClients) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-800">
                โครงการส่งมอบงานเสร็จสมบูรณ์
              </p>
            </div>

            {/* 2. สัดส่วนภาคเอกชน vs ภาครัฐ */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between h-[124px]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Building2 size={13} className="shrink-0 text-blue-500" />
                <span>สัดส่วนเอกชน vs ภาครัฐ</span>
              </span>
              <div className="my-auto py-0.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <span className="text-blue-600">เอกชน: {dateFilteredRecords.filter(r => r.organizationType === "private").length} ราย</span>
                  <span className="text-purple-600">ภาครัฐ: {dateFilteredRecords.filter(r => r.organizationType === "government").length} ราย</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-1.5"
                    style={{
                      width: `${
                        dateFilteredRecords.length > 0
                          ? (dateFilteredRecords.filter(r => r.organizationType === "private").length / dateFilteredRecords.length) * 100
                          : 50
                      }%`
                    }}
                  />
                  <div
                    className="bg-purple-600 h-1.5"
                    style={{
                      width: `${
                        dateFilteredRecords.length > 0
                          ? (dateFilteredRecords.filter(r => r.organizationType === "government").length / dateFilteredRecords.length) * 100
                          : 50
                      }%`
                    }}
                  />
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                เน้นสนับสนุน SME และสตาร์ตอัป
              </p>
            </div>

            {/* 3. กลุ่มธุรกิจที่มีความต้องการสูงสุด */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between h-[124px]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <TrendingUp size={13} className="shrink-0 text-emerald-500" />
                <span>ความต้องการสูงสุด</span>
              </span>
              <div className="my-auto py-0.5">
                <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">การแปรรูปอาหาร (45%)</h4>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                เกษตร-ชีวภาพ และการท่องเที่ยว
              </p>
            </div>

            {/* 4. ความพึงพอใจการให้บริการ */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between h-[124px]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Star size={13} className="shrink-0 text-amber-500 fill-amber-400" />
                <span>ความพึงพอใจ (KPI 34)</span>
              </span>
              <div className="my-auto py-0.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-500 tabular-nums">{kpiMetrics.avgScore}</span>
                <div className="flex text-amber-400 text-xs tracking-tight">
                  {"★".repeat(5)}
                </div>
              </div>
              <p className="text-[10.5px] text-emerald-600 font-semibold truncate pt-1 border-t border-slate-100">
                พึงพอใจระดับมากถึงมากที่สุด ({kpiMetrics.satisfactionPercentage}%)
              </p>
            </div>
          </div>

          {/* Service Breakdown & Business Type Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Service Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <PieChart size={16} className="text-orange-500" />
                <span>สัดส่วนประเภทการให้บริการ (Service Category Breakdown)</span>
              </h4>

              <div className="space-y-3">
                {[
                  { key: "packaging_design", name: "3. ออกแบบบรรจุภัณฑ์ (Packaging)", color: "bg-purple-600" },
                  { key: "consultation", name: "1. เข้ารับคำปรึกษา (Consultation)", color: "bg-orange-500" },
                  { key: "logo_branding", name: "5. ออกแบบตราสัญลักษณ์ (Branding)", color: "bg-blue-600" },
                  { key: "product_design", name: "2. ออกแบบผลิตภัณฑ์ (Product)", color: "bg-emerald-600" },
                  { key: "print_media", name: "4. ออกแบบสื่อสิ่งพิมพ์ (Print Media)", color: "bg-pink-600" },
                  { key: "other", name: "6. อื่นๆ (Other Services)", color: "bg-slate-400" }
                ].map(cat => {
                  const count = dateFilteredRecords.filter(r => r.serviceMain === cat.key).length;
                  const percent = dateFilteredRecords.length > 0 ? Math.round((count / dateFilteredRecords.length) * 100) : 0;

                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{count} ราย</span>
                          <span className="font-bold text-slate-900 w-9 text-right">{percent}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${cat.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Industry Type Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-blue-600" />
                <span>สัดส่วนกลุ่มอุตสาหกรรมเป้าหมาย (Industry Clusters)</span>
              </h4>

              <div className="space-y-3">
                {[
                  { key: "food_processing", name: "การแปรรูปอาหาร (Food Processing)", color: "bg-amber-500" },
                  { key: "agriculture_biotech", name: "การเกษตรและเทคโนโลยีชีวภาพ (Agri-Bio)", color: "bg-emerald-600" },
                  { key: "tourism", name: "การท่องเที่ยวและบริการสร้างสรรค์ (Tourism)", color: "bg-cyan-600" },
                  { key: "digital", name: "ดิจิทัลและซอฟต์แวร์ (Digital Tech)", color: "bg-indigo-600" },
                  { key: "other", name: "อื่นๆ (Others)", color: "bg-slate-400" }
                ].map(ind => {
                  const count = dateFilteredRecords.filter(r => r.businessType === ind.key).length;
                  const percent = dateFilteredRecords.length > 0 ? Math.round((count / dateFilteredRecords.length) * 100) : 0;

                  return (
                    <div key={ind.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{ind.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{count} ราย</span>
                          <span className="font-bold text-slate-900 w-9 text-right">{percent}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${ind.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* REAL-TIME SWOT ANALYSIS & TOWS MATRIX (REQUIREMENT 10)                     */}
          {/* ========================================================================= */}
          <div className="space-y-6">
            {/* Header Card with Real-time Status and Multi-Source Integration Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 mb-1">
                    <Sparkles size={12} className="text-orange-600" />
                    <span>Real-Time Strategic Intelligence</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                    <span>การวิเคราะห์ SWOT &amp; TOWS Matrix แบบเรียลไทม์</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      เชื่อมโยง 3 แหล่งข้อมูลสด
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ประมวลผลและสังเคราะห์ข้อมูลแบบเรียลไทม์ เชื่อมโยง <strong>1. ชุดข้อมูล 5 Core KPIs + IMPACT</strong>, <strong>2. โครงการ PM งานออกแบบ</strong>, และ <strong>3. แดชบอร์ดวิเคราะห์อุปสงค์</strong> ปรับเปลี่ยนตามตัวกรองเวลาอัตโนมัติ
                  </p>
                </div>

                {/* Right Action & Snapshot Stats Container */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  {/* Real-time Snapshot Pill Stats */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block font-sans font-semibold">รายได้รวม 2 ระบบ</span>
                      <span className="font-bold text-slate-900">฿{swotAndTowsAnalysis.totalCombinedRevenue.toLocaleString()}</span>
                    </div>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-center">
                      <span className="text-[10px] text-blue-600 block font-sans font-semibold">7.5x IMPACT รวม</span>
                      <span className="font-bold text-blue-900">฿{(swotAndTowsAnalysis.totalCombinedImpact / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-600 block font-sans font-semibold">PM Margin</span>
                      <span className="font-bold text-emerald-900">{pmFinancialSummary.profitMarginPercent}%</span>
                    </div>
                  </div>

                  {/* Standardized Download Excel Button */}
                  <button
                    type="button"
                    onClick={handleExportStrategicExcel}
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
                    <Target size={17} className="text-orange-500" />
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
                          <p className="text-[10.5px] text-emerald-700">ศักยภาพ มาตรฐานคุณภาพ และผลประกอบการ</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                        {swotAndTowsAnalysis.strengths.length} ปัจจัยหลัก
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.strengths.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-emerald-200/60 shadow-2xs space-y-1.5 hover:border-emerald-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {item.title}
                            </span>
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap bg-emerald-50 text-emerald-800 border-emerald-200">
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
                          <p className="text-[10.5px] text-rose-700">ข้อจำกัด คอขวด และจุดที่ต้องเพิ่มประสิทธิภาพ</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                        {swotAndTowsAnalysis.weaknesses.length} ประเด็นพัฒนา
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.weaknesses.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-rose-200/60 shadow-2xs space-y-1.5 hover:border-rose-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {item.title}
                            </span>
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap bg-rose-50 text-rose-800 border-rose-200">
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
                          <p className="text-[10.5px] text-blue-700">แนวโน้มตลาด อุปสงค์อุตสาหกรรม และนโยบายรัฐ</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        {swotAndTowsAnalysis.opportunities.length} โอกาสการเติบโต
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.opportunities.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-blue-200/60 shadow-2xs space-y-1.5 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {item.title}
                            </span>
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap bg-blue-50 text-blue-800 border-blue-200">
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
                          <p className="text-[10.5px] text-amber-700">การแข่งขัน เทคโนโลยีปัญญาประดิษฐ์ และเศรษฐกิจ</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        {swotAndTowsAnalysis.threats.length} ปัจจัยเสี่ยง
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.threats.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs space-y-1.5 hover:border-amber-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {item.title}
                            </span>
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap bg-amber-50 text-amber-800 border-amber-200">
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
                    การจับคู่ปัจจัย S-W x O-T กำหนดมาตรการ 4 ทิศทาง
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
                            {swotAndTowsAnalysis.tows.so.strategy}
                          </h5>
                          <p className="text-[10.5px] text-emerald-700">{swotAndTowsAnalysis.tows.so.theme}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        จุดแข็ง x โอกาส
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.tows.so.tactics.map(tactic => (
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
                              {tactic.impactKpi}
                            </span>
                            <span className="text-slate-500 font-medium">
                              เป้าหมาย: <strong className="text-slate-700">{tactic.target}</strong>
                            </span>
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
                            {swotAndTowsAnalysis.tows.wo.strategy}
                          </h5>
                          <p className="text-[10.5px] text-blue-700">{swotAndTowsAnalysis.tows.wo.theme}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                        จุดอ่อน x โอกาส
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.tows.wo.tactics.map(tactic => (
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
                              {tactic.impactKpi}
                            </span>
                            <span className="text-slate-500 font-medium">
                              เป้าหมาย: <strong className="text-slate-700">{tactic.target}</strong>
                            </span>
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
                            {swotAndTowsAnalysis.tows.st.strategy}
                          </h5>
                          <p className="text-[10.5px] text-amber-700">{swotAndTowsAnalysis.tows.st.theme}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                        จุดแข็ง x อุปสรรค
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.tows.st.tactics.map(tactic => (
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
                              {tactic.impactKpi}
                            </span>
                            <span className="text-slate-500 font-medium">
                              เป้าหมาย: <strong className="text-slate-700">{tactic.target}</strong>
                            </span>
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
                            {swotAndTowsAnalysis.tows.wt.strategy}
                          </h5>
                          <p className="text-[10.5px] text-rose-700">{swotAndTowsAnalysis.tows.wt.theme}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                        จุดอ่อน x อุปสรรค
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {swotAndTowsAnalysis.tows.wt.tactics.map(tactic => (
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
                              {tactic.impactKpi}
                            </span>
                            <span className="text-slate-500 font-medium">
                              เป้าหมาย: <strong className="text-slate-700">{tactic.target}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Analysis, Risks & Mitigation (Requirement 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. นัยยะสำคัญของชุดข้อมูล */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lightbulb size={18} className="text-amber-500" />
                <span>นัยยะสำคัญของชุดข้อมูล (Strategic Insights)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <span>
                    <strong>ความต้องการบรรจุภัณฑ์มาตรฐานสากล:</strong> กลุ่มแปรรูปอาหารและเกษตรมีความต้องการออกแบบบรรจุภัณฑ์เพื่อยกระดับส่งออกสูงกว่า 40% ของงานทั้งหมด
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <span>
                    <strong>อัตรา Conversion จากคำปรึกษาสู่งานออกแบบ:</strong> ผู้ประกอบการที่เข้ารับคำปรึกษามากกว่า 60% พัฒนาต่อเนื่องสู่การว่าจ้างออกแบบอัตลักษณ์และตราสินค้า
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <span>
                    <strong>มูลค่าเฉลี่ยต่องาน (KPI 32) เติบโต:</strong> งานที่ผสานการวิจัยทางเทคโนโลยีร่วมกับการออกแบบสร้างมูลค่าเฉลี่ยต่อชิ้นสูงกว่างานกราฟิกทั่วไปถึง 2.4 เท่า
                  </span>
                </li>
              </ul>
            </div>

            {/* 2. ความเสี่ยงที่พบ */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs space-y-3 bg-rose-50/20">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <ShieldAlert size={18} className="text-rose-500" />
                <span>ความเสี่ยงที่พบ (Identified Risks)</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">1.</span>
                  <span>
                    <strong>Scope Creep &amp; แก้งานเกินรอบ:</strong> ผู้ประกอบการหลายรายไม่มี Design Brief ที่ชัดเจน ส่งผลให้เกิดการปรับแก้ร่างแบบซ้ำซ้อนและกระทบตารางงานภาพรวม
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">2.</span>
                  <span>
                    <strong>ความล่าช้าในการจัดส่งข้อมูล:</strong> ข้อมูลสเปกผลิตภัณฑ์ ข้อมูลโภชนาการ และเลข อย. ของผู้ประกอบการส่งล่าช้า ทำให้สถานะงานค้างที่ In Progress
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">3.</span>
                  <span>
                    <strong>ความเสี่ยงต่อ Response Rate แบบประเมิน:</strong> ผู้ประกอบการบางรายเมื่อได้รับไฟล์ผลงานแล้ว ละเลยการตอบแบบประเมินความพึงพอใจ
                  </span>
                </li>
              </ul>
            </div>

            {/* 3. แนวทางแก้ไขและการพัฒนา */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-3 bg-emerald-50/20">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>แนวทางพัฒนา &amp; มาตรการแก้ไข (Mitigation)</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <span>
                    <strong>กำหนด SLA &amp; กรอบ Revision:</strong> บังคับใช้เงื่อนไขตรวจรับงานและจำกัดรอบแก้ไขแบบร่างไม่เกิน 3 ครั้ง พร้อมเซ็นรับทราบในขั้นตอน Kickoff
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <span>
                    <strong>ระบบ Checklist &amp; Design Intake บังคับ:</strong> ให้ผู้ประกอบการแนบไฟล์และข้อมูลมาตรฐานก่อนเริ่มนับวันทำงานจริงของดีไซเนอร์
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <span>
                    <strong>One-Click LINE Survey Link:</strong> ผูกการดาวน์โหลดไฟล์ความละเอียดสูง (Final Files) คู่กับการตอบแบบประเมินสั้น 1 นาที เพิ่ม Response Rate เกิน 95%
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PM DESIGN REVENUE TABLE & FINANCIALS (REQUIREMENT 7)               */}
      {/* ========================================================================= */}
      {activeTab === "pm-design" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-3 bg-[#E03131] text-white rounded-xl shadow-xs shrink-0">
                <Palette size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  ตารางสรุปรายได้โครงการ PM งานออกแบบ (Design PM Revenue)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  นำข้อมูล PM ของโครงการ CC ที่ถูกระบุเป็นงานประเภท Design มาจัดทำตารางสรุปรายได้ ต้นทุน และกำไรสุทธิ เพื่อประกอบการนับรายได้ที่เข้ามาผ่านงานออกแบบ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchPMData()}
                disabled={loadingPm}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="รีเฟรชข้อมูลจากระบบ"
              >
                <RefreshCw size={14} className={loadingPm ? "animate-spin" : ""} />
                <span>รีเฟรช</span>
              </button>

              <button
                type="button"
                onClick={handleExportPmDesignCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.csv ภาษาไทยสมบูรณ์)"
              >
                <Download size={14} />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>
          </div>

          {/* 5 Financial Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. รายรับรวม PM Design */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <DollarSign size={14} className="text-emerald-600 shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-600 uppercase tracking-wider truncate">
                  รายรับรวม (Revenue)
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-slate-900 tracking-tight tabular-nums truncate">
                  ฿{pmFinancialSummary.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                เฉลี่ย ฿{pmFinancialSummary.avgRevenuePerProject.toLocaleString()} / โครงการ
              </p>
            </div>

            {/* 2. ต้นทุนรวม */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Package size={14} className="text-slate-600 shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-600 uppercase tracking-wider truncate">
                  ต้นทุนรวม (Cost)
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-slate-800 tracking-tight tabular-nums truncate">
                  ฿{pmFinancialSummary.totalCost.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                สัดส่วน {pmFinancialSummary.totalRevenue > 0 ? ((pmFinancialSummary.totalCost / pmFinancialSummary.totalRevenue) * 100).toFixed(1) : 0}% ของรายรับ
              </p>
            </div>

            {/* 3. กำไรสุทธิรวม */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp size={14} className="text-amber-600 shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-600 uppercase tracking-wider truncate">
                  กำไรสุทธิ (Profit)
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-emerald-700 tracking-tight tabular-nums truncate">
                  ฿{pmFinancialSummary.totalProfit.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                กำไรสุทธิ Margin {pmFinancialSummary.profitMarginPercent}% จากงานออกแบบ
              </p>
            </div>

            {/* 4. จำนวนโครงการ PM ด้านออกแบบ */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-all flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Palette size={14} className="text-[#E03131] shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-600 uppercase tracking-wider truncate">
                  โครงการ PM
                </span>
              </div>
              <div className="my-auto py-0.5 flex items-baseline gap-1 min-w-0 overflow-hidden">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums truncate">
                  {pmFinancialSummary.projectCount}
                </h3>
                <span className="text-xs font-semibold text-slate-400 shrink-0">โครงการ</span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                เสร็จสิ้น {pmFinancialSummary.completedCount} • กำลังทำ {pmFinancialSummary.inProgressCount}
              </p>
            </div>

            {/* 5. สัดส่วนภาครัฐ vs เอกชน */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all col-span-2 sm:col-span-1 flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 size={14} className="text-blue-600 shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-600 uppercase tracking-wider truncate">
                  สัดส่วนรายรับ
                </span>
              </div>
              <div className="my-auto py-0.5 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">🏛️ ภาครัฐ:</span>
                  <span className="font-mono text-blue-700 font-bold tabular-nums">฿{(pmFinancialSummary.govRevenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">🏢 เอกชน:</span>
                  <span className="font-mono text-emerald-700 font-bold tabular-nums">฿{(pmFinancialSummary.privRevenue).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100">
                รัฐ {pmFinancialSummary.govCount} โครงการ • เอกชน {pmFinancialSummary.privCount} โครงการ
              </p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารหัสโครงการ, ชื่องาน, ผู้รับผิดชอบ หรือประเภทงาน..."
                value={pmSearchTerm}
                onChange={e => setPmSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
              />
              {pmSearchTerm && (
                <button
                  onClick={() => setPmSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter: Sector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ภาคส่วน:</span>
              <select
                value={pmFilterSector}
                onChange={e => setPmFilterSector(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกภาคส่วน</option>
                <option value="government">🏛️ ภาครัฐ (Government)</option>
                <option value="private">🏢 ภาคเอกชน (Private)</option>
              </select>
            </div>

            {/* Filter: Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">สถานะ:</span>
              <select
                value={pmFilterStatus}
                onChange={e => setPmFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="completed">เสร็จสิ้น (Completed)</option>
                <option value="in_progress">กำลังทำ (In Progress)</option>
                <option value="pending">รอดำเนินการ (Pending)</option>
                <option value="cancelled">ยกเลิก (Cancelled)</option>
              </select>
            </div>

            {/* Clear All Filters */}
            {(pmSearchTerm || pmFilterSector !== "all" || pmFilterStatus !== "all" || pmFilterCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setPmSearchTerm("");
                  setPmFilterSector("all");
                  setPmFilterStatus("all");
                  setPmFilterCategory("all");
                }}
                className="px-3 py-2 text-xs font-semibold text-[#E03131] hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <X size={13} />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="min-w-[850px] w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="py-2.5 px-2 w-[110px] whitespace-nowrap">รหัส / วันที่</th>
                    <th className="py-2.5 px-2 min-w-[200px] font-extrabold text-slate-800 whitespace-nowrap">ชื่องานโครงการ (Project Name)</th>
                    <th className="py-2.5 px-2 min-w-[140px] whitespace-nowrap">บริการย่อย Design</th>
                    <th className="py-2.5 px-1.5 w-[85px] text-center whitespace-nowrap">ภาคส่วน</th>
                    <th className="py-2.5 px-1.5 w-[95px] text-center whitespace-nowrap">ผู้รับผิดชอบ</th>
                    <th className="py-2.5 px-1.5 w-[90px] text-right whitespace-nowrap">รายรับ (บาท)</th>
                    <th className="py-2.5 px-1.5 w-[90px] text-right whitespace-nowrap">ต้นทุน (บาท)</th>
                    <th className="py-2.5 px-1.5 w-[95px] text-right whitespace-nowrap">กำไรสุทธิ (บาท)</th>
                    <th className="py-2.5 px-1 w-[85px] text-center whitespace-nowrap">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingPm ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-300" />
                        <span>กำลังโหลดข้อมูลโครงการ PM งานออกแบบ...</span>
                      </td>
                    </tr>
                  ) : filteredDesignPm.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Palette size={28} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">ไม่พบข้อมูลโครงการ PM ด้านงานออกแบบ</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {pmBriefs.length === 0 
                            ? "ยังไม่มีข้อมูลโครงการ PM ในระบบ" 
                            : "ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองด้านบน หรือเพิ่มโครงการ PM ใหม่โดยเลือกประเภทงาน Design"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDesignPm.map((b, index) => {
                      const code = b.details?.project_code || `PM-CC-${index + 1}`;
                      const rev = Number(b.details?.revenue) || 0;
                      const cost = Number(b.details?.cost) || 0;
                      const profit = b.details?.profit !== undefined && b.details?.profit !== null && b.details?.profit !== "" 
                        ? Number(b.details?.profit) 
                        : (rev - cost);
                      const sector = b.details?.client_sector || (code.includes('GOV') ? 'government' : 'private');
                      const assigneeName = assigneesMap[b.assignee_id]?.name || b.coordinator_nickname || "รอมอบหมาย";
                      const category = b.details?.pm_work_category || b.details?.service_category || b.details?.category || "งานออกแบบ (Design)";
                      const deadline = b.deadline ? new Date(b.deadline).toLocaleDateString("th-TH") : null;

                      return (
                        <tr
                          key={b.id || index}
                          onClick={() => setSelectedPmDetail(b)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* รหัส / วันที่ */}
                          <td className="py-2.5 px-2 align-top overflow-hidden">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded text-[10px] block truncate tracking-tight">
                              {code}
                            </span>
                            <div className="text-[9.5px] text-slate-400 mt-1 truncate font-medium">
                              {deadline ? `ส่ง: ${deadline}` : (b.created_at ? new Date(b.created_at).toLocaleDateString("th-TH") : "-")}
                            </div>
                          </td>

                          {/* ชื่องานโครงการ */}
                          <td className="py-2.5 px-2 align-top overflow-hidden">
                            <div className="font-bold text-slate-900 group-hover:text-[#E03131] transition-colors truncate text-[12px] leading-snug" title={b.project_name}>
                              {b.project_name}
                            </div>
                            {b.details?.organization && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
                                หน่วยงาน: {b.details.organization}
                              </div>
                            )}
                          </td>

                          {/* บริการย่อย Design */}
                          <td className="py-2.5 px-2 align-top overflow-hidden">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 truncate max-w-full" title={category}>
                              <Palette size={10} className="shrink-0 text-rose-500" />
                              <span className="truncate">{category}</span>
                            </span>
                          </td>

                          {/* ภาคส่วน */}
                          <td className="py-2.5 px-1.5 align-top text-center overflow-hidden">
                            {sector === "government" ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                🏛️ ภาครัฐ
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                🏢 เอกชน
                              </span>
                            )}
                          </td>

                          {/* ผู้รับผิดชอบ */}
                          <td className="py-2.5 px-1.5 align-top text-center overflow-hidden">
                            <span className="font-semibold text-slate-800 text-[11px] truncate block" title={assigneeName}>
                              {assigneeName}
                            </span>
                          </td>

                          {/* รายรับ */}
                          <td className="py-2.5 px-1.5 align-top text-right overflow-hidden font-mono font-bold text-emerald-700 text-[11.5px] truncate">
                            ฿{rev.toLocaleString()}
                          </td>

                          {/* ต้นทุน */}
                          <td className="py-2.5 px-1.5 align-top text-right overflow-hidden font-mono text-slate-500 text-[11px] truncate">
                            ฿{cost.toLocaleString()}
                          </td>

                          {/* กำไรสุทธิ */}
                          <td className="py-2.5 px-1.5 align-top text-right overflow-hidden font-mono font-bold text-slate-900 text-[11.5px] truncate">
                            ฿{profit.toLocaleString()}
                          </td>

                          {/* สถานะ */}
                          <td className="py-2.5 px-1 align-top text-center overflow-hidden">
                            {b.status === "completed" ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                <CheckCircle2 size={10} className="shrink-0" />
                                เสร็จสิ้น
                              </span>
                            ) : b.status === "in_progress" ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                <Clock size={10} className="shrink-0" />
                                กำลังทำ
                              </span>
                            ) : b.status === "cancelled" ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                <X size={10} className="shrink-0" />
                                ยกเลิก
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                                <Clock size={10} className="shrink-0" />
                                รอทำ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Summary Table Footer */}
                {filteredDesignPm.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50/90 border-t-2 border-slate-300 font-bold text-slate-900 text-[11px]">
                      <td colSpan={5} className="py-2.5 px-2 text-right">
                        รวมทั้งสิ้น ({filteredDesignPm.length} โครงการ):
                      </td>
                      <td className="py-2.5 px-1.5 text-right font-mono font-black text-emerald-700 truncate">
                        ฿{pmFinancialSummary.totalRevenue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-1.5 text-right font-mono font-black text-slate-700 truncate">
                        ฿{pmFinancialSummary.totalCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-1.5 text-right font-mono font-black text-emerald-800 truncate">
                        ฿{pmFinancialSummary.totalProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-1 text-center text-[10px] text-slate-500 font-semibold truncate">
                        Margin {pmFinancialSummary.profitMarginPercent}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SATISFACTION SURVEY DISPATCH (REQUIREMENT 2 - KPI 34)              */}
      {/* ========================================================================= */}
      {surveyModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Star size={18} className="fill-orange-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    แบบประเมินความพึงพอใจในการเข้ารับคำปรึกษา (Innovation Design Center)
                  </h4>
                  <p className="text-xs text-slate-500">
                    แบบประเมินเฉพาะการเข้ารับคำปรึกษาศูนย์ออกแบบและพัฒนานวัตกรรม (KPI 34) | รหัส: {surveyModalRecord.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSurveyModalRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Client Info Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">ผู้รับบริการ:</span>
                <span className="font-bold text-slate-800">{surveyModalRecord.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">สถานประกอบการ:</span>
                <span className="font-bold text-slate-800">{surveyModalRecord.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">บริการที่ได้รับ:</span>
                <span className="font-bold text-slate-800">
                  {surveyModalRecord.serviceMain === "consultation" ? "การให้คำปรึกษา" : "งานออกแบบ"} ({surveyModalRecord.pieceCount} {surveyModalRecord.serviceMain === "consultation" ? "ครั้ง" : "ชิ้น"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">อีเมล / เบอร์โทร:</span>
                <span className="font-mono text-slate-700">{surveyModalRecord.email} / {surveyModalRecord.phone}</span>
              </div>
              {surveyModalRecord.satisfactionScore && (
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-amber-600">
                  <span>ผลการประเมินปัจจุบัน:</span>
                  <span>{surveyModalRecord.satisfactionScore} / 5.0 ดาว</span>
                </div>
              )}
            </div>

            {/* Dedicated Consultation Dimensions Indicator */}
            <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-200/80 text-[11px] space-y-1">
              <span className="font-bold text-orange-950 flex items-center gap-1">
                <Sparkles size={12} className="text-orange-600" />
                หัวข้อประเมินเฉพาะสำหรับการเข้ารับคำปรึกษา (5 มิติ):
              </span>
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                1. ความรู้และความเชี่ยวชาญ • 2. ความตรงต่อเวลา • 3. ประโยชน์ในการนำไปใช้จริง • 4. การสื่อสารและเอาใจใส่ • 5. ภาพรวมความพึงพอใจ
              </p>
            </div>

            {/* Generated Survey Link */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                ลิงก์ประเมินความพึงพอใจรายบุคคล (Personalized Survey URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getSurveyLink(surveyModalRecord)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-none select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getSurveyLink(surveyModalRecord));
                    setCopyFeedback("คัดลอกเฉพาะลิงก์แล้ว!");
                    setTimeout(() => setCopyFeedback(null), 2000);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 cursor-pointer shrink-0"
                  title="คัดลอกลิงก์"
                >
                  <Copy size={15} />
                </button>
              </div>
              {copyFeedback && (
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={12} /> {copyFeedback}
                </p>
              )}
            </div>

            {/* Quick Dispatch Channels: Email & LINE */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                ช่องทางการส่งแบบประเมินให้ผู้ประกอบการ:
              </span>
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Send via LINE */}
                <button
                  type="button"
                  onClick={() => handleCopyLineSurvey(surveyModalRecord)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#06C755] hover:bg-[#05b04c] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>คัดลอกส่งทาง LINE</span>
                </button>

                {/* 2. Send via Email */}
                <button
                  type="button"
                  onClick={() => handleSendEmailSurvey(surveyModalRecord)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Mail size={16} />
                  <span>ส่งทาง Email</span>
                </button>
              </div>
            </div>

            {/* Quick Test / Simulate Customer Rating */}
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-2">
              <span className="font-bold text-amber-900 block">
                ทดสอบจำลองการให้คะแนนความพึงพอใจของลูกค้า:
              </span>
              <div className="flex items-center gap-2">
                {[5.0, 4.8, 4.5, 4.0, 3.5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleSimulateRating(star)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-bold text-xs transition-all cursor-pointer"
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSurveyModalRecord(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT RECORD MODAL (FOR ASSIGNEE & RECORD MODIFICATION)             */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    แก้ไขข้อมูลคำขอเข้ารับบริการ
                  </h4>
                  <p className="text-xs text-slate-500">
                    รหัสคำขอ: <span className="font-mono font-bold text-slate-800">{editingRecord.code}</span> | วันที่: {editingRecord.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: ข้อมูลภายในสำหรับ Assignee (Internal Management) */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                ข้อมูลการจัดการภายในสำหรับ Assignee (กรอกรายได้ &amp; สถานะงาน)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* ผู้รับผิดชอบงาน */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ผู้รับผิดชอบงาน (Assignee)
                  </label>
                  <ModernSelect
                    value={editingRecord.assignee || "รอมอบหมาย"}
                    onChange={val => setEditingRecord({ ...editingRecord, assignee: val })}
                    options={IDC_ASSIGNEE_OPTIONS}
                    placeholder="เลือกผู้รับผิดชอบ..."
                    searchPlaceholder="ค้นหาผู้รับผิดชอบ..."
                    searchable={true}
                    className="rounded-full bg-white border-slate-300 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>

                {/* รายได้บริการภายใน (KPI 30) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    รายได้บริการภายใน (บาท) <span title="(30) KPI รายได้">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">฿</span>
                    <input
                      type="number"
                      min={0}
                      value={editingRecord.revenue || 0}
                      onChange={e => setEditingRecord({ ...editingRecord, revenue: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-700 h-[38px]"
                    />
                  </div>
                </div>

                {/* สถานะงาน */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    สถานะงาน (Task Status)
                  </label>
                  <ModernSelect
                    value={editingRecord.status}
                    onChange={val => setEditingRecord({ ...editingRecord, status: val as TaskStatus })}
                    options={IDC_EDIT_STATUS_OPTIONS}
                    placeholder="เลือกสถานะงาน..."
                    searchable={false}
                    className="rounded-full bg-white border-slate-300 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: ข้อมูลผู้รับบริการ & สถานประกอบการ */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Building2 size={14} className="text-orange-500" />
                ข้อมูลผู้รับบริการ &amp; สถานประกอบการ
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อผู้รับบริการ</label>
                  <input
                    type="text"
                    value={editingRecord.clientName}
                    onChange={e => setEditingRecord({ ...editingRecord, clientName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อสถานประกอบการ</label>
                  <input
                    type="text"
                    value={editingRecord.companyName}
                    onChange={e => setEditingRecord({ ...editingRecord, companyName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ประเภทหน่วยงาน</label>
                  <ModernSelect
                    value={editingRecord.organizationType}
                    onChange={val => setEditingRecord({ ...editingRecord, organizationType: val as OrganizationType })}
                    options={IDC_ORGANIZATION_TYPE_OPTIONS}
                    placeholder="เลือกประเภทหน่วยงาน..."
                    searchable={false}
                    className="rounded-full bg-slate-50 border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ประเภทธุรกิจ</label>
                  <ModernSelect
                    value={editingRecord.businessType}
                    onChange={val => setEditingRecord({ ...editingRecord, businessType: val as BusinessType })}
                    options={IDC_BUSINESS_TYPE_OPTIONS}
                    placeholder="เลือกประเภทธุรกิจ..."
                    searchPlaceholder="ค้นหาประเภทธุรกิจ..."
                    searchable={true}
                    className="rounded-full bg-slate-50 border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingRecord.phone}
                    onChange={e => setEditingRecord({ ...editingRecord, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingRecord.email}
                    onChange={e => setEditingRecord({ ...editingRecord, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ที่อยู่สถานประกอบการ</label>
                <textarea
                  rows={2}
                  value={editingRecord.address}
                  onChange={e => setEditingRecord({ ...editingRecord, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Section 3: ประเภทบริการ & ปริมาณชิ้นงาน */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Layers size={14} className="text-orange-500" />
                ประเภทบริการ &amp; จำนวนชิ้นงาน (KPI 31)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ประเภทงานที่รับคำปรึกษา</label>
                  <ModernSelect
                    value={editingRecord.serviceMain}
                    onChange={val => setEditingRecord({ ...editingRecord, serviceMain: val as ServiceMainCategory })}
                    options={IDC_EDIT_SERVICE_MAIN_OPTIONS}
                    placeholder="เลือกประเภทงาน..."
                    searchPlaceholder="ค้นหาประเภทงาน..."
                    searchable={true}
                    className="rounded-full bg-slate-50 border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    จำนวนชิ้น / จำนวนครั้ง (KPI 31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingRecord.pieceCount}
                    onChange={e => setEditingRecord({ ...editingRecord, pieceCount: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {editingRecord.serviceMain === "other" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ระบุประเภทงานอื่นๆ</label>
                  <input
                    type="text"
                    value={editingRecord.serviceOtherDetail || ""}
                    onChange={e => setEditingRecord({ ...editingRecord, serviceOtherDetail: e.target.value })}
                    placeholder="เช่น 3D Visualization, จัดทำ Mockup"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">รายละเอียดสังเขป / วัตถุประสงค์งาน</label>
                <textarea
                  rows={2}
                  value={editingRecord.projectBrief || ""}
                  onChange={e => setEditingRecord({ ...editingRecord, projectBrief: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedRecord(editingRecord)}
                className="flex items-center gap-1.5 px-6 py-2 bg-[#E03131] hover:bg-[#c92a2a] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PM DESIGN PROJECT DETAIL MODAL                                     */}
      {/* ========================================================================= */}
      {selectedPmDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#E03131] border border-rose-200">
                  <Palette size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 line-clamp-1">
                    {selectedPmDetail.project_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    รหัสโครงการ: <span className="font-mono font-bold text-slate-800">{selectedPmDetail.details?.project_code || "PM-CC"}</span> | วันที่: {selectedPmDetail.created_at ? new Date(selectedPmDetail.created_at).toLocaleDateString("th-TH") : "-"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPmDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                สรุปข้อมูลทางการเงิน (Financial Breakdown)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">รายรับ</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">
                    ฿{(Number(selectedPmDetail.details?.revenue) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">ต้นทุน</span>
                  <span className="text-sm font-black text-slate-700 font-mono">
                    ฿{(Number(selectedPmDetail.details?.cost) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">กำไรสุทธิ</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ฿{((Number(selectedPmDetail.details?.profit) !== undefined && selectedPmDetail.details?.profit !== null && selectedPmDetail.details?.profit !== "")
                      ? Number(selectedPmDetail.details?.profit)
                      : ((Number(selectedPmDetail.details?.revenue) || 0) - (Number(selectedPmDetail.details?.cost) || 0))
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Margin</span>
                  <span className="text-sm font-black text-blue-700 font-mono">
                    {Number(selectedPmDetail.details?.revenue) > 0
                      ? `${(((Number(selectedPmDetail.details?.profit) || ((Number(selectedPmDetail.details?.revenue) || 0) - (Number(selectedPmDetail.details?.cost) || 0))) / Number(selectedPmDetail.details?.revenue)) * 100).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Specifications */}
            <div className="space-y-2.5 text-xs">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Briefcase size={14} className="text-[#E03131]" />
                รายละเอียดโครงการ &amp; ข้อมูลบริการ
              </span>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-0.5">ประเภทงาน</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Palette size={12} className="text-[#E03131]" />
                    Design (งานออกแบบ)
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-0.5">บริการย่อย</span>
                  <span className="font-bold text-slate-800">
                    {selectedPmDetail.details?.pm_work_category || selectedPmDetail.details?.service_category || selectedPmDetail.details?.category || "งานออกแบบ (Design)"}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-0.5">ภาคส่วน</span>
                  <span className="font-bold text-slate-800">
                    {selectedPmDetail.details?.client_sector === "government" || (selectedPmDetail.details?.project_code || "").includes("GOV") ? "🏛️ ภาครัฐ" : "🏢 ภาคเอกชน"}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-0.5">ผู้รับผิดชอบหลัก</span>
                  <span className="font-bold text-slate-800">
                    {assigneesMap[selectedPmDetail.assignee_id]?.name || selectedPmDetail.coordinator_nickname || "รอมอบหมาย"}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-0.5">กำหนดส่งมอบ</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedPmDetail.deadline ? new Date(selectedPmDetail.deadline).toLocaleDateString("th-TH") : "-"}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-0.5">สถานะงาน</span>
                  <span className="font-bold text-slate-800">
                    {selectedPmDetail.status === "completed" ? "✅ เสร็จสิ้น" : selectedPmDetail.status === "in_progress" ? "⏳ กำลังดำเนินการ" : selectedPmDetail.status === "cancelled" ? "❌ ยกเลิก" : "⏸️ รอดำเนินการ"}
                  </span>
                </div>
              </div>

              {/* Assistants if present */}
              {Array.isArray(selectedPmDetail.details?.assistants) && selectedPmDetail.details.assistants.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">ผู้ช่วยดำเนินงาน:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPmDetail.details.assistants.map((asst: any, i: number) => (
                      <span key={i} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-medium">
                        {assigneesMap[asst.assignee_id]?.name || asst.assignee_id}: {asst.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {(selectedPmDetail.details?.description || selectedPmDetail.details?.details) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 block">รายละเอียดสังเขป / วัตถุประสงค์:</span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedPmDetail.details?.description || selectedPmDetail.details?.details}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setSelectedPmDetail(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slideUp text-xs font-semibold max-w-md">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 size={16} />
          </div>
          <span className="leading-snug">{copyFeedback}</span>
        </div>
      )}
    </div>
  );
}
