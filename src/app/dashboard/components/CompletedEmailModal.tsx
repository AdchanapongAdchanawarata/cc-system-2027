"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Mail,
  Send,
  X,
  ExternalLink,
  Users,
  FileText,
  User,
  Copy,
  Check,
  Star,
  Link2,
} from "lucide-react";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";
import { getTaskSurveyUrl } from "@/utils/surveyTokens";

interface CompletedEmailModalProps {
  isOpen: boolean;
  brief: any;
  assignees: any[];
  taskCode: string;
  onConfirmSend: (emailData: {
    to: string;
    cc: string[];
    subject: string;
    body: string;
    from?: string;
    senderName?: string;
    assigneeId?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CompletedEmailModal({
  isOpen,
  brief,
  assignees,
  taskCode,
  onConfirmSend,
  onCancel,
}: CompletedEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasEditedBody, setHasEditedBody] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [toEmail, setToEmail] = useState(brief?.requester_email || "");

  useEffect(() => {
    if (brief?.requester_email) {
      setToEmail(brief.requester_email);
    }
  }, [brief]);

  const teamLead = {
    name: "จิอม AA",
    fullName: "อภิชนพงศ์ อาจคงหาญ",
    email: "adchanapong@step.cmu.ac.th",
    position: "หัวหน้าฝ่ายสร้างสรรค์และสื่อสาร (Creative and Communication Lead)",
  };

  const assistantTeamLead = {
    name: "วา WK",
    fullName: "วสิตา เขียวดวงจันทร์",
    email: "wasita@step.cmu.ac.th",
    position: "ผู้ช่วยหัวหน้าฝ่ายสร้างสรรค์และสื่อสาร (Assistant Lead)",
  };

  const assigneeMember = useMemo(() => {
    if (!brief?.assignee_id) return null;
    const found = (assignees || []).find((a: any) => a.id === brief.assignee_id);
    if (!found) return null;
    const name = found.name || "";
    const meta = DEFAULT_MEMBER_METADATA[name] || {};

    return {
      id: found.id,
      name,
      fullName: meta.fullName || found.full_name || name,
      position: meta.position || found.position || "เจ้าหน้าที่ทีม CC",
      phone: meta.phone || found.phone || "053-948678",
      email: found.email || `${name.toLowerCase().replace(/\s+/g, "")}@step.cmu.ac.th`,
    };
  }, [brief, assignees]);

  const unit = (brief?.unit || "creative").toLowerCase();
  const isInternal = unit === "internal";

  const defaultCcEmails = useMemo(() => {
    const emails = new Set<string>();
    emails.add(teamLead.email);
    emails.add(assistantTeamLead.email);

    if (assigneeMember?.email) {
      emails.add(assigneeMember.email);
    }

    if (brief?.details?.assistants && Array.isArray(brief.details.assistants)) {
      brief.details.assistants.forEach((ast: any) => {
        const found = assignees.find((m) => m.id === ast.assignee_id);
        if (found?.email) emails.add(found.email);
      });
    }

    return Array.from(emails);
  }, [assigneeMember, brief, assignees, teamLead, assistantTeamLead]);

  const surveyUrl = useMemo(() => {
    if (!brief) return "";
    return getTaskSurveyUrl(brief.id, brief.assignee_id);
  }, [brief]);

  const emailSubject = useMemo(() => {
    const pName = brief?.project_name || "งาน";
    return `[CC TEAM] ส่งมอบงานเสร็จสมบูรณ์ & แบบประเมินความพึงพอใจ: ${taskCode} - ${pName}`;
  }, [taskCode, brief]);

  const initialEmailBody = useMemo(() => {
    if (!brief) return "";

    const pName = brief.project_name || "ไม่ระบุชื่องาน";
    const coordinator =
      brief.coordinator_nickname ||
      brief.requester_name ||
      brief.details?.coordinator_nickname ||
      "ผู้สั่งงาน";

    const rawTeam = brief.decision_maker || brief.details?.team || "";
    const requesterTeam = isInternal
      ? "ส่วนงานภายใน CC TEAM"
      : rawTeam || "STeP";

    const deadline = brief.deadline
      ? String(brief.deadline).split("T")[0]
      : "-";

    const femaleNames = ["วา", "จอย", "พิม", "เยียร์", "ลูกอิน", "นิน", "โอ๊ต", "เอ็นจอย", "แก้ว", "ต้า"];
    const isFemale = assigneeMember?.name
      ? femaleNames.some((n) => assigneeMember.name.includes(n))
      : false;
    const politeWord = isFemale ? "ค่ะ" : "ครับ";

    let text = "";
    if (isInternal) {
      text += `เรียน คุณ${teamLead.name} (${teamLead.position}) และทีมงาน CC\n\n`;
      text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC TEAM) ขอแจ้งให้ทราบว่า งานภายใน "${pName}" (${taskCode}) ได้ดำเนินการเสร็จสมบูรณ์ (Completed) เรียบร้อยแล้ว${politeWord}\n\n`;
    } else {
      text += `เรียน คุณ${coordinator} และทีมงาน ${requesterTeam}\n\n`;
      text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC TEAM) ขอแจ้งส่งมอบงาน "${pName}" (${taskCode}) ซึ่งได้ดำเนินการเสร็จสมบูรณ์ (Completed) เรียบร้อยแล้ว${politeWord}\n\n`;
    }

    text += `----------------------------------------\n`;
    text += `📋 ข้อมูลสรุปการส่งมอบงาน (Completion Summary):\n`;
    text += `• รหัสงาน (Task Code): ${taskCode}\n`;
    text += `• ชื่องาน / โครงการ: ${pName}\n`;
    text += `• ผู้รับผิดชอบหลัก: ${assigneeMember ? `${assigneeMember.fullName} (${assigneeMember.name})` : "ทีมงาน CC"}\n`;
    text += `• กำหนดส่งมอบงาน (Deadline): ${deadline}\n`;

    text += `\n----------------------------------------\n`;
    text += `⭐ แบบประเมินความพึงพอใจการให้บริการ (Satisfaction Survey):\n`;
    text += `เพื่อการพัฒนาและรักษามาตรฐานการให้บริการของทีม CC ขอความกรุณาคุณ${coordinator} สละเวลาทำแบบประเมินความพึงพอใจสั้นๆ ผ่านลิงก์ด้านล่างนี้${politeWord}\n\n`;
    text += `👉 ลิงก์แบบประเมิน: ${surveyUrl}\n\n`;

    text += `----------------------------------------\n`;
    text += `ทีมงาน CC ขอขอบพระคุณเป็นอย่างยิ่งที่ท่านได้ไว้วางใจให้ทีมงานดูแลผลงานชิ้นนี้ และหวังว่าจะได้ร่วมงานกันอีกในโอกาสต่อไป${politeWord}\n\n`;
    text += `ขอแสดงความนับถือ,\n`;
    text += `${assigneeMember ? `${assigneeMember.fullName} (${assigneeMember.name})` : "ทีมงาน CC"}\n`;
    text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)\n`;
    text += `อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)`;

    return text;
  }, [brief, taskCode, assigneeMember, isInternal, surveyUrl]);

  const [emailBody, setEmailBody] = useState(initialEmailBody);

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
    if (!toEmail || !toEmail.trim()) {
      alert("กรุณาระบุอีเมลของผู้สั่งงาน (PM) เพื่อจัดส่งอีเมลส่งมอบงาน");
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
        assigneeId: brief?.assignee_id,
      });
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || "Unknown error"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAndOpenGmail = async () => {
    if (!toEmail || !toEmail.trim()) {
      alert("กรุณาระบุอีเมลของผู้สั่งงาน (PM) เพื่อจัดส่งอีเมลส่งมอบงาน");
      return;
    }

    // 1. Copy full text to clipboard
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(emailBody);
      }
    } catch {
      // ignore
    }

    // 2. Safe URL length under 1,800 chars to avoid Gmail blank screen
    const targetTo = encodeURIComponent(toEmail.trim());
    const targetCc = encodeURIComponent(defaultCcEmails.join(","));
    const targetSubject = encodeURIComponent(emailSubject);

    const baseLength = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=`.length;
    const maxSafeBodyEncodedLength = Math.max(150, 1800 - baseLength);

    let urlBodyText = emailBody;
    if (encodeURIComponent(urlBodyText).length > maxSafeBodyEncodedLength) {
      const coordinator =
        brief?.coordinator_nickname ||
        brief?.requester_name ||
        "ผู้สั่งงาน";
      urlBodyText = `เรียน คุณ${coordinator} และทีมงาน\n\nทีม CC ขอส่งมอบงาน "${brief?.project_name || 'งาน'}" (${taskCode}) ที่เสร็จสมบูรณ์เรียบร้อยแล้วครับ\n\n⭐ ขอความกรุณาทำแบบประเมินความพึงพอใจ: ${surveyUrl}\n\n(รายละเอียดและข้อความฉบับเต็มถูกคัดลอกลงใน Clipboard แล้ว สามารถกด Ctrl+V เพื่อวางเพิ่มเติมได้ทันทีครับ)\n\nขอแสดงความนับถือ,\n${assigneeMember?.fullName || 'ทีมงาน CC'}`;
    }

    const targetBody = encodeURIComponent(urlBodyText);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=${targetBody}`;

    window.open(gmailUrl, "_blank");

    await handleSubmit();
  };

  if (!isOpen || !brief || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#181a1c]/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/90 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-mono font-bold px-3.5 py-1 rounded-full bg-zinc-900 text-white border border-zinc-800 shadow-2xs tracking-wide">
                {taskCode}
              </span>

              <span
                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs text-white ${
                  unit === "creative"
                    ? "bg-[#8b5cf6]"
                    : unit === "content"
                    ? "bg-[#ec4899]"
                    : unit === "pr"
                    ? "bg-[#1877F2]"
                    : unit === "internal"
                    ? "bg-[#18181b]"
                    : "bg-zinc-800"
                }`}
              >
                {unit}
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-900 font-bold">Completed</span>
                <span className="text-emerald-700 font-semibold">&amp; Evaluation</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                ร่างอีเมลส่งมอบงานและแบบประเมินความพึงพอใจ
              </h3>
              <p className="text-xs text-zinc-500 font-medium line-clamp-1 mt-0.5">
                {brief.project_name || "ไม่ระบุชื่องาน"}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/70 rounded-full transition-colors cursor-pointer shrink-0"
            title="ยกเลิกและคงไว้ที่ In Progress"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice Info Card: Option 1 */}
        <div className="px-6 pt-4 pb-1 shrink-0">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Star size={16} className="fill-white" />
            </div>
            <div className="space-y-1 text-zinc-700 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                  <span>ส่งมอบงานและแบบประเมินผ่าน Gmail (@step.cmu.ac.th)</span>
                </p>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ทางเลือกที่ 1 • ส่งจริง 100%
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-zinc-600">
                เมื่อกดปุ่ม <strong className="text-[#EA4335] font-bold">&ldquo;🚀 ส่งมอบงาน &amp; เปิดส่งใน Gmail&rdquo;</strong> ระบบจะปรับสถานะเป็น <strong className="text-zinc-900 font-bold">Completed</strong> พร้อมเปิดหน้าต่างเขียนจดหมาย Gmail ของท่าน โดยใส่ผู้รับ (PM), สำเนา (CC), หัวข้อ และลิงก์แบบประเมินความพึงพอใจไว้ครบถ้วนทันที เพื่อให้ท่านกดส่งจากกล่องเมลจริงและมีประวัติใน Sent Items
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs custom-scrollbar">
          
          {/* Row 0: Assignee Info */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                {assigneeMember?.name?.slice(0, 1) || "CC"}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">
                  {assigneeMember?.fullName || "ทีมงาน CC"}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {assigneeMember?.position || "ผู้รับผิดชอบงาน"} • {assigneeMember?.email}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              ผู้ส่งมอบงาน
            </span>
          </div>

          {/* Row 1: To (PM Email) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <User size={13} className="text-zinc-700" />
                <span>ส่งถึง (To - ผู้สั่งงาน / PM)</span>
                <span className="text-[#E03131] font-bold">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                {brief.coordinator_nickname ? `คุณ${brief.coordinator_nickname}` : ""}
              </span>
            </div>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/10 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-900 focus:outline-none transition-all shadow-2xs"
              placeholder="อีเมลผู้สั่งงาน เช่น pm@step.cmu.ac.th"
            />
          </div>

          {/* Row 2: CC */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Users size={13} className="text-zinc-700" />
                <span>สำเนาอัตโนมัติ (CC)</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-bold">
                คนทำงาน + หัวหน้าทีม + ผู้ช่วย
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl flex flex-wrap gap-1.5 items-center min-h-[42px]">
              {defaultCcEmails.map((email, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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

          {/* Row 4: Survey Link Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Link2 size={13} className="text-blue-600" />
              <span>ลิงก์แบบประเมินความพึงพอใจ (Satisfaction Survey Link):</span>
            </label>
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-blue-900 truncate">
                {surveyUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(surveyUrl);
                  alert("คัดลอกลิงก์แบบประเมินแล้ว");
                }}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-blue-700 border border-blue-200 hover:border-blue-300 shadow-2xs shrink-0 cursor-pointer"
              >
                คัดลอกลิงก์
              </button>
            </div>
          </div>

          {/* Row 5: Body with Copy button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-600" />
                <span>เนื้อหาอีเมลส่งมอบงาน (ตรวจสอบหรือปรับแก้ก่อนส่ง):</span>
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-zinc-300 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700 font-bold">คัดลอกแล้ว</span>
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
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-2xl p-4 text-xs leading-relaxed text-zinc-800 focus:outline-none transition-all resize-y shadow-2xs custom-scrollbar"
              placeholder="เนื้อหาอีเมลส่งมอบงาน..."
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-300 hover:border-zinc-400 rounded-full hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs text-center"
          >
            ยกเลิก (คงไว้ที่ In Progress)
          </button>

          <div className="flex items-center justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSendAndOpenGmail}
              disabled={isSending}
              className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#d93025] active:bg-[#c5221f] rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="ทางเลือกที่ 1: บันทึกส่งมอบงานและเปิดส่งใน Gmail (@step.cmu.ac.th)"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกส่งมอบงาน...</span>
                </>
              ) : (
                <>
                  <Mail size={14} className="text-white" />
                  <span>🚀 ส่งมอบงาน &amp; เปิดส่งใน Gmail</span>
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
