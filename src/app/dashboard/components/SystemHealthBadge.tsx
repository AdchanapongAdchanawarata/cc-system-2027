"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  computeSystemIntegrityReport,
  runAutomatedDatabaseIntegrityHeal,
} from "@/utils/dataIntegrityGuard";
import { getStoredOKRSettings } from "@/utils/okrSettings";
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
}: SystemHealthBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [healResultMsg, setHealResultMsg] = useState<string | null>(null);

  const effectiveOkrSettings = useMemo(
    () => okrSettings || getStoredOKRSettings(),
    [okrSettings]
  );

  const report = useMemo(
    () => computeSystemIntegrityReport(briefs, assignees, effectiveOkrSettings),
    [briefs, assignees, effectiveOkrSettings]
  );

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
      <div className="flex items-center gap-2 flex-wrap">
        {/* Main Live Integrity Badge */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
            report.allPassed
              ? "bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border-emerald-300/90"
              : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
          }`}
          title="คลิกเพื่อดูรายงานตรวจสอบความสมบูรณ์ของข้อมูล (Ironclad Data Integrity Guard)"
        >
          <ShieldCheck
            size={14}
            className={report.allPassed ? "text-emerald-600 shrink-0" : "text-amber-600 shrink-0"}
          />
          <span>
            Data Integrity: {report.scorePercent}% Verified
          </span>
          <span className="hidden sm:inline text-[11px] font-mono opacity-80">
            ({report.validTasksCount} งาน • 12 สมาชิก)
          </span>
        </button>

        {/* Quick Action Pill: Pending Survey Follow-up */}
        {onOpenSurveyHub && report.pendingSurveyCount > 0 && (
          <button
            type="button"
            onClick={onOpenSurveyHub}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer shadow-2xs"
            title="คลิกเพื่อเปิดศูนย์ติดตามผลประเมินความพึงพอใจ (คัดลอกลิงก์ส่ง LINE ใน 1 คลิก)"
          >
            <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
            <span>รอผลประเมิน {report.pendingSurveyCount} งาน</span>
          </button>
        )}

        {/* Quick Warning Pill: SLA Due within 48h */}
        {report.dueWithin48hCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-300 shadow-2xs"
            title="งานที่กำลังจะครบกำหนดส่งภายใน 24-48 ชั่วโมง"
          >
            <Clock size={13} className="text-orange-600 animate-pulse shrink-0" />
            <span>ใกล้ครบกำหนด (48 ชม.): {report.dueWithin48hCount} งาน</span>
          </span>
        )}
      </div>

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
