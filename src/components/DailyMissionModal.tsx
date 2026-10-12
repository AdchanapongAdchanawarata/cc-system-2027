"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Sparkles, AlertTriangle, ArrowRight, X
} from "lucide-react";
import { DailyMissionResult } from "@/utils/dailyMissionService";
import { Assignee3DAvatarBadge } from "./Assignee3DAvatarBadge";

interface DailyMissionModalProps {
  mission: DailyMissionResult;
  onAcknowledge: () => void;
  onClose?: () => void;
}

export default function DailyMissionModal({
  mission,
  onAcknowledge,
  onClose,
}: DailyMissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    onAcknowledge();
  };

  const formattedDate = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const cleanPositiveImpact = mission.positiveImpact
    .replace("💡 ผลลัพธ์เชิงบวก: ", "")
    .trim();

  const cleanRiskImpact = mission.riskImpact
    .replace("⚠️ ความเสี่ยงหากละเลย: ", "")
    .replace("⚠️ ความเสี่ยงหากล่าช้า: ", "")
    .trim();

  const cleanQuote = mission.encouragementQuote
    .replace(/^[🌟🚀💪🎯✨]\s*/, "")
    .trim();

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-slate-900/95 text-slate-100 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="shrink-0 ring-1 ring-white/10 rounded-full p-0.5 bg-slate-800">
              <Assignee3DAvatarBadge
                name={mission.memberName}
                size={52}
                showName={false}
                showBorder={false}
                disableHoverPreview={true}
                className="rounded-full overflow-hidden"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {mission.memberName}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  Mission
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {mission.roleTitle}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                {formattedDate} • {mission.urgentTasksCount > 0 ? `${mission.urgentTasksCount} งานที่ต้องโฟกัส` : "พร้อมเริ่มงาน"}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิด"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Mission List */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ภารกิจสำคัญวันนี้
            </div>
            <div className="space-y-2">
              {mission.missions.map((m, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="flex-1">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Minimal 2-Column Impact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
              <div className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>ผลเชิงบวกต่อตัวชี้วัด</span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed font-normal">
                {cleanPositiveImpact}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs space-y-1">
              <div className="font-semibold text-rose-400 text-[11px] flex items-center gap-1.5">
                <AlertTriangle size={12} />
                <span>ความเสี่ยงที่ต้องระวัง</span>
              </div>
              <p className="text-[11px] text-rose-200/80 leading-relaxed font-normal">
                {cleanRiskImpact}
              </p>
            </div>
          </div>

          {/* Encouragement Quote */}
          {cleanQuote && (
            <div className="pt-1 text-center">
              <p className="text-[11.5px] text-slate-400 italic">
                "{cleanQuote}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 pt-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>รับทราบภารกิจและเริ่มงาน</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
