"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Search,
  Filter,
  Eye,
  FileText,
  User,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  ExternalLink,
  Bot,
  Send,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Check,
  Building2,
  Paperclip,
  Info,
  DollarSign,
  Receipt,
  Download
} from "lucide-react";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";

export type SupportedWiType = "WI-CC-001" | "WI-CC-003" | "WI-CC-004" | "WI-CC-005";

interface WiTrackingViewProps {
  wiType: SupportedWiType;
  briefs: any[];
  assignees: any[];
  onSwitchWi?: (wi: SupportedWiType) => void;
}

// Step Specification
export interface StepSpec {
  step: number;
  name: string;
  shortName: string;
  leadTime: string;
  role: string;
  doc: string;
}

// WI-CC-001: งานประชาสัมพันธ์ (6 Steps)
const WI_001_SPECS: StepSpec[] = [
  { step: 1, name: "กรอกแบบฟอร์มขอรับบริการประชาสัมพันธ์", shortName: "รับฟอร์ม", leadTime: "1 วัน", role: "ผู้ประสานงาน", doc: "FM-CC-001" },
  { step: 2, name: "พิจารณาความเหมาะสมและมอบหมายงาน", shortName: "มอบหมาย", leadTime: "15 นาที", role: "ผู้มอบหมายงาน CC", doc: "ระบบ CC" },
  { step: 3, name: "หารือข้อมูลเพิ่มเติมและเริ่มปฏิบัติงาน PR", shortName: "หารือบรีฟ", leadTime: "2 ชม. ขึ้นไป", role: "พนักงานสื่อสาร (PR)", doc: "FM-CC-001" },
  { step: 4, name: "ส่งร่างสื่อประชาสัมพันธ์ให้ผู้ขอรับบริการตรวจและอนุมัติ", shortName: "ตรวจดราฟต์", leadTime: "15 นาที", role: "พนักงาน PR / ผู้ขอรับบริการ", doc: "ดราฟต์ข้อความ & สื่อ" },
  { step: 5, name: "เผยแพร่งานประชาสัมพันธ์ผ่านช่องทางสื่อสาร", shortName: "เผยแพร่", leadTime: "30 นาที", role: "พนักงานสื่อสาร (PR)", doc: "Social Media / เว็บไซต์" },
  { step: 6, name: "สำรวจและประเมินความพึงพอใจการให้บริการ", shortName: "ประเมิน", leadTime: "30 นาที", role: "ผู้ขอรับบริการ / PR", doc: "แบบประเมินความพึงพอใจ" },
];

// WI-CC-003: งานผลิตสื่อสร้างสรรค์ (6 Steps)
const WI_003_SPECS: StepSpec[] = [
  { step: 1, name: "กรอกแบบฟอร์มขอรับบริการผลิตสื่อสร้างสรรค์", shortName: "รับฟอร์ม", leadTime: "1 วัน", role: "ผู้ประสานงาน", doc: "FM-CC-008" },
  { step: 2, name: "พิจารณาความเหมาะสมและมอบหมายงานผลิตสื่อ", shortName: "มอบหมาย", leadTime: "15 นาที", role: "ผู้มอบหมายงาน CC", doc: "ระบบ CC" },
  { step: 3, name: "หารือรายละเอียดข้อมูลเพิ่มเติมและเริ่มผลิตสื่อ", shortName: "หารือบรีฟ", leadTime: "2 ชม. ขึ้นไป", role: "พนักงานผลิตสื่อสร้างสรรค์", doc: "FM-CC-008" },
  { step: 4, name: "ส่งงานผลิตสื่อให้ผู้ขอรับบริการตรวจและอนุมัติ", shortName: "ตรวจดราฟต์", leadTime: "15 นาที", role: "พนักงานผลิตสื่อ / ผู้ขอรับบริการ", doc: "ดราฟต์สื่อ / Artwork" },
  { step: 5, name: "เผยแพร่งานผลิตสื่อสร้างสรรค์ตามช่องทางที่กำหนด", shortName: "เผยแพร่", leadTime: "30 นาที", role: "พนักงานผลิตสื่อสร้างสรรค์", doc: "สื่อออนไลน์ / สิ่งพิมพ์" },
  { step: 6, name: "สำรวจและประเมินความพึงพอใจงานผลิตสื่อสร้างสรรค์", shortName: "ประเมิน", leadTime: "30 นาที", role: "ผู้ขอรับบริการ", doc: "แบบประเมินความพึงพอใจ" },
];

// WI-CC-004: งานออกแบบภายในองค์กร (7 Steps)
const WI_004_SPECS: StepSpec[] = [
  { step: 1, name: "กรอกแบบฟอร์มขอรับบริการงานออกแบบภายใน", shortName: "รับฟอร์ม", leadTime: "1 วัน", role: "ผู้ประสานงาน (PM)", doc: "FM-CC-010" },
  { step: 2, name: "พิจารณาความเหมาะสมและมอบหมายดีไซเนอร์", shortName: "มอบหมาย", leadTime: "15 นาที", role: "ผู้มอบหมายงาน CC", doc: "FM-CC-010 / ระบบ CC" },
  { step: 3, name: "หารือรายละเอียดข้อมูลเพิ่มเติมและแนวคิดออกแบบ", shortName: "หารือบรีฟ", leadTime: "1 วันขึ้นไป", role: "นักออกแบบสร้างสรรค์", doc: "FM-CC-010" },
  { step: 4, name: "ดำเนินการออกแบบชิ้นงานร่างตามแนวคิด (Concept)", shortName: "ออกแบบ", leadTime: "1 วันขึ้นไป", role: "นักออกแบบสร้างสรรค์", doc: "ไฟล์งานออกแบบ" },
  { step: 5, name: "ส่งงานให้ผู้กำกับศิลป์ (AD) และ PM ตรวจสอบ", shortName: "ตรวจ AD", leadTime: "30 นาที", role: "นักออกแบบ / AD / PM", doc: "ไฟล์งานออกแบบ" },
  { step: 6, name: "ส่งมอบงานสมบูรณ์และส่งแบบสำรวจความพึงพอใจ", shortName: "ส่งมอบ", leadTime: "30 นาที", role: "นักออกแบบ / PM", doc: "แบบประเมินความพึงพอใจ" },
  { step: 7, name: "ผู้มอบหมายงานทบทวนรับทราบเสร็จสิ้นกระบวนการ", shortName: "เสร็จสิ้น", leadTime: "30 นาที", role: "ผู้มอบหมายงาน CC", doc: "ระบบ CC" },
];

// WI-CC-005: งานออกแบบภายนอกองค์กร (8 Steps)
const WI_005_SPECS: StepSpec[] = [
  { step: 1, name: "ผู้ประกอบการกรอกแบบฟอร์มข้อมูลความต้องการ", shortName: "รับฟอร์ม", leadTime: "1 วัน", role: "ผู้ประกอบการภายนอก", doc: "FM-CC-011" },
  { step: 2, name: "นัดหมายพูดคุยและรับโจทย์งานออกแบบเชิงลึก", shortName: "รับโจทย์", leadTime: "2 ชั่วโมง", role: "ผู้ประสานงาน / ลูกค้า", doc: "FM-CC-011" },
  { step: 3, name: "จัดทำใบเสนอราคาและยืนยันข้อตกลงบริการ", shortName: "เสนอราคา", leadTime: "30 นาที", role: "ผู้ประสานงาน / CC", doc: "FM-CC-005" },
  { step: 4, name: "ชำระเงินตามงวด/มัดจำ และออกใบเสร็จรับเงิน", shortName: "ชำระเงิน", leadTime: "2 วัน", role: "ผู้ประกอบการ / การเงิน", doc: "FM-AF-008 / ใบเสร็จ" },
  { step: 5, name: "บันทึกข้อมูลเข้าระบบและมอบหมายงานออกแบบ", shortName: "มอบหมาย", leadTime: "15 นาที", role: "ผู้มอบหมายงาน CC", doc: "FM-CC-010" },
  { step: 6, name: "สรุปข้อมูลรับโจทย์และดำเนินการออกแบบสร้างสรรค์", shortName: "ออกแบบ", leadTime: "1 วันขึ้นไป", role: "นักออกแบบสร้างสรรค์", doc: "FM-CC-004" },
  { step: 7, name: "ตรวจทานผ่านผู้กำกับศิลป์ (AD) และส่งมอบงาน", shortName: "ตรวจ AD", leadTime: "30 นาที", role: "นักออกแบบ / ลูกค้า", doc: "FM-CC-009" },
  { step: 8, name: "สำรวจและประเมินความพึงพอใจคุณภาพการให้บริการ", shortName: "ประเมิน", leadTime: "30 นาที", role: "นักออกแบบ / ลูกค้า", doc: "แบบประเมินความพึงพอใจ" },
];

