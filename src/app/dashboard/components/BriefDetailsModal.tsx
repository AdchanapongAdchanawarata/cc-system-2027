"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import CustomSelect from "./CustomSelect";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  X, Download, Calendar, User, Users, Mail, Phone, Tag, Clock, 
  CheckCircle2, XCircle, MoreHorizontal, FileText, BarChart, Flame, 
  DollarSign, Briefcase, TrendingUp, Palette, Layers, Flag, ListChecks, 
  Ban, AlertCircle, Paperclip, Plus, Trash2, LifeBuoy, MapPin, Camera, 
  Check, Sparkles, PiggyBank, Star, MessageSquare, Minus, Building2,
  Landmark, Network, Globe, Link2, Copy, Loader2
} from "lucide-react";
import { getStandardPriceForTask } from "@/utils/pricing";
import SatisfactionSurveyModal from "./SatisfactionSurveyModal";
import { SatisfactionScores } from "@/utils/okrSettings";
import { OFFICIAL_STEP_TEAMS } from "@/utils/teamAnalytics";
import { exportBriefToPdf } from "@/utils/briefPdfExport";
import { getTaskSurveyUrl } from "@/utils/surveyTokens";
import InProgressEmailModal from "./InProgressEmailModal";
import CompletedEmailModal from "./CompletedEmailModal";
import { downloadFileWithSaveDialog } from "@/utils/fileDownloader";
import { createClient } from "@/utils/supabase/client";

const ALL_CATEGORIES_BY_UNIT: Record<string, { name: string; desc: string }[]> = {
  creative: [
    { name: "Logo Design", desc: "ออกแบบตราสัญลักษณ์แบรนด์ พร้อมกำหนดสีและฟอนต์หลัก" },
    { name: "Key Visual (KV)", desc: "ออกแบบภาพสื่อสารหลัก (Mood & Tone) เพื่อใช้เป็นต้นแบบในการทำสื่ออื่นๆ ในแคมเปญ" },
    { name: "Print Poster / Flyer", desc: "ออกแบบใบปลิวหรือโปสเตอร์ 1 หน้า" },
    { name: "Brochure / Leaflet", desc: "ออกแบบแผ่นพับ 2-3 พับ (4-6 หน้า) จัดวางเนื้อหาและรูปภาพ" },
    { name: "Backdrop (ฉากหลัง)", desc: "ออกแบบภาพกราฟิกขนาดใหญ่สำหรับฉากหลังถ่ายรูปในอีเวนต์" },
    { name: "Book Layout (≤10 หน้า)", desc: "วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนไม่เกิน 10 หน้า" },
    { name: "Book Layout (≥10 หน้า)", desc: "วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนมากกว่า 10 หน้า" },
    { name: "Packaging (ครบวงจร)", desc: "ออกแบบโครงสร้างกล่อง/บรรจุภัณฑ์เชิงซ้อน พร้อมกราฟิกทุกด้าน" },
    { name: "Website Full Design", desc: "ออกแบบหน้าตาเว็บไซต์ (UI/UX) ทุกหน้า (ไม่รวมการเขียนโปรแกรม)" },
    { name: "Exhibition Design (Small)", desc: "ออกแบบบูธหรือนิทรรศการขนาดเล็ก (พื้นที่ ≥10 ตร.ม.)" },
    { name: "3D Render Visualization", desc: "ปั้นโมเดลและเรนเดอร์ภาพเสมือนจริง 3 มิติ (ราคาต่อภาพ)" },
    { name: "Signage Design (Small/Big)", desc: "ออกแบบป้ายบอกทางหรือป้ายโฆษณา (ขนาดเล็ก/ขนาดใหญ่)" },
    { name: "ถ่ายภาพผลิตภัณฑ์ (Product Photography)", desc: "ถ่ายภาพสินค้าในสตูดิโอ จัดแสง จัดองค์ประกอบ (Styling) และรีทัชภาพเพื่อใช้ในสื่อโฆษณา" },
    { name: "ถ่ายภาพบุคคล (Portrait Photography)", desc: "ถ่ายภาพผู้บริหารหรือพนักงานในสตูดิโอ เพื่อใช้ในงาน PR หรือ Profile องค์กร พร้อมบริการรีทัชผิวและแสง" },
    { name: "Product Design", desc: "ออกแบบผลิตภัณฑ์เชิงสร้างสรรค์" },
    { name: "อื่นๆ (Others)", desc: "งานออกแบบหรือบริการอื่นๆ นอกเหนือจากที่ระบุไว้" }
  ],
  content: [
    { name: "Boost Post เพื่อประชาสัมพันธ์", desc: "การโปรโมตโพสต์เพื่อเพิ่มการเข้าถึงกลุ่มเป้าหมาย" },
    { name: "Creative Content Idea", desc: "คิดธีม/ไอเดีย/ Event & Campaign" },
    { name: "ถ่ายทำวิดีโอสั้น โปรโมตการบริการ", desc: "ถ่ายทำคลิปวิดีโอเพื่อนำเสนอหรือแนะนำบริการ" },
    { name: "ถ่ายทำวิดีโอสั้น มีการสัมภาษณ์", desc: "ถ่ายทำคลิปวิดีโอในรูปแบบการสัมภาษณ์บุคคล" },
    { name: "ถ่ายทำวิดีโอสั้น Talk Spective", desc: "ถ่ายทำคลิปพูดคุยหรือแชร์มุมมองในประเด็นต่างๆ" },
    { name: "บทความสั้น + ภาพประกอบ", desc: "ความยาว 300 - 500 คำ (โพสต์โซเชียล)" },
    { name: "บทความยาว + ภาพประกอบ", desc: "ความยาว 800 - 1,200 คำ (บทความ SEO/Blog)" },
    { name: "Copywriting / Storytelling", desc: "การเขียนคำโฆษณาหรือการเล่าเรื่องเพื่อดึงดูดความสนใจ" },
    { name: "ตัดต่อคลิปสั้น (Short-form)", desc: "ความยาว 15 - 60 วินาที (TikTok/Reels)" },
    { name: "อื่นๆ (Others)", desc: "งานบริการคอนเทนต์อื่นๆ นอกเหนือจากที่ระบุไว้" }
  ],
  pr: [
    { name: "ข่าวประชาสัมพันธ์บริการ (RSP)", desc: "ข่าวเครือข่าย RSP ภาคเหนือ" },
    { name: "ข่าวการประชาสัมพันธ์กิจกรรม/โครงการ (Pre PR)", desc: "การโปรโมทก่อนเริ่มงานหรือโครงการ" },
    { name: "ข่าวการจัดกิจกรรม/โครงการ", desc: "ข่าวรายงานผลการจัดกิจกรรมหรือโครงการ" },
    { name: "ข่าวการจัดประชุม/อบรม/สัมมนา", desc: "ข่าวงานประชุม การอบรม หรือสัมมนา" },
    { name: "ข่าวเกี่ยวกับผู้บริหาร", desc: "ข่าวภารกิจหรือการแถลงของผู้บริหาร" },
    { name: "ข่าวการรับรางวัล", desc: "ข่าวความสำเร็จหรือการรับรางวัลต่างๆ" },
    { name: "ข่าวศึกษาดูงาน", desc: "ข่าวการต้อนรับคณะศึกษาดูงาน" },
    { name: "Press Release (ข่าวแจกสื่อมวลชน)", desc: "เขียนข่าวประชาสัมพันธ์ภาษาไทยเพื่อส่งสื่อ" },
    { name: "Media Management (ดูแลสื่อมวลชน)", desc: "เชิญสื่อ, ดูแลหน้างาน, จัดการค่าเดินทาง/เบี้ยเลี้ยงสื่อ" },
    { name: "Stage Management (จัดการเวที)", desc: "จัดคิวเวที, ลำดับผู้กล่าว, ดูแลความเรียบร้อยพิธีการ" },
    { name: "MOU / Event Coverage", desc: "ถ่ายภาพ + เขียนข่าวสั้น + โพสต์โซเชียล" },
    { name: "สนับสนุนการจัดกิจกรรม (Support Event)", desc: "งานสนับสนุนและบริการสื่อสารอื่นๆ" },
    { name: "อื่นๆ (Others)", desc: "งานประชาสัมพันธ์อื่นๆ นอกเหนือจากที่ระบุ" }
  ],
  internal: [
    { name: "งานเอกสาร/การเงินโครงการ", desc: "ทำงานเอกสาร/การเงินโครงการที่เกี่ยวข้องกับการจัดซื้อจัดจ้าง" },
    { name: "งานขึ้นรูป Proposal / TOR", desc: "ทำงานเอกสาร กราฟิก ภาพประกอบ ไอเดียอื่นๆ เพื่อประกอบการเสนอโครงการ" },
    { name: "งาน Admin / STeP + RSP", desc: "งาน Admin จัดการข้อมูลหลังบ้าน Social Media ของ STeP และ RSP" },
    { name: "งาน Admin / Talk Spective", desc: "งาน Admin หลังบ้าน Social Media ของ Talk Spective" },
    { name: "เตรียมงาน VDO / STeP + RSP", desc: "เตรียมงาน สถานที่ ทำคอนเทนต์ VDO / STeP + RSP" },
    { name: "เตรียมงาน VDO / Talk Spective", desc: "เตรียมงาน สถานที่ ทำคอนเทนต์ VDO / Talk Spective" },
    { name: "บทความ / ภาพประกอบ ของ STeP + RSP", desc: "บทความ / ภาพประกอบ คอนเทนต์ PR ของ STeP + RSP" },
    { name: "บทความ / ภาพประกอบ ของ Talk Spective", desc: "บทความ / ภาพประกอบ คอนเทนต์ PR ของ Talk Spective" },
    { name: "งานให้คำปรึกษาเชิงสร้างสรรค์", desc: "งานให้คำปรึกษาที่เกี่ยวข้องกับงานสร้างสรรค์ ออกแบบ คอนเทนต์" },
    { name: "งานจัดทำ / แก้ไข Presentation", desc: "งานจัดทำ / แก้ไข สไลด์ Presentation" },
    { name: "งานวิทยากร", desc: "เป็นวิทยากรให้กับหน่วยงาน โครงการ กิจกรรมต่างๆ" },
    { name: "ดูแล / ประสานงานนักข่าว", desc: "ดูแลประสานงานนักข่าว เพื่อมาทำข่าวให้กับโครงการ กิจกรรม" },
    { name: "ประสานงานโครงการ", desc: "ช่วยประสานงานโครงการของคนภายในทีมและองค์กร นอกเหนือจาก Task ปกติ" },
    { name: "เขียนข่าว ( นอกเหนือจาก Task งาน )", desc: "เขียนข่าว ที่ได้รับมอบหมายนอกเหนือจาก Task งานที่มีอยู่เดิม" },
    { name: "เขียน Press Release ( นอกเหนือจาก Task งาน )", desc: "เขียน Press Release ที่ได้รับมอบหมายนอกเหนือจาก Task งาน" },
    { name: "ทำงานลงพื้นที่ / นอกสถานที่ ( นอกเหนือจาก Task งาน )", desc: "ทำงานลงพื้นที่ ที่นอกเหนือจาก Task งาน เช่น ถ่ายภาพนอกสถานที่" },
    { name: "ดูแล / ประสานงาน KOL INFLU", desc: "ดูแลประสานงาน KOL INFLU เพื่อมาทำข่าวให้กับโครงการ กิจกรรม" },
    { name: "ช่วยงาน Event", desc: "ช่วยงาน Event ในพื้นที่ / นอกพื้นที่ ของทีมและองค์กร" },
    { name: "เตรียมงานที่ Whoop Studio", desc: "เตรียมงาน ถ่ายภาพ คอนเทนต์ PR ที่ Whoop Studio" },
    { name: "ถ่ายภาพ ทำข่าว / ถ่ายวีดีโอ ( นอกเหนือจาก Task งาน )", desc: "ถ่ายภาพ ทำข่าว / ถ่ายวีดีโอ ที่อยู่นอกเหนือจาก Task งาน" },
    { name: "ติดตามผู้บริหาร ตามภารกิจขององค์กร ( นอกเหนือจาก Task งาน )", desc: "งานติดตามผู้บริหาร ตามภารกิจขององค์กร เช่น PR คอนเทนต์" },
    { name: "ตัดต่องาน VDO / Talk Spective", desc: "ตัดต่องาน ทำคอนเทนต์ VDO / Talk Spective" },
    { name: "ตัดต่องาน VDO / STeP + RSP", desc: "ตัดต่องาน ทำคอนเทนต์ VDO / STeP + RSP" },
    { name: "PM โครงการของ CC", desc: "PM โครงการของ CC ที่มีโค้ดมีเงินเข้า รายรับ ต้นทุน กำไร" },
    { name: "งานสนับสนุนและพัฒนาระบบไอที", desc: "งานบำรุงรักษาและแก้ไขปัญหาระบบไอที" },
    { name: "อื่นๆ (Others)", desc: "งานภายในอื่นๆ นอกเหนือจากที่ระบุ" }
  ]
};

