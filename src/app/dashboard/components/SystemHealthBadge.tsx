"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Star,
  Clock,
  Sparkles,
  TrendingUp,
  ExternalLink,
  User,
  Calendar,
  Filter,
} from "lucide-react";
import {
  computeSystemIntegrityReport,
  runAutomatedDatabaseIntegrityHeal,
  getSlaPreOverdueStatus,
} from "@/utils/dataIntegrityGuard";
import { getStoredOKRSettings, fetchOKRSettingsFromSupabase } from "@/utils/okrSettings";
import { createClient } from "@/utils/supabase/client";

interface SystemHealthBadgeProps {
  briefs: any[];
  assignees: any[];
  okrSettings?: any;
  onOpenSurveyHub?: () => void;
  onOpenReachEngageModal?: () => void;
  onOpenReachEngagement?: () => void;
  onDataHealed?: () => void;
  onRefreshData?: () => void;
  onSelectBrief?: (brief: any) => void;
  onFilterDue48h?: () => void;
  isDue48hFilterActive?: boolean;
}

export default function SystemHealthBadge({
  briefs,
  assignees,
  okrSettings,
  onOpenSurveyHub,
  onOpenReachEngageModal,
  onOpenReachEngagement,
  onDataHealed,
  onRefreshData,
  onSelectBrief,
  onFilterDue48h,
  isDue48hFilterActive = false,
}: SystemHealthBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [healResultMsg, setHealResultMsg] = useState<string | null>(null);
  const [localOkrRev, setLocalOkrRev] = useState(0);

  // Sync authoritative OKR settings on mount so localStorage is never stale
  useEffect(() => {
    fetchOKRSettingsFromSupabase()
      .then(() => setLocalOkrRev((r) => r + 1))
      .catch(() => {});
  }, []);

  const effectiveOkrSettings = useMemo(
    () => okrSettings || getStoredOKRSettings(),
    [okrSettings, localOkrRev]
  );

  const report = useMemo(
    () => computeSystemIntegrityReport(briefs, assignees, effectiveOkrSettings),
    [briefs, assignees, effectiveOkrSettings]
  );

  const assigneeMap = useMemo(() => {
    const map: Record<string, string> = {};
    (assignees || []).forEach((a: any) => {
      if (a?.id) map[a.id] = a.name || "ทีม CC";
    });
    return map;
  }, [assignees]);

  // List of tasks due within 48h (and overdue tasks for quick inspection)
  const due48hTasks = useMemo(() => {
    return (briefs || [])
      .filter((b) => {
        if (!b || b.status === "purged" || b.status === "completed" || b.status === "cancelled") return false;
        const d = b.details || {};
        if (d.is_deleted || d.is_permanently_deleted || d.is_test) return false;
        const sla = getSlaPreOverdueStatus(b);
        return sla.level === "due_today" || sla.level === "due_tomorrow" || sla.level === "due_48h";
      })
      .map((b) => ({
        brief: b,
        sla: getSlaPreOverdueStatus(b),
      }))
      .sort((a, b) => (a.sla.daysLeft ?? 99) - (b.sla.daysLeft ?? 99));
  }, [briefs]);

  const handleOpenReach = onOpenReachEngageModal || onOpenReachEngagement;
  const handleHealed = onDataHealed || onRefreshData;

  const handleManualHeal = async () => {
    setIsHealing(true);
    setHealResultMsg(null);
    try {
      const supabase = createClient();
      const res = await runAutomatedDatabaseIntegrityHeal(supabase, true);
      if (res.healed > 0) {
        setHealResultMsg(`✅ ตรวจสอบ ${res.checked} งาน • ซ่อมแซมข้อมูลให้สมบูรณ์อัตโนมัติ ${res.healed} งานเรียบร้อยแล้ว!`);
        if (handleHealed) handleHealed();
      } else {
        setHealResultMsg(`✅ ตรวจสอบครบทั้ง ${res.checked} งาน • ข้อมูลทุกใบงานสมบูรณ์ 100% ตามกฎเหล็ก!`);
      }
      setTimeout(() => setHealResultMsg(null), 5000);
    } catch {
      setHealResultMsg("⚠️ ไม่สามารถเชื่อมต่อฐานข้อมูลชั่วคราว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsHealing(false);
    }
  };

  return (
    <>
      {/* Unified Minimal Segmented Capsule (h-8 matched with toolbar controls) */}
      <div className="inline-flex items-center h-8 bg-surface border border-surface-border rounded-xl p-0.5 shadow-2xs shrink-0 select-none">
        {/* Segment 1: System Integrity Shield */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`h-full px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            report.allPassed
              ? "text-foreground hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40"
              : "text-amber-700 dark:text-amber-400 hover:bg-amber-50/80"
          }`}
          title={`ระบบรับรองความสมบูรณ์ของข้อมูล: ${report.scorePercent}% (${report.validTasksCount} งาน • 12 สมาชิก) คลิกเพื่อดูรายละเอียด`}
        >
          <ShieldCheck
            size={13}
            className={report.allPassed ? "text-emerald-600 dark:text-emerald-400 shrink-0" : "text-amber-500 shrink-0"}
          />
          <span className="font-mono font-bold text-[11px]">{report.scorePercent}%</span>
        </button>

        {/* Segment 2: Pending Survey Hub */}
        {onOpenSurveyHub && report.pendingSurveyCount > 0 && (
          <>
            <div className="w-[1px] h-3.5 bg-surface-border mx-0.5 shrink-0" />
            <button
              type="button"
              onClick={onOpenSurveyHub}
              className="h-full px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-amber-50/80 dark:hover:bg-amber-950/40 transition-all cursor-pointer whitespace-nowrap"
              title={`รอผลประเมินความพึงพอใจ ${report.pendingSurveyCount} งาน (คลิกเพื่อคัดลอกลิงก์ส่งลูกค้า)`}
            >
              <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
              <span className="hidden 2xl:inline text-[11px]">รอประเมิน</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold leading-none">
                {report.pendingSurveyCount}
              </span>
            </button>
          </>
        )}

        {/* Segment 3: Clickable SLA Due within 48h Button */}
        {report.dueWithin48hCount > 0 && (
          <>
            <div className="w-[1px] h-3.5 bg-surface-border mx-0.5 shrink-0" />
            <button
              type="button"
              onClick={() => setIsDueModalOpen(true)}
              className={`h-full px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isDue48hFilterActive
                  ? "bg-orange-500 text-white font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50/80 dark:hover:bg-orange-950/40"
              }`}
              title={`งานใกล้ครบกำหนดส่งภายใน 24–48 ชม. จำนวน ${report.dueWithin48hCount} งาน (คลิกเพื่อดูรายการงาน)`}
            >
              <Clock
                size={12}
                className={isDue48hFilterActive ? "text-white shrink-0" : "text-orange-500 animate-pulse shrink-0"}
              />
              <span className="hidden 2xl:inline text-[11px]">ใกล้ส่ง</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-none ${
                  isDue48hFilterActive
                    ? "bg-white text-orange-600"
                    : "bg-orange-500 text-white"
                }`}
              >
                {report.dueWithin48hCount}
              </span>
            </button>
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: SLA PRE-OVERDUE (24-48H) INTERACTIVE TASK INSPECTOR          */}
      {/* ===================================================================== */}
      {isDueModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[125] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsDueModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-orange-50 via-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b border-orange-200/70 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        งานใกล้ครบกำหนดส่ง (ภายใน 24–48 ชั่วโมง)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-orange-100 text-orange-800 border border-orange-300">
                        {due48hTasks.length} งาน
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      คลิกที่ใบงานเพื่อเปิดดูรายละเอียด หรือเร่งติดตามก่อนเลยกำหนด (SLA Shield)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDueModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Task List Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
                {due48hTasks.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    🎉 ไม่มีงานที่ใกล้ครบกำหนดส่งภายใน 24–48 ชั่วโมง
                  </div>
                ) : (
                  due48hTasks.map(({ brief, sla }) => {
                    const taskCode =
                      brief.details?.task_code ||
                      brief.details?.project_code ||
                      `CC-${String(brief.id).slice(0, 4).toUpperCase()}`;
                    const assigneeName = brief.assignee_id
                      ? assigneeMap[brief.assignee_id] || "มอบหมายแล้ว"
                      : "ยังไม่ได้กำหนดผู้รับผิดชอบ";
                    const deadlineStr =
                      brief.deadline || brief.details?.publish_date || brief.details?.usage_date || "-";

                    return (
                      <div
                        key={brief.id}
                        onClick={() => {
                          if (onSelectBrief) {
                            setIsDueModalOpen(false);
                            onSelectBrief(brief);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/50 hover:bg-orange-50/50 dark:hover:bg-zinc-800 hover:border-orange-300 transition-all flex items-center justify-between gap-3 ${
                          onSelectBrief ? "cursor-pointer group" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
                              {taskCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[10px] font-bold uppercase">
                              {brief.unit || "CC"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                sla.level === "due_today"
                                  ? "bg-rose-600 text-white animate-pulse"
                                  : sla.level === "due_tomorrow"
                                  ? "bg-orange-500 text-white"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {sla.label}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 transition-colors">
                            {brief.project_name}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <User size={11} className="text-slate-400" />
                              <strong className="text-slate-700 dark:text-zinc-200">{assigneeName}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Calendar size={11} className="text-slate-400" />
                              <span>กำหนดส่ง: {String(deadlineStr).split("T")[0]}</span>
                            </span>
                          </div>
                        </div>

                        {onSelectBrief && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDueModalOpen(false);
                              onSelectBrief(brief);
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-orange-600 hover:text-white text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <span>เปิดใบงาน</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                {onFilterDue48h ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDueModalOpen(false);
                      onFilterDue48h();
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDue48hFilterActive
                        ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                        : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                    }`}
                  >
                    <Filter size={12} />
                    <span>
                      {isDue48hFilterActive
                        ? "แสดงงานทั้งหมดบนบอร์ด (ล้างตัวกรอง 48 ชม.)"
                        : "กรองเฉพาะงานใกล้ครบกำหนดบนบอร์ด"}
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    ระบบแจ้งเตือนล่วงหน้า 24–48 ชั่วโมง (SLA Shield)
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsDueModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ===================================================================== */}
      {/* MODAL 2: SYSTEM HEALTH & DATA INTEGRITY DIAGNOSTIC MODAL              */}
      {/* ===================================================================== */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[125] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border-b border-emerald-200/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                    <ShieldCheck size={23} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        ระบบรับรองความสมบูรณ์ของข้อมูล (Ironclad Health Check)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {report.scorePercent}% VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ตรวจสอบการเชื่อมโยง Task ↔ KR/R/TIP • การแยกฟิลด์การเงิน • ทะเบียน UUID สมาชิกแบบเรียลไทม์
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-3">
                {healResultMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <Sparkles size={15} className="text-emerald-600 shrink-0" />
                    <span>{healResultMsg}</span>
                  </div>
                )}

                {report.checks.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                      item.passed
                        ? "bg-slate-50/70 border-slate-200/90"
                        : "bg-amber-50/70 border-amber-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {item.passed ? (
                        <CheckCircle2 size={17} className="text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle size={17} className="text-amber-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.title}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.detailText}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold shrink-0 ${
                        item.passed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </div>
                ))}

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {onOpenSurveyHub && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSurveyHub();
                      }}
                      className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                          <span>ติดตามแบบประเมินความพึงพอใจ</span>
                        </div>
                        <div className="text-[11px] text-amber-800 mt-0.5">
                          ส่งมอบแล้วรอประเมิน {report.pendingSurveyCount} งาน • คลิกเพื่อคัดลอกลิงก์
                        </div>
                      </div>
                    </button>
                  )}

                  {handleOpenReach && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleOpenReach();
                      }}
                      className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-blue-600" />
                          <span>อัปเดตยอด R5 (Reach) & R6 (Engage)</span>
                        </div>
                        <div className="text-[11px] text-blue-800 mt-0.5">
                          บันทึกตัวเลขสื่อสารองค์กรของทีม Content & PR
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleManualHeal}
                  disabled={isHealing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw size={14} className={isHealing ? "animate-spin" : ""} />
                  <span>
                    {isHealing ? "กำลังตรวจสอบและซ่อมแซม..." : "⚡ ตรวจสอบและซ่อมแซมอัตโนมัติ (Self-Heal)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
