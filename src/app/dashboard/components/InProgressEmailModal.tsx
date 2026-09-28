"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Mail, Send, X, Copy, Check, AlertCircle, Clock, 
  Calendar, User, Users, FileText, CheckCircle2, ChevronDown, ExternalLink
} from "lucide-react";
import CustomSelect from "./CustomSelect";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";
import { OFFICIAL_STEP_TEAMS } from "@/utils/teamAnalytics";

interface InProgressEmailModalProps {
  isOpen: boolean;
  brief: any;
  assignees: any[];
  taskCode: string;
  onConfirmSend: (emailData: { to: string; cc: string[]; subject: string; body: string; from?: string; senderName?: string; assigneeId?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function InProgressEmailModal({
  isOpen,
  brief,
  assignees,
  taskCode,
  onConfirmSend,
  onCancel,
}: InProgressEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(brief?.assignee_id || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (brief?.assignee_id) {
      setSelectedAssigneeId(brief.assignee_id);
    }
  }, [brief?.assignee_id]);

  // 1. Resolve Assignee details (คนทำงานของ CC)
  const assigneeMember = useMemo(() => {
    const targetId = selectedAssigneeId || brief.assignee_id;
    const found = (assignees || []).find((a: any) => a.id === targetId);
    if (!found) return null;
    const name = found.name || "";
    const meta = DEFAULT_MEMBER_METADATA[name] || {};
    return {
      id: found.id,
      name,
      fullName: meta.fullName || found.full_name || name,
      position: meta.position || found.position || "เจ้าหน้าที่ทีม CC",
      phone: meta.phone || found.phone || "-",
      email: found.email || `${name.toLowerCase().replace(/\s+/g, "")}@step.cmu.ac.th`,
    };
  }, [assignees, brief.assignee_id, selectedAssigneeId]);

  // 2. Resolve Assistants (ถ้ามี)
  const assistantMembers = useMemo(() => {
    const list: any[] = [];
    const assistants = brief.details?.assistants || [];
    assistants.forEach((ast: any) => {
      const f = (assignees || []).find((a: any) => a.id === ast.assignee_id);
      if (f) {
        const meta = DEFAULT_MEMBER_METADATA[f.name] || {};
        list.push({
          name: f.name,
          fullName: meta.fullName || f.name,
          email: f.email || `${f.name.toLowerCase().replace(/\s+/g, "")}@step.cmu.ac.th`,
        });
      }
    });
    return list;
  }, [assignees, brief.details?.assistants]);

  // 3. Resolve Team Lead & Assistant Team Lead
  const teamLead = {
    name: "จ๊อบ AA",
    fullName: "นายอัจชนะพงษ์ อัจชนะวราทา",
    position: "หัวหน้าทีม (Team Leader)",
    email: "adchanapong@step.cmu.ac.th",
  };

  const assistantTeamLead = {
    name: "วา WK",
    fullName: "นางสาววาสิตา กอบธัญกิจ",
    position: "ผู้ช่วยหัวหน้าทีม (Assistant Team Leader)",
    email: "wasita@step.cmu.ac.th",
  };

  const unit = (brief.unit || "creative").toLowerCase();
  const isInternal = unit === "internal";

  // 4. Default To & CC recipients
  // In case of internal tasks: PM is Team Lead (คุณจ๊อบ AA - adchanapong@step.cmu.ac.th)
  const defaultToEmail = isInternal 
    ? teamLead.email 
    : (brief.requester_email || "");

  const defaultCcEmails = useMemo(() => {
    const set = new Set<string>();
    // คนทำงานหลัก CC
    if (assigneeMember?.email) set.add(assigneeMember.email);

    // ถ้าไม่ใช่งาน internal ให้ใส่หัวหน้าทีมใน CC (แต่งาน internal หัวหน้าทีมเป็นผู้รับหลัก To แล้ว ไม่ต้อง CC ซ้ำ)
    if (!isInternal) {
      set.add(teamLead.email);
    }

    // ผู้ช่วยหัวหน้าทีม
    set.add(assistantTeamLead.email);

    // ผู้ช่วยอื่นๆ ในงาน
    assistantMembers.forEach((ast) => {
      if (ast.email) set.add(ast.email);
    });
    return Array.from(set);
  }, [assigneeMember, assistantMembers, isInternal]);

  // States
  const [toEmail, setToEmail] = useState(defaultToEmail);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasEditedBody, setHasEditedBody] = useState(false);

  // Generate Email Subject
  const emailSubject = useMemo(() => {
    const pName = brief.project_name || "ไม่ระบุชื่องาน";
    return `[CC TEAM] เริ่มดำเนินการ: ${taskCode} - ${pName} (ตอบกลับอีเมลนี้เพื่อประสานงาน / ส่งดราฟงาน)`;
  }, [brief.project_name, taskCode]);

  // Generate Email Body with full brief details
  const initialEmailBody = useMemo(() => {
    const pName = brief.project_name || "ไม่ระบุชื่องาน";
    const coordinator = brief.coordinator_nickname || brief.requester_name || "ผู้สั่งงาน";
    
    // Matched Team
    const rawTeam = (brief.decision_maker || brief.details?.team || "").toString().trim();
    const matched = OFFICIAL_STEP_TEAMS.find((t) =>
      t.abbr.toUpperCase() === rawTeam.toUpperCase() ||
      rawTeam.toUpperCase().startsWith(t.abbr.toUpperCase() + " ") ||
      rawTeam.toUpperCase().startsWith(t.abbr.toUpperCase() + "-") ||
      t.th === rawTeam ||
      rawTeam.includes(t.th)
    );
    const requesterTeam = isInternal 
      ? "CC TEAM (งานภายในทีม)" 
      : (matched ? `${matched.abbr} - ${matched.th}` : (rawTeam || "STeP"));

    const category = brief.details?.category || brief.details?.type || brief.details?.service || "-";
    const deadline = brief.deadline ? String(brief.deadline).split("T")[0] : "-";
    const priority = brief.priority || brief.details?.priority || "Medium";

    // Polite particle based on Assignee gender
    const femaleNames = ["วา", "จอย", "พิม", "เยียร์", "ลูกอิน", "นิน", "โอ๊ต", "เอ็นจอย", "แก้ว", "ต้า"];
    const isFemale = assigneeMember?.name ? femaleNames.some((n) => assigneeMember.name.includes(n)) : false;
    const politeWord = isFemale ? "ค่ะ" : "ครับ";

    let text = "";
    if (isInternal) {
      text += `เรียน คุณ${teamLead.name} (${teamLead.position}) และทีมงาน CC\n\n`;
      text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC TEAM) ขอแจ้งให้ทราบว่า งานภายใน "${pName}" (${taskCode}) ได้รับการจัดสรรผู้รับผิดชอบ และกำลังเริ่มเข้าสู่กระบวนการดำเนินงาน (In Progress) เรียบร้อยแล้ว${politeWord}\n\n`;
    } else {
      text += `เรียน คุณ${coordinator} และทีมงาน ${requesterTeam}\n\n`;
      text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC TEAM) ขอแจ้งให้ทราบว่า บรีฟงาน "${pName}" (${taskCode}) ได้รับการจัดสรรผู้รับผิดชอบ และกำลังเริ่มเข้าสู่กระบวนการดำเนินงาน (In Progress) เรียบร้อยแล้ว${politeWord}\n\n`;
    }

    text += `----------------------------------------\n`;
    text += `👤 ข้อมูลผู้รับผิดชอบงานจากทีม CC:\n`;
    text += `• ผู้รับผิดชอบหลัก: ${assigneeMember ? `${assigneeMember.fullName} (${assigneeMember.name})` : "ทีมงาน CC"}\n`;
    if (assigneeMember) {
      text += `• ตำแหน่ง: ${assigneeMember.position}\n`;
      text += `• เบอร์โทรศัพท์ติดต่อ: ${assigneeMember.phone}\n`;
      text += `• อีเมล: ${assigneeMember.email}\n`;
    }
    if (assistantMembers.length > 0) {
      text += `• ผู้ช่วยร่วมทีม: ${assistantMembers.map((a) => `${a.fullName} (${a.name})`).join(", ")}\n`;
    }

    text += `\n----------------------------------------\n`;
    text += `📋 สรุปรายละเอียดบรีฟงาน (Brief Details):\n`;
    text += `• รหัสงาน (Task Code): ${taskCode}\n`;
    text += `• ชื่องาน / โครงการ: ${pName}\n`;
    text += `• ยูนิตที่ให้บริการ: ${unit.toUpperCase()} Unit\n`;
    text += `• ประเภทงาน / บริการ: ${category}\n`;
    text += `• ระดับความสำคัญ (Priority): ${priority}\n`;
    text += `• กำหนดส่งมอบงาน (Deadline): ${deadline}\n`;

    // Unit specific fields
    if (unit === "creative") {
      if (brief.details?.draft_date) text += `• วันที่ต้องการดราฟแรก: ${brief.details.draft_date}\n`;
      if (brief.details?.usage_date) text += `• วันที่ใช้งานจริง: ${brief.details.usage_date}\n`;
      if (brief.details?.objective) text += `• วัตถุประสงค์งาน: ${brief.details.objective}\n`;
      if (brief.details?.target_audience) text += `• กลุ่มเป้าหมาย: ${brief.details.target_audience}\n`;
      if (brief.details?.content_text || brief.details?.notes) {
        text += `• ข้อความ/เนื้อหาในงาน: ${brief.details.content_text || brief.details.notes}\n`;
      }
      if (brief.details?.colors) text += `• โทนสีที่ต้องการ: ${brief.details.colors}\n`;
      if (brief.details?.must_haves) text += `• สิ่งที่ต้องมีในงาน: ${brief.details.must_haves}\n`;
      if (brief.details?.must_not_haves) text += `• สิ่งที่ไม่ต้องการ/ห้ามมี: ${brief.details.must_not_haves}\n`;
    } else if (unit === "content") {
      if (brief.details?.publish_date) text += `• วันที่เผยแพร่ผลงาน: ${brief.details.publish_date}\n`;
      if (brief.details?.details || brief.details?.description) {
        text += `• รายละเอียดงานโดยสังเขป:\n${brief.details.details || brief.details.description}\n`;
      }
    } else if (unit === "pr") {
      if (brief.details?.event_datetime) text += `• วันเวลาจัดกิจกรรม: ${brief.details.event_datetime}\n`;
      if (brief.details?.publish_date) text += `• วันที่เผยแพร่ข่าว: ${brief.details.publish_date}\n`;
      if (brief.details?.location) text += `• สถานที่จัดงาน: ${brief.details.location}\n`;
      if (brief.details?.key_persons) text += `• บุคคลสำคัญที่เกี่ยวข้อง: ${brief.details.key_persons}\n`;
      if (brief.details?.photo_source) text += `• แหล่งที่มาภาพข่าว: ${brief.details.photo_source}\n`;
      if (brief.details?.details || brief.details?.description) {
        text += `• รายละเอียดกิจกรรมโดยสังเขป:\n${brief.details.details || brief.details.description}\n`;
      }
    } else if (unit === "internal") {
      if (brief.details?.project_code) text += `• โค้ดโครงการ: ${brief.details.project_code}\n`;
      if (brief.details?.details || brief.details?.description) {
        text += `• รายละเอียดงาน:\n${brief.details.details || brief.details.description}\n`;
      }
    }

    if (brief.notes && brief.notes !== brief.details?.content_text) {
      text += `• หมายเหตุเพิ่มเติม: ${brief.notes}\n`;
    }

    text += `\n----------------------------------------\n`;
    text += `📌 ข้อตกลงการประสานงาน (สำคัญมาก):\n`;
    if (isInternal) {
      text += `1. ขอความกรุณาใช้ "อีเมลฉบับนี้" เป็นอีเมลตั้งต้น (Email Thread) ในการ Reply พูดคุย สอบถาม ประสานงานแก้ไข และส่งตรวจงานแต่ละดราฟ (Draft 1, 2, Final) จนกระทั่งเสร็จสิ้นโครงการ\n`;
      text += `2. ทางทีมงาน CC ได้สำเนา (CC) ผู้ช่วยหัวหน้าทีม (${assistantTeamLead.name}) และผู้เกี่ยวข้อง เพื่อร่วมกำกับดูแลความเรียบร้อยและมาตรฐานการส่งมอบงานในทุกขั้นตอน${politeWord}\n\n`;
    } else {
      text += `1. ขอความกรุณาใช้ "อีเมลฉบับนี้" เป็นอีเมลตั้งต้น (Email Thread) ในการ Reply พูดคุย สอบถาม ประสานงานแก้ไข และส่งตรวจงานแต่ละดราฟ (Draft 1, 2, Final) จนกระทั่งเสร็จสิ้นโครงการ\n`;
      text += `2. ทางทีมงาน CC ได้สำเนา (CC) หัวหน้าทีม (${teamLead.name}) และผู้ช่วยหัวหน้าทีม (${assistantTeamLead.name}) เพื่อร่วมกำกับดูแลความเรียบร้อยและมาตรฐานการส่งมอบงานในทุกขั้นตอน${politeWord}\n\n`;
    }

    text += `จึงเรียนมาเพื่อโปรดทราบและเริ่มต้นการดำเนินงานร่วมกัน${politeWord}\n\n`;
    text += `ขอแสดงความนับถือ,\n`;
    text += `${assigneeMember ? `${assigneeMember.fullName} (${assigneeMember.name})` : "ทีมงาน CC"}\n`;
    text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)\n`;
    text += `อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)`;

    return text;
  }, [brief, taskCode, assigneeMember, assistantMembers, isInternal, unit]);

  const [emailBody, setEmailBody] = useState(initialEmailBody);

  // Automatically update email body when assignee changes (unless user made custom manual edits)
  useEffect(() => {
    if (!hasEditedBody) {
      setEmailBody(initialEmailBody);
    }
  }, [initialEmailBody, hasEditedBody]);

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async () => {
    const targetAssigneeId = selectedAssigneeId || brief.assignee_id;
    if (!targetAssigneeId) {
      alert("⚠️ กรุณาเลือกผู้รับผิดชอบงาน (Assignee) ก่อนส่งอีเมลเริ่มงาน เพื่อให้ข้อมูลในระบบและข้อความแจ้งเริ่มงานสมบูรณ์ครับ");
      return;
    }

    if (!toEmail || !toEmail.trim()) {
      alert("กรุณาระบุอีเมลของผู้สั่งงาน (PM) เพื่อจัดส่งอีเมลตั้งต้น");
      return;
    }

    setIsSending(true);
    try {
      await onConfirmSend({
        to: toEmail.trim(),
        cc: defaultCcEmails,
        subject: emailSubject,
        body: emailBody,
        from: assigneeMember?.email || "cc@step.cmu.ac.th",
        senderName: assigneeMember?.fullName || assigneeMember?.name || "ทีม CC",
        assigneeId: targetAssigneeId,
      });
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการส่งอีเมล: " + (err.message || "Unknown error"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAndOpenGmail = async () => {
    const targetAssigneeId = selectedAssigneeId || brief?.assignee_id;
    if (!targetAssigneeId) {
      alert("⚠️ กรุณาเลือกผู้รับผิดชอบงาน (Assignee) ก่อนส่งอีเมลเริ่มงาน เพื่อให้ข้อมูลในระบบและข้อความแจ้งเริ่มงานสมบูรณ์ครับ");
      return;
    }

    if (!toEmail || !toEmail.trim()) {
      alert("กรุณาระบุอีเมลของผู้สั่งงาน (PM) เพื่อจัดส่งอีเมลตั้งต้น");
      return;
    }

    // Copy to clipboard as safety backup
    try {
      navigator.clipboard.writeText(emailBody);
    } catch {
      // ignore
    }

    // Open Gmail Compose window immediately (before async await) to avoid popup blocker
    const targetTo = encodeURIComponent(toEmail.trim());
    const targetCc = encodeURIComponent(defaultCcEmails.join(','));
    const targetSubject = encodeURIComponent(emailSubject);
    const targetBody = encodeURIComponent(emailBody);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=${targetBody}`;
    
