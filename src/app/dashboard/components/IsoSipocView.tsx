"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Users,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Truck,
  Check,
  Star,
  Info
} from "lucide-react";

// =========================================================================
// DATA & TYPES FOR TAB 2: SIPOC & 3 UNITS PROCESS
// =========================================================================

export interface SipocNode {
  id: string;
  category: "Supplier" | "Input" | "Process" | "Output" | "Customer";
  title: string;
  unit: "all" | "design" | "pr" | "content";
  unitLabel: string;
  details: string[];
  owner: string;
  isoRef: string;
}

export interface VendorEvaluationItem {
  id: string;
  vendorName: string;
  serviceCategory: string;
  unitInCharge: string;
  qualityScore: number; // Max 40
  timelinessScore: number; // Max 30
  pricingScore: number; // Max 15
  coordinationScore: number; // Max 15
  totalScore: number; // 100
  grade: "A (ดีเลิศ)" | "B (ได้มาตรฐาน)" | "C (ต้องปรับปรุง)";
  status: "อนุมัติใช้งาน (Approved)" | "เฝ้าระวัง (Under Review)";
  lastEvaluated: string;
  remarks: string;
}

const SIPOC_DATA: SipocNode[] = [
  // SUPPLIERS
  {
    id: "s-1",
    category: "Supplier",
    title: "คณะ / ส่วนงานวิชาการ มหาวิทยาลัยเชียงใหม่",
    unit: "all",
    unitLabel: "ทุกยูนิต",
    details: ["คณาจารย์ นักวิจัย และเจ้าของนวัตกรรมที่ต้องการสื่อสารผลงาน", "ขอรับบริการผลิตสื่อ วารสาร และการประชาสัมพันธ์"],
    owner: "หน่วยงานเครือข่าย มช.",
    isoRef: "ข้อ 4.4, 8.4"
  },
  {
    id: "s-2",
    category: "Supplier",
    title: "ผู้บริหารอุทยานฯ (ผอ. / ผศ.ดร.สุริยะ รอง ผอ.)",
    unit: "all",
    unitLabel: "บริหารงานภาพลักษณ์",
    details: ["นโยบายและทิศทางการสื่อสารองค์กรประจำปี", "โจทย์งานเชิงยุทธศาสตร์ แคมเปญพิเศษ และอีเวนต์ระดับชาติ"],
    owner: "ฝ่ายบริหาร STeP",
    isoRef: "ข้อ 5.1, 5.2"
  },
  {
    id: "s-3",
    category: "Supplier",
    title: "ผู้ประกอบการบ่มเพาะธุรกิจ NSP & Startups",
    unit: "design",
    unitLabel: "ยูนิตงานออกแบบ",
    details: ["ผู้ประกอบการขอรับการออกแบบอัตลักษณ์ บรรจุภัณฑ์ (Packaging)", "ภาพถ่ายผลิตภัณฑ์เพื่อเตรียมเปิดตัวสู่ตลาด"],
    owner: "แผนกบ่มเพาะธุรกิจ (BD)",
    isoRef: "ข้อ 8.2.1"
  },
  {
    id: "s-4",
    category: "Supplier",
    title: "สื่อมวลชน เครือข่ายประชาสัมพันธ์ภาคเหนือ",
    unit: "pr",
    unitLabel: "ยูนิตสื่อสารองค์กร",
    details: ["ความต้องการข้อมูลข่าวสาร Press Release กิจกรรมวิทย์ฯ", "คำร้องขอสัมภาษณ์ผู้บริหารและนักวิจัย"],
    owner: "สื่อมวลชน & PR Partner",
    isoRef: "ข้อ 4.2"
  },

  // INPUTS
  {
    id: "i-1",
    category: "Input",
    title: "Creative Brief / คำร้องขอรับบริการผลิตสื่อ",
    unit: "all",
    unitLabel: "เอกสารนำเข้าหลัก",
    details: ["วัตถุประสงค์ กลุ่มเป้าหมาย Key Messages และวันส่งมอบงาน", "ผ่านระบบ Ticket / แบบฟอร์มขอรับบริการของทีม CC"],
    owner: "ผู้ขอรับบริการ",
    isoRef: "ข้อ 8.2.2"
  },
  {
    id: "i-2",
    category: "Input",
    title: "คู่มืออัตลักษณ์องค์กร (STeP CI Brand Guidelines)",
    unit: "all",
    unitLabel: "มาตรฐาน CI",
    details: ["ชุดสีทางการ ฟอนต์ลิขสิทธิ์ สัดส่วนโลโก้ และการจัดวาง", "ข้อกำหนดการใช้ตราสัญลักษณ์ร่วมกับกระทรวง อว."],
    owner: "ทีม CC (ผู้ถือกฎ CI)",
    isoRef: "ข้อ 7.5"
  },
  {
    id: "i-3",
    category: "Input",
    title: "ข้อมูลวิชาการ / สคริปต์ / ผลการวิจัยฉบับย่อย",
    unit: "content",
    unitLabel: "ยูนิตผลิตสื่อสร้างสรรค์",
    details: ["ข้อมูลองค์ความรู้วิทยาศาสตร์ นวัตกรรมเชิงลึกที่ต้องนำมาย่อย", "เนื้อหาสำหรับทำ Infographic, Video Reel, Storytelling"],
    owner: "นักวิจัย / Content Creator",
    isoRef: "ข้อ 7.1.6"
  },
  {
    id: "i-4",
    category: "Input",
    title: "ภาพถ่าย วัตถุดิบมีเดีย และงบประมาณจัดจ้างภายนอก",
    unit: "design",
    unitLabel: "ยูนิตงานออกแบบ / สื่อ",
    details: ["ภาพสต็อกลิขสิทธิ์ ดนตรีประกอบถูกลิขสิทธิ์", "งบประมาณจัดจ้างโรงพิมพ์ ช่างภาพอิสระ (ถ้ามี)"],
    owner: "ผู้ว่าจ้าง / ผู้จัดสรรงบ",
    isoRef: "ข้อ 7.1.3"
  },

  // PROCESS (5 PHASES)
  {
    id: "p-1",
    category: "Process",
    title: "ระยะที่ 1: รับบรีฟและวิเคราะห์โจทย์การสื่อสาร (Intake & Scoping)",
    unit: "all",
    unitLabel: "ขั้นตอน 1-3 ใน WI",
    details: ["ประชุมทำความเข้าใจโจทย์ กำหนดกรอบเวลาส่งมอบ และคัดกรองความเสี่ยง", "มอบหมายทีมงานหลัก: Designer, PR, หรือ Content Creator"],
    owner: "จ๊อบ AA (หัวหน้า) / วา WK (ผู้ช่วย)",
    isoRef: "ข้อ 8.2.3"
  },
  {
    id: "p-2",
    category: "Process",
    title: "ระยะที่ 2: วางแนวคิด ออกแบบร่าง หรือร่างสคริปต์ (Concept & Draft)",
    unit: "all",
    unitLabel: "ขั้นตอน 4-7 ใน WI",
    details: ["ขึ้นโครงร่าง Mood & Tone, Moodboard, Storyboard 30-60 วิ", "ส่งให้ผู้ขอรับบริการพิจารณาแบบร่างรอบที่ 1"],
    owner: "ผู้รับผิดชอบงานประจำยูนิต",
    isoRef: "ข้อ 8.3.2"
  },
  {
    id: "p-3",
    category: "Process",
    title: "ระยะที่ 3: ผลิตชิ้นงานสร้างสรรค์เต็มรูปแบบ (Production)",
    unit: "all",
    unitLabel: "ขั้นตอน 8-11 ใน WI",
    details: ["วาด Graphic Final, ถ่ายทำ-ตัดต่อวิดีโอ, เขียนบทความ PR", "ตรวจสอบความถูกต้องตามเกณฑ์ CI และลิขสิทธิ์สื่อ 100%"],
    owner: "สมาชิก 3 ยูนิตปฏิบัติการ",
    isoRef: "ข้อ 8.5.1"
  },
  {
    id: "p-4",
    category: "Process",
    title: "ระยะที่ 4: ตรวจสอบคุณภาพและลงนามอนุมัติ (QC & Approval)",
    unit: "all",
    unitLabel: "ขั้นตอน 12-13 ใน WI",
    details: ["ตรวจสอบความถูกต้องของข้อความ ตัวสะกด โลโก้ และสีสัน", "หัวหน้าทีมอนุมัติชิ้นงานก่อนส่งมอบจริง"],
    owner: "หัวหน้าทีม CC / ผู้ตรวจรับงาน",
    isoRef: "ข้อ 8.6"
  },
  {
    id: "p-5",
    category: "Process",
    title: "ระยะที่ 5: เผยแพร่ ส่งมอบไฟล์ และประเมินผล (Delivery & Evaluation)",
    unit: "all",
    unitLabel: "ขั้นตอน 14-15 ใน WI",
    details: ["อัพโหลดไฟล์ต้นฉบับคุณภาพสูง หรือยิงแคมเปญ Social Media", "ส่งแบบประเมินความพึงพอใจลูกค้า (CSAT) ทุกโปรเจกต์"],
    owner: "ทีม CC & ผู้รับบริการ",
    isoRef: "ข้อ 9.1.2"
  },

  // OUTPUTS
  {
    id: "o-1",
    category: "Output",
    title: "ชิ้นงานกราฟิกและสื่ออัตลักษณ์ (Graphic & Brand Assets)",
    unit: "design",
    unitLabel: "ยูนิตงานออกแบบ",
    details: ["โปสเตอร์ Infographic, แบนเนอร์ Digital, บรรจุภัณฑ์ผลิตภัณฑ์", "ไฟล์ต้นฉบับ (.AI, .PSD, .PDF Print-ready) ตามมาตรฐาน"],
    owner: "ยูนิตงานออกแบบ",
    isoRef: "ข้อ 8.5.1"
  },
  {
    id: "o-2",
    category: "Output",
    title: "ข่าวประชาสัมพันธ์และสื่อเผยแพร่ภาพลักษณ์ (PR & Media Kits)",
    unit: "pr",
    unitLabel: "ยูนิตสื่อสารองค์กร",
    details: ["Press Release ส่งสื่อมวลชน, ข่าวบนเว็บไซต์ STeP และ Social", "ภาพถ่ายบันทึกประวัติศาสตร์กิจกรรมและอีเวนต์"],
    owner: "ยูนิตสื่อสารองค์กร",
    isoRef: "ข้อ 8.2.1"
  },
  {
    id: "o-3",
    category: "Output",
    title: "วิดีโอสร้างสรรค์ สารคดีสั้น และบทความดิจิทัล (Video & Articles)",
    unit: "content",
    unitLabel: "ยูนิตผลิตสื่อสร้างสรรค์",
    details: ["วิดีโอคลิปสั้น Reels / TikTok / YouTube ความคมชัด 4K/FHD", "บทความวิทยาน่ารู้ย่อยง่าย สคริปต์ Podcast"],
    owner: "ยูนิตผลิตสื่อสร้างสรรค์",
    isoRef: "ข้อ 8.5.1"
  },
  {
    id: "o-4",
    category: "Output",
    title: "รายงานสรุปสถิติ Reach, Engagement และผลประเมิน CSAT",
    unit: "all",
    unitLabel: "รายงานผลสัมฤทธิ์",
    details: ["สถิติยอดการเข้าถึงสื่อทุกช่องทางประจำเดือน", "คะแนนความพึงพอใจและข้อเสนอแนะเพื่อการปรับปรุง"],
    owner: "ทีม CC รายงานต่อ ผอ.",
    isoRef: "ข้อ 9.1.3"
  },

  // CUSTOMERS
  {
    id: "c-1",
    category: "Customer",
    title: "นักศึกษา คณาจารย์ และนักวิจัย มช.",
    unit: "all",
    unitLabel: "ผู้รับบริการภายใน",
    details: ["ได้รับสื่อประชาสัมพันธ์งานวิจัยที่เข้าใจง่าย ดึงดูดผู้สนใจ", "เพิ่มโอกาสในการต่อยอดเชิงพาณิชย์และขอทุน"],
    owner: "ประชาคม มช.",
    isoRef: "ข้อ 5.1.2"
  },
  {
    id: "c-2",
    category: "Customer",
    title: "ผู้ประกอบการภาคเอกชน และ Startup ในพื้นที่ภาคเหนือ",
    unit: "design",
    unitLabel: "ผู้ประกอบการ",
    details: ["ได้รับงานออกแบบบรรจุภัณฑ์และแบรนด์ที่แข่งขันในตลาดได้จริง", "สร้างมูลค่าเพิ่มให้กับผลิตภัณฑ์นวัตกรรม"],
    owner: "ภาคอุตสาหกรรม",
    isoRef: "ข้อ 8.2.1"
  },
  {
    id: "c-3",
    category: "Customer",
    title: "สาธารณชน ประชาชนทั่วไป และเยาวชน",
    unit: "content",
    unitLabel: "กลุ่มเป้าหมายสังคม",
    details: ["เข้าถึงความรู้ด้านวิทยาศาสตร์และนวัตกรรมได้สะดวกรวดเร็ว", "ตระหนักรู้และเกิดแรงบันดาลใจด้านเทคโนโลยี"],
    owner: "ประชาชนทั่วไป",
    isoRef: "ข้อ 4.2"
  },
  {
    id: "c-4",
    category: "Customer",
    title: "ผู้บริหารอุทยานฯ และสำนักบริหารงานวิจัย มช.",
    unit: "all",
    unitLabel: "ผู้บังคับบัญชา",
    details: ["ภาพลักษณ์องค์กร STeP มีความทันสมัย โดดเด่น เป็นสากล", "บรรลุเป้าหมายเชิงยุทธศาสตร์และตัวชี้วัด OKR ประจำปี"],
    owner: "ผศ.ดร.สุริยะ & คณะผู้บริหาร",
    isoRef: "ข้อ 9.3"
  }
];