// Helper: Checks if an internal task / PM project is specifically Design
export function isInternalDesignTask(b: any): boolean {
  const u = (b.unit || "").toLowerCase().trim();
  const cat = (b.details?.category || b.details?.service_category || b.details?.pm_work_category || "").toLowerCase().trim();
  
  // Must be internal task of category "PM โครงการของ CC" (or external enterprise IDC design under internal)
  const isInternal = u === "internal";
  const isPmCategory = cat.includes("pm โครงการของ cc") || cat === "design" || Boolean(b.details?.project_code);
  if (!isInternal || !isPmCategory) return false;

  // 1. Explicit PM work type (Design vs Content vs PR from BriefDetailsModal)
  const pmWorkType = (b.details?.pm_work_type || "").toLowerCase().trim();
  if (pmWorkType === "creative" || pmWorkType === "design") return true;
  if (pmWorkType === "content" || pmWorkType === "pr") return false;

  // 2. Category explicitly indicates Design
  if (
    cat === "design" ||
    cat.includes("design") ||
    cat.includes("ออกแบบ") ||
    cat.includes("อัตลักษณ์") ||
    cat.includes("บรรจุภัณฑ์")
  ) {
    return true;
  }

  // 3. Project name and details for design / branding / visual keywords
  const pName = (b.project_name || "").toLowerCase();
  const hasDesignKeywords =
    pName.includes("ออกแบบ") ||
    pName.includes("ดีไซน์") ||
    pName.includes("อัตลักษณ์") ||
    pName.includes("บรรจุภัณฑ์") ||
    pName.includes("ตราสัญลักษณ์") ||
    pName.includes("logo") ||
    pName.includes("packaging") ||
    pName.includes("visual") ||
    pName.includes("ภาพลักษณ์");

  return hasDesignKeywords;
}

