"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Star,
  Copy,
  Check,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Send,
  User,
  Sparkles,
} from "lucide-react";
import { getPendingSurveyTasks, buildSurveyFollowUpMessage } from "@/utils/dataIntegrityGuard";
import { isR3Task, isCcPmProject } from "@/utils/okrSettings";

interface SurveyFollowUpHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefs: any[];
  assignees: any[];
  onSelectBrief?: (brief: any) => void;
}

export default function SurveyFollowUpHubModal({
  isOpen,
  onClose,
  briefs,
  assignees,
  onSelectBrief,
}: SurveyFollowUpHubModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkOnlyId, setCopiedLinkOnlyId] = useState<string | null>(null);

  const assigneeMap = useMemo(() => {
    const map: Record<string, string> = {};
    (assignees || []).forEach((a: any) => {
      if (a?.id) map[a.id] = a.name || "ทีม CC";
    });
    return map;
  }, [assignees]);

  const completedTasksStats = useMemo(() => {
    const validCompleted = (briefs || []).filter((b) => {
      if (!b || b.status !== "completed") return false;
      const d = b.details || {};
      return !d.is_deleted && !d.is_permanently_deleted && !d.is_test;
    });
    const evaluated = validCompleted.filter(
      (b) => Number(b.details?.satisfaction_scores?.averagePercent || 0) > 0
    );
    const pending = getPendingSurveyTasks(briefs);
    return {
      totalCompleted: validCompleted.length,
      evaluatedCount: evaluated.length,
      pendingList: pending,
    };
  }, [briefs]);

  const filteredPending = useMemo(() => {
    return completedTasksStats.pendingList.filter((b) => {
      if (unitFilter !== "all" && (b.unit || "").toLowerCase() !== unitFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const code = (b.details?.task_code || b.details?.project_code || "").toLowerCase();
      const name = (b.project_name || "").toLowerCase();
      const requester = (b.coordinator_nickname || "").toLowerCase();
      const team = (b.decision_maker || b.details?.team || "").toLowerCase();
      const owner = (assigneeMap[b.assignee_id] || b.details?.assignee_name || "").toLowerCase();
      return (
        code.includes(q) ||
        name.includes(q) ||
        requester.includes(q) ||
        team.includes(q) ||
        owner.includes(q)
      );
    });
  }, [completedTasksStats.pendingList, unitFilter, searchQuery, assigneeMap]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleCopyFullMessage = (brief: any) => {
    const { message } = buildSurveyFollowUpMessage(brief);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      setCopiedId(brief.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleCopyUrlOnly = (brief: any) => {
    const { surveyUrl } = buildSurveyFollowUpMessage(brief);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(surveyUrl);
      setCopiedLinkOnlyId(brief.id);
      setTimeout(() => setCopiedLinkOnlyId(null), 2500);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-orange-50/70 to-white border-b border-amber-200/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Star size={22} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  ศูนย์ติดตามผลประเมินความพึงพอใจ (Survey Follow-up Hub)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                  R2 • R4 • R9 • TIP10
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                คัดลอกข้อความพร้อมลิงก์แบบประเมินส่งให้ผู้สั่งงานทาง LINE หรือ Email ได้ในคลิกเดียว เพื่อเพิ่มจำนวนฐานงานที่ประเมินจริง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Bar & Filters */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-2xs">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="text-xs text-slate-600 font-medium">ส่งมอบแล้วทั้งหมด:</span>
              <span className="text-xs font-mono font-black text-slate-900">
                {completedTasksStats.totalCompleted} งาน
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <Star size={14} className="text-emerald-600 fill-emerald-500" />
              <span className="text-xs text-emerald-800 font-medium">ประเมินแล้ว:</span>
              <span className="text-xs font-mono font-black text-emerald-700">
                {completedTasksStats.evaluatedCount} งาน
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2">
              <Clock size={14} className="text-amber-600" />
              <span className="text-xs text-amber-900 font-semibold">รอผลประเมิน:</span>
              <span className="text-xs font-mono font-black text-amber-700">
                {completedTasksStats.pendingList.length} งาน
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative w-48 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส, ชื่องาน, ผู้สั่ง..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-amber-400"
            >
              <option value="all">ทุก Unit ({completedTasksStats.pendingList.length})</option>
              <option value="creative">Creative Design</option>
              <option value="content">Content</option>
              <option value="pr">PR</option>
              <option value="internal">Internal / PM</option>
            </select>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredPending.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={22} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                ไม่มีรายการค้างประเมินในหมวดที่เลือก!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                งานที่ส่งมอบแล้วได้รับผลประเมินความพึงพอใจครบถ้วน
              </p>
            </div>
          ) : (
            filteredPending.map((brief) => {
              const code = brief.details?.task_code || brief.details?.project_code || `CC-${brief.id.slice(0, 4).toUpperCase()}`;
              const ownerName = assigneeMap[brief.assignee_id] || brief.details?.assignee_name || "ทีม CC";
              const requester = brief.coordinator_nickname || brief.details?.client_name || "-";
              const team = brief.decision_maker || brief.details?.team || "STeP";
              const isR3 = isR3Task(brief);
              const isPM = isCcPmProject(brief);
              const rBadge = isPM ? "R9 • TIP10" : isR3 ? "KR2 • R4 • TIP10" : "KR1 • R2 • TIP10";
              const completedDateStr = brief.completed_at
                ? new Date(brief.completed_at).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })
                : "-";

              return (
                <div
                  key={brief.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-amber-300 bg-white hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px]">
                        {code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isR3
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {rBadge}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <User size={11} className="text-slate-400" />
                        ผู้รับผิดชอบ: <strong className="text-slate-700">{ownerName}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        • ส่งมอบเมื่อ {completedDateStr}
                      </span>
                    </div>

                    <h4
                      onClick={() => {
                        if (onSelectBrief) {
                          onSelectBrief(brief);
                          onClose();
                        }
                      }}
                      className={`text-sm font-bold text-slate-900 truncate ${
                        onSelectBrief ? "hover:text-amber-600 cursor-pointer" : ""
                      }`}
                      title={brief.project_name}
                    >
                      {brief.project_name}
                    </h4>

                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>
                        ผู้สั่งงาน: <strong className="text-slate-800">คุณ{requester}</strong> ({team})
                      </span>
                      {brief.requester_email && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          • {brief.requester_email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyFullMessage(brief)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        copiedId === brief.id
                          ? "bg-emerald-600 text-white"
                          : "bg-[#FF6200] hover:bg-[#e55800] text-white"
                      }`}
                      title="คัดลอกข้อความติดตามแบบประเมินพร้อมลิงก์สำหรับส่งใน LINE หรือ Email"
                    >
                      {copiedId === brief.id ? (
                        <>
                          <Check size={14} />
                          <span>คัดลอกข้อความแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>คัดลอกข้อความส่ง LINE</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyUrlOnly(brief)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                        copiedLinkOnlyId === brief.id
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                      title="คัดลอกเฉพาะลิงก์แบบประเมิน"
                    >
                      {copiedLinkOnlyId === brief.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>ลิงก์</span>
                    </button>

                    <a
                      href={`/survey?briefId=${brief.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                      title="เปิดหน้าแบบประเมินของงานนี้"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            💡 ทิป: เมื่อผู้สั่งงานกดส่งแบบประเมิน คะแนนจะซิงค์เข้าตัวชี้วัด R2 / R4 / R9 และ TIP10 ของทีมและรายบุคคลโดยอัตโนมัติทันที
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