const VENDOR_EVALUATION_DATA: VendorEvaluationItem[] = [
  {
    id: "v-1",
    vendorName: "บริษัท เชียงใหม่ ดิจิตอล พรินติ้ง จำกัด",
    serviceCategory: "งานพิมพ์คุณภาพสูงและป้ายนิทรรศการ",
    unitInCharge: "ยูนิตงานออกแบบ",
    qualityScore: 38,
    timelinessScore: 29,
    pricingScore: 14,
    coordinationScore: 15,
    totalScore: 96,
    grade: "A (ดีเลิศ)",
    status: "อนุมัติใช้งาน (Approved)",
    lastEvaluated: "15 ก.พ. 2569",
    remarks: "พิมพ์สีตรงตามมาตรฐาน Pantone CI ของอุทยานฯ ส่งงานรวดเร็วแม้มีงานด่วน"
  },
  {
    id: "v-2",
    vendorName: "สตูดิโอ มีเดีย ซีเอ็ม โปรดักชั่น",
    serviceCategory: "เช่าอุปกรณ์สตูดิโอ ไฟถ่ายทำ และช่างภาพอีเวนต์",
    unitInCharge: "ยูนิตผลิตสื่อสร้างสรรค์",
    qualityScore: 37,
    timelinessScore: 28,
    pricingScore: 13,
    coordinationScore: 14,
    totalScore: 92,
    grade: "A (ดีเลิศ)",
    status: "อนุมัติใช้งาน (Approved)",
    lastEvaluated: "10 ม.ค. 2569",
    remarks: "ทีมงานชำนาญการ ถ่ายทอดสดสัญญาณเสถียร ภาพคมชัดระดับ 4K"
  },
  {
    id: "v-3",
    vendorName: "ห้างหุ้นส่วนจำกัด นอร์ทเธิร์น พรีเมียม กิฟต์",
    serviceCategory: "ผลิตของที่ระลึก ของพรีเมียม และเสื้อกิจกรรม",
    unitInCharge: "ยูนิตสื่อสารองค์กร",
    qualityScore: 35,
    timelinessScore: 27,
    pricingScore: 14,
    coordinationScore: 13,
    totalScore: 89,
    grade: "B (ได้มาตรฐาน)",
    status: "อนุมัติใช้งาน (Approved)",
    lastEvaluated: "05 มี.ค. 2569",
    remarks: "งานสกรีนคมชัด บางครั้งใช้เวลาผลิตใกล้เส้นตายแต่ยังส่งตรงเวลา"
  },
  {
    id: "v-4",
    vendorName: "คลาวด์ ฟอนต์ & มิวสิก ไลเซนส์ โซลูชั่นส์",
    serviceCategory: "ลิขสิทธิ์เพลงประกอบและชุดแบบอักษรภาษาไทย",
    unitInCharge: "ยูนิตงานออกแบบ / ผลิตสื่อ",
    qualityScore: 40,
    timelinessScore: 30,
    pricingScore: 15,
    coordinationScore: 14,
    totalScore: 99,
    grade: "A (ดีเลิศ)",
    status: "อนุมัติใช้งาน (Approved)",
    lastEvaluated: "20 ม.ค. 2569",
    remarks: "มีใบรับรองสิทธิการใช้งานเชิงพาณิชย์ถูกต้อง 100% ปลอดภัยต่อการถูกฟ้องร้อง"
  }
];