    window.open(gmailUrl, '_blank');

    await handleSubmit();
  };

  const handleSendAndOpenMailto = async () => {
    const targetAssigneeId = selectedAssigneeId || brief?.assignee_id;
    if (!targetAssigneeId) {
      alert("⚠️ กรุณาเลือกผู้รับผิดชอบงาน (Assignee) ก่อนส่งอีเมลเริ่มงานครับ");
      return;
    }

    if (!toEmail || !toEmail.trim()) {
      alert("กรุณาระบุอีเมลของผู้สั่งงาน (PM)");
      return;
    }

    const targetTo = encodeURIComponent(toEmail.trim());
    const targetCc = encodeURIComponent(defaultCcEmails.join(','));
    const targetSubject = encodeURIComponent(emailSubject);
    const targetBody = encodeURIComponent(emailBody);
    window.location.href = `mailto:${targetTo}?cc=${targetCc}&subject=${targetSubject}&body=${targetBody}`;

    await handleSubmit();
  };

  if (!isOpen || !brief || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#181a1c]/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        
        {/* Header with Dieter Rams Black & Accent Badges */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/90 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Task Code (Matte Black Pill) */}
              <span className="text-xs sm:text-sm font-mono font-bold px-3.5 py-1 rounded-full bg-zinc-900 text-white border border-zinc-800 shadow-2xs tracking-wide">
                {taskCode}
              </span>

              {/* Unit Badge */}
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs text-white ${
                unit === "creative" ? "bg-[#8b5cf6]" :
                unit === "content" ? "bg-[#ec4899]" :
                unit === "pr" ? "bg-[#1877F2]" :
                unit === "internal" ? "bg-[#18181b]" : "bg-zinc-800"
              }`}>
                {unit}
              </span>

              {/* Status Badge (Rams Orange & Red Dot) */}
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E03131] animate-pulse" />
                <span className="text-zinc-900 font-bold">Kickoff</span>
                <span className="text-orange-600 font-semibold">&amp; In Progress</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                ร่างอีเมลแจ้งเริ่มงานและบรีฟข้อความใน Task
              </h3>
              <p className="text-xs text-zinc-500 font-medium line-clamp-1 mt-0.5">
                {brief.project_name || "ไม่ระบุชื่องาน"}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/70 rounded-full transition-colors cursor-pointer shrink-0"
            title="ยกเลิกและคงไว้ที่ Pending"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice Info Card: Option 1 (Gmail @step.cmu.ac.th) */}
        <div className="px-6 pt-4 pb-1 shrink-0">
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#EA4335] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Mail size={16} />
            </div>
            <div className="space-y-1 text-zinc-700 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                  <span>ส่งอีเมลเริ่มงานผ่าน Gmail (@step.cmu.ac.th)</span>
                </p>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ทางเลือกที่ 1 • ส่งจริง 100%
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-zinc-600">
                เมื่อกดปุ่ม <strong className="text-[#EA4335] font-bold">&ldquo;🚀 เริ่มงาน &amp; เปิดส่งใน Gmail&rdquo;</strong> ระบบจะปรับสถานะเป็น <strong className="text-zinc-900 font-bold">In Progress</strong> พร้อมเปิดหน้าต่างเขียนจดหมาย Gmail ของท่าน โดยใส่ผู้รับ (PM), สำเนา (CC), หัวข้อ และสรุปบรีฟงานไว้ครบถ้วนทันที เพื่อให้ท่านตรวจสอบและกดปุ่ม Send ส่งออกจากกล่องจดหมายจริงของคุณ 100% (มีประวัติใน Sent Items)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs custom-scrollbar">
          
          {/* Row 0: Assignee Selector */}
          <div className={`space-y-1.5 p-3 rounded-2xl border transition-all ${
            !selectedAssigneeId 
              ? "bg-rose-50/70 border-rose-200" 
              : "bg-orange-50/40 border-orange-200/70"
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <User size={13} className="text-[#f97316]" />
                <span>ผู้รับผิดชอบงานจากทีม CC (Assignee)</span>
                <span className="text-[#E03131] font-bold">*</span>
              </label>
              {!selectedAssigneeId ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E03131] text-white">
                  จำเป็นต้องเลือกคนรับผิดชอบ
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  กำหนดแล้ว
                </span>
              )}
            </div>
            <CustomSelect
              value={selectedAssigneeId}
              onChange={(val) => setSelectedAssigneeId(val)}
              placeholder="-- กรุณาเลือกผู้รับผิดชอบงานทีม CC --"
              triggerClassName="w-full text-xs font-semibold bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#f97316] rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between shadow-2xs h-[40px]"
              dropdownClassName="w-full max-h-64 shadow-xl rounded-xl border border-zinc-200 p-1"
              options={[
                { value: "", label: "-- กรุณาเลือกผู้รับผิดชอบงานทีม CC --" },
                ...assignees.map((a: any) => {
                  const meta = DEFAULT_MEMBER_METADATA[a.name] || {};
                  const unitColor = 
                    a.unit?.toLowerCase() === "creative" ? "bg-purple-100 text-purple-700" :
                    a.unit?.toLowerCase() === "content" ? "bg-pink-100 text-pink-700" :
                    a.unit?.toLowerCase() === "pr" ? "bg-blue-100 text-blue-700" :
                    "bg-zinc-100 text-zinc-700";
                  return {
                    value: a.id,
                    label: (
                      <div className="flex items-center justify-between gap-2 py-0.5 w-full">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {a.name.slice(0, 1)}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-xs text-zinc-900 block truncate">{a.name} ({meta.fullName || a.full_name || a.name})</span>
                            <span className="text-[10.5px] text-zinc-400 block truncate">{meta.position || a.position || "ทีม CC"}</span>
                          </div>
                        </div>
                        {a.unit && (
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${unitColor}`}>
                            {a.unit}
                          </span>
                        )}
                      </div>
                    )
                  };
                })
              ]}
              renderValue={(val) => {
                const a = assignees.find((item: any) => item.id === val);
                if (!a) return <span className="text-zinc-400">-- กรุณาเลือกผู้รับผิดชอบงานทีม CC --</span>;
                const meta = DEFAULT_MEMBER_METADATA[a.name] || {};
                return (
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-zinc-900">{a.name}</span>
                    <span className="text-zinc-500 font-normal truncate">({meta.fullName || a.full_name || a.name})</span>
                    <span className="text-xs text-orange-600 font-medium shrink-0">• {meta.position || a.position || "ทีม CC"}</span>
                  </div>
                );
              }}
            />
          </div>

          {/* Row 0.5: From (Sender - คนทำงานหลัก CC) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Mail size={13} className="text-[#f97316]" />
                <span>อีเมลต้นทางผู้ส่ง (From: ผู้รับผิดชอบงาน CC)</span>
              </label>
              <span className="text-[11px] text-zinc-400">ระบบส่งและตั้ง Reply-To ในนามคนทำงานหลัก</span>
            </div>
            <div className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E03131]" />
                <span className="text-xs font-bold text-zinc-900">
                  {assigneeMember ? `${assigneeMember.fullName} (${assigneeMember.name})` : "ทีมงานสร้างสรรค์และการสื่อสาร (CC TEAM)"}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  &lt;{assigneeMember ? assigneeMember.email : "cc@step.cmu.ac.th"}&gt;
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Sender / Reply-To
              </span>
            </div>
          </div>

          {/* Row 1: To (PM / หัวหน้าทีมถ้าเป็น Internal) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <User size={13} className="text-[#f97316]" />
                <span>{isInternal ? "ผู้รับหลัก (To: หัวหน้าทีม / PM งานภายใน)" : "ผู้รับหลัก (To: PM / ผู้สั่งงาน)"}</span>
                <span className="text-[#E03131] font-bold">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                {isInternal ? "งาน Internal กำหนดส่งถึงหัวหน้าทีม (คุณจ๊อบ AA)" : "จำเป็นต้องระบุเพื่อจัดส่งอีเมล"}
              </span>
            </div>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder={isInternal ? "adchanapong@step.cmu.ac.th" : "กรอกอีเมลผู้สั่งงาน เช่น requester@step.cmu.ac.th"}
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/10 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:outline-none transition-all shadow-2xs placeholder:text-zinc-400"
            />
          </div>

          {/* Row 2: CC (CC Assignee, Lead, Assistant Lead, Assistants) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Users size={13} className="text-zinc-700" />
                <span>สำเนาอัตโนมัติ (CC)</span>
              </label>
              <span className="text-[11px] text-orange-600 font-bold">
                {isInternal ? "คนทำงาน + ผู้ช่วยหัวหน้าทีม" : "คนทำงาน + หัวหน้าทีม + ผู้ช่วย"}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl flex flex-wrap gap-1.5 items-center min-h-[42px]">
              {defaultCcEmails.map((email, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                  <span>{email}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Row 3: Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <FileText size={13} className="text-zinc-700" />
              <span>หัวข้ออีเมล (Subject)</span>
            </label>
            <div className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-semibold text-zinc-900 select-all leading-relaxed shadow-2xs">
              {emailSubject}
            </div>
          </div>

          {/* Row 4: Body with Copy button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <FileText size={13} className="text-[#f97316]" />
                <span>เนื้อหาบรีฟในอีเมล (ตรวจสอบหรือปรับแก้ข้อความก่อนส่ง):</span>
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-zinc-300 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-[#E03131] stroke-[2.5]" />
                    <span className="text-[#E03131] font-bold">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} className="text-zinc-500" />
                    <span>คัดลอกข้อความ</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={10}
              value={emailBody}
              onChange={(e) => {
                setEmailBody(e.target.value);
                setHasEditedBody(true);
              }}
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/10 rounded-2xl p-4 text-xs leading-relaxed text-zinc-800 focus:outline-none transition-all resize-y shadow-2xs custom-scrollbar"
              placeholder="เนื้อหาอีเมล..."
            />
          </div>

        </div>

        {/* Footer actions with Dieter Rams Iconic Red & Matte Black Buttons */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-300 hover:border-zinc-400 rounded-full hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs text-center"
            >
              ยกเลิก (คงไว้ที่ Pending)
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSending}
              className="hidden sm:inline-flex px-3 py-2 text-[11.5px] font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-full transition-all cursor-pointer disabled:opacity-50"
              title="เริ่มงานโดยไม่เปิดหน้าต่างอีเมล (กรณีได้แจ้ง PM ผ่านช่องทางอื่นแล้ว)"
            >
              เริ่มงานโดยไม่เปิดอีเมล
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {/* Secondary Option: Mailto / Outlook app */}
            <button
              type="button"
              onClick={handleSendAndOpenMailto}
              disabled={isSending}
              className="px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-300 hover:border-zinc-400 rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="เปิดในแอปเมลในเครื่อง เช่น Microsoft Outlook หรือ Apple Mail"
            >
              <Send size={12} className="text-zinc-500" />
              <span>เปิดใน Outlook / แอปเมล</span>
            </button>

            {/* Primary Option 1: Open and Send in Gmail (@step.cmu.ac.th) */}
            <button
              type="button"
              onClick={handleSendAndOpenGmail}
              disabled={isSending}
              className="px-5 sm:px-6 py-2.5 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#d93025] active:bg-[#c5221f] rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="ทางเลือกที่ 1: บันทึกเริ่มงานและเปิดร่างอีเมลใน Gmail (@step.cmu.ac.th) เพื่อกด Send ส่งจริง"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกเริ่มงาน...</span>
                </>
              ) : (
                <>
                  <Mail size={14} className="text-white" />
                  <span>🚀 เริ่มงาน &amp; เปิดส่งใน Gmail</span>
                  <ExternalLink size={12} className="opacity-90" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
