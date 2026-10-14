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
import { DEFAULT_MEMBER_METADATA, parseMemberRecord } from "@/utils/memberProfile";
import { getTaskSurveyUrl } from "@/utils/surveyTokens";
import { isRspTask } from "@/utils/pricing";
import { Assignee3DAvatarBadge } from "@/components/Assignee3DAvatarBadge";

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

  const unit = (brief?.unit || "creative").toLowerCase();
  const isInternal = unit === "internal";
  const isRsp = useMemo(() => isRspTask(brief), [brief]);

  const defaultToEmail = isRsp
    ? (brief?.requester_email || brief?.details?.reporter_contact || "")
    : isInternal || brief?.requester_email === "internal@step.cmu.ac.th"
      ? "adchanapong@step.cmu.ac.th"
      : (brief?.requester_email || "");
  const [toEmail, setToEmail] = useState(defaultToEmail);

  useEffect(() => {
    if (isRsp) {
      setToEmail(brief?.requester_email || brief?.details?.reporter_contact || "");
    } else if (isInternal || brief?.requester_email === "internal@step.cmu.ac.th") {
      setToEmail("adchanapong@step.cmu.ac.th");
    } else if (brief?.requester_email) {
      setToEmail(brief.requester_email);
    }
  }, [brief, isInternal, isRsp]);

  const teamLead = {
    name: "จ๊อบ AA",
    fullName: "นายอัจชนะพงษ์ อัจชนะวราทา",
    email: "adchanapong@step.cmu.ac.th",
    position: "หัวหน้าทีม (Team Leader)",
  };

  const assistantTeamLead = {
    name: "วา WK",
    fullName: "นางสาววาสิตา กอบธัญกิจ",
    email: "wasita@step.cmu.ac.th",
    position: "ผู้ช่วยหัวหน้าทีม (Assistant Team Leader)",
  };

  const assigneeMember = useMemo(() => {
    if (!brief?.assignee_id) return null;
    const found = (assignees || []).find((a: any) => a.id === brief.assignee_id);
    if (!found) return null;
    return parseMemberRecord(found);
  }, [brief, assignees]);

  // Resolve CC recipients with clean nicknames (e.g. จ๊อบ, วา)
  const defaultCcRecipients = useMemo(() => {
    const list: { email: string; nickname: string; name: string; fullName: string }[] = [];
    const seenEmails = new Set<string>();

    // Current sender's email (คนทำงานหลัก ไม่ต้อง CC ตัวเองที่เป็นคนส่ง)
    const senderEmail = assigneeMember?.email?.toLowerCase().trim();
    const senderCmuEmail = assigneeMember?.cmuEmail?.toLowerCase().trim();

    const addCc = (email: string, rawName: string, fullName: string) => {
      if (!email) return;
      const lower = email.toLowerCase().trim();
      // ไม่ CC ตัวเองที่เป็นผู้ส่ง (จาก:)
      if (senderEmail && lower === senderEmail) return;
      if (senderCmuEmail && lower === senderCmuEmail) return;
      // ไม่ CC ซ้ำกับ To ในกรณี internal task ทั่วไป (To: คุณจ๊อบ) ยกเว้นงาน RSP
      if (isInternal && !isRsp && (lower === teamLead.email.toLowerCase() || lower === "adchanapong@step.cmu.ac.th")) return;
      if (seenEmails.has(lower)) return;
      seenEmails.add(lower);

      // ดึงชื่อเล่น เช่น "จ๊อบ AA" -> "จ๊อบ", "วา WK" -> "วา"
      const nickname = rawName.split(" ")[0].trim() || rawName;
      list.push({ email: lower, nickname, name: rawName, fullName });
    };

    // 1. หัวหน้าทีม (จ๊อบ) - ถ้าไม่ใช่งาน internal หรือเป็นงาน RSP ต้อง CC หัวหน้าทีมด้วย
    if (!isInternal || isRsp) {
      addCc(teamLead.email, teamLead.name, teamLead.fullName);
    }

    // 2. ผู้ช่วยหัวหน้าทีม (วา)
    addCc(assistantTeamLead.email, assistantTeamLead.name, assistantTeamLead.fullName);

    // 3. ผู้ช่วยอื่นๆ ในงาน (ถ้ามี)
    if (brief?.details?.assistants && Array.isArray(brief.details.assistants)) {
      brief.details.assistants.forEach((ast: any) => {
        const found = assignees.find((m) => m.id === ast.assignee_id);
        if (found?.email) {
          const meta = DEFAULT_MEMBER_METADATA[found.name] || {};
          addCc(found.email, found.name, meta.fullName || found.name);
        }
      });
    }

    return list;
  }, [assigneeMember, brief, assignees, isInternal, isRsp, teamLead, assistantTeamLead]);

  const defaultCcEmails = useMemo(() => {
    return defaultCcRecipients.map((r) => r.email);
  }, [defaultCcRecipients]);

  const ccNicknamesText = useMemo(() => {
    if (defaultCcRecipients.length === 0) return "";
    return defaultCcRecipients.map((r) => r.nickname).join(", ");
  }, [defaultCcRecipients]);

  // Requester Name for Salutation
  const rawRequesterName = (
    brief?.coordinator_nickname ||
    brief?.requester_name ||
    brief?.details?.reporter_name ||
    brief?.details?.client_name ||
    brief?.details?.coordinator_nickname ||
    brief?.details?.contact_name ||
    ""
  ).toString().trim();
  const cleanRequesterName = rawRequesterName.replace(/^คุณ\s*/, '').trim();
  const salutationTarget = isRsp
    ? (cleanRequesterName ? `คุณ${cleanRequesterName} (ผู้ประสานงาน RSP)` : "คุณผู้ประสานงานเครือข่าย RSP")
    : isInternal
      ? (cleanRequesterName ? `คุณ${cleanRequesterName}` : `คุณ${teamLead.name} (${teamLead.position}) และทีมงาน CC`)
      : (cleanRequesterName ? `คุณ${cleanRequesterName}` : "คุณผู้สั่งงาน");

  // Polite particle based on Assignee gender (ครับ / ค่ะ)
  const isAssigneeMale = useMemo(() => {
    if (!assigneeMember) return false;
    const fn = (assigneeMember.fullName || "").trim();
    const n = (assigneeMember.name || "").trim();
    if (fn.startsWith("นาย") || fn.startsWith("ผศ.ดร.สุริยะ") || fn.includes("อัจชนะพงษ์") || fn.includes("อิศรา")) {
      return true;
    }
    if (n.includes("จ๊อบ") || n.includes("ก้อง") || n.includes("บ่าว")) {
      return true;
    }
    return false;
  }, [assigneeMember]);
  const politeWord = isAssigneeMale ? "ครับ" : "ค่ะ";

  // Official Signature Block (ชื่อจริง, ตำแหน่ง, เบอร์โทร)
  const signatureBlock = useMemo(() => {
    const lines = ["ขอแสดงความนับถือ,"];
    if (assigneeMember) {
      if (assigneeMember.fullName) lines.push(assigneeMember.fullName);
      if (assigneeMember.position) lines.push(assigneeMember.position);
      if (assigneeMember.phone && assigneeMember.phone !== "-") {
        lines.push(`เบอร์โทร: ${assigneeMember.phone}`);
      }
    } else {
      lines.push("ทีมงาน CC");
      lines.push("ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)");
      lines.push("อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)");
    }
    return lines.join("\n");
  }, [assigneeMember]);

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
    const assigneeFullName = assigneeMember?.fullName || assigneeMember?.name || "ทีมงาน CC";
    const assigneePos = assigneeMember?.position || "ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)";
    const assigneePhone = (assigneeMember?.phone && assigneeMember.phone !== "-") ? assigneeMember.phone : "-";

    return `เรียน ${salutationTarget}\n\n` +
      `ทีม CC ขอส่งมอบงาน "${pName}" (${taskCode}) ซึ่งได้ดำเนินการเสร็จสมบูรณ์เรียบร้อยแล้ว${politeWord}\n\n` +
      `⭐ แบบประเมินความพึงพอใจการให้บริการ:\n` +
      `${surveyUrl}\n\n` +
      `ขอแสดงความนับถือ,\n` +
      `${assigneeFullName}\n` +
      `${assigneePos}\n` +
      `เบอร์โทร: ${assigneePhone}`;
  }, [brief, taskCode, assigneeMember, surveyUrl, salutationTarget, politeWord]);

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

    // Auto-Truncation Guard: Keep total encoded URL strictly under 6,000 bytes (Google server limit: 8,192 bytes)
    const targetTo = encodeURIComponent(toEmail.trim());
    const targetCc = encodeURIComponent(defaultCcEmails.join(","));
    const targetSubject = encodeURIComponent(emailSubject);

    let bodyToSend = emailBody;
    const baseLength = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=`.length;
    const maxSafeBodyEncoded = Math.max(500, 6000 - baseLength);

    if (encodeURIComponent(bodyToSend).length > maxSafeBodyEncoded) {
      const pName = brief?.project_name || "ไม่ระบุชื่องาน";
      const assigneeFullName = assigneeMember?.fullName || assigneeMember?.name || "ทีมงาน CC";
      const assigneePos = assigneeMember?.position || "ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)";
      const assigneePhone = (assigneeMember?.phone && assigneeMember.phone !== "-") ? assigneeMember.phone : "-";

      bodyToSend = `เรียน ${salutationTarget}\n\n` +
        `ทีม CC ขอส่งมอบงาน "${pName}" (${taskCode}) ซึ่งได้ดำเนินการเสร็จสมบูรณ์เรียบร้อยแล้ว${politeWord}\n\n` +
        `⭐ แบบประเมินความพึงพอใจการให้บริการ:\n` +
        `${surveyUrl}\n\n` +
        `ขอแสดงความนับถือ,\n` +
        `${assigneeFullName}\n` +
        `${assigneePos}\n` +
        `เบอร์โทร: ${assigneePhone}`;
    }

    const targetBody = encodeURIComponent(bodyToSend);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=${targetBody}`;

    window.open(gmailUrl, "_blank");

    await handleSubmit();
  };

  if (!isOpen || !brief || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#181a1c]/90 backdrop-blur-md z-[100000] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl h-[92vh] max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        
        {/* Sleek Gmail-style Title Bar */}
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white shrink-0">
              {taskCode}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-white shrink-0 ${
              unit === "creative" ? "bg-[#8b5cf6]" :
              unit === "content" ? "bg-[#ec4899]" :
              unit === "pr" ? "bg-[#1877F2]" :
              unit === "internal" ? "bg-[#3f3f46]" : "bg-zinc-800"
            }`}>
              {unit}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Completed &amp; Evaluation</span>
            </span>
            <span className="text-xs font-semibold text-zinc-300 truncate">
              ส่งมอบงาน • {brief.project_name || "ไม่ระบุชื่องาน"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyBody}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
              title="คัดลอกเนื้อหาทั้งหมด"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-400 font-bold">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy size={11} className="text-zinc-400" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Form Body - Clean Gmail Compose Window Style */}
        <div className="flex-1 flex flex-col overflow-hidden text-xs bg-white">
          
          {/* Gmail Metadata Section (Ultra-Minimal, Clean Gmail Compose Headers) */}
          <div className="px-4 py-1 border-b border-zinc-200 bg-white shrink-0 divide-y divide-zinc-100 text-[11px]">
            
            {/* Row 1: จาก (From) */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                <User size={11} className="text-emerald-600" />
                <span>จาก:</span>
              </span>
              <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                <Assignee3DAvatarBadge name={assigneeMember?.name} size={22} showBorder />
                <span className="font-bold text-zinc-900">{assigneeMember?.name || "ทีมงาน CC"}</span>
                {assigneeMember?.fullName && (
                  <span className="text-zinc-500 font-normal truncate hidden sm:inline">
                    ({assigneeMember.fullName})
                  </span>
                )}
                <span className="text-[11px] text-zinc-400 font-mono">
                  &lt;{assigneeMember?.email || "cc@step.cmu.ac.th"}&gt;
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 ml-auto">
                  ผู้ส่งมอบงาน
                </span>
              </div>
            </div>

            {/* Row 2: ถึง (To) with inline CC nicknames */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                <Mail size={11} className="text-zinc-400" />
                <span>ถึง:</span>
              </span>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder={
                    isRsp
                      ? "ระบุอีเมล PM ผู้ประสานงาน RSP เครือข่าย (เช่น user@step.cmu.ac.th)..."
                      : isInternal 
                        ? "adchanapong@step.cmu.ac.th (งานภายใน ส่งหัวหน้าทีม)" 
                        : "requester@step.cmu.ac.th (PM / ผู้สั่งงาน)"
                  }
                  className="flex-1 bg-transparent hover:bg-zinc-50 focus:bg-white border-0 px-1.5 text-xs font-medium text-zinc-900 focus:outline-none h-6 placeholder:text-zinc-400 truncate"
                />
                {defaultCcRecipients.length > 0 && (
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-400 font-medium text-[11px]">Cc:</span>
                    <span 
                      className="px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 text-[11px] font-semibold transition-colors cursor-help inline-flex items-center gap-1"
                      title={defaultCcRecipients.map((r) => `${r.name} (${r.fullName}) <${r.email}>`).join('\n')}
                    >
                      <Users size={11} className="text-zinc-500" />
                      <span>{ccNicknamesText}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: หัวข้อ (Subject) */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                <FileText size={11} className="text-zinc-400" />
                <span>หัวข้อ:</span>
              </span>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={emailSubject}
                  readOnly
                  className="w-full bg-transparent border-0 px-1.5 text-xs font-semibold text-zinc-800 focus:outline-none h-6 select-all truncate"
                />
              </div>
            </div>


          </div>

          {/* Textarea for Email Body (Takes all remaining vertical space >80%) */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <textarea
              value={emailBody}
              onChange={(e) => {
                setEmailBody(e.target.value);
                setHasEditedBody(true);
              }}
              className="w-full flex-1 p-3 text-xs font-mono sm:font-sans leading-relaxed text-zinc-800 focus:outline-none resize-none bg-white rounded-xl border border-transparent focus:border-zinc-200 hover:border-zinc-100 custom-scrollbar select-text"
              placeholder="เนื้อหาอีเมลส่งมอบงาน..."
              spellCheck={false}
            />

            {/* Official CC Email Signature with 2D Avatar (Requested by User: "ตัดที่กากบาทออกและขยายรูปให้ใหญ่ขึ้น") */}
            <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 border border-slate-200/80 flex items-center justify-between gap-3.5 shrink-0 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0 p-1 rounded-full bg-white border border-slate-200 shadow-sm">
                  <Assignee3DAvatarBadge name={assigneeMember?.name || brief?.assignee_name || "CC"} size={70} showBorder />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 truncate">
                      {assigneeMember?.fullName || assigneeMember?.name || "ทีมงาน CC"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 truncate mt-0.5">
                    {assigneeMember?.position || "พนักงานสร้างสรรค์และสื่อสารองค์กร (Creative and Communication Officer)"}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    เบอร์โทร: {assigneeMember?.phone && assigneeMember.phone !== "-" ? assigneeMember.phone : "-"} • อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            คงไว้ที่ IN PROGRESS
          </button>

          <button
            type="button"
            onClick={handleSendAndOpenGmail}
            disabled={isSending}
            className="px-5 py-2 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#d93025] active:bg-[#c5221f] rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="ส่งมอบงานและเปิดใน Gmail"
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
    </div>,
    document.body
  );
}
