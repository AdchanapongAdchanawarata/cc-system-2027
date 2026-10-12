"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Sparkles, AlertTriangle, ArrowRight, X, Flame
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
    month: "long",
  });

  const cleanPositiveImpact = mission.positiveImpact
    .replace("💡 ผลลัพธ์เชิงบวก: ", "")
    .trim();

  const cleanRiskImpact = mission.riskImpact
    .replace("⚠️ ความเสี่ยงหากละเลย: ", "")
    .replace("⚠️ ความเสี่ยงหากล่าช้า: ", "")
    .trim();

  const cleanQuote = (mission.encouragementQuote || "")
    .replace(/^["'“\s]+|["'”\s]+$/g, "")
    .trim();

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white text-neutral-900 border border-neutral-200/90 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.06)] max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150 font-sans">
        
        {/* Dieter Rams Header: High Contrast, Clean Grid */}
        <div className="p-6 sm:p-8 pb-5 border-b border-neutral-100">
          
          {/* Top Category Tag & Close Button */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase font-mono">
              MISSION BRIEFING • DAILY FOCUS
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-800 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                title="ปิด"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* User Profile Row: Enlarged Avatar & Bold Typography */}
          <div className="flex items-center gap-5">
            {/* Enlarged Avatar: 80px */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 ring-2 ring-neutral-200/90 shadow-sm flex items-center justify-center shrink-0">
              <Assignee3DAvatarBadge
                name={mission.memberName}
                size={80}
                showName={false}
                showBorder={false}
                disableHoverPreview={true}
                className="w-full h-full flex items-center justify-center"
              />
            </div>

            {/* Clear, Prominent Typography */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight truncate">
                  {mission.memberName}
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 font-semibold font-mono">
                  ACTIVE
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-neutral-500 mt-1 truncate">
                {mission.roleTitle}
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 font-mono">
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-800">
                  <Flame size={13} className="text-[#FF6200]" />
                  {mission.urgentTasksCount > 0 ? `${mission.urgentTasksCount} งานที่ต้องโฟกัส` : "คิวงานพร้อมเริ่ม"}
                </span>
                <span>•</span>
                <span className="font-sans text-neutral-500">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Energy & Encouragement Quote: Borderless, Large, Multiline, Energizing */}
          {cleanQuote && (
            <div className="text-left -mt-1 pb-1">
              <p className="text-[15px] sm:text-base font-bold text-neutral-800 leading-relaxed whitespace-pre-line tracking-tight">
                {cleanQuote}
              </p>
            </div>
          )}

          {/* Mission Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between">
              <span>ภารกิจหลักที่ต้องขับเคลื่อนวันนี้</span>
              <span className="text-[11px] font-mono font-medium text-neutral-400">
                {mission.missions.length} ITEMS
              </span>
            </div>

            <div className="space-y-2.5">
              {mission.missions.map((m, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-xl bg-neutral-50/80 hover:bg-neutral-100/60 border border-neutral-200/70 transition-colors flex items-start gap-3.5 text-xs sm:text-[13px] text-neutral-800 font-medium leading-relaxed"
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
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-neutral-900 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles size={14} className="text-emerald-600" />
                <span>ผลเชิงบวกต่อตัวชี้วัด (KR/R)</span>
              </div>
              <p className="text-xs text-emerald-950/85 leading-relaxed font-normal">
                {cleanPositiveImpact}
              </p>
            </div>

            {/* Risk / Watchout */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-neutral-900 space-y-1.5">
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

        {/* Dieter Rams Iconic Action Footer */}
        <div className="p-6 sm:p-8 pt-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 rounded-xl bg-[#FF6200] hover:bg-[#EE5500] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-[0_4px_14px_rgba(255,98,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,98,0,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
          >
            <span>รับทราบภารกิจและเริ่มงาน</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
