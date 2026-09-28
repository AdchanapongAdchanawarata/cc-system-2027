"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Mail, Send, X, Copy, Check, AlertCircle, Clock, 
  Calendar, User, Users, FileText, CheckCircle2, ChevronDown 
} from "lucide-react";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";
import { OFFICIAL_STEP_TEAMS } from "@/utils/teamAnalytics";

interface InProgressEmailModalProps {
  isOpen: boolean;
  brief: any;
  assignees: any[];
  taskCode: string;
  onConfirmSend: (emailData: { to: string; cc: string[]; subject: string; body: string; from?: string; senderName?: string }) => Promise<void>;
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
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !brief || !mounted) return null;

  // 1. Resolve Assignee details (คนทำงานของ CC)
  const assigneeMember = useMemo(() => {
    const found = (assignees || []).find((a: any) => a.id === brief.assignee_id);
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
  }, [assignees, brief.assignee_id]);

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
  const [ccEmails] = useState<string[]>(defaultCcEmails);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async () => {
    if (!toEmail || !toEmail.trim()) {
      alert("กรุณาระบุอีเมลของผู้สั่งงาน (PM) เพื่อจัดส่งอีเมลตั้งต้น");
      return;
    }

    setIsSending(true);
    try {
      await onConfirmSend({
        to: toEmail.trim(),
        cc: ccEmails,
        subject: emailSubject,
        body: emailBody,
        from: assigneeMember?.email || "cc@step.cmu.ac.th",
        senderName: assigneeMember?.fullName || assigneeMember?.name || "ทีม CC",
      });
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการส่งอีเมล: " + (err.message || "Unknown error"));
    } finally {
      setIsSending(false);
    }
  };

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

        {/* Notice Info Card (Dieter Rams Warm Accent: Black & Orange) */}
        <div className="px-6 pt-4 pb-1 shrink-0">
          <div className="bg-orange-50/50 border border-orange-200/70 rounded-2xl p-3.5 flex items-start gap-3 text-xs shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-zinc-900 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Mail size={14} />
            </div>
            <div className="space-y-0.5 text-zinc-700">
              <p className="font-bold text-zinc-900 text-xs flex items-center gap-2">
                <span>ข้อตกลงการเริ่มต้นงาน</span>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Email Thread กลาง
                </span>
              </p>
              <p className="text-[11.5px] leading-relaxed text-zinc-600">
                สถานะงานจะเปลี่ยนเป็น <strong className="text-[#E03131] font-bold">In Progress</strong> ทันทีเมื่อกด <strong>&ldquo;ส่งอีเมลเริ่มงาน&rdquo;</strong> โดยจะส่งบรีฟงานนี้ไปยังผู้สั่งงาน (PM) เพื่อใช้เป็น Email Thread ในการ Reply ส่งตรวจงานแต่ละดราฟจนเสร็จสิ้น หากกดยกเลิก งานจะคงอยู่ที่ <span className="font-semibold text-zinc-800">Pending</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs custom-scrollbar">
          
          {/* Row 0: From (Sender - คนทำงานหลัก CC) */}
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
              {ccEmails.map((email, idx) => (
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
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/10 rounded-2xl p-4 text-xs leading-relaxed text-zinc-800 focus:outline-none transition-all resize-y shadow-2xs custom-scrollbar"
              placeholder="เนื้อหาอีเมล..."
            />
          </div>

        </div>

        {/* Footer actions with Dieter Rams Iconic Red & Matte Black Buttons */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-300 hover:border-zinc-400 rounded-full hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs"
          >
            ยกเลิก (คงไว้ที่ Pending)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSending}
            className="px-5 sm:px-6 py-2.5 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] active:bg-[#b02525] rounded-full shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังส่งอีเมล...</span>
              </>
            ) : (
              <>
                <Send size={13} className="text-orange-100" />
                <span>ส่งอีเมล &amp; เริ่มสถานะ In Progress</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