export default function IsoSipocView() {
  const [selectedUnit, setSelectedUnit] = useState<"all" | "design" | "pr" | "content">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered SIPOC Items
  const filteredSipoc = useMemo(() => {
    return SIPOC_DATA.filter((item) => {
      const matchUnit = selectedUnit === "all" || item.unit === "all" || item.unit === selectedUnit;
      const matchQuery =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchUnit && matchQuery;
    });
  }, [selectedUnit, searchQuery]);

  // Group by SIPOC Stage
  const suppliers = filteredSipoc.filter((x) => x.category === "Supplier");
  const inputs = filteredSipoc.filter((x) => x.category === "Input");
  const processes = filteredSipoc.filter((x) => x.category === "Process");
  const outputs = filteredSipoc.filter((x) => x.category === "Output");
  const customers = filteredSipoc.filter((x) => x.category === "Customer");

  // Export to Excel / CSV
  const handleExportExcel = () => {
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "รายงานแผนผังกระบวนการ SIPOC และการควบคุมผู้ส่งมอบภายนอก (ISO 9001:2015 ข้อ 4.4, 8.1, 8.4)\n";
    csv += `หน่วยงาน: ทีมสร้างสรรค์และการสื่อสาร (CC TEAM) อุทยานวิทยาศาสตร์ฯ มช.\n`;
    csv += `วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}\n\n`;

    csv += "=== ส่วนที่ 1: แผนผังกระบวนการ SIPOC ครบวงจร ===\n";
    csv += "ขั้นตอน SIPOC,รหัส,ชื่อกระบวนการ / รายการ,ยูนิตที่รับผิดชอบ,ผู้รับผิดชอบหลัก,ข้อกำหนด ISO,รายละเอียดการดำเนินงาน\n";

    SIPOC_DATA.forEach((item) => {
      const detailsText = `"${item.details.join(" | ").replace(/"/g, '""')}"`;
      csv += `"${item.category}","${item.id}","${item.title.replace(/"/g, '""')}","${item.unitLabel}","${item.owner}","${item.isoRef}",${detailsText}\n`;
    });

    csv += "\n=== ส่วนที่ 2: ทะเบียนประเมินผู้ส่งมอบภายนอก (Approved Vendor List - AVL) ===\n";
    csv += "ลำดับ,ชื่อผู้ส่งมอบ / คู่ค้า,ประเภทบริการ,ยูนิตผู้กำกับดูแล,คะแนนคุณภาพ (40),คะแนนเวลา (30),คะแนนราคา (15),คะแนนประสานงาน (15),คะแนนรวม (100),ระดับเกรด,สถานะการอนุมัติ,วันที่ประเมินล่าสุด,หมายเหตุการตรวจรับรอง\n";

    VENDOR_EVALUATION_DATA.forEach((v, idx) => {
      csv += `${idx + 1},"${v.vendorName}","${v.serviceCategory}","${v.unitInCharge}",${v.qualityScore},${v.timelinessScore},${v.pricingScore},${v.coordinationScore},${v.totalScore},"${v.grade}","${v.status}","${v.lastEvaluated}","${v.remarks.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `2_SIPOC_และผู้ส่งมอบ_CC_TEAM_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="sec-sipoc-diagram">
      {/* ========================================================================= */}
      {/* 1. HEADER STRIP & EXCEL DOWNLOAD                                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap inline-flex items-center gap-1.5 w-fit">
              <Layers size={13} />
              <span>เอกสารแนบ 2: แผนผังกระบวนการ SIPOC และการประเมินผู้ส่งมอบภายนอก (ISO 4.4, 8.1, 8.4)</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ไฟล์อ้างอิง: <strong className="text-slate-700">QP-CC-02 แผนผังกระบวนการทำงานหลัก 3 ยูนิต</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="ml-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
            title="ดาวน์โหลด Excel แผนผัง SIPOC และตารางประเมินผู้ส่งมอบภายนอก"
          >
            <FileSpreadsheet size={15} />
            <span>ดาวน์โหลด Excel</span>
          </button>
        </div>

        {/* Title and Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={22} />
              <span>ห่วงโซ่คุณค่ากระบวนการผลิตสื่อสร้างสรรค์ (SIPOC Pipeline CC TEAM)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              การวิเคราะห์ปฏิสัมพันธ์ของกระบวนการ (Process Interactions) เชื่อมโยงปัจจัยนำเข้าจากผู้ว่าจ้างสู่ผลผลิตของ 3 ยูนิตหลัก
              พร้อมระบบควบคุมผู้ส่งมอบภายนอก (Outsource Control) ตามมาตรฐาน ISO 9001:2015
            </p>
          </div>

          {/* Unit Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSelectedUnit("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทุกยูนิต (ภาพรวม)
            </button>
            <button
              onClick={() => setSelectedUnit("design")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === "design" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎨 ยูนิตงานออกแบบ
            </button>
            <button
              onClick={() => setSelectedUnit("pr")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === "pr" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📢 ยูนิตสื่อสารองค์กร
            </button>
            <button
              onClick={() => setSelectedUnit("content")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === "content" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎬 ยูนิตผลิตสื่อสร้างสรรค์
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="text-xs font-bold text-blue-700">Suppliers (แหล่งที่มา)</div>
            <div className="text-xl sm:text-2xl font-black text-blue-900 mt-1">{suppliers.length} กลุ่ม</div>
            <div className="text-[11px] text-blue-600/80 mt-0.5">มช. / เอกชน / ภาคีเครือข่าย</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700">Process (วงจรปฏิบัติการ)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">5 ระยะ</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">15 ขั้นตอนตามคู่มือ WI</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="text-xs font-bold text-amber-700">Outputs (ผลลัพธ์ที่ส่งมอบ)</div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{outputs.length} ประเภทสื่อ</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Graphic / Clip / PR News</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="text-xs font-bold text-purple-700">Approved Vendors (AVL)</div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1">{VENDOR_EVALUATION_DATA.length} องค์กร</div>
            <div className="text-[11px] text-purple-600/80 mt-0.5">คะแนนประเมินเฉลี่ย 93.3%</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VISUAL 5-STAGE SIPOC PIPELINE (INTERACTIVE CARDS)                      */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-blue-600 rounded-full" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              แผนภาพขั้นตอนสายธารคุณค่า (SIPOC Stream)
            </h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="ค้นหากระบวนการ, ผู้รับผิดชอบ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* 5 Column SIPOC Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Column S: Suppliers */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-black text-xs">
                S - Suppliers
              </span>
              <span className="text-[11px] font-bold text-slate-500">{suppliers.length} รายการ</span>
            </div>
            <div className="space-y-3">
              {suppliers.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-2 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.unitLabel}
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {item.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{item.owner}</span>
                    <span className="text-blue-600 font-bold">{item.isoRef}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column I: Inputs */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs">
                I - Inputs
              </span>
              <span className="text-[11px] font-bold text-slate-500">{inputs.length} รายการ</span>
            </div>
            <div className="space-y-3">
              {inputs.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-2 hover:border-indigo-300 transition-colors">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {item.unitLabel}
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {item.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{item.owner}</span>
                    <span className="text-indigo-600 font-bold">{item.isoRef}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column P: Process */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs">
                P - Process (5 ระยะ)
              </span>
              <span className="text-[11px] font-bold text-slate-500">{processes.length} ระยะ</span>
            </div>
            <div className="space-y-3">
              {processes.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-2 hover:border-emerald-300 transition-colors relative">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {item.unitLabel}
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {item.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{item.owner}</span>
                    <span className="text-emerald-600 font-bold">{item.isoRef}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column O: Outputs */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono font-black text-xs">
                O - Outputs
              </span>
              <span className="text-[11px] font-bold text-slate-500">{outputs.length} รายการ</span>
            </div>
            <div className="space-y-3">
              {outputs.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-2 hover:border-amber-300 transition-colors">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                    {item.unitLabel}
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {item.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{item.owner}</span>
                    <span className="text-amber-600 font-bold">{item.isoRef}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column C: Customers */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-black text-xs">
                C - Customers
              </span>
              <span className="text-[11px] font-bold text-slate-500">{customers.length} กลุ่ม</span>
            </div>
            <div className="space-y-3">
              {customers.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-2 hover:border-rose-300 transition-colors">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                    {item.unitLabel}
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {item.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{item.owner}</span>
                    <span className="text-rose-600 font-bold">{item.isoRef}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. APPROVED VENDOR LIST (AVL) & OUTSOURCE CONTROL (ISO 8.4)                */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5" id="sec-sipoc-vendor">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="text-blue-600" size={20} />
              <span>ทะเบียนผู้ส่งมอบภายนอกที่ผ่านการประเมิน (Approved Vendor List - AVL)</span>
            </h3>
            <p className="text-xs text-slate-500">
              การควบคุมกระบวนการ ผลิตภัณฑ์ และบริการที่จัดหาจากภายนอก ตามข้อกำหนด ISO 9001:2015 ข้อ 8.4
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full w-fit">
            ✓ ผ่านการประเมินเกณฑ์ 100%
          </span>
        </div>

        {/* Vendor Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5">ผู้ส่งมอบ / คู่ค้า</th>
                <th className="p-3.5">ประเภทงานบริการ</th>
                <th className="p-3.5">ยูนิตกำกับดูแล</th>
                <th className="p-3.5 text-center">คุณภาพ (40)</th>
                <th className="p-3.5 text-center">เวลา (30)</th>
                <th className="p-3.5 text-center">ราคา (15)</th>
                <th className="p-3.5 text-center">บริการ (15)</th>
                <th className="p-3.5 text-center">คะแนนรวม</th>
                <th className="p-3.5 text-center">เกรด / สถานะ</th>
                <th className="p-3.5">หมายเหตุการประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VENDOR_EVALUATION_DATA.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">
                    <div>{v.vendorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ประเมินเมื่อ {v.lastEvaluated}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">{v.serviceCategory}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {v.unitInCharge}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-mono">{v.qualityScore}</td>
                  <td className="p-3.5 text-center font-mono">{v.timelinessScore}</td>
                  <td className="p-3.5 text-center font-mono">{v.pricingScore}</td>
                  <td className="p-3.5 text-center font-mono">{v.coordinationScore}</td>
                  <td className="p-3.5 text-center">
                    <span className="text-sm font-black text-blue-700 font-mono">{v.totalScore}</span>
                    <span className="text-[10px] text-slate-400 block">/ 100</span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {v.grade}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 text-[11px] max-w-xs">{v.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
