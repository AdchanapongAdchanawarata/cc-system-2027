"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Sparkles, AlertTriangle, ArrowRight, Flame, X, 
  Calendar, Clock, CheckCircle2, History, ChevronRight
} from "lucide-react";
import { DailyMissionResult, computeDailyMission } from "@/utils/dailyMissionService";
import { Assignee3DAvatarBadge } from "./Assignee3DAvatarBadge";
import { getAuditLogs, AuditLogEntry, getCurrentActor } from "@/utils/auditLogger";
import { createClient } from "@/utils/supabase/client";
import { getMemberCustomQuote } from "@/utils/memberQuote";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";

export interface DailyMissionModalProps {
  mission?: DailyMissionResult | null;
  onAcknowledge?: () => void;
  onClose?: () => void;
  isViewMode?: boolean;
  isPersonalExclusive?: boolean;
  initialMemberName?: string;
  initialDate?: string;
  historicalLog?: AuditLogEntry | null;
  briefs?: any[];
  assignees?: any[];
}

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  roleTitle?: string;
}

const FALLBACK_MEMBERS: TeamMemberItem[] = [
  { id: "job", name: "จ๊อบ AA", email: "adchanapong@step.cmu.ac.th", roleTitle: "หัวหน้าทีม (Team Leader)" },
  { id: "wah", name: "วา WK", email: "wasita@step.cmu.ac.th", roleTitle: "ผู้ช่วยหัวหน้าทีม & ควบคุมงานออกแบบ (Design Lead)" },
  { id: "kong", name: "ก้อง IK", email: "itsara@step.cmu.ac.th", roleTitle: "พนักงานออกแบบสร้างสรรค์ (Creative Designer Lead)" },
  { id: "earn", name: "เอิร์นวอย SLR", email: "siriluk@step.cmu.ac.th", roleTitle: "Content Creator (Unit Content)" },
  { id: "joy", name: "จอย RL", email: "ratiporn@step.cmu.ac.th", roleTitle: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)" },
  { id: "pim", name: "พิม AC", email: "autcharaporn@step.cmu.ac.th", roleTitle: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)" },
  { id: "year", name: "เยียร์ LLP", email: "lalipat@step.cmu.ac.th", roleTitle: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)" },
  { id: "lookin", name: "ลูกอิน STK", email: "suthiarpa@step.cmu.ac.th", roleTitle: "Content Creator (Unit Content)" },
  { id: "nin", name: "นิน MTN", email: "matanin@step.cmu.ac.th", roleTitle: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)" },
  { id: "oat", name: "โอ๊ต CNB", email: "chonnikarn@step.cmu.ac.th", roleTitle: "PR (Unit PR)" },
  { id: "kaew", name: "แก้ว KYK", email: "kanyakorn@step.cmu.ac.th", roleTitle: "Content Creator (Unit Content)" },
  { id: "tah", name: "ต้า TTY", email: "thitiya@step.cmu.ac.th", roleTitle: "PR (Unit PR)" },
  { id: "bao", name: "อ.บ่าว ST", email: "suriyah@step.cmu.ac.th", roleTitle: "รองผู้อำนวยการ (Deputy Director) • ผู้บริหาร" },
];

function matchMember(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  const a = nameA.toLowerCase().trim();
  const b = nameB.toLowerCase().trim();
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const tokenA = a.split(" ")[0];
  const tokenB = b.split(" ")[0];
  if (tokenA.length >= 2 && (b.includes(tokenA) || a.includes(tokenB))) return true;
  if ((a.includes("slr") || a.includes("siriluk")) && (b.includes("slr") || b.includes("siriluk") || b.includes("เอิร์น") || b.includes("เอ็นจอย"))) return true;
  return false;
}