type BriefDetailsModalProps = {
  brief: any;
  assignees: any[];
  taskCode: string;
  onUpdateField: (
    id: string,
    field: string,
    value: any,
    recordHistory?: boolean,
    bypassRevertCheck?: boolean,
    reason?: string
  ) => void | Promise<void>;
  onClose: () => void;
};

export default function BriefDetailsModal({ brief, assignees, taskCode, onUpdateField, onClose }: BriefDetailsModalProps) {
  if (!brief) return null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter operational assignees (exclude executives from being assigned to tasks)
  const operationalAssignees = useMemo(() => {
    return (assignees || []).filter((a: any) => {
      const u = a.unit || '';
      const r = a.role || '';
      return r !== 'executive' && !u.includes('|executive');
    });
  }, [assignees]);

  const unit = (brief.unit || 'creative').toLowerCase();
  
  // Category resolution
  const currentCategory = 
    brief.details?.category || 
    brief.details?.type || 
    brief.details?.service || 
    brief.category || 
    "";

  // Effective deadline resolution: prioritize brief.deadline, fallback to usage_date, event_datetime, publish_date, delivery_date
  const effectiveDeadline = 
    brief.deadline || 
    brief.details?.usage_date || 
    (brief.details?.event_datetime ? brief.details.event_datetime.split(" ")[0] : null) ||
    brief.details?.publish_date || 
    brief.details?.delivery_date || 
    null;

  // Auto-sync usage_date to brief.deadline if deadline is not yet saved in database
  useEffect(() => {
    if (!brief.deadline && effectiveDeadline) {
      onUpdateField(brief.id, "deadline", effectiveDeadline);
    }
  }, [brief.id, brief.deadline, effectiveDeadline]);

  // Standard Price resolution from back-office pricing catalog
  const standardPrice = getStandardPriceForTask(unit, currentCategory, brief.project_name);

  const unitCategories = ALL_CATEGORIES_BY_UNIT[unit] || ALL_CATEGORIES_BY_UNIT.creative;
  const categoryOptions: ModernSelectOption[] = [
    ...(currentCategory && !unitCategories.some(c => c.name === currentCategory)
      ? [{ value: currentCategory, label: currentCategory, desc: "รายการที่ระบุไว้ก่อนหน้า" }]
      : []),
    ...unitCategories.map(c => ({
      value: c.name,
      label: c.name,
      desc: c.desc
    }))
  ];

  // Save Cost resolution:
  // 1. If explicitly set in task details (e.g. customized due to task complexity), use that value!
  // 2. Otherwise default to the back-office standard rate
  const currentSaveCost = 
    brief.details?.save_cost !== undefined && brief.details?.save_cost !== null
      ? Number(brief.details.save_cost)
      : (standardPrice !== null 
          ? standardPrice 
          : (Number(brief.details?.revenue) || Number(brief.details?.project_value) || 0));

  // Local state for smooth editing without losing focus or cursor position
  const [localSaveCost, setLocalSaveCost] = useState<string>(
    currentSaveCost !== undefined && currentSaveCost !== null ? currentSaveCost.toString() : ""
  );

  useEffect(() => {
    setLocalSaveCost(currentSaveCost !== undefined && currentSaveCost !== null ? currentSaveCost.toString() : "");
  }, [currentSaveCost]);

  // Auto-populate standard price ONLY if save_cost was never set in database
  useEffect(() => {
    if (standardPrice !== null && (brief.details?.save_cost === undefined || brief.details?.save_cost === null)) {
      onUpdateField(brief.id, 'details', {
        ...brief.details,
        save_cost: standardPrice,
        project_value: standardPrice.toString(),
        revenue: standardPrice,
        cost: 0,
        profit: standardPrice
      });
    }
  }, [standardPrice]);

  // Check if category is "Others"
  const isOthersCategory = 
    currentCategory.includes('อื่นๆ') ||
    currentCategory.toLowerCase().includes('other') ||
    brief.details?.category === 'Others' ||
    brief.details?.type === 'Others';

  const hasSaveCostValue = 
    (brief.details?.save_cost !== undefined && brief.details?.save_cost !== null && brief.details?.save_cost !== 0) ||
    (standardPrice !== null && standardPrice > 0);

  const [isPromptPriceOpen, setIsPromptPriceOpen] = useState<boolean>(Boolean(isOthersCategory && !hasSaveCostValue));
  const [promptSaveCost, setPromptSaveCost] = useState<string>(currentSaveCost ? currentSaveCost.toString() : "");
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [surveyNotifySuccess, setSurveyNotifySuccess] = useState<string | null>(null);
  const [copiedSurvey, setCopiedSurvey] = useState(false);
  const [copiedTaskLink, setCopiedTaskLink] = useState(false);
  const [showInProgressEmailModal, setShowInProgressEmailModal] = useState(false);
  const [showCompletedEmailModal, setShowCompletedEmailModal] = useState(false);

  const handleConfirmInProgressModal = async (emailData: { to: string; cc: string[]; subject: string; body: string; from?: string; senderName?: string; assigneeId?: string }) => {
    const targetAssigneeId = emailData.assigneeId || brief.assignee_id;
    const now = new Date().toISOString();

    // Directly persist to Supabase to guarantee instantaneous consistency
    try {
      const supabase = createClient();
      await supabase.from("briefs").update({
        status: "in_progress",
        assignee_id: targetAssigneeId,
        in_progress_at: brief.in_progress_at || now,
        ...(emailData.to ? { requester_email: emailData.to } : {})
      }).eq("id", brief.id);
    } catch (dbErr) {
      console.error("Direct Supabase update error:", dbErr);
    }

    onUpdateField(brief.id, "status", "in_progress", true, true);
    if (targetAssigneeId) {
      onUpdateField(brief.id, "assignee_id", targetAssigneeId, true, true);
    }
    if (!brief.in_progress_at) {
      onUpdateField(brief.id, "in_progress_at", now, false, true);
    }
    if (emailData.to && emailData.to !== brief.requester_email) {
      onUpdateField(brief.id, "requester_email", emailData.to, false, true);
    }

    const assignee = assignees.find((a: any) => a.id === targetAssigneeId);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'kickoff_in_progress_email',
          briefId: brief.id,
          taskCode,
          projectName: brief.project_name,
          assigneeName: assignee?.name || 'ทีม CC',
          from: emailData.from,
          senderName: emailData.senderName,
          to: emailData.to,
          cc: emailData.cc,
          subject: emailData.subject,
          body: emailData.body,
        }),
      });
    } catch (err) {
      console.error('Failed to notify kickoff email:', err);
    }

    setShowInProgressEmailModal(false);
    setSurveyNotifySuccess(`⚡ เริ่มงานสำเร็จ! เปิดร่างอีเมลใน Gmail เรียบร้อยแล้ว (กรุณากด Send ในแท็บ Gmail เพื่อส่งจริง)`);
  };

  const handleCancelInProgressModal = () => {
    setShowInProgressEmailModal(false);
  };

  const handleConfirmCompletedModal = async (emailData: { to: string; cc: string[]; subject: string; body: string; from?: string; senderName?: string; assigneeId?: string }) => {
    const targetAssigneeId = emailData.assigneeId || brief.assignee_id;
    const now = new Date().toISOString();
    const existingDetails = brief.details || {};
    const updatedDetails = {
      ...existingDetails,
      survey_status: existingDetails.survey_status || 'sent',
      satisfaction_rate: existingDetails.satisfaction_rate ?? 85.0
    };

    // Directly persist to Supabase to guarantee instantaneous consistency
    try {
      const supabase = createClient();
      await supabase.from("briefs").update({
        status: "completed",
        completed_at: now,
        details: updatedDetails,
        ...(targetAssigneeId ? { assignee_id: targetAssigneeId } : {}),
        ...(emailData.to ? { requester_email: emailData.to } : {})
      }).eq("id", brief.id);
    } catch (dbErr) {
      console.error("Direct Supabase completed update error:", dbErr);
    }

    onUpdateField(brief.id, "status", "completed", true, true);
    onUpdateField(brief.id, "completed_at", now, false, true);
    onUpdateField(brief.id, "details", updatedDetails, true, true);

    if (emailData.to && emailData.to !== brief.requester_email) {
      onUpdateField(brief.id, "requester_email", emailData.to, false, true);
    }

    const assignee = assignees.find((a: any) => a.id === targetAssigneeId);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'task_completed',
          briefId: brief.id,
          taskCode,
          projectName: brief.project_name,
          assigneeName: assignee?.name || 'ทีม CC',
          requesterEmail: emailData.to,
          requesterName: brief.coordinator_nickname,
        }),
      });
    } catch (err) {
      console.error('Failed to notify completed email:', err);
    }

    setShowCompletedEmailModal(false);
    setSurveyNotifySuccess(`⚡ ส่งมอบงานสำเร็จ! เปิดร่างอีเมลแบบประเมินใน Gmail เรียบร้อยแล้ว (กรุณากด Send ในแท็บ Gmail เพื่อส่งจริง)`);
  };

  const handleCancelCompletedModal = () => {
    setShowCompletedEmailModal(false);
  };

  const handleCopySurveyLink = async () => {
    const url = getTaskSurveyUrl(brief.id, brief.assignee_id);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedSurvey(true);
    setTimeout(() => setCopiedSurvey(false), 2500);
  };

  const handleCopyTaskLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const code = taskCode || brief.id || '';
    const url = `${origin}/track?id=${encodeURIComponent(code)}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedTaskLink(true);
    setTimeout(() => setCopiedTaskLink(false), 2500);
  };

  const handleSavePromptFinancials = async () => {
    const val = Number(promptSaveCost) || 0;
    setLocalSaveCost(val.toString());
    await onUpdateField(brief.id, 'details', {
      ...brief.details,
      save_cost: val,
      project_value: val.toString(),
      revenue: val,
      cost: 0,
      profit: val
    });
    setIsPromptPriceOpen(false);
  };

  const handleSaveCostChange = (val: number) => {
    setLocalSaveCost(val.toString());
    onUpdateField(brief.id, 'details', {
      ...brief.details,
      save_cost: val,
      project_value: val.toString(),
      revenue: val,
      cost: 0,
      profit: val
    });
  };

  const handleCategoryChange = (val: string) => {
    const std = getStandardPriceForTask(unit, val, brief.project_name);
    const updates: any = {
      ...brief.details,
      category: val,
      type: val,
      service: val
    };
    if (std !== null) {
      updates.save_cost = std;
      updates.project_value = std.toString();
      updates.revenue = std;
      updates.cost = 0;
      updates.profit = std;
    }
    onUpdateField(brief.id, 'details', updates);
  };

  const handleDownloadPDF = () => {
    exportBriefToPdf({
      brief,
      assignees,
      taskCode,
      currentCategory,
      currentSaveCost
    });
  };

  const hasAttachments = brief.details?.attachments && brief.details.attachments.length > 0;
  const [downloadingAttachmentIdx, setDownloadingAttachmentIdx] = useState<number | null>(null);

  // Task Age
  const getTaskAges = (b: any) => {
    const now = new Date().getTime();
    const created = new Date(b.created_at).getTime();
    const inProgress = b.in_progress_at ? new Date(b.in_progress_at).getTime() : null;
    const completed = b.completed_at ? new Date(b.completed_at).getTime() : null;

    const pendingEnd = inProgress || (b.status === 'cancelled' ? now : now);
    let pendingDays = Math.max(0, Math.floor((pendingEnd - created) / (1000 * 3600 * 24)));
    
    let inProgressDays = 0;
    if (inProgress) {
      const ipEnd = completed || (b.status === 'cancelled' ? now : now);
      inProgressDays = Math.max(0, Math.floor((ipEnd - inProgress) / (1000 * 3600 * 24)));
    }
    return { pendingDays, inProgressDays };
  };
  const ages = getTaskAges(brief);

  // Helper to update a detail field
  const updateDetail = (key: string, val: any) => {
    onUpdateField(brief.id, 'details', {
      ...brief.details,
      [key]: val
    });
    // If usage_date, publish_date, delivery_date, or event_datetime is updated, also sync to brief.deadline!
    if (key === 'usage_date' || key === 'publish_date' || key === 'delivery_date' || key === 'event_datetime') {
      const datePart = val ? (val.includes(" ") ? val.split(" ")[0] : val) : null;
      onUpdateField(brief.id, 'deadline', datePart || null);
    }
  };

  const parseDateSafe = (dStr: any): Date | null => {
    if (!dStr) return null;
    const cleanStr = String(dStr).split(" - ")[0].split(" ถึง ")[0].trim();
    const d = new Date(cleanStr.includes(" ") ? cleanStr.replace(" ", "T") : cleanStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper row component
  const DetailRow = ({ 
    icon, 
    label, 
    value, 
    fieldKey, 
    placeholder = "-",
    isTextarea = false,
    rows = 2,
    isDate = false,
    showTimeSelect = false
  }: { 
    icon: React.ReactNode; 
    label: string; 
    value: any; 
    fieldKey: string; 
    placeholder?: string;
    isTextarea?: boolean;
    rows?: number;
    isDate?: boolean;
    showTimeSelect?: boolean;
  }) => (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 flex flex-col sm:table-row">
      <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-top">
        <div className="flex items-center gap-2 text-slate-600">
          {icon}
          <span className="font-semibold text-xs uppercase tracking-wider">{label}</span>
        </div>
      </td>
      <td className="px-3 sm:px-3 py-2 w-full sm:w-2/3 align-top">
        {isDate ? (
          <div className="relative flex items-center">
            <DatePicker
              selected={parseDateSafe(value)}
              onChange={(date: Date | null) => {
                if (date) {
                  const tzOffset = date.getTimezoneOffset() * 60000;
                  const localISOTime = showTimeSelect 
                    ? (new Date(date.getTime() - tzOffset)).toISOString().replace("T", " ").substring(0, 16)
                    : (new Date(date.getTime() - tzOffset)).toISOString().split("T")[0];
                  updateDetail(fieldKey, localISOTime);
                } else {
                  updateDetail(fieldKey, "");
                }
              }}
              dateFormat={showTimeSelect ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
              showTimeSelect={showTimeSelect}
              timeIntervals={15}
              isClearable
              placeholderText={placeholder === "-" ? "คลิกเพื่อเลือกวันที่..." : placeholder}
              popperClassName="z-[80] shadow-2xl"
              className="w-full text-sm font-medium text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-200 focus:border-primary rounded px-2.5 py-1.5 focus:outline-none cursor-pointer transition-colors"
            />
          </div>
        ) : isTextarea ? (
          <textarea
            className="w-full text-sm text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-primary rounded px-2 py-1.5 focus:outline-none resize-y leading-relaxed"
            defaultValue={value || ""}
            placeholder={placeholder}
            rows={rows}
            onBlur={(e) => {
              if (e.target.value !== (value || "")) {
                updateDetail(fieldKey, e.target.value);
              }
            }}
          />
        ) : (
          <input
            type="text"
            className="w-full text-sm font-medium text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-primary rounded px-2 py-1 focus:outline-none"
            defaultValue={value || ""}
            placeholder={placeholder}
            onBlur={(e) => {
              if (e.target.value !== (value || "")) {
                updateDetail(fieldKey, e.target.value);
              }
            }}
          />
        )}
      </td>
    </tr>
  );

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-[#181a1c]/90 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {/* Task Code */}
              <span className="text-xs sm:text-sm font-mono font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300/80 shadow-2xs tracking-wide shrink-0">
                {taskCode}
              </span>

              {/* Unit Badge (Prominent & Clear) */}
              <span className={`text-xs sm:text-sm font-black px-3 py-1 sm:px-4 sm:py-1.5 rounded-full uppercase tracking-wider shadow-xs text-white shrink-0 ${
                unit === 'creative' ? 'bg-[#8b5cf6]' :
                unit === 'content' ? 'bg-[#ec4899]' :
                unit === 'pr' ? 'bg-[#1877F2]' :
                unit === 'internal' ? 'bg-[#27272a]' : 'bg-slate-600'
              }`}>
                {unit}
              </span>

              {/* Service / Category Badge */}
              {currentCategory && (
                <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs leading-tight inline-block max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                  {currentCategory}
                </span>
              )}
            </div>

            {/* Mobile close button (top right) */}
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
              title="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyTaskLink}
              title="คัดลอกลิงก์ตรวจสอบสถานะและรายละเอียดงานนี้"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
                copiedTaskLink
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200"
                  : "text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {copiedTaskLink ? (
                <>
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-slate-500 shrink-0" />
                  <span>คัดลอกลิงก์งาน</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download size={14} className="shrink-0" /> 
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="hidden sm:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
              title="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
          
          {/* Project Title */}
          <div>
            <textarea
              className="w-full text-xl font-bold text-slate-800 border border-transparent hover:border-slate-200 focus:border-primary rounded-lg p-2 focus:outline-none resize-none leading-snug"
              defaultValue={brief.project_name || ""}
              rows={1}
              placeholder="ชื่องาน / โครงการ"
              onBlur={(e) => {
                if (e.target.value !== brief.project_name) {
                  onUpdateField(brief.id, "project_name", e.target.value);
                }
              }}
            />
          </div>

          {/* IDC Design Consultation Details Card */}
          {brief.details?.idc_code && (
            <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-orange-200/80 rounded-2xl p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-orange-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-500 text-white shadow-2xs">
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider font-mono">
                      งานขอรับคำปรึกษาด้านการออกแบบ (Innovation Design Center)
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-orange-700">
                      รหัสคำขอ: {brief.details.idc_code}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 font-mono">
                  IDC Project
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
                  <span className="text-[10px] text-slate-500 block font-semibold">ผู้รับบริการ</span>
                  <span className="font-bold text-slate-800">{brief.details.client_name || brief.coordinator_nickname || "-"}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
                  <span className="text-[10px] text-slate-500 block font-semibold">สถานประกอบการ</span>
                  <span className="font-bold text-slate-800">{brief.details.company_name || "-"}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
                  <span className="text-[10px] text-slate-500 block font-semibold">ประเภทงานที่รับคำปรึกษา</span>
                  <span className="font-bold text-orange-700">{brief.details.service_label || brief.details.service_main || "-"}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
                  <span className="text-[10px] text-slate-500 block font-semibold">จำนวนครั้ง / ชิ้นงาน</span>
                  <span className="font-bold text-slate-800">{brief.details.piece_count || 1} ครั้ง / ชิ้น</span>
                </div>
              </div>

              {(brief.details.phone || brief.details.email || brief.details.address || brief.details.tax_id) && (
                <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-orange-100/80 flex flex-wrap items-center gap-4">
                  {brief.details.phone && <span>📞 <strong>โทร:</strong> {brief.details.phone}</span>}
                  {brief.details.email && <span>✉️ <strong>อีเมล:</strong> {brief.details.email}</span>}
                  {brief.details.tax_id && <span>📋 <strong>Tax ID:</strong> {brief.details.tax_id}</span>}
                  {brief.details.address && <span className="w-full">📍 <strong>ที่อยู่:</strong> {brief.details.address}</span>}
                </div>
              )}
            </div>
          )}

          {/* Top Metadata Grid: Staff & Owner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            
            {/* Left Box: CC Staff & Status */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3.5 shadow-2xs">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                  <User size={13} className="text-slate-500" /> CC Staff & Status
                </h3>
                
                <div className="space-y-3">
                  {/* Row 1: Assignee & Status (2 Columns, plenty of room for names and status labels) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">Assignee (ผู้รับผิดชอบ)</label>
                      <CustomSelect
                        triggerClassName="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-2xs hover:border-slate-300 transition-all h-[36px] flex items-center justify-between text-left"
                        placeholder="Unassigned"
                        value={brief.assignee_id || ""}
                        onChange={(val) => onUpdateField(brief.id, "assignee_id", val)}
                        options={[
                          { value: "", label: "Unassigned" },
                          ...operationalAssignees.map((a: any) => ({ value: a.id, label: a.name }))
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">สถานะงาน (Status)</label>
                      <CustomSelect
                        triggerClassName="w-full text-xs font-bold bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-2xs hover:border-slate-300 transition-all h-[36px] flex items-center justify-between text-left"
                        value={brief.status || "pending"}
                        onChange={(val) => {
                          const currentStatus = brief.status || 'pending';

                          // Prevent moving from pending directly to completed
                          if (currentStatus === 'pending' && val === 'completed') {
                            alert(
                              "⚠️ ไม่สามารถย้ายงานจาก 'Pending' ไปยังสถานะ 'Completed' ได้โดยตรง!\n\n" +
                              "📌 ขั้นตอนการทำงานที่ถูกต้อง:\n" +
                              "1. กำหนดผู้รับผิดชอบงาน (Assignee)\n" +
                              "2. ย้ายสถานะไปที่ 'In Progress (กำลังทำ)' เพื่อส่งอีเมลตั้งต้นแจ้งเริ่มงานและข้อความบรีฟให้ PM และทีมงาน\n" +
                              "3. ดำเนินการผลิตและตรวจแก้แต่ละดราฟจนส่งมอบงานสมบูรณ์ จึงจะเปลี่ยนสถานะเป็น 'Completed'"
                            );
                            return;
                          }

                          if (val === "in_progress") {
                            setShowInProgressEmailModal(true);
                            return;
                          }

                          if (val === "completed") {
                            setShowCompletedEmailModal(true);
                            return;
                          }

                          onUpdateField(brief.id, "status", val);
                        }}
                        options={
                          (brief.status || 'pending') === 'pending'
                            ? [
                                { value: "pending", label: "⏳ Pending (รอทำ)" },
                                { value: "in_progress", label: "⚡ In Progress (กำลังทำ)" },
                                { value: "cancelled", label: "❌ Cancelled (ยกเลิก)" },
                                { value: "completed", label: "🚫 Completed (ต้องผ่าน In Progress ก่อน)", disabled: true }
                              ]
                            : [
                                { value: "pending", label: "⏳ Pending (รอทำ)" },
                                { value: "in_progress", label: "⚡ In Progress (กำลังทำ)" },
                                { value: "completed", label: "✅ Completed (เสร็จสิ้น)" },
                                { value: "cancelled", label: "❌ Cancelled (ยกเลิก)" }
                              ]
                        }
                      />
                    </div>
                  </div>

                  {/* Row 2: Priority, Deadline (2 Columns - Symmetrical with Requester Card) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">Priority (ความสำคัญ)</label>
                      <CustomSelect
                        triggerClassName="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-2xs hover:border-slate-300 transition-all h-[36px] flex items-center justify-between text-left"
                        value={brief.priority || "Medium"}
                        onChange={(val) => onUpdateField(brief.id, "priority", val)}
                        options={[
                          { value: "High", label: "🔥 High" },
                          { value: "Medium", label: "⚡ Medium" },
                          { value: "Low", label: "☕ Low" }
                        ]}
                      />
                    </div>

                    <div>
                      <div className="mb-1.5">
                        <label className="text-[11px] text-slate-500 font-semibold">Deadline (กำหนดส่ง)</label>
                      </div>
                      <DatePicker
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3 py-2 text-center shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800/10 transition-all h-[36px]"
                        selected={effectiveDeadline ? new Date(effectiveDeadline) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const tzOffset = date.getTimezoneOffset() * 60000;
                            const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().split("T")[0];
                            onUpdateField(brief.id, "deadline", localISOTime);
                            const updatedDetails: any = {
                              ...brief.details,
                              usage_date: localISOTime
                            };
                            if (brief.unit === 'pr') {
                              if (brief.details?.event_datetime && brief.details.event_datetime.includes(" ")) {
                                const timePart = brief.details.event_datetime.split(" ")[1];
                                updatedDetails.event_datetime = `${localISOTime} ${timePart}`;
                              } else {
                                updatedDetails.event_datetime = localISOTime;
                              }
                            }
                            onUpdateField(brief.id, "details", updatedDetails);
                          } else {
                            onUpdateField(brief.id, "deadline", null);
                          }
                        }}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistants Sub-section inside CC Staff */}
              <div className="pt-3 border-t border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <Users size={13} className="text-slate-500" />
                    <span>ผู้ช่วยรับผิดชอบ (Assistants)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const currentAssistants = brief.details?.assistants || [];
                      onUpdateField(brief.id, 'details', {
                        ...brief.details,
                        assistants: [...currentAssistants, { assignee_id: '', percentage: 0 }]
                      });
                    }}
                    className="text-[11px] text-white bg-[#e03131] hover:bg-[#c92a2a] active:bg-[#b02525] active:scale-95 px-3.5 py-1.5 rounded-full transition-all font-semibold tracking-wide shadow-xs border border-transparent flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={2.5} /> ขอผู้ช่วย
                  </button>
                </div>

                {!(brief.details?.assistants && brief.details.assistants.length > 0) ? (
                  <div className="text-[11px] text-slate-400 italic py-1">
                    ไม่มีผู้ช่วย (กด "+ ขอผู้ช่วย" เพื่อแบ่งสัดส่วน % งาน)
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {(() => {
                      const effectiveBaseVal = currentSaveCost;

                      return (
                        <>
                          {(brief.details.assistants).map((assistant: any, index: number) => {
                            const assistantBaht = Math.round((effectiveBaseVal * (Number(assistant.percentage) || 0)) / 100);
                            return (
                              <div key={index} className="flex items-center gap-2 group">
                                <div className="flex-1 relative min-w-0">
                                  <CustomSelect 
                                    triggerClassName="w-full text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-3 py-1 shadow-xs hover:border-slate-300 transition-colors truncate text-[12px] h-[32px] flex items-center justify-between"
                                    dropdownClassName="w-48 text-[12px]"
                                    placeholder="เลือกผู้ช่วย..."
                                    value={assistant.assignee_id || ""}
                                    onChange={(val) => {
                                      const newAssistants = [...(brief.details.assistants)];
                                      newAssistants[index].assignee_id = val;
                                      onUpdateField(brief.id, 'details', { ...brief.details, assistants: newAssistants });
                                    }}
                                    options={[
                                      { value: "", label: "เลือกผู้ช่วย..." },
                                      ...operationalAssignees
                                        .filter((a: any) => a.id !== brief.assignee_id && !brief.details.assistants.some((ast: any, i: number) => i !== index && ast.assignee_id === a.id))
                                        .map((a: any) => ({ value: a.id, label: a.name }))
                                    ]}
                                  />
                                </div>
                                <div className="w-[76px] relative flex items-center border border-slate-200 focus-within:border-slate-400 rounded-full bg-white shadow-xs transition-colors h-[32px] shrink-0 px-2">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    className="w-full bg-transparent pl-1 pr-4 py-0.5 text-[12px] text-center focus:outline-none font-semibold text-slate-700 font-mono no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={assistant.percentage === 0 ? '' : assistant.percentage}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const newAssistants = [...(brief.details.assistants)];
                                      newAssistants[index].percentage = parseInt(e.target.value) || 0;
                                      onUpdateField(brief.id, 'details', { ...brief.details, assistants: newAssistants });
                                    }}
                                  />
                                  <span className="absolute right-2.5 text-slate-400 text-[11px] pointer-events-none font-bold">%</span>
                                </div>
                                <div 
                                  className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full shrink-0 min-w-[70px] text-right text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 h-[32px] flex items-center justify-end"
                                  title="มูลค่า Save Cost ของผู้ช่วยท่านนี้"
                                >
                                  ฿{assistantBaht.toLocaleString()}
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newAssistants = [...(brief.details.assistants)];
                                    newAssistants.splice(index, 1);
                                    onUpdateField(brief.id, 'details', { ...brief.details, assistants: newAssistants });
                                  }}
                                  className="text-slate-300 hover:text-rose-500 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="ลบผู้ช่วย"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                          
                          {(() => {
                            const totalPercent = (brief.details?.assistants || []).reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0);
                            if (totalPercent > 100) {
                              return (
                                <div className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-semibold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                                  <AlertCircle size={12} /> สัดส่วนเกิน 100% (รวม {totalPercent}%)
                                </div>
                              );
                            }
                            if (totalPercent > 0) {
                              const ownerPct = Math.max(0, 100 - totalPercent);
                              const ownerBaht = Math.round((effectiveBaseVal * ownerPct) / 100);
                              const assistantBaht = Math.round((effectiveBaseVal * totalPercent) / 100);
                              return (
                                <div className="space-y-1 mt-1.5">
                                  <div className="text-[11px] text-slate-600 flex items-center justify-between px-3 py-1 bg-white rounded-full border border-slate-200/80 font-medium shadow-2xs">
                                    <span>
                                      งานหลัก: <strong className="text-slate-800 font-semibold">{ownerPct}%</strong> <span className="font-mono font-bold text-emerald-700">(฿{ownerBaht.toLocaleString()})</span>
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span>
                                      ผู้ช่วยรวม: <strong className="text-slate-800 font-semibold">{totalPercent}%</strong> <span className="font-mono font-bold text-emerald-700">(฿{assistantBaht.toLocaleString()})</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Requester / Owner */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3.5 shadow-2xs">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-500" /> Requester (ผู้สั่งงาน)
                </h3>

                <div className="space-y-3">
                  {/* Row 1: ผู้ประสานงาน & ทีมผู้สั่งงาน (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">ผู้ประสานงาน (Name)</label>
                      <input
                        type="text"
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-2xs hover:border-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-800/10 transition-all h-[36px]"
                        defaultValue={brief.coordinator_nickname || brief.requester_name || ""}
                        placeholder="ชื่อผู้สั่งงาน"
                        onBlur={(e) => {
                          if (e.target.value !== brief.coordinator_nickname) {
                            onUpdateField(brief.id, "coordinator_nickname", e.target.value);
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">ทีมผู้สั่งงาน (Team)</label>
                      {(() => {
                        const rawTeam = (brief.decision_maker || brief.details?.team || "").toString().trim();
                        const matched = OFFICIAL_STEP_TEAMS.find(t => 
                          t.abbr.toUpperCase() === rawTeam.toUpperCase() || 
                          rawTeam.toUpperCase().startsWith(t.abbr.toUpperCase() + " ") ||
                          rawTeam.toUpperCase().startsWith(t.abbr.toUpperCase() + "-") ||
                          t.th === rawTeam ||
                          rawTeam.includes(t.th)
                        );
                        const selectedValue = matched ? matched.abbr : rawTeam;
                        const teamSelectOptions = [
                          { value: "", label: "None (ไม่ระบุ)" },
                          ...OFFICIAL_STEP_TEAMS.map(team => ({
                            value: team.abbr,
                            label: `${team.abbr} - ${team.th}`,
                            desc: team.en
                          })),
                          ...(selectedValue && !OFFICIAL_STEP_TEAMS.some(t => t.abbr === selectedValue)
                            ? [{ value: selectedValue, label: selectedValue, desc: "ทีมผู้สั่งงานที่ระบุไว้" }]
                            : [])
                        ];

                        return (
                          <ModernSelect
                            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3.5 py-1.5 shadow-2xs hover:border-slate-300 transition-all h-[36px]"
                            placeholder="เลือกทีม..."
                            searchPlaceholder="ค้นหาชื่อทีม (เช่น CC, PITI, บริหาร, บ่มเพาะ)..."
                            value={selectedValue}
                            onChange={(val) => {
                              const isMain3 = ['creative', 'content', 'pr'].includes((brief.unit || '').toLowerCase());
                              const newOrg = isMain3 ? (val.toUpperCase() === 'NMCO' ? 'RSP' : 'STeP') : (brief.details?.organization || 'STeP');
                              onUpdateField(brief.id, "decision_maker", val);
                              onUpdateField(brief.id, "details", { 
                                ...brief.details, 
                                team: val,
                                organization: newOrg
                              });
                            }}
                            options={teamSelectOptions}
                            accentColor="orange"
                          />
                        );
                      })()}
                    </div>
                  </div>

                  {/* Row 2: เบอร์โทรศัพท์ & อีเมล (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">เบอร์โทรศัพท์ (Phone)</label>
                      <input
                        type="text"
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-2xs hover:border-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-800/10 transition-all h-[36px]"
                        defaultValue={brief.requester_phone || brief.details?.requester_phone || ""}
                        placeholder="08xxxxxxxx"
                        onBlur={(e) => {
                          onUpdateField(brief.id, "requester_phone", e.target.value);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1.5 font-semibold">อีเมล (Email)</label>
                      <input
                        type="email"
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-2xs hover:border-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-800/10 transition-all h-[36px]"
                        defaultValue={brief.requester_email || ""}
                        placeholder="name@step.cmu.ac.th"
                        onBlur={(e) => {
                          onUpdateField(brief.id, "requester_email", e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Requester Organization / Contact info bar at bottom (balances with Assistants section) */}
              <div className="pt-3 border-t border-slate-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <Building2 size={13} className="text-slate-500" />
                    <span>สังกัดหน่วยงานผู้สั่งงาน</span>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {brief.details?.organization || 'STeP'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>ช่องทางส่งงาน / ประสานงาน:</span>
                  <span className="text-slate-600 font-medium truncate max-w-[200px]">
                    {brief.requester_email || brief.requester_phone || 'ระบบฟอร์มบรีฟ'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Toast Notification when Survey Email is Dispatched */}
          {surveyNotifySuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{surveyNotifySuccess}</span>
              </div>
              <button onClick={() => setSurveyNotifySuccess(null)} className="text-emerald-500 hover:text-emerald-800 p-1">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Section: Satisfaction Evaluation (Only visible when task status is complete) */}
          {(brief.status === 'completed' || brief.status === 'complete') && (
            <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-yellow-50/60 rounded-2xl border border-amber-200/90 p-4.5 shadow-sm space-y-3.5">
              {(() => {
                const hasEvaluated = Boolean(
                  brief.details?.survey_status === 'completed' || 
                  (brief.details?.satisfaction_scores?.averagePercent !== undefined && brief.details?.satisfaction_scores?.averagePercent !== null) ||
                  (brief.details?.satisfaction_scores && typeof brief.details.satisfaction_scores.accuracy === 'number')
                );
                
                const currentPercent = brief.details?.satisfaction_scores?.averagePercent ?? (brief.details?.satisfaction_rate ?? 85.0);

                if (!hasEvaluated) {
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-blue-600 text-white shadow-2xs shrink-0">
                          <Mail size={18} />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            ผลการประเมินความพึงพอใจการให้บริการ
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 font-mono">
                              <Mail size={12} className="text-blue-600" /> ส่งแบบประเมินแล้ว
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            ส่งแบบประเมินเข้าอีเมลผู้สั่งงาน ({brief.requester_email || 'ผู้สั่งงาน'}) เรียบร้อยแล้ว (คิดเกณฑ์มาตรฐาน {currentPercent}% ชั่วคราว)
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowCompletedEmailModal(true)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs bg-[#EA4335] hover:bg-[#d93025] text-white"
                          title="เปิดส่งแบบประเมินและแจ้งส่งมอบงานผ่าน Gmail (@step.cmu.ac.th)"
                        >
                          <Mail size={13} className="text-white" />
                          <span>เปิดส่งใน Gmail</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopySurveyLink}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                            copiedSurvey
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 scale-95"
                              : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300"
                          }`}
                          title="คัดลอกลิงก์แบบประเมินสำหรับส่งให้ผู้สั่งงาน (PM) โดยตรงทาง LINE หรือช่องทางอื่น"
                        >
                          {copiedSurvey ? (
                            <>
                              <Check size={13} className="text-emerald-600 stroke-[3]" />
                              <span>คัดลอกลิงก์แล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Link2 size={13} className="text-blue-600 stroke-[2.5]" />
                              <span>คัดลอกลิงก์</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
                          <Star size={18} className="fill-white" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            ผลการประเมินความพึงพอใจการให้บริการ
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                              <CheckCircle2 size={12} className="text-emerald-600" /> ทำแบบประเมินแล้ว ({currentPercent}%)
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            ประเมินแล้วโดย {brief.details?.satisfaction_scores?.evaluatedBy || brief.requester_email || 'ผู้สั่งงาน'}
                          </p>
                        </div>
                      </div>
                      {/* เคารพผู้ประเมิน: ไม่มีปุ่มแก้ไขแบบประเมิน */}
                    </div>

                    {/* Dimensions rating breakdown */}
                    {brief.details?.satisfaction_scores && (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-2xs">
                            <div className="text-[10px] text-slate-400 font-semibold">1. ความถูกต้อง</div>
                            <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">{brief.details.satisfaction_scores.accuracy || 5}/5 ⭐</div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-2xs">
                            <div className="text-[10px] text-slate-400 font-semibold">2. ตรงต่อเวลา</div>
                            <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">{brief.details.satisfaction_scores.timeliness || 5}/5 ⭐</div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-2xs">
                            <div className="text-[10px] text-slate-400 font-semibold">3. คุณภาพงาน</div>
                            <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">{brief.details.satisfaction_scores.quality || 5}/5 ⭐</div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-2xs">
                            <div className="text-[10px] text-slate-400 font-semibold">4. มนุษยสัมพันธ์</div>
                            <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">{brief.details.satisfaction_scores.attentiveness || 5}/5 ⭐</div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-2xs">
                            <div className="text-[10px] text-slate-400 font-semibold">5. ความเป็นเจ้าของ</div>
                            <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">{brief.details.satisfaction_scores.ownership || 5}/5 ⭐</div>
                          </div>
                        </div>

                        {brief.details.satisfaction_scores.comment && (
                          <div className="bg-white/90 p-3 rounded-xl border border-amber-200/70 text-xs">
                            <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-[11px]">
                              <MessageSquare size={13} className="text-amber-600" />
                              ข้อเสนอแนะเพิ่มเติม:
                            </div>
                            <p className="text-slate-600 leading-relaxed italic">
                              "{brief.details.satisfaction_scores.comment}"
                            </p>
                            {brief.details.satisfaction_scores.evaluatedBy && (
                              <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                — ประเมินโดย: {brief.details.satisfaction_scores.evaluatedBy}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Section: Comprehensive Brief Scope & Fields */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FileText size={15} className="text-primary" /> รายละเอียดงานตามแบบฟอร์มบรีฟ ({unit.toUpperCase()})
              </span>
              <span className="text-[11px] text-slate-400">
                คลิกที่ข้อมูลเพื่อแก้ไขได้ทันที
              </span>
            </div>

            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                
                {/* 0. Category / Service (ประเภทงาน) Row */}
                <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 bg-amber-50/20 flex flex-col sm:table-row">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-middle">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Layers size={14} className="text-amber-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-xs uppercase tracking-wider block">ประเภทงาน (Service / Category)</span>
                        <span className="text-[10px] text-slate-400 font-normal">รูปแบบงานตามแคตตาล็อกบริการ</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-2.5 w-full sm:w-2/3">
                    <ModernSelect
                      className="w-full text-xs font-bold bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 shadow-xs"
                      placeholder="เลือกประเภทงาน..."
                      searchPlaceholder="ค้นหาประเภทงาน..."
                      value={currentCategory}
                      onChange={(val) => handleCategoryChange(val)}
                      options={categoryOptions}
                      accentColor="orange"
                    />
                  </td>
                </tr>

                {/* 1. Organization (หน่วยงาน) Row */}
                <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 bg-indigo-50/10 flex flex-col sm:table-row">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-middle">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 size={14} className="text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-xs uppercase tracking-wider block">เป็นภาระงานของหน่วยงานใด</span>
                        <span className="text-[10px] text-slate-400 font-normal">สังกัดหน่วยงานผู้สั่งงาน</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-2.5 w-full sm:w-2/3">
                    {(() => {
                      const rawTeam = (brief.decision_maker || brief.details?.team || "").toString().trim().toUpperCase();
                      const isMain3Brief = ['creative', 'content', 'pr'].includes((unit || '').toLowerCase());
                      const defaultOrg = isMain3Brief ? (rawTeam === 'NMCO' ? 'RSP' : 'STeP') : (unit === 'internal' ? 'STeP' : 'Other');
                      const currentOrg = (brief.details?.organization || defaultOrg).toString().trim();
                      const isOtherSelected = !['STEP', 'CMU', 'RSP'].includes(currentOrg.toUpperCase()) || currentOrg === 'Other' || currentOrg === 'อื่นๆ';
                      const orgOptions = [
                        { 
                          key: "STeP", 
                          label: "STeP", 
                          tooltip: "STeP (อุทยานวิทยาศาสตร์ฯ มช.)",
                          icon: Building2,
                          activeClass: "bg-amber-500 text-white border-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(245,158,11,0.25)] font-bold",
                          inactiveClass: "bg-zinc-100/90 text-zinc-700 border-zinc-300/80 hover:bg-zinc-200/80 hover:border-zinc-400 hover:text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)]",
                          inactiveColor: "text-amber-600"
                        },
                        { 
                          key: "CMU", 
                          label: "CMU", 
                          tooltip: "CMU (มหาวิทยาลัยเชียงใหม่)",
                          icon: Landmark,
                          activeClass: "bg-purple-600 text-white border-purple-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(147,51,234,0.25)] font-bold",
                          inactiveClass: "bg-zinc-100/90 text-zinc-700 border-zinc-300/80 hover:bg-zinc-200/80 hover:border-zinc-400 hover:text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)]",
                          inactiveColor: "text-purple-600"
                        },
                        { 
                          key: "RSP", 
                          label: "RSP", 
                          tooltip: "RSP (อุทยานวิทยาศาสตร์ภาคเหนือ)",
                          icon: Network,
                          activeClass: "bg-orange-500 text-white border-orange-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(249,115,22,0.25)] font-bold",
                          inactiveClass: "bg-zinc-100/90 text-zinc-700 border-zinc-300/80 hover:bg-zinc-200/80 hover:border-zinc-400 hover:text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)]",
                          inactiveColor: "text-orange-600"
                        },
                        { 
                          key: "Other", 
                          label: "อื่นๆ", 
                          tooltip: "องค์กรภายนอกอื่นๆ",
                          icon: Globe,
                          activeClass: "bg-zinc-700 text-white border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(0,0,0,0.2)] font-bold",
                          inactiveClass: "bg-zinc-100/90 text-zinc-700 border-zinc-300/80 hover:bg-zinc-200/80 hover:border-zinc-400 hover:text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)]",
                          inactiveColor: "text-zinc-500"
                        }
                      ];
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {orgOptions.map(item => {
                              const isMatch = item.key === "Other" 
                                ? isOtherSelected 
                                : currentOrg.toUpperCase() === item.key.toUpperCase();
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  title={item.tooltip}
                                  onClick={() => {
                                    onUpdateField(brief.id, 'details', {
                                      ...brief.details,
                                      organization: item.key === 'Other' ? (brief.details?.organization_other || 'อื่นๆ') : item.key,
                                      organization_other: item.key === 'Other' ? (brief.details?.organization_other || '') : undefined
                                    });
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border select-none active:scale-[0.97] ${
                                    isMatch
                                      ? item.activeClass
                                      : item.inactiveClass
                                  }`}
                                >
                                  <Icon size={13} className={isMatch ? "text-white shrink-0" : `${item.inactiveColor} shrink-0`} />
                                  <span className={isMatch ? "font-bold" : "font-semibold"}>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {isOtherSelected && (
                            <input
                              type="text"
                              defaultValue={['OTHER', 'อื่นๆ', 'OTHERS'].includes(currentOrg.toUpperCase()) ? (brief.details?.organization_other || '') : currentOrg}
                              placeholder="ระบุชื่อหน่วยงานอื่นๆ (เช่น คณะ, สถาบัน หรือ หน่วยงานภายนอก)..."
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                onUpdateField(brief.id, 'details', {
                                  ...brief.details,
                                  organization: val || 'อื่นๆ',
                                  organization_other: val
                                });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400"
                            />
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>

                {/* 2. DYNAMIC FIELDS BY UNIT */}
                {unit === 'creative' && (
                  <>
                    <DetailRow 
                      icon={<Calendar size={14} className="text-orange-500 shrink-0" />} 
                      label="วันที่ต้องการดราฟแรก (Draft Date)" 
                      value={brief.details?.draft_date} 
                      fieldKey="draft_date" 
                      isDate
                    />
                    <DetailRow 
                      icon={<Flame size={14} className="text-red-500 shrink-0" />} 
                      label="วันที่ใช้งานจริง (Usage Date)" 
                      value={brief.details?.usage_date} 
                      fieldKey="usage_date" 
                      isDate
                    />
                    <DetailRow 
                      icon={<Flag size={14} className="text-orange-500 shrink-0" />} 
                      label="วัตถุประสงค์ (Objective)" 
                      value={brief.details?.objective} 
                      fieldKey="objective" 
                      isTextarea
                    />
                    <DetailRow 
                      icon={<Users size={14} className="text-blue-500 shrink-0" />} 
                      label="กลุ่มเป้าหมาย (Target Audience)" 
                      value={brief.details?.target_audience} 
                      fieldKey="target_audience" 
                    />
                    <DetailRow 
                      icon={<FileText size={14} className="text-amber-500 shrink-0" />} 
                      label="ข้อความ / เนื้อหาที่จะใส่ในงาน (Content Text)" 
                      value={brief.details?.content_text || brief.details?.notes || ""} 
                      fieldKey="content_text" 
                      isTextarea
                      rows={3}
                    />
                    <DetailRow 
                      icon={<Palette size={14} className="text-pink-500 shrink-0" />} 
                      label="โทนสีที่ต้องการ (Colors)" 
                      value={brief.details?.colors} 
                      fieldKey="colors" 
                    />
                    <DetailRow 
                      icon={<ListChecks size={14} className="text-emerald-500 shrink-0" />} 
                      label="สิ่งที่ต้องมีในงาน (Must Haves)" 
                      value={brief.details?.must_haves} 
                      fieldKey="must_haves" 
                    />
                    <DetailRow 
                      icon={<Ban size={14} className="text-rose-500 shrink-0" />} 
                      label="สิ่งที่ไม่ต้องการ / ห้ามมี (Must Not Haves)" 
                      value={brief.details?.must_not_haves} 
                      fieldKey="must_not_haves" 
                    />
                  </>
                )}

                {unit === 'content' && (
                  <>
                    <DetailRow 
                      icon={<Calendar size={14} className="text-red-500 shrink-0" />} 
                      label="กำหนดการเผยแพร่ผลงาน (Publish Date)" 
                      value={brief.details?.publish_date} 
                      fieldKey="publish_date" 
                      isDate
                    />
                    <DetailRow 
                      icon={<FileText size={14} className="text-amber-500 shrink-0" />} 
                      label="รายละเอียดงานโดยสังเขป (Content Details)" 
                      value={brief.details?.details || brief.details?.description || ""} 
                      fieldKey="details" 
                      isTextarea
                      rows={4}
                    />
                  </>
                )}

                {unit === 'pr' && (
                  <>
                    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 flex flex-col sm:table-row">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-top">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={14} className="text-indigo-500 shrink-0" />
                          <span className="font-semibold text-xs uppercase tracking-wider">วันและเวลาจัดกิจกรรม (เริ่ม - ถึง)</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-3 py-2 w-full sm:w-2/3 align-top">
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <div className="w-full sm:w-1/2 flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold shrink-0">เริ่ม:</span>
                            <DatePicker
                              selected={parseDateSafe(brief.details?.event_start || (brief.details?.event_datetime ? brief.details.event_datetime.split(" ถึง ")[0] : ""))}
                              onChange={(date: Date | null) => {
                                const startStr = date 
                                  ? (new Date(date.getTime() - date.getTimezoneOffset() * 60000)).toISOString().replace("T", " ").substring(0, 16)
                                  : "";
                                const endStr = brief.details?.event_end || (brief.details?.event_datetime && brief.details.event_datetime.includes(" ถึง ") ? brief.details.event_datetime.split(" ถึง ")[1] : "");
                                const combined = endStr ? `${startStr} ถึง ${endStr}` : startStr;
                                onUpdateField(brief.id, 'details', {
                                  ...brief.details,
                                  event_start: startStr,
                                  event_end: endStr,
                                  event_datetime: combined,
                                  usage_date: startStr ? startStr.split(" ")[0] : brief.details?.usage_date
                                });
                                if (startStr) {
                                  onUpdateField(brief.id, 'deadline', startStr.split(" ")[0]);
                                }
                              }}
                              dateFormat="yyyy-MM-dd HH:mm"
                              showTimeSelect
                              timeIntervals={15}
                              isClearable
                              placeholderText="วันและเวลาเริ่มต้น..."
                              popperClassName="z-[80] shadow-2xl"
                              className="w-full text-xs font-semibold text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-200 focus:border-primary rounded px-2.5 py-1.5 focus:outline-none cursor-pointer transition-colors"
                            />
                          </div>
                          <div className="w-full sm:w-1/2 flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold shrink-0">ถึง:</span>
                            <DatePicker
                              selected={parseDateSafe(brief.details?.event_end || (brief.details?.event_datetime && brief.details.event_datetime.includes(" ถึง ") ? brief.details.event_datetime.split(" ถึง ")[1] : ""))}
                              onChange={(date: Date | null) => {
                                const endStr = date 
                                  ? (new Date(date.getTime() - date.getTimezoneOffset() * 60000)).toISOString().replace("T", " ").substring(0, 16)
                                  : "";
                                const startStr = brief.details?.event_start || (brief.details?.event_datetime ? brief.details.event_datetime.split(" ถึง ")[0] : "");
                                const combined = endStr ? `${startStr} ถึง ${endStr}` : startStr;
                                onUpdateField(brief.id, 'details', {
                                  ...brief.details,
                                  event_start: startStr,
                                  event_end: endStr,
                                  event_datetime: combined
                                });
                              }}
                              dateFormat="yyyy-MM-dd HH:mm"
                              showTimeSelect
                              timeIntervals={15}
                              isClearable
                              placeholderText="วันและเวลาสิ้นสุด..."
                              popperClassName="z-[80] shadow-2xl"
                              className="w-full text-xs font-semibold text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-200 focus:border-primary rounded px-2.5 py-1.5 focus:outline-none cursor-pointer transition-colors"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <DetailRow 
                      icon={<Calendar size={14} className="text-red-500 shrink-0" />} 
                      label="วันที่เผยแพร่ข่าว (Publish Date)" 
                      value={brief.details?.publish_date} 
                      fieldKey="publish_date" 
                      isDate
                    />
                    <DetailRow 
                      icon={<MapPin size={14} className="text-emerald-500 shrink-0" />} 
                      label="สถานที่จัดงาน (Location)" 
                      value={brief.details?.location} 
                      fieldKey="location" 
                    />
                    <DetailRow 
                      icon={<Users size={14} className="text-purple-500 shrink-0" />} 
                      label="บุคคลสำคัญที่เกี่ยวข้อง (Key Persons)" 
                      value={brief.details?.key_persons} 
                      fieldKey="key_persons" 
                    />
                    <DetailRow 
                      icon={<Camera size={14} className="text-blue-500 shrink-0" />} 
                      label="แหล่งที่มาของภาพข่าว (Photo Source)" 
                      value={brief.details?.photo_source} 
                      fieldKey="photo_source" 
                    />
                    <DetailRow 
                      icon={<FileText size={14} className="text-amber-500 shrink-0" />} 
                      label="รายละเอียดกิจกรรมโดยสังเขป (Event Details)" 
                      value={brief.details?.details || brief.details?.description || ""} 
                      fieldKey="details" 
                      isTextarea
                      rows={3}
                    />
                  </>
                )}

                {unit === 'internal' && (
                  <>
                    <DetailRow 
                      icon={<FileText size={14} className="text-amber-500 shrink-0" />} 
                      label="รายละเอียดงานภายใน (Task Details)" 
                      value={brief.details?.details || brief.details?.description || ""} 
                      fieldKey="details" 
                      isTextarea
                      rows={3}
                    />
                    {(brief.details?.project_code !== undefined || currentCategory === "PM โครงการของ CC" || brief.details?.revenue !== undefined) && (
                      <>
                        <DetailRow 
                          icon={<Tag size={14} className="text-blue-500 shrink-0" />} 
                          label="โค้ดโครงการ (Project Code)" 
                          value={brief.details?.project_code} 
                          fieldKey="project_code" 
                          placeholder="เช่น CC-2567-001"
                        />
                        {/* Sector: Government (R7) vs Private (R8) */}
                        <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 bg-blue-50/20 flex flex-col sm:table-row">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-middle">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Briefcase size={14} className="text-blue-600 shrink-0" />
                              <span className="font-semibold text-xs uppercase tracking-wider">ประเภทบริการ (R7/R8 & TIP)</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 w-full sm:w-2/3">
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateField(brief.id, 'details', { ...brief.details, client_sector: 'government' })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  (brief.details?.client_sector || 'government') === 'government'
                                    ? 'bg-[#18181B] text-white shadow-xs'
                                    : 'bg-white text-[#52525B] border border-[#D4D4D0] hover:bg-[#EAEAE7]'
                                }`}
                              >
                                {(brief.details?.client_sector || 'government') === 'government' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                                )}
                                <span>🏛️ ให้บริการภาครัฐ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateField(brief.id, 'details', { ...brief.details, client_sector: 'private' })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  brief.details?.client_sector === 'private'
                                    ? 'bg-[#18181B] text-white shadow-xs'
                                    : 'bg-white text-[#52525B] border border-[#D4D4D0] hover:bg-[#EAEAE7]'
                                }`}
                              >
                                {brief.details?.client_sector === 'private' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                                )}
                                <span>🏢 ให้บริการภาคเอกชน</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <DetailRow 
                          icon={<DollarSign size={14} className="text-[#71717A] shrink-0" />} 
                          label="รายรับ (Revenue)" 
                          value={brief.details?.revenue} 
                          fieldKey="revenue" 
                          placeholder="0"
                        />
                        <DetailRow 
                          icon={<DollarSign size={14} className="text-[#71717A] shrink-0" />} 
                          label="ต้นทุน (Cost)" 
                          value={brief.details?.cost} 
                          fieldKey="cost" 
                          placeholder="0"
                        />
                        <DetailRow 
                          icon={<TrendingUp size={14} className="text-[#71717A] shrink-0" />} 
                          label="กำไร (Profit)" 
                          value={brief.details?.profit} 
                          fieldKey="profit" 
                          placeholder="0"
                        />
                        {/* Work Type: DESIGN / CONTENT / PR */}
                        <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 bg-[#F4F4F2]/50 flex flex-col sm:table-row">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-middle">
                            <div className="flex items-center gap-2 text-[#3F3F46]">
                              <Sparkles size={14} className="text-[#71717A] shrink-0" />
                              <span className="font-semibold text-xs uppercase tracking-wider font-mono">ประเภทงาน PM (Work Type)</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 w-full sm:w-2/3">
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              {(['creative', 'content', 'pr'] as const).map(wType => {
                                const active = (brief.details?.pm_work_type || 'creative') === wType;
                                const label = wType === 'creative' ? 'DESIGN' : wType === 'content' ? 'CONTENT' : 'PR';
                                return (
                                  <button
                                    key={wType}
                                    type="button"
                                    onClick={() => onUpdateField(brief.id, 'details', {
                                      ...brief.details,
                                      pm_work_type: wType,
                                      pm_work_category: ''
                                    })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                                      active 
                                        ? 'bg-[#18181B] text-[#FAFAFA] shadow-xs' 
                                        : 'bg-white text-[#52525B] border border-[#D4D4D0] hover:bg-[#EAEAE7]'
                                    }`}
                                  >
                                    {active && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                                    )}
                                    <span>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>

                        {/* Work Sub-category dropdown */}
                        <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 flex flex-col sm:table-row">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-1/3 sm:border-r border-slate-100 bg-slate-50/40 align-middle">
                            <div className="flex items-center gap-2 text-[#3F3F46]">
                              <Tag size={14} className="text-[#71717A] shrink-0" />
                              <span className="font-semibold text-xs uppercase tracking-wider font-mono">บริการย่อย / ขอบเขตงาน</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 w-full sm:w-2/3">
                            <select
                              value={brief.details?.pm_work_category || brief.details?.service_category || ''}
                              onChange={(e) => {
                                const newCat = e.target.value;
                                onUpdateField(brief.id, 'details', {
                                  ...brief.details,
                                  pm_work_category: newCat,
                                  service_category: newCat
                                });
                              }}
                              className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#D4D4D0] rounded-lg focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
                            >
                              <option value="">-- เลือกประเภทงานย่อย --</option>
                              {(ALL_CATEGORIES_BY_UNIT[brief.details?.pm_work_type || 'creative'] || []).map((cat) => (
                                <option key={cat.name} value={cat.name}>
                                  {cat.name} - {cat.desc}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      </>
                    )}
                  </>
                )}

                {/* Additional Notes (Common) */}
                <DetailRow 
                  icon={<AlertCircle size={14} className="text-slate-400 shrink-0" />} 
                  label="หมายเหตุเพิ่มเติม (Notes)" 
                  value={brief.notes || brief.details?.notes || ""} 
                  fieldKey="notes" 
                  isTextarea
                  rows={2}
                />

              </tbody>
            </table>
          </div>

          {/* Section: Attachments */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Paperclip size={15} className="text-blue-500" /> ไฟล์แนบ (Attachments)
            </div>
            
            {hasAttachments ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {brief.details.attachments.map((url: string, idx: number) => {
                  const urlWithoutQuery = url.split("?")[0];
                  const ext = urlWithoutQuery.split(".").pop()?.toUpperCase() || "FILE";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all text-xs font-semibold text-slate-700 shadow-2xs hover:shadow-xs group"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 truncate flex-1 min-w-0 mr-2"
                        title="คลิกเพื่อเปิดดูไฟล์"
                      >
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0 group-hover:scale-105 transition-transform">
                          <FileText size={18} />
                        </div>
                        <div className="truncate min-w-0">
                          <span className="truncate block text-slate-800 font-bold">ไฟล์ข้อมูลประกอบ {idx + 1}</span>
                          <span className="text-[10px] text-slate-400 font-normal block truncate">คลิกเพื่อดู ({ext})</span>
                        </div>
                      </a>

                      {/* Small Download Button on the Right with Save As Location Dialog */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDownloadingAttachmentIdx(idx);
                          try {
                            const urlWithoutQuery = url.split("?")[0];
                            const fileExt = urlWithoutQuery.split(".").pop() || ext.toLowerCase();
                            const rawName = urlWithoutQuery.split("/").pop();
                            const decodedName = rawName ? decodeURIComponent(rawName) : `attachment-${idx + 1}.${fileExt}`;
                            await downloadFileWithSaveDialog(url, decodedName);
                          } finally {
                            setDownloadingAttachmentIdx(null);
                          }
                        }}
                        disabled={downloadingAttachmentIdx === idx}
                        className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-[#ff4400] hover:border-[#ff4400] shadow-2xs transition-all flex items-center justify-center shrink-0 cursor-pointer group/btn"
                        title="เลือกตำแหน่งและบันทึกไฟล์ (Save As)"
                      >
                        {downloadingAttachmentIdx === idx ? (
                          <Loader2 size={14} className="animate-spin text-[#ff4400] group-hover:text-white" />
                        ) : (
                          <Download size={14} className="group-hover/btn:scale-110 transition-transform" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">ไม่มีไฟล์แนบในงานนี้</p>
            )}
          </div>

          {/* Timeline & Metadata History */}
          <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> ส่งบรีฟเมื่อ: <strong className="text-slate-700">{new Date(brief.created_at).toLocaleDateString('th-TH')}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> ระยะเวลา: <strong className="text-slate-700">{ages.pendingDays + ages.inProgressDays} วัน</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">สถานะ:</span>
              <span className="font-bold uppercase text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {brief.status}
              </span>
            </div>
          </div>

          {/* Section: Save Cost (มูลค่าที่ช่วยประหยัดให้องค์กร) - ด้านล่างสุด */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 rounded-xl border border-emerald-200 shadow-sm overflow-hidden p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <PiggyBank size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    มูลค่าที่ช่วยประหยัดให้องค์กร (Save Cost)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    คิดเป็นมูลค่าลดค่าใช้จ่ายให้แก่องค์กร แทนการจัดจ้างผลิตงานภายนอก (อ้างอิงราคามาตรฐาน Fastwork ต่ำสุดของ STeP)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {standardPrice !== null && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-600" /> ราคามาตรฐานหลังบ้าน: ฿{standardPrice.toLocaleString()}
                  </span>
                )}
                {isOthersCategory && (
                  <button
                    type="button"
                    onClick={() => setIsPromptPriceOpen(true)}
                    className="text-xs px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    💰 ระบุ Save Cost (งานอื่นๆ)
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Left: Save Cost Input & Display */}
              <div className="sm:col-span-6 bg-white/95 p-4 rounded-xl border border-emerald-100 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span> มูลค่า Save Cost (THB)
                  </span>
                  {standardPrice !== null && Number(localSaveCost) !== standardPrice && (
                    <button
                      type="button"
                      onClick={() => handleSaveCostChange(standardPrice)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-0.5"
                      title="รีเซ็ตกลับเป็นราคามาตรฐานหลังบ้าน"
                    >
                      ↺ ใช้ราคามาตรฐาน (฿{standardPrice.toLocaleString()})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-lg">฿</span>
                  <input
                    type="number"
                    min="0"
                    className={`w-full pl-9 pr-4 py-2.5 text-xl font-mono font-extrabold rounded-lg focus:bg-white focus:outline-none focus:ring-2 shadow-inner transition-colors ${
                      standardPrice !== null && Number(localSaveCost) !== standardPrice 
                        ? 'text-amber-950 bg-amber-50/40 border border-amber-300 focus:ring-amber-500/30' 
                        : 'text-emerald-950 bg-emerald-50/30 border border-emerald-200 focus:ring-emerald-500/30'
                    }`}
                    value={localSaveCost}
                    onChange={(e) => setLocalSaveCost(e.target.value)}
                    onBlur={() => {
                      const val = Number(localSaveCost) || 0;
                      if (val !== currentSaveCost) {
                        handleSaveCostChange(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pt-0.5">
                  {standardPrice !== null && Number(localSaveCost) !== standardPrice ? (
                    <span className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚡ ปรับราคาตามความซับซ้อนของงาน (มาตรฐาน ฿{standardPrice.toLocaleString()})
                    </span>
                  ) : (
                    <span className="text-emerald-700/80 font-medium flex items-center gap-1">
                      <Check size={13} className="text-emerald-600 shrink-0" /> คำนวณตามราคามาตรฐานหลังบ้าน
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px]">
                    *สามารถพิมพ์ปรับราคาได้เมื่อความซับซ้อนสูง
                  </span>
                </div>
              </div>

              {/* Right: Summary Card */}
              <div className="sm:col-span-6 bg-white/70 p-4 rounded-xl border border-emerald-100 text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-100/60">
                  <span className="text-slate-500">ประเภทงาน / บริการ:</span>
                  <span className="font-bold text-slate-800">{currentCategory || "-"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-emerald-100/60">
                  <span className="text-slate-500">อัตราตลาดอ้างอิง (STeP Market Rate):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {standardPrice !== null ? `฿${standardPrice.toLocaleString()}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500">รูปแบบการบริหารงบ:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                    🛡️ In-House Cost Saved
                  </span>
                </div>
              </div>

              {/* Breakdown by Owner and Assistants if assistants are configured */}
              {(() => {
                const assistantsList = (brief.details?.assistants || []).filter((a: any) => a.assignee_id && Number(a.percentage) > 0);
                if (assistantsList.length === 0) return null;
                const effectiveBaseVal = currentSaveCost;
                const totalAstPercent = assistantsList.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0);
                const ownerPercent = Math.max(0, 100 - totalAstPercent);
                const ownerName = assignees.find(a => a.id === brief.assignee_id)?.name || "เจ้าของงาน (Unassigned)";
                const ownerAmount = Math.round((effectiveBaseVal * ownerPercent) / 100);

                return (
                  <div className="sm:col-span-12 mt-1 pt-3 border-t border-emerald-200/60">
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-emerald-600" /> สัดส่วนแบ่งมูลค่า Save Cost รายบุคคล
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] font-normal">
                        รวม 100% = ฿{effectiveBaseVal.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-white/90 p-2.5 rounded-xl border shadow-xs flex items-center justify-between border-emerald-200/80">
                        <div className="min-w-0 pr-2">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            เจ้าของงาน ({ownerPercent}%)
                          </div>
                          <div className="text-xs font-bold text-slate-800 truncate" title={ownerName}>
                            {ownerName}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-700">
                            ฿{ownerAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {assistantsList.map((ast: any, i: number) => {
                        const astName = assignees.find(a => a.id === ast.assignee_id)?.name || `ผู้ช่วย #${i+1}`;
                        const astAmount = Math.round((effectiveBaseVal * Number(ast.percentage)) / 100);
                        return (
                          <div key={i} className="bg-white/90 p-2.5 rounded-xl border shadow-xs flex items-center justify-between border-emerald-200/80">
                            <div className="min-w-0 pr-2">
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                ผู้ช่วย ({ast.percentage}%)
                              </div>
                              <div className="text-xs font-bold text-slate-800 truncate" title={astName}>
                                {astName}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-bold text-emerald-700">
                                ฿{astAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] sm:text-xs text-slate-400 text-center sm:text-left">
            *ข้อมูลทั้งหมดบันทึกลงระบบอัตโนมัติเมื่อกดพิมพ์หรือแก้ไข
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง (Close)
          </button>
        </div>

      </div>

      {/* POPUP: Prompt Financials for "อื่นๆ" (Others) Category */}
      {isPromptPriceOpen && (
        <div className="fixed inset-0 bg-[#181a1c]/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-amber-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-full text-amber-600 shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">ระบุมูลค่าที่ช่วยประหยัดให้องค์กร (Save Cost)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  งานนี้เลือกประเภทเป็น "อื่นๆ" กรุณาระบุมูลค่าที่ช่วยประหยัดให้แก่องค์กรแทนการจ้างภายนอก
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  มูลค่าประหยัดงบประมาณ (Save Cost / THB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="เช่น 3500"
                    value={promptSaveCost}
                    onChange={(e) => setPromptSaveCost(e.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  ประเมินจากมูลค่าตลาดภายนอกที่องค์กรสามารถประหยัดได้
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPromptPriceOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ข้าม / ภายหลัง
              </button>
              <button
                type="button"
                onClick={handleSavePromptFinancials}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
              >
                บันทึกมูลค่า Save Cost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Satisfaction Survey Modal (5 Criteria) */}
      {showSatisfactionModal && (
        <SatisfactionSurveyModal
          brief={brief}
          assigneeName={assignees.find((a: any) => a.id === brief.assignee_id)?.name}
          onClose={() => setShowSatisfactionModal(false)}
          onSave={async (scores) => {
            const status = scores.status || (scores.comment?.includes("ไม่ทำแบบประเมิน") ? 'declined' : 'completed');
            await onUpdateField(brief.id, 'details', {
              ...brief.details,
              satisfaction_scores: scores,
              satisfaction_rate: scores.averagePercent,
              survey_status: status
            });
            setShowSatisfactionModal(false);
          }}
        />
      )}

      {/* In Progress Email Draft Modal */}
      {showInProgressEmailModal && (
        <InProgressEmailModal
          isOpen={showInProgressEmailModal}
          brief={brief}
          assignees={assignees}
          taskCode={taskCode}
          onConfirmSend={handleConfirmInProgressModal}
          onCancel={handleCancelInProgressModal}
        />
      )}

      {/* Completed Handover & Survey Email Draft Modal */}
      {showCompletedEmailModal && (
        <CompletedEmailModal
          isOpen={showCompletedEmailModal}
          brief={brief}
          assignees={assignees}
          taskCode={taskCode}
          onConfirmSend={handleConfirmCompletedModal}
          onCancel={handleCancelCompletedModal}
        />
      )}

    </div>,
    document.body
  );
}