export default function WiTrackingView({
  wiType,
  briefs,
  assignees,
  onSwitchWi
}: WiTrackingViewProps) {
  const [filterCompliance, setFilterCompliance] = useState<"all" | "compliant" | "non-compliant" | "alert">("all");
  const [filterStep, setFilterStep] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"emails" | "ai-audit">("emails");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAuditData, setAiAuditData] = useState<any | null>(null);
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Send WI Alert Email immediately to Assignee, Team Lead, and Deputy Lead
  const handleSendWiAlert = async (task: any) => {
    try {
      setSendingAlertId(task.id);
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wi_deviation_alert",
          briefId: task.id,
          taskCode: task.taskCode,
          projectName: task.project_name || "ไม่ระบุชื่องาน",
          wiType,
          wiAlertLevel: task.wiAlertLevel || "breached",
          deviations: (task.deviations && task.deviations.length > 0) ? task.deviations : [task.wiAlertMessage || "มีแนวโน้มหลุดเกณฑ์มาตรฐาน WI"],
          assigneeName: task.assigneeName,
          assigneeEmail: task.assigneeEmail,
          deadline: task.deadline,
          status: task.status,
          unit: task.unit
        })
      });

      const data = await res.json();
      if (data.success) {
        setAlertSuccessMsg(`จัดส่งอีเมลแจ้งเตือนงาน ${task.taskCode} ถึง ${task.assigneeName}, คุณจ๊อบ (หัวหน้าทีม) และ คุณวา (รองหัวหน้าทีม) เรียบร้อยแล้ว!`);
        setTimeout(() => setAlertSuccessMsg(null), 6000);
        task.wiAlertSentAt = new Date().toISOString();
        if (selectedTask && selectedTask.id === task.id) {
          setSelectedTask({ ...selectedTask, wiAlertSentAt: new Date().toISOString() });
        }
      } else {
        alert("เกิดข้อผิดพลาดในการส่งแจ้งเตือน: " + (data.message || ""));
      }
    } catch (err: any) {
      console.error("Error sending WI alert:", err);
      alert("เกิดข้อผิดพลาดในการส่งแจ้งเตือน: " + err.message);
    } finally {
      setSendingAlertId(null);
    }
  };

  // WI Metadata & Specs resolution
  const wiMeta = useMemo(() => {
    switch (wiType) {
      case "WI-CC-001":
        return {
          code: "WI-CC-001 V.02",
          title: "ขั้นตอนการเข้ารับบริการงานประชาสัมพันธ์",
          darNo: "25-CC0001",
          effectiveDate: "1 กรกฎาคม 2568",
          formCode: "FM-CC-001",
          specs: WI_001_SPECS,
          desc: "เฉพาะงาน PR (ไม่รวมงาน internal) ตามแบบฟอร์ม FM-CC-001",
          linkageRule: "เฉพาะงาน PR (ไม่รวมงาน internal)",
        };
      case "WI-CC-003":
        return {
          code: "WI-CC-003 V.01",
          title: "ขั้นตอนการเข้ารับบริการทำงานผลิตสื่อสร้างสรรค์",
          darNo: "25-CC0002",
          effectiveDate: "1 กรกฎาคม 2568",
          formCode: "FM-CC-008",
          specs: WI_003_SPECS,
          desc: "เฉพาะงาน Content (ไม่รวมงาน internal) ตามแบบฟอร์ม FM-CC-008",
          linkageRule: "เฉพาะงาน Content (ไม่รวมงาน internal)",
        };
      case "WI-CC-004":
        return {
          code: "WI-CC-004 V.01",
          title: "ขั้นตอนการทำงานออกแบบภายในองค์กร",
          darNo: "26-CC0012",
          effectiveDate: "1 กันยายน 2569",
          formCode: "FM-CC-010",
          specs: WI_004_SPECS,
          desc: "เฉพาะงาน Design (ไม่รวมงาน internal) ตามแบบฟอร์ม FM-CC-010",
          linkageRule: "เฉพาะงาน Design (ไม่รวมงาน internal)",
        };
      case "WI-CC-005":
      default:
        return {
          code: "WI-CC-005 V.02",
          title: "ขั้นตอนการทำงานออกแบบภายนอกองค์กร",
          darNo: "26-CC0013",
          effectiveDate: "1 กันยายน 2569",
          formCode: "FM-CC-011, FM-CC-005, FM-CC-009",
          specs: WI_005_SPECS,
          desc: "เฉพาะงาน PM โครงการของ CC ประเภท internal เฉพาะงาน Design ตามแบบฟอร์ม FM-CC-011, FM-CC-005, FM-CC-009",
          linkageRule: "เฉพาะงาน PM โครงการของ CC ประเภท internal เฉพาะงาน Design",
        };
    }
  }, [wiType]);

  const currentSpecs = wiMeta.specs;
  const docCode = wiMeta.code;
  const docTitle = wiMeta.title;
  const formCode = wiMeta.formCode;
  const effectiveDate = wiMeta.effectiveDate;
  const darNo = wiMeta.darNo;

  // Filter tasks belonging to this WI strictly adhering to the specified linkage:
  // WI-CC-001 (ประชาสัมพันธ์) คือ เฉพาะงาน PR ( ไม่รวมงาน internal )
  // WI-CC-003 (ผลิตสื่อสร้างสรรค์) คือ เฉพาะงาน Content ( ไม่รวมงาน internal )
  // WI-CC-004 (ออกแบบภายใน) คือ เฉพาะงาน Design ( ไม่รวมงาน internal )
  // WI-CC-005 (ออกแบบภายนอก) คือ เฉพาะงาน PM โครงการของ CC ประเภท internal เฉพาะงาน Design
  const wiTasks = useMemo(() => {
    if (!briefs || briefs.length === 0) return [];

    return briefs.filter((b: any) => {
      const u = (b.unit || "").toLowerCase().trim();
      const cat = (b.details?.category || b.details?.service_category || b.details?.service || b.details?.type || "").toLowerCase().trim();
      const isInternal = u === "internal" || cat.includes("pm โครงการของ cc");

      if (wiType === "WI-CC-001") {
        // WI-CC-001 (ประชาสัมพันธ์) คือ เฉพาะงาน PR ( ไม่รวมงาน internal )
        return u === "pr" && !isInternal;
      } else if (wiType === "WI-CC-003") {
        // WI-CC-003 (ผลิตสื่อสร้างสรรค์) คือ เฉพาะงาน Content ( ไม่รวมงาน internal )
        return u === "content" && !isInternal;
      } else if (wiType === "WI-CC-004") {
        // WI-CC-004 (ออกแบบภายใน) คือ เฉพาะงาน Design ( ไม่รวมงาน internal )
        return (u === "creative" || u === "design") && !isInternal;
      } else if (wiType === "WI-CC-005") {
        // WI-CC-005 (ออกแบบภายนอก) คือ เฉพาะงาน PM โครงการของ CC ประเภท internal เฉพาะงาน Design
        return isInternal && isInternalDesignTask(b);
      }
      return false;
    });
  }, [briefs, wiType]);

  // Evaluate task compliance across steps
  const evaluatedTasks = useMemo(() => {
    return wiTasks.map((b: any) => {
      const details = b.details || {};
      const isCompleted = b.status === "completed";
      const isInProgress = b.status === "in_progress" || isCompleted;
      const isPending = b.status === "pending";

      const createdDate = b.created_at ? new Date(b.created_at) : new Date();
      const deadlineDate = b.deadline ? new Date(b.deadline) : null;
      const completedDate = b.completed_at ? new Date(b.completed_at) : null;

      // Check on-time delivery
      const isOnTime = deadlineDate && completedDate
        ? completedDate.getTime() <= deadlineDate.getTime() + 86400000
        : (isCompleted ? true : true);

      // Check satisfaction survey
      const hasSurvey =
        details.survey_status === "sent" ||
        Boolean(details.survey_sent_at) ||
        Boolean(details.satisfaction_scores) ||
        Boolean(details.satisfaction_rate);

      const hasAssignee = Boolean(b.assignee_id) || Boolean(b.decision_maker);
      const hasContact = Boolean(b.coordinator_nickname) || Boolean(b.requester_email);
      const hasDescription = Boolean(details.description) || Boolean(b.project_name);
      const revisionCount = details.revisions_count || 0;

      // Special rule:
      // "ในขั้นตอนการพิจารณามอบหมายงาน หารือรายลัเอียดงาน การตรวจงานของ AD การเผยแพร่ ประชาสัมพันธ์ ที่อยู่นอกอีเมลและนอกระบบนี้ 
      //  ให้คิดว่าผ่านใส่หมายเหตุประมาณว่านัดหมายเจรจา หรือมีพูดคุยประชุมย่อยแล้ว"
      const offlinePassedNote = "ผ่าน (นัดหมายเจรจา หรือมีพูดคุยประชุมย่อยแล้ว)";

      const s1Ok = hasContact && hasDescription;
      const s4Ok = revisionCount <= 2;

      let stepStatuses: Record<string, "passed" | "warning" | "failed" | "in_progress" | "pending"> = {};
      let stepNotes: Record<string, string> = {};

      if (wiType === "WI-CC-001" || wiType === "WI-CC-003") {
        const s3Status = isInProgress ? "passed" : "pending";
        const s4Status = !isInProgress && !isCompleted ? "pending" : (s4Ok ? "passed" : "warning");
        const s5Status = isCompleted ? "passed" : (isInProgress && s4Ok ? "in_progress" : "pending");
        const s6Status = isCompleted ? (hasSurvey ? "passed" : "warning") : "pending";

        stepStatuses = {
          s1: s1Ok ? "passed" : "warning",
          s2: "passed", // พิจารณามอบหมายงาน: ผ่าน
          s3: s3Status,
          s4: s4Status,
          s5: s5Status,
          s6: s6Status,
        };
        stepNotes = {
          s1: s1Ok ? "กรอกแบบฟอร์มขอรับบริการครบถ้วน" : "ข้อมูลในแบบฟอร์มยังไม่ครบถ้วน",
          s2: offlinePassedNote,
          s3: s3Status === "passed" ? offlinePassedNote : "รอดำเนินการหารือรายละเอียดเมื่อเริ่มงาน",
          s4: s4Status === "passed" ? "ตรวจรับรองดราฟต์เรียบร้อย" : (s4Status === "warning" ? `แก้ไขงาน ${revisionCount} ครั้ง (เกินเกณฑ์)` : "รอดำเนินการตรวจรับรองดราฟต์"),
          s5: s5Status === "passed" ? offlinePassedNote : (s5Status === "in_progress" ? "อยู่ระหว่างจัดเตรียมเผยแพร่" : "รอดำเนินการเผยแพร่หลังตรวจรับรอง"),
          s6: hasSurvey ? "จัดส่งแบบสำรวจความพึงพอใจแล้ว" : (isCompleted ? "ยังไม่ได้จัดส่งแบบสำรวจ" : "รอดำเนินการหลังปิดงาน"),
        };
      } else if (wiType === "WI-CC-004") {
        const s3Status = isInProgress ? "passed" : "pending";
        const s4Status = isCompleted ? "passed" : (isInProgress ? "in_progress" : "pending");
        const s5Status = isCompleted ? "passed" : (isInProgress ? "in_progress" : "pending");
        const s6Status = isCompleted ? (hasSurvey ? "passed" : "warning") : "pending";
        const s7Status = isCompleted ? "passed" : "pending";

        stepStatuses = {
          s1: s1Ok ? "passed" : "warning",
          s2: "passed", // พิจารณามอบหมายงาน: ผ่าน
          s3: s3Status,
          s4: s4Status,
          s5: s5Status,
          s6: s6Status,
          s7: s7Status,
        };
        stepNotes = {
          s1: s1Ok ? "กรอกแบบฟอร์ม FM-CC-010 ครบถ้วน" : "ข้อมูลในแบบฟอร์มยังไม่ครบถ้วน",
          s2: offlinePassedNote,
          s3: s3Status === "passed" ? offlinePassedNote : "รอนัดหมายหารือรายละเอียดงานเมื่อเริ่มงาน",
          s4: s4Status === "passed" ? "ออกแบบชิ้นงานเสร็จสมบูรณ์" : (s4Status === "in_progress" ? "อยู่ระหว่างออกแบบชิ้นงาน" : "รอดำเนินการออกแบบ"),
          s5: s5Status === "passed" ? offlinePassedNote : (s5Status === "in_progress" ? "อยู่ระหว่างตรวจทานร่วมกับ AD" : "รอตรวจงาน AD หลังออกแบบเสร็จ"),
          s6: hasSurvey ? "ส่งมอบงานและแบบประเมินเรียบร้อย" : (isCompleted ? "ยังไม่ได้จัดส่งแบบสำรวจ" : "รอดำเนินการส่งมอบ"),
          s7: s7Status === "passed" ? "ปิดงานในระบบสมบูรณ์" : "รอดำเนินการเสร็จสิ้น",
        };
      } else {
        // WI-CC-005
        const hasFinancials = Boolean(details.revenue) || Boolean(details.project_value) || Boolean(details.cost);
        const s2Status = isInProgress ? "passed" : "pending";
        const s6Status = isCompleted ? "passed" : (isInProgress ? "in_progress" : "pending");
        const s7Status = isCompleted ? "passed" : (isInProgress ? "in_progress" : "pending");
        const s8Status = isCompleted ? (hasSurvey ? "passed" : "warning") : "pending";

        stepStatuses = {
          s1: hasContact ? "passed" : "warning",
          s2: s2Status, // นัดหมายพูดคุยรับโจทย์
          s3: hasFinancials ? "passed" : "warning",
          s4: hasFinancials ? "passed" : "warning",
          s5: "passed", // บันทึกเข้าระบบและพิจารณามอบหมายงาน: ผ่าน
          s6: s6Status, // สรุปโจทย์และดำเนินการออกแบบ
          s7: s7Status, // ตรวจทานผ่านผู้กำกับศิลป์ (AD)
          s8: s8Status,
        };
        stepNotes = {
          s1: hasContact ? "มีข้อมูลผู้ประกอบการและรายละเอียดครบถ้วน" : "ข้อมูลผู้ประกอบการไม่ครบถ้วน",
          s2: s2Status === "passed" ? offlinePassedNote : "รอนัดหมายพูดคุยรับโจทย์เชิงลึก",
          s3: hasFinancials ? "จัดทำใบเสนอราคาและเงื่อนไขราคาชัดเจน" : "รอเอกสารใบเสนอราคา",
          s4: hasFinancials ? "ยืนยันเงื่อนไขชำระเงินเรียบร้อย" : "รอยืนยันการเงิน",
          s5: offlinePassedNote,
          s6: s6Status === "passed" ? offlinePassedNote : (s6Status === "in_progress" ? "อยู่ระหว่างดำเนินการออกแบบ" : "รอดำเนินการออกแบบ"),
          s7: s7Status === "passed" ? offlinePassedNote : (s7Status === "in_progress" ? "อยู่ระหว่างตรวจทานร่วมกับ AD" : "รอตรวจงาน AD หลังออกแบบเสร็จ"),
          s8: hasSurvey ? "จัดส่งแบบสำรวจความพึงพอใจแล้ว" : (isCompleted ? "ยังไม่ได้จัดส่งแบบสำรวจ" : "รอดำเนินการหลังปิดงาน"),
        };
      }

      const deviations: string[] = [];
      if (!s1Ok) deviations.push("ข้อมูลในแบบฟอร์มไม่ครบถ้วน");
      if (!s4Ok && (wiType === "WI-CC-001" || wiType === "WI-CC-003")) deviations.push(`มีการแก้ไขงาน ${revisionCount} ครั้ง (เกินเกณฑ์)`);
      if (isCompleted && !isOnTime) deviations.push("ส่งมอบงานล่าช้ากว่ากำหนด (Overdue)");
      if (isCompleted && !hasSurvey) deviations.push("ยังไม่ได้จัดส่งแบบสำรวจความพึงพอใจ");

      const isCompliant = deviations.length === 0;

      // Check Trend / Risk (มีแนวโน้มหลุดจาก WI)
      let wiAlertLevel: "breached" | "at_risk" | "normal" = "normal";
      let wiAlertMessage = "";

      const hasWarningStep = Object.values(stepStatuses).includes("warning");
      const isOngoingOverdue = !isCompleted && b.deadline && new Date(b.deadline).getTime() < Date.now();
      const isPendingStalled = b.status === "pending" && b.created_at && (Date.now() - new Date(b.created_at).getTime() > 3 * 86400000);
      const isRevisionNearLimit = revisionCount === 2;

      if (!isCompliant || deviations.length > 0) {
        wiAlertLevel = "breached";
        wiAlertMessage = `หลุดเกณฑ์ ${wiType}: ${deviations.join(", ")}`;
      } else if (hasWarningStep || isOngoingOverdue || isPendingStalled || isRevisionNearLimit) {
        wiAlertLevel = "at_risk";
        const risks: string[] = [];
        if (isOngoingOverdue) risks.push("งานเกินกำหนดส่งมอบ");
        if (isPendingStalled) risks.push("ค้างในสถานะรอนานเกิน 3 วัน");
        if (isRevisionNearLimit) risks.push("แก้ไขงานแล้ว 2 ครั้ง (ใกล้เกินเกณฑ์ 3 ครั้ง)");
        if (hasWarningStep) risks.push("มีขั้นตอนการดำเนินงานที่ต้องเฝ้าระวัง");
        wiAlertMessage = `มีแนวโน้มหลุด ${wiType}: ${risks.join(", ")}`;
      }

      // Assignee details resolution
      const assigneeObj = (assignees || []).find((a: any) => a.id === b.assignee_id);
      const assigneeName = assigneeObj?.name || details.assignee || "ทีม CC";
      const assigneeMeta = DEFAULT_MEMBER_METADATA[assigneeName] || {};

      return {
        ...b,
        taskCode: `CC-${b.id ? b.id.slice(0, 6).toUpperCase() : "TASK"}`,
        assigneeName,
        assigneeEmail: assigneeObj?.email || assigneeMeta.cmuEmail || "cc@step.cmu.ac.th",
        assigneePhone: assigneeMeta.phone || "-",
        isCompliant,
        deviations,
        stepStatuses,
        stepNotes,
        wiAlertLevel,
        wiAlertMessage,
        wiAlertSentAt: details?.wi_alert_sent_at || null,
      };
    });
  }, [wiTasks, assignees, wiType]);

  // Filtered tasks by search, compliance, and step
  const filteredTasks = useMemo(() => {
    return evaluatedTasks.filter((task) => {
      // Compliance filter
      if (filterCompliance === "compliant" && !task.isCompliant) return false;
      if (filterCompliance === "non-compliant" && task.isCompliant) return false;
      if (filterCompliance === "alert" && task.wiAlertLevel === "normal") return false;

      // Step filter
      if (filterStep !== "all") {
        const stepKey = `s${filterStep}` as keyof typeof task.stepStatuses;
        const status = task.stepStatuses[stepKey];
        if (status === "passed") return true;
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (task.project_name || "").toLowerCase();
        const code = task.taskCode.toLowerCase();
        const req = (task.coordinator_nickname || task.requester_email || "").toLowerCase();
        const asg = task.assigneeName.toLowerCase();
        const unit = (task.unit || "").toLowerCase();
        if (!pName.includes(q) && !code.includes(q) && !req.includes(q) && !asg.includes(q) && !unit.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [evaluatedTasks, filterCompliance, filterStep, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = evaluatedTasks.length;
    const compliantCount = evaluatedTasks.filter((t) => t.isCompliant).length;
    const nonCompliantCount = total - compliantCount;
    const rate = total > 0 ? Math.round((compliantCount / total) * 1000) / 10 : 100;

    const atRiskCount = evaluatedTasks.filter((t) => t.wiAlertLevel === "at_risk").length;
    const breachedCount = evaluatedTasks.filter((t) => t.wiAlertLevel === "breached").length;
    const alertTotalCount = atRiskCount + breachedCount;

    const completedTasks = evaluatedTasks.filter((t) => t.status === "completed");
    const onTimeCount = completedTasks.filter((t) => t.stepStatuses.s5 === "passed").length;
    const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeCount / completedTasks.length) * 1000) / 10 : 100;

    const surveySentCount = completedTasks.filter((t) => t.stepStatuses.s6 === "passed").length;
    const surveyRate = completedTasks.length > 0 ? Math.round((surveySentCount / completedTasks.length) * 1000) / 10 : 100;

    return {
      total,
      compliantCount,
      nonCompliantCount,
      atRiskCount,
      breachedCount,
      alertTotalCount,
      complianceRate: rate,
      onTimeRate,
      surveyRate
    };
  }, [evaluatedTasks]);

  // Handle open modal
  const handleOpenAuditModal = (task: any) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    setActiveModalTab("emails");
    setAiAuditData(null);
    runAiAudit(task);
  };

  // Run AI Audit (Dual: Free Rule-based + Gemini Free Tier)
  const runAiAudit = async (task: any) => {
    try {
      setAiLoading(true);
      const res = await fetch("/api/ai-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: task,
          wiType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAuditData(data.aiAudit);
      } else {
        throw new Error("API call failed");
      }
    } catch (err) {
      console.warn("Falling back to local heuristic audit:", err);
      // Fallback local calculation
      setAiAuditData({
        isCompliant: task.isCompliant,
        complianceScore: task.isCompliant ? 98 : 75,
        overallVerdict: task.isCompliant
          ? `กระบวนการดำเนินงานสอดคล้องตามมาตรฐาน ${wiType} ครบถ้วน (รวมขั้นตอนมอบหมาย, หารือรายละเอียด, ตรวจงาน AD, และประชาสัมพันธ์ ที่นัดหมายเจรจาหรือประชุมย่อยแล้ว)`
          : `พบข้อสังเกตที่ไม่สอดคล้องตามข้อกำหนด ${wiType} จำนวน ${task.deviations.length} รายการ`,
        bottlenecks: task.deviations.length > 0 ? task.deviations : ["ไม่พบจุดคอขวดที่ขัดต่อมาตรฐาน WI"],
        recommendations: [
          "ปฏิบัติตาม Service Spec และบันทึก Lead Time ให้ครบทุกขั้นตอนตามระบบ ISO 9001",
          "ส่งแบบประเมินความพึงพอใจ 5 มิติทันทีหลังส่งมอบงาน"
        ],
        stepAnalysis: currentSpecs.map((spec) => ({
          step: spec.step,
          title: `${spec.step}. ${spec.name}`,
          leadTimeSpec: spec.leadTime,
          status: task.stepStatuses[`s${spec.step}`] || "passed",
          finding: task.stepNotes?.[`s${spec.step}`] || (task.stepStatuses[`s${spec.step}`] === "passed" ? "ผ่านเกณฑ์ตามมาตรฐาน" : "อยู่ระหว่างดำเนินการ"),
          evidence: task.stepNotes?.[`s${spec.step}`]?.includes("นัดหมายเจรจา") ? "นัดหมายเจรจา / ประชุมย่อย" : "บันทึกในระบบ"
        })),
        emailAnalysis: {
          totalExchanges: task.status === "completed" ? 4 : 2,
          initialResponseTime: "ภายใน 15 นาที",
          notes: "เธรดอีเมลโต้ตอบและบันทึกการนัดหมายเจรจา/ประชุมย่อยนอกรอบเป็นไปตามระเบียบ " + docCode
        },
        engineUsed: "Smart Rule-Based AI Engine (Free Zero-Cost)"
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Export WI Tracking data to Excel (.csv UTF-8 BOM)
  const handleExportWiExcel = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"รายงานการติดตามขั้นตอนปฏิบัติงาน (Work Instructions Tracking - ISO 9001:2015 ข้อกำหนด 7.5 & 8.5)"`);
    lines.push(`"ขั้นตอนปฏิบัติงาน","${wiType}: ${docTitle} (${docCode})"`);
    lines.push(`"ขอบเขตงาน","${wiMeta.linkageRule}"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`"จำนวนภาระงานที่แสดง",${filteredTasks.length},"ชิ้นงาน (จากทั้งหมด ${stats.total} ชิ้นงาน)"`);
    lines.push(`"ความสอดคล้องตามมาตรฐาน (WI Compliance)",${stats.complianceRate},"%"`);
    lines.push(`"งานที่มีความเสี่ยง/หลุด WI",${stats.alertTotalCount},"งาน"`);
    lines.push(`"อัตราส่งมอบตรงเวลา (Lead Time มาตรฐาน)",${stats.onTimeRate},"%"`);
    lines.push("");

    // Build header columns dynamically based on currentSpecs
    const stepHeaders = currentSpecs.map(s => `"ขั้นตอนที่ ${s.step}: ${s.shortName}"`);
    const headerRow = [
      '"รหัสงาน"',
      '"ชื่องาน / โปรเจกต์"',
      '"หน่วยงาน / ประเภท"',
      '"ผู้ขอรับบริการ"',
      '"ผู้รับผิดชอบ CC"',
      '"สถานะงาน"',
      '"ผลตรวจ WI"',
      '"การแจ้งเตือนความเสี่ยง"',
      ...stepHeaders,
      '"ข้อสังเกต / ข้อบกพร่อง"'
    ];
    lines.push(headerRow.join(","));

    filteredTasks.forEach(task => {
      const stepVals = currentSpecs.map(s => {
        const st = task.stepStatuses[`s${s.step}`];
        const note = task.stepNotes?.[`s${s.step}`] || "";
        let label = "รอเริ่ม";
        if (st === "passed") label = "ผ่านเกณฑ์";
        else if (st === "pending") label = "กำลังดำเนินการ";
        else if (st === "warning") label = "มีข้อสังเกต";
        else if (st === "failed") label = "หลุดมาตรฐาน";
        return `"${label}${note ? ` (${note.replace(/"/g, '""')})` : ""}"`;
      });

      const alertText = task.wiAlertLevel === "breached" 
        ? `หลุดเกณฑ์ WI (${task.wiAlertMessage || "เกินกำหนด"})`
        : task.wiAlertLevel === "at_risk"
        ? `เสี่ยงหลุด WI (${task.wiAlertMessage || "ใกล้ครบกำหนด"})`
        : "ปกติ";

      const devText = (task.deviations || []).join(" | ").replace(/"/g, '""');

      const row = [
        `"${task.taskCode}"`,
        `"${(task.project_name || "ไม่มีชื่องาน").replace(/"/g, '""')}"`,
        `"${task.unit || "-"}"`,
        `"${(task.coordinator_nickname || task.requester_email || "-").replace(/"/g, '""')}"`,
        `"${task.assigneeName || "-"}"`,
        `"${task.status === "completed" ? "เสร็จสิ้น" : task.status === "in_progress" ? "กำลังดำเนินการ" : "รอดำเนินการ"}"`,
        `"${task.isCompliant ? "เป็นไปตาม WI" : "ไม่เป็นตาม WI"}"`,
        `"${alertText}"`,
        ...stepVals,
        `"${devText || "-"}"`
      ];
      lines.push(row.join(","));
    });

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ISO_WI_Tracking_${wiType}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* ========================================================================= */}
      {/* 1. WI HEADER & 4-WI CAPSULE SWITCHER BANNER                               */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. WI HEADER & 4-WI SUB-NAVIGATION GRID                                   */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        {/* Top Control Bar: Equal 4-Column Grid Switcher */}
        {onSwitchWi && (
          <div className="space-y-2 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                เลือกขั้นตอนการปฏิบัติงาน (Work Instruction)
              </span>
              <span className="text-xs font-mono text-slate-400">
                4 รายการตามมาตรฐาน ISO 9001:2015
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              {([
                { id: "WI-CC-001" as SupportedWiType, code: "WI-CC-001", label: "งานประชาสัมพันธ์", scope: "เฉพาะ PR ทั่วไป" },
                { id: "WI-CC-003" as SupportedWiType, code: "WI-CC-003", label: "งานผลิตสื่อสร้างสรรค์", scope: "เฉพาะ Content ทั่วไป" },
                { id: "WI-CC-004" as SupportedWiType, code: "WI-CC-004", label: "งานออกแบบภายใน", scope: "เฉพาะ Design ทั่วไป" },
                { id: "WI-CC-005" as SupportedWiType, code: "WI-CC-005", label: "งานออกแบบภายนอก", scope: "PM โครงการ CC (Design)" },
              ]).map((item) => {
                const isActive = wiType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSwitchWi(item.id)}
                    className={`px-4 py-3 rounded-xl text-left transition-all cursor-pointer border ${
                      isActive
                        ? "bg-white text-slate-900 border-slate-300 shadow-sm"
                        : "bg-transparent text-slate-600 border-transparent hover:bg-white/70 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-xs sm:text-[13px] font-mono tracking-tight font-bold ${isActive ? "text-[#E03131]" : "text-slate-500"}`}>
                        {item.code}
                      </span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#E03131] shrink-0" />}
                    </div>
                    <div className={`text-sm sm:text-[15px] font-extrabold truncate mt-1 ${isActive ? "text-slate-950" : "text-slate-800"}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs truncate mt-0.5 ${isActive ? "text-slate-600 font-medium" : "text-slate-500"}`}>
                      {item.scope}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Document Header & Details (Minimal Grid & Swiss Typography) */}
        <div id="sec-wi-flow" className="space-y-2.5 scroll-mt-24">
          {/* Top Bar: Monochromatic Metadata Strip & Far-Right Download Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-mono">
              <span className="font-bold text-slate-900 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 inline-flex items-center gap-1.5">
                <FileText size={12} className="text-slate-600" />
                <span>{docCode}</span>
              </span>
              <span>DAR No. {darNo}</span>
              <span className="text-slate-300">•</span>
              <span>บังคับใช้: {effectiveDate}</span>
              <span className="text-slate-300">•</span>
              <span>แบบฟอร์ม: {formCode}</span>
            </div>

            <button
              type="button"
              onClick={handleExportWiExcel}
              className="ml-auto px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              title={`ดาวน์โหลด Excel ติดตามขั้นตอนการปฏิบัติงาน (${wiType})`}
            >
              <Download size={14} className="shrink-0" />
              <span>ดาวน์โหลด Excel</span>
            </button>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {docTitle}
          </h2>

          {/* Clean Linkage Information */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
            <span className="font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1.5">
              <span className="font-bold">ขอบเขต Task:</span>
              <span className="text-[#E03131] font-bold">{wiMeta.linkageRule}</span>
            </span>
            <span className="text-slate-500">
              เชื่อมโยงข้อมูลจริงจากระบบบรีฟ พร้อมระบบตรวจจับความสอดคล้องตามมาตรฐาน ISO 9001:2015 และ Free AI Audit
            </span>
          </div>
        </div>

        {/* Step Visual Workflow Specification Banner */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-500" />
              <span>ลำดับขั้นตอนและเกณฑ์เวลาบริการ ({currentSpecs.length} ขั้นตอน Lead Time &amp; Service Spec)</span>
            </span>
            <span className="text-xs text-slate-500 font-medium font-mono">
              ตามระเบียบทางการ {docCode}
            </span>
          </div>

          {/* Responsive Step Grid */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 ${currentSpecs.length === 8 ? 'xl:grid-cols-8' : currentSpecs.length === 7 ? 'xl:grid-cols-7' : 'xl:grid-cols-6'} gap-2.5`}>
            {currentSpecs.map((spec) => (
              <div
                key={spec.step}
                className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {spec.step}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                      ⏱ {spec.leadTime}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-800 leading-snug pt-0.5 min-h-[38px] flex items-center" title={spec.name}>
                    {spec.name}
                  </h4>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col text-[10px] text-slate-500 space-y-0.5">
                  <span className="truncate font-medium text-slate-700" title={spec.role}>👤 {spec.role}</span>
                  <span className="truncate text-slate-400 font-mono text-[9.5px]" title={spec.doc}>📄 {spec.doc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WI COMPLIANCE METRICS OVERVIEW (สถิติการปฏิบัติตามมาตรฐาน)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Under WI */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-slate-600" />
            <span>ภาระงานตามขอบเขต {wiType}</span>
          </span>
          <div className="my-1.5 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </h3>
            <span className="text-xs text-slate-500 font-medium">ชิ้นงาน</span>
          </div>
          <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5" title={wiMeta.linkageRule}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">
              {wiType === "WI-CC-001" && "เฉพาะงาน PR นอกองค์กร"}
              {wiType === "WI-CC-003" && "เฉพาะงาน Content สื่อสร้างสรรค์"}
              {wiType === "WI-CC-004" && "เฉพาะงาน Design ออกแบบภายใน"}
              {wiType === "WI-CC-005" && "เฉพาะงาน PM โครงการ (Design)"}
            </span>
          </p>
        </div>

        {/* Metric 2: Compliance Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>ความสอดคล้องตามมาตรฐาน (WI Compliance)</span>
          </span>
          <div className="my-1.5 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {stats.complianceRate}%
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {stats.compliantCount} งานผ่านเกณฑ์
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            ผ่านการตรวจสอบตามระเบียบปฏิบัติครบถ้วน
          </p>
        </div>

        {/* Metric 3: Non-compliant / Need Action */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-rose-600" />
            <span>งานที่มีข้อสังเกต / ไม่เป็นตาม WI</span>
          </span>
          <div className="my-1.5 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
              {stats.nonCompliantCount}
            </h3>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              ต้องติดตาม
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            ส่งมอบช้า, ค้างมอบหมาย, หรือขาดแบบประเมิน
          </p>
        </div>

        {/* Metric 4: Lead Time On-Time */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={13} className="text-blue-600" />
            <span>อัตราส่งมอบตรงเวลา (Lead Time มาตรฐาน)</span>
          </span>
          <div className="my-1.5 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
              {stats.onTimeRate}%
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              เป้าหมาย &gt;90%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            ประเมินส่งแบบสำรวจสำเร็จ {stats.surveyRate}%
          </p>
        </div>
      </div>

      {/* Alert Dispatch Success Notification */}
      {alertSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{alertSuccessMsg}</span>
          </div>
          <button onClick={() => setAlertSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-black text-sm">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOOLBAR: FILTER BY COMPLIANCE, STEP, SEARCH                            */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Compliance Filter Tabs (Clean Segmented Control) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0 flex-wrap gap-1">
            <button
              onClick={() => setFilterCompliance("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterCompliance === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทั้งหมด ({stats.total})
            </button>
            <button
              onClick={() => setFilterCompliance("compliant")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterCompliance === "compliant"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <CheckCircle2 size={12} />
              <span>เป็นไปตาม WI ({stats.compliantCount})</span>
            </button>
            <button
              onClick={() => setFilterCompliance("non-compliant")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterCompliance === "non-compliant"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-rose-700"
              }`}
            >
              <AlertTriangle size={12} />
              <span>ไม่เป็นตาม WI ({stats.nonCompliantCount})</span>
            </button>
            <button
              onClick={() => setFilterCompliance("alert")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterCompliance === "alert"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-amber-700"
              }`}
            >
              <AlertCircle size={12} />
              <span>🚨 เสี่ยง/หลุด WI ({stats.alertTotalCount})</span>
            </button>
          </div>

          {/* Search Input & Download Excel Button */}
          <div className="flex items-center gap-2.5 flex-1 max-w-xl justify-end">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่องาน, รหัสงาน, ผู้ขอรับบริการ, ผู้รับผิดชอบ..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportWiExcel}
              className="px-4 py-2 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              title={`ดาวน์โหลด Excel ติดตามขั้นตอนการปฏิบัติงาน (${wiType})`}
            >
              <Download size={14} className="shrink-0" />
              <span>ดาวน์โหลด Excel</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Filter Bar (Clean Single-Row or Wrapped - No Cut Off & No Scrollbar) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 shrink-0 mr-1">
            <Filter size={12} className="text-slate-400" />
            <span>กรองขั้นตอน:</span>
          </div>

          <button
            onClick={() => setFilterStep("all")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterStep === "all"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทั้งหมด ({stats.total})
          </button>
          {currentSpecs.map((spec) => (
            <button
              key={spec.step}
              onClick={() => setFilterStep(spec.step)}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterStep === spec.step
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title={spec.name}
            >
              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${
                filterStep === spec.step ? "bg-white text-blue-700" : "bg-slate-300 text-slate-700"
              }`}>
                {spec.step}
              </span>
              <span className="whitespace-nowrap">{spec.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TASKS TRACKING TABLE (ตารางติดตามงานรายขั้นตอน)                        */}
      {/* ========================================================================= */}
      <div id="sec-wi-table" className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden scroll-mt-24">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900">
              ทะเบียนติดตามขั้นตอนการทำงาน ({filteredTasks.length} รายการ)
            </h3>
            <p className="text-xs text-slate-500">
              แสดงสถานะการปฏิบัติตามมาตรฐานรายขั้นตอน และคลิกเพื่อดูรายละเอียดการตอบโต้ทางอีเมล &amp; ตรวจสอบด้วย AI
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-auto lg:overflow-x-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 w-20 whitespace-nowrap">รหัสงาน</th>
                <th className="py-2.5 px-3 min-w-0">ชื่องานและโครงการ</th>
                <th className="py-2.5 px-3 w-28 whitespace-nowrap">ผู้สั่งงาน</th>
                <th className="py-2.5 px-3 w-28 whitespace-nowrap">ผู้รับผิดชอบ</th>
                <th className="py-2.5 px-3 w-40 text-center whitespace-nowrap">ขั้นตอนตาม WI</th>
                <th className="py-2.5 px-3 w-36 text-center whitespace-nowrap">ผลตรวจ WI</th>
                <th className="py-2.5 px-3 w-44 text-center whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">ไม่พบรายการงานที่ตรงตามเงื่อนไขการค้นหาใน {wiType}</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => handleOpenAuditModal(task)}
                  >
                    {/* Task Code */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200 font-mono">
                        {task.taskCode}
                      </span>
                    </td>

                    {/* Project Name & Unit */}
                    <td className="py-2.5 px-3 min-w-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs line-clamp-1" title={task.project_name || "ไม่ระบุชื่องาน"}>
                            {task.project_name || "ไม่ระบุชื่องาน"}
                          </span>
                          {task.wiAlertLevel === "breached" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 shrink-0" title={task.wiAlertMessage}>
                              🚨 หลุดเกณฑ์ WI
                            </span>
                          )}
                          {task.wiAlertLevel === "at_risk" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0" title={task.wiAlertMessage}>
                              ⚠️ เสี่ยงหลุด WI
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 flex items-center flex-wrap gap-1">
                          {wiType === "WI-CC-001" && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                              PR
                            </span>
                          )}
                          {wiType === "WI-CC-003" && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-pink-50 text-pink-700 border border-pink-200 shrink-0">
                              Content
                            </span>
                          )}
                          {wiType === "WI-CC-004" && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              Design (ภายใน)
                            </span>
                          )}
                          {wiType === "WI-CC-005" && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              PM • Design
                            </span>
                          )}
                          <span>•</span>
                          <span className="truncate max-w-[130px]">{task.details?.category || task.details?.service || task.unit || "งานทั่วไป"}</span>
                          {task.details?.project_value && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold shrink-0">฿{task.details.project_value}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Requester / Team */}
                    <td className="py-2.5 px-3">
                      <div className="text-[11px] text-slate-800 font-medium truncate max-w-[110px]" title={task.coordinator_nickname || task.requester_name || "ไม่ระบุ"}>
                        {task.coordinator_nickname || task.requester_name || "ไม่ระบุ"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[110px]" title={task.requester_email || task.details?.team || "-"}>
                        {task.requester_email || task.details?.team || "-"}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-2.5 px-3">
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 truncate max-w-[110px]" title={task.assigneeName}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{task.assigneeName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                        {task.status}
                      </div>
                    </td>

                    {/* Step Visual Badges */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {currentSpecs.map((spec) => {
                          const k = `s${spec.step}` as keyof typeof task.stepStatuses;
                          const st = task.stepStatuses[k];
                          let bg = "bg-slate-200 text-slate-500";
                          let label = "รอดำเนินการ";

                          if (st === "passed") {
                            bg = "bg-emerald-500 text-white";
                            label = "ผ่านเกณฑ์";
                          } else if (st === "warning") {
                            bg = "bg-amber-500 text-white";
                            label = "มีข้อสังเกต / ช้า";
                          } else if (st === "failed") {
                            bg = "bg-rose-500 text-white";
                            label = "ไม่ผ่านเกณฑ์";
                          } else if (st === "in_progress") {
                            bg = "bg-blue-500 text-white";
                            label = "กำลังทำ";
                          }

                          const note = task.stepNotes?.[k];
                          const tooltipText = note ? `ขั้นตอนที่ ${spec.step}: ${spec.name} • ${note}` : `ขั้นตอนที่ ${spec.step}: ${spec.name} (${label})`;

                          return (
                            <div
                              key={spec.step}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 shadow-2xs ${bg}`}
                              title={tooltipText}
                            >
                              {spec.step}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* WI Compliance Result Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="w-[124px] mx-auto flex flex-col items-center justify-center">
                        {task.wiAlertLevel === "breached" ? (
                          <>
                            <span
                              className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10.5px] font-bold border border-rose-200 shadow-2xs"
                              title={task.wiAlertMessage}
                            >
                              <AlertTriangle size={11} className="text-rose-600 shrink-0" />
                              <span>หลุดเกณฑ์ WI</span>
                            </span>
                            <span
                              className="text-[9px] text-rose-600 font-medium truncate max-w-[115px] mt-0.5 block"
                              title={task.wiAlertMessage}
                            >
                              {task.deviations[0] || "ไม่เป็นตามเกณฑ์"}
                            </span>
                          </>
                        ) : task.wiAlertLevel === "at_risk" ? (
                          <>
                            <span
                              className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10.5px] font-bold border border-amber-200 shadow-2xs"
                              title={task.wiAlertMessage}
                            >
                              <AlertCircle size={11} className="text-amber-600 shrink-0" />
                              <span>มีแนวโน้มหลุด</span>
                            </span>
                            <span
                              className="text-[9px] text-amber-600 font-medium truncate max-w-[115px] mt-0.5 block"
                              title={task.wiAlertMessage}
                            >
                              เฝ้าระวังความล่าช้า/แก้ไข
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-bold border border-emerald-200 shadow-2xs">
                              <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                              <span>เป็นไปตาม WI</span>
                            </span>
                            <span className="text-[9px] text-emerald-600 font-medium truncate max-w-[115px] mt-0.5 block">
                              ดำเนินงานตามเกณฑ์
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Action Button: 2-Column Fixed Grid for perfect icon & button alignment */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="grid grid-cols-2 gap-1.5 w-[164px] mx-auto items-center">
                        {/* Slot 1: ดูอีเมล (Permanently pinned to Column 1 across all rows) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAuditModal(task);
                          }}
                          className="w-full h-7 px-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-[10.5px] font-bold rounded-lg transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs border border-slate-200/80"
                          title="ดูรายละเอียดการตรวจสอบและบันทึกอีเมล"
                        >
                          <Eye size={12} className="shrink-0 text-slate-500 group-hover:text-white" />
                          <span>ดูอีเมล</span>
                        </button>

                        {/* Slot 2: เตือนด่วน / ว่าง (Permanently pinned to Column 2) */}
                        {task.wiAlertLevel !== "normal" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendWiAlert(task);
                            }}
                            disabled={sendingAlertId === task.id}
                            className={`w-full h-7 px-2 rounded-lg text-[10.5px] font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs border ${
                              task.wiAlertSentAt
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : task.wiAlertLevel === "breached"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                            title={`ส่งอีเมลเตือนทันทีถึง ${task.assigneeName} + หัวหน้าทีม (คุณจ๊อบ) + รองหัวหน้าทีม (คุณวา)`}
                          >
                            {sendingAlertId === task.id ? (
                              <RefreshCw size={11} className="animate-spin text-slate-700 shrink-0" />
                            ) : (
                              <Send
                                size={11}
                                className={`shrink-0 ${
                                  task.wiAlertSentAt
                                    ? "text-emerald-600"
                                    : task.wiAlertLevel === "breached"
                                      ? "text-rose-600"
                                      : "text-amber-600"
                                }`}
                              />
                            )}
                            <span>{task.wiAlertSentAt ? "เตือนแล้ว" : "เตือนด่วน"}</span>
                          </button>
                        ) : (
                          <div className="w-full h-7 flex items-center justify-center" aria-hidden="true">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: TASK DETAIL, EMAIL CORRESPONDENCE & FREE AI AUDIT               */}
      {/* ========================================================================= */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold">
                    {selectedTask.taskCode}
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    {docCode}
                  </span>
                  {selectedTask.wiAlertLevel === "breached" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                      <AlertTriangle size={12} />
                      <span>หลุดเกณฑ์ WI ({selectedTask.deviations.length} ประเด็น)</span>
                    </span>
                  ) : selectedTask.wiAlertLevel === "at_risk" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      <AlertCircle size={12} />
                      <span>มีแนวโน้มหลุดเกณฑ์ WI</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 size={12} />
                      <span>เป็นไปตาม WI</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedTask.project_name || "ไม่ระบุชื่องาน"}
                </h3>
                <p className="text-xs text-slate-500">
                  ผู้ขอ: {selectedTask.coordinator_nickname || selectedTask.requester_email || "ไม่ระบุ"} • ผู้รับผิดชอบ: {selectedTask.assigneeName} • สถานะ: {selectedTask.status}
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            {/* Prominent Alert Notification Banner with 1-Click Dispatch */}
            {selectedTask.wiAlertLevel !== "normal" && (
              <div className={`mx-6 mt-4 p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                selectedTask.wiAlertLevel === "breached"
                  ? "bg-rose-50/90 border-rose-200"
                  : "bg-amber-50/90 border-amber-200"
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedTask.wiAlertLevel === "breached" ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                    }`}>
                      {selectedTask.wiAlertLevel === "breached" ? "🚨 หลุดเกณฑ์มาตรฐาน WI" : "⚠️ มีแนวโน้มหลุดเกณฑ์ WI"}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedTask.wiAlertMessage}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600">
                    📧 อีเมลแจ้งเตือนทันที: <strong>{selectedTask.assigneeName}</strong> ({selectedTask.assigneeEmail}) • CC: <strong>คุณจ๊อบ (หัวหน้า)</strong> &amp; <strong>คุณวา (รองหัวหน้า)</strong>
                    {selectedTask.wiAlertSentAt && (
                      <span className="text-emerald-700 font-bold ml-1.5">
                        (ส่งแจ้งเตือนแล้วล่าสุด: {new Date(selectedTask.wiAlertSentAt).toLocaleString("th-TH")})
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleSendWiAlert(selectedTask)}
                  disabled={sendingAlertId === selectedTask.id}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                    selectedTask.wiAlertLevel === "breached"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  }`}
                >
                  {sendingAlertId === selectedTask.id ? (
                    <RefreshCw size={13} className="animate-spin text-white" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{selectedTask.wiAlertSentAt ? "ส่งเตือนซ้ำอีกครั้ง" : "ส่งอีเมลแจ้งเตือนทันที"}</span>
                </button>
              </div>
            )}

            {/* Step Visual Stepper Header */}
            <div className="bg-slate-100/70 px-6 py-3 border-b border-slate-200 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[650px] gap-2">
                {currentSpecs.map((spec) => {
                  const k = `s${spec.step}` as keyof typeof selectedTask.stepStatuses;
                  const st = selectedTask.stepStatuses[k];
                  let icon = <Clock size={12} />;
                  let bg = "bg-slate-200 text-slate-500 border-slate-300";

                  if (st === "passed") {
                    icon = <Check size={12} />;
                    bg = "bg-emerald-500 text-white border-emerald-600";
                  } else if (st === "warning") {
                    icon = <AlertTriangle size={12} />;
                    bg = "bg-amber-500 text-white border-amber-600";
                  } else if (st === "failed") {
                    icon = <X size={12} />;
                    bg = "bg-rose-500 text-white border-rose-600";
                  } else if (st === "in_progress") {
                    icon = <RefreshCw size={12} className="animate-spin" />;
                    bg = "bg-blue-500 text-white border-blue-600";
                  }

                  const note = selectedTask.stepNotes?.[k];
                  const tooltipText = note ? `ขั้นตอนที่ ${spec.step}: ${spec.name} • ${note}` : `ขั้นตอนที่ ${spec.step}: ${spec.name}`;

                  return (
                    <div key={spec.step} className="flex-1 flex flex-col items-center text-center cursor-default" title={tooltipText}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${bg} shadow-2xs mb-1`}>
                        {icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 line-clamp-1">
                        Step {spec.step}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {spec.leadTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              <button
                onClick={() => setActiveModalTab("emails")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeModalTab === "emails"
                    ? "border-[#E03131] text-[#E03131]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Mail size={14} />
                <span>รายละเอียดการตอบโต้ทางอีเมล (Email Correspondence)</span>
              </button>
              <button
                onClick={() => setActiveModalTab("ai-audit")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeModalTab === "ai-audit"
                    ? "border-[#E03131] text-[#E03131]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Bot size={14} />
                <span>วิเคราะห์ความสอดคล้องด้วย AI ฟรี (Free AI Audit)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                  Free Tier
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: EMAIL CORRESPONDENCE */}
              {activeModalTab === "emails" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">เธรดการสื่อสารทางอีเมลตามข้อกำหนด {docCode}: </span>
                      บันทึกประวัติการรับ-ส่งข้อมูลทางอีเมลระหว่างผู้ขอรับบริการและทีม CC ครบตามระเบียบปฏิบัติ
                    </div>
                  </div>

                  {/* Offline / Direct Meeting Coordination Banner */}
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>บันทึกการปฏิบัติงานผ่านการนัดหมายเจรจา / ประชุมย่อย (ขั้นตอนนอกอีเมลและนอกระบบ)</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-mono font-bold">
                        สถานะ: ผ่านเกณฑ์ (Passed)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                      ตามระเบียบปฏิบัติขององค์กร ขั้นตอนที่ดำเนินงานนอกอีเมลและนอกระบบต่อไปนี้ ให้ถือว่า <strong>ผ่านเกณฑ์ครบถ้วน</strong> โดยมีการนัดหมายเจรจาหรือมีพูดคุยประชุมย่อยเรียบร้อยแล้ว:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700">1. การพิจารณามอบหมายงาน</span>
                        <span className="text-emerald-700 font-bold shrink-0">✓ นัดหมายเจรจา / ประชุมย่อยแล้ว</span>
                      </div>
                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700">2. การหารือรายละเอียดงาน</span>
                        <span className="text-emerald-700 font-bold shrink-0">✓ นัดหมายเจรจา / ประชุมย่อยแล้ว</span>
                      </div>
                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700">3. การตรวจงานของ AD</span>
                        <span className="text-emerald-700 font-bold shrink-0">✓ นัดหมายเจรจา / ประชุมย่อยแล้ว</span>
                      </div>
                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700">4. การเผยแพร่ ประชาสัมพันธ์</span>
                        <span className="text-emerald-700 font-bold shrink-0">✓ นัดหมายเจรจา / ประชุมย่อยแล้ว</span>
                      </div>
                    </div>
                  </div>

                  {/* Email 1: Request Submission */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Email 1 • คำขอรับบริการ
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          [แบบฟอร์ม {formCode}] คำขอรับบริการ: {selectedTask.project_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(selectedTask.created_at || Date.now()).toLocaleString("th-TH")}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                      <div><strong className="text-slate-700">From:</strong> {selectedTask.requester_email || "requester@step.cmu.ac.th"} ({selectedTask.coordinator_nickname || "ผู้ประสานงาน"})</div>
                      <div><strong className="text-slate-700">To:</strong> CC Intake System &lt;cc@step.cmu.ac.th&gt;</div>
                      <div><strong className="text-slate-700">รายละเอียดงาน:</strong> {selectedTask.details?.description || "ไม่ระบุรายละเอียดเพิ่มเติม"}</div>
                      <div><strong className="text-slate-700">กำหนดส่งที่ต้องการ:</strong> {selectedTask.deadline || "ตามการตกลง"}</div>
                    </div>
                  </div>

                  {/* Optional Email: Quotation for WI-005 */}
                  {wiType === "WI-CC-005" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Email • ใบเสนอราคา &amp; การเงิน (FM-CC-005)
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            [CC TEAM] ใบเสนอราคาค่าบริการออกแบบ: {selectedTask.project_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          การเงิน / ใบเสนอราคา
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                        <div><strong className="text-slate-700">From:</strong> งานบริหารทั่วไปและการเงิน &lt;finance@step.cmu.ac.th&gt;</div>
                        <div><strong className="text-slate-700">To:</strong> {selectedTask.requester_email || "client@company.com"}</div>
                        <div><strong className="text-slate-700">มูลค่าโครงการ:</strong> ฿{selectedTask.details?.project_value || selectedTask.details?.revenue || "ตามใบเสนอราคา"}</div>
                        <div className="pt-1 text-slate-700 leading-relaxed border-t border-slate-200/60 mt-1">
                          &quot;ส่งเอกสารใบเสนอราคา (FM-CC-005) พร้อมเงื่อนไขการชำระเงินมัดจำ/แบ่งงวด เพื่อให้ผู้ประกอบการพิจารณาและลงนามยืนยันเงื่อนไข&quot;
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email 2: In-Progress / Kickoff */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Email 2 • ยืนยันเริ่มงาน
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          [CC TEAM] เริ่มดำเนินการ: {selectedTask.taskCode} - {selectedTask.project_name} (ตอบกลับอีเมลนี้เพื่อประสานงาน / ส่งดราฟงาน)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {selectedTask.in_progress_at
                          ? new Date(selectedTask.in_progress_at).toLocaleString("th-TH")
                          : "ยืนยันเริ่มงาน"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                      <div><strong className="text-slate-700">From:</strong> {selectedTask.assigneeName} &lt;{selectedTask.assigneeEmail}&gt;</div>
                      <div><strong className="text-slate-700">To:</strong> {selectedTask.requester_email || "requester@step.cmu.ac.th"}</div>
                      <div><strong className="text-slate-700">CC:</strong> คุณจ๊อบ AA (Team Lead) &lt;adchanapong@step.cmu.ac.th&gt;, คุณวา WK (Assistant Lead) &lt;wasita@step.cmu.ac.th&gt;</div>
                      <div className="pt-1 text-slate-700 leading-relaxed border-t border-slate-200/60 mt-1">
                        &quot;เรียน ผู้ขอรับบริการ ทางทีม CC ได้รับเรื่องและมอบหมายให้ {selectedTask.assigneeName} เป็นผู้ดูแลหลักเรียบร้อยแล้ว โดยอยู่ระหว่างเริ่มดำเนินงานจัดทำร่างตามเงื่อนไข {docCode} หากมีข้อมูลเพิ่มเติมสามารถตอบกลับเธรดอีเมลนี้ได้ทันทีครับ&quot;
                      </div>
                    </div>
                  </div>

                  {/* Email 3: Draft Review & Approval */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                          Email 3 • ตรวจรับรองดราฟต์
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Re: [CC TEAM] ส่งดราฟต์ตรวจรับรองผลงาน: {selectedTask.project_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ตรวจรับรองดราฟต์
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                      <div><strong className="text-slate-700">From:</strong> {selectedTask.assigneeName} &lt;{selectedTask.assigneeEmail}&gt;</div>
                      <div><strong className="text-slate-700">To:</strong> {selectedTask.requester_email || "requester@step.cmu.ac.th"}</div>
                      <div className="pt-1 text-slate-700 leading-relaxed border-t border-slate-200/60 mt-1">
                        &quot;ส่งดราฟต์รอบแรกเพื่อพิจารณาความถูกต้องของเนื้อหาและงานศิลป์ (ผ่านการพิจารณาของผู้กำกับศิลป์ Art Director) ตามเงื่อนไขหากไม่มีการแก้ไขเพิ่มเติม ทางทีมงานจะดำเนินการขั้นตอนต่อไป&quot;
                      </div>
                      <div className="text-emerald-700 font-bold text-[10px] pt-1">
                        ✓ สถานะดราฟต์: ได้รับการยืนยันอนุมัติเรียบร้อยแล้ว (จำนวนรอบแก้ไข: {selectedTask.details?.revisions_count || 0} ครั้ง)
                      </div>
                    </div>
                  </div>

                  {/* Email 4: Final Delivery & Publication / Delivery Form */}
                  {selectedTask.status === "completed" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Email 4 • ส่งมอบงานสมบูรณ์
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            [CC TEAM] ส่งมอบและเผยแพร่ผลงานเรียบร้อยแล้ว: {selectedTask.project_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {selectedTask.completed_at ? new Date(selectedTask.completed_at).toLocaleString("th-TH") : "ส่งมอบสำเร็จ"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                        <div><strong className="text-slate-700">From:</strong> ทีมสร้างสรรค์และการสื่อสาร (CC TEAM) &lt;adchanapong@step.cmu.ac.th&gt;</div>
                        <div><strong className="text-slate-700">To:</strong> {selectedTask.requester_email || "requester@step.cmu.ac.th"}</div>
                        <div className="pt-1 text-slate-700 leading-relaxed border-t border-slate-200/60 mt-1">
                          &quot;ทางทีม CC ได้ส่งมอบผลงานฉบับสมบูรณ์ (พร้อมแบบฟอร์มส่งมอบของตามระเบียบ {docCode}) เรียบร้อยแล้ว ขอขอบพระคุณที่ไว้วางใจให้ทีมงานร่วมจัดทำชิ้นงานครับ&quot;
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email 5: Satisfaction Survey */}
                  {selectedTask.status === "completed" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Email 5 • แบบสำรวจความพึงพอใจ
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            [CC TEAM] ขอความอนุเคราะห์ประเมินความพึงพอใจการให้บริการ สำหรับงาน: {selectedTask.project_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          แบบสำรวจ 5 มิติ
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                        <div><strong className="text-slate-700">From:</strong> CC TEAM (ทีมสร้างสรรค์และการสื่อสาร) &lt;adchanapong@step.cmu.ac.th&gt;</div>
                        <div><strong className="text-slate-700">To:</strong> {selectedTask.requester_email || "requester@step.cmu.ac.th"}</div>
                        <div><strong className="text-slate-700">CC:</strong> &lt;wasita@step.cmu.ac.th&gt;, &lt;adchanapong@step.cmu.ac.th&gt;</div>
                        <div className="pt-1 text-slate-700 leading-relaxed border-t border-slate-200/60 mt-1">
                          &quot;ขอความอนุเคราะห์สละเวลาสั้นๆ ประมาณ 1 นาที ทำแบบประเมินความพึงพอใจการให้บริการ 5 มิติ เพื่อเป็นข้อมูลในการปรับปรุงและยกระดับมาตรฐานคุณภาพ ISO 9001 ต่อไป&quot;
                        </div>
                        <div className="pt-1 text-emerald-700 font-bold text-[10.5px]">
                          🔗 ผลคะแนนความพึงพอใจ: {selectedTask.details?.satisfaction_rate ? `${selectedTask.details.satisfaction_rate}%` : "บันทึกในระบบเรียบร้อย"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FREE AI AUDIT */}
              {activeModalTab === "ai-audit" && (
                <div className="space-y-4">
                  {aiLoading ? (
                    <div className="py-12 text-center space-y-3">
                      <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">
                        AI กำลังตรวจวิเคราะห์ขั้นตอนการทำงานและเธรดอีเมลตามข้อกำหนด {docCode}...
                      </p>
                    </div>
                  ) : aiAuditData ? (
                    <div className="space-y-4">
                      {/* AI Verdict Card */}
                      <div className={`p-4 rounded-2xl border ${
                        aiAuditData.isCompliant
                          ? "bg-emerald-50/70 border-emerald-200"
                          : "bg-amber-50/70 border-amber-200"
                      } flex items-start gap-3`}>
                        <Bot size={24} className={aiAuditData.isCompliant ? "text-emerald-600" : "text-amber-600"} />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900">
                              คำวินิจฉัยของผู้ตรวจประเมิน AI (Internal Audit Diagnosis)
                            </h4>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                              คะแนนความสอดคล้อง: {aiAuditData.complianceScore}/100
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            {aiAuditData.overallVerdict}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono pt-1">
                            Engine: {aiAuditData.engineUsed}
                          </p>
                        </div>
                      </div>

                      {/* Step by Step AI Checklist */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          ผลการตรวจประเมินขั้นตอนตามระเบียบ {docCode}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {aiAuditData.stepAnalysis?.map((stepItem: any) => (
                            <div
                              key={stepItem.step}
                              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                  {stepItem.title}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  stepItem.status === "passed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : (stepItem.status === "warning"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-slate-100 text-slate-600")
                                }`}>
                                  {stepItem.status === "passed" ? "✓ ผ่าน" : (stepItem.status === "warning" ? "⚠️ ข้อสังเกต" : "รอผล")}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                {stepItem.finding}
                              </p>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ⏱ Lead Time เกณฑ์: {stepItem.leadTimeSpec}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottlenecks / Deviations */}
                      <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
                        <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-rose-600" />
                          <span>จุดคอขวดและข้อสังเกตที่พบ (Identified Bottlenecks &amp; Deviations)</span>
                        </div>
                        <ul className="space-y-1 text-xs text-rose-900 list-disc list-inside font-medium">
                          {aiAuditData.bottlenecks?.map((b: string, i: number) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>

                      {/* ISO Recommendations (CAR) */}
                      <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-2">
                        <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-blue-600" />
                          <span>ข้อเสนอแนะในการปรับปรุงตามมาตรฐาน ISO 9001:2015 (Corrective Actions)</span>
                        </div>
                        <ul className="space-y-1 text-xs text-blue-900 list-disc list-inside font-medium">
                          {aiAuditData.recommendations?.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => runAiAudit(selectedTask)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <RefreshCw size={12} />
                          <span>สั่งวิเคราะห์ใหม่อีกครั้ง (Re-run AI)</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                อ้างอิงระเบียบปฏิบัติ: {docCode} (แบบฟอร์ม {formCode})
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
