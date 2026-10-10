"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Mail, Send, X, Copy, Check, AlertCircle, Clock, 
  Calendar, User, Users, FileText, CheckCircle2, ChevronDown, ExternalLink
} from "lucide-react";
import CustomSelect from "./CustomSelect";
import { DEFAULT_MEMBER_METADATA, parseMemberRecord } from "@/utils/memberProfile";
import { OFFICIAL_STEP_TEAMS } from "@/utils/teamAnalytics";
import { isRspTask } from "@/utils/pricing";
import { Assignee3DAvatarBadge } from "@/components/Assignee3DAvatarBadge";

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
    return parseMemberRecord(found);
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
  const isRsp = useMemo(() => isRspTask(brief), [brief]);

  // 4. Default To & CC recipients
  // In case of RSP tasks: PM is the network reporter/coordinator (brief.requester_email)
  // In case of internal tasks: PM is Team Lead (คุณจ๊อบ AA - adchanapong@step.cmu.ac.th)
  const defaultToEmail = isRsp
    ? (brief.requester_email || brief.details?.reporter_contact || "")
    : isInternal 
      ? teamLead.email 
      : (brief.requester_email || "");

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
      // ไม่ CC ซ้ำกับ To ในกรณี internal task ทั่วไป (To: คุณจ๊อบ) ยกเว้นงาน RSP ที่ To ส่งหา PM
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
    assistantMembers.forEach((ast) => {
      if (ast.email) {
        addCc(ast.email, ast.name, ast.fullName || ast.name);
      }
    });

    return list;
  }, [assigneeMember, assistantMembers, isInternal, isRsp]);

  const defaultCcEmails = useMemo(() => {
    return defaultCcRecipients.map((r) => r.email);
  }, [defaultCcRecipients]);

  const ccNicknamesText = useMemo(() => {
    if (defaultCcRecipients.length === 0) return "";
    return defaultCcRecipients.map((r) => r.nickname).join(", ");
  }, [defaultCcRecipients]);

  // Requester Name for Salutation
  const rawRequesterName = (
    brief.coordinator_nickname ||
    brief.requester_name ||
    brief.details?.reporter_name ||
    brief.details?.client_name ||
    brief.details?.coordinator_nickname ||
    brief.details?.contact_name ||
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

  // States
  const [toEmail, setToEmail] = useState(defaultToEmail);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasEditedBody, setHasEditedBody] = useState(false);

  // Generate Email Subject - Clean & Full
  const emailSubject = useMemo(() => {
    const pName = brief.project_name || "ไม่ระบุชื่องาน";
    return `[CC TEAM] เริ่มดำเนินการ: ${taskCode} - ${pName}`;
  }, [brief.project_name, taskCode]);

  // Generate Email Body - Structured Format (ข้อมูลงานชัดเจน ไม่ใส่รายละเอียดที่อ่านไม่ประติดประต่อ)
  const initialEmailBody = useMemo(() => {
    const pName = brief.project_name || "ไม่ระบุชื่องาน";
    const assigneeFullName = assigneeMember?.fullName || assigneeMember?.name || "ทีมงาน CC";
    const assigneePos = assigneeMember?.position || "ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)";
    const assigneePhone = (assigneeMember?.phone && assigneeMember.phone !== "-") ? assigneeMember.phone : "-";
    const category = brief.details?.category || brief.details?.type || brief.details?.service || brief.category || "-";
    const deadline = brief.details?.publish_date || (brief.deadline ? String(brief.deadline).split("T")[0] : "-");

    let text = `เรียน ${salutationTarget}\n\n`;
    text += `ทีม CC ขอแจ้งเริ่มดำเนินงาน "${pName}" (${taskCode}) เรียบร้อยแล้ว${politeWord}\n\n`;

    text += `📋 ข้อมูลงาน:\n`;
    text += `• ประเภทงาน: ${category}\n`;
    text += `• กำหนดส่งมอบ (Deadline): ${deadline}\n\n`;

    text += `📌 เงื่อนไขการประสานงาน:\n`;
    text += `1. ขอความกรุณาตอบกลับ (Reply) อีเมลฉบับนี้เพื่อตรวจดราฟและประสานงานตลอดโครงการ\n`;
    text += `2. การตรวจแก้สามารถปรับปรุงได้ 3 ครั้ง (Draft 1, Draft 2 และ Final)\n\n`;

    text += `ขอแสดงความนับถือ,\n`;
    text += `${assigneeFullName}\n`;
    text += `${assigneePos}\n`;
    text += `เบอร์โทร: ${assigneePhone}`;

    return text;
  }, [brief, taskCode, salutationTarget, politeWord, assigneeMember]);

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

    // 1. Copy the 100% full email body to clipboard synchronously
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(emailBody);
      }
    } catch {
      // ignore
    }

    // 2. Auto-Truncation Guard: Keep total encoded URL strictly under 6,000 bytes (Google server limit: 8,192 bytes)
    const targetTo = encodeURIComponent(toEmail.trim());
    const targetCc = encodeURIComponent(defaultCcEmails.join(','));
    const targetSubject = encodeURIComponent(emailSubject);

    let bodyToSend = emailBody;
    const baseLength = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=`.length;
    const maxSafeBodyEncoded = Math.max(500, 6000 - baseLength);

    if (encodeURIComponent(bodyToSend).length > maxSafeBodyEncoded) {
      const pName = brief.project_name || "ไม่ระบุชื่องาน";
      const assigneeFullName = assigneeMember?.fullName || assigneeMember?.name || "ทีมงาน CC";
      const assigneePos = assigneeMember?.position || "ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)";
      const assigneePhone = (assigneeMember?.phone && assigneeMember.phone !== "-") ? assigneeMember.phone : "-";
      const category = brief.details?.category || brief.details?.type || brief.details?.service || "-";
      const deadline = brief.details?.publish_date || (brief.deadline ? String(brief.deadline).split("T")[0] : "-");

      bodyToSend = `เรียน ${salutationTarget}\n\n` +
        `ทีม CC ขอแจ้งเริ่มดำเนินงาน "${pName}" (${taskCode}) เรียบร้อยแล้ว${politeWord}\n\n` +
        `📋 ข้อมูลงาน:\n` +
        `• ประเภทงาน: ${category}\n` +
        `• กำหนดส่งมอบ (Deadline): ${deadline}\n\n` +
        `📌 เงื่อนไขการประสานงาน:\n` +
        `1. ขอความกรุณาตอบกลับ (Reply) อีเมลฉบับนี้เพื่อตรวจดราฟและประสานงานตลอดโครงการ\n` +
        `2. การตรวจแก้สามารถปรับปรุงได้ 3 ครั้ง (Draft 1, Draft 2 และ Final)\n\n` +
        `ขอแสดงความนับถือ,\n` +
        `${assigneeFullName}\n` +
        `${assigneePos}\n` +
        `เบอร์โทร: ${assigneePhone}`;
    }

    const targetBody = encodeURIComponent(bodyToSend);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=${targetBody}`;
    window.open(gmailUrl, '_blank');

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
            <span className="text-xs font-semibold text-zinc-300 truncate">
              แจ้งเริ่มงาน (In Progress) • {brief.project_name || "ไม่ระบุชื่องาน"}
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
                <User size={11} className="text-orange-500" />
                <span>จาก:</span>
              </span>
              <div className="flex-1 min-w-0">
                <CustomSelect
                  value={selectedAssigneeId}
                  onChange={(val) => setSelectedAssigneeId(val)}
                  placeholder="-- เลือกผู้รับผิดชอบงาน CC (Assignee) --"
                  triggerClassName={`w-full text-xs font-semibold bg-transparent hover:bg-zinc-50 rounded px-1.5 text-left flex items-center justify-between border ${
                    !selectedAssigneeId ? "border-rose-400 bg-rose-50/40 text-rose-800" : "border-transparent text-zinc-900"
                  } h-6 transition-colors`}
                  dropdownClassName="w-full max-h-64 shadow-xl rounded-xl border border-zinc-200 p-1"
                  renderValue={(val) => {
                    const matched = assignees.find((a: any) => a.id === val);
                    if (!matched) return "-- เลือกผู้รับผิดชอบงาน CC --";
                    return (
                      <div className="flex items-center gap-1.5 truncate">
                        <Assignee3DAvatarBadge name={matched.name} size={18} showBorder />
                        <span className="truncate">{matched.name}</span>
                      </div>
                    );
                  }}
                  options={[
                    { value: "", label: "-- เลือกผู้รับผิดชอบงาน CC --" },
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
                              <Assignee3DAvatarBadge name={a.name} size={24} showBorder />
                              <div className="truncate">
                                <span className="font-bold text-xs text-zinc-900 block truncate">{a.name} ({meta.fullName || a.full_name || a.name})</span>
                                <span className="text-[10px] text-zinc-400 block truncate">{meta.position || a.position || "ทีม CC"}</span>
                              </div>
                            </div>
                            {a.unit && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${unitColor}`}>
                                {a.unit}
                              </span>
                            )}
                          </div>
                        )
                      };
                    })
                  ]}
                />
              </div>
            </div>

            {/* Row 2: ถึง (To) with inline CC badge */}
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
                      title={defaultCcRecipients.map((r) => `${r.nickname} (${r.fullName}) <${r.email}>`).join('\n')}
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

          {/* Row 4: Body (Large Gmail-style Compose Editor taking 100% maximum space) */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col min-h-0 bg-white">
            <textarea
              value={emailBody}
              onChange={(e) => {
                setEmailBody(e.target.value);
                setHasEditedBody(true);
              }}
              className="flex-1 w-full bg-zinc-50/50 hover:bg-white focus:bg-white border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl p-3.5 text-xs leading-relaxed text-zinc-800 focus:outline-none transition-all resize-none shadow-2xs font-sans custom-scrollbar"
              placeholder="เนื้อหาอีเมล..."
            />

            {/* Official CC Email Signature with 2D Avatar (Requested by User: "ตัดที่กากบาทออกและขยายรูปให้ใหญ่ขึ้น") */}
            <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200/80 flex items-center justify-between gap-3.5 shrink-0 shadow-2xs">
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
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-300 hover:border-zinc-400 rounded-full hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs text-center"
          >
            คงไว้ที่ TO-DO LIST
          </button>

          <div className="flex items-center justify-end w-full sm:w-auto">
            {/* Open and Send in Gmail (@step.cmu.ac.th) */}
            <button
              type="button"
              onClick={handleSendAndOpenGmail}
              disabled={isSending}
              className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#d93025] active:bg-[#c5221f] rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="เริ่มงานและเปิดร่างอีเมลใน Gmail (@step.cmu.ac.th)"
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