export default function DailyMissionModal({
  mission: initialMission,
  onAcknowledge,
  onClose,
  isViewMode = false,
  isPersonalExclusive,
  initialMemberName,
  initialDate,
  historicalLog,
  briefs: passedBriefs,
  assignees: passedAssignees,
}: DailyMissionModalProps) {
  const isPersonal = isPersonalExclusive !== undefined ? isPersonalExclusive : !isViewMode;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [selectedMemberName, setSelectedMemberName] = useState<string>(
    initialMemberName ||
    historicalLog?.actor_name ||
    initialMission?.memberName ||
    getCurrentActor().name ||
    "จ๊อบ AA"
  );
  const [selectedHistoryLogId, setSelectedHistoryLogId] = useState<string | null>(historicalLog?.id || null);

  const [allBriefs, setAllBriefs] = useState<any[]>(passedBriefs || []);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load team members
  useEffect(() => {
    if (passedAssignees && passedAssignees.length > 0) {
      const mapped = passedAssignees.map((a) => ({
        id: a.id || a.name,
        name: a.name,
        email: a.email || "",
        roleTitle: DEFAULT_MEMBER_METADATA[a.name]?.position || (a.unit ? `Unit ${a.unit}` : "Creative Specialist"),
      }));
      setTeamMembers(mapped);
    } else {
      setTeamMembers(FALLBACK_MEMBERS);
      const supabase = createClient();
      supabase
        .from("assignees")
        .select("id, name, email, unit")
        .eq("is_active", true)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setTeamMembers(
              data.map((a) => ({
                id: a.id,
                name: a.name,
                email: a.email || "",
                roleTitle: DEFAULT_MEMBER_METADATA[a.name]?.position || (a.unit ? `Unit ${a.unit}` : "Creative Specialist"),
              }))
            );
          }
        });
    }
  }, [passedAssignees]);

  // Load briefs if not passed
  useEffect(() => {
    if (!passedBriefs || passedBriefs.length === 0) {
      const supabase = createClient();
      supabase
        .from("briefs")
        .select("*")
        .neq("status", "purged")
        .then(({ data }) => {
          if (data) {
            setAllBriefs(data.filter((b) => !b.details?.is_deleted && !b.details?.is_permanently_deleted));
          }
        });
    }
  }, [passedBriefs]);

  // Load DAILY_MISSION_ACK audit logs
  useEffect(() => {
    setIsLoadingLogs(true);
    getAuditLogs(300)
      .then((logs) => {
        const missionAcks = (logs || []).filter((l) => l.action === "DAILY_MISSION_ACK");
        setAuditLogs(missionAcks);

        // If historicalLog was passed or initialDate was requested, select it
        if (historicalLog) {
          setSelectedHistoryLogId(historicalLog.id);
          setActiveTab("history");
        } else if (initialDate) {
          const matched = missionAcks.find((l) => {
            const dateStr = l.timestamp?.split("T")[0];
            return dateStr === initialDate && (!initialMemberName || matchMember(l.actor_name, initialMemberName));
          });
          if (matched) {
            setSelectedHistoryLogId(matched.id);
            setActiveTab("history");
          }
        }
      })
      .catch((err) => console.warn("Failed to load mission logs:", err))
      .finally(() => setIsLoadingLogs(false));
  }, [historicalLog, initialDate, initialMemberName]);

  // Current selected member object
  const currentMember = useMemo(() => {
    const found = teamMembers.find((m) => matchMember(m.name, selectedMemberName));
    return found || {
      id: "unknown",
      name: selectedMemberName,
      email: "",
      roleTitle: DEFAULT_MEMBER_METADATA[selectedMemberName]?.position || "ผู้ปฏิบัติงานทีมสร้างสรรค์และการสื่อสาร",
    };
  }, [teamMembers, selectedMemberName]);

  // Historical logs filtered for selected member
  const memberHistoryLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const actor = l.actor_name || "";
      const email = l.actor_email || "";
      return matchMember(actor, currentMember.name) || (currentMember.email && email.toLowerCase().includes(currentMember.email.toLowerCase()));
    });
  }, [auditLogs, currentMember]);

  // If activeTab is history but no log is selected, default to latest log for this member
  useEffect(() => {
    if (activeTab === "history" && !selectedHistoryLogId && memberHistoryLogs.length > 0) {
      setSelectedHistoryLogId(memberHistoryLogs[0].id);
    }
  }, [activeTab, selectedHistoryLogId, memberHistoryLogs]);

  // Selected historical log object
  const activeHistoryLog = useMemo(() => {
    if (activeTab !== "history") return null;
    return auditLogs.find((l) => l.id === selectedHistoryLogId) || memberHistoryLogs[0] || null;
  }, [activeTab, selectedHistoryLogId, auditLogs, memberHistoryLogs]);

  // Displayed Mission computation
  const displayMission: DailyMissionResult = useMemo(() => {
    // Case A: Historical Snapshot
    if (activeTab === "history" && activeHistoryLog) {
      const d = activeHistoryLog.details || {};
      const quote = getMemberCustomQuote(activeHistoryLog.actor_name) || "ร่วมมือร่วมใจเพื่อผลงานยอดเยี่ยม";
      return {
        hasMission: true,
        memberName: activeHistoryLog.actor_name || currentMember.name,
        memberEmail: activeHistoryLog.actor_email || currentMember.email,
        roleTitle: d.roleTitle || currentMember.roleTitle || "Creative Specialist",
        isDesignLead: matchMember(activeHistoryLog.actor_name, "วา") || matchMember(activeHistoryLog.actor_name, "ก้อง"),
        isGeneralLead: matchMember(activeHistoryLog.actor_name, "จ๊อบ"),
        headline: d.headline || "ภารกิจประจำวัน (บันทึกประวัติ)",
        urgentTasksCount: d.urgentTasksCount ?? (d.overdueCount ?? 0),
        unassignedCount: d.unassignedCount ?? 0,
        overdueCount: d.overdueCount ?? 0,
        inProgressCount: d.inProgressCount ?? 0,
        missions: Array.isArray(d.missions) && d.missions.length > 0 ? d.missions : ["บันทึกภารกิจตามรอบการทำงาน"],
        positiveImpact: d.positiveImpact || "💡 ผลลัพธ์เชิงบวก: การส่งมอบงานตามแผนช่วยเสริมความเสถียรภาพและคุณภาพบริการของทีม CC",
        riskImpact: d.riskImpact || "⚠️ จุดเฝ้าระวัง: ติดตามกำหนดส่งของชิ้นงานเพื่อป้องกันการสะสมงานคั่งค้าง",
        encouragementQuote: quote,
        suggestedActionLabel: "ดูรายละเอียดภารกิจย้อนหลัง",
        timestamp: activeHistoryLog.timestamp,
      };
    }

    // Case B: Realtime Live Calculation
    if (initialMission && matchMember(initialMission.memberName, currentMember.name)) {
      return initialMission;
    }

    return computeDailyMission(allBriefs, currentMember.name, currentMember.email, teamMembers);
  }, [activeTab, activeHistoryLog, currentMember, initialMission, allBriefs, teamMembers]);

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า";
    if (hour < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  }, []);

  const handleConfirm = () => {
    setIsSubmitting(true);
    if (onAcknowledge) {
      onAcknowledge();
    } else if (onClose) {
      onClose();
    }
  };

  const formattedDate = useMemo(() => {
    const rawDate = activeTab === "history" && activeHistoryLog ? new Date(activeHistoryLog.timestamp) : new Date();
    return rawDate.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [activeTab, activeHistoryLog]);

  const formattedTime = useMemo(() => {
    if (activeTab === "history" && activeHistoryLog?.timestamp) {
      const d = new Date(activeHistoryLog.timestamp);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
    }
    return null;
  }, [activeTab, activeHistoryLog]);

  const cleanPositiveImpact = (displayMission.positiveImpact || "")
    .replace("💡 ผลลัพธ์เชิงบวก: ", "")
    .trim();

  const cleanRiskImpact = (displayMission.riskImpact || "")
    .replace("⚠️ ความเสี่ยงหากละเลย: ", "")
    .replace("⚠️ ความเสี่ยงหากล่าช้า: ", "")
    .replace("⚠️ จุดเฝ้าระวัง: ", "")
    .trim();

  const rawQuote = (displayMission.encouragementQuote || "").trim();
  const cleanQuote = rawQuote.replace(/^["'“\s]+|["'”\s]+$/g, "").trim();

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white text-neutral-900 border border-neutral-200/90 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.06)] max-w-2xl w-full max-h-[94vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150 font-sans custom-scrollbar">
        
        {/* Dieter Rams Header: High Contrast, Clean Grid */}
        <div className="p-5 sm:p-7 pb-4 border-b border-neutral-100">
          
          {/* Top Category Tag & Controls */}
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              {isPersonal ? (
                <>
                  <span className="text-[10px] sm:text-[11px] font-black tracking-[0.18em] text-[#FF6200] uppercase font-mono flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#FF6200] animate-pulse" />
                    PERSONAL DAILY BRIEFING
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-700 font-bold font-mono">
                    ⭐ เฉพาะสำหรับคุณ
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase font-mono">
                    MISSION BRIEFING • DAILY FOCUS
                  </span>
                  {activeTab === "history" ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold font-mono">
                      HISTORICAL SNAPSHOT
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold font-mono">
                      LIVE REALTIME
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Close Button (Always visible in viewMode or when onClose provided) */}
            {(onClose || isViewMode) && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Member Selector Bar (ดูภารกิจของแต่ละคน - เฉพาะ View/Admin Mode) */}
          {!isPersonal && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 mb-1.5 uppercase font-mono tracking-wider">
                <span>เลือกผู้ปฏิบัติงานในทีม (TEAM MEMBER)</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {teamMembers.length} สมาชิก
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {teamMembers.map((m) => {
                  const isSelected = matchMember(m.name, currentMember.name);
                  return (
                    <button
                      key={m.id || m.name}
                      type="button"
                      onClick={() => {
                        setSelectedMemberName(m.name);
                        setSelectedHistoryLogId(null);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-w-0 ${
                        isSelected
                          ? "bg-neutral-900 text-white shadow-xs"
                          : "bg-neutral-100/80 hover:bg-neutral-200/70 text-neutral-700 border border-neutral-200/60"
                      }`}
                      title={m.name}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200 shrink-0 pointer-events-none">
                        <Assignee3DAvatarBadge
                          name={m.name}
                          size={20}
                          showName={false}
                          showBorder={false}
                          disableHoverPreview={true}
                        />
                      </div>
                      <span className="truncate min-w-0 text-left">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline & Snapshot Switcher: Current vs History (เฉพาะ View/Admin Mode) */}
          {!isPersonal && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 mb-4">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("current")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "current"
                      ? "bg-white text-neutral-900 shadow-xs border border-neutral-200"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <Flame size={13} className="text-[#FF6200]" />
                  <span>ภารกิจปัจจุบัน (วันนี้)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("history");
                    if (!selectedHistoryLogId && memberHistoryLogs.length > 0) {
                      setSelectedHistoryLogId(memberHistoryLogs[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "history"
                      ? "bg-white text-indigo-900 shadow-xs border border-neutral-200"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <History size={13} className="text-indigo-600" />
                  <span>ประวัติย้อนหลัง ({memberHistoryLogs.length})</span>
                </button>
              </div>

              {/* History Date Dropdown */}
              {activeTab === "history" && memberHistoryLogs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400 font-mono">รอบบันทึก:</span>
                  <select
                    value={activeHistoryLog?.id || ""}
                    onChange={(e) => setSelectedHistoryLogId(e.target.value)}
                    className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:border-neutral-900"
                  >
                    {memberHistoryLogs.map((log) => {
                      const d = new Date(log.timestamp);
                      const label = `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} • ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;
                      return (
                        <option key={log.id} value={log.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Historical notice banner */}
          {!isPersonal && activeTab === "history" && (
            <div className="mb-4 p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                <span>
                  {memberHistoryLogs.length > 0
                    ? `บันทึกเมื่อ ${formattedDate} เวลา ${formattedTime || ""} (รับทราบโดย ${activeHistoryLog?.actor_name || currentMember.name})`
                    : `ยังไม่มีประวัติการรับทราบภารกิจของ ${currentMember.name} ในระบบ`}
                </span>
              </div>
              {memberHistoryLogs.length === 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("current")}
                  className="text-[11px] font-bold text-indigo-700 underline cursor-pointer"
                >
                  ดูภารกิจปัจจุบัน
                </button>
              )}
            </div>
          )}

          {/* User Profile Row: Enlarged Avatar & Bold Typography */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className={`relative rounded-2xl overflow-hidden shrink-0 flex items-center justify-center transition-all ${
              isPersonal 
                ? "w-18 h-18 sm:w-22 sm:h-22 bg-gradient-to-tr from-amber-50 to-orange-100 ring-4 ring-[#FF6200]/30 shadow-md"
                : "w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 ring-2 ring-neutral-200/90 shadow-sm"
            }`}>
              <Assignee3DAvatarBadge
                name={displayMission.memberName}
                size={isPersonal ? 88 : 80}
                showName={false}
                showBorder={false}
                disableHoverPreview={true}
                title=""
                className="w-full h-full flex items-center justify-center pointer-events-none"
              />
            </div>

            <div className="min-w-0 flex-1">
              {isPersonal && (
                <div className="text-xs font-bold text-[#FF6200] flex items-center gap-1.5 mb-1">
                  <span>{greetingTime}, คุณ{displayMission.memberName} 👋 • ยินดีต้อนรับสู่การเริ่มงานวันใหม่</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight truncate">
                  {displayMission.memberName}
                </h1>
                {isPersonal ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#FF6200] font-bold font-mono">
                    FOCUS TODAY
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 font-semibold font-mono">
                    {activeTab === "history" ? "ARCHIVED" : "ACTIVE"}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-neutral-500 mt-1 truncate">
                {displayMission.roleTitle}
              </p>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500 font-mono flex-wrap">
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-800">
                  <Flame size={13} className="text-[#FF6200]" />
                  {displayMission.urgentTasksCount > 0 ? `${displayMission.urgentTasksCount} งานที่ต้องโฟกัสเร่งด่วน` : "ภารกิจพร้อมลุย"}
                </span>
                <span>•</span>
                <span className="font-sans text-neutral-500">
                  {formattedDate} {formattedTime ? `(${formattedTime})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Workload Quick-Bar (เฉพาะโหมดส่วนตัว) */}
          {isPersonal && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/70 text-center">
                <span className="block text-[10px] font-bold text-orange-800 uppercase font-mono">ส่งมอบวันนี้</span>
                <span className="text-lg font-black text-orange-950 font-mono">
                  {displayMission.dueTodayCount ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-center">
                <span className="block text-[10px] font-bold text-blue-800 uppercase font-mono">กำลังดำเนินการ</span>
                <span className="text-lg font-black text-blue-950 font-mono">
                  {displayMission.inProgressCount ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-center">
                <span className="block text-[10px] font-bold text-neutral-600 uppercase font-mono">คิวรอเริ่ม (To-Do)</span>
                <span className="text-lg font-black text-neutral-900 font-mono">
                  {displayMission.todoCount ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-center">
                <span className="block text-[10px] font-bold text-rose-800 uppercase font-mono">เกินกำหนด</span>
                <span className="text-lg font-black text-rose-950 font-mono">
                  {displayMission.overdueCount ?? 0}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5">
          
          {/* Energy & Encouragement Quote */}
          {cleanQuote && (
            <div className="text-center py-1 px-4">
              <p className="text-xs sm:text-sm font-bold text-neutral-800 leading-relaxed tracking-tight">
                “{cleanQuote}”
              </p>
            </div>
          )}

          {/* Mission Section */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between">
              <span>{activeTab === "history" ? "ภารกิจหลักที่บันทึกไว้ในรอบนี้" : "ภารกิจหลักที่ต้องขับเคลื่อนวันนี้"}</span>
              <span className="text-[11px] font-mono font-medium text-neutral-400">
                {displayMission.missions.length} ITEMS
              </span>
            </div>

            <div className="space-y-2">
              {displayMission.missions.map((m, idx) => (
                <div 
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-xl bg-neutral-50/80 hover:bg-neutral-100/60 border border-neutral-200/70 transition-colors flex items-start gap-3 text-xs sm:text-[13px] text-neutral-800 font-medium leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-md bg-neutral-200/80 text-neutral-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    {m}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Impact Cards: Pure Functional Dieter Rams Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Positive Impact */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-neutral-900 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles size={14} className="text-emerald-600" />
                <span>ผลเชิงบวกต่อตัวชี้วัด (KR/R)</span>
              </div>
              <p className="text-xs text-emerald-950/85 leading-relaxed font-normal">
                {cleanPositiveImpact}
              </p>
            </div>

            {/* Risk / Watchout */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-neutral-900 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle size={14} className="text-rose-600" />
                <span>จุดเฝ้าระวัง &amp; ความเสี่ยง</span>
              </div>
              <p className="text-xs text-rose-950/85 leading-relaxed font-normal">
                {cleanRiskImpact}
              </p>
            </div>

          </div>

        </div>

        {/* Action Footer */}
        <div className="p-5 sm:p-7 pt-1 flex items-center gap-3">
          {isPersonal ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6200] to-[#EE5500] hover:from-[#EE5500] hover:to-[#D94400] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-[0_8px_20px_rgba(255,98,0,0.28)] hover:shadow-[0_10px_25px_rgba(255,98,0,0.38)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 select-none"
            >
              <span>🚀 รับทราบและเริ่มภารกิจของฉันวันนี้</span>
              <ArrowRight size={18} />
            </button>
          ) : isViewMode || onClose ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-5 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-[0.99] text-neutral-800 font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <span>ปิดหน้าต่าง</span>
              </button>
              {onAcknowledge && activeTab === "current" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-5 rounded-xl bg-[#FF6200] hover:bg-[#EE5500] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-[0_4px_14px_rgba(255,98,0,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
                >
                  <span>รับทราบภารกิจ</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FF6200] hover:bg-[#EE5500] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-[0_4px_14px_rgba(255,98,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,98,0,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
            >
              <span>รับทราบภารกิจ</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
